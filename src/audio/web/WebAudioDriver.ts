import type {
  AdaptiveSessionEventHandlers,
  AudioGraphDriver,
  RemoteCommandHandlers,
} from "@/audio/AudioGraphDriver";
import { SourceLoadError } from "@/audio/AudioGraphDriver";
import {
  createColoredNoiseSamples,
  createSeededRandom,
} from "@/audio/generators/coloredNoise";
import { createBrownNoiseSamples } from "@/audio/generators/brownNoise";
import { getBinauralFrequencies } from "@/audio/generators/binaural";
import type {
  ConsumerAudioWork,
  SingleTrackProgram,
} from "@/domain/audio/consumerTypes";
import { dbToLinear } from "@/domain/audio/consumerTypes";
import type {
  AudioPreset,
  AudioSourceId,
  StemSourceId,
} from "@/domain/audio/types";
import type {
  AdaptiveSessionProgram,
  NatureMixLevel,
} from "@/domain/sessions/types";
import type {
  AdaptiveAuditionOptions,
  TransitionAudition,
} from "@/domain/sessions/workbench";
import { AdaptiveWebPlayback } from "./AdaptiveWebPlayback";
import { positionMediaElement } from "./positionMediaElement";
import { requestPlaybackAudioSession } from "./requestPlaybackAudioSession";
import {
  ClockedWavSource,
  type AudioElementPort,
  type PcmWorkReaderFactory,
} from "./ClockedWavSource";
import {
  acquireWebAudioWork,
  cancelledWebAudioLoad,
  type WebAudioSourceLease,
  type WebAudioSourceResolver,
} from "./WebAudioSourceResolver";

const SILENT_GAIN = 0.0001;
const NOISE_SECONDS = 8;

interface MediaRuntime {
  element: AudioElementPort;
  source: AudioNode;
  gain: GainNode;
}

interface PendingWebLoad {
  controller: AbortController;
  cleanup(): Promise<void>;
}

interface BufferRuntime {
  source: AudioBufferSourceNode;
  gain: GainNode;
}

interface BinauralRuntime {
  left: OscillatorNode;
  right: OscillatorNode;
  gain: GainNode;
}

type BrowserAudioContextConstructor = new (
  options?: AudioContextOptions,
) => AudioContext;

function browserAudioContextConstructor(): BrowserAudioContextConstructor {
  if (typeof window === "undefined") {
    throw new Error("Web Audio is available only in a browser.");
  }
  const browserWindow = window as typeof window & {
    webkitAudioContext?: BrowserAudioContextConstructor;
  };
  const Constructor = window.AudioContext ?? browserWindow.webkitAudioContext;
  if (!Constructor) throw new Error("This browser does not support Web Audio.");
  return Constructor;
}

function safelyStop(source: AudioScheduledSourceNode): void {
  try {
    source.stop();
  } catch {
    // Already stopped.
  }
  try {
    source.disconnect();
  } catch {
    // Already disconnected.
  }
}

function resetMedia(runtime: MediaRuntime): void {
  runtime.element.pause();
  try {
    runtime.element.currentTime = 0;
  } catch {
    // Metadata may not be available yet; pausing is sufficient cleanup.
  }
  runtime.element.removeAttribute("src");
  runtime.element.load();
  runtime.source.disconnect();
  runtime.gain.disconnect();
}

export class WebAudioDriver implements AudioGraphDriver {
  readonly capabilities = {
    backgroundPlayback: false,
    notificationControls: false,
    preciseSharedClock: false,
    realtimeSynthesis: true,
  } as const;

  private context: AudioContext | null = null;
  private masterGain: GainNode | null = null;
  private handlers: RemoteCommandHandlers | null = null;
  private adaptiveHandlers: AdaptiveSessionEventHandlers | null = null;
  private loadedPresetId: string | null = null;
  private loadedProgramId: string | null = null;
  private loadedAdaptiveProgramId: string | null = null;
  private stemUrls = new Map<StemSourceId, string>();
  private programUrl: string | null = null;
  private programWork: ConsumerAudioWork | null = null;
  private programLease: WebAudioSourceLease | null = null;
  private pendingLoad: PendingWebLoad | null = null;
  private loadCommitQueue: Promise<unknown> = Promise.resolve();
  private disposed = false;
  private programNoiseBuffer: AudioBuffer | null = null;
  private brownNoiseBuffer: AudioBuffer | null = null;
  private mediaRuntime = new Map<StemSourceId | "program", MediaRuntime>();
  private noiseRuntime: BufferRuntime | null = null;
  private brownNoiseRuntime: BufferRuntime | null = null;
  private binauralRuntime: BinauralRuntime | null = null;
  private sourceGains = new Map<AudioSourceId, GainNode>();
  private sourceGainValues = new Map<AudioSourceId, number>();
  private sourceMuted = new Map<AudioSourceId, boolean>();
  private programGain: GainNode | null = null;
  private programPlaybackGain = 1;
  private programVolume = 1;
  private singleTrackPositionSeconds = 0;
  private graphStarted = false;
  private scheduledStop: ReturnType<typeof setTimeout> | null = null;
  private adaptivePlayback: AdaptiveWebPlayback | null = null;
  private userGesturePromise: Promise<void> | null = null;
  private gestureAbort: AbortController | null = null;
  private playbackGeneration = 0;

  constructor(
    private readonly sourceResolver: WebAudioSourceResolver,
    private readonly clockedWav = false,
    private readonly pcmReaderFactory?: PcmWorkReaderFactory,
  ) {}

  activateUserGesture(): void {
    requestPlaybackAudioSession();
    this.pcmReaderFactory?.cancelReview?.();
    const context = this.ensureContext();
    if (this.loadedAdaptiveProgramId && this.adaptivePlayback) {
      this.adaptivePlayback.activateUserGesture();
      this.userGesturePromise = null;
      return;
    }
    const attempts: Promise<unknown>[] = [context.resume()];
    if (this.loadedProgramId && this.programUrl) {
      let runtime = this.mediaRuntime.get("program");
      if (!runtime) {
        runtime = this.createMediaRuntime(
          context,
          this.programUrl,
          SILENT_GAIN,
          this.requireMaster(),
          undefined,
          this.programWork,
        );
        this.mediaRuntime.set("program", runtime);
      }
      attempts.push(runtime.element.play());
    } else if (this.loadedPresetId) {
      for (const [stemId, url] of this.stemUrls) {
        let runtime = this.mediaRuntime.get(stemId);
        if (!runtime) {
          runtime = this.createMediaRuntime(
            context,
            url,
            SILENT_GAIN,
            this.requireMaster(),
          );
          this.mediaRuntime.set(stemId, runtime);
        }
        attempts.push(runtime.element.play());
      }
    }
    this.gestureAbort?.abort();
    const abortController = new AbortController();
    this.gestureAbort = abortController;
    let timeout: ReturnType<typeof setTimeout>;
    const interrupted = new Promise<never>((_resolve, reject) => {
      abortController.signal.addEventListener(
        "abort",
        () => reject(cancelledWebAudioLoad()),
        { once: true },
      );
      timeout = setTimeout(
        () =>
          reject(
            new Error("The browser did not confirm audio within 10 seconds."),
          ),
        10_000,
      );
    });
    const activation = Promise.race([
      Promise.all(attempts).then(() => undefined),
      interrupted,
    ]).finally(() => {
      clearTimeout(timeout);
      if (this.gestureAbort === abortController) this.gestureAbort = null;
    });
    // Attach a handler immediately so a browser rejection cannot become an
    // unhandled promise before the controller consumes the same result.
    void activation.catch(() => undefined);
    this.userGesturePromise = activation;
  }

  setRemoteCommandHandlers(handlers: RemoteCommandHandlers): void {
    this.handlers = handlers;
  }

  setAdaptiveSessionEventHandlers(
    handlers: AdaptiveSessionEventHandlers,
  ): void {
    this.adaptiveHandlers = handlers;
  }

  async loadPreset(preset: AudioPreset): Promise<void> {
    if (this.loadedPresetId === preset.id && this.stemUrls.size === 3) {
      await this.cancelPendingLoad();
      return;
    }
    const pending = this.beginLoad();
    try {
      const context = this.ensureContext();
      const nextStemUrls = new Map<StemSourceId, string>();
      for (const stem of preset.stems) {
        const url = this.sourceResolver.resolveStem(stem.assetKey);
        if (!url) {
          throw new SourceLoadError(
            stem.id,
            `Missing ${stem.label} web asset.`,
          );
        }
        nextStemUrls.set(stem.id, url);
      }
      const nextBrownNoiseBuffer = this.createBrownNoiseBuffer(context);
      await this.commitLoad(pending, async () => {
        await this.stopInternal(false);
        this.assertLoad(pending);
        this.stemUrls = nextStemUrls;
        this.brownNoiseBuffer = nextBrownNoiseBuffer;
        this.loadedPresetId = preset.id;
        this.loadedProgramId = null;
        this.loadedAdaptiveProgramId = null;
        this.adaptivePlayback = null;
        this.programUrl = null;
        this.programNoiseBuffer = null;
      });
    } finally {
      this.finishLoad(pending);
    }
  }

  async loadSingleTrack(program: SingleTrackProgram): Promise<void> {
    if (this.loadedProgramId === program.work.id) {
      await this.cancelPendingLoad();
      return;
    }
    const pending = this.beginLoad();
    const context = this.ensureContext();
    let nextProgramUrl: string | null = null;
    let nextProgramNoiseBuffer: AudioBuffer | null = null;
    let nextRuntime: MediaRuntime | null = null;
    let nextLease: WebAudioSourceLease | null = null;
    pending.cleanup = async () => {
      if (nextRuntime) {
        const runtime = nextRuntime;
        nextRuntime = null;
        resetMedia(runtime);
      }
      if (nextLease) {
        const lease = nextLease;
        nextLease = null;
        await lease.release();
      }
    };
    const nextPlaybackGain = dbToLinear(program.work.playbackGainDb);

    try {
      if (program.work.sourceKind === "generated-noise") {
        if (!program.work.noiseColor) {
          throw new Error(`${program.work.title} has no noise colour defined.`);
        }
        const length = Math.floor(context.sampleRate * NOISE_SECONDS);
        const buffer = context.createBuffer(2, length, context.sampleRate);
        const seed = [...program.work.noiseColor].reduce(
          (value, character) => (value * 31 + character.charCodeAt(0)) >>> 0,
          0x51a7c0de,
        );
        const samples = createColoredNoiseSamples({
          color: program.work.noiseColor,
          length,
          sampleRate: context.sampleRate,
          random: createSeededRandom(seed),
        });
        buffer.copyToChannel(samples, 0);
        buffer.copyToChannel(samples, 1);
        nextProgramNoiseBuffer = buffer;
      } else {
        nextLease = await acquireWebAudioWork(
          this.sourceResolver,
          program.work,
          pending.controller.signal,
        );
        this.assertLoad(pending);
        nextProgramUrl = nextLease?.uri ?? null;
        if (!nextProgramUrl) {
          throw new Error(
            `${program.work.title} is not available in this listening surface.`,
          );
        }
        nextRuntime = this.createMediaRuntime(
          context,
          nextProgramUrl,
          SILENT_GAIN,
          this.requireMaster(),
          undefined,
          program.work,
        );
        await positionMediaElement(
          nextRuntime.element,
          0,
          pending.controller.signal,
        );
      }
      this.assertLoad(pending);
      await this.commitLoad(pending, async () => {
        await this.stopInternal(false);
        this.assertLoad(pending);
        this.programUrl = nextProgramUrl;
        this.programWork = program.work;
        this.programLease = nextLease;
        nextLease = null;
        this.programNoiseBuffer = nextProgramNoiseBuffer;
        this.singleTrackPositionSeconds = 0;
        this.programPlaybackGain = nextPlaybackGain;
        if (nextRuntime) {
          this.mediaRuntime.set("program", nextRuntime);
          nextRuntime = null;
        }
        this.loadedProgramId = program.work.id;
        this.loadedPresetId = null;
        this.loadedAdaptiveProgramId = null;
        this.adaptivePlayback = null;
      });
    } catch (error) {
      await pending.cleanup().catch(() => undefined);
      throw error;
    } finally {
      this.finishLoad(pending);
    }
  }

  async loadAdaptiveSession(program: AdaptiveSessionProgram): Promise<void> {
    if (this.loadedAdaptiveProgramId === program.plan.id) {
      await this.cancelPendingLoad();
      return;
    }
    const pending = this.beginLoad();
    const context = this.ensureContext();
    const master = this.requireMaster();
    let candidate: AdaptiveWebPlayback;
    candidate = new AdaptiveWebPlayback(
      context,
      master,
      {
        ended: () => {
          if (
            this.adaptivePlayback === candidate &&
            this.loadedAdaptiveProgramId === program.plan.id &&
            this.graphStarted
          ) {
            this.adaptiveHandlers?.ended(program.plan.id);
          }
        },
        error: (error) => {
          if (
            this.adaptivePlayback === candidate &&
            this.loadedAdaptiveProgramId === program.plan.id &&
            this.graphStarted
          ) {
            this.adaptiveHandlers?.error(program.plan.id, error);
          }
        },
      },
      (work, signal) => acquireWebAudioWork(this.sourceResolver, work, signal),
      this.clockedWav,
      this.pcmReaderFactory,
    );
    pending.cleanup = () => candidate.dispose();
    try {
      await candidate.load(program);
      this.assertLoad(pending);
      await this.commitLoad(pending, async () => {
        await this.stopInternal(false);
        this.assertLoad(pending);
        this.adaptivePlayback = candidate;
        this.loadedAdaptiveProgramId = program.plan.id;
        this.loadedPresetId = null;
        this.loadedProgramId = null;
      });
    } catch (error) {
      await candidate.dispose().catch(() => undefined);
      throw error;
    } finally {
      this.finishLoad(pending);
    }
  }

  async start(
    preset: AudioPreset,
    mix: Readonly<Record<AudioSourceId, number>>,
  ): Promise<void> {
    if (this.graphStarted) return;
    if (this.loadedPresetId !== preset.id) await this.loadPreset(preset);
    const context = this.ensureContext();
    const master = this.requireMaster();
    this.sourceGains.clear();
    const generation = this.playbackGeneration;

    try {
      for (const stem of preset.stems) {
        const url = this.stemUrls.get(stem.id);
        if (!url) {
          throw new SourceLoadError(
            stem.id,
            `Missing ${stem.label} web asset.`,
          );
        }
        const runtime =
          this.mediaRuntime.get(stem.id) ??
          this.createMediaRuntime(context, url, SILENT_GAIN, master);
        this.mediaRuntime.set(stem.id, runtime);
        runtime.gain.gain.value = this.effectiveGain(stem.id, mix[stem.id]);
        this.sourceGains.set(stem.id, runtime.gain);
      }
      this.createBinauralRuntime(preset, mix.binaural, master);
      this.createBrownNoiseRuntime(mix.brownNoise, master);
      await context.resume();
      this.prepareMasterFade(preset.fadeInSeconds);
      const gestureActivation = this.takeUserGesturePromise();
      if (gestureActivation) await gestureActivation;
      else {
        await Promise.all(
          [...this.mediaRuntime.values()].map((runtime) =>
            runtime.element.play(),
          ),
        );
      }
      const startAt = context.currentTime + 0.02;
      this.assertPlayback(generation);
      this.binauralRuntime?.left.start(startAt);
      this.binauralRuntime?.right.start(startAt);
      this.brownNoiseRuntime?.source.start(startAt);
      this.graphStarted = true;
    } catch (error) {
      if (generation === this.playbackGeneration)
        await this.stopInternal(false);
      throw error;
    }
  }

  async startSingleTrack(
    program: SingleTrackProgram,
    volume: number,
  ): Promise<void> {
    if (this.graphStarted) return;
    if (this.loadedProgramId !== program.work.id) {
      await this.loadSingleTrack(program);
    }
    const context = this.ensureContext();
    const master = this.requireMaster();
    const generation = this.playbackGeneration;
    this.programVolume = Math.min(1, Math.max(0, volume));
    const gainValue = Math.max(
      0,
      this.programPlaybackGain * this.programVolume,
    );

    try {
      if (program.work.sourceKind === "generated-noise") {
        if (!this.programNoiseBuffer) {
          throw new Error(`No generated buffer for ${program.work.title}.`);
        }
        const source = context.createBufferSource();
        const gain = context.createGain();
        source.buffer = this.programNoiseBuffer;
        source.loop = true;
        gain.gain.value = gainValue;
        source.connect(gain);
        gain.connect(master);
        this.programGain = gain;
        this.noiseRuntime = { source, gain };
      } else {
        if (!this.programUrl) {
          throw new Error(`No web asset for ${program.work.title}.`);
        }
        const runtime =
          this.mediaRuntime.get("program") ??
          this.createMediaRuntime(
            context,
            this.programUrl,
            SILENT_GAIN,
            master,
            undefined,
            program.work,
          );
        this.mediaRuntime.set("program", runtime);
        runtime.gain.gain.value = gainValue;
        this.programGain = runtime.gain;
        // A gesture-primed, already prepared element must not be reloaded or
        // rewound after play(): Safari rejects that pending Play as interrupted.
        if (!this.userGesturePromise) {
          await positionMediaElement(
            runtime.element,
            this.singleTrackPositionSeconds,
          );
        }
      }

      await context.resume();
      const gestureActivation = this.takeUserGesturePromise();
      if (this.noiseRuntime) {
        this.noiseRuntime.source.start(context.currentTime + 0.02);
      } else if (gestureActivation) {
        await gestureActivation;
      } else {
        await this.mediaRuntime.get("program")?.element.play();
      }
      this.assertPlayback(generation);
      // The audible envelope starts after media readiness, not while a slow
      // decoder/network operation is still keeping the source silent.
      this.prepareMasterFade(program.fadeInSeconds);
      this.graphStarted = true;
    } catch (error) {
      if (generation === this.playbackGeneration)
        await this.stopInternal(false);
      throw error;
    }
  }

  async startAdaptiveSession(
    program: AdaptiveSessionProgram,
    volume: number,
    positionSeconds = 0,
  ): Promise<void> {
    if (this.graphStarted) return;
    if (this.loadedAdaptiveProgramId !== program.plan.id) {
      await this.loadAdaptiveSession(program);
    }
    const context = this.ensureContext();
    const generation = this.playbackGeneration;
    try {
      await context.resume();
      if (!this.adaptivePlayback) {
        throw new Error("Adaptive session playback is unavailable.");
      }
      await this.adaptivePlayback.start(program, volume, positionSeconds);
      this.assertPlayback(generation);
      this.prepareMasterFade(program.fadeInSeconds);
      this.graphStarted = true;
    } catch (error) {
      if (generation === this.playbackGeneration)
        await this.stopInternal(false);
      throw error;
    }
  }

  async seekSingleTrack(positionSeconds: number): Promise<void> {
    this.pcmReaderFactory?.cancelReview?.();
    if (!this.loadedProgramId) {
      throw new Error("No single-track program is loaded.");
    }
    if (this.programNoiseBuffer) {
      throw new Error("Continuous generators do not have a file position.");
    }
    this.singleTrackPositionSeconds = positionSeconds;
    const runtime = this.mediaRuntime.get("program");
    if (runtime) {
      const generation = this.playbackGeneration;
      const resumePcm = Boolean(
        runtime.element.prepareAt &&
        this.graphStarted &&
        this.context?.state === "running",
      );
      await positionMediaElement(runtime.element, positionSeconds);
      this.assertPlayback(generation);
      // PCM prepareAt intentionally stops scheduling while reading the target.
      // A single-file seek must preserve Playing; paused seeks stay silent.
      if (resumePcm && this.context?.state === "running")
        await runtime.element.play();
    }
  }

  async seekAdaptiveSession(
    positionSeconds: number,
    clearAudition = false,
  ): Promise<void> {
    this.pcmReaderFactory?.cancelReview?.();
    if (!this.adaptivePlayback) {
      throw new Error("No adaptive session is loaded.");
    }
    await this.adaptivePlayback.seek(positionSeconds, clearAudition);
  }

  getReviewReadMetrics() {
    return this.pcmReaderFactory?.getReviewReadMetrics?.() ?? null;
  }

  getAdaptiveSessionPosition(): number | null {
    return this.loadedAdaptiveProgramId && this.adaptivePlayback
      ? this.adaptivePlayback.positionSeconds()
      : null;
  }

  async prepareReviewSeek(
    positionSeconds: number,
    signal: AbortSignal,
  ): Promise<boolean> {
    if (this.disposed || signal.aborted || this.context?.state !== "suspended")
      return false;
    if (this.loadedAdaptiveProgramId && this.adaptivePlayback)
      return this.adaptivePlayback.prepareReviewSeek(positionSeconds, signal);
    if (
      !this.programUrl ||
      !this.programWork ||
      !this.pcmReaderFactory?.prepareReview
    )
      return false;
    return this.pcmReaderFactory.prepareReview(
      [{ url: this.programUrl, work: this.programWork, positionSeconds }],
      signal,
    );
  }

  async configureAdaptiveAudition(
    audition: TransitionAudition | null,
    options?: AdaptiveAuditionOptions,
  ): Promise<void> {
    if (!this.adaptivePlayback) {
      throw new Error("No adaptive session is loaded.");
    }
    await this.adaptivePlayback.configureAudition(audition, options);
  }

  async setAdaptiveNatureLevel(
    level: NatureMixLevel,
    fadeMs: number,
  ): Promise<void> {
    if (!this.adaptivePlayback) {
      throw new Error("No adaptive session is loaded.");
    }
    this.adaptivePlayback.setNatureLevel(level, fadeMs);
  }

  async replaceAdaptiveNatureFamily(
    program: AdaptiveSessionProgram,
    signal: AbortSignal,
  ): Promise<void> {
    if (
      !this.adaptivePlayback ||
      this.loadedAdaptiveProgramId !== program.plan.id
    )
      throw new Error("The current adaptive session changed.");
    await this.adaptivePlayback.replaceNatureFamily(program, signal);
  }

  async resume(): Promise<void> {
    this.pcmReaderFactory?.cancelReview?.();
    if (!this.context || !this.graphStarted) return;
    await this.context.resume();
    if (this.loadedAdaptiveProgramId && this.adaptivePlayback) {
      await this.adaptivePlayback.resume();
      return;
    }
    const gestureActivation = this.takeUserGesturePromise();
    if (gestureActivation) await gestureActivation;
    else {
      await Promise.all(
        [...this.mediaRuntime.values()].map((runtime) =>
          runtime.element.play(),
        ),
      );
    }
  }

  async pause(_releaseAudioFocus: boolean): Promise<void> {
    if (!this.context || !this.graphStarted) return;
    if (this.loadedAdaptiveProgramId && this.adaptivePlayback) {
      await this.adaptivePlayback.pause();
    }
    for (const runtime of this.mediaRuntime.values()) runtime.element.pause();
    await this.context.suspend();
  }

  async stop(): Promise<void> {
    await this.cancelPendingLoad();
    await this.stopInternal(true);
  }

  private async stopInternal(prepareForReplay: boolean): Promise<void> {
    this.pcmReaderFactory?.cancelReview?.();
    this.playbackGeneration += 1;
    this.gestureAbort?.abort();
    this.gestureAbort = null;
    this.userGesturePromise = null;
    this.clearScheduledStop();
    if (this.masterGain && this.context) {
      const now = this.context.currentTime;
      this.masterGain.gain.cancelScheduledValues(now);
      this.masterGain.gain.setValueAtTime(0, now);
    }
    for (const runtime of this.mediaRuntime.values()) resetMedia(runtime);
    this.mediaRuntime.clear();
    if (!prepareForReplay && this.programLease) {
      const lease = this.programLease;
      this.programLease = null;
      await lease.release();
    }
    if (!prepareForReplay) {
      this.loadedProgramId = null;
      this.loadedPresetId = null;
      this.loadedAdaptiveProgramId = null;
      this.programUrl = null;
      this.programNoiseBuffer = null;
    }
    if (this.noiseRuntime) {
      safelyStop(this.noiseRuntime.source);
      this.noiseRuntime.gain.disconnect();
    }
    if (this.brownNoiseRuntime) {
      safelyStop(this.brownNoiseRuntime.source);
      this.brownNoiseRuntime.gain.disconnect();
    }
    if (this.binauralRuntime) {
      safelyStop(this.binauralRuntime.left);
      safelyStop(this.binauralRuntime.right);
      this.binauralRuntime.gain.disconnect();
    }
    this.noiseRuntime = null;
    this.brownNoiseRuntime = null;
    this.binauralRuntime = null;
    this.programGain = null;
    this.singleTrackPositionSeconds = 0;
    const adaptivePlayback = this.adaptivePlayback;
    if (adaptivePlayback) {
      if (prepareForReplay) {
        await adaptivePlayback.stop(true);
      } else {
        await adaptivePlayback.dispose();
        if (this.adaptivePlayback === adaptivePlayback) {
          this.adaptivePlayback = null;
        }
      }
    }
    this.sourceGains.clear();
    this.graphStarted = false;
    this.userGesturePromise = null;
    if (this.context?.state === "running") await this.context.suspend();
  }

  async dispose(): Promise<void> {
    this.pcmReaderFactory?.clearReview?.();
    this.disposed = true;
    await this.cancelPendingLoad();
    await this.loadCommitQueue.catch(() => undefined);
    await this.stopInternal(false);
    if (this.context && this.context.state !== "closed") {
      await this.context.close();
    }
    this.context = null;
    this.masterGain = null;
    this.loadedPresetId = null;
    this.loadedProgramId = null;
    this.loadedAdaptiveProgramId = null;
    this.stemUrls.clear();
    this.programUrl = null;
    this.programNoiseBuffer = null;
    this.brownNoiseBuffer = null;
    this.handlers = null;
    this.adaptiveHandlers = null;
    this.adaptivePlayback = null;
  }

  async setSourceGain(
    sourceId: AudioSourceId,
    gain: number,
    muted: boolean,
    fadeMs: number,
  ): Promise<void> {
    this.sourceGainValues.set(sourceId, gain);
    this.sourceMuted.set(sourceId, muted);
    const node = this.sourceGains.get(sourceId);
    if (node) this.rampGain(node, muted ? 0 : gain, fadeMs);
  }

  async setMasterVolume(volume: number, fadeMs: number): Promise<void> {
    this.programVolume = Math.min(1, Math.max(0, volume));
    if (this.programGain) {
      this.rampGain(
        this.programGain,
        this.programPlaybackGain * this.programVolume,
        fadeMs,
      );
    }
    if (this.loadedAdaptiveProgramId) {
      this.adaptivePlayback?.setVolume(this.programVolume, fadeMs);
    }
  }

  async scheduleFadeOut(remainingMs: number, fadeMs: number): Promise<void> {
    if (!this.context || !this.masterGain || !this.graphStarted) return;
    this.clearScheduledStop();
    const now = this.context.currentTime;
    const endAt = now + remainingMs / 1000;
    const fadeAt = Math.max(now, endAt - Math.min(remainingMs, fadeMs) / 1000);
    this.masterGain.gain.setValueAtTime(1, fadeAt);
    this.masterGain.gain.linearRampToValueAtTime(0, endAt);
    this.scheduledStop = setTimeout(() => void this.stop(), remainingMs);
  }

  async cancelScheduledFade(): Promise<void> {
    this.clearScheduledStop();
    if (!this.context || !this.masterGain) return;
    const now = this.context.currentTime;
    this.masterGain.gain.cancelAndHoldAtTime(now);
    this.masterGain.gain.setValueAtTime(1, now);
  }

  private ensureContext(): AudioContext {
    if (this.disposed)
      throw new Error("This Web Audio driver has been disposed.");
    if (!this.context) {
      const Constructor = browserAudioContextConstructor();
      // PCM windows must share their 48 kHz frame grid. Resample the continuous
      // mixed output at the device boundary, not every source window/loop.
      this.context = this.clockedWav
        ? new Constructor({ sampleRate: 48000 })
        : new Constructor();
      this.masterGain = this.context.createGain();
      this.masterGain.gain.value = 0;
      this.masterGain.connect(this.context.destination);
    }
    return this.context;
  }

  private requireMaster(): GainNode {
    if (!this.masterGain) throw new Error("Web Audio master is unavailable.");
    return this.masterGain;
  }

  private createMediaRuntime(
    context: AudioContext,
    url: string,
    gainValue: number,
    master: GainNode,
    existingGain?: GainNode,
    work?: ConsumerAudioWork | null,
  ): MediaRuntime {
    const filename = work?.localPreviewFilename ?? url;
    const pcm =
      this.clockedWav &&
      (/\.wav(?:$|\?)/i.test(filename) ||
        (this.pcmReaderFactory && work && /\.flac$/i.test(filename)))
        ? new ClockedWavSource(
            context,
            undefined,
            work && this.pcmReaderFactory
              ? (source) => this.pcmReaderFactory!(source, work)
              : undefined,
          )
        : null;
    const element = pcm ?? new Audio(url);
    element.src = url;
    element.loop = true;
    element.preload = "auto";
    const source =
      pcm?.output ??
      context.createMediaElementSource(element as HTMLAudioElement);
    if (pcm)
      element.addEventListener("error", () => {
        if (this.graphStarted)
          this.handlers?.error?.(
            new Error(pcm.error?.message ?? "Audio stream failed."),
          );
      });
    const gain = existingGain ?? context.createGain();
    gain.gain.value = Math.max(0, gainValue);
    source.connect(gain);
    if (!existingGain) gain.connect(master);
    return { element, source, gain };
  }

  private createBrownNoiseBuffer(context: AudioContext): AudioBuffer {
    const length = Math.floor(context.sampleRate * NOISE_SECONDS);
    const buffer = context.createBuffer(2, length, context.sampleRate);
    const samples = createBrownNoiseSamples({ length });
    buffer.copyToChannel(samples, 0);
    buffer.copyToChannel(samples, 1);
    return buffer;
  }

  private createBrownNoiseRuntime(gainValue: number, master: GainNode): void {
    if (!this.context || !this.brownNoiseBuffer) return;
    const source = this.context.createBufferSource();
    const gain = this.context.createGain();
    source.buffer = this.brownNoiseBuffer;
    source.loop = true;
    gain.gain.value = this.effectiveGain("brownNoise", gainValue);
    source.connect(gain);
    gain.connect(master);
    this.brownNoiseRuntime = { source, gain };
    this.sourceGains.set("brownNoise", gain);
  }

  private createBinauralRuntime(
    preset: AudioPreset,
    gainValue: number,
    master: GainNode,
  ): void {
    if (!this.context) return;
    const frequencies = getBinauralFrequencies(preset.carrierHz, preset.beatHz);
    const left = this.context.createOscillator();
    const right = this.context.createOscillator();
    const leftPan = this.context.createStereoPanner();
    const rightPan = this.context.createStereoPanner();
    const gain = this.context.createGain();
    left.frequency.value = frequencies.leftHz;
    right.frequency.value = frequencies.rightHz;
    leftPan.pan.value = -1;
    rightPan.pan.value = 1;
    gain.gain.value = this.effectiveGain("binaural", gainValue);
    left.connect(leftPan).connect(gain);
    right.connect(rightPan).connect(gain);
    gain.connect(master);
    this.binauralRuntime = { left, right, gain };
    this.sourceGains.set("binaural", gain);
  }

  private effectiveGain(sourceId: AudioSourceId, fallback: number): number {
    const value = this.sourceGainValues.get(sourceId) ?? fallback;
    return this.sourceMuted.get(sourceId) ? 0 : Math.max(0, value);
  }

  private prepareMasterFade(seconds: number): void {
    if (!this.context || !this.masterGain) return;
    const now = this.context.currentTime;
    this.masterGain.gain.cancelScheduledValues(now);
    this.masterGain.gain.setValueAtTime(0, now);
    // Readiness latency and musical fade are distinct. The review uses the
    // complete editorial attack too; do not truncate it to an anti-click ramp.
    this.masterGain.gain.linearRampToValueAtTime(1, now + Math.max(0, seconds));
  }

  private rampGain(node: GainNode, value: number, fadeMs: number): void {
    if (!this.context) return;
    const now = this.context.currentTime;
    const target = Math.max(0, value);
    node.gain.cancelScheduledValues(now);
    node.gain.setValueAtTime(Math.max(0, node.gain.value), now);
    if (fadeMs > 0) {
      node.gain.linearRampToValueAtTime(target, now + fadeMs / 1000);
    } else {
      node.gain.setValueAtTime(target, now);
    }
  }

  private clearScheduledStop(): void {
    if (this.scheduledStop !== null) clearTimeout(this.scheduledStop);
    this.scheduledStop = null;
  }

  private takeUserGesturePromise(): Promise<void> | null {
    const activation = this.userGesturePromise;
    this.userGesturePromise = null;
    return activation;
  }

  private beginLoad(): PendingWebLoad {
    if (this.disposed) throw cancelledWebAudioLoad();
    void this.cancelPendingLoad();
    const pending: PendingWebLoad = {
      controller: new AbortController(),
      cleanup: async () => {},
    };
    this.pendingLoad = pending;
    return pending;
  }

  private async cancelPendingLoad(): Promise<void> {
    const pending = this.pendingLoad;
    if (!pending) return;
    this.pendingLoad = null;
    pending.controller.abort();
    await pending.cleanup().catch(() => undefined);
  }

  private assertLoad(pending: PendingWebLoad) {
    if (
      this.disposed ||
      pending.controller.signal.aborted ||
      this.pendingLoad !== pending
    )
      throw cancelledWebAudioLoad();
  }

  private assertPlayback(generation: number) {
    if (this.disposed || generation !== this.playbackGeneration)
      throw cancelledWebAudioLoad();
  }

  private finishLoad(pending: PendingWebLoad) {
    if (this.pendingLoad === pending) this.pendingLoad = null;
  }

  private commitLoad(pending: PendingWebLoad, commit: () => Promise<void>) {
    const operation = this.loadCommitQueue.then(async () => {
      this.assertLoad(pending);
      await commit();
    });
    this.loadCommitQueue = operation.catch(() => undefined);
    return operation;
  }
}
