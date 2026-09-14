import manifest from "./hathaAudioFiles.json";
import type { ConsumerAudioWork } from "@/domain/audio/consumerTypes";
import type { SessionPhaseId } from "@/domain/sessions/types";

/** Titles are presentation only. Roles come from the matching Respiro v03 timeline,
 * not Centro comune, filename parsing, or an inferred key/tempo of the final WAV. */
export const HATHA_AUDIO_WORKS: readonly ConsumerAudioWork[] =
  manifest.files.map((file) => ({
    schemaVersion: 1,
    id: file.id,
    title: file.displayTitle,
    familyId: manifest.cycleId,
    cycle: {
      id: manifest.cycleId,
      structuralOrder: file.structuralOrder,
      role: file.role,
      phaseRoles: file.phaseRoles as SessionPhaseId[],
      sourceReference: manifest.structuralSourceReference,
      reviewStatus: "source-document-mapped",
      transitionStatus: "final-wav-review-required",
    },
    sourceKind: "file",
    assetKey: file.id,
    sourceFilename: file.filename,
    localPreviewFilename: file.filename,
    noiseColor: null,
    spectralDefinition: null,
    primaryOutcome: "yoga",
    secondaryOutcomes: [],
    collectionIds: ["standalone-works"],
    durationSeconds: file.durationSeconds,
    frameCount: file.frameCount,
    sampleRateHz: 48000,
    channels: 2,
    bitDepth: 24,
    loop: true,
    measuredLufs: file.measuredLufs,
    truePeakDbtp: file.truePeakDbtp,
    playbackGainDb: 0,
    postGainTruePeakDbtp: file.truePeakDbtp,
    generatedPeakCeilingDbfs: null,
    availability: "local-preview-file",
    deliveryScope: "private-review",
    listeningStatus: "PROVISIONAL — LISTENING APPROVAL REQUIRED",
    provenance: {
      packId: "RESPIRO_HATHA_1_LOOPS_20260912",
      manifestReference: "src/content/hathaAudioFiles.json",
    },
  }));
