import type { ConsumerAudioWork } from "@/domain/audio/consumerTypes";
import type {
  AdaptiveSessionProgram,
  AdaptiveSessionSegment,
  AdaptiveSessionTransition,
  SessionDurationMinutes,
  TransitionCurve,
} from "@/domain/sessions/types";

/** TEST ONLY: invented metadata and URIs, no catalog import, file, audio or approval. */
export function crossfadeProgram(
  durationMinutes: SessionDurationMinutes = 20,
  crossfadeSeconds = 180,
  curve: TransitionCurve = "equal-power",
): AdaptiveSessionProgram {
  const total = durationMinutes * 60;
  if (crossfadeSeconds * 3 >= total)
    throw new Error("Fixture needs separated transition windows");
  const works = ["music-a", "music-b", "nature-a", "nature-b"].map(
    (name): ConsumerAudioWork => ({
      schemaVersion: 1,
      id: `technical-${name}`,
      title: `TEST ONLY ${name}`,
      familyId: `technical-${name}`,
      sourceKind: "file",
      assetKey: `technical-${name}`,
      sourceFilename: null,
      localPreviewFilename: null,
      noiseColor: null,
      spectralDefinition: null,
      primaryOutcome: "relax",
      secondaryOutcomes: [],
      collectionIds: [],
      durationSeconds: 137,
      frameCount: 137 * 48000,
      loop: true,
      sampleRateHz: 48000,
      channels: 2,
      bitDepth: 24,
      measuredLufs: -20,
      truePeakDbtp: -6,
      playbackGainDb: 0,
      postGainTruePeakDbtp: -6,
      generatedPeakCeilingDbfs: null,
      availability: "local-preview-file",
      listeningStatus: "APPROVED — LISTENING PASSED",
      provenance: {
        packId: "APP_READY_AUDIO_01",
        // Deliberately not a production manifest; never widen its contract
        // just to admit a fixture that cannot resolve to an audio asset.
        manifestReference:
          "TEST-ONLY-NO-ASSET-NO-APPROVAL" as ConsumerAudioWork["provenance"]["manifestReference"],
      },
    }),
  );
  const segments: AdaptiveSessionSegment[] = [];
  const transitions: AdaptiveSessionTransition[] = [];
  for (const [laneIndex, lane] of (["primary", "nature"] as const).entries()) {
    const centre = ((laneIndex + 1) * total) / 3;
    const start = centre - crossfadeSeconds / 2,
      end = centre + crossfadeSeconds / 2;
    for (let side = 0; side < 2; side++) {
      const index = laneIndex * 2 + side;
      const from = side ? start : 0,
        to = side ? total : end;
      segments.push({
        index,
        lane,
        phase: side ? "return" : "arrival",
        workId: works[index].id,
        title: works[index].title,
        startFrame: Math.round(from * 48000),
        endFrame: Math.round(to * 48000),
        startSeconds: from,
        endSeconds: to,
        sourceEntryFrame: 0,
        sourceExitFrame: Math.round(((to - from) % 137) * 48000),
        sourceEntrySeconds: 0,
        sourceExitSeconds: (to - from) % 137,
        loopCount: Math.ceil((to - from) / 137),
        playbackTrimDb: 0,
        finalEnvelopeSeconds: side ? 4 : 0,
        phaseRuleAudit: ["TECHNICAL FIXTURE — no listening approval"],
      });
    }
    transitions.push({
      index: laneIndex,
      lane,
      outgoingSegmentIndex: laneIndex * 2,
      incomingSegmentIndex: laneIndex * 2 + 1,
      startFrame: Math.round(start * 48000),
      endFrame: Math.round(end * 48000),
      startSeconds: start,
      endSeconds: end,
      durationSeconds: crossfadeSeconds,
      curve,
      transitionClass: laneIndex ? "natural-water" : "harmonic-ambient",
      untrimmedPeakDbtp: -2.99,
      transitionTrimDb: 0,
      clippingRiskDbtp: -2.99,
      ruleAudit: ["TECHNICAL FIXTURE — staggered lanes"],
      reviewStatus: "PROVISIONAL — LISTENING REVIEW REQUIRED",
    });
  }
  return {
    kind: "adaptive-session",
    works,
    fadeInSeconds: 2,
    fadeOutSeconds: 4,
    plan: {
      schemaVersion: 1,
      kind: "adaptive-session-plan",
      id: `technical-${durationMinutes}-${crossfadeSeconds}-${curve}`,
      seed: "fixed-technical-fixture",
      outcome: "relax",
      mode: "sound-only",
      soundKind: "music",
      requestedDurationMinutes: durationMinutes,
      sampleRateHz: 48000,
      targetFrames: total * 48000,
      totalDurationSeconds: total,
      exactDuration: true,
      phases: (["arrival", "flow", "deepening", "return"] as const).map(
        (id, i) => ({
          id,
          startFrame: (i * total * 48000) / 4,
          endFrame: ((i + 1) * total * 48000) / 4,
          startSeconds: (i * total) / 4,
          endSeconds: ((i + 1) * total) / 4,
        }),
      ),
      segments,
      transitions,
      endingStrategy: "controlled-final-envelope-no-editorial-outro",
      offlineReady: false,
      transitionReviewStatus: "PROVISIONAL — LISTENING REVIEW REQUIRED",
      metadataReviewStatus: "PROVISIONAL — QA ONLY",
      natureMix: {
        initialLevel: 0.5,
        minimumLevel: 0,
        maximumLevel: 1,
        levelStep: 0.1,
        selectedFamily: "rain",
        availableFamilies: ["rain", "sea"],
        headroomStrategy: "fixed-music-equal-ceiling",
        musicWorkIds: works.slice(0, 2).map((x) => x.id),
        natureWorkIds: works.slice(2).map((x) => x.id),
      },
      compositeHeadroomTrimDb: -1,
    },
  };
}
