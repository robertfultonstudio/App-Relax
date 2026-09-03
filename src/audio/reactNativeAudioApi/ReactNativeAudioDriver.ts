import {
  AudioContext,
  AudioManager,
  PlaybackNotificationManager,
  type AudioBuffer,
  type AudioBufferSourceNode,
  type GainNode,
  type OscillatorNode,
} from "react-native-audio-api";
import { Asset } from "expo-asset";
import type {
  AudioPreset,
  AudioSourceId,
  StemSourceId,
} from "@/domain/audio/types";
import {
  dbToLinear,
  type SingleTrackProgram,
} from "@/domain/audio/consumerTypes";
import {
  SourceLoadError,
  type AudioGraphDriver,
  type RemoteCommandHandlers,
} from "@/audio/AudioGraphDriver";
import { getBinauralFrequencies } from "@/audio/generators/binaural";
import { createBrownNoiseSamples } from "@/audio/generators/brownNoise";
import {
  createColoredNoiseSamples,
  createSeededRandom,
} from "@/audio/generators/coloredNoise";
import { STEM_ASSETS } from "./stemAssets";
import { CONSUMER_ASSETS } from "./consumerAssets";
import {
  createStreamingStemSource,
  stopStreamingStemSource,
  type NativeFileSourceNode,
  type StreamingStemSource,
} from "./StreamingStemSource";

interface RemovableSubscription {
  remove(): void;
}

interface StemRuntime {
  source: NativeFileSourceNode;
  output: StreamingStemSource["output"];
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

type NotificationPlaybackState = "hidden" | "paused" | "playing";

const SILENT_GAIN = 0.0001;
const BROWN_NOISE_SECONDS = 8;
const CONSUMER_NOISE_SECONDS = 8;

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
  private readonly stemLocalUris = new Map<StemSourceId, string>();
  private brownNoiseBuffer: AudioBuffer | null = null;
  private readonly stemRuntime = new Map<StemSourceId, StemRuntime>();
  private brownNoiseRuntime: BufferRuntime | null = null;
  private singleTrackRuntime: StemRuntime | null = null;
  private singleTrackNoiseRuntime: BufferRuntime | null = null;
  private binauralRuntime: BinauralRuntime | null = null;
  private sourceGains = new Map<AudioSourceId, GainNode>();
  private sourceMuted = new Map<AudioSourceId, boolean>();
  private sourceGainValues = new Map<AudioSourceId, number>();
  private loadedPresetId: string | null = null;
  private loadedProgramId: string | null = null;
  private programLocalUri: string | null = null;
  private programNoiseBuffer: AudioBuffer | null = null;
  private programPlaybackGain = 1;
  private programVolume = 1;
  private graphStarted = false;
  private handlers: RemoteCommandHandlers | null = null;
  private subscriptions: RemovableSubscription[] = [];
  private notificationPermissionGranted = false;
  private notificationGeneration = 0;
  private notificationDesiredState: NotificationPlaybackState = "hidden";

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
      this.brownNoiseBuffer &&
      this.stemLocalUris.size === preset.stems.length
    ) {
      return;
    }
    await this.stop();
    this.ensureContext();
    const context = this.requireContext();
    this.stemLocalUris.clear();
    const usedStemUris = new Set<string>();
    let activeSourceId: AudioSourceId = "drone";
    let activeSourceLabel = "audio stem";

    try {
      for (const stem of preset.stems) {
        activeSourceId = stem.id;
        activeSourceLabel = stem.label;
        const descriptor = STEM_ASSETS[stem.assetKey];
        const asset = Asset.fromModule(descriptor.moduleId);
        if (asset.hash !== descriptor.md5) {
          throw new Error(`Asset hash mismatch for ${stem.label}.`);
        }
        await asset.downloadAsync();
        if (!asset.localUri?.startsWith("file://")) {
          throw new Error(`No local file available for ${stem.label}.`);
        }
        if (usedStemUris.has(asset.localUri)) {
          throw new Error(`Duplicate local file for ${stem.label}.`);
        }
        usedStemUris.add(asset.localUri);
        this.stemLocalUris.set(stem.id, asset.localUri);
      }
      activeSourceId = "brownNoise";
      activeSourceLabel = "brown noise";
      this.brownNoiseBuffer = this.createBrownNoiseBuffer(context);
      this.loadedPresetId = preset.id;
      this.loadedProgramId = null;
      this.programLocalUri = null;
      this.programNoiseBuffer = null;
      if (context.state === "running") {
        await context.suspend();
      }
    } catch (error) {
      this.stemLocalUris.clear();
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

  async loadSingleTrack(program: SingleTrackProgram): Promise<void> {
    if (
      this.loadedProgramId === program.work.id &&
      this.context &&
      (program.work.sourceKind === "generated-noise"
        ? this.programNoiseBuffer
        : this.programLocalUri)
    ) {
      return;
    }
    await this.stop();
    this.ensureContext();
    const context = this.requireContext();
    this.programLocalUri = null;
    this.programNoiseBuffer = null;
    if (program.work.sourceKind === "generated-noise") {
      if (!program.work.noiseColor) {
        throw new Error(`${program.work.title} has no noise colour defined.`);
      }
      this.programNoiseBuffer = this.createConsumerNoiseBuffer(
        context,
        program.work.noiseColor,
      );
      this.programPlaybackGain = dbToLinear(program.work.playbackGainDb);
      this.loadedProgramId = program.work.id;
      this.loadedPresetId = null;
      if (context.state === "running") await context.suspend();
      return;
    }
    const descriptor = CONSUMER_ASSETS[program.work.assetKey];
    if (!descriptor) {
      throw new Error(`${program.work.title} is not embedded in this build.`);
    }
    try {
      const asset = Asset.fromModule(descriptor.moduleId);
      if (asset.hash !== descriptor.md5) {
        throw new Error(`Asset hash mismatch for ${program.work.title}.`);
      }
      await asset.downloadAsync();
      if (!asset.localUri?.startsWith("file://")) {
        throw new Error(`No local file available for ${program.work.title}.`);
      }
      this.programLocalUri = asset.localUri;
      this.programPlaybackGain = dbToLinear(program.work.playbackGainDb);
      this.loadedProgramId = program.work.id;
      this.loadedPresetId = null;
      if (context.state === "running") await context.suspend();
    } catch (error) {
      this.programLocalUri = null;
      this.programNoiseBuffer = null;
      this.loadedProgramId = null;
      if (context.state === "running") await context.suspend();
      throw error;
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
      AudioManager.setAudioSessionOptions({
        iosCategory: "playback",
        iosMode: "default",
        iosOptions: ["allowAirPlay"],
      });
      AudioManager.observeAudioInterruptions(true);
      this.sourceGains = new Map();
      this.stemRuntime.clear();
      const master = this.masterGain ?? context.createGain();
      if (!this.masterGain) {
        master.connect(context.destination);
        this.masterGain = master;
      }
      for (const stem of preset.stems) {
        const localUri = this.stemLocalUris.get(stem.id);
        if (!localUri) {
          throw new SourceLoadError(
            stem.id,
            `Missing local file for ${stem.label}.`,
          );
        }
        const { source, output } = createStreamingStemSource(context, localUri);
        const gain = context.createGain();
        gain.gain.value = this.effectiveGain(stem.id, mix[stem.id]);
        output.connect(gain);
        gain.connect(master);
        this.stemRuntime.set(stem.id, { source, output, gain });
        this.sourceGains.set(stem.id, gain);
      }

      if (context.state === "suspended") {
        await context.resume();
      }
      await AudioManager.setAudioSessionActivity(true);
      const startAt = context.currentTime + 0.1;
      master.gain.cancelScheduledValues(context.currentTime);
      master.gain.setValueAtTime(SILENT_GAIN, context.currentTime);
      master.gain.setValueAtTime(SILENT_GAIN, startAt);
      master.gain.linearRampToValueAtTime(1, startAt + preset.fadeInSeconds);
      for (const runtime of this.stemRuntime.values()) {
        runtime.source.start(startAt);
      }
      this.createBinauralGraph(preset, mix.binaural, startAt, master);
      this.createBrownNoiseGraph(mix.brownNoise, startAt, master);
      this.graphStarted = true;
      this.notificationDesiredState = "playing";
      // Android notification setup is best-effort and can wait indefinitely on
      // platform services. The audible graph, timer and UI must not depend on it.
      const notificationGeneration = ++this.notificationGeneration;
      void this.showPlaybackNotification(
        preset.title,
        "Sleep rituals",
        notificationGeneration,
      );
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
    if (program.work.sourceKind === "file" && !this.programLocalUri) {
      throw new Error(`No local file available for ${program.work.title}.`);
    }
    if (
      program.work.sourceKind === "generated-noise" &&
      !this.programNoiseBuffer
    ) {
      throw new Error(
        `No generated buffer available for ${program.work.title}.`,
      );
    }
    try {
      const context = this.requireContext();
      AudioManager.setAudioSessionOptions({
        iosCategory: "playback",
        iosMode: "default",
        iosOptions: ["allowAirPlay"],
      });
      AudioManager.observeAudioInterruptions(true);
      const master = this.masterGain ?? context.createGain();
      if (!this.masterGain) {
        master.connect(context.destination);
        this.masterGain = master;
      }
      const gain = context.createGain();
      this.programVolume = Math.min(1, Math.max(0, volume));
      gain.gain.value = Math.max(
        SILENT_GAIN,
        this.programPlaybackGain * this.programVolume,
      );
      if (program.work.sourceKind === "generated-noise") {
        const source = context.createBufferSource();
        source.buffer = this.programNoiseBuffer;
        source.loop = true;
        source.connect(gain);
        gain.connect(master);
        this.singleTrackNoiseRuntime = { source, gain };
      } else {
        const { source, output } = createStreamingStemSource(
          context,
          this.programLocalUri!,
        );
        output.connect(gain);
        gain.connect(master);
        this.singleTrackRuntime = { source, output, gain };
      }

      if (context.state === "suspended") await context.resume();
      await AudioManager.setAudioSessionActivity(true);
      const startAt = context.currentTime + 0.1;
      master.gain.cancelScheduledValues(context.currentTime);
      master.gain.setValueAtTime(SILENT_GAIN, context.currentTime);
      master.gain.setValueAtTime(SILENT_GAIN, startAt);
      master.gain.linearRampToValueAtTime(1, startAt + program.fadeInSeconds);
      if (this.singleTrackNoiseRuntime) {
        this.singleTrackNoiseRuntime.source.start(startAt);
      } else {
        this.singleTrackRuntime?.source.start(startAt);
      }
      this.graphStarted = true;
      this.notificationDesiredState = "playing";
      const generation = ++this.notificationGeneration;
      void this.showPlaybackNotification(
        program.work.title,
        "App Relax",
        generation,
      );
    } catch (error) {
      await this.stop();
      throw error;
    }
  }

  async resume(): Promise<void> {
    if (!this.context || !this.graphStarted) {
      return;
    }
    const notificationGeneration = ++this.notificationGeneration;
    this.notificationDesiredState = "playing";
    await this.context.resume();
    AudioManager.observeAudioInterruptions(true);
    await AudioManager.setAudioSessionActivity(true);
    if (this.notificationPermissionGranted) {
      try {
        await PlaybackNotificationManager.show({ state: "playing", speed: 1 });
        if (notificationGeneration !== this.notificationGeneration) {
          await this.reconcilePlaybackNotification();
        }
      } catch {
        if (notificationGeneration === this.notificationGeneration) {
          this.notificationPermissionGranted = false;
        }
      }
    }
  }

  async pause(releaseAudioFocus: boolean): Promise<void> {
    if (!this.context || !this.graphStarted) {
      return;
    }
    const notificationGeneration = ++this.notificationGeneration;
    this.notificationDesiredState = "paused";
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
        if (notificationGeneration !== this.notificationGeneration) {
          await this.reconcilePlaybackNotification();
        }
      } catch {
        if (notificationGeneration === this.notificationGeneration) {
          this.notificationPermissionGranted = false;
        }
      }
    }
  }

  async stop(): Promise<void> {
    const notificationGeneration = ++this.notificationGeneration;
    this.notificationDesiredState = "hidden";
    if (this.context && this.masterGain) {
      const now = this.context.currentTime;
      this.masterGain.gain.cancelScheduledValues(now);
      this.masterGain.gain.setValueAtTime(SILENT_GAIN, now);
    }

    for (const runtime of this.stemRuntime.values()) {
      stopStreamingStemSource(runtime);
      runtime.gain.disconnect();
    }
    this.stemRuntime.clear();

    if (this.singleTrackRuntime) {
      stopStreamingStemSource(this.singleTrackRuntime);
      this.singleTrackRuntime.gain.disconnect();
      this.singleTrackRuntime = null;
    }

    if (this.singleTrackNoiseRuntime) {
      safeStop(this.singleTrackNoiseRuntime.source);
      this.singleTrackNoiseRuntime.gain.disconnect();
      this.singleTrackNoiseRuntime = null;
    }

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
    if (notificationGeneration === this.notificationGeneration) {
      this.notificationPermissionGranted = false;
    } else {
      await this.reconcilePlaybackNotification();
    }
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
    this.stemLocalUris.clear();
    this.brownNoiseBuffer = null;
    this.loadedPresetId = null;
    this.loadedProgramId = null;
    this.programLocalUri = null;
    this.programNoiseBuffer = null;
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

  async setMasterVolume(volume: number, fadeMs: number): Promise<void> {
    this.programVolume = Math.min(1, Math.max(0, volume));
    const node =
      this.singleTrackRuntime?.gain ?? this.singleTrackNoiseRuntime?.gain;
    if (!node || !this.context) return;
    const now = this.context.currentTime;
    const target = Math.max(
      SILENT_GAIN,
      this.programPlaybackGain * this.programVolume,
    );
    node.gain.cancelScheduledValues(now);
    node.gain.setValueAtTime(Math.max(SILENT_GAIN, node.gain.value), now);
    if (fadeMs > 0)
      node.gain.linearRampToValueAtTime(target, now + fadeMs / 1000);
    else node.gain.setValueAtTime(target, now);
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
      const notificationGeneration = this.notificationGeneration;
      try {
        await PlaybackNotificationManager.show({
          duration: remainingMs / 1000,
          elapsedTime: 0,
        });
        if (notificationGeneration !== this.notificationGeneration) {
          await this.reconcilePlaybackNotification();
        }
      } catch {
        if (notificationGeneration === this.notificationGeneration) {
          this.notificationPermissionGranted = false;
        }
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

  private createConsumerNoiseBuffer(
    context: AudioContext,
    color: NonNullable<SingleTrackProgram["work"]["noiseColor"]>,
  ): AudioBuffer {
    const length = Math.floor(context.sampleRate * CONSUMER_NOISE_SECONDS);
    const buffer = context.createBuffer(2, length, context.sampleRate);
    const seed = [...color].reduce(
      (value, character) => (value * 31 + character.charCodeAt(0)) >>> 0,
      0x51a7c0de,
    );
    const samples = createColoredNoiseSamples({
      color,
      length,
      sampleRate: context.sampleRate,
      random: createSeededRandom(seed),
    });
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
    this.singleTrackRuntime?.source.stop(endAt);
    this.singleTrackNoiseRuntime?.source.stop(endAt);
  }

  private isCurrentNotificationGeneration(generation: number): boolean {
    return generation === this.notificationGeneration && this.graphStarted;
  }

  private async reconcilePlaybackNotification(): Promise<void> {
    for (;;) {
      const generation = this.notificationGeneration;
      const desiredState = this.notificationDesiredState;
      try {
        if (desiredState === "hidden" || !this.notificationPermissionGranted) {
          await PlaybackNotificationManager.hide();
        } else {
          await PlaybackNotificationManager.show({
            state: desiredState,
            speed: desiredState === "playing" ? 1 : 0,
          });
        }
      } catch {
        if (generation === this.notificationGeneration) {
          this.notificationPermissionGranted = false;
        }
        return;
      }
      if (
        generation === this.notificationGeneration &&
        desiredState === this.notificationDesiredState
      ) {
        return;
      }
    }
  }

  private async showPlaybackNotification(
    title: string,
    album: string,
    generation: number,
  ): Promise<void> {
    try {
      let permission = await AudioManager.checkNotificationPermissions();
      if (!this.isCurrentNotificationGeneration(generation)) {
        return;
      }
      if (permission === "Undetermined") {
        permission = await AudioManager.requestNotificationPermissions();
      }
      if (!this.isCurrentNotificationGeneration(generation)) {
        return;
      }
      this.notificationPermissionGranted = permission === "Granted";
      if (!this.notificationPermissionGranted) {
        return;
      }
      await PlaybackNotificationManager.enableControl("play", true);
      if (!this.isCurrentNotificationGeneration(generation)) {
        return;
      }
      await PlaybackNotificationManager.enableControl("pause", true);
      if (!this.isCurrentNotificationGeneration(generation)) {
        return;
      }
      await PlaybackNotificationManager.enableControl("stop", true);
      if (!this.isCurrentNotificationGeneration(generation)) {
        return;
      }
      await PlaybackNotificationManager.show({
        title,
        artist: "Ritual Audio",
        album,
        state: "playing",
        speed: 1,
      });
      if (!this.isCurrentNotificationGeneration(generation)) {
        await this.reconcilePlaybackNotification();
      }
    } catch {
      if (this.isCurrentNotificationGeneration(generation)) {
        this.notificationPermissionGranted = false;
      }
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
