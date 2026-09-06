import type { AudioContext, GainNode } from "react-native-audio-api";
import { dbToLinear } from "@/domain/audio/consumerTypes";
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

  constructor(
    private readonly context: AudioContext,
    private readonly destination: GainNode,
    private readonly resolver: NativeAudioSourceResolver,
    private readonly handlers: Handlers,
  ) {}

  async load(program: AdaptiveSessionProgram): Promise<void> {
    await this.stop();
    this.validate(program);
    const generation = this.generation;
    try {
      for (const workId of new Set(
        program.plan.segments.map((segment) => segment.workId),
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
    try {
      await this.prepareAt(positionSeconds);
      this.begin();
    } catch (error) {
      await this.stop();
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
    try {
      await this.prepareAt(positionSeconds);
      if (resume) this.begin();
      else await this.context.suspend();
    } catch (error) {
      await this.stop();
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
    this.ramp(this.natureBus, this.natureLevel, fadeMs);
  }

  async stop(): Promise<void> {
    this.generation += 1;
    this.running = false;
    this.clearTimer();
    for (const preparation of this.preparations) preparation.abort();
    this.preparations.clear();
    this.clearGraph();
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
        natureIds.size !== 2 ||
        !["rain", "sea"].includes(plan.natureMix.selectedFamily) ||
        [...natureIds].some((id) => !plan.natureMix!.natureWorkIds.includes(id))
      ) {
        throw new Error(
          "A native nature lane requires exactly two recordings from the planned family.",
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
        work.listeningStatus !== "APPROVED — LISTENING PASSED"
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
    this.natureBus.gain.value = this.natureLevel;
    this.natureBus.connect(this.sessionBus);
    await this.context.resume();
    const candidates = program.plan.segments
      .filter((segment) => segment.endSeconds > target)
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
  ): Promise<void> {
    const program = this.program!;
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
      runtime.output.connect(gain);
      gain.connect(
        segment.lane === "nature" ? this.natureBus! : this.sessionBus!,
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

  private schedule(deck: Deck): void {
    const { segment } = deck;
    const position = Math.max(this.offsetSeconds, segment.startSeconds);
    const startsAt = this.originSeconds + position;
    if (startsAt < this.context.currentTime - 0.05)
      throw new Error(
        "Native preload missed the scheduled transition; playback stopped.",
      );
    const work = this.program!.works.find(
      (candidate) => candidate.id === segment.workId,
    )!;
    const base = dbToLinear(work.playbackGainDb + segment.playbackTrimDb);
    const transitions = this.program!.plan.transitions.filter(
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
      deck.gain.gain.setValueCurveAtTime(
        curve,
        this.originSeconds + from,
        to - from,
      );
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
          segment.endSeconds > position && !this.decks.has(segment.index),
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
    for (const bus of [this.natureBus, this.sessionBus]) {
      try {
        bus?.disconnect();
      } catch {
        /* Already disconnected. */
      }
    }
    this.natureBus = null;
    this.sessionBus = null;
  }

  private maxDecks(): number {
    return this.program?.plan.natureMix ? 3 : 2;
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
