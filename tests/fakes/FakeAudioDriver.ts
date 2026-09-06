import type {
  AdaptiveSessionEventHandlers,
  AudioGraphDriver,
  RemoteCommandHandlers,
} from "@/audio/AudioGraphDriver";
import type { AudioPreset, AudioSourceId } from "@/domain/audio/types";
import type { SingleTrackProgram } from "@/domain/audio/consumerTypes";
import type {
  AdaptiveSessionProgram,
  NatureMixLevel,
} from "@/domain/sessions/types";
import type { TransitionAudition } from "@/domain/sessions/workbench";

export class FakeAudioDriver implements AudioGraphDriver {
  readonly capabilities = {
    backgroundPlayback: true,
    notificationControls: true,
    preciseSharedClock: true,
    realtimeSynthesis: true,
  };

  handlers: RemoteCommandHandlers | null = null;
  adaptiveHandlers: AdaptiveSessionEventHandlers | null = null;
  userGestureActivations = 0;
  loadCalls = 0;
  loadProgramCalls = 0;
  loadAdaptiveCalls = 0;
  startCalls = 0;
  startProgramCalls = 0;
  startAdaptiveCalls = 0;
  singleTrackSeekCalls: number[] = [];
  adaptiveSeekCalls: number[] = [];
  adaptiveAuditions: (TransitionAudition | null)[] = [];
  adaptiveNatureCalls: { level: NatureMixLevel; fadeMs: number }[] = [];
  resumeCalls = 0;
  pauseCalls = 0;
  pauseFocusReleases: boolean[] = [];
  stopCalls = 0;
  disposeCalls = 0;
  scheduledFades: { remainingMs: number; fadeMs: number }[] = [];
  gainCalls: {
    sourceId: AudioSourceId;
    gain: number;
    muted: boolean;
    fadeMs: number;
  }[] = [];
  masterVolumeCalls: { volume: number; fadeMs: number }[] = [];
  startError: Error | null = null;
  pauseError: Error | null = null;
  stopError: Error | null = null;
  cancelFadeError: Error | null = null;
  singleTrackSeekError: Error | null = null;
  adaptiveSeekError: Error | null = null;
  failingGainSource: AudioSourceId | null = null;

  activateUserGesture(): void {
    this.userGestureActivations += 1;
  }

  setRemoteCommandHandlers(handlers: RemoteCommandHandlers): void {
    this.handlers = handlers;
  }

  setAdaptiveSessionEventHandlers(
    handlers: AdaptiveSessionEventHandlers,
  ): void {
    this.adaptiveHandlers = handlers;
  }

  async loadPreset(_preset: AudioPreset): Promise<void> {
    this.loadCalls += 1;
  }

  async loadSingleTrack(_program: SingleTrackProgram): Promise<void> {
    this.loadProgramCalls += 1;
  }

  async loadAdaptiveSession(_program: AdaptiveSessionProgram): Promise<void> {
    this.loadAdaptiveCalls += 1;
  }

  async start(
    _preset: AudioPreset,
    _mix: Readonly<Record<AudioSourceId, number>>,
  ): Promise<void> {
    this.startCalls += 1;
    if (this.startError) {
      throw this.startError;
    }
  }

  async startSingleTrack(
    _program: SingleTrackProgram,
    _volume: number,
  ): Promise<void> {
    this.startProgramCalls += 1;
    if (this.startError) throw this.startError;
  }

  async startAdaptiveSession(
    _program: AdaptiveSessionProgram,
    _volume: number,
    _positionSeconds = 0,
  ): Promise<void> {
    this.startAdaptiveCalls += 1;
    if (this.startError) throw this.startError;
  }

  async seekSingleTrack(positionSeconds: number): Promise<void> {
    this.singleTrackSeekCalls.push(positionSeconds);
    if (this.singleTrackSeekError) throw this.singleTrackSeekError;
  }

  async seekAdaptiveSession(positionSeconds: number): Promise<void> {
    this.adaptiveSeekCalls.push(positionSeconds);
    if (this.adaptiveSeekError) throw this.adaptiveSeekError;
  }

  async configureAdaptiveAudition(
    audition: TransitionAudition | null,
  ): Promise<void> {
    this.adaptiveAuditions.push(audition);
  }

  async setAdaptiveNatureLevel(
    level: NatureMixLevel,
    fadeMs: number,
  ): Promise<void> {
    this.adaptiveNatureCalls.push({ level, fadeMs });
  }

  async resume(): Promise<void> {
    this.resumeCalls += 1;
  }

  async pause(releaseAudioFocus: boolean): Promise<void> {
    this.pauseCalls += 1;
    this.pauseFocusReleases.push(releaseAudioFocus);
    if (this.pauseError) throw this.pauseError;
  }

  async stop(): Promise<void> {
    this.stopCalls += 1;
    if (this.stopError) throw this.stopError;
  }

  async dispose(): Promise<void> {
    this.disposeCalls += 1;
    this.handlers = null;
    this.adaptiveHandlers = null;
  }

  async setSourceGain(
    sourceId: AudioSourceId,
    gain: number,
    muted: boolean,
    fadeMs: number,
  ): Promise<void> {
    this.gainCalls.push({ sourceId, gain, muted, fadeMs });
    if (this.failingGainSource === sourceId) {
      throw new Error("Injected gain failure");
    }
  }

  async setMasterVolume(volume: number, fadeMs: number): Promise<void> {
    this.masterVolumeCalls.push({ volume, fadeMs });
  }

  async scheduleFadeOut(remainingMs: number, fadeMs: number): Promise<void> {
    this.scheduledFades.push({ remainingMs, fadeMs });
  }

  async cancelScheduledFade(): Promise<void> {
    if (this.cancelFadeError) throw this.cancelFadeError;
  }

  emitInterruption(began: boolean, shouldResume = false): void {
    this.handlers?.interruption(began, shouldResume);
  }

  emitAdaptiveError(planId: string, error: Error): void {
    this.adaptiveHandlers?.error(planId, error);
  }
}
