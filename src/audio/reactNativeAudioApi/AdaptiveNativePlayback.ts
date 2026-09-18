import type { AudioContext, GainNode } from "react-native-audio-api";
import { dbToLinear } from "@/domain/audio/consumerTypes";
import { HATHA_AUDIO_WORKS } from "@/content/hathaCatalog";
import { SESSION_WORK_PROFILES } from "@/content/sessionWorkProfiles";
import { transitionGains } from "@/domain/sessions/equalPower";
import type {
  AdaptiveSessionProgram,
  AdaptiveSessionSegment,
} from "@/domain/sessions/types";
import {
  assertVerifiedNativeAudioFile,
  type NativeAudioSourceResolver,
  type VerifiedNativeAudioFile,
} from "./NativeAudioSourceResolver";
import {
  createStreamingStemSource,
  prepareStreamingFilePosition,
  stopStreamingStemSource,
  type StreamingStemSource,
} from "./StreamingStemSource";

interface Deck extends StreamingStemSource {
  gain: GainNode;
  segment: AdaptiveSessionSegment;
  lastPosition: number;
  lastProgressAt: number;
  scheduled: boolean;
}

interface Handlers {
  ended(): void;
  error(error: Error): void;
}

/** Bounded native scheduler. Rolling preparation needs JS; a missed deadline
 * fails closed. Native gain/stop automation does not depend on a JS timer.
 * Device/background readiness must not be inferred from this implementation.
 */
export class AdaptiveNativePlayback {
  private program: AdaptiveSessionProgram | null = null;
  private readonly files = new Map<string, VerifiedNativeAudioFile>();
  private readonly decks = new Map<number, Deck>();
  private readonly preparations = new Set<AbortController>();
  private generation = 0;
  private timer: ReturnType<typeof setTimeout> | null = null;
  private running = false;
  private offsetSeconds = 0;
  private originSeconds = 0;
  private volume = 0.8;
  private natureLevel = 0;
  private sessionBus: GainNode | null = null;
  private natureBus: GainNode | null = null;
  private primaryBus: GainNode | null = null;
  private changingNature = false;
  private skippedNatureIndexes = new Set<number>();

  constructor(
    private readonly context: AudioContext,
    private readonly destination: GainNode,
    private readonly resolver: NativeAudioSourceResolver,
    private readonly handlers: Handlers,
    private readonly policy: { allowHathaPreview?: boolean } = {},
  ) {}

  async load(program: AdaptiveSessionProgram): Promise<void> {
    const stopping = this.stop();
    const generation = this.generation;
    await stopping;
    if (generation !== this.generation)
      throw new Error("Native load cancelled.");
    this.validate(program);
    try {
      for (const workId of new Set(
        program.plan.segments
          .filter(
            (s) =>
              s.lane !== "nature" || program.plan.natureMix?.enabled !== false,
          )
          .map((segment) => segment.workId),
      )) {
        const file = await this.resolver.acquire(workId);
        if (!file)
          throw new Error(`No verified downloaded file for ${workId}.`);
        try {
          assertVerifiedNativeAudioFile(file, workId);
          if (generation !== this.generation)
            throw new Error("Native load cancelled.");
        } catch (error) {
          await file.release();
          throw error;
        }
        this.files.set(workId, file);
      }
      this.program = program;
      this.natureLevel = program.plan.natureMix?.initialLevel ?? 0;
    } catch (error) {
      if (generation === this.generation) await this.stop();
      throw error;
    }
  }

  async start(volume: number, positionSeconds = 0): Promise<void> {
    if (!this.program) throw new Error("No native adaptive program is loaded.");
    this.volume = this.level(volume);
    const preparing = this.prepareAt(positionSeconds);
    const generation = this.generation;
    try {
      await preparing;
      this.begin();
    } catch (error) {
      if (generation === this.generation) await this.stop();
      throw error;
    }
  }

  pause(): void {
    this.offsetSeconds = this.positionSeconds();
    this.running = false;
    this.generation += 1;
    this.clearTimer();
    for (const preparation of this.preparations) preparation.abort();
    for (const deck of [...this.decks.values()])
      if (!deck.scheduled) this.retire(deck);
    // The owner suspends AudioContext. All source/gain timestamps share its
    // frozen clock, so no wall-time rebasing or source restart is necessary.
  }

  resume(): void {
    if (!this.program || this.decks.size === 0) return;
    if ([...this.decks.values()].every((deck) => !deck.scheduled)) {
      this.begin();
      return;
    }
    this.running = true;
    this.tick();
  }

  async seek(positionSeconds: number): Promise<void> {
    const resume = this.running;
    const preparing = this.prepareAt(positionSeconds);
    const generation = this.generation;
    try {
      await preparing;
      if (resume) this.begin();
      else await this.context.suspend();
    } catch (error) {
      if (generation === this.generation) await this.stop();
      throw error;
    }
  }

  positionSeconds(): number {
    return this.running
      ? Math.max(
          this.offsetSeconds,
          this.context.currentTime - this.originSeconds,
        )
      : this.offsetSeconds;
  }

  setVolume(volume: number, fadeMs: number): void {
    this.volume = this.level(volume);
    this.ramp(
      this.sessionBus,
      this.volume * dbToLinear(this.program?.plan.compositeHeadroomTrimDb ?? 0),
      fadeMs,
    );
  }

  setNatureLevel(level: number, fadeMs: number): void {
    if (!this.program?.plan.natureMix)
      throw new Error("This session has no nature lane.");
    this.natureLevel = this.level(level);
    this.ramp(
      this.natureBus,
      this.program.plan.natureMix.enabled === false
        ? 0
        : this.natureLevel * 0.5,
      fadeMs,
    );
  }

  /** Transaction on the nature lane only. Music keeps its original native
   * nodes, clock, automation and notification session. One temporary decoder
   * (four maximum) is permitted to verify the replacement before retiring it. */
  async replaceNatureFamily(
    next: AdaptiveSessionProgram,
    signal: AbortSignal,
  ): Promise<void> {
    const previous = this.program;
    if (
      !previous?.plan.natureMix ||
      !next.plan.natureMix ||
      !this.running ||
      this.changingNature
    )
      throw new Error("Live ambience is unavailable for this session.");
    const music = (p: AdaptiveSessionProgram) =>
      JSON.stringify({
        id: p.plan.id,
        seed: p.plan.seed,
        length: p.plan.totalDurationSeconds,
        trim: p.plan.compositeHeadroomTrimDb,
        segments: p.plan.segments.filter((s) => s.lane !== "nature"),
        transitions: p.plan.transitions.filter((t) => t.lane !== "nature"),
      });
    if (music(previous) !== music(next))
      throw new Error("Ambience must preserve music and the session clock.");
    this.validate(next);
    const generation = this.generation;
    const acquired: string[] = [];
    let staged: Deck | undefined;
    let committed = false;
    this.changingNature = true;
    const assertCurrent = () => {
      if (
        signal.aborted ||
        !this.running ||
        generation !== this.generation ||
        this.program !== previous
      )
        throw new Error("Ambience change cancelled.");
    };
    const wait = (ms: number) =>
      new Promise<void>((resolve, reject) => {
        const cancel = () => {
          clearTimeout(timer);
          signal.removeEventListener("abort", cancel);
          reject(new Error("Ambience change cancelled."));
        };
        const timer = setTimeout(() => {
          signal.removeEventListener("abort", cancel);
          resolve();
        }, ms);
        signal.addEventListener("abort", cancel, { once: true });
        if (signal.aborted) cancel();
      });
    try {
      assertCurrent();
      if (next.plan.natureMix.enabled !== false) {
        for (const id of next.plan.natureMix.natureWorkIds) {
          if (this.files.has(id)) continue;
          const file = await this.resolver.acquire(id);
          if (!file)
            throw new Error("Download this ambience first. Music continues.");
          try {
            assertVerifiedNativeAudioFile(file, id);
            assertCurrent();
          } catch (error) {
            await file.release();
            throw error;
          }
          this.files.set(id, file);
          acquired.push(id);
        }
        // A family change is never allowed to weaken the overlap peak bound.
        const position = this.positionSeconds() + 0.5;
        const targets = next.plan.segments.filter(
          (s) =>
            s.lane === "nature" &&
            s.startSeconds <= position &&
            s.endSeconds > position,
        );
        targets.sort((a, b) => b.startSeconds - a.startSeconds);
        if (!targets.length)
          throw new Error(
            "No ambience is available at this position. Music continues.",
          );
        for (const deck of [...this.decks.values()])
          if (
            deck.segment.lane === "nature" &&
            deck.segment.startSeconds > this.positionSeconds()
          )
            this.retire(deck);
        const target = targets[0];
        const temp = {
          ...target,
          index:
            Math.max(
              ...previous.plan.segments.map((s) => s.index),
              ...next.plan.segments.map((s) => s.index),
            ) + 1,
        };
        await this.prepare(temp, position, generation, next);
        assertCurrent();
        staged = this.decks.get(temp.index)!;
        // Stop-before-start on the nature bus avoids summing old/new families.
        this.ramp(this.natureBus, 0, 250);
        await wait(250);
        assertCurrent();
        this.schedule(staged, position, next, target);
        for (const deck of [...this.decks.values()])
          if (deck !== staged && deck.segment.lane === "nature")
            this.retire(deck);
        this.decks.delete(temp.index);
        staged.segment = target;
        this.decks.set(target.index, staged);
        this.skippedNatureIndexes = new Set(
          targets.slice(1).map((segment) => segment.index),
        );
      } else {
        this.ramp(this.natureBus, 0, 250);
        await wait(250);
        assertCurrent();
        for (const deck of [...this.decks.values()])
          if (deck.segment.lane === "nature") this.retire(deck);
      }
      this.program = next;
      committed = true;
      this.ramp(
        this.natureBus,
        next.plan.natureMix.enabled === false ? 0 : this.natureLevel * 0.5,
        1200,
      );
      const retained = new Set(
        next.plan.segments
          .filter(
            (s) =>
              s.lane !== "nature" || next.plan.natureMix?.enabled !== false,
          )
          .map((s) => s.workId),
      );
      for (const [id, file] of this.files)
        if (!retained.has(id)) {
          this.files.delete(id);
          await Promise.resolve(file.release()).catch(() => undefined);
        }
    } finally {
      if (!committed) {
        if (staged) this.retire(staged);
        for (const id of acquired) {
          const file = this.files.get(id);
          this.files.delete(id);
          await Promise.resolve(file?.release()).catch(() => undefined);
        }
        if (this.program === previous)
          this.ramp(
            this.natureBus,
            previous.plan.natureMix.enabled === false
              ? 0
              : this.natureLevel * 0.5,
            250,
          );
      }
      this.changingNature = false;
    }
  }

  async stop(): Promise<void> {
    this.generation += 1;
    this.running = false;
    this.clearTimer();
    for (const preparation of this.preparations) preparation.abort();
    this.preparations.clear();
    this.clearGraph();
    this.skippedNatureIndexes.clear();
    this.program = null;
    this.offsetSeconds = 0;
    const files = [...this.files.values()];
    this.files.clear();
    const releases = await Promise.allSettled(
      files.map((file) => Promise.resolve().then(() => file.release())),
    );
    const failure = releases.find((result) => result.status === "rejected");
    if (failure?.status === "rejected")
      throw new Error(
        "Audio stopped, but a local file lease could not be released.",
      );
  }

  private validate(program: AdaptiveSessionProgram): void {
    const plan = program.plan;
    if (
      !Number.isFinite(plan.totalDurationSeconds) ||
      plan.totalDurationSeconds <= 0 ||
      !plan.segments.length ||
      !Number.isFinite(plan.compositeHeadroomTrimDb ?? 0) ||
      (plan.compositeHeadroomTrimDb ?? 0) > 0
    ) {
      throw new Error("The native session timeline is invalid.");
    }
    if (plan.natureMix) {
      const natureIds = new Set(
        plan.segments
          .filter((segment) => segment.lane === "nature")
          .map((segment) => segment.workId),
      );
      if (
        natureIds.size < 2 ||
        !["rain", "sea"].includes(plan.natureMix.selectedFamily) ||
        natureIds.size !== new Set(plan.natureMix.natureWorkIds).size ||
        [...natureIds].some(
          (id) =>
            !plan.natureMix!.natureWorkIds.includes(id) ||
            SESSION_WORK_PROFILES.find((profile) => profile.work.id === id)
              ?.aestheticFamily !== plan.natureMix!.selectedFamily,
        )
      ) {
        throw new Error(
          "A native nature lane requires verified recordings from the planned family.",
        );
      }
      this.level(plan.natureMix.initialLevel);
    }
    const indexes = new Set<number>();
    for (const segment of plan.segments) {
      const work = program.works.find(
        (candidate) => candidate.id === segment.workId,
      );
      if (
        !work ||
        work.sourceKind !== "file" ||
        !Number.isFinite(work.durationSeconds) ||
        work.durationSeconds <= 0 ||
        !Number.isFinite(work.playbackGainDb) ||
        (work.listeningStatus !== "APPROVED — LISTENING PASSED" &&
          !(
            this.policy.allowHathaPreview &&
            HATHA_AUDIO_WORKS.some(
              (hatha) =>
                hatha.id === work.id &&
                hatha.frameCount === work.frameCount &&
                hatha.provenance.packId === work.provenance.packId &&
                work.listeningStatus ===
                  "PROVISIONAL — LISTENING APPROVAL REQUIRED",
            )
          ))
      ) {
        throw new Error(
          `Native session source ${segment.workId} is not an approved file.`,
        );
      }
      if (
        indexes.has(segment.index) ||
        ![
          segment.startSeconds,
          segment.endSeconds,
          segment.sourceEntrySeconds,
          segment.playbackTrimDb,
          segment.finalEnvelopeSeconds,
        ].every(Number.isFinite) ||
        segment.startSeconds < 0 ||
        segment.endSeconds <= segment.startSeconds ||
        segment.endSeconds > plan.totalDurationSeconds ||
        segment.sourceEntrySeconds < 0 ||
        segment.finalEnvelopeSeconds < 0 ||
        segment.playbackTrimDb > 0
      ) {
        throw new Error("The native session segment is invalid.");
      }
      indexes.add(segment.index);
    }
    for (const transition of plan.transitions) {
      const outgoing = plan.segments.find(
        (segment) => segment.index === transition.outgoingSegmentIndex,
      );
      const incoming = plan.segments.find(
        (segment) => segment.index === transition.incomingSegmentIndex,
      );
      if (
        !outgoing ||
        !incoming ||
        outgoing.lane !== incoming.lane ||
        ![
          transition.startSeconds,
          transition.endSeconds,
          transition.durationSeconds,
        ].every(Number.isFinite) ||
        transition.durationSeconds <= 0 ||
        Math.abs(
          transition.endSeconds -
            transition.startSeconds -
            transition.durationSeconds,
        ) > 0.0001 ||
        transition.startSeconds !== incoming.startSeconds ||
        transition.endSeconds !== outgoing.endSeconds ||
        !["linear", "equal-power"].includes(transition.curve)
      ) {
        throw new Error("The native transition contract is invalid.");
      }
    }
    const boundaries = [
      ...new Set([
        0,
        plan.totalDurationSeconds,
        ...plan.segments.flatMap((segment) => [
          segment.startSeconds,
          segment.endSeconds,
        ]),
      ]),
    ].sort((a, b) => a - b);
    for (let index = 0; index < boundaries.length - 1; index += 1) {
      const position = (boundaries[index] + boundaries[index + 1]) / 2;
      const active = plan.segments.filter(
        (segment) =>
          segment.startSeconds <= position && position < segment.endSeconds,
      );
      const primary = active.filter((segment) => segment.lane !== "nature");
      const nature = active.filter((segment) => segment.lane === "nature");
      if (
        active.length > (plan.natureMix ? 3 : 2) ||
        primary.length === 0 ||
        primary.length > 2 ||
        nature.length > (plan.natureMix ? 2 : 0) ||
        (plan.natureMix && nature.length === 0)
      ) {
        throw new Error(
          "Native session exceeds its coordinated lane/source limit or has a gap.",
        );
      }
    }
  }

  private async prepareAt(positionSeconds: number): Promise<void> {
    this.skippedNatureIndexes.clear();
    const program = this.program;
    if (!program || !Number.isFinite(positionSeconds))
      throw new Error("Invalid native seek position.");
    this.generation += 1;
    this.running = false;
    this.clearTimer();
    for (const preparation of this.preparations) preparation.abort();
    this.clearGraph();
    const generation = this.generation;
    const target = Math.max(
      0,
      Math.min(program.plan.totalDurationSeconds - 0.001, positionSeconds),
    );
    this.offsetSeconds = target;
    this.sessionBus = this.context.createGain();
    this.sessionBus.gain.value = 0;
    this.sessionBus.connect(this.destination);
    this.natureBus = this.context.createGain();
    this.natureBus.gain.value =
      program.plan.natureMix && program.plan.natureMix.enabled !== false
        ? this.natureLevel * 0.5
        : 0;
    this.natureBus.connect(this.sessionBus);
    this.primaryBus = this.context.createGain();
    this.primaryBus.gain.value = program.plan.natureMix ? 0.5 : 1;
    this.primaryBus.connect(this.sessionBus);
    await this.context.resume();
    if (generation !== this.generation)
      throw new Error("Native preparation cancelled.");
    const candidates = program.plan.segments
      .filter(
        (segment) =>
          this.enabledSegment(segment) && segment.endSeconds > target,
      )
      .sort((a, b) => a.startSeconds - b.startSeconds || a.index - b.index);
    const active = candidates.filter(
      (segment) => segment.startSeconds <= target,
    );
    const upcoming = candidates.find(
      (segment) => segment.startSeconds > target,
    );
    const initial = [...active];
    if (upcoming && initial.length < this.maxDecks()) initial.push(upcoming);
    const results = await Promise.allSettled(
      initial.map((segment) => this.prepare(segment, target, generation)),
    );
    const failure = results.find((result) => result.status === "rejected");
    if (failure?.status === "rejected") throw failure.reason;
    if (generation !== this.generation)
      throw new Error("Native preparation cancelled.");
  }

  private async prepare(
    segment: AdaptiveSessionSegment,
    position: number,
    generation: number,
    program = this.program!,
  ): Promise<void> {
    const work = program.works.find(
      (candidate) => candidate.id === segment.workId,
    )!;
    const file = this.files.get(work.id);
    if (!file || this.decks.size >= this.maxDecks())
      throw new Error(
        "Native source preload has no verified file or decoder slot.",
      );
    const runtime = createStreamingStemSource(this.context, file.uri);
    let gain: GainNode;
    try {
      gain = this.context.createGain();
    } catch (error) {
      stopStreamingStemSource(runtime);
      throw error;
    }
    gain.gain.value = 0;
    const deck: Deck = {
      ...runtime,
      gain,
      segment,
      lastPosition: 0,
      lastProgressAt: 0,
      scheduled: false,
    };
    this.decks.set(segment.index, deck);
    const abort = new AbortController();
    this.preparations.add(abort);
    try {
      // Construct every initial decoder before starting any of their strict
      // 100 ms position-confirmation windows across the native bridge.
      await Promise.resolve();
      if (generation !== this.generation || abort.signal.aborted)
        throw new Error("Native preparation cancelled.");
      runtime.output.connect(gain);
      gain.connect(
        segment.lane === "nature" ? this.natureBus! : this.primaryBus!,
      );
      const sourcePosition =
        (segment.sourceEntrySeconds +
          Math.max(0, position - segment.startSeconds)) %
        work.durationSeconds;
      await prepareStreamingFilePosition(
        this.context,
        runtime,
        sourcePosition,
        work.durationSeconds,
        abort.signal,
      );
      if (generation !== this.generation)
        throw new Error("Native preparation cancelled.");
      deck.lastPosition = runtime.source.currentTime;
    } catch (error) {
      this.retire(deck);
      throw error;
    } finally {
      this.preparations.delete(abort);
    }
  }

  private begin(): void {
    this.originSeconds = this.context.currentTime + 0.1 - this.offsetSeconds;
    for (const deck of this.decks.values()) this.schedule(deck);
    this.running = true;
    const startAt = this.originSeconds + this.offsetSeconds;
    const bus = this.sessionBus!.gain;
    const target =
      this.volume * dbToLinear(this.program!.plan.compositeHeadroomTrimDb ?? 0);
    bus.setValueAtTime(0, this.context.currentTime);
    bus.setValueAtTime(0, startAt);
    bus.linearRampToValueAtTime(
      target,
      startAt +
        Math.min(
          this.program!.fadeInSeconds,
          this.program!.plan.totalDurationSeconds - this.offsetSeconds,
        ),
    );
    this.tick();
  }

  private schedule(
    deck: Deck,
    atPosition?: number,
    program = this.program!,
    segment = deck.segment,
  ): void {
    const position =
      atPosition ?? Math.max(this.offsetSeconds, segment.startSeconds);
    const startsAt = this.originSeconds + position;
    if (startsAt < this.context.currentTime - 0.05)
      throw new Error(
        "Native preload missed the scheduled transition; playback stopped.",
      );
    const work = program.works.find(
      (candidate) => candidate.id === segment.workId,
    )!;
    const base = dbToLinear(work.playbackGainDb + segment.playbackTrimDb);
    const transitions = program.plan.transitions.filter(
      (transition) =>
        transition.incomingSegmentIndex === segment.index ||
        transition.outgoingSegmentIndex === segment.index,
    );
    const boundaries = [
      ...new Set([
        position,
        segment.endSeconds,
        ...transitions.flatMap((transition) => [
          transition.startSeconds,
          transition.endSeconds,
        ]),
        segment.endSeconds - segment.finalEnvelopeSeconds,
      ]),
    ]
      .filter((value) => value >= position && value <= segment.endSeconds)
      .sort((a, b) => a - b);
    let previousCurveEnd = -Infinity;
    for (let index = 0; index < boundaries.length - 1; index += 1) {
      const from = boundaries[index];
      const to = boundaries[index + 1];
      if (to <= from) continue;
      const curve = Float32Array.from({ length: 65 }, (_, point) => {
        const time = from + ((to - from) * point) / 64;
        let value = base;
        for (const transition of transitions) {
          const progress =
            (time - transition.startSeconds) / transition.durationSeconds;
          const gains = transitionGains(progress, transition.curve);
          value *=
            transition.incomingSegmentIndex === segment.index
              ? gains.incoming
              : gains.outgoing;
        }
        if (segment.finalEnvelopeSeconds > 0)
          value *= transitionGains(
            (time - segment.endSeconds + segment.finalEnvelopeSeconds) /
              segment.finalEnvelopeSeconds,
            "equal-power",
          ).outgoing;
        return value;
      });
      // RNAA rejects ANY curve overlap. Computing a relative duration and an
      // absolute start separately can place the reconstructed end one ULP past
      // the next start. Chain the actual absolute ends instead: no tolerance is
      // removed, and any boundary adjustment is only floating-point roundoff.
      const curveStart = Math.max(this.originSeconds + from, previousCurveEnd);
      const curveDuration = this.originSeconds + to - curveStart;
      if (!(curveDuration > 0))
        throw new Error("Native gain automation has an invalid interval.");
      deck.gain.gain.setValueCurveAtTime(curve, curveStart, curveDuration);
      previousCurveEnd = curveStart + curveDuration;
    }
    deck.source.start(startsAt);
    deck.source.stop(this.originSeconds + segment.endSeconds);
    deck.lastProgressAt = startsAt;
    deck.scheduled = true;
  }

  private tick(): void {
    if (!this.running || !this.program) return;
    const generation = this.generation;
    void this.reconcile(generation)
      .then(() => {
        if (generation === this.generation && this.running)
          this.timer = setTimeout(() => this.tick(), 100);
      })
      .catch(async (error: unknown) => {
        if (generation !== this.generation) return;
        try {
          await this.stop();
        } catch {
          /* Audio graph is already silent. */
        }
        this.handlers.error(
          error instanceof Error ? error : new Error("Native playback failed."),
        );
      });
  }

  private async reconcile(generation: number): Promise<void> {
    const program = this.program!;
    const position = this.positionSeconds();
    if (position >= program.plan.totalDurationSeconds) {
      await this.stop();
      this.handlers.ended();
      return;
    }
    for (const deck of [...this.decks.values()]) {
      if (deck.segment.endSeconds <= position) this.retire(deck);
      else if (deck.segment.startSeconds <= position && deck.scheduled) {
        const current = deck.source.currentTime;
        if (!Number.isFinite(current))
          throw new Error("Native decoder returned an invalid position.");
        if (Math.abs(current - deck.lastPosition) > 0.001) {
          deck.lastPosition = current;
          deck.lastProgressAt = this.context.currentTime;
        } else if (this.context.currentTime - deck.lastProgressAt > 5)
          throw new Error("Native decoder stopped progressing.");
      }
    }
    const pending = program.plan.segments
      .filter(
        (segment) =>
          this.enabledSegment(segment) &&
          !(this.changingNature && segment.lane === "nature") &&
          !this.skippedNatureIndexes.has(segment.index) &&
          segment.endSeconds > position &&
          !this.decks.has(segment.index),
      )
      .sort((a, b) => a.startSeconds - b.startSeconds || a.index - b.index);
    const next = pending[0];
    if (!next) return;
    if (next.startSeconds <= position)
      throw new Error("Native scheduler missed a source deadline.");
    if (this.decks.size < this.maxDecks()) {
      await this.prepare(next, position, generation);
      if (generation === this.generation)
        this.schedule(this.decks.get(next.index)!);
    }
  }

  private retire(deck: Deck): void {
    stopStreamingStemSource(deck);
    try {
      deck.gain.disconnect();
    } catch {
      /* Continue graph cleanup. */
    }
    if (this.decks.get(deck.segment.index) === deck)
      this.decks.delete(deck.segment.index);
  }

  private enabledSegment(segment: AdaptiveSessionSegment): boolean {
    return (
      segment.lane !== "nature" ||
      this.program?.plan.natureMix?.enabled !== false
    );
  }

  private clearGraph(): void {
    try {
      if (this.sessionBus) {
        this.sessionBus.gain.cancelScheduledValues(this.context.currentTime);
        this.sessionBus.gain.setValueAtTime(0, this.context.currentTime);
      }
    } catch {
      /* Source pause/disconnection must still run after a graph error. */
    }
    for (const deck of [...this.decks.values()]) this.retire(deck);
    for (const bus of [this.natureBus, this.primaryBus, this.sessionBus]) {
      try {
        bus?.disconnect();
      } catch {
        /* Already disconnected. */
      }
    }
    this.natureBus = null;
    this.primaryBus = null;
    this.sessionBus = null;
  }

  private maxDecks(): number {
    if (this.changingNature) return 4;
    return this.program?.plan.natureMix &&
      this.program.plan.natureMix.enabled !== false
      ? 3
      : 2;
  }
  private clearTimer(): void {
    if (this.timer) clearTimeout(this.timer);
    this.timer = null;
  }
  private level(value: number): number {
    if (!Number.isFinite(value)) throw new Error("Audio level must be finite.");
    return Math.min(1, Math.max(0, value));
  }
  private ramp(node: GainNode | null, value: number, fadeMs: number): void {
    if (!node) return;
    const now = this.context.currentTime;
    node.gain.cancelAndHoldAtTime(now);
    if (fadeMs > 0)
      node.gain.linearRampToValueAtTime(value, now + fadeMs / 1000);
    else node.gain.setValueAtTime(value, now);
  }
}
