import { Asset } from "expo-asset";
import { CONSUMER_ASSETS } from "@/audio/reactNativeAudioApi/consumerAssets";
import { dbToLinear } from "@/domain/audio/consumerTypes";
import { buildGainCurve, transitionGains } from "@/domain/sessions/equalPower";
import type {
  AdaptiveSessionProgram,
  AdaptiveSessionSegment,
} from "@/domain/sessions/types";
import type { TransitionAudition } from "@/domain/sessions/workbench";

const SILENT_GAIN = 0.0001;

interface SegmentRuntime {
  element: HTMLAudioElement;
  source: MediaElementAudioSourceNode;
  gain: GainNode;
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
  private readonly preloaded = new Map<number, HTMLAudioElement>();
  private readonly preloadPromises = new Map<number, Promise<void>>();
  private readonly runtimes = new Map<number, SegmentRuntime>();
  private timers: ReturnType<typeof setTimeout>[] = [];
  private sessionBus: GainNode | null = null;
  private sessionOffsetSeconds = 0;
  private startedAtContextSeconds = 0;
  private playing = false;
  private volume = 0.8;
  private audition: TransitionAudition | null = null;
  private failureReported = false;

  constructor(
    private readonly context: AudioContext,
    private readonly destination: AudioNode,
    private readonly handlers: AdaptiveWebPlaybackHandlers,
  ) {}

  async load(program: AdaptiveSessionProgram): Promise<void> {
    await this.stop();
    this.program = program;
    this.urls.clear();
    for (const segment of program.plan.segments) {
      const work = program.works.find(({ id }) => id === segment.workId);
      if (!work || work.sourceKind !== "file") {
        throw new Error(`Session source ${segment.workId} is unavailable.`);
      }
      const descriptor = CONSUMER_ASSETS[work.assetKey];
      const url = descriptor
        ? Asset.fromModule(descriptor.moduleId).uri
        : work.availability === "local-preview-file" &&
            work.localPreviewFilename
          ? `/audio-catalog/${encodeURIComponent(work.localPreviewFilename)}`
          : null;
      if (!url) {
        throw new Error(
          `${work.title} needs a verified local or downloaded file.`,
        );
      }
      this.urls.set(segment.index, url);
    }
    await Promise.all(
      program.plan.segments.map(({ index }) => this.prime(index)),
    );
  }

  async start(
    program: AdaptiveSessionProgram,
    volume: number,
    positionSeconds = 0,
  ): Promise<void> {
    if (this.program?.plan.id !== program.plan.id) await this.load(program);
    await Promise.all(
      program.plan.segments.map(({ index }) => this.prime(index)),
    );
    this.failureReported = false;
    this.volume = Math.min(1, Math.max(0, volume));
    await this.context.resume();
    await this.startFrom(positionSeconds);
  }

  async pause(): Promise<void> {
    if (!this.playing) return;
    this.sessionOffsetSeconds = this.positionSeconds();
    this.playing = false;
    this.clearTimers();
    this.clearRuntimes();
  }

  async resume(): Promise<void> {
    if (!this.program || this.playing) return;
    await this.context.resume();
    await this.startFrom(this.sessionOffsetSeconds);
  }

  async seek(positionSeconds: number): Promise<void> {
    if (!this.program) throw new Error("No adaptive session is loaded.");
    const target = Math.min(
      this.program.plan.totalDurationSeconds - 0.001,
      Math.max(0, positionSeconds),
    );
    const restart = this.playing;
    this.playing = false;
    this.clearTimers();
    this.clearRuntimes();
    this.sessionOffsetSeconds = target;
    if (restart) await this.startFrom(target);
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
  }

  setVolume(volume: number, fadeMs: number): void {
    this.volume = Math.min(1, Math.max(0, volume));
    if (!this.sessionBus) return;
    const now = this.context.currentTime;
    this.sessionBus.gain.cancelScheduledValues(now);
    this.sessionBus.gain.setValueAtTime(
      Math.max(SILENT_GAIN, this.sessionBus.gain.value),
      now,
    );
    this.sessionBus.gain.linearRampToValueAtTime(
      Math.max(SILENT_GAIN, this.volume),
      now + Math.max(0, fadeMs) / 1000,
    );
  }

  positionSeconds(): number {
    if (!this.playing) return this.sessionOffsetSeconds;
    return (
      this.sessionOffsetSeconds +
      (this.context.currentTime - this.startedAtContextSeconds)
    );
  }

  async stop(): Promise<void> {
    this.playing = false;
    this.sessionOffsetSeconds = 0;
    this.clearTimers();
    this.clearRuntimes();
    for (const element of this.preloaded.values()) element.pause();
    this.preloaded.clear();
    this.preloadPromises.clear();
    this.sessionBus?.disconnect();
    this.sessionBus = null;
  }

  private async startFrom(positionSeconds: number): Promise<void> {
    const program = this.program;
    if (!program) throw new Error("No adaptive session is loaded.");
    this.clearTimers();
    this.clearRuntimes();
    this.sessionBus?.disconnect();
    this.sessionBus = this.context.createGain();
    this.sessionBus.gain.value = Math.max(SILENT_GAIN, this.volume);
    this.sessionBus.connect(this.destination);
    this.sessionOffsetSeconds = positionSeconds;
    this.startedAtContextSeconds = this.context.currentTime;
    this.playing = true;

    const initial = program.plan.segments.filter(
      (segment) =>
        positionSeconds >= segment.startSeconds &&
        positionSeconds < segment.endSeconds,
    );
    await Promise.all(
      initial.map((segment) => this.activate(segment, positionSeconds)),
    );

    for (const segment of program.plan.segments) {
      if (segment.startSeconds > positionSeconds) {
        this.schedule(segment.startSeconds - positionSeconds, () => {
          void this.activate(segment, segment.startSeconds).catch((error) =>
            this.fail(error),
          );
        });
      }
      if (segment.endSeconds > positionSeconds) {
        this.schedule(segment.endSeconds - positionSeconds, () => {
          this.release(segment.index);
        });
      }
    }

    const stopAt =
      this.audition?.endSeconds ?? program.plan.totalDurationSeconds;
    if (stopAt > positionSeconds) {
      this.schedule(stopAt - positionSeconds, () => {
        if (this.audition && this.playing) {
          void this.startFrom(this.audition.startSeconds).catch((error) =>
            this.fail(error),
          );
        } else {
          void this.finish();
        }
      });
    }
  }

  private async activate(
    segment: AdaptiveSessionSegment,
    sessionPositionSeconds: number,
  ): Promise<void> {
    if (!this.program || this.runtimes.has(segment.index) || !this.sessionBus) {
      return;
    }
    const work = this.program.works.find(({ id }) => id === segment.workId);
    const url = this.urls.get(segment.index);
    if (!work || !url)
      throw new Error(`Missing session work ${segment.workId}.`);
    await this.prime(segment.index);
    const element = this.preloaded.get(segment.index) ?? new Audio(url);
    this.preloaded.delete(segment.index);
    this.preloadPromises.delete(segment.index);
    element.loop = true;
    element.preload = "auto";
    const sourcePosition =
      (segment.sourceEntrySeconds +
        Math.max(0, sessionPositionSeconds - segment.startSeconds)) %
      work.durationSeconds;
    try {
      element.currentTime = sourcePosition;
    } catch {
      // Browsers may apply the requested seek after metadata becomes available.
    }
    const source = this.context.createMediaElementSource(element);
    const gain = this.context.createGain();
    const baseGain = dbToLinear(work.playbackGainDb + segment.playbackTrimDb);
    gain.gain.value = Math.max(
      SILENT_GAIN,
      baseGain * this.gainAt(segment.index, sessionPositionSeconds),
    );
    source.connect(gain);
    gain.connect(this.sessionBus);
    const runtime = { element, source, gain };
    this.runtimes.set(segment.index, runtime);
    this.scheduleEnvelope(runtime, segment, sessionPositionSeconds, baseGain);
    await element.play();
    void this.prime(segment.index + 1).catch((error) => this.fail(error));
  }

  private scheduleEnvelope(
    runtime: SegmentRuntime,
    segment: AdaptiveSessionSegment,
    position: number,
    baseGain: number,
  ): void {
    if (!this.program) return;
    const now = this.context.currentTime;
    if (this.isAuditionMuted(segment.index)) {
      runtime.gain.gain.cancelScheduledValues(now);
      runtime.gain.gain.setValueAtTime(SILENT_GAIN, now);
      return;
    }
    const incoming = this.program.plan.transitions.find(
      ({ incomingSegmentIndex }) => incomingSegmentIndex === segment.index,
    );
    const outgoing = this.program.plan.transitions.find(
      ({ outgoingSegmentIndex }) => outgoingSegmentIndex === segment.index,
    );
    if (incoming && position < incoming.endSeconds) {
      this.scheduleCurveRemainder(
        runtime.gain.gain,
        "in",
        incoming.curve,
        incoming.startSeconds,
        incoming.endSeconds,
        position,
        baseGain,
      );
    }
    if (outgoing && position < outgoing.endSeconds) {
      this.scheduleCurveRemainder(
        runtime.gain.gain,
        "out",
        outgoing.curve,
        outgoing.startSeconds,
        outgoing.endSeconds,
        position,
        baseGain,
      );
    }
    if (segment.finalEnvelopeSeconds > 0 && position < segment.endSeconds) {
      this.scheduleCurveRemainder(
        runtime.gain.gain,
        "out",
        "equal-power",
        segment.endSeconds - segment.finalEnvelopeSeconds,
        segment.endSeconds,
        position,
        baseGain,
      );
    }
  }

  private scheduleCurveRemainder(
    parameter: AudioParam,
    direction: "in" | "out",
    curve: "equal-power" | "linear",
    startSeconds: number,
    endSeconds: number,
    position: number,
    baseGain: number,
  ): void {
    const now = this.context.currentTime;
    const full = buildGainCurve(direction, curve);
    const duration = endSeconds - startSeconds;
    const progress = Math.min(
      1,
      Math.max(0, (position - startSeconds) / duration),
    );
    const firstIndex = Math.min(
      full.length - 2,
      Math.floor(progress * (full.length - 1)),
    );
    const remainder = full.slice(firstIndex);
    const startsAt = now + Math.max(0, startSeconds - position);
    const remainingDuration =
      position <= startSeconds ? duration : endSeconds - position;
    parameter.setValueCurveAtTime(
      multiplyCurve(remainder, baseGain),
      startsAt,
      Math.max(0.001, remainingDuration),
    );
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
    if (
      incoming &&
      position >= incoming.startSeconds &&
      position <= incoming.endSeconds
    ) {
      return transitionGains(
        (position - incoming.startSeconds) / incoming.durationSeconds,
        incoming.curve,
      ).incoming;
    }
    if (
      outgoing &&
      position >= outgoing.startSeconds &&
      position <= outgoing.endSeconds
    ) {
      return transitionGains(
        (position - outgoing.startSeconds) / outgoing.durationSeconds,
        outgoing.curve,
      ).outgoing;
    }
    return 1;
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

  private prime(index: number): Promise<void> {
    if (this.runtimes.has(index)) return Promise.resolve();
    const existing = this.preloadPromises.get(index);
    if (existing) return existing;
    if (this.preloaded.has(index)) return Promise.resolve();
    const url = this.urls.get(index);
    if (!url) return Promise.resolve();
    const element = new Audio(url);
    element.loop = true;
    element.preload = "metadata";
    this.preloaded.set(index, element);
    const promise = new Promise<void>((resolve, reject) => {
      let timeout: ReturnType<typeof setTimeout>;
      const cleanup = () => {
        clearTimeout(timeout);
        element.removeEventListener("loadedmetadata", ready);
        element.removeEventListener("error", failed);
      };
      const ready = () => {
        cleanup();
        resolve();
      };
      const failed = () => {
        cleanup();
        this.preloaded.delete(index);
        reject(new Error(`Session source ${index} could not be decoded.`));
      };
      timeout = setTimeout(() => {
        cleanup();
        this.preloaded.delete(index);
        reject(new Error(`Session source ${index} did not become ready.`));
      }, 20_000);
      element.addEventListener("loadedmetadata", ready, { once: true });
      element.addEventListener("error", failed, { once: true });
      element.load();
      if (element.readyState >= 1) ready();
    }).finally(() => {
      this.preloadPromises.delete(index);
    });
    this.preloadPromises.set(index, promise);
    return promise;
  }

  private async fail(error: unknown): Promise<void> {
    if (this.failureReported) return;
    this.failureReported = true;
    const normalized =
      error instanceof Error ? error : new Error("Adaptive playback failed.");
    await this.stop().catch(() => undefined);
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

  private release(index: number): void {
    const runtime = this.runtimes.get(index);
    if (!runtime) return;
    resetRuntime(runtime);
    this.runtimes.delete(index);
  }

  private schedule(delaySeconds: number, callback: () => void): void {
    this.timers.push(setTimeout(callback, Math.max(0, delaySeconds * 1000)));
  }

  private clearTimers(): void {
    for (const timer of this.timers) clearTimeout(timer);
    this.timers = [];
  }

  private clearRuntimes(): void {
    for (const runtime of this.runtimes.values()) resetRuntime(runtime);
    this.runtimes.clear();
  }
}
