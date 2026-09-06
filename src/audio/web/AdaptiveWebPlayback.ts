import type { ConsumerAudioWork } from "@/domain/audio/consumerTypes";
import { dbToLinear } from "@/domain/audio/consumerTypes";
import { transitionGains } from "@/domain/sessions/equalPower";
import type {
  AdaptiveSessionProgram,
  AdaptiveSessionSegment,
  NatureMixLevel,
} from "@/domain/sessions/types";
import type { TransitionAudition } from "@/domain/sessions/workbench";
import { positionMediaElement } from "./positionMediaElement";
import {
  awaitWebAudioSource,
  resolveLocalPreviewWork,
  type WebAudioSourceLease,
  type WebAudioWorkSource,
} from "./WebAudioSourceResolver";

const SILENT_GAIN = 0.0001;
const MEDIA_DECK_COUNT = 4;
const USER_GESTURE_CONFIRMATION_TIMEOUT_MS = 10_000;

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
  element: HTMLAudioElement;
  generation: number;
  segmentIndex: number | null;
  source: MediaElementAudioSourceNode;
}

interface SegmentRuntime {
  deck: MediaDeck;
  element: HTMLAudioElement;
  gain: GainNode;
  source: MediaElementAudioSourceNode;
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
  private gestureAbort: AbortController | null = null;
  private timers: ReturnType<typeof setTimeout>[] = [];
  private sessionBus: GainNode | null = null;
  private primaryBus: GainNode | null = null;
  private natureBus: GainNode | null = null;
  private sessionOffsetSeconds = 0;
  private startedAtContextSeconds = 0;
  private playing = false;
  private volume = 0.8;
  private natureLevel: NatureMixLevel = 0;
  private audition: TransitionAudition | null = null;
  private failureReported = false;

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
      if (new Set(program.plan.segments.map(({ workId }) => workId)).size > 8)
        throw new Error(
          "An adaptive program cannot acquire more than eight unique audio files.",
        );
      for (const segment of program.plan.segments) {
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

    const candidates = program.plan.segments
      .filter((segment) => segment.endSeconds > target)
      .sort(
        (left, right) =>
          Math.max(target, left.startSeconds) -
            Math.max(target, right.startSeconds) || left.index - right.index,
      )
      .slice(0, this.decks.size);
    try {
      const preloadResults = await Promise.allSettled(
        candidates.map(({ index }) => this.prime(index, generation)),
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
    if (!this.playing) return;
    this.sessionOffsetSeconds = this.positionSeconds();
    this.playing = false;
    this.clearTimers();
    for (const { element } of this.runtimes.values()) element.pause();
    for (const { element } of this.preloaded.values()) element.pause();
    this.prepared = [...this.runtimes.entries()].flatMap(
      ([segmentIndex, runtime]) => {
        const segment = this.program?.plan.segments.find(
          ({ index }) => index === segmentIndex,
        );
        const work = this.program?.works.find(
          ({ id }) => id === segment?.workId,
        );
        return segment && work
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
      },
    );
    this.preparedPositionSeconds = this.sessionOffsetSeconds;
  }

  async resume(): Promise<void> {
    if (!this.program || this.playing) return;
    await this.context.resume();
    await this.startFrom(this.sessionOffsetSeconds);
  }

  async seek(positionSeconds: number): Promise<void> {
    if (!this.program) throw new Error("No adaptive session is loaded.");
    const target = this.normalizePosition(this.program, positionSeconds);
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

  async configureAudition(audition: TransitionAudition | null): Promise<void> {
    this.audition = audition;
    if (!this.program) return;
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
    this.rampBus(this.primaryBus, gains.primary, fadeMs);
    this.rampBus(this.natureBus, gains.nature, fadeMs);
  }

  positionSeconds(): number {
    if (!this.playing) return this.sessionOffsetSeconds;
    return (
      this.sessionOffsetSeconds +
      (this.context.currentTime - this.startedAtContextSeconds)
    );
  }

  async stop(prepareForReplay = false): Promise<void> {
    this.sourceLoadController?.abort();
    this.gestureAbort?.abort();
    this.gestureAbort = null;
    this.playing = false;
    this.sessionOffsetSeconds = 0;
    this.userGesturePromise = null;
    this.clearTimers();
    this.resetDeckAssignments();
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
    this.sessionBus.gain.value = Math.max(
      0,
      this.volume * this.compositeHeadroomGain(),
    );
    this.sessionOffsetSeconds = target;
    const generation = this.deckGeneration;

    try {
      const prepared = this.prepared;
      this.prepared = [];
      this.preparedPositionSeconds = null;
      this.startedAtContextSeconds = this.context.currentTime;
      this.playing = true;
      for (const item of prepared) {
        this.scheduleEnvelope(
          item.runtime,
          item.segment,
          target,
          item.baseGain,
        );
      }
      const gestureActivation = this.takeUserGesturePromise();
      if (gestureActivation) {
        await gestureActivation;
      } else {
        await Promise.all(
          prepared.map(({ runtime }) => runtime.element.play()),
        );
      }
      const active = new Set(
        [...this.runtimes.values()].map(({ element }) => element),
      );
      for (const { element } of this.decks) {
        if (!active.has(element)) element.pause();
      }
      if (generation !== this.deckGeneration) throw new StalePreparationError();
      this.primeNextUpcoming(target);
    } catch (error) {
      if (generation !== this.deckGeneration) {
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

    for (const segment of program.plan.segments) {
      if (segment.startSeconds > target) {
        this.schedule(segment.startSeconds - target, () => {
          if (generation !== this.deckGeneration) return;
          void this.activate(segment, generation).catch((error) => {
            if (!isStalePreparation(error)) void this.fail(error);
          });
        });
      }
      if (segment.endSeconds > target) {
        this.schedule(segment.endSeconds - target, () => {
          if (generation === this.deckGeneration) this.release(segment.index);
        });
      }
    }

    const stopAt =
      this.audition?.endSeconds ?? program.plan.totalDurationSeconds;
    if (stopAt > target) {
      this.schedule(stopAt - target, () => {
        if (generation !== this.deckGeneration) return;
        if (this.audition && this.playing) {
          void this.restartAudition().catch((error) => {
            if (!isStalePreparation(error)) void this.fail(error);
          });
        } else {
          void this.finish();
        }
      });
    }
  }

  private async activate(
    segment: AdaptiveSessionSegment,
    expectedGeneration = this.deckGeneration,
  ): Promise<void> {
    if (
      !this.playing ||
      expectedGeneration !== this.deckGeneration ||
      this.runtimes.has(segment.index)
    ) {
      return;
    }
    const generation = expectedGeneration;
    const position = this.positionSeconds();
    if (position >= segment.endSeconds) return;
    const prepared = await this.prepare(segment, position, generation);
    await this.alignIncomingToClock(prepared, generation);
    if (
      !this.playing ||
      generation !== this.deckGeneration ||
      this.positionSeconds() >= segment.endSeconds
    ) {
      this.release(segment.index, prepared.runtime);
      return;
    }
    const actualPosition = this.positionSeconds();
    this.scheduleEnvelope(
      prepared.runtime,
      prepared.segment,
      actualPosition,
      prepared.baseGain,
    );
    try {
      await prepared.runtime.element.play();
    } catch (error) {
      if (
        !this.playing ||
        generation !== this.deckGeneration ||
        prepared.runtime.deck.generation !== generation ||
        prepared.runtime.deck.segmentIndex !== segment.index
      ) {
        throw new StalePreparationError();
      }
      throw error;
    }
    if (!this.playing || generation !== this.deckGeneration) {
      this.release(segment.index, prepared.runtime);
      return;
    }
    this.primeNextUpcoming(this.positionSeconds());
  }

  private async alignIncomingToClock(
    prepared: PreparedSegment,
    generation: number,
  ): Promise<void> {
    const { segment, runtime } = prepared;
    const duration = this.program?.works.find(
      ({ id }) => id === segment.workId,
    )?.durationSeconds;
    if (!duration || duration <= 0)
      throw new Error("Incoming source duration is unavailable.");
    const abortController = new AbortController();
    this.positionAborts.set(segment.index, abortController);
    try {
      // A slow seek must not start an incoming deck seconds behind its gain
      // envelope. Retry at most twice; never spin or silently accept drift.
      for (let attempt = 0; attempt <= 2; attempt += 1) {
        if (
          !this.playing ||
          generation !== this.deckGeneration ||
          runtime.deck.segmentIndex !== segment.index
        )
          throw new StalePreparationError();
        const position = this.positionSeconds();
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
      if (generation !== this.deckGeneration || abortController.signal.aborted)
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
    const work = this.program.works.find(({ id }) => id === segment.workId);
    const url = this.urls.get(segment.index);
    if (!work || !url)
      throw new Error(`Missing session work ${segment.workId}.`);
    if (generation !== this.deckGeneration) throw new StalePreparationError();
    await this.prime(segment.index, generation);
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
    const sourcePosition =
      (segment.sourceEntrySeconds +
        Math.max(0, sessionPositionSeconds - segment.startSeconds)) %
      work.durationSeconds;
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
      const baseGain = dbToLinear(work.playbackGainDb + segment.playbackTrimDb);
      gain.gain.value = this.isAuditionMuted(segment.index)
        ? 0
        : Math.max(
            SILENT_GAIN,
            baseGain * this.gainAt(segment.index, sessionPositionSeconds),
          );
      source.connect(gain);
      const output =
        (segment.lane ?? "primary") === "nature"
          ? this.natureBus
          : this.primaryBus;
      if (!output) throw new Error("Adaptive session lane is unavailable.");
      gain.connect(output);
      const runtime = { deck, element, source, gain };
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
    const candidates = program.plan.segments
      .filter((segment) => segment.endSeconds > target)
      .sort(
        (left, right) =>
          Math.max(target, left.startSeconds) -
            Math.max(target, right.startSeconds) || left.index - right.index,
      )
      .slice(0, this.decks.size);

    for (const segment of candidates) {
      const url = this.urls.get(segment.index);
      const deck = this.availableDecks.shift();
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
  ): void {
    if (!this.program) return;
    const now = this.context.currentTime;
    // Pause retains these nodes, but their AudioParam clock keeps running.
    // Remove old curves (including an active curve) before re-anchoring the
    // envelope to the session clock. Never stack resume automation on top.
    runtime.gain.gain.cancelScheduledValues(now);
    if (this.isAuditionMuted(segment.index)) {
      runtime.gain.gain.setValueAtTime(0, now);
      return;
    }
    runtime.gain.gain.setValueAtTime(
      Math.max(SILENT_GAIN, baseGain * this.gainAt(segment.index, position)),
      now,
    );
    const incoming = this.program.plan.transitions.find(
      ({ incomingSegmentIndex }) => incomingSegmentIndex === segment.index,
    );
    const outgoing = this.program.plan.transitions.find(
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
        this.gainAt(segment.index, start + ((end - start) * point) / 64),
      );
      runtime.gain.gain.setValueCurveAtTime(
        multiplyCurve(values, baseGain),
        now + start - position,
        end - start,
      );
    }
  }

  private gainAt(segmentIndex: number, position: number): number {
    if (!this.program) return 0;
    const incoming = this.program.plan.transitions.find(
      ({ incomingSegmentIndex }) => incomingSegmentIndex === segmentIndex,
    );
    const outgoing = this.program.plan.transitions.find(
      ({ outgoingSegmentIndex }) => outgoingSegmentIndex === segmentIndex,
    );
    if (this.isAuditionMuted(segmentIndex)) return 0;
    const segment = this.program.plan.segments.find(
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
    const segment = this.program?.plan.segments.find(
      (candidate) => candidate.index === index,
    );
    const work = this.program?.works.find(
      (candidate) => candidate.id === segment?.workId,
    );
    const sourceLabel = work?.title ?? `Session source ${index}`;
    const lane = segment?.lane ?? "primary";
    const deck = this.availableDecks.shift();
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
        element.load();
        if (element.readyState >= 1) ready();
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
      this.runtimes.size >= MEDIA_DECK_COUNT ||
      this.preloaded.size > 0 ||
      this.availableDecks.length === 0
    ) {
      return;
    }
    const next = this.program.plan.segments
      .filter(
        (segment) =>
          segment.startSeconds > positionSeconds &&
          !this.runtimes.has(segment.index),
      )
      .sort((left, right) => left.startSeconds - right.startSeconds)[0];
    if (!next) return;
    void this.prime(next.index).catch((error) => {
      if (!isStalePreparation(error)) void this.fail(error);
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
    resetRuntime(runtime);
    this.runtimes.delete(index);
    this.recycleDeck(runtime.deck);
    this.primeNextUpcoming(this.positionSeconds());
  }

  private schedule(delaySeconds: number, callback: () => void): void {
    this.timers.push(setTimeout(callback, Math.max(0, delaySeconds * 1000)));
  }

  private clearTimers(): void {
    for (const timer of this.timers) clearTimeout(timer);
    this.timers = [];
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

  private createDeckPool(): void {
    const count = Math.min(
      MEDIA_DECK_COUNT,
      this.program?.plan.segments.length ?? MEDIA_DECK_COUNT,
    );
    for (let index = 0; index < count; index += 1) {
      const element = new Audio();
      element.loop = true;
      element.preload = "metadata";
      const deck = {
        element,
        generation: this.deckGeneration,
        segmentIndex: null,
        source: this.context.createMediaElementSource(element),
      };
      this.decks.add(deck);
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

  private takeUserGesturePromise(): Promise<void> | null {
    const activation = this.userGesturePromise;
    this.userGesturePromise = null;
    return activation;
  }

  private compositeHeadroomGain(): number {
    return dbToLinear(this.program?.plan.compositeHeadroomTrimDb ?? 0);
  }

  private laneGains(): { primary: number; nature: number } {
    if (!this.program?.plan.natureMix) return { primary: 1, nature: 0 };
    return {
      primary: 0.5,
      nature: this.natureLevel * 0.5,
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
