export const AUDIO_SOURCE_IDS = [
  "drone",
  "ambience",
  "texture",
  "binaural",
  "brownNoise",
] as const;

export type AudioSourceId = (typeof AUDIO_SOURCE_IDS)[number];
export type StemSourceId = Extract<
  AudioSourceId,
  "drone" | "ambience" | "texture"
>;
export type SourceKind = "stem" | "binaural" | "noise";
export type SourceLoadState = "idle" | "loading" | "ready" | "error";
export type FadeState = "idle" | "fadingIn" | "fadingOut";
export type PlaybackStatus =
  "idle" | "loading" | "ready" | "playing" | "paused" | "fadingOut" | "error";

export type Goal = "sleep" | "calm" | "focus" | "meditate";
export type StemAssetKey =
  "sleepDrone001" | "sleepAmbience001" | "sleepTexture001";

export interface StemDefinition {
  id: StemSourceId;
  label: string;
  assetKey: StemAssetKey;
  required: true;
}

export interface VariationPlan {
  strategy: "future-gentle-rotation";
  poolIds: string[];
  minimumHoldSeconds: number;
}

export interface AudioPreset {
  schemaVersion: 1;
  id: string;
  title: string;
  subtitle: string;
  goal: Goal;
  tuningLabel: string;
  carrierHz: number;
  beatHz: number;
  noise: {
    type: "brown";
  };
  stems: readonly StemDefinition[];
  defaultMix: Readonly<Record<AudioSourceId, number>>;
  durationOptionsMinutes: readonly number[];
  fadeInSeconds: number;
  fadeOutSeconds: number;
  variation?: VariationPlan;
}

export interface SourceSnapshot {
  id: AudioSourceId;
  label: string;
  kind: SourceKind;
  gain: number;
  muted: boolean;
  loadingState: SourceLoadState;
  fadeState: FadeState;
  error: string | null;
}

export interface AudioCapabilities {
  backgroundPlayback: boolean;
  notificationControls: boolean;
  preciseSharedClock: boolean;
  realtimeSynthesis: boolean;
}

export interface SessionSnapshot {
  status: PlaybackStatus;
  presetId: string | null;
  title: string | null;
  selectedDurationMinutes: number;
  remainingMs: number;
  deadlineMs: number | null;
  sources: Readonly<Record<AudioSourceId, SourceSnapshot>>;
  capabilities: AudioCapabilities;
  error: string | null;
  hydrated: boolean;
}

export type SessionListener = (snapshot: SessionSnapshot) => void;

export interface AudioEngine {
  loadPreset(preset: AudioPreset): Promise<void>;
  play(): Promise<void>;
  pause(): Promise<void>;
  stop(): Promise<void>;
  dispose(): Promise<void>;
  setSourceGain(
    sourceId: AudioSourceId,
    gain: number,
    fadeMs?: number,
  ): Promise<void>;
  setSourceMuted(
    sourceId: AudioSourceId,
    muted: boolean,
    fadeMs?: number,
  ): Promise<void>;
  setTimer(durationMinutes: number): Promise<void>;
  getSnapshot(): SessionSnapshot;
  subscribe(listener: SessionListener): () => void;
}
