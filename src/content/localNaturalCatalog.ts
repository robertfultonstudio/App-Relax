import type { ConsumerAudioWork } from "@/domain/audio/consumerTypes";
import manifest from "./localNaturalAudioFiles.json";

const packIds: Readonly<
  Record<string, ConsumerAudioWork["provenance"]["packId"]>
> = {
  "field-recording-01": "FIELD_RECORDING_01_LOOP_20260913",
  "night-birds-b1": "NIGHT_BIRDS_B1_LOOP_20260913",
};

function packIdFor(id: string) {
  const packId = packIds[id];
  if (!packId) throw new Error("Unregistered local nature provenance.");
  return packId;
}

/** Manual local review only. No inferred activity, ecosystem or musical role. */
export const LOCAL_NATURAL_WORKS: readonly ConsumerAudioWork[] =
  manifest.files.map((file) => ({
    schemaVersion: 1,
    id: file.id,
    title: file.title,
    familyId: "unclassified-natural-texture",
    deliveryScope: "local-only",
    sourceKind: "file",
    assetKey: file.id,
    sourceFilename: file.filename,
    localPreviewFilename: file.filename,
    noiseColor: null,
    spectralDefinition: null,
    primaryOutcome: null,
    secondaryOutcomes: [],
    collectionIds: [],
    durationSeconds: file.durationSeconds,
    frameCount: file.frameCount,
    loop: true,
    sampleRateHz: 48000,
    channels: 2,
    bitDepth: 24,
    measuredLufs: file.measuredLufs,
    truePeakDbtp: file.truePeakDbtp,
    playbackGainDb: file.playbackGainDb,
    postGainTruePeakDbtp: file.truePeakDbtp + file.playbackGainDb,
    generatedPeakCeilingDbfs: null,
    availability: "local-preview-file",
    listeningStatus: "PROVISIONAL — LISTENING APPROVAL REQUIRED",
    provenance: {
      packId: packIdFor(file.id),
      manifestReference: "src/content/localNaturalAudioFiles.json",
    },
  }));
