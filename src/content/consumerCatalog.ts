import type { ConsumerOutcomeId } from "./productShell";
import { HATHA_AUDIO_WORKS } from "./hathaCatalog";
import { LOCAL_NATURAL_WORKS } from "./localNaturalCatalog";
import {
  isAdaptivePlaybackAvailable,
  isPwaWebSurface,
  isNativeCatalogPreview,
} from "@/domain/sessions/playbackAvailability";
import { hasVerifiedNativeWork } from "@/offline/nativeCatalogAvailability";
import type {
  ConsumerAudioWork,
  ConsumerCollectionId,
  NoiseColorId,
} from "@/domain/audio/consumerTypes";
import { NOISE_COLOR_DEFINITIONS } from "@/audio/generators/coloredNoise";
import { APPROVED_ELEMENTAL_WORKS } from "@/content/approvedElementalCatalog";

const COMMON = {
  schemaVersion: 1 as const,
  sourceKind: "file" as const,
  noiseColor: null,
  spectralDefinition: null,
  loop: true as const,
  sampleRateHz: 48000 as const,
  channels: 2 as const,
  bitDepth: 24 as const,
  listeningStatus: "PROVISIONAL — LISTENING APPROVAL REQUIRED" as const,
  provenance: {
    packId: "APP_READY_AUDIO_01" as const,
    manifestReference: "qa/APP_READY_AUDIO_01_MANIFEST.json" as const,
  },
};

const NOISE_COMMON = {
  schemaVersion: 1 as const,
  familyId: "runtime-noise-generators",
  sourceKind: "generated-noise" as const,
  sourceFilename: null,
  localPreviewFilename: null,
  durationSeconds: 8,
  frameCount: 384000,
  loop: true as const,
  sampleRateHz: 48000 as const,
  channels: 2 as const,
  bitDepth: 32 as const,
  measuredLufs: null,
  truePeakDbtp: null,
  playbackGainDb: -6,
  postGainTruePeakDbtp: null,
  generatedPeakCeilingDbfs: -6.021,
  availability: "generated-runtime" as const,
  listeningStatus: "PROVISIONAL — LISTENING APPROVAL REQUIRED" as const,
  provenance: {
    packId: "RUNTIME_NOISE_GENERATORS" as const,
    manifestReference: "src/audio/generators/coloredNoise.ts" as const,
  },
};

export const CONSUMER_AUDIO_WORKS: readonly ConsumerAudioWork[] = [
  work(
    "mineral-drift",
    "Mineral Drift",
    "piano-massage-001",
    "pianoMassage001",
    "SOUNDSCAPE_PIANO_MASSAGE_001_48K24_LOOP.wav",
    "massage",
    [],
    ["standalone-works"],
    1180,
    56640000,
    -18.019,
    -2.66,
    0.019,
  ),
  work(
    "astral-thread",
    "Astral Thread",
    "star-generator",
    "starGenerator001",
    "SOUNDSCAPE_STAR_GENERATOR_001_EMINOR_48K24_LOOP.wav",
    "focus",
    [],
    ["cosmic-zen-ambient"],
    170,
    8160000,
    -17.999,
    -6.48,
    -0.001,
  ),
  work(
    "celestial-current",
    "Celestial Current",
    "star-generator",
    "starGenerator002",
    "SOUNDSCAPE_STAR_GENERATOR_002_EMINOR_48K24_LOOP.wav",
    "meditation",
    [],
    ["cosmic-zen-ambient"],
    170,
    8160000,
    -18,
    -6.4,
    0,
  ),
  work(
    "quiet-field",
    "Quiet Field",
    "zen-field-waves",
    "zenFieldWaves001",
    "SOUNDSCAPE_ZEN_FIELD_WAVES_001_EMINOR_48K24_LOOP.wav",
    "yoga",
    [],
    ["cosmic-zen-ambient"],
    170.007917,
    8160380,
    -17.997,
    -5.53,
    -0.003,
  ),
  work(
    "cedar-current",
    "Cedar Current",
    "zen-generator-002",
    "zenGenerator002",
    "SOUNDSCAPE_ZEN_GENERATOR_002_EMINOR_48K24_LOOP.wav",
    "yoga",
    [],
    ["cosmic-zen-ambient"],
    170,
    8160000,
    -18,
    -6.83,
    0,
  ),
  work(
    "moonlit-veil",
    "Moonlit Veil",
    "zen-dream-003",
    "zenDream003Pad",
    "SOUNDSCAPE_ZEN_DREAM_003_PAD_48K24_LOOP.wav",
    "sleep",
    [],
    ["cosmic-zen-ambient"],
    451.706667,
    21681920,
    -21.574,
    -8.86,
    3.574,
  ),
  work(
    "moonlit-keys",
    "Moonlit Keys",
    "zen-dream-003",
    "zenDream003Piano",
    "SOUNDSCAPE_ZEN_DREAM_003_PIANO_48K24_LOOP.wav",
    "massage",
    [],
    ["standalone-works"],
    451.706667,
    21681920,
    -20.687,
    -7.59,
    2.687,
  ),
  work(
    "luminous-grain",
    "Luminous Grain",
    "zen-generator-003",
    "zenGenerator003Texture",
    "SOUNDSCAPE_ZEN_GENERATOR_003_TEXTURE_CMAJ_48K24_LOOP.wav",
    "focus",
    [],
    ["cosmic-zen-ambient"],
    452,
    21696000,
    -19.485,
    -8.09,
    1.485,
  ),
  work(
    "luminous-steps",
    "Luminous Steps",
    "zen-generator-003",
    "zenGenerator003Piano",
    "SOUNDSCAPE_ZEN_GENERATOR_003_PIANO_CMAJ_48K24_LOOP.wav",
    "massage",
    [],
    ["standalone-works"],
    452,
    21696000,
    -23.178,
    -9.77,
    5.178,
  ),
  work(
    "distant-garden",
    "Distant Garden",
    "zen-generator-004",
    "zenGenerator004Pad",
    "SOUNDSCAPE_ZEN_GENERATOR_004_PAD_CMAJ_48K24_LOOP.wav",
    "meditation",
    [],
    ["cosmic-zen-ambient"],
    976.006667,
    46848320,
    -20.048,
    -7.81,
    2.048,
  ),
  work(
    "distant-bloom",
    "Distant Bloom",
    "zen-generator-004",
    "zenGenerator004Piano",
    "SOUNDSCAPE_ZEN_GENERATOR_004_PIANO_CMAJ_48K24_LOOP.wav",
    "relax",
    [],
    ["standalone-works"],
    976.006667,
    46848320,
    -21.763,
    -8.1,
    3.763,
  ),
  work(
    "aquarian-drift",
    "Aquarian Drift",
    "zen-generator-005",
    "zenGenerator005Pad",
    "SOUNDSCAPE_ZEN_GENERATOR_005_PAD_48K24_LOOP.wav",
    "meditation",
    [],
    ["cosmic-zen-ambient"],
    1199,
    57552000,
    -21.064,
    -6.95,
    3.064,
  ),
  work(
    "aquarian-echo",
    "Aquarian Echo",
    "zen-generator-005",
    "zenGenerator005Piano",
    "SOUNDSCAPE_ZEN_GENERATOR_005_PIANO_48K24_LOOP.wav",
    "massage",
    [],
    ["standalone-works"],
    1199,
    57552000,
    -20.329,
    -5.33,
    2.329,
  ),
  ...APPROVED_ELEMENTAL_WORKS,
  ...(process.env.EXPO_PUBLIC_APP_RELAX_PWA === "1"
    ? []
    : [
        work(
          "moon-drone",
          "Moon Drone",
          "audio-test-pack-01",
          "sleepDrone001",
          "SLEEP_DRONE_001.wav",
          "sleep",
          [],
          ["cosmic-zen-ambient"],
          180,
          8640000,
          -14,
          -2.02,
          -4,
          "embedded-wav",
          "PROVISIONAL — LISTENING APPROVAL REQUIRED",
        ),
        work(
          "deep-river",
          "Deep River",
          "audio-test-pack-01",
          "sleepAmbience001",
          "SLEEP_AMBIENCE_001.wav",
          "relax",
          ["sleep"],
          ["elemental-water"],
          180,
          8640000,
          -20.028,
          -8.01,
          2.028,
          "embedded-wav",
          "PROVISIONAL — LISTENING APPROVAL REQUIRED",
        ),
        work(
          "soft-air",
          "Soft Air",
          "audio-test-pack-01",
          "sleepTexture001",
          "SLEEP_TEXTURE_001.wav",
          "focus",
          ["relax"],
          ["elemental-air"],
          180,
          8640000,
          -13.999,
          -2.02,
          -4.001,
          "rejected-listening",
          "REJECTED — REPLACEMENT REQUIRED",
        ),
      ]),
  noiseWork("white-noise", "white", "focus", ["massage"]),
  noiseWork("pink-noise", "pink", "sleep", ["relax", "massage"]),
  noiseWork("brown-red-noise", "brown", "sleep", ["relax"]),
  noiseWork("blue-noise", "blue", "focus", []),
  noiseWork("violet-purple-noise", "violet", "focus", ["meditation"]),
  noiseWork("grey-noise", "grey", "focus", ["massage"]),
  noiseWork("green-noise", "green", "meditation", ["relax", "yoga"]),
  noiseWork("black-noise", "black", "sleep", ["relax", "meditation"]),
  ...HATHA_AUDIO_WORKS,
  ...LOCAL_NATURAL_WORKS,
] as const;

function noiseWork(
  id: string,
  noiseColor: NoiseColorId,
  primaryOutcome: ConsumerOutcomeId,
  secondaryOutcomes: readonly ConsumerOutcomeId[],
): ConsumerAudioWork {
  const definition = NOISE_COLOR_DEFINITIONS[noiseColor];
  return {
    ...NOISE_COMMON,
    id,
    title: definition.title,
    assetKey: `generatedNoise.${noiseColor}`,
    noiseColor,
    spectralDefinition: definition.spectralDefinition,
    primaryOutcome,
    secondaryOutcomes,
    collectionIds: ["noise-colours"],
  };
}

function work(
  id: string,
  title: string,
  familyId: string,
  assetKey: string,
  sourceFilename: string,
  primaryOutcome: ConsumerOutcomeId,
  secondaryOutcomes: readonly ConsumerOutcomeId[],
  collectionIds: readonly ConsumerCollectionId[],
  durationSeconds: number,
  frameCount: number,
  measuredLufs: number,
  truePeakDbtp: number,
  playbackGainDb: number,
  availability: ConsumerAudioWork["availability"] = "local-preview-file",
  listeningStatus: ConsumerAudioWork["listeningStatus"] = "APPROVED — LISTENING PASSED",
): ConsumerAudioWork {
  return {
    ...COMMON,
    id,
    title,
    familyId,
    assetKey,
    sourceFilename,
    localPreviewFilename:
      availability === "local-preview-file" ? sourceFilename : null,
    primaryOutcome,
    secondaryOutcomes,
    collectionIds,
    durationSeconds,
    frameCount,
    measuredLufs,
    truePeakDbtp,
    playbackGainDb,
    postGainTruePeakDbtp: Number((truePeakDbtp + playbackGainDb).toFixed(3)),
    generatedPeakCeilingDbfs: null,
    availability,
    listeningStatus,
  };
}

export function getConsumerWork(
  id: string | undefined,
): ConsumerAudioWork | undefined {
  return CONSUMER_AUDIO_WORKS.find((item) => item.id === id);
}

export function isEmbeddedWork(work: ConsumerAudioWork): boolean {
  return (
    work.availability === "embedded-wav" ||
    work.availability === "embedded-flac"
  );
}

export function isPlayableWork(work: ConsumerAudioWork): boolean {
  if (isNativeCatalogPreview()) {
    return (
      isEmbeddedWork(work) ||
      work.availability === "generated-runtime" ||
      (work.availability === "local-preview-file" &&
        hasVerifiedNativeWork(work.id))
    );
  }
  if (work.deliveryScope === "local-only") {
    return !isPwaWebSurface() && isAdaptivePlaybackAvailable();
  }
  if (isPwaWebSurface()) {
    return (
      work.availability === "generated-runtime" ||
      (isAdaptivePlaybackAvailable() &&
        work.availability === "local-preview-file")
    );
  }
  return (
    isEmbeddedWork(work) ||
    work.availability === "generated-runtime" ||
    (isAdaptivePlaybackAvailable() &&
      work.availability === "local-preview-file")
  );
}

export function isPlayableWorkOnWeb(work: ConsumerAudioWork): boolean {
  return (
    isEmbeddedWork(work) ||
    work.availability === "generated-runtime" ||
    work.availability === "local-preview-file"
  );
}

export function isVisibleConsumerWork(work: ConsumerAudioWork): boolean {
  if (isNativeCatalogPreview()) return isPlayableWork(work);
  if (work.deliveryScope) return isPlayableWork(work);
  return (
    work.availability === "local-preview-file" ||
    work.availability === "generated-runtime"
  );
}

export function getVisibleConsumerWorks(): readonly ConsumerAudioWork[] {
  return CONSUMER_AUDIO_WORKS.filter(isVisibleConsumerWork);
}

const MEDITATION_EDITORIAL_PRIORITY = [
  "field-sea-003-open-tide",
  "field-sea-001-tidal-breath",
  "field-sea-005-pearl-tide",
  "field-sea-007-blue-interval",
  "field-sea-002-moon-shore",
  "field-sea-004-night-shore",
] as const;

const MEDITATION_EDITORIAL_RANK = new Map<string, number>(
  MEDITATION_EDITORIAL_PRIORITY.map((id, index) => [id, index]),
);

export function getWorksForOutcome(
  outcome: ConsumerOutcomeId,
): readonly ConsumerAudioWork[] {
  const works = getVisibleConsumerWorks().filter(
    (work) =>
      work.primaryOutcome === outcome ||
      work.secondaryOutcomes.includes(outcome),
  );

  if (outcome === "yoga") {
    return works.sort(
      (a, b) =>
        (a.cycle?.structuralOrder ?? 999) - (b.cycle?.structuralOrder ?? 999),
    );
  }
  if (outcome !== "meditation") return works;

  return works.sort(
    (left, right) =>
      (MEDITATION_EDITORIAL_RANK.get(left.id) ?? Number.MAX_SAFE_INTEGER) -
      (MEDITATION_EDITORIAL_RANK.get(right.id) ?? Number.MAX_SAFE_INTEGER),
  );
}

export function getEmbeddedWorksForOutcome(
  outcome: ConsumerOutcomeId,
): readonly ConsumerAudioWork[] {
  return getWorksForOutcome(outcome).filter(isEmbeddedWork);
}

export function getPlayableWorksForOutcome(
  outcome: ConsumerOutcomeId,
): readonly ConsumerAudioWork[] {
  return getWorksForOutcome(outcome).filter(isPlayableWork);
}

export function getWorksForCollection(
  collectionId: ConsumerCollectionId,
): readonly ConsumerAudioWork[] {
  return getVisibleConsumerWorks().filter((work) =>
    work.collectionIds.includes(collectionId),
  );
}
