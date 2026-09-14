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
import {
  consumerSelectionKey,
  type ConsumerSelection,
} from "@/domain/audio/consumerSelection";
import type {
  AdaptiveSessionProgram,
  NatureMixLevel,
} from "@/domain/sessions/types";
import type { TransitionAudition } from "@/domain/sessions/workbench";
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

/** An explicit Stop/dispose is not a decoder failure or a successful Start. */
export class PlaybackCancelledError extends Error {
  constructor() {
    super("Playback cancelled.");
    this.name = "PlaybackCancelledError";
  }
}

export class AudioSessionController implements AudioEngine {
  private snapshot: SessionSnapshot;
  private readonly listeners = new Set<SessionListener>();
  private currentPreset: AudioPreset | null = null;
  private currentProgram: SingleTrackProgram | null = null;
  private currentAdaptiveProgram: AdaptiveSessionProgram | null = null;
  private restoredPreferences: PlayerPreferences | null = null;
  private restoredConsumerPreferences: ConsumerPlayerPreferences | null = null;
  private hydrationPromise: Promise<void> | null = null;
  private commandChain: Promise<void> = Promise.resolve();
  private ticker: ReturnType<typeof setInterval> | null = null;
  private deadlineGeneration = 0;
  private terminalStopQueued = false;
  private pausedByInterruption = false;
  private active = false;
  private selection: ConsumerSelection | null = null;
  private selectionGeneration = 0;
  private startPending = false;
  private pendingStart: Promise<void> | null = null;
  private listeningRun = 0;
  private preparedSelection: {
    selection: ConsumerSelection;
    driver: AudioGraphDriver;
    ready: boolean;
  } | null = null;
  private cancelOperation: (() => void) | null = null;

  constructor(
    private driver: AudioGraphDriver,
    private readonly preferencesStore: PlayerPreferencesStore,
    private readonly runtime: ControllerRuntime = defaultRuntime,
    private readonly consumerPreferencesStore: ConsumerPlayerPreferencesStore = nullConsumerStore,
    private readonly createConsumerDriver?: () => AudioGraphDriver,
  ) {
    this.snapshot = {
      mode: null,
      status: "idle",
      presetId: null,
      workId: null,
      sessionPlanId: null,
      title: null,
      volume: 0.8,
      natureMixLevel: null,
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
    this.attachAdaptiveSessionEventHandlers();
  }

  private attachAdaptiveSessionEventHandlers(): void {
    this.driver.setAdaptiveSessionEventHandlers({
      ended: (planId) => {
        const generation = this.deadlineGeneration;
        void this.enqueue(async () => {
          if (
            this.currentAdaptiveProgram?.plan.id !== planId ||
            (this.snapshot.status !== "playing" &&
              this.snapshot.status !== "fadingOut")
          ) {
            return;
          }
          await this.completeNaturally(generation);
        });
      },
      error: (planId, error) => {
        const generation = this.deadlineGeneration;
        void this.enqueue(async () => {
          if (
            generation !== this.deadlineGeneration ||
            this.currentAdaptiveProgram?.plan.id !== planId ||
            (this.snapshot.status !== "playing" &&
              this.snapshot.status !== "fadingOut")
          ) {
            return;
          }
          this.deadlineGeneration += 1;
          this.terminalStopQueued = false;
          this.clearTicker();
          await this.driver.stop().catch(() => undefined);
          this.patch({
            status: "error",
            deadlineMs: null,
            error: errorMessage(error),
          });
        });
      },
    });
  }

  private attachRemoteCommandHandlers(): void {
    this.driver.setRemoteCommandHandlers({
      error: (error) => {
        void this.enqueue(async () => {
          await this.pauseInternal(false);
          this.patch({ error: errorMessage(error) });
        });
      },
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
  getReviewReadMetrics = () => this.driver.getReviewReadMetrics?.() ?? null;

  getConsumerSelection = (): ConsumerSelection | null => this.selection;
  getListeningRun = (): number => this.listeningRun;

  /** Prepare a silent, separate candidate. Browsing never replaces the current sound. */
  async prepareSelection(selection: ConsumerSelection): Promise<void> {
    if (
      this.preparedSelection &&
      consumerSelectionKey(this.preparedSelection.selection) ===
        consumerSelectionKey(selection) &&
      this.preparedSelection.ready
    )
      return;
    if (!this.createConsumerDriver)
      throw new Error("This playback surface cannot prepare a session.");
    const generation = ++this.selectionGeneration;
    const old = this.preparedSelection;
    const candidate = {
      selection,
      driver: this.createConsumerDriver(),
      ready: false,
    };
    this.preparedSelection = candidate;
    if (old) void old.driver.dispose().catch(() => undefined);
    let timeout: ReturnType<typeof setTimeout> | undefined;
    try {
      await Promise.race([
        selection.kind === "single"
          ? candidate.driver.loadSingleTrack(selection.program)
          : candidate.driver.loadAdaptiveSession(selection.program),
        new Promise<never>((_, reject) => {
          timeout = setTimeout(
            () =>
              reject(
                new Error(
                  "Loading took too long. Check your connection and retry.",
                ),
              ),
            15000,
          );
        }),
      ]);
      if (
        generation !== this.selectionGeneration ||
        this.preparedSelection !== candidate
      )
        throw new Error("Selection changed.");
      candidate.ready = true;
    } catch (error) {
      if (this.preparedSelection === candidate) this.preparedSelection = null;
      await candidate.driver.dispose().catch(() => undefined);
      throw error;
    } finally {
      if (timeout) clearTimeout(timeout);
    }
  }

  cancelPreparedSelection(selection: ConsumerSelection): void {
    const candidate = this.preparedSelection;
    if (
      !candidate ||
      consumerSelectionKey(candidate.selection) !==
        consumerSelectionKey(selection) ||
      this.startPending
    )
      return;
    ++this.selectionGeneration;
    this.preparedSelection = null;
    void candidate.driver.dispose().catch(() => undefined);
  }

  startSelectionFromUserGesture(selection: ConsumerSelection): Promise<void> {
    const candidate = this.preparedSelection;
    if (this.startPending) return this.pendingStart ?? Promise.resolve();
    if (
      !candidate?.ready ||
      consumerSelectionKey(candidate.selection) !==
        consumerSelectionKey(selection)
    )
      return Promise.reject(
        new Error("Wait for the sound to be ready, or retry."),
      );
    this.startPending = true;
    // Crucially, this uses the already prepared elements inside the original tap.
    try {
      candidate.driver.activateUserGesture();
    } catch (error) {
      this.startPending = false;
      this.preparedSelection = null;
      void candidate.driver.dispose().catch(() => undefined);
      return Promise.reject(error);
    }
    this.preparedSelection = null;
    const operation = this.enqueue(async () => {
      try {
        this.clearTicker();
        ++this.deadlineGeneration;
        await this.driver.dispose();
        this.driver = candidate.driver;
        this.attachRemoteCommandHandlers();
        this.attachAdaptiveSessionEventHandlers();
        this.selection = selection;
        this.currentPreset = null;
        this.currentProgram =
          selection.kind === "single" ? selection.program : null;
        this.currentAdaptiveProgram =
          selection.kind === "adaptive" ? selection.program : null;
        const duration =
          selection.kind === "single"
            ? selection.durationMinutes
            : selection.request.durationMinutes;
        this.patch({
          mode: "consumer",
          status: "ready",
          presetId: null,
          workId: this.currentProgram?.work.id ?? null,
          sessionPlanId: this.currentAdaptiveProgram?.plan.id ?? null,
          title:
            this.currentProgram?.work.title ??
            `${selection.kind === "adaptive" ? selection.request.outcome : selection.outcome} session`,
          selectedDurationMinutes: duration,
          remainingMs: duration * 60000,
          deadlineMs: null,
          natureMixLevel:
            this.currentAdaptiveProgram?.plan.natureMix?.initialLevel ?? null,
          error: null,
          sources: createSourceRecord(),
        });
        await this.playInternal(true);
        if (this.snapshot.status === "error")
          throw new Error(this.snapshot.error ?? "Could not start.");
      } catch (error) {
        if (this.driver !== candidate.driver)
          await candidate.driver.dispose().catch(() => undefined);
        if (error instanceof PlaybackCancelledError) throw error;
        this.patch({
          status: "error",
          error: errorMessage(error),
          deadlineMs: null,
        });
        throw error;
      } finally {
        this.startPending = false;
        this.pendingStart = null;
      }
    });
    this.pendingStart = operation;
    return operation;
  }

  private async confirmPlayback(
    operation: Promise<void>,
    timeoutMessage = "The sound did not start. Check your connection and retry.",
  ): Promise<void> {
    let timeout: ReturnType<typeof setTimeout> | undefined;
    try {
      await Promise.race([
        operation,
        new Promise<never>((_, reject) => {
          this.cancelOperation = () => reject(new PlaybackCancelledError());
          timeout = setTimeout(() => reject(new Error(timeoutMessage)), 15000);
        }),
      ]);
    } finally {
      if (timeout) clearTimeout(timeout);
      this.cancelOperation = null;
    }
  }

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
      this.selection = null;
      this.currentProgram = null;
      this.currentAdaptiveProgram = null;
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
        sessionPlanId: null,
        title: preset.title,
        natureMixLevel: null,
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
      this.selection = null;
      this.currentAdaptiveProgram = null;
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
        sessionPlanId: null,
        title: program.work.title,
        natureMixLevel: null,
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

  loadAdaptiveSession(program: AdaptiveSessionProgram): Promise<void> {
    return this.enqueue(async () => {
      await this.hydrate();
      if (
        program.kind !== "adaptive-session" ||
        !program.plan.exactDuration ||
        program.plan.mode !== "sound-only"
      ) {
        throw new Error("Invalid adaptive session program.");
      }
      if (
        this.currentAdaptiveProgram?.plan.id === program.plan.id &&
        this.snapshot.status !== "error"
      ) {
        return;
      }
      await this.stopInternal(false);
      this.currentPreset = null;
      this.currentProgram = null;
      this.currentAdaptiveProgram = program;
      this.selection = null;
      const duration = program.plan.requestedDurationMinutes;
      this.patch({
        mode: "consumer",
        status: "loading",
        presetId: null,
        workId: null,
        sessionPlanId: program.plan.id,
        title: `${program.plan.outcome} session`,
        natureMixLevel: program.plan.natureMix?.initialLevel ?? null,
        selectedDurationMinutes: duration,
        remainingMs: program.plan.totalDurationSeconds * 1000,
        deadlineMs: null,
        sources: createSourceRecord(),
        error: null,
      });
      try {
        await this.driver.loadAdaptiveSession(program);
        this.patch({ status: "ready" });
      } catch (error) {
        this.patch({ status: "error", error: errorMessage(error) });
      }
    });
  }

  seekSingleTrack(positionSeconds: number): Promise<void> {
    return this.enqueue(async () => {
      const program = this.currentProgram;
      if (!program) throw new Error("No single-track program is loaded.");
      if (program.work.sourceKind !== "file") {
        throw new Error("Continuous generators do not have a file position.");
      }
      if (
        !Number.isFinite(positionSeconds) ||
        positionSeconds < 0 ||
        positionSeconds >= program.work.durationSeconds
      ) {
        throw new Error("File position is outside the source.");
      }
      try {
        await this.confirmPlayback(
          this.driver.seekSingleTrack(positionSeconds),
          "The file position could not be loaded. Check your connection and retry.",
        );
      } catch (error) {
        if (error instanceof PlaybackCancelledError) throw error;
        await this.failClosedSeek(error);
        throw error;
      }
    });
  }

  seekAdaptiveSession(
    positionSeconds: number,
    clearAudition = false,
  ): Promise<void> {
    return this.enqueue(async () => {
      const program = this.currentAdaptiveProgram;
      if (!program) throw new Error("No adaptive session is loaded.");
      if (
        !Number.isFinite(positionSeconds) ||
        positionSeconds < 0 ||
        positionSeconds >= program.plan.totalDurationSeconds
      ) {
        throw new Error("Session position is outside the plan.");
      }
      try {
        await this.driver.seekAdaptiveSession(positionSeconds, clearAudition);
      } catch (error) {
        await this.failClosedSeek(error);
        throw error;
      }
      const remainingMs =
        (program.plan.totalDurationSeconds - positionSeconds) * 1000;
      this.patch({
        remainingMs,
        deadlineMs:
          this.snapshot.status === "playing"
            ? this.runtime.now() + remainingMs
            : null,
      });
    });
  }

  configureAdaptiveAudition(
    audition: TransitionAudition | null,
  ): Promise<void> {
    return this.enqueue(async () => {
      // A review panel can unmount after another selection became current.
      // Its cleanup must not stop the replacement single-track session.
      if (!this.currentAdaptiveProgram) {
        if (audition === null) return;
        throw new Error("No adaptive session is loaded.");
      }
      try {
        await this.driver.configureAdaptiveAudition(audition);
      } catch (error) {
        await this.failClosedSeek(error);
        throw error;
      }
      // configureAudition already moves the driver. Synchronize the absolute
      // timer here instead of requiring a second seek/rebuild from the UI.
      if (audition && this.currentAdaptiveProgram) {
        const remainingMs =
          (this.currentAdaptiveProgram.plan.totalDurationSeconds -
            audition.startSeconds) *
          1000;
        this.patch({
          remainingMs,
          deadlineMs:
            this.snapshot.status === "playing"
              ? this.runtime.now() + remainingMs
              : null,
        });
      }
    });
  }

  setNatureMixLevel(level: NatureMixLevel, fadeMs = 1200): Promise<void> {
    return this.enqueue(async () => {
      const program = this.currentAdaptiveProgram;
      const natureMix = program?.plan.natureMix;
      if (!program || !natureMix) {
        throw new Error("This session has no natural ambience control.");
      }
      if (
        !Number.isFinite(level) ||
        level < natureMix.minimumLevel ||
        level > natureMix.maximumLevel
      ) {
        throw new Error("Natural ambience volume must be between 0 and 100%.");
      }
      await this.driver.setAdaptiveNatureLevel(level, fadeMs);
      this.patch({ natureMixLevel: level, error: null });
    });
  }

  private async failClosedSeek(error: unknown): Promise<void> {
    this.deadlineGeneration += 1;
    this.terminalStopQueued = false;
    this.pausedByInterruption = false;
    this.clearTicker();
    await this.driver.stop().catch(() => undefined);
    this.patch({
      status: "error",
      error: errorMessage(error),
      deadlineMs: null,
    });
  }

  play(): Promise<void> {
    this.activate();
    return this.enqueue(() => this.playInternal());
  }

  playFromUserGesture(): Promise<void> {
    this.activate();
    // WebKit requires the audio unlock to run in the event handler itself.
    // The ordered state transition can still follow on commandChain.
    if (
      this.snapshot.status === "ready" ||
      this.snapshot.status === "paused" ||
      this.snapshot.status === "completed"
    ) {
      this.driver.activateUserGesture();
    }
    return this.enqueue(() => this.playInternal());
  }

  private async playInternal(rejectCancellation = false): Promise<void> {
    if (
      (!this.currentPreset &&
        !this.currentProgram &&
        !this.currentAdaptiveProgram) ||
      this.snapshot.status === "loading" ||
      this.snapshot.status === "error"
    ) {
      return;
    }
    if (
      this.snapshot.status === "playing" ||
      this.snapshot.status === "fadingOut" ||
      this.snapshot.status === "preparing"
    ) {
      return;
    }

    try {
      const isResume = this.snapshot.status === "paused";
      if (this.snapshot.status === "completed")
        this.patch({
          remainingMs: this.snapshot.selectedDurationMinutes * 60000,
        });
      this.patch({ status: "preparing", error: null });
      await this.confirmPlayback(
        (async () => {
          if (isResume) {
            await this.driver.resume();
          } else if (this.currentAdaptiveProgram) {
            await this.driver.startAdaptiveSession(
              this.currentAdaptiveProgram,
              this.snapshot.volume,
              this.currentAdaptiveProgram.plan.totalDurationSeconds -
                this.snapshot.remainingMs / 1000,
            );
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
        })(),
      );

      const remainingMs =
        this.snapshot.remainingMs > 0
          ? this.snapshot.remainingMs
          : this.snapshot.selectedDurationMinutes * 60_000;
      const deadlineMs = this.runtime.now() + remainingMs;
      this.terminalStopQueued = false;
      this.pausedByInterruption = false;
      this.deadlineGeneration += 1;
      if (!this.currentAdaptiveProgram) {
        await this.driver.scheduleFadeOut(
          remainingMs,
          this.activeFadeOutSeconds() * 1000,
        );
      }
      if (!isResume) ++this.listeningRun;
      this.patch({ status: "playing", remainingMs, deadlineMs, error: null });
      this.startTicker();
    } catch (error) {
      if (error instanceof PlaybackCancelledError) {
        // The queued Stop/dispose owns teardown. Do not repeat it or briefly
        // publish an error/ready state before the driver confirms silence.
        if (rejectCancellation) throw error;
        return;
      }
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
    this.cancelOperation?.();
    return this.enqueue(() => this.stopInternal(true));
  }

  dispose(): Promise<void> {
    this.cancelOperation?.();
    ++this.selectionGeneration;
    if (this.preparedSelection)
      void this.preparedSelection.driver.dispose().catch(() => undefined);
    this.preparedSelection = null;
    this.active = false;
    return this.enqueue(async () => {
      this.deadlineGeneration += 1;
      this.clearTicker();
      await this.driver.dispose();
      this.currentPreset = null;
      this.currentProgram = null;
      this.currentAdaptiveProgram = null;
      this.patch({
        mode: null,
        status: "idle",
        presetId: null,
        workId: null,
        sessionPlanId: null,
        title: null,
        natureMixLevel: null,
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
      if (!this.currentProgram && !this.currentAdaptiveProgram) return;
      const next = clampGain(volume);
      await this.driver.setMasterVolume(next, fadeMs);
      this.patch({ volume: next, error: null });
      await this.persist();
    });
  }

  private reviewPreparation: AbortController | null = null;
  /** Admit only after foreground commands settle; never hold their queue while fetching. */
  prepareReviewSeek(
    positionSeconds: number,
    signal: AbortSignal,
  ): Promise<boolean> {
    let preparation = Promise.resolve(false);
    return this.enqueue(async () => {
      const duration =
        this.currentAdaptiveProgram?.plan.totalDurationSeconds ??
        this.currentProgram?.work.durationSeconds ??
        0;
      if (
        signal.aborted ||
        this.snapshot.status !== "paused" ||
        !Number.isFinite(positionSeconds) ||
        positionSeconds < 0 ||
        positionSeconds >= duration ||
        !this.driver.prepareReviewSeek
      )
        return;
      const pending = new AbortController();
      this.reviewPreparation = pending;
      const abort = () => pending.abort();
      signal.addEventListener("abort", abort, { once: true });
      preparation = this.driver
        .prepareReviewSeek(positionSeconds, pending.signal)
        .then((ready) => ready && !pending.signal.aborted)
        .finally(() => {
          signal.removeEventListener("abort", abort);
          if (this.reviewPreparation === pending) this.reviewPreparation = null;
        });
      void preparation.catch(() => undefined);
    }).then(() => preparation);
  }

  private enqueue(operation: () => Promise<void>): Promise<void> {
    this.reviewPreparation?.abort();
    const foreground = () => {
      this.reviewPreparation?.abort();
      return operation();
    };
    const next = this.commandChain.then(foreground, foreground);
    this.commandChain = next.catch(() => undefined);
    return next;
  }

  private async completeNaturally(generation: number): Promise<void> {
    if (
      generation !== this.deadlineGeneration ||
      (this.snapshot.status !== "playing" &&
        this.snapshot.status !== "fadingOut")
    )
      return;
    ++this.deadlineGeneration;
    this.terminalStopQueued = false;
    this.pausedByInterruption = false;
    this.clearTicker();
    try {
      await this.driver.stop();
    } catch (error) {
      this.patch({
        status: "error",
        deadlineMs: null,
        remainingMs: 0,
        error: `Playback could not stop: ${errorMessage(error)}`,
      });
      return;
    }
    this.mapSources((source) => ({ ...source, fadeState: "idle" }));
    this.patch({
      status: this.currentPreset ? "ready" : "completed",
      deadlineMs: null,
      remainingMs: this.currentPreset
        ? this.snapshot.selectedDurationMinutes * 60000
        : 0,
    });
  }

  private async stopInternal(resetTimer: boolean): Promise<void> {
    this.deadlineGeneration += 1;
    this.terminalStopQueued = false;
    this.pausedByInterruption = false;
    this.clearTicker();
    try {
      await this.driver.stop();
    } catch (error) {
      this.patch({
        status: "error",
        deadlineMs: null,
        error: `Playback could not stop: ${errorMessage(error)}`,
      });
      throw error;
    }
    const remainingMs = resetTimer
      ? this.snapshot.selectedDurationMinutes * 60_000
      : this.snapshot.remainingMs;
    this.patch({
      status:
        this.currentPreset || this.currentProgram || this.currentAdaptiveProgram
          ? "ready"
          : "idle",
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
    try {
      await this.driver.pause(releaseAudioFocus);
      await this.driver.cancelScheduledFade();
    } catch (error) {
      await this.driver.stop().catch(() => undefined);
      this.patch({
        status: "error",
        remainingMs,
        deadlineMs: null,
        error: `Playback could not pause: ${errorMessage(error)}`,
      });
      throw error;
    }
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
      (!this.currentPreset &&
        !this.currentProgram &&
        !this.currentAdaptiveProgram)
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
      const generation = this.deadlineGeneration;
      void this.enqueue(() => this.completeNaturally(generation));
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
    if (this.currentAdaptiveProgram) return;
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
      (this.currentAdaptiveProgram
        ? [this.currentAdaptiveProgram.plan.requestedDurationMinutes]
        : undefined) ??
      this.currentPreset?.durationOptionsMinutes ??
      []
    );
  }

  private activeFadeOutSeconds(): number {
    return (
      this.currentProgram?.fadeOutSeconds ??
      this.currentAdaptiveProgram?.fadeOutSeconds ??
      this.currentPreset?.fadeOutSeconds ??
      0
    );
  }
}
