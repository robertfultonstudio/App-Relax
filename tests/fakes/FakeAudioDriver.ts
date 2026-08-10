import type {
  AudioGraphDriver,
  RemoteCommandHandlers,
} from "@/audio/AudioGraphDriver";
import type { AudioPreset, AudioSourceId } from "@/domain/audio/types";

export class FakeAudioDriver implements AudioGraphDriver {
  readonly capabilities = {
    backgroundPlayback: true,
    notificationControls: true,
    preciseSharedClock: true,
    realtimeSynthesis: true,
  };

  handlers: RemoteCommandHandlers | null = null;
  loadCalls = 0;
  startCalls = 0;
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
  startError: Error | null = null;
  failingGainSource: AudioSourceId | null = null;

  setRemoteCommandHandlers(handlers: RemoteCommandHandlers): void {
    this.handlers = handlers;
  }

  async loadPreset(_preset: AudioPreset): Promise<void> {
    this.loadCalls += 1;
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

  async resume(): Promise<void> {
    this.resumeCalls += 1;
  }

  async pause(releaseAudioFocus: boolean): Promise<void> {
    this.pauseCalls += 1;
    this.pauseFocusReleases.push(releaseAudioFocus);
  }

  async stop(): Promise<void> {
    this.stopCalls += 1;
  }

  async dispose(): Promise<void> {
    this.disposeCalls += 1;
    this.handlers = null;
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

  async scheduleFadeOut(remainingMs: number, fadeMs: number): Promise<void> {
    this.scheduledFades.push({ remainingMs, fadeMs });
  }

  async cancelScheduledFade(): Promise<void> {}

  emitInterruption(began: boolean, shouldResume = false): void {
    this.handlers?.interruption(began, shouldResume);
  }
}
