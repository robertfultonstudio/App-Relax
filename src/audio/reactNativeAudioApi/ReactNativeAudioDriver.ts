import {
  AudioContext,
  AudioManager,
  PlaybackNotificationManager,
  type AudioBuffer,
  type AudioBufferSourceNode,
  type GainNode,
  type OscillatorNode,
} from "react-native-audio-api";
import type {
  AudioPreset,
  AudioSourceId,
  StemSourceId,
} from "@/domain/audio/types";
import {
  SourceLoadError,
  type AudioGraphDriver,
  type RemoteCommandHandlers,
} from "@/audio/AudioGraphDriver";
import { getBinauralFrequencies } from "@/audio/generators/binaural";
import { createBrownNoiseSamples } from "@/audio/generators/brownNoise";
import { PLACEHOLDER_ASSETS } from "./placeholderAssets";

interface RemovableSubscription {
  remove(): void;
}

interface StemRuntime {
  source: AudioBufferSourceNode;
  gain: GainNode;
}

interface BinauralRuntime {
  left: OscillatorNode;
  right: OscillatorNode;
  gain: GainNode;
}

const SILENT_GAIN = 0.0001;
const BROWN_NOISE_SECONDS = 8;

function safeStop(node: AudioBufferSourceNode | OscillatorNode): void {
  try {
    node.stop();
  } catch {
    // Idempotent cleanup: an already-stopped source needs no further action.
  }
  try {
    node.disconnect();
  } catch {
    // A disconnected node is already clean.
  }
}

export class ReactNativeAudioDriver implements AudioGraphDriver {
  readonly capabilities = {
    backgroundPlayback: true,
    notificationControls: true,
    preciseSharedClock: true,
    realtimeSynthesis: true,
  } as const;

  private context: AudioContext | null = null;
  private masterGain: GainNode | null = null;
  private readonly stemBuffers = new Map<StemSourceId, AudioBuffer>();
  private brownNoiseBuffer: AudioBuffer | null = null;
  private readonly stemRuntime = new Map<StemSourceId, StemRuntime>();
  private brownNoiseRuntime: StemRuntime | null = null;
  private binauralRuntime: BinauralRuntime | null = null;
  private sourceGains = new Map<AudioSourceId, GainNode>();
  private sourceMuted = new Map<AudioSourceId, boolean>();
  private sourceGainValues = new Map<AudioSourceId, number>();
  private loadedPresetId: string | null = null;
  private graphStarted = false;
  private handlers: RemoteCommandHandlers | null = null;
  private subscriptions: RemovableSubscription[] = [];
  private notificationPermissionGranted = false;

  setRemoteCommandHandlers(handlers: RemoteCommandHandlers): void {
    this.handlers = handlers;
    this.removeSubscriptions();
    this.subscriptions = [
      PlaybackNotificationManager.addEventListener(
        "playbackNotificationPlay",
        () => {
          this.handlers?.play();
        },
      ),
      PlaybackNotificationManager.addEventListener(
        "playbackNotificationPause",
        () => {
          this.handlers?.pause();
        },
      ),
      PlaybackNotificationManager.addEventListener(
        "playbackNotificationStop",
        () => {
          this.handlers?.stop();
        },
      ),
    ];

    const interruption = AudioManager.addSystemEventListener(
      "interruption",
      (event) => {
        this.handlers?.interruption(event.type === "began", event.shouldResume);
      },
    );
    if (interruption) {
      this.subscriptions.push(interruption);
    }
  }

  async loadPreset(preset: AudioPreset): Promise<void> {
    if (
      this.loadedPresetId === preset.id &&
      this.context &&
      this.brownNoiseBuffer
    ) {
      return;
    }
    await this.stop();
    this.ensureContext();
    const context = this.requireContext();
    this.stemBuffers.clear();
    let activeSourceId: AudioSourceId = "drone";
    let activeSourceLabel = "audio stem";

    try {
      for (const stem of preset.stems) {
        activeSourceId = stem.id;
        activeSourceLabel = stem.label;
        const asset = PLACEHOLDER_ASSETS[stem.assetKey];
        const buffer = await context.decodeAudioData(asset);
        this.stemBuffers.set(stem.id, buffer);
      }
      activeSourceId = "brownNoise";
      activeSourceLabel = "brown noise";
      this.brownNoiseBuffer = this.createBrownNoiseBuffer(context);
      this.loadedPresetId = preset.id;
      if (context.state === "running") {
        await context.suspend();
      }
    } catch (error) {
      this.stemBuffers.clear();
      this.brownNoiseBuffer = null;
      this.loadedPresetId = null;
      if (context.state === "running") {
        await context.suspend();
      }
      if (error instanceof SourceLoadError) {
        throw error;
      }
      const detail =
        error instanceof Error ? error.message : "Unknown decoder error.";
      throw new SourceLoadError(
        activeSourceId,
        `Could not load ${activeSourceLabel}: ${detail}`,
      );
    }
  }

  async start(
    preset: AudioPreset,
    mix: Readonly<Record<AudioSourceId, number>>,
  ): Promise<void> {
    if (this.graphStarted) {
      return;
    }
    if (this.loadedPresetId !== preset.id) {
      await this.loadPreset(preset);
    }

    try {
      const context = this.requireContext();
      if (context.state === "suspended") {
        await context.resume();
      }
      AudioManager.setAudioSessionOptions({
        iosCategory: "playback",
        iosMode: "default",
        iosOptions: ["allowAirPlay"],
      });
      AudioManager.observeAudioInterruptions(true);
      await AudioManager.setAudioSessionActivity(true);
      this.sourceGains = new Map();
      this.stemRuntime.clear();
      const startAt = context.currentTime + 0.05;
      const master = this.masterGain ?? context.createGain();
      if (!this.masterGain) {
        master.connect(context.destination);
        this.masterGain = master;
      }
      master.gain.cancelScheduledValues(context.currentTime);
      master.gain.setValueAtTime(SILENT_GAIN, context.currentTime);
      master.gain.setValueAtTime(SILENT_GAIN, startAt);
      master.gain.linearRampToValueAtTime(1, startAt + preset.fadeInSeconds);

      for (const stem of preset.stems) {
        const buffer = this.stemBuffers.get(stem.id);
        if (!buffer) {
          throw new SourceLoadError(
            stem.id,
            `Missing decoded buffer for ${stem.label}.`,
          );
        }
        const source = context.createBufferSource();
        const gain = context.createGain();
        source.buffer = buffer;
        source.loop = true;
        gain.gain.value = this.effectiveGain(stem.id, mix[stem.id]);
        source.connect(gain);
        gain.connect(master);
        this.stemRuntime.set(stem.id, { source, gain });
        this.sourceGains.set(stem.id, gain);
        source.start(startAt);
      }

      this.createBinauralGraph(preset, mix.binaural, startAt, master);
      this.createBrownNoiseGraph(mix.brownNoise, startAt, master);
      this.graphStarted = true;
      await this.showPlaybackNotification(preset);
    } catch (error) {
      await this.stop();
      throw error;
    }
  }

  async resume(): Promise<void> {
    if (!this.context || !this.graphStarted) {
      return;
    }
    await this.context.resume();
    AudioManager.observeAudioInterruptions(true);
    await AudioManager.setAudioSessionActivity(true);
    if (this.notificationPermissionGranted) {
      try {
        await PlaybackNotificationManager.show({ state: "playing", speed: 1 });
      } catch {
        this.notificationPermissionGranted = false;
      }
    }
  }

  async pause(releaseAudioFocus: boolean): Promise<void> {
    if (!this.context || !this.graphStarted) {
      return;
    }
    await this.context.suspend();
    if (releaseAudioFocus) {
      AudioManager.observeAudioInterruptions(false);
      try {
        await AudioManager.setAudioSessionActivity(false);
      } catch {
        // The context is already suspended; focus release remains best-effort.
      }
    }
    if (this.notificationPermissionGranted) {
      try {
        await PlaybackNotificationManager.show({ state: "paused", speed: 0 });
      } catch {
        this.notificationPermissionGranted = false;
      }
    }
  }

  async stop(): Promise<void> {
    if (this.context && this.masterGain) {
      const now = this.context.currentTime;
      this.masterGain.gain.cancelScheduledValues(now);
      this.masterGain.gain.setValueAtTime(SILENT_GAIN, now);
    }

    for (const runtime of this.stemRuntime.values()) {
      safeStop(runtime.source);
      runtime.gain.disconnect();
    }
    this.stemRuntime.clear();

    if (this.brownNoiseRuntime) {
      safeStop(this.brownNoiseRuntime.source);
      this.brownNoiseRuntime.gain.disconnect();
      this.brownNoiseRuntime = null;
    }
    if (this.binauralRuntime) {
      safeStop(this.binauralRuntime.left);
      safeStop(this.binauralRuntime.right);
      this.binauralRuntime.gain.disconnect();
      this.binauralRuntime = null;
    }
    this.sourceGains.clear();
    this.graphStarted = false;
    AudioManager.observeAudioInterruptions(false);

    if (this.context?.state === "running") {
      await this.context.suspend();
    }
    try {
      await PlaybackNotificationManager.hide();
    } catch {
      // The audio graph is already stopped; stale metadata is non-fatal.
    }
    this.notificationPermissionGranted = false;
    try {
      await AudioManager.setAudioSessionActivity(false);
    } catch {
      // The graph is already silent; native lifecycle tests cover platform cleanup.
    }
  }

  async dispose(): Promise<void> {
    await this.stop();
    this.removeSubscriptions();
    if (this.context && this.context.state !== "closed") {
      await this.context.close();
    }
    this.context = null;
    this.masterGain = null;
    this.stemBuffers.clear();
    this.brownNoiseBuffer = null;
    this.loadedPresetId = null;
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
    if (!node || !this.context) {
      return;
    }
    const now = this.context.currentTime;
    const target = muted ? SILENT_GAIN : Math.max(SILENT_GAIN, gain);
    node.gain.cancelScheduledValues(now);
    node.gain.setValueAtTime(Math.max(SILENT_GAIN, node.gain.value), now);
    if (fadeMs > 0) {
      node.gain.linearRampToValueAtTime(target, now + fadeMs / 1000);
    } else {
      node.gain.setValueAtTime(target, now);
    }
  }

  async scheduleFadeOut(remainingMs: number, fadeMs: number): Promise<void> {
    if (!this.context || !this.masterGain || !this.graphStarted) {
      return;
    }
    const now = this.context.currentTime;
    const fadeSeconds = Math.min(remainingMs, fadeMs) / 1000;
    const endAt = now + remainingMs / 1000;
    const startAt = Math.max(now, endAt - fadeSeconds);
    this.masterGain.gain.setValueAtTime(1, startAt);
    this.masterGain.gain.linearRampToValueAtTime(SILENT_GAIN, endAt);
    this.scheduleSourceStops(endAt);
    if (this.notificationPermissionGranted) {
      try {
        await PlaybackNotificationManager.show({
          duration: remainingMs / 1000,
          elapsedTime: 0,
        });
      } catch {
        this.notificationPermissionGranted = false;
      }
    }
  }

  async cancelScheduledFade(): Promise<void> {
    if (!this.context || !this.masterGain) {
      return;
    }
    const now = this.context.currentTime;
    this.masterGain.gain.cancelAndHoldAtTime(now);
    this.masterGain.gain.setValueAtTime(1, now);
  }

  private ensureContext(): void {
    if (this.context) {
      return;
    }
    this.context = new AudioContext();
    this.masterGain = this.context.createGain();
    this.masterGain.gain.value = SILENT_GAIN;
    this.masterGain.connect(this.context.destination);
  }

  private requireContext(): AudioContext {
    if (!this.context) {
      throw new Error("AudioContext has not been initialized.");
    }
    return this.context;
  }

  private createBinauralGraph(
    preset: AudioPreset,
    gainValue: number,
    startAt: number,
    master: GainNode,
  ): void {
    const context = this.requireContext();
    const frequencies = getBinauralFrequencies(preset.carrierHz, preset.beatHz);
    const left = context.createOscillator();
    const right = context.createOscillator();
    const leftPan = context.createStereoPanner();
    const rightPan = context.createStereoPanner();
    const gain = context.createGain();
    left.type = "sine";
    right.type = "sine";
    left.frequency.value = frequencies.leftHz;
    right.frequency.value = frequencies.rightHz;
    leftPan.pan.value = -1;
    rightPan.pan.value = 1;
    gain.gain.value = this.effectiveGain("binaural", gainValue);
    left.connect(leftPan);
    right.connect(rightPan);
    leftPan.connect(gain);
    rightPan.connect(gain);
    gain.connect(master);
    this.binauralRuntime = { left, right, gain };
    this.sourceGains.set("binaural", gain);
    left.start(startAt);
    right.start(startAt);
  }

  private createBrownNoiseGraph(
    gainValue: number,
    startAt: number,
    master: GainNode,
  ): void {
    const context = this.requireContext();
    if (!this.brownNoiseBuffer) {
      throw new SourceLoadError(
        "brownNoise",
        "Brown noise buffer is unavailable.",
      );
    }
    const source = context.createBufferSource();
    const gain = context.createGain();
    source.buffer = this.brownNoiseBuffer;
    source.loop = true;
    gain.gain.value = this.effectiveGain("brownNoise", gainValue);
    source.connect(gain);
    gain.connect(master);
    this.brownNoiseRuntime = { source, gain };
    this.sourceGains.set("brownNoise", gain);
    source.start(startAt);
  }

  private createBrownNoiseBuffer(context: AudioContext): AudioBuffer {
    const length = Math.floor(context.sampleRate * BROWN_NOISE_SECONDS);
    const buffer = context.createBuffer(2, length, context.sampleRate);
    const samples = createBrownNoiseSamples({ length });
    buffer.copyToChannel(samples, 0);
    buffer.copyToChannel(samples, 1);
    return buffer;
  }

  private effectiveGain(sourceId: AudioSourceId, fallback: number): number {
    const value = this.sourceGainValues.get(sourceId) ?? fallback;
    return this.sourceMuted.get(sourceId)
      ? SILENT_GAIN
      : Math.max(SILENT_GAIN, value);
  }

  private scheduleSourceStops(endAt: number): void {
    for (const runtime of this.stemRuntime.values()) {
      runtime.source.stop(endAt);
    }
    this.brownNoiseRuntime?.source.stop(endAt);
    this.binauralRuntime?.left.stop(endAt);
    this.binauralRuntime?.right.stop(endAt);
  }

  private async showPlaybackNotification(preset: AudioPreset): Promise<void> {
    try {
      let permission = await AudioManager.checkNotificationPermissions();
      if (permission === "Undetermined") {
        permission = await AudioManager.requestNotificationPermissions();
      }
      this.notificationPermissionGranted = permission === "Granted";
      if (!this.notificationPermissionGranted) {
        return;
      }
      await PlaybackNotificationManager.enableControl("play", true);
      await PlaybackNotificationManager.enableControl("pause", true);
      await PlaybackNotificationManager.enableControl("stop", true);
      await PlaybackNotificationManager.show({
        title: preset.title,
        artist: "Ritual Audio",
        album: "Sleep rituals",
        state: "playing",
        speed: 1,
      });
    } catch {
      this.notificationPermissionGranted = false;
      // Playback remains available when notification permission is unavailable.
    }
  }

  private removeSubscriptions(): void {
    for (const subscription of this.subscriptions) {
      subscription.remove();
    }
    this.subscriptions = [];
  }
}
