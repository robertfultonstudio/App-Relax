import type { ConsumerAudioWork } from "@/domain/audio/consumerTypes";
import { dbToLinear } from "@/domain/audio/consumerTypes";
import { transitionGains } from "@/domain/sessions/equalPower";
import type {
  AdaptiveSessionProgram,
  AdaptiveSessionSegment,
  NatureMixLevel,
} from "@/domain/sessions/types";
import type {
  AdaptiveAuditionOptions,
  TransitionAudition,
} from "@/domain/sessions/workbench";
import { positionMediaElement } from "./positionMediaElement";
import {
  ClockedWavSource,
  type AudioElementPort,
  type PcmWorkReaderFactory,
} from "./ClockedWavSource";
import {
  awaitWebAudioSource,
  resolveLocalPreviewWork,
  type WebAudioSourceLease,
  type WebAudioWorkSource,
} from "./WebAudioSourceResolver";

const SILENT_GAIN = 0.0001;
const MEDIA_DECK_COUNT = 4;
const USER_GESTURE_CONFIRMATION_TIMEOUT_MS = 10_000;
// Future PCM decks are already bounded and preloaded. Give their final seek
// and buffer prime a deterministic deadline, while keeping the audible start
// pinned to the exact session clock below.
const CLOCKED_TRANSITION_PREPARE_LEAD_SECONDS = 1;
const NATURE_FAMILY_FADE_SECONDS = 4;
const NATURE_FAMILY_CLOCK_LEAD_SECONDS = 2;

class StalePreparationError extends Error {
  constructor() {
    super("Adaptive media preparation was superseded.");
    this.name = "StalePreparationError";
  }
}

function isStalePreparation(error: unknown): boolean {
  return error instanceof StalePreparationError;
}

interface MediaDeck {
  clockedPcm: boolean;
  element: AudioElementPort;
  generation: number;
  segmentIndex: number | null;
  source: AudioNode;
}

interface SegmentRuntime {
  deck: MediaDeck;
  element: AudioElementPort;
  gain: GainNode;
  auditionGain: GainNode;
  source: AudioNode;
}

interface PreparedSegment {
  segment: AdaptiveSessionSegment;
  runtime: SegmentRuntime;
  baseGain: number;
}

interface AdaptiveWebPlaybackHandlers {
  ended: () => void;
  error: (error: Error) => void;
}

function resetRuntime(runtime: SegmentRuntime): void {
  runtime.element.pause();
  runtime.source.disconnect();
  runtime.gain.disconnect();
  runtime.auditionGain.disconnect();
}

function multiplyCurve(curve: Float32Array, multiplier: number): Float32Array {
  return Float32Array.from(curve, (value) =>
    Math.max(SILENT_GAIN, value * multiplier),
  );
}

export class AdaptiveWebPlayback {
  private program: AdaptiveSessionProgram | null = null;
  private readonly urls = new Map<number, string>();
  private readonly sourceLeases = new Map<string, WebAudioSourceLease>();
  private sourceLoadController: AbortController | null = null;
  private sourceLoadGeneration = 0;
  private disposed = false;
  private readonly preloaded = new Map<number, MediaDeck>();
  private readonly preloadPromises = new Map<number, Promise<void>>();
  private readonly preloadCancels = new Map<number, () => void>();
  private readonly positionAborts = new Map<number, AbortController>();
  private readonly runtimes = new Map<number, SegmentRuntime>();
  private readonly decks = new Set<MediaDeck>();
  private availableDecks: MediaDeck[] = [];
  private deckGeneration = 0;
  private prepared: PreparedSegment[] = [];
  private preparedPositionSeconds: number | null = null;
  private gesturePrimedPositionSeconds: number | null = null;
  private gesturePrimedGeneration: number | null = null;
  private userGesturePromise: Promise<void> | null = null;
  private userGestureGeneration: number | null = null;
  private userGesturePositionSeconds: number | null = null;
  private gestureAbort: AbortController | null = null;
  private timers = new Set<ReturnType<typeof setTimeout>>();
  private natureTimers = new Set<ReturnType<typeof setTimeout>>();
  private boundaryTimer: ReturnType<typeof setTimeout> | null = null;
  private sessionBus: GainNode | null = null;
  private primaryBus: GainNode | null = null;
  private natureBus: GainNode | null = null;
  private sessionOffsetSeconds = 0;
  private startedAtContextSeconds = 0;
  private playing = false;
  private volume = 0.8;
  private natureLevel: NatureMixLevel = 0;
  private audition: TransitionAudition | null = null;
  private auditionLoop = true;
  private failureReported = false;
  private pendingStarts = 0;
  private startAbortRevision = 0;
  private awaitingInitialRunway = false;
  private natureChangeController: AbortController | null = null;
  private natureScheduleRevision = 0;
  private stagedNature: {
    program: AdaptiveSessionProgram;
    segment: AdaptiveSessionSegment;
  } | null = null;

  constructor(
    private readonly context: AudioContext,
    private readonly destination: AudioNode,
    private readonly handlers: AdaptiveWebPlaybackHandlers,
    private readonly resolveWorkSource: (
      work: ConsumerAudioWork,
      signal?: AbortSignal,
    ) =>
      | WebAudioWorkSource
      | Promise<WebAudioWorkSource> = resolveLocalPreviewWork,
    private readonly clockedWav = false,
    private readonly pcmReaderFactory?: PcmWorkReaderFactory,
  ) {}

  async load(program: AdaptiveSessionProgram): Promise<void> {
    if (this.disposed) throw new StalePreparationError();
    const generation = ++this.sourceLoadGeneration;
    const stopping = this.stop();
    const controller = new AbortController();
    this.sourceLoadController = controller;
    try {
      await stopping;
      if (
        generation !== this.sourceLoadGeneration ||
        this.disposed ||
        controller.signal.aborted
      )
        throw new StalePreparationError();
      this.destroyDeckPool();
      await this.releaseSourceLeases();
      if (
        generation !== this.sourceLoadGeneration ||
        this.disposed ||
        controller.signal.aborted
      )
        throw new StalePreparationError();
      this.program = program;
      this.natureLevel = program.plan.natureMix?.initialLevel ?? 0;
      this.urls.clear();
      // URL leases are not decoded buffers. Long sessions can vary the nature
      // recording about every ten minutes while retaining the four-deck pool.
      const completePractice =
        program.plan.endingStrategy === "source-file-boundary-review-only" ||
        program.plan.endingStrategy === "extended-loop-boundary-review-only";
      const mix = program.plan.natureMix;
      const natureLimit = Math.max(
        2,
        Math.ceil(program.plan.requestedDurationMinutes / 10),
      );
      const musicLimit = completePractice ? 8 : 4;
      if (
        mix &&
        (natureLimit > 9 ||
          mix.musicWorkIds.length > musicLimit ||
          mix.natureWorkIds.length > natureLimit)
      )
        throw new Error(
          "The session exceeds its bounded music and nature catalogue.",
        );
      const maximumFiles = mix ? musicLimit + natureLimit : 8;
      if (
        new Set(program.plan.segments.map(({ workId }) => workId)).size >
        maximumFiles
      )
        throw new Error(
          `An adaptive program cannot acquire more than ${maximumFiles} unique audio files.`,
        );
      for (const segment of program.plan.segments) {
        if (
          segment.lane === "nature" &&
          program.plan.natureMix?.enabled === false
        )
          continue;
        const work = program.works.find(({ id }) => id === segment.workId);
        if (!work || work.sourceKind !== "file") {
          throw new Error(`Session source ${segment.workId} is unavailable.`);
        }
        let lease = this.sourceLeases.get(work.id);
        if (!lease) {
          const acquired = await awaitWebAudioSource(
            () => this.resolveWorkSource(work, controller.signal),
            controller.signal,
          );
          if (
            generation !== this.sourceLoadGeneration ||
            this.disposed ||
            controller.signal.aborted
          ) {
            await acquired?.release();
            throw new StalePreparationError();
          }
          if (acquired) {
            lease = acquired;
            this.sourceLeases.set(work.id, lease);
          }
        }
        if (!lease) {
          throw new Error(
            `${work.title} needs a verified local or downloaded file.`,
          );
        }
        this.urls.set(segment.index, lease.uri);
      }
      await this.prepareForUserGesture(0);
      if (
        generation !== this.sourceLoadGeneration ||
        this.disposed ||
        controller.signal.aborted
      )
        throw new StalePreparationError();
    } catch (error) {
      if (generation === this.sourceLoadGeneration) {
        this.program = null;
        this.urls.clear();
        this.destroyDeckPool();
        this.disconnectBuses();
        await this.releaseSourceLeases();
      }
      throw error;
    } finally {
      if (this.sourceLoadController === controller)
        this.sourceLoadController = null;
    }
  }

  activateUserGesture(): void {
    if (!this.playing && this.sessionBus) {
      this.sessionBus.gain.cancelScheduledValues(this.context.currentTime);
      this.sessionBus.gain.value = 0;
    }
    this.gestureAbort?.abort();
    const gestureAbort = new AbortController();
    this.gestureAbort = gestureAbort;
    const target = this.sessionOffsetSeconds;
    const activationGeneration = this.deckGeneration;
    const activeIndexes = new Set(
      this.program?.plan.segments
        .filter(
          (segment) =>
            target >= segment.startSeconds && target < segment.endSeconds,
        )
        .map(({ index }) => index) ?? [],
    );
    const activationAttempts: Promise<unknown>[] = [this.context.resume()];
    for (const deck of this.decks) {
      if (!deck.element.src) continue;
      // AudioContext resume is the gesture for PCM sources. Starting them here
      // would establish a second, earlier clock before the session is ready.
      if (deck.element.playAt) continue;
      const generation = deck.generation;
      const segmentIndex = deck.segmentIndex;
      const attempt = deck.element.play();
      if (deck.segmentIndex !== null && activeIndexes.has(deck.segmentIndex)) {
        activationAttempts.push(attempt);
      } else {
        // Safari may reject a Play promise if Pause interrupts it before the
        // element has actually started. Confirm the direct-gesture Play first,
        // then pause the disconnected future deck so it can be reused later.
        activationAttempts.push(
          attempt.then(() => {
            if (
              deck.generation === generation &&
              deck.segmentIndex === segmentIndex
            ) {
              deck.element.pause();
            }
          }),
        );
      }
    }
    let timeout: ReturnType<typeof setTimeout>;
    const confirmation = Promise.all(activationAttempts).then(() => undefined);
    const timedOut = new Promise<void>((_resolve, reject) => {
      gestureAbort.signal.addEventListener(
        "abort",
        () => reject(new StalePreparationError()),
        { once: true },
      );
      timeout = setTimeout(() => {
        for (const deck of this.decks) {
          if (deck.generation === activationGeneration) deck.element.pause();
        }
        reject(
          new Error(
            "The browser did not confirm session audio within 10 seconds.",
          ),
        );
      }, USER_GESTURE_CONFIRMATION_TIMEOUT_MS);
    });
    const activation = Promise.race([confirmation, timedOut]).finally(() => {
      clearTimeout(timeout);
      if (this.gestureAbort === gestureAbort) this.gestureAbort = null;
    });
    void activation.catch(() => undefined);
    this.userGesturePromise = activation;
    this.userGestureGeneration = activationGeneration;
    this.userGesturePositionSeconds = target;
  }

  async prepareForUserGesture(positionSeconds: number): Promise<void> {
    const program = this.program;
    if (!program) throw new Error("No adaptive session is loaded.");
    const target = Math.min(
      program.plan.totalDurationSeconds - 0.001,
      Math.max(0, positionSeconds),
    );
    this.clearTimers();
    this.playing = false;
    this.resetDeckAssignments();
    this.disconnectBuses();
    if (this.decks.size === 0) this.createDeckPool();
    this.createSilentBuses();
    this.sessionOffsetSeconds = target;
    const generation = this.deckGeneration;

    const candidates = this.preparationCandidates(target);
    try {
      // HTML media still needs every deck unlocked in the direct gesture.
      // PCM future sources are primed after Start and must not hold up Ready.
      const preloadResults = await Promise.allSettled(
        candidates
          .filter(
            ({ index, startSeconds }) =>
              !this.usesClockedPcm(index) ||
              (startSeconds > target && startSeconds <= target + 8),
          )
          .map(({ index }) => this.prime(index, generation)),
      );
      const preloadFailure = preloadResults.find(
        (result): result is PromiseRejectedResult =>
          result.status === "rejected",
      );
      if (preloadFailure) throw preloadFailure.reason;

      const initial = candidates.filter(
        (segment) =>
          target >= segment.startSeconds && target < segment.endSeconds,
      );
      const preparationResults = await Promise.allSettled(
        initial.map((segment) => this.prepare(segment, target, generation)),
      );
      const preparationFailure = preparationResults.find(
        (result): result is PromiseRejectedResult =>
          result.status === "rejected",
      );
      if (preparationFailure) throw preparationFailure.reason;
      this.prepared = preparationResults.flatMap((result) =>
        result.status === "fulfilled" ? [result.value] : [],
      );
      this.preparedPositionSeconds = target;
    } catch (error) {
      // A partially prepared file must never remain connected or keep a
      // metadata timeout alive after another file failed.
      if (generation !== this.deckGeneration) {
        throw new StalePreparationError();
      }
      this.resetDeckAssignments();
      this.disconnectBuses();
      throw error;
    }
  }

  async start(
    program: AdaptiveSessionProgram,
    volume: number,
    positionSeconds = 0,
  ): Promise<void> {
    if (this.program?.plan.id !== program.plan.id) await this.load(program);
    this.failureReported = false;
    this.volume = Math.min(1, Math.max(0, volume));
    await this.context.resume();
    await this.startFrom(this.normalizePosition(program, positionSeconds));
  }

  async pause(): Promise<void> {
    this.natureChangeController?.abort();
    ++this.startAbortRevision;
    if (!this.playing) {
      if (this.pendingStarts > 0) this.resetDeckAssignments();
      return;
    }
    this.sessionOffsetSeconds = this.positionSeconds();
    this.playing = false;
    this.clearTimers();
    this.sessionBus?.gain.cancelScheduledValues(this.context.currentTime);
    if (this.sessionBus) this.sessionBus.gain.value = 0;
    for (const { element } of this.runtimes.values()) element.pause();
    for (const { element } of this.preloaded.values()) element.pause();
    const pausedRuntimes = [...this.runtimes.entries()];
    this.prepared = pausedRuntimes.flatMap(([segmentIndex, runtime]) => {
      const segment = this.program?.plan.segments.find(
        ({ index }) => index === segmentIndex,
      );
      const work = this.program?.works.find(({ id }) => id === segment?.workId);
      return segment &&
        work &&
        this.sessionOffsetSeconds >= segment.startSeconds &&
        this.sessionOffsetSeconds < segment.endSeconds
        ? [
            {
              segment,
              runtime,
              baseGain: dbToLinear(
                work.playbackGainDb + segment.playbackTrimDb,
              ),
            },
          ]
        : [];
    });
    const resumable = new Set(this.prepared.map(({ runtime }) => runtime));
    for (const [segmentIndex, runtime] of pausedRuntimes)
      if (!resumable.has(runtime)) this.release(segmentIndex, runtime);
    this.preparedPositionSeconds = this.sessionOffsetSeconds;
  }

  async resume(): Promise<void> {
    if (!this.program || this.playing) return;
    await this.context.resume();
    await this.startFrom(this.sessionOffsetSeconds);
  }

  async seek(positionSeconds: number, clearAudition = false): Promise<void> {
    this.natureChangeController?.abort();
    if (!this.program) throw new Error("No adaptive session is loaded.");
    const target = this.normalizePosition(this.program, positionSeconds);
    if (clearAudition) this.audition = null;
    const restart = this.playing;
    this.playing = false;
    this.clearTimers();
    this.sessionOffsetSeconds = target;
    if (restart) {
      try {
        await this.startFrom(target);
      } catch (error) {
        await this.stop();
        throw error;
      }
    } else {
      await this.prepareForUserGesture(target);
    }
  }

  async configureAudition(
    audition: TransitionAudition | null,
    options?: AdaptiveAuditionOptions,
  ): Promise<void> {
    if (audition === null && this.audition === null) return;
    this.audition = audition;
    this.auditionLoop = options?.loop ?? true;
    if (!this.program) return;
    if (audition === null || options?.preservePosition) {
      // A/B listening is a gain change, not a transport operation. Keep the
      // clock, prepared sources and future transition envelopes untouched.
      for (const [index, runtime] of this.runtimes) {
        this.rampBus(
          runtime.auditionGain,
          this.isAuditionMuted(index) ? 0 : 1,
          20,
        );
      }
      this.scheduleBoundary();
      return;
    }
    const restart = this.playing;
    const position = audition?.startSeconds ?? this.positionSeconds();
    this.playing = false;
    this.clearTimers();
    this.clearRuntimes();
    this.sessionOffsetSeconds = position;
    if (restart) await this.startFrom(position);
    else await this.prepareForUserGesture(position);
  }

  setVolume(volume: number, fadeMs: number): void {
    this.volume = Math.min(1, Math.max(0, volume));
    if (!this.sessionBus) return;
    const now = this.context.currentTime;
    this.sessionBus.gain.cancelScheduledValues(now);
    this.sessionBus.gain.setValueAtTime(
      Math.max(0, this.sessionBus.gain.value),
      now,
    );
    this.sessionBus.gain.linearRampToValueAtTime(
      Math.max(0, this.volume * this.compositeHeadroomGain()),
      now + Math.max(0, fadeMs) / 1000,
    );
  }

  setNatureLevel(level: NatureMixLevel, fadeMs: number): void {
    if (!this.program?.plan.natureMix) {
      throw new Error("This adaptive session has no natural ambience lane.");
    }
    if (
      !Number.isFinite(level) ||
      level < this.program.plan.natureMix.minimumLevel ||
      level > this.program.plan.natureMix.maximumLevel
    ) {
      throw new Error("Natural ambience volume must be between 0 and 100%.");
    }
    this.natureLevel = level;
    const gains = this.laneGains();
    this.rampBus(this.natureBus, gains.nature, fadeMs);
  }

  /** Prepare a replacement nature deck while the existing music clock runs.
   * The four-second linear lane crossfade conserves the summed peak ceiling;
   * it never overlaps a planned transition (three audible sources maximum). */
  async replaceNatureFamily(
    program: AdaptiveSessionProgram,
    signal: AbortSignal,
  ): Promise<void> {
    const previous = this.program;
    if (!previous?.plan.natureMix || !program.plan.natureMix || !this.playing)
      throw new Error(
        "A natural ambience family can be changed during playback only.",
      );
    if (this.natureChangeController)
      throw new Error("An ambience change is already being prepared.");
    const primary = (p: AdaptiveSessionProgram) =>
      p.plan.segments.filter((s) => s.lane !== "nature");
    const primaryTransitions = (p: AdaptiveSessionProgram) =>
      p.plan.transitions.filter((t) => t.lane !== "nature");
    if (
      previous.plan.id !== program.plan.id ||
      previous.plan.seed !== program.plan.seed ||
      JSON.stringify(primary(previous)) !== JSON.stringify(primary(program)) ||
      JSON.stringify(primaryTransitions(previous)) !==
        JSON.stringify(primaryTransitions(program)) ||
      previous.plan.totalDurationSeconds !== program.plan.totalDurationSeconds
    )
      throw new Error(
        "A live ambience change must preserve music and the session clock.",
      );
    if (
      previous.plan.natureMix.selectedFamily ===
        program.plan.natureMix.selectedFamily &&
      (previous.plan.natureMix.enabled !== false) ===
        (program.plan.natureMix.enabled !== false)
    )
      return;
    const controller = new AbortController();
    const cancel = () => controller.abort();
    signal.addEventListener("abort", cancel, { once: true });
    if (signal.aborted) controller.abort();
    this.natureChangeController = controller;
    const generation = this.deckGeneration;
    const revision = this.startAbortRevision;
    const acquired = new Map<string, WebAudioSourceLease>();
    let incoming: PreparedSegment | undefined;
    let outgoing: PreparedSegment | undefined;
    let temporaryIndex: number | undefined;
    let committed = false;
    const assertCurrent = () => {
      if (
        controller.signal.aborted ||
        !this.playing ||
        this.program !== previous ||
        generation !== this.deckGeneration ||
        revision !== this.startAbortRevision
      )
        throw new StalePreparationError();
    };
    try {
      assertCurrent();
      if (program.plan.natureMix.enabled === false) {
        this.rampBus(this.natureBus, 0, 250);
        await this.waitForNatureChange(0.25, controller.signal);
        assertCurrent();
        this.retireNatureLane(previous);
        this.program = program;
        ++this.natureScheduleRevision;
        committed = true;
        return;
      }
      for (const workId of program.plan.natureMix.natureWorkIds) {
        if (this.sourceLeases.has(workId) || acquired.has(workId)) continue;
        const work = program.works.find((item) => item.id === workId)!;
        const lease = await awaitWebAudioSource(
          () => this.resolveWorkSource(work, controller.signal),
          controller.signal,
        );
        if (lease) acquired.set(workId, lease);
        assertCurrent();
        if (!lease)
          throw new Error(
            "The new ambience is not available. The current session continues.",
          );
      }
      // Leave enough runway for bounded source preparation as well as the fade.
      let windowStart = this.positionSeconds();
      const transitionWindows =
        previous.plan.natureMix.enabled === false
          ? []
          : [
              ...previous.plan.transitions.filter((t) => t.lane === "nature"),
              ...program.plan.transitions.filter((t) => t.lane === "nature"),
            ];
      for (const transition of transitionWindows.sort(
        (a, b) => a.startSeconds - b.startSeconds,
      ))
        if (
          transition.endSeconds > windowStart &&
          transition.startSeconds < windowStart + 24
        )
          windowStart = transition.endSeconds + 0.1;
      if (windowStart + 24 >= previous.plan.totalDurationSeconds)
        throw new Error(
          "There is not enough time to change ambience before this session ends.",
        );
      await this.waitForNatureChange(
        Math.max(0, windowStart - this.positionSeconds()),
        controller.signal,
      );
      assertCurrent();
      const position = this.positionSeconds();
      // A late join uses the incoming recording, not an already ending source.
      const target = [...program.plan.segments]
        .sort((a, b) => b.startSeconds - a.startSeconds)
        .find(
          (s) =>
            s.lane === "nature" &&
            s.startSeconds <= position &&
            s.endSeconds > position,
        );
      const old = previous.plan.segments.find(
        (s) =>
          s.lane === "nature" &&
          s.startSeconds <= position &&
          s.endSeconds > position,
      );
      const oldRuntime = old && this.runtimes.get(old.index);
      if (
        !target ||
        (previous.plan.natureMix.enabled !== false && (!old || !oldRuntime))
      )
        throw new Error("The current ambience is not ready for a live change.");
      temporaryIndex =
        Math.max(
          ...previous.plan.segments.map((s) => s.index),
          ...program.plan.segments.map((s) => s.index),
        ) + 1;
      const staged = { ...target, index: temporaryIndex };
      this.stagedNature = { program, segment: staged };
      // Reuse a future nature deck, never evict an audible or musical source.
      if (
        !this.availableDecks.some(
          (deck) => deck.clockedPcm === this.usesClockedPcm(staged.index),
        )
      ) {
        const future = [...this.preloaded.keys()].find((index) =>
          previous.plan.segments.some(
            (s) => s.index === index && s.lane === "nature",
          ),
        );
        if (future !== undefined) this.releaseNaturePreload(future);
      }
      const lease =
        this.sourceLeases.get(target.workId) ?? acquired.get(target.workId);
      this.urls.set(temporaryIndex, lease!.uri);
      incoming = await this.awaitNaturePreparation(
        this.prepare(staged, position, generation),
        controller.signal,
      );
      assertCurrent();
      incoming.runtime.gain.gain.cancelScheduledValues(
        this.context.currentTime,
      );
      incoming.runtime.gain.gain.value = 0;
      await this.awaitNaturePreparation(
        Promise.resolve(incoming.runtime.element.prepareForPlayback?.()),
        controller.signal,
      );
      assertCurrent();
      const scheduledStart = incoming.runtime.element.playAt
        ? this.context.currentTime + NATURE_FAMILY_CLOCK_LEAD_SECONDS
        : undefined;
      const scheduledPosition =
        scheduledStart === undefined
          ? undefined
          : this.positionSeconds() + NATURE_FAMILY_CLOCK_LEAD_SECONDS;
      await this.awaitNaturePreparation(
        this.alignIncomingToClock(
          incoming,
          generation,
          revision,
          scheduledStart,
          scheduledPosition,
        ),
        controller.signal,
      );
      assertCurrent();
      if (scheduledStart !== undefined) {
        // The seek and its runway target one fixed future sample position.
        await this.awaitNaturePreparation(
          Promise.resolve(incoming.runtime.element.prepareForPlayback?.()),
          controller.signal,
        );
        assertCurrent();
        if (this.context.currentTime >= scheduledStart)
          throw new Error(
            "The new ambience missed its start time. The current ambience continues.",
          );
      }
      const nowPosition = this.positionSeconds();
      const fadePosition = scheduledPosition ?? nowPosition;
      if (
        transitionWindows.some(
          (t) =>
            t.endSeconds > nowPosition &&
            t.startSeconds < fadePosition + NATURE_FAMILY_FADE_SECONDS,
        ) ||
        fadePosition + NATURE_FAMILY_FADE_SECONDS >=
          Math.min(oldRuntime ? old!.endSeconds : Infinity, target.endSeconds)
      )
        throw new Error(
          "The next transition is too close. Try the ambience change again after it finishes.",
        );
      // Confirm silent incoming playback before touching the audible old lane.
      if (incoming.runtime.element.playAt)
        await this.awaitNaturePreparation(
          incoming.runtime.element.playAt(scheduledStart!),
          controller.signal,
        );
      else
        await this.awaitNaturePreparation(
          incoming.runtime.element.play(),
          controller.signal,
        );
      assertCurrent();
      if (
        scheduledStart !== undefined &&
        this.context.currentTime >= scheduledStart
      )
        throw new Error(
          "The new ambience missed its start time. The current ambience continues.",
        );
      if (old && oldRuntime)
        outgoing = {
          segment: old,
          runtime: oldRuntime,
          baseGain: dbToLinear(
            previous.works.find((w) => w.id === old.workId)!.playbackGainDb +
              old.playbackTrimDb,
          ),
        };
      const now = this.context.currentTime;
      const fadeStart = scheduledStart ?? now;
      if (old && oldRuntime && outgoing) {
        const oldGain = oldRuntime.gain.gain;
        oldGain.cancelScheduledValues(now);
        oldGain.setValueAtTime(
          outgoing.baseGain * this.gainAt(old.index, nowPosition),
          now,
        );
        oldGain.setValueAtTime(
          outgoing.baseGain * this.gainAt(old.index, fadePosition),
          fadeStart,
        );
        oldGain.linearRampToValueAtTime(
          0,
          fadeStart + NATURE_FAMILY_FADE_SECONDS,
        );
      }
      // The prepared source starts silent. Only the ambience bus is enabled;
      // primary sources, gain automation and session anchor are untouched.
      if (previous.plan.natureMix.enabled === false)
        this.rampBus(this.natureBus, this.natureLevel * 0.5, 250);
      incoming.runtime.gain.gain.setValueAtTime(0, now);
      incoming.runtime.gain.gain.setValueAtTime(0, fadeStart);
      incoming.runtime.gain.gain.linearRampToValueAtTime(
        incoming.baseGain,
        fadeStart + NATURE_FAMILY_FADE_SECONDS,
      );
      await this.waitForNatureChange(
        Math.max(
          0,
          fadeStart + NATURE_FAMILY_FADE_SECONDS - this.context.currentTime,
        ),
        controller.signal,
      );
      assertCurrent();
      // Complete fallible AudioParam work while the old lane is still owned.
      // If a browser rejects this automation, finally can restore that lane
      // instead of committing metadata with no audible replacement.
      incoming.runtime.auditionGain.gain.setValueAtTime(
        this.isAuditionMuted(target.index) ? 0 : 1,
        this.context.currentTime,
      );
      this.scheduleEnvelope(
        incoming.runtime,
        target,
        this.positionSeconds(),
        incoming.baseGain,
        program,
      );
      // Old family callbacks must not accumulate until the end of a long
      // session. Music callbacks and their original clock stay untouched.
      this.retireNatureLane(previous);
      this.program = program;
      ++this.natureScheduleRevision;
      for (const [workId, source] of acquired)
        this.sourceLeases.set(workId, source);
      for (const segment of program.plan.segments.filter(
        (s) => s.lane === "nature",
      ))
        this.urls.set(
          segment.index,
          this.sourceLeases.get(segment.workId)!.uri,
        );
      this.runtimes.delete(temporaryIndex);
      incoming.runtime.deck.segmentIndex = target.index;
      this.runtimes.set(target.index, incoming.runtime);
      incoming.segment = target;
      committed = true;
      for (const segment of program.plan.segments.filter(
        (s) => s.lane === "nature",
      ))
        this.scheduleSegment(
          segment,
          this.positionSeconds(),
          generation,
          revision,
        );
    } finally {
      signal.removeEventListener("abort", cancel);
      if (!committed && incoming) {
        incoming.runtime.element.releasePcmReader?.();
        this.release(incoming.segment.index, incoming.runtime);
      }
      if (temporaryIndex !== undefined) {
        if (!committed)
          this.preloaded.get(temporaryIndex)?.element.releasePcmReader?.();
        if (!committed) this.release(temporaryIndex);
        this.releaseNaturePreload(temporaryIndex);
        this.urls.delete(temporaryIndex);
      }
      if (
        !committed &&
        outgoing &&
        this.playing &&
        this.program === previous &&
        this.runtimes.get(outgoing.segment.index) === outgoing.runtime
      )
        this.scheduleEnvelope(
          outgoing.runtime,
          outgoing.segment,
          this.positionSeconds(),
          outgoing.baseGain,
        );
      this.stagedNature = null;
      if (this.natureChangeController === controller)
        this.natureChangeController = null;
      if (!committed)
        await Promise.allSettled(
          [...acquired.values()].map((lease) => lease.release()),
        );
      else {
        const retained = new Set(
          program.plan.segments
            .filter(
              (s) =>
                s.lane !== "nature" ||
                program.plan.natureMix?.enabled !== false,
            )
            .map((s) => s.workId),
        );
        for (const [workId, lease] of this.sourceLeases)
          if (!retained.has(workId)) {
            this.sourceLeases.delete(workId);
            await Promise.resolve()
              .then(() => lease.release())
              .catch(() => undefined);
          }
      }
      if (!committed && this.program === previous)
        this.rampBus(this.natureBus, this.laneGains().nature, 250);
      this.primeNextUpcoming(this.positionSeconds());
    }
  }

  private retireNatureLane(program: AdaptiveSessionProgram): void {
    for (const timer of this.natureTimers) {
      clearTimeout(timer);
      this.timers.delete(timer);
    }
    this.natureTimers.clear();
    for (const segment of program.plan.segments.filter(
      (s) => s.lane === "nature",
    )) {
      this.releaseNaturePreload(segment.index);
      this.release(segment.index);
      this.urls.delete(segment.index);
    }
  }

  private enabledSegment(segment: AdaptiveSessionSegment): boolean {
    return (
      segment.lane !== "nature" ||
      this.program?.plan.natureMix?.enabled !== false
    );
  }

  private awaitNaturePreparation<T>(
    promise: Promise<T>,
    signal: AbortSignal,
  ): Promise<T> {
    return new Promise((resolve, reject) => {
      const cancel = () => reject(new StalePreparationError());
      signal.addEventListener("abort", cancel, { once: true });
      if (signal.aborted) cancel();
      void promise
        .then(resolve, reject)
        .finally(() => signal.removeEventListener("abort", cancel));
    });
  }

  private waitForNatureChange(
    seconds: number,
    signal: AbortSignal,
  ): Promise<void> {
    return new Promise((resolve, reject) => {
      const cancel = () => {
        clearTimeout(timer);
        signal.removeEventListener("abort", cancel);
        reject(new StalePreparationError());
      };
      const timer = setTimeout(() => {
        signal.removeEventListener("abort", cancel);
        resolve();
      }, seconds * 1000);
      signal.addEventListener("abort", cancel, { once: true });
      if (signal.aborted) cancel();
    });
  }

  private releaseNaturePreload(index: number): void {
    this.preloadCancels.get(index)?.();
    this.positionAborts.get(index)?.abort();
    const deck = this.preloaded.get(index);
    if (deck) {
      this.preloaded.delete(index);
      deck.element.pause();
      this.recycleDeck(deck);
    }
  }

  positionSeconds(): number {
    if (!this.playing) return this.sessionOffsetSeconds;
    return (
      this.sessionOffsetSeconds +
      Math.max(0, this.context.currentTime - this.startedAtContextSeconds)
    );
  }

  async prepareReviewSeek(
    positionSeconds: number,
    signal: AbortSignal,
  ): Promise<boolean> {
    if (
      this.playing ||
      this.pendingStarts ||
      this.positionAborts.size ||
      this.preloadPromises.size ||
      !this.program ||
      !this.pcmReaderFactory?.prepareReview ||
      !Number.isFinite(positionSeconds) ||
      positionSeconds < 0 ||
      positionSeconds >= this.program.plan.totalDurationSeconds
    )
      return false;
    const candidates = this.preparationCandidates(positionSeconds).filter(
      (s) => s.startSeconds <= positionSeconds + 8,
    );
    const targets = candidates.map((s) => {
      const work = this.workForSegment(s.index);
      const url = this.urls.get(s.index);
      if (!work || !url)
        throw new Error("Review source missing from the current plan.");
      return {
        url,
        work,
        positionSeconds:
          (s.sourceEntrySeconds +
            Math.max(0, positionSeconds - s.startSeconds)) %
          work.durationSeconds,
      };
    });
    return this.pcmReaderFactory.prepareReview(targets, signal);
  }

  async stop(prepareForReplay = false): Promise<void> {
    this.natureChangeController?.abort();
    ++this.startAbortRevision;
    this.sourceLoadController?.abort();
    this.gestureAbort?.abort();
    this.gestureAbort = null;
    this.playing = false;
    this.sessionOffsetSeconds = 0;
    this.userGesturePromise = null;
    this.clearTimers();
    this.resetDeckAssignments();
    // Paused same-source seeks may reuse idle workers; an explicit Stop must
    // release every decoder, including a deck no longer assigned to a segment.
    for (const { element } of this.decks) element.releasePcmReader?.();
    this.disconnectBuses();
    if (prepareForReplay && this.program) {
      this.primeForUserGesture(0);
    }
  }

  async dispose(): Promise<void> {
    this.disposed = true;
    this.sourceLoadGeneration += 1;
    await this.stop(false);
    this.destroyDeckPool();
    this.program = null;
    this.urls.clear();
    await this.releaseSourceLeases();
  }

  private async startFrom(positionSeconds: number): Promise<void> {
    // Every new start/resume is a new scheduling epoch. This also invalidates
    // an activation already awaiting preparation when Seek restarts playback.
    const revision = ++this.startAbortRevision;
    this.awaitingInitialRunway = true;
    ++this.pendingStarts;
    try {
      await this.startPreparedFrom(positionSeconds, revision);
    } finally {
      --this.pendingStarts;
    }
  }

  private async startPreparedFrom(
    positionSeconds: number,
    revision: number,
  ): Promise<void> {
    const program = this.program;
    if (!program) throw new Error("No adaptive session is loaded.");
    const target = this.normalizePosition(program, positionSeconds);
    this.clearTimers();
    if (
      this.preparedPositionSeconds === null ||
      Math.abs(this.preparedPositionSeconds - target) > 0.001
    ) {
      if (
        this.gesturePrimedGeneration === this.deckGeneration &&
        this.gesturePrimedPositionSeconds !== null &&
        Math.abs(this.gesturePrimedPositionSeconds - target) <= 0.001
      ) {
        await this.completeGesturePreparation(target);
      } else {
        await this.prepareForUserGesture(target);
      }
    }
    if (!this.sessionBus)
      throw new Error("Adaptive session bus is unavailable.");
    if (revision !== this.startAbortRevision) throw new StalePreparationError();
    this.sessionBus.gain.cancelScheduledValues(this.context.currentTime);
    this.sessionBus.gain.value = 0;
    this.sessionOffsetSeconds = target;
    const generation = this.deckGeneration;

    try {
      const prepared = this.prepared;
      this.prepared = [];
      this.preparedPositionSeconds = null;
      const gestureActivation = this.takeUserGesturePromise(target);
      await Promise.all([
        ...(gestureActivation
          ? [gestureActivation]
          : prepared
              .filter(({ runtime }) => !runtime.element.playAt)
              .map(({ runtime }) => runtime.element.play())),
        ...prepared
          .filter(({ runtime }) => runtime.element.playAt)
          .map(({ runtime }) => runtime.element.prepareForPlayback!()),
      ]);
      if (
        generation !== this.deckGeneration ||
        revision !== this.startAbortRevision
      )
        throw new StalePreparationError();
      const hasClockedSources = prepared.some(
        ({ runtime }) => runtime.element.playAt,
      );
      if (hasClockedSources) {
        // A Safari-unlocked HTML deck may have advanced while the PCM worker
        // prepared. Discard that silent preroll before establishing the clock.
        // HTML media still cannot promise sample-clock alignment; the indexed
        // FLAC adapter is required to close that separate platform limitation.
        await Promise.all(
          prepared
            .filter(({ runtime }) => !runtime.element.playAt)
            .map(async ({ runtime, segment }) => {
              runtime.element.pause();
              const work = program.works.find(
                ({ id }) => id === segment.workId,
              )!;
              const offset =
                (segment.sourceEntrySeconds +
                  Math.max(0, target - segment.startSeconds)) %
                work.durationSeconds;
              const abort = new AbortController();
              this.positionAborts.set(segment.index, abort);
              try {
                await positionMediaElement(
                  runtime.element,
                  offset,
                  abort.signal,
                  false,
                );
                if (generation !== this.deckGeneration)
                  throw new StalePreparationError();
                await runtime.element.play();
              } finally {
                if (this.positionAborts.get(segment.index) === abort)
                  this.positionAborts.delete(segment.index);
              }
            }),
        );
      }
      if (
        generation !== this.deckGeneration ||
        revision !== this.startAbortRevision
      )
        throw new StalePreparationError();
      this.startedAtContextSeconds =
        this.context.currentTime + (hasClockedSources ? 0.06 : 0);
      this.sessionBus.gain.setValueAtTime(
        Math.max(0, this.volume * this.compositeHeadroomGain()),
        this.startedAtContextSeconds,
      );
      this.playing = true;
      for (const item of prepared)
        this.scheduleEnvelope(
          item.runtime,
          item.segment,
          target,
          item.baseGain,
        );
      await Promise.all(
        prepared
          .filter(({ runtime }) => runtime.element.playAt)
          .map(({ runtime }) =>
            runtime.element.playAt!(this.startedAtContextSeconds),
          ),
      );
      const active = new Set(
        [...this.runtimes.values()].map(({ element }) => element),
      );
      for (const { element } of this.decks) {
        if (!active.has(element)) element.pause();
      }
      if (
        generation !== this.deckGeneration ||
        revision !== this.startAbortRevision
      )
        throw new StalePreparationError();
      // Never let distant downloads compete with the audible sources while
      // their first 32 s runway is still filling. Play itself stays immediate.
      void Promise.all(
        prepared.map(({ runtime }) => runtime.element.prepareLookahead?.()),
      )
        .then(() => {
          if (
            this.playing &&
            generation === this.deckGeneration &&
            revision === this.startAbortRevision
          ) {
            this.awaitingInitialRunway = false;
            this.primeNextUpcoming(this.positionSeconds());
          }
        })
        .catch((error) => {
          if (
            this.playing &&
            generation === this.deckGeneration &&
            revision === this.startAbortRevision
          )
            void this.fail(error);
        });
    } catch (error) {
      if (
        generation !== this.deckGeneration ||
        revision !== this.startAbortRevision
      ) {
        throw new StalePreparationError();
      }
      this.playing = false;
      this.clearTimers();
      this.destroyDeckPool();
      this.disconnectBuses();
      this.program = null;
      this.urls.clear();
      await this.releaseSourceLeases();
      throw error;
    }

    for (const segment of program.plan.segments)
      this.scheduleSegment(segment, target, generation, revision);

    this.scheduleBoundary();
  }

  private scheduleSegment(
    segment: AdaptiveSessionSegment,
    target: number,
    generation: number,
    revision: number,
  ): void {
    if (!this.enabledSegment(segment)) return;
    const natureRevision = this.natureScheduleRevision;
    const isCurrent = () =>
      generation === this.deckGeneration &&
      revision === this.startAbortRevision &&
      (segment.lane !== "nature" ||
        natureRevision === this.natureScheduleRevision);
    if (segment.startSeconds > target) {
      const clocked = this.canScheduleClockedTransition(segment.index);
      const startContextSeconds = clocked
        ? this.contextTimeAt(segment.startSeconds)
        : undefined;
      const activationDelay =
        startContextSeconds === undefined
          ? this.delayUntil(segment.startSeconds)
          : Math.max(
              0,
              startContextSeconds -
                CLOCKED_TRANSITION_PREPARE_LEAD_SECONDS -
                this.context.currentTime,
            );
      this.schedule(
        activationDelay,
        () => {
          if (!isCurrent()) return;
          void this.activate(
            segment,
            generation,
            revision,
            startContextSeconds,
          ).catch((error) => {
            if (isCurrent() && !isStalePreparation(error))
              void this.fail(error);
          });
        },
        segment.lane === "nature",
      );
    }
    if (segment.endSeconds > target) {
      this.schedule(
        this.delayUntil(segment.endSeconds),
        () => {
          if (isCurrent()) this.release(segment.index);
        },
        segment.lane === "nature",
      );
    }
  }

  private delayUntil(sessionPosition: number): number {
    return Math.max(
      0,
      this.contextTimeAt(sessionPosition) - this.context.currentTime,
    );
  }

  private contextTimeAt(sessionPosition: number): number {
    return (
      this.startedAtContextSeconds + sessionPosition - this.sessionOffsetSeconds
    );
  }

  private async activate(
    segment: AdaptiveSessionSegment,
    expectedGeneration = this.deckGeneration,
    expectedRevision = this.startAbortRevision,
    scheduledStartContextSeconds?: number,
  ): Promise<void> {
    if (
      !this.activationIsCurrent(
        segment,
        expectedGeneration,
        expectedRevision,
      ) ||
      this.runtimes.has(segment.index)
    ) {
      return;
    }
    const generation = expectedGeneration;
    const revision = expectedRevision;
    if (scheduledStartContextSeconds !== undefined)
      this.assertClockedStartPending(
        segment,
        generation,
        revision,
        scheduledStartContextSeconds,
      );
    const position =
      scheduledStartContextSeconds === undefined
        ? this.positionSeconds()
        : segment.startSeconds;
    if (position >= segment.endSeconds) return;
    let prepared: PreparedSegment | undefined;
    try {
      prepared = await this.prepare(segment, position, generation);
      if (
        !this.activationIsCurrent(
          segment,
          generation,
          revision,
          prepared.runtime,
        )
      )
        throw new StalePreparationError();
      await this.alignIncomingToClock(
        prepared,
        generation,
        revision,
        scheduledStartContextSeconds,
      );
      if (
        !this.activationIsCurrent(
          segment,
          generation,
          revision,
          prepared.runtime,
        )
      )
        throw new StalePreparationError();

      const envelopePosition =
        scheduledStartContextSeconds === undefined
          ? this.positionSeconds()
          : segment.startSeconds;
      if (envelopePosition >= segment.endSeconds) {
        if (scheduledStartContextSeconds !== undefined)
          throw new Error(
            "A scheduled PCM phrase missed its session clock; playback stopped without skipping audio.",
          );
        this.release(segment.index, prepared.runtime);
        return;
      }
      this.scheduleEnvelope(
        prepared.runtime,
        prepared.segment,
        envelopePosition,
        prepared.baseGain,
      );

      if (scheduledStartContextSeconds !== undefined) {
        const { element } = prepared.runtime;
        if (!element.playAt || !element.prepareForPlayback)
          throw new Error(
            "A scheduled PCM source lost its audio-clock capability.",
          );
        this.assertClockedStartPending(
          segment,
          generation,
          revision,
          scheduledStartContextSeconds,
          prepared.runtime,
        );
        await element.prepareForPlayback();
        this.assertClockedStartPending(
          segment,
          generation,
          revision,
          scheduledStartContextSeconds,
          prepared.runtime,
        );
        await element.playAt(scheduledStartContextSeconds);
      } else {
        await prepared.runtime.element.play();
      }
    } catch (error) {
      const stale = !this.activationIsCurrent(
        segment,
        generation,
        revision,
        prepared?.runtime,
      );
      if (prepared) this.release(segment.index, prepared.runtime);
      if (stale) throw new StalePreparationError();
      throw error;
    }
    if (!prepared)
      throw new Error("Incoming audio preparation did not complete.");
    if (
      !this.activationIsCurrent(segment, generation, revision, prepared.runtime)
    ) {
      this.release(segment.index, prepared.runtime);
      throw new StalePreparationError();
    }
    this.primeNextUpcoming(this.positionSeconds());
  }

  private activationIsCurrent(
    segment: AdaptiveSessionSegment,
    generation: number,
    revision: number,
    runtime?: SegmentRuntime,
  ): boolean {
    return (
      this.playing &&
      generation === this.deckGeneration &&
      revision === this.startAbortRevision &&
      (this.program?.plan.segments.includes(segment) ||
        this.stagedNature?.segment === segment) &&
      (!runtime ||
        (runtime.deck.generation === generation &&
          runtime.deck.segmentIndex === segment.index))
    );
  }

  private assertClockedStartPending(
    segment: AdaptiveSessionSegment,
    generation: number,
    revision: number,
    startContextSeconds: number,
    runtime?: SegmentRuntime,
  ): void {
    if (!this.activationIsCurrent(segment, generation, revision, runtime))
      throw new StalePreparationError();
    if (this.context.currentTime >= startContextSeconds)
      throw new Error(
        "A scheduled PCM phrase missed its session clock; playback stopped without skipping audio.",
      );
  }

  private async alignIncomingToClock(
    prepared: PreparedSegment,
    generation: number,
    revision: number,
    scheduledStartContextSeconds?: number,
    scheduledSessionPositionSeconds?: number,
  ): Promise<void> {
    const { segment, runtime } = prepared;
    const duration = (
      this.stagedNature?.segment === segment
        ? this.stagedNature.program
        : this.program
    )?.works.find(({ id }) => id === segment.workId)?.durationSeconds;
    if (!duration || duration <= 0)
      throw new Error("Incoming source duration is unavailable.");
    const abortController = new AbortController();
    this.positionAborts.set(segment.index, abortController);
    try {
      // A slow seek must not start an incoming deck seconds behind its gain
      // envelope. Retry at most twice; never spin or silently accept drift.
      for (let attempt = 0; attempt <= 2; attempt += 1) {
        if (!this.activationIsCurrent(segment, generation, revision, runtime))
          throw new StalePreparationError();
        if (
          scheduledStartContextSeconds !== undefined &&
          this.context.currentTime >= scheduledStartContextSeconds
        )
          throw new Error(
            "A scheduled PCM phrase missed its session clock; playback stopped without skipping audio.",
          );
        const position =
          scheduledStartContextSeconds === undefined
            ? this.positionSeconds()
            : (scheduledSessionPositionSeconds ?? segment.startSeconds);
        if (position >= segment.endSeconds) return;
        const target =
          (segment.sourceEntrySeconds +
            Math.max(0, position - segment.startSeconds)) %
          duration;
        const distance = Math.abs(runtime.element.currentTime - target);
        if (
          !runtime.element.seeking &&
          Math.min(distance, Math.abs(duration - distance)) <= 0.1
        )
          return;
        if (attempt === 2)
          throw new Error(
            "Incoming audio could not align with the session clock.",
          );
        await positionMediaElement(
          runtime.element,
          target,
          abortController.signal,
          false,
        );
      }
    } catch (error) {
      if (
        generation !== this.deckGeneration ||
        revision !== this.startAbortRevision ||
        abortController.signal.aborted ||
        !this.playing
      )
        throw new StalePreparationError();
      throw error;
    } finally {
      if (this.positionAborts.get(segment.index) === abortController)
        this.positionAborts.delete(segment.index);
    }
  }

  private async prepare(
    segment: AdaptiveSessionSegment,
    sessionPositionSeconds: number,
    generation = this.deckGeneration,
    requestLoad = true,
  ): Promise<PreparedSegment> {
    if (!this.program || !this.sessionBus || !this.primaryBus) {
      throw new Error("Adaptive playback is not ready.");
    }
    const work = (
      this.stagedNature?.segment === segment
        ? this.stagedNature.program
        : this.program
    ).works.find(({ id }) => id === segment.workId);
    const url = this.urls.get(segment.index);
    if (!work || !url)
      throw new Error(`Missing session work ${segment.workId}.`);
    if (generation !== this.deckGeneration) throw new StalePreparationError();
    const sourcePosition =
      (segment.sourceEntrySeconds +
        Math.max(0, sessionPositionSeconds - segment.startSeconds)) %
      work.durationSeconds;
    await this.prime(segment.index, generation, sourcePosition);
    if (generation !== this.deckGeneration) throw new StalePreparationError();
    const deck = this.preloaded.get(segment.index);
    if (
      !deck ||
      deck.generation !== generation ||
      deck.segmentIndex !== segment.index
    ) {
      throw new StalePreparationError();
    }
    const { element, source } = deck;
    element.loop = true;
    element.preload = "auto";
    try {
      const abortController = new AbortController();
      this.positionAborts.set(segment.index, abortController);
      try {
        await positionMediaElement(
          element,
          sourcePosition,
          abortController.signal,
          requestLoad,
        );
      } finally {
        if (this.positionAborts.get(segment.index) === abortController) {
          this.positionAborts.delete(segment.index);
        }
      }
      if (
        generation !== this.deckGeneration ||
        deck.generation !== generation ||
        deck.segmentIndex !== segment.index
      ) {
        throw new StalePreparationError();
      }
      const gain = this.context.createGain();
      const auditionGain = this.context.createGain();
      const baseGain = dbToLinear(work.playbackGainDb + segment.playbackTrimDb);
      gain.gain.value = Math.max(
        SILENT_GAIN,
        baseGain * this.gainAt(segment.index, sessionPositionSeconds),
      );
      auditionGain.gain.value = this.isAuditionMuted(segment.index) ? 0 : 1;
      source.connect(gain);
      const output =
        (segment.lane ?? "primary") === "nature"
          ? this.natureBus
          : this.primaryBus;
      if (!output) throw new Error("Adaptive session lane is unavailable.");
      gain.connect(auditionGain);
      auditionGain.connect(output);
      const runtime = { deck, element, source, gain, auditionGain };
      this.preloaded.delete(segment.index);
      this.runtimes.set(segment.index, runtime);
      return { segment, runtime, baseGain };
    } catch (error) {
      if (
        generation !== this.deckGeneration ||
        (error instanceof Error && error.name === "AbortError")
      ) {
        throw new StalePreparationError();
      }
      if (
        deck.generation === generation &&
        deck.segmentIndex === segment.index
      ) {
        element.pause();
        this.preloaded.delete(segment.index);
        this.recycleDeck(deck);
      }
      throw error;
    }
  }

  private primeForUserGesture(positionSeconds: number): void {
    const program = this.program;
    if (!program) throw new Error("No adaptive session is loaded.");
    const target = this.normalizePosition(program, positionSeconds);
    this.clearTimers();
    this.playing = false;
    this.resetDeckAssignments();
    this.disconnectBuses();
    if (this.decks.size === 0) this.createDeckPool();
    this.createSilentBuses();
    this.sessionOffsetSeconds = target;
    const generation = this.deckGeneration;
    const candidates = this.preparationCandidates(target);

    for (const segment of candidates) {
      const url = this.urls.get(segment.index);
      const deck = this.takeDeck(segment.index);
      if (!url || !deck) {
        this.resetDeckAssignments();
        this.disconnectBuses();
        throw new Error("Adaptive replay could not reserve its media decks.");
      }
      deck.generation = generation;
      deck.segmentIndex = segment.index;
      deck.element.preload = "none";
      deck.element.loop = true;
      deck.element.src = url;
      this.preloaded.set(segment.index, deck);
    }
    this.gesturePrimedPositionSeconds = target;
    this.gesturePrimedGeneration = generation;
  }

  private async completeGesturePreparation(
    positionSeconds: number,
  ): Promise<void> {
    const program = this.program;
    const generation = this.deckGeneration;
    if (!program || !this.sessionBus || !this.primaryBus) {
      throw new Error("Adaptive gesture preparation is unavailable.");
    }
    const initial = program.plan.segments.filter(
      (segment) =>
        this.enabledSegment(segment) &&
        positionSeconds >= segment.startSeconds &&
        positionSeconds < segment.endSeconds,
    );
    try {
      const results = await Promise.allSettled(
        initial.map((segment) =>
          this.prepare(segment, positionSeconds, generation, false),
        ),
      );
      const failure = results.find(
        (result): result is PromiseRejectedResult =>
          result.status === "rejected",
      );
      if (failure) throw failure.reason;
      if (generation !== this.deckGeneration) {
        throw new StalePreparationError();
      }
      this.prepared = results.flatMap((result) =>
        result.status === "fulfilled" ? [result.value] : [],
      );
      this.preparedPositionSeconds = positionSeconds;
      this.gesturePrimedPositionSeconds = null;
      this.gesturePrimedGeneration = null;
    } catch (error) {
      if (generation !== this.deckGeneration) {
        throw new StalePreparationError();
      }
      this.resetDeckAssignments();
      this.disconnectBuses();
      throw error;
    }
  }

  private scheduleEnvelope(
    runtime: SegmentRuntime,
    segment: AdaptiveSessionSegment,
    position: number,
    baseGain: number,
    program = this.program,
  ): void {
    if (!program) return;
    const now = Math.max(
      this.context.currentTime,
      this.startedAtContextSeconds + position - this.sessionOffsetSeconds,
    );
    // Pause retains these nodes, but their AudioParam clock keeps running.
    // Remove old curves (including an active curve) before re-anchoring the
    // envelope to the session clock. Never stack resume automation on top.
    runtime.gain.gain.cancelScheduledValues(now);
    runtime.gain.gain.setValueAtTime(
      Math.max(
        SILENT_GAIN,
        baseGain * this.gainAt(segment.index, position, program),
      ),
      now,
    );
    const incoming = program.plan.transitions.find(
      ({ incomingSegmentIndex }) => incomingSegmentIndex === segment.index,
    );
    const outgoing = program.plan.transitions.find(
      ({ outgoingSegmentIndex }) => outgoingSegmentIndex === segment.index,
    );
    const windows = [
      ...(incoming ? [incoming] : []),
      ...(outgoing ? [outgoing] : []),
      ...(segment.finalEnvelopeSeconds > 0
        ? [
            {
              startSeconds: segment.endSeconds - segment.finalEnvelopeSeconds,
              endSeconds: segment.endSeconds,
            },
          ]
        : []),
    ].filter(({ endSeconds }) => endSeconds > position);
    const boundaries = [
      ...new Set(
        windows.flatMap(({ startSeconds, endSeconds }) => [
          Math.max(position, startSeconds),
          endSeconds,
        ]),
      ),
    ].sort((a, b) => a - b);
    let previousCurveEnd = now;
    for (let index = 0; index < boundaries.length - 1; index += 1) {
      const start = boundaries[index],
        end = boundaries[index + 1];
      const middle = (start + end) / 2;
      if (
        !windows.some((w) => middle >= w.startSeconds && middle < w.endSeconds)
      )
        continue;
      // One composite curve per non-overlapping interval, anchored exactly
      // at the seek fraction. Incoming and final envelopes can coexist.
      const values = Float32Array.from({ length: 65 }, (_, point) =>
        this.gainAt(
          segment.index,
          start + ((end - start) * point) / 64,
          program,
        ),
      );
      // Subtract session-relative positions BEFORE adding the context anchor.
      // (now + start) - position can round below now even when start===position,
      // making the initial setValueAtTime illegally fall inside this curve.
      // Reuse each computed end at contiguous boundaries for the same reason.
      const curveStart = Math.max(previousCurveEnd, now + (start - position));
      const curveEnd = now + (end - position);
      const curveDuration = curveEnd - curveStart;
      if (curveDuration <= 0)
        throw new Error(
          "Audio envelope interval is too small for the current clock.",
        );
      runtime.gain.gain.setValueCurveAtTime(
        multiplyCurve(values, baseGain),
        curveStart,
        curveDuration,
      );
      previousCurveEnd = curveStart + curveDuration;
    }
  }

  private gainAt(
    segmentIndex: number,
    position: number,
    program = this.program,
  ): number {
    if (!program) return 0;
    const incoming = program.plan.transitions.find(
      ({ incomingSegmentIndex }) => incomingSegmentIndex === segmentIndex,
    );
    const outgoing = program.plan.transitions.find(
      ({ outgoingSegmentIndex }) => outgoingSegmentIndex === segmentIndex,
    );
    const segment = program.plan.segments.find(
      ({ index }) => index === segmentIndex,
    );
    let gain = 1;
    if (
      segment &&
      segment.finalEnvelopeSeconds > 0 &&
      position >= segment.endSeconds - segment.finalEnvelopeSeconds
    ) {
      gain *= transitionGains(
        (position - segment.endSeconds + segment.finalEnvelopeSeconds) /
          segment.finalEnvelopeSeconds,
        "equal-power",
      ).outgoing;
    }
    if (
      incoming &&
      position >= incoming.startSeconds &&
      position <= incoming.endSeconds
    ) {
      gain *= transitionGains(
        (position - incoming.startSeconds) / incoming.durationSeconds,
        incoming.curve,
      ).incoming;
    }
    if (
      outgoing &&
      position >= outgoing.startSeconds &&
      position <= outgoing.endSeconds
    ) {
      gain *= transitionGains(
        (position - outgoing.startSeconds) / outgoing.durationSeconds,
        outgoing.curve,
      ).outgoing;
    }
    return gain;
  }

  private isAuditionMuted(segmentIndex: number): boolean {
    if (!this.program || !this.audition) return false;
    const target = this.program.plan.transitions[this.audition.transitionIndex];
    return (
      (this.audition.mode === "outgoing" &&
        segmentIndex === target.incomingSegmentIndex) ||
      (this.audition.mode === "incoming" &&
        segmentIndex === target.outgoingSegmentIndex)
    );
  }

  private prime(
    index: number,
    generation = this.deckGeneration,
    positionSeconds?: number,
  ): Promise<void> {
    if (generation !== this.deckGeneration) {
      return Promise.reject(new StalePreparationError());
    }
    if (this.runtimes.has(index)) return Promise.resolve();
    const existing = this.preloadPromises.get(index);
    if (existing) return existing;
    if (this.preloaded.has(index)) return Promise.resolve();
    const url = this.urls.get(index);
    if (!url) return Promise.resolve();
    const segment =
      this.stagedNature?.segment.index === index
        ? this.stagedNature.segment
        : this.program?.plan.segments.find(
            (candidate) => candidate.index === index,
          );
    const work = (
      this.stagedNature && this.stagedNature.segment === segment
        ? this.stagedNature.program
        : this.program
    )?.works.find((candidate) => candidate.id === segment?.workId);
    const sourceLabel = work?.title ?? `Session source ${index}`;
    const lane = segment?.lane ?? "primary";
    const deck = this.takeDeck(index);
    if (!deck) {
      return Promise.reject(
        new Error("No free media deck is available for the next transition."),
      );
    }
    const { element } = deck;
    deck.generation = generation;
    deck.segmentIndex = index;
    element.src = url;
    element.loop = true;
    element.preload = "metadata";
    this.preloaded.set(index, deck);
    let cancel: () => void = () => undefined;
    let promise: Promise<void>;
    const loading = new Promise<void>((resolve, reject) => {
      let settled = false;
      let timeout: ReturnType<typeof setTimeout>;
      const cleanup = () => {
        clearTimeout(timeout);
        element.removeEventListener("loadedmetadata", ready);
        element.removeEventListener("error", failed);
      };
      const settle = (callback: () => void) => {
        if (settled) return;
        settled = true;
        cleanup();
        callback();
      };
      const assigned = () =>
        generation === this.deckGeneration &&
        deck.generation === generation &&
        deck.segmentIndex === index;
      const ready = () => {
        settle(() => {
          if (assigned()) resolve();
          else reject(new StalePreparationError());
        });
      };
      const failed = () => {
        settle(() => {
          if (!assigned()) {
            reject(new StalePreparationError());
            return;
          }
          this.preloaded.delete(index);
          this.recycleDeck(deck);
          const mediaError = element.error;
          const mediaErrorKind =
            mediaError?.code === 1
              ? "aborted"
              : mediaError?.code === 2
                ? "network"
                : mediaError?.code === 3
                  ? "decode"
                  : mediaError?.code === 4
                    ? "source not supported"
                    : "unclassified media error";
          const detail = mediaError?.message?.trim();
          reject(
            new Error(
              `${sourceLabel} failed to load (${lane} source ${index}; ${mediaErrorKind}${mediaError?.code ? ` ${mediaError.code}` : ""}${detail ? `; ${detail}` : ""}).`,
            ),
          );
        });
      };
      timeout = setTimeout(() => {
        settle(() => {
          if (!assigned()) {
            reject(new StalePreparationError());
            return;
          }
          this.preloaded.delete(index);
          this.recycleDeck(deck);
          reject(
            new Error(
              `${sourceLabel} timed out while loading (${lane} source ${index}).`,
            ),
          );
        });
      }, 20_000);
      cancel = () =>
        settle(() => {
          reject(new StalePreparationError());
        });
      element.addEventListener("loadedmetadata", ready, { once: true });
      element.addEventListener("error", failed, { once: true });
      try {
        if (element.prepareAt) {
          void element
            .prepareAt(positionSeconds ?? segment?.sourceEntrySeconds ?? 0)
            .then(ready, (error) => settle(() => reject(error)));
        } else {
          element.load();
          if (element.readyState >= 1) ready();
        }
      } catch (error) {
        settle(() =>
          reject(
            error instanceof Error
              ? error
              : new Error(`${sourceLabel} could not begin loading.`),
          ),
        );
      }
    });
    promise = loading.finally(() => {
      if (this.preloadPromises.get(index) === promise) {
        this.preloadPromises.delete(index);
        this.preloadCancels.delete(index);
      }
    });
    this.preloadPromises.set(index, promise);
    this.preloadCancels.set(index, cancel);
    void promise.catch(() => undefined);
    return promise;
  }

  private primeNextUpcoming(positionSeconds: number): void {
    if (
      !this.program ||
      !this.playing ||
      this.awaitingInitialRunway ||
      this.stagedNature ||
      this.runtimes.size >= MEDIA_DECK_COUNT ||
      this.availableDecks.length === 0
    ) {
      return;
    }
    const next = this.program.plan.segments
      .filter(
        (segment) =>
          this.enabledSegment(segment) &&
          segment.startSeconds > positionSeconds &&
          !this.runtimes.has(segment.index) &&
          !this.preloaded.has(segment.index) &&
          !this.preloadPromises.has(segment.index) &&
          this.availableDecks.some(
            (deck) => deck.clockedPcm === this.usesClockedPcm(segment.index),
          ),
      )
      .sort((left, right) => left.startSeconds - right.startSeconds)[0];
    if (!next) return;
    const generation = this.deckGeneration;
    const revision = this.startAbortRevision;
    void this.prime(next.index, generation)
      .then(() => {
        if (
          this.playing &&
          generation === this.deckGeneration &&
          revision === this.startAbortRevision
        )
          this.primeNextUpcoming(this.positionSeconds());
      })
      .catch((error) => {
        if (
          this.playing &&
          generation === this.deckGeneration &&
          revision === this.startAbortRevision &&
          !isStalePreparation(error)
        )
          void this.fail(error);
      });
  }

  private async fail(error: unknown): Promise<void> {
    if (this.failureReported) return;
    this.failureReported = true;
    const normalized =
      error instanceof Error ? error : new Error("Adaptive playback failed.");
    await this.stop().catch(() => undefined);
    this.destroyDeckPool();
    await this.releaseSourceLeases();
    this.program = null;
    this.urls.clear();
    this.handlers.error(normalized);
  }

  private async finish(): Promise<void> {
    try {
      await this.stop();
      this.handlers.ended();
    } catch (error) {
      await this.fail(error);
    }
  }

  private async restartAudition(): Promise<void> {
    if (!this.audition) return;
    await this.prepareForUserGesture(this.audition.startSeconds);
    await this.startFrom(this.audition.startSeconds);
  }

  private release(index: number, expectedRuntime?: SegmentRuntime): void {
    const runtime = this.runtimes.get(index);
    if (!runtime || (expectedRuntime && runtime !== expectedRuntime)) return;
    // Pause snapshots active runtimes for Resume. If an ahead-of-time future
    // activation is cancelled after that snapshot, remove the same runtime so
    // Resume cannot revive a phrase that never reached its clock anchor.
    this.prepared = this.prepared.filter((item) => item.runtime !== runtime);
    resetRuntime(runtime);
    this.runtimes.delete(index);
    this.recycleDeck(runtime.deck);
    this.primeNextUpcoming(this.positionSeconds());
  }

  private schedule(
    delaySeconds: number,
    callback: () => void,
    nature = false,
  ): void {
    const timer = setTimeout(
      () => {
        this.timers.delete(timer);
        this.natureTimers.delete(timer);
        callback();
      },
      Math.max(0, delaySeconds * 1000),
    );
    this.timers.add(timer);
    if (nature) this.natureTimers.add(timer);
  }

  private scheduleBoundary(): void {
    if (this.boundaryTimer !== null) clearTimeout(this.boundaryTimer);
    this.boundaryTimer = null;
    if (!this.program || !this.playing) return;
    const generation = this.deckGeneration;
    const revision = this.startAbortRevision;
    const stopAt =
      this.audition && this.auditionLoop
        ? this.audition.endSeconds
        : this.program.plan.totalDurationSeconds;
    this.boundaryTimer = setTimeout(
      () => {
        this.boundaryTimer = null;
        if (
          !this.playing ||
          generation !== this.deckGeneration ||
          revision !== this.startAbortRevision
        )
          return;
        if (this.audition && this.auditionLoop) {
          void this.restartAudition().catch((error) => {
            if (!isStalePreparation(error)) void this.fail(error);
          });
        } else void this.finish();
      },
      this.delayUntil(stopAt) * 1000,
    );
  }

  private clearTimers(): void {
    this.natureChangeController?.abort();
    if (this.boundaryTimer !== null) clearTimeout(this.boundaryTimer);
    this.boundaryTimer = null;
    for (const timer of this.timers) clearTimeout(timer);
    this.timers.clear();
    this.natureTimers.clear();
    // Timer cancellation alone cannot stop an activation already awaiting a
    // seek. Pause, Seek and every new scheduling revision all pass here.
    for (const abort of this.positionAborts.values()) abort.abort();
    this.positionAborts.clear();
  }

  private clearRuntimes(): void {
    for (const runtime of this.runtimes.values()) {
      resetRuntime(runtime);
      this.recycleDeck(runtime.deck);
    }
    this.runtimes.clear();
    this.prepared = [];
    this.preparedPositionSeconds = null;
  }

  private resetDeckAssignments(): void {
    this.deckGeneration += 1;
    // A Play confirmation belongs to the exact sources/position that received
    // the gesture. Keep its identity until consumed so a stale confirmation
    // cannot silently suppress Play on freshly prepared (and paused) decks.
    this.gestureAbort?.abort();
    for (const { element } of this.decks) element.pause();
    for (const cancel of this.preloadCancels.values()) cancel();
    this.preloadCancels.clear();
    for (const abort of this.positionAborts.values()) abort.abort();
    this.positionAborts.clear();
    this.clearRuntimes();
    for (const [index, deck] of this.preloaded) {
      deck.element.pause();
      if (deck.segmentIndex === index) this.recycleDeck(deck);
    }
    this.preloaded.clear();
    this.preloadPromises.clear();
    this.prepared = [];
    this.preparedPositionSeconds = null;
    this.gesturePrimedPositionSeconds = null;
    this.gesturePrimedGeneration = null;
  }

  private usesClockedPcm(index: number): boolean {
    const work = this.workForSegment(index);
    const filename = work?.localPreviewFilename ?? this.urls.get(index) ?? "";
    return (
      this.clockedWav &&
      (/\.wav(?:$|\?)/i.test(filename) ||
        (!!this.pcmReaderFactory && /\.flac$/i.test(filename)))
    );
  }

  private workForSegment(index: number): ConsumerAudioWork | undefined {
    if (this.stagedNature?.segment.index === index)
      return this.stagedNature.program.works.find(
        (work) => work.id === this.stagedNature?.segment.workId,
      );
    const segment = this.program?.plan.segments.find(
      (item) => item.index === index,
    );
    return this.program?.works.find((work) => work.id === segment?.workId);
  }

  private canScheduleClockedTransition(index: number): boolean {
    if (!this.usesClockedPcm(index)) return false;
    const clockedDecks = [...this.decks].filter(({ clockedPcm }) => clockedPcm);
    return (
      clockedDecks.length > 0 &&
      clockedDecks.every(
        ({ element }) => element.playAt && element.prepareForPlayback,
      )
    );
  }

  private takeDeck(index: number): MediaDeck | undefined {
    const sameSource = this.availableDecks.findIndex(
      (deck) =>
        deck.clockedPcm === this.usesClockedPcm(index) &&
        deck.element.src === this.urls.get(index),
    );
    const position =
      sameSource >= 0
        ? sameSource
        : this.availableDecks.findIndex(
            (deck) => deck.clockedPcm === this.usesClockedPcm(index),
          );
    return position < 0
      ? undefined
      : this.availableDecks.splice(position, 1)[0];
  }

  /** Reserve active sources first, then the next sources of each decoder type.
   * A distant nature preload must not consume or block the next music deck. */
  private preparationCandidates(target: number): AdaptiveSessionSegment[] {
    const capacity = new Map<boolean, number>([
      [true, 0],
      [false, 0],
    ]);
    for (const deck of this.decks)
      capacity.set(deck.clockedPcm, capacity.get(deck.clockedPcm)! + 1);
    return (this.program?.plan.segments ?? [])
      .filter(
        (segment) =>
          this.enabledSegment(segment) && segment.endSeconds > target,
      )
      .sort(
        (left, right) =>
          Math.max(target, left.startSeconds) -
            Math.max(target, right.startSeconds) || left.index - right.index,
      )
      .filter((segment) => {
        const pcm = this.usesClockedPcm(segment.index);
        const remaining = capacity.get(pcm)!;
        if (!remaining) return false;
        capacity.set(pcm, remaining - 1);
        return true;
      });
  }

  private createDeckPool(): void {
    const segments = this.program?.plan.segments ?? [];
    const pcmSegments = segments.filter((segment) =>
      this.usesClockedPcm(segment.index),
    );
    const mediaSegments = segments.filter(
      (segment) => !this.usesClockedPcm(segment.index),
    );
    const mixed = pcmSegments.length > 0 && mediaSegments.length > 0;
    const capacity = (items: AdaptiveSessionSegment[]) => {
      if (!mixed) return Math.min(MEDIA_DECK_COUNT, items.length);
      const peak = Math.max(
        0,
        ...items.map(
          ({ startFrame }) =>
            items.filter(
              (item) =>
                item.startFrame <= startFrame && item.endFrame > startFrame,
            ).length,
        ),
      );
      return Math.min(items.length, Math.max(2, peak));
    };
    const kinds = [
      ...Array<boolean>(capacity(pcmSegments)).fill(true),
      ...Array<boolean>(capacity(mediaSegments)).fill(false),
    ];
    if (kinds.length > MEDIA_DECK_COUNT)
      throw new Error(
        "Mixed-format session exceeds the bounded decoder capacity.",
      );
    // Dedicated ports are created before the direct gesture and reused. A FLAC
    // ambience never switches WAV music back to HTML media looping/full decode.
    for (const clockedPcm of kinds) {
      const pcm = clockedPcm
        ? new ClockedWavSource(
            this.context,
            undefined,
            this.pcmReaderFactory
              ? (url) => {
                  const index = [...this.urls].find(
                    ([, source]) => source === url,
                  )?.[0];
                  const work =
                    index === undefined
                      ? undefined
                      : this.workForSegment(index);
                  if (!work)
                    throw new Error("PCM source is not part of the session.");
                  return this.pcmReaderFactory!(url, work);
                }
              : undefined,
          )
        : null;
      const element = pcm ?? new Audio();
      element.loop = true;
      element.preload = "metadata";
      const deck = {
        clockedPcm,
        element,
        generation: this.deckGeneration,
        segmentIndex: null,
        source:
          pcm?.output ??
          this.context.createMediaElementSource(element as HTMLAudioElement),
      };
      this.decks.add(deck);
      if (pcm)
        element.addEventListener("error", () => {
          if (
            this.playing &&
            deck.segmentIndex !== null &&
            deck.segmentIndex !== this.stagedNature?.segment.index
          )
            void this.fail(
              new Error(element.error?.message ?? "PCM playback failed."),
            );
        });
      this.availableDecks.push(deck);
    }
  }

  private recycleDeck(deck: MediaDeck): void {
    if (!this.decks.has(deck) || this.availableDecks.includes(deck)) return;
    deck.generation = this.deckGeneration;
    deck.segmentIndex = null;
    this.availableDecks.push(deck);
  }

  private destroyDeckPool(): void {
    this.resetDeckAssignments();
    for (const deck of this.decks) {
      deck.element.pause();
      deck.element.removeAttribute("src");
      deck.element.load();
      deck.source.disconnect();
    }
    this.decks.clear();
    this.availableDecks = [];
    this.prepared = [];
    this.preparedPositionSeconds = null;
    this.userGesturePromise = null;
  }

  private createSilentBuses(): void {
    this.sessionBus = this.context.createGain();
    this.sessionBus.gain.value = 0;
    this.sessionBus.connect(this.destination);
    const laneGains = this.laneGains();
    this.primaryBus = this.context.createGain();
    this.primaryBus.gain.value = Math.max(0, laneGains.primary);
    this.primaryBus.connect(this.sessionBus);
    this.natureBus = this.context.createGain();
    this.natureBus.gain.value = Math.max(0, laneGains.nature);
    this.natureBus.connect(this.sessionBus);
  }

  private disconnectBuses(): void {
    this.primaryBus?.disconnect();
    this.natureBus?.disconnect();
    this.sessionBus?.disconnect();
    this.primaryBus = null;
    this.natureBus = null;
    this.sessionBus = null;
  }

  private takeUserGesturePromise(
    positionSeconds: number,
  ): Promise<void> | null {
    const activation = this.userGesturePromise;
    this.userGesturePromise = null;
    if (
      activation &&
      (this.userGestureGeneration !== this.deckGeneration ||
        this.userGesturePositionSeconds === null ||
        Math.abs(this.userGesturePositionSeconds - positionSeconds) > 0.001)
    ) {
      throw new Error(
        "The session position changed after Play. Wait for the position to be ready, then press Play again.",
      );
    }
    return activation;
  }

  private compositeHeadroomGain(): number {
    return dbToLinear(this.program?.plan.compositeHeadroomTrimDb ?? 0);
  }

  private laneGains(): { primary: number; nature: number } {
    if (!this.program?.plan.natureMix) return { primary: 1, nature: 0 };
    return {
      primary: 0.5,
      nature:
        this.program.plan.natureMix.enabled === false
          ? 0
          : this.natureLevel * 0.5,
    };
  }

  private rampBus(node: GainNode | null, value: number, fadeMs: number): void {
    if (!node) return;
    const now = this.context.currentTime;
    node.gain.cancelScheduledValues(now);
    node.gain.setValueAtTime(Math.max(0, node.gain.value), now);
    node.gain.linearRampToValueAtTime(
      Math.max(0, value),
      now + Math.max(0, fadeMs) / 1000,
    );
  }

  private normalizePosition(
    program: AdaptiveSessionProgram,
    positionSeconds: number,
  ): number {
    return Math.min(
      program.plan.totalDurationSeconds - 0.001,
      Math.max(0, positionSeconds),
    );
  }

  private async releaseSourceLeases() {
    const leases = [...this.sourceLeases.values()];
    this.sourceLeases.clear();
    await Promise.allSettled(
      leases.map((lease) => Promise.resolve().then(() => lease.release())),
    );
  }
}
