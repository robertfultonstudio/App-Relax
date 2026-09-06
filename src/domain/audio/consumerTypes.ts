import type { ConsumerOutcomeId } from "@/content/productShell";
import { getSessionPolicy } from "@/content/sessionPolicies";

export type ConsumerCollectionId =
  | "cosmic-zen-ambient"
  | "standalone-works"
  | "elemental-water"
  | "elemental-air"
  | "esoteric-series"
  | "noise-colours";

export type NoiseColorId =
  "white" | "pink" | "brown" | "blue" | "violet" | "grey" | "green" | "black";

export type ConsumerAssetAvailability =
  | "embedded-wav"
  | "embedded-flac"
  | "local-preview-file"
  | "external-flac-ready"
  | "rejected-listening"
  | "generated-runtime";

export interface ConsumerAudioWork {
  schemaVersion: 1;
  id: string;
  title: string;
  familyId: string;
  sourceKind: "file" | "generated-noise";
  assetKey: string;
  sourceFilename: string | null;
  localPreviewFilename: string | null;
  noiseColor: NoiseColorId | null;
  spectralDefinition: string | null;
  primaryOutcome: ConsumerOutcomeId;
  secondaryOutcomes: readonly ConsumerOutcomeId[];
  collectionIds: readonly ConsumerCollectionId[];
  durationSeconds: number;
  frameCount: number;
  loop: true;
  sampleRateHz: 48000;
  channels: 2;
  bitDepth: 24 | 32;
  measuredLufs: number | null;
  truePeakDbtp: number | null;
  playbackGainDb: number;
  postGainTruePeakDbtp: number | null;
  generatedPeakCeilingDbfs: number | null;
  availability: ConsumerAssetAvailability;
  listeningStatus:
    | "PROVISIONAL — LISTENING APPROVAL REQUIRED"
    | "APPROVED — LISTENING PASSED"
    | "REJECTED — REPLACEMENT REQUIRED";
  provenance: {
    packId:
      | "APP_READY_AUDIO_01"
      | "APP_READY_AUDIO_02_ELEMENTAL_WATER_AIR"
      | "RUNTIME_NOISE_GENERATORS";
    manifestReference:
      | "qa/APP_READY_AUDIO_01_MANIFEST.json"
      | "QA/APP_READY_AUDIO_02_MANIFEST.json"
      | "src/audio/generators/coloredNoise.ts";
  };
}

export interface SingleTrackProgram {
  kind: "single-track";
  work: ConsumerAudioWork;
  durationOptionsMinutes: readonly number[];
  fadeInSeconds: number;
  fadeOutSeconds: number;
}

export function dbToLinear(db: number): number {
  return 10 ** (db / 20);
}

export function createSingleTrackProgram(
  work: ConsumerAudioWork,
  outcome?: ConsumerOutcomeId,
): SingleTrackProgram {
  return {
    kind: "single-track",
    work,
    durationOptionsMinutes: outcome
      ? getSessionPolicy(outcome).durations
      : [15, 30, 60],
    fadeInSeconds: 2,
    fadeOutSeconds: 12,
  };
}
