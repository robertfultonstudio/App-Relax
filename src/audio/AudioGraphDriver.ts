import type {
  AudioCapabilities,
  AudioPreset,
  AudioSourceId,
} from "@/domain/audio/types";
import type { SingleTrackProgram } from "@/domain/audio/consumerTypes";
import type {
  AdaptiveSessionProgram,
  NatureMixLevel,
} from "@/domain/sessions/types";
import type {
  AdaptiveAuditionOptions,
  TransitionAudition,
} from "@/domain/sessions/workbench";
import type { ReviewReadMetrics } from "@/domain/audio/reviewReadMetrics";

export interface RemoteCommandHandlers {
  error?: (error: Error) => void;
  play: () => void;
  pause: () => void;
  stop: () => void;
  interruption: (began: boolean, shouldResume: boolean) => void;
}

export interface AdaptiveSessionEventHandlers {
  ended: (planId: string) => void;
  error: (planId: string, error: Error) => void;
}

export interface AudioGraphDriver {
  readonly capabilities: AudioCapabilities;
  activateUserGesture(): void;
  getReviewReadMetrics?(): ReviewReadMetrics | null;
  getAdaptiveSessionPosition?(): number | null;
  setRemoteCommandHandlers(handlers: RemoteCommandHandlers): void;
  setAdaptiveSessionEventHandlers(handlers: AdaptiveSessionEventHandlers): void;
  loadPreset(preset: AudioPreset): Promise<void>;
  loadSingleTrack(program: SingleTrackProgram): Promise<void>;
  loadAdaptiveSession(program: AdaptiveSessionProgram): Promise<void>;
  start(
    preset: AudioPreset,
    mix: Readonly<Record<AudioSourceId, number>>,
  ): Promise<void>;
  startSingleTrack(program: SingleTrackProgram, volume: number): Promise<void>;
  startAdaptiveSession(
    program: AdaptiveSessionProgram,
    volume: number,
    positionSeconds?: number,
  ): Promise<void>;
  seekSingleTrack(positionSeconds: number): Promise<void>;
  prepareReviewSeek?(
    positionSeconds: number,
    signal: AbortSignal,
  ): Promise<boolean>;
  seekAdaptiveSession(
    positionSeconds: number,
    clearAudition?: boolean,
  ): Promise<void>;
  configureAdaptiveAudition(
    audition: TransitionAudition | null,
    options?: AdaptiveAuditionOptions,
  ): Promise<void>;
  setAdaptiveNatureLevel(level: NatureMixLevel, fadeMs: number): Promise<void>;
  replaceAdaptiveNatureFamily?(
    program: AdaptiveSessionProgram,
    signal: AbortSignal,
  ): Promise<void>;
  resume(): Promise<void>;
  pause(releaseAudioFocus: boolean): Promise<void>;
  stop(): Promise<void>;
  dispose(): Promise<void>;
  setSourceGain(
    sourceId: AudioSourceId,
    gain: number,
    muted: boolean,
    fadeMs: number,
  ): Promise<void>;
  setMasterVolume(volume: number, fadeMs: number): Promise<void>;
  scheduleFadeOut(remainingMs: number, fadeMs: number): Promise<void>;
  cancelScheduledFade(): Promise<void>;
}

export class SourceLoadError extends Error {
  constructor(
    public readonly sourceId: AudioSourceId,
    message: string,
  ) {
    super(message);
    this.name = "SourceLoadError";
  }
}
