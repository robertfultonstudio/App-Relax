import type { AudioGraphDriver } from "./AudioGraphDriver";
import { SourceLoadError } from "./AudioGraphDriver";
import type {
  AudioEngine,
  AudioPreset,
  AudioSourceId,
  SessionListener,
  SessionSnapshot,
  SourceKind,
  SourceSnapshot,
} from "@/domain/audio/types";
import { AUDIO_SOURCE_IDS } from "@/domain/audio/types";
import { assertValidPreset } from "@/domain/audio/presetValidation";
import type { SingleTrackProgram } from "@/domain/audio/consumerTypes";
import type {
  PlayerPreferences,
  PlayerPreferencesStore,
} from "@/state/playerPersistence";
import type {
  ConsumerPlayerPreferences,
  ConsumerPlayerPreferencesStore,
} from "@/state/consumerPlayerPersistence";

const nullConsumerStore: ConsumerPlayerPreferencesStore = {
  async load() {
    return null;
  },
  async save() {},
};

const SOURCE_METADATA: Record<
  AudioSourceId,
  { label: string; kind: SourceKind }
> = {
  drone: { label: "Moon drone", kind: "stem" },
  ambience: { label: "Deep river", kind: "stem" },
  texture: { label: "Air texture", kind: "stem" },
  binaural: { label: "Binaural pulse", kind: "binaural" },
  brownNoise: { label: "Brown noise", kind: "noise" },
};

export interface ControllerRuntime {
  now(): number;
  setInterval(
    callback: () => void,
    milliseconds: number,
  ): ReturnType<typeof setInterval>;
  clearInterval(handle: ReturnType<typeof setInterval>): void;
}

const defaultRuntime: ControllerRuntime = {
  now: Date.now,
  setInterval: (callback, milliseconds) => setInterval(callback, milliseconds),
  clearInterval: (handle) => clearInterval(handle),
};

function createSourceSnapshot(
  sourceId: AudioSourceId,
  gain = 0,
): SourceSnapshot {
  const metadata = SOURCE_METADATA[sourceId];
  return {
    id: sourceId,
    label: metadata.label,
    kind: metadata.kind,
    gain,
    muted: false,
    loadingState: "idle",
    fadeState: "idle",
    error: null,
  };
}

function createSourceRecord(): Record<AudioSourceId, SourceSnapshot> {
  return Object.fromEntries(
    AUDIO_SOURCE_IDS.map((sourceId) => [
      sourceId,
      createSourceSnapshot(sourceId),
    ]),
  ) as Record<AudioSourceId, SourceSnapshot>;
}

function clampGain(gain: number): number {
  if (!Number.isFinite(gain)) {
    throw new Error("Gain must be a finite number.");
  }
  return Math.min(1, Math.max(0, gain));
}

function errorMessage(error: unknown): string {
  return error instanceof Error ? error.message : "Unknown audio error.";
}

export class AudioSessionController implements AudioEngine {
  private snapshot: SessionSnapshot;
  private readonly listeners = new Set<SessionListener>();
  private currentPreset: AudioPreset | null = null;
  private currentProgram: SingleTrackProgram | null = null;
  private restoredPreferences: PlayerPreferences | null = null;
  private restoredConsumerPreferences: ConsumerPlayerPreferences | null = null;
  private hydrationPromise: Promise<void> | null = null;
  private commandChain: Promise<void> = Promise.resolve();
  private ticker: ReturnType<typeof setInterval> | null = null;
  private deadlineGeneration = 0;
  private terminalStopQueued = false;
  private pausedByInterruption = false;
  private active = false;

  constructor(
    private readonly driver: AudioGraphDriver,
    private readonly preferencesStore: PlayerPreferencesStore,
    private readonly runtime: ControllerRuntime = defaultRuntime,
    private readonly consumerPreferencesStore: ConsumerPlayerPreferencesStore = nullConsumerStore,
  ) {
    this.snapshot = {
      mode: null,
      status: "idle",
      presetId: null,
      workId: null,
      title: null,
      volume: 0.8,
      selectedDurationMinutes: 30,
      remainingMs: 30 * 60_000,
      deadlineMs: null,
      sources: createSourceRecord(),
      capabilities: driver.capabilities,
      error: null,
      hydrated: false,
    };
  }

  activate(): void {
    if (this.active) {
      return;
    }
    this.active = true;
    this.attachRemoteCommandHandlers();
  }

  private attachRemoteCommandHandlers(): void {
    this.driver.setRemoteCommandHandlers({
      play: () => void this.play(),
      pause: () => void this.pause(),
      stop: () => void this.stop(),
      interruption: (began, shouldResume) => {
        void this.enqueue(async () => {
          if (began) {
            if (
              this.snapshot.status === "playing" ||
              this.snapshot.status === "fadingOut"
            ) {
              this.pausedByInterruption = true;
              await this.pauseInternal(false);
            }
            return;
          }

          const shouldRestart = shouldResume && this.pausedByInterruption;
          this.pausedByInterruption = false;
          if (shouldRestart && this.snapshot.status === "paused") {
            await this.playInternal();
          }
        });
      },
    });
  }

  getSnapshot = (): SessionSnapshot => this.snapshot;

  subscribe = (listener: SessionListener): (() => void) => {
    this.listeners.add(listener);
    return () => this.listeners.delete(listener);
  };

  async hydrate(): Promise<void> {
    if (!this.hydrationPromise) {
      this.hydrationPromise = this.hydrateInternal();
    }
    return this.hydrationPromise;
  }

  private async hydrateInternal(): Promise<void> {
    try {
      const [technical, consumer] = await Promise.all([
        this.preferencesStore.load(),
        this.consumerPreferencesStore.load(),
      ]);
      this.restoredPreferences = technical;
      this.restoredConsumerPreferences = consumer;
      this.patch({ hydrated: true });
    } catch (error) {
      this.patch({
        hydrated: true,
        error: `Settings could not be restored: ${errorMessage(error)}`,
      });
    }
  }

  loadPreset(preset: AudioPreset): Promise<void> {
    return this.enqueue(async () => {
      await this.hydrate();
      assertValidPreset(preset);
      if (
        this.currentPreset?.id === preset.id &&
        this.snapshot.status !== "error"
      ) {
        return;
      }

      await this.stopInternal(false);
      this.currentPreset = preset;
      this.currentProgram = null;
      const restored =
        this.restoredPreferences?.presetId === preset.id
          ? this.restoredPreferences
          : null;
      const duration =
        restored &&
        preset.durationOptionsMinutes.includes(restored.durationMinutes)
          ? restored.durationMinutes
          : (preset.durationOptionsMinutes[1] ??
            preset.durationOptionsMinutes[0]);

      const sources = Object.fromEntries(
        AUDIO_SOURCE_IDS.map((sourceId) => {
          const gain = restored?.gains[sourceId] ?? preset.defaultMix[sourceId];
          return [
            sourceId,
            {
              ...createSourceSnapshot(sourceId, gain),
              muted: restored?.muted[sourceId] ?? false,
              loadingState: "loading" as const,
            },
          ];
        }),
      ) as Record<AudioSourceId, SourceSnapshot>;

      this.patch({
        mode: "technical",
        status: "loading",
        presetId: preset.id,
        workId: null,
        title: preset.title,
        selectedDurationMinutes: duration,
        remainingMs: duration * 60_000,
        deadlineMs: null,
        sources,
        error: null,
      });

      try {
        await this.driver.loadPreset(preset);
        for (const sourceId of AUDIO_SOURCE_IDS) {
          const source = this.snapshot.sources[sourceId];
          await this.driver.setSourceGain(
            sourceId,
            source.gain,
            source.muted,
            0,
          );
        }
        this.mapSources((source) => ({
          ...source,
          loadingState: "ready",
          error: null,
        }));
        this.patch({ status: "ready" });
      } catch (error) {
        if (error instanceof SourceLoadError) {
          this.updateSource(error.sourceId, {
            loadingState: "error",
            error: error.message,
          });
        }
        this.patch({ status: "error", error: errorMessage(error) });
      }
    });
  }

  loadProgram(program: SingleTrackProgram): Promise<void> {
    return this.enqueue(async () => {
      await this.hydrate();
      if (program.kind !== "single-track" || !program.work.loop) {
        throw new Error("Invalid single-track program.");
      }
      if (
        this.currentProgram?.work.id === program.work.id &&
        this.snapshot.status !== "error"
      ) {
        return;
      }
      await this.stopInternal(false);
      this.currentPreset = null;
      this.currentProgram = program;
      const restored =
        this.restoredConsumerPreferences?.workId === program.work.id
          ? this.restoredConsumerPreferences
          : null;
      const duration =
        restored &&
        program.durationOptionsMinutes.includes(restored.durationMinutes)
          ? restored.durationMinutes
          : (program.durationOptionsMinutes[1] ??
            program.durationOptionsMinutes[0]);
      this.patch({
        mode: "consumer",
        status: "loading",
        presetId: null,
        workId: program.work.id,
        title: program.work.title,
        volume: restored?.volume ?? 0.8,
        selectedDurationMinutes: duration,
        remainingMs: duration * 60_000,
        deadlineMs: null,
        sources: createSourceRecord(),
        error: null,
      });
      try {
        await this.driver.loadSingleTrack(program);
        this.patch({ status: "ready" });
      } catch (error) {
        this.patch({ status: "error", error: errorMessage(error) });
      }
    });
  }

  play(): Promise<void> {
    this.activate();
    return this.enqueue(() => this.playInternal());
  }

  private async playInternal(): Promise<void> {
    if (
      (!this.currentPreset && !this.currentProgram) ||
      this.snapshot.status === "loading" ||
      this.snapshot.status === "error"
    ) {
      return;
    }
    if (
      this.snapshot.status === "playing" ||
      this.snapshot.status === "fadingOut"
    ) {
      return;
    }

    try {
      const isResume = this.snapshot.status === "paused";
      if (isResume) {
        await this.driver.resume();
      } else if (this.currentProgram) {
        await this.driver.startSingleTrack(
          this.currentProgram,
          this.snapshot.volume,
        );
      } else {
        const preset = this.currentPreset;
        if (!preset) return;
        const mix = Object.fromEntries(
          AUDIO_SOURCE_IDS.map((sourceId) => [
            sourceId,
            this.snapshot.sources[sourceId].gain,
          ]),
        ) as Record<AudioSourceId, number>;
        await this.driver.start(preset, mix);
      }

      const remainingMs =
        this.snapshot.remainingMs > 0
          ? this.snapshot.remainingMs
          : this.snapshot.selectedDurationMinutes * 60_000;
      const deadlineMs = this.runtime.now() + remainingMs;
      this.terminalStopQueued = false;
      this.pausedByInterruption = false;
      this.deadlineGeneration += 1;
      await this.driver.scheduleFadeOut(
        remainingMs,
        this.activeFadeOutSeconds() * 1000,
      );
      this.patch({ status: "playing", remainingMs, deadlineMs, error: null });
      this.startTicker();
    } catch (error) {
      this.deadlineGeneration += 1;
      this.clearTicker();
      try {
        await this.driver.stop();
      } catch {
        // Preserve the original playback failure for the user-facing error.
      }
      this.patch({
        status: "error",
        deadlineMs: null,
        error: `Playback could not start: ${errorMessage(error)}`,
      });
    }
  }

  pause(): Promise<void> {
    return this.enqueue(async () => {
      const convertInterruptionPauseToManual =
        this.pausedByInterruption && this.snapshot.status === "paused";
      this.pausedByInterruption = false;
      if (convertInterruptionPauseToManual) {
        await this.driver.pause(true);
        return;
      }
      await this.pauseInternal(true);
    });
  }

  stop(): Promise<void> {
    return this.enqueue(() => this.stopInternal(true));
  }

  dispose(): Promise<void> {
    this.active = false;
    return this.enqueue(async () => {
      this.deadlineGeneration += 1;
      this.clearTicker();
      await this.driver.dispose();
      this.currentPreset = null;
      this.currentProgram = null;
      this.patch({
        mode: null,
        status: "idle",
        presetId: null,
        workId: null,
        title: null,
        deadlineMs: null,
        sources: createSourceRecord(),
      });
      if (this.active) {
        this.attachRemoteCommandHandlers();
      }
    });
  }

  setSourceGain(
    sourceId: AudioSourceId,
    gain: number,
    fadeMs = 180,
  ): Promise<void> {
    return this.enqueue(async () => {
      const nextGain = clampGain(gain);
      const current = this.snapshot.sources[sourceId];
      this.updateSource(sourceId, {
        gain: nextGain,
        fadeState: nextGain < current.gain ? "fadingOut" : "fadingIn",
      });
      try {
        await this.driver.setSourceGain(
          sourceId,
          nextGain,
          current.muted,
          fadeMs,
        );
        this.updateSource(sourceId, { fadeState: "idle", error: null });
        await this.persist();
      } catch (error) {
        const message = errorMessage(error);
        this.updateSource(sourceId, { fadeState: "idle", error: message });
        this.patch({ error: `Could not change ${current.label}: ${message}` });
      }
    });
  }

  setSourceMuted(
    sourceId: AudioSourceId,
    muted: boolean,
    fadeMs = 240,
  ): Promise<void> {
    return this.enqueue(async () => {
      const current = this.snapshot.sources[sourceId];
      this.updateSource(sourceId, {
        muted,
        fadeState: muted ? "fadingOut" : "fadingIn",
      });
      try {
        await this.driver.setSourceGain(sourceId, current.gain, muted, fadeMs);
        this.updateSource(sourceId, { fadeState: "idle", error: null });
        await this.persist();
      } catch (error) {
        const message = errorMessage(error);
        this.updateSource(sourceId, { fadeState: "idle", error: message });
        this.patch({ error: `Could not change ${current.label}: ${message}` });
      }
    });
  }

  setTimer(durationMinutes: number): Promise<void> {
    return this.enqueue(async () => {
      if (
        this.snapshot.status === "playing" ||
        this.snapshot.status === "fadingOut"
      ) {
        throw new Error("Pause or stop playback before changing the timer.");
      }
      if (!this.activeDurationOptions().includes(durationMinutes)) {
        throw new Error("Unsupported duration for this preset.");
      }
      const remainingMs = durationMinutes * 60_000;
      this.patch({
        selectedDurationMinutes: durationMinutes,
        remainingMs,
        deadlineMs: null,
      });
      await this.persist();
    });
  }

  setVolume(volume: number, fadeMs = 180): Promise<void> {
    return this.enqueue(async () => {
      if (!this.currentProgram) return;
      const next = clampGain(volume);
      await this.driver.setMasterVolume(next, fadeMs);
      this.patch({ volume: next, error: null });
      await this.persist();
    });
  }

  private enqueue(operation: () => Promise<void>): Promise<void> {
    const next = this.commandChain.then(operation, operation);
    this.commandChain = next.catch(() => undefined);
    return next;
  }

  private async stopInternal(resetTimer: boolean): Promise<void> {
    this.deadlineGeneration += 1;
    this.terminalStopQueued = false;
    this.pausedByInterruption = false;
    this.clearTicker();
    await this.driver.stop();
    const remainingMs = resetTimer
      ? this.snapshot.selectedDurationMinutes * 60_000
      : this.snapshot.remainingMs;
    this.patch({
      status: this.currentPreset || this.currentProgram ? "ready" : "idle",
      deadlineMs: null,
      remainingMs,
      sources: Object.fromEntries(
        AUDIO_SOURCE_IDS.map((sourceId) => [
          sourceId,
          { ...this.snapshot.sources[sourceId], fadeState: "idle" },
        ]),
      ) as Record<AudioSourceId, SourceSnapshot>,
    });
  }

  private async pauseInternal(releaseAudioFocus: boolean): Promise<void> {
    if (
      this.snapshot.status !== "playing" &&
      this.snapshot.status !== "fadingOut"
    ) {
      return;
    }
    const remainingMs = this.remainingFromDeadline();
    this.deadlineGeneration += 1;
    this.clearTicker();
    await this.driver.pause(releaseAudioFocus);
    await this.driver.cancelScheduledFade();
    this.patch({
      status: "paused",
      remainingMs,
      deadlineMs: null,
      sources: Object.fromEntries(
        AUDIO_SOURCE_IDS.map((sourceId) => [
          sourceId,
          { ...this.snapshot.sources[sourceId], fadeState: "idle" },
        ]),
      ) as Record<AudioSourceId, SourceSnapshot>,
    });
  }

  private startTicker(): void {
    this.clearTicker();
    const generation = this.deadlineGeneration;
    this.ticker = this.runtime.setInterval(() => {
      if (generation !== this.deadlineGeneration) {
        return;
      }
      this.reconcileTimer();
    }, 500);
    this.reconcileTimer();
  }

  private reconcileTimer(): void {
    if (
      (this.snapshot.status !== "playing" &&
        this.snapshot.status !== "fadingOut") ||
      this.snapshot.deadlineMs === null ||
      (!this.currentPreset && !this.currentProgram)
    ) {
      return;
    }

    const remainingMs = this.remainingFromDeadline();
    const fadeMs = this.activeFadeOutSeconds() * 1000;
    const status = remainingMs <= fadeMs ? "fadingOut" : "playing";
    const enteringFade =
      status === "fadingOut" && this.snapshot.status !== "fadingOut";
    this.patch({
      remainingMs,
      status,
      ...(enteringFade
        ? {
            sources: Object.fromEntries(
              AUDIO_SOURCE_IDS.map((sourceId) => [
                sourceId,
                { ...this.snapshot.sources[sourceId], fadeState: "fadingOut" },
              ]),
            ) as Record<AudioSourceId, SourceSnapshot>,
          }
        : {}),
    });

    if (remainingMs === 0 && !this.terminalStopQueued) {
      this.terminalStopQueued = true;
      void this.enqueue(async () => {
        await this.driver.stop();
        this.clearTicker();
        this.patch({
          status: "ready",
          deadlineMs: null,
          remainingMs: this.snapshot.selectedDurationMinutes * 60_000,
          sources: Object.fromEntries(
            AUDIO_SOURCE_IDS.map((sourceId) => [
              sourceId,
              { ...this.snapshot.sources[sourceId], fadeState: "idle" },
            ]),
          ) as Record<AudioSourceId, SourceSnapshot>,
        });
      });
    }
  }

  private remainingFromDeadline(): number {
    return Math.max(
      0,
      (this.snapshot.deadlineMs ?? this.runtime.now()) - this.runtime.now(),
    );
  }

  private clearTicker(): void {
    if (this.ticker !== null) {
      this.runtime.clearInterval(this.ticker);
      this.ticker = null;
    }
  }

  private patch(patch: Partial<SessionSnapshot>): void {
    this.snapshot = { ...this.snapshot, ...patch };
    for (const listener of this.listeners) {
      listener(this.snapshot);
    }
  }

  private updateSource(
    sourceId: AudioSourceId,
    patch: Partial<SourceSnapshot>,
  ): void {
    this.patch({
      sources: {
        ...this.snapshot.sources,
        [sourceId]: { ...this.snapshot.sources[sourceId], ...patch },
      },
    });
  }

  private mapSources(mapper: (source: SourceSnapshot) => SourceSnapshot): void {
    this.patch({
      sources: Object.fromEntries(
        AUDIO_SOURCE_IDS.map((sourceId) => [
          sourceId,
          mapper(this.snapshot.sources[sourceId]),
        ]),
      ) as Record<AudioSourceId, SourceSnapshot>,
    });
  }

  private async persist(): Promise<void> {
    if (this.currentProgram) {
      try {
        await this.consumerPreferencesStore.save({
          schemaVersion: 1,
          workId: this.currentProgram.work.id,
          durationMinutes: this.snapshot.selectedDurationMinutes,
          volume: this.snapshot.volume,
        });
      } catch (error) {
        this.patch({
          error: `Settings could not be saved: ${errorMessage(error)}`,
        });
      }
      return;
    }
    if (!this.currentPreset) {
      return;
    }
    const preferences: PlayerPreferences = {
      schemaVersion: 1,
      presetId: this.currentPreset.id,
      durationMinutes: this.snapshot.selectedDurationMinutes,
      gains: Object.fromEntries(
        AUDIO_SOURCE_IDS.map((sourceId) => [
          sourceId,
          this.snapshot.sources[sourceId].gain,
        ]),
      ) as Record<AudioSourceId, number>,
      muted: Object.fromEntries(
        AUDIO_SOURCE_IDS.map((sourceId) => [
          sourceId,
          this.snapshot.sources[sourceId].muted,
        ]),
      ) as Record<AudioSourceId, boolean>,
    };
    try {
      await this.preferencesStore.save(preferences);
    } catch (error) {
      this.patch({
        error: `Settings could not be saved: ${errorMessage(error)}`,
      });
    }
  }

  private activeDurationOptions(): readonly number[] {
    return (
      this.currentProgram?.durationOptionsMinutes ??
      this.currentPreset?.durationOptionsMinutes ??
      []
    );
  }

  private activeFadeOutSeconds(): number {
    return (
      this.currentProgram?.fadeOutSeconds ??
      this.currentPreset?.fadeOutSeconds ??
      0
    );
  }
}
