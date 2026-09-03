import { Asset } from "expo-asset";
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
import type { SingleTrackProgram } from "@/domain/audio/consumerTypes";
import { dbToLinear } from "@/domain/audio/consumerTypes";
import type {
  AudioPreset,
  AudioSourceId,
  StemSourceId,
} from "@/domain/audio/types";
import { CONSUMER_ASSETS } from "@/audio/reactNativeAudioApi/consumerAssets";
import { STEM_ASSETS } from "@/audio/reactNativeAudioApi/stemAssets";
import type { AdaptiveSessionProgram } from "@/domain/sessions/types";
import type { TransitionAudition } from "@/domain/sessions/workbench";
import { AdaptiveWebPlayback } from "./AdaptiveWebPlayback";

const SILENT_GAIN = 0.0001;
const NOISE_SECONDS = 8;

interface MediaRuntime {
  element: HTMLAudioElement;
  source: MediaElementAudioSourceNode;
  gain: GainNode;
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

type BrowserAudioContextConstructor = new () => AudioContext;

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
  private graphStarted = false;
  private scheduledStop: ReturnType<typeof setTimeout> | null = null;
  private adaptivePlayback: AdaptiveWebPlayback | null = null;

  setRemoteCommandHandlers(handlers: RemoteCommandHandlers): void {
    this.handlers = handlers;
  }

  setAdaptiveSessionEventHandlers(
    handlers: AdaptiveSessionEventHandlers,
  ): void {
    this.adaptiveHandlers = handlers;
  }

  async loadPreset(preset: AudioPreset): Promise<void> {
    if (this.loadedPresetId === preset.id && this.stemUrls.size === 3) return;
    await this.stop();
    const context = this.ensureContext();
    this.stemUrls.clear();
    for (const stem of preset.stems) {
      const descriptor = STEM_ASSETS[stem.assetKey];
      const url = Asset.fromModule(descriptor.moduleId).uri;
      if (!url) {
        throw new SourceLoadError(stem.id, `Missing ${stem.label} web asset.`);
      }
      this.stemUrls.set(stem.id, url);
    }
    this.brownNoiseBuffer = this.createBrownNoiseBuffer(context);
    this.loadedPresetId = preset.id;
    this.loadedProgramId = null;
    this.loadedAdaptiveProgramId = null;
    this.adaptivePlayback = null;
    this.programUrl = null;
    this.programNoiseBuffer = null;
  }

  async loadSingleTrack(program: SingleTrackProgram): Promise<void> {
    if (this.loadedProgramId === program.work.id) return;
    await this.stop();
    const context = this.ensureContext();
    this.programUrl = null;
    this.programNoiseBuffer = null;
    this.programPlaybackGain = dbToLinear(program.work.playbackGainDb);

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
      this.programNoiseBuffer = buffer;
    } else {
      const descriptor = CONSUMER_ASSETS[program.work.assetKey];
      this.programUrl = descriptor
        ? Asset.fromModule(descriptor.moduleId).uri
        : program.work.availability === "local-preview-file" &&
            program.work.localPreviewFilename
          ? `/audio-catalog/${encodeURIComponent(program.work.localPreviewFilename)}`
          : null;
      if (!this.programUrl) {
        throw new Error(
          `${program.work.title} is not available in this listening surface.`,
        );
      }
    }

    this.loadedProgramId = program.work.id;
    this.loadedPresetId = null;
    this.loadedAdaptiveProgramId = null;
    this.adaptivePlayback = null;
  }

  async loadAdaptiveSession(program: AdaptiveSessionProgram): Promise<void> {
    if (this.loadedAdaptiveProgramId === program.plan.id) return;
    await this.stop();
    const context = this.ensureContext();
    const master = this.requireMaster();
    this.adaptivePlayback = new AdaptiveWebPlayback(context, master, {
      ended: () => this.adaptiveHandlers?.ended(program.plan.id),
      error: (error) => this.adaptiveHandlers?.error(program.plan.id, error),
    });
    await this.adaptivePlayback.load(program);
    this.loadedAdaptiveProgramId = program.plan.id;
    this.loadedPresetId = null;
    this.loadedProgramId = null;
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

    try {
      for (const stem of preset.stems) {
        const url = this.stemUrls.get(stem.id);
        if (!url) {
          throw new SourceLoadError(
            stem.id,
            `Missing ${stem.label} web asset.`,
          );
        }
        const runtime = this.createMediaRuntime(
          context,
          url,
          this.effectiveGain(stem.id, mix[stem.id]),
          master,
        );
        this.mediaRuntime.set(stem.id, runtime);
        this.sourceGains.set(stem.id, runtime.gain);
      }
      this.createBinauralRuntime(preset, mix.binaural, master);
      this.createBrownNoiseRuntime(mix.brownNoise, master);
      await context.resume();
      this.prepareMasterFade(preset.fadeInSeconds);
      await Promise.all(
        [...this.mediaRuntime.values()].map((runtime) =>
          runtime.element.play(),
        ),
      );
      const startAt = context.currentTime + 0.02;
      this.binauralRuntime?.left.start(startAt);
      this.binauralRuntime?.right.start(startAt);
      this.brownNoiseRuntime?.source.start(startAt);
      this.graphStarted = true;
    } catch (error) {
      await this.stop();
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
    this.programVolume = Math.min(1, Math.max(0, volume));
    const gain = context.createGain();
    gain.gain.value = Math.max(
      SILENT_GAIN,
      this.programPlaybackGain * this.programVolume,
    );
    gain.connect(master);
    this.programGain = gain;

    try {
      if (program.work.sourceKind === "generated-noise") {
        if (!this.programNoiseBuffer) {
          throw new Error(`No generated buffer for ${program.work.title}.`);
        }
        const source = context.createBufferSource();
        source.buffer = this.programNoiseBuffer;
        source.loop = true;
        source.connect(gain);
        this.noiseRuntime = { source, gain };
      } else {
        if (!this.programUrl) {
          throw new Error(`No web asset for ${program.work.title}.`);
        }
        const runtime = this.createMediaRuntime(
          context,
          this.programUrl,
          gain.gain.value,
          master,
          gain,
        );
        this.mediaRuntime.set("program", runtime);
      }

      await context.resume();
      this.prepareMasterFade(program.fadeInSeconds);
      if (this.noiseRuntime) {
        this.noiseRuntime.source.start(context.currentTime + 0.02);
      } else {
        await this.mediaRuntime.get("program")?.element.play();
      }
      this.graphStarted = true;
    } catch (error) {
      await this.stop();
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
    try {
      await context.resume();
      this.prepareMasterFade(program.fadeInSeconds);
      await this.adaptivePlayback?.start(program, volume, positionSeconds);
      this.graphStarted = true;
    } catch (error) {
      await this.stop();
      throw error;
    }
  }

  async seekAdaptiveSession(positionSeconds: number): Promise<void> {
    if (!this.adaptivePlayback) {
      throw new Error("No adaptive session is loaded.");
    }
    await this.adaptivePlayback.seek(positionSeconds);
  }

  async configureAdaptiveAudition(
    audition: TransitionAudition | null,
  ): Promise<void> {
    if (!this.adaptivePlayback) {
      throw new Error("No adaptive session is loaded.");
    }
    await this.adaptivePlayback.configureAudition(audition);
  }

  async resume(): Promise<void> {
    if (!this.context || !this.graphStarted) return;
    await this.context.resume();
    if (this.loadedAdaptiveProgramId && this.adaptivePlayback) {
      await this.adaptivePlayback.resume();
      return;
    }
    await Promise.all(
      [...this.mediaRuntime.values()].map((runtime) => runtime.element.play()),
    );
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
    this.clearScheduledStop();
    if (this.masterGain && this.context) {
      const now = this.context.currentTime;
      this.masterGain.gain.cancelScheduledValues(now);
      this.masterGain.gain.setValueAtTime(SILENT_GAIN, now);
    }
    for (const runtime of this.mediaRuntime.values()) resetMedia(runtime);
    this.mediaRuntime.clear();
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
    await this.adaptivePlayback?.stop();
    this.sourceGains.clear();
    this.graphStarted = false;
    if (this.context?.state === "running") await this.context.suspend();
  }

  async dispose(): Promise<void> {
    await this.stop();
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
    if (node) this.rampGain(node, muted ? SILENT_GAIN : gain, fadeMs);
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
    this.masterGain.gain.linearRampToValueAtTime(SILENT_GAIN, endAt);
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
    if (!this.context) {
      const Constructor = browserAudioContextConstructor();
      this.context = new Constructor();
      this.masterGain = this.context.createGain();
      this.masterGain.gain.value = SILENT_GAIN;
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
  ): MediaRuntime {
    const element = new Audio(url);
    element.loop = true;
    element.preload = "auto";
    const source = context.createMediaElementSource(element);
    const gain = existingGain ?? context.createGain();
    gain.gain.value = Math.max(SILENT_GAIN, gainValue);
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
    return this.sourceMuted.get(sourceId)
      ? SILENT_GAIN
      : Math.max(SILENT_GAIN, value);
  }

  private prepareMasterFade(seconds: number): void {
    if (!this.context || !this.masterGain) return;
    const now = this.context.currentTime;
    this.masterGain.gain.cancelScheduledValues(now);
    this.masterGain.gain.setValueAtTime(SILENT_GAIN, now);
    this.masterGain.gain.linearRampToValueAtTime(1, now + seconds);
  }

  private rampGain(node: GainNode, value: number, fadeMs: number): void {
    if (!this.context) return;
    const now = this.context.currentTime;
    const target = Math.max(SILENT_GAIN, value);
    node.gain.cancelScheduledValues(now);
    node.gain.setValueAtTime(Math.max(SILENT_GAIN, node.gain.value), now);
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
}
