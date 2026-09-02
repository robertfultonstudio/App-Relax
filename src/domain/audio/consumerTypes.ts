import type { ConsumerOutcomeId } from "@/content/productShell";

export type ConsumerCollectionId =
  | "cosmic-zen-ambient"
  | "standalone-works"
  | "elemental-water"
  | "elemental-air";

export type ConsumerAssetAvailability =
  "embedded-wav" | "embedded-flac" | "external-flac-ready";

export interface ConsumerAudioWork {
  schemaVersion: 1;
  id: string;
  title: string;
  familyId: string;
  assetKey: string;
  sourceFilename: string;
  primaryOutcome: ConsumerOutcomeId;
  secondaryOutcomes: readonly ConsumerOutcomeId[];
  collectionIds: readonly ConsumerCollectionId[];
  durationSeconds: number;
  frameCount: number;
  loop: true;
  sampleRateHz: 48000;
  channels: 2;
  bitDepth: 24;
  measuredLufs: number;
  truePeakDbtp: number;
  playbackGainDb: number;
  postGainTruePeakDbtp: number;
  availability: ConsumerAssetAvailability;
  listeningStatus: "PROVISIONAL — LISTENING APPROVAL REQUIRED";
  provenance: {
    packId: "APP_READY_AUDIO_01";
    manifestReference: "qa/APP_READY_AUDIO_01_MANIFEST.json";
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
): SingleTrackProgram {
  return {
    kind: "single-track",
    work,
    durationOptionsMinutes: [15, 30, 60],
    fadeInSeconds: 2,
    fadeOutSeconds: 12,
  };
}
