import type {
  AudioCapabilities,
  AudioPreset,
  AudioSourceId,
} from "@/domain/audio/types";

export interface RemoteCommandHandlers {
  play: () => void;
  pause: () => void;
  stop: () => void;
  interruption: (began: boolean, shouldResume: boolean) => void;
}

export interface AudioGraphDriver {
  readonly capabilities: AudioCapabilities;
  setRemoteCommandHandlers(handlers: RemoteCommandHandlers): void;
  loadPreset(preset: AudioPreset): Promise<void>;
  start(
    preset: AudioPreset,
    mix: Readonly<Record<AudioSourceId, number>>,
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
