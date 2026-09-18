import type { ConsumerAudioWork } from "@/domain/audio/consumerTypes";
import type { ConsumerOutcomeId } from "@/content/productShell";
import { soundFamilyFor } from "@/content/soundFamilies";
import type {
  AdaptiveSessionProgram,
  NatureAmbienceFamily,
  SessionDurationMinutes,
} from "@/domain/sessions/types";
import { attachCoordinatedNatureBed } from "@/domain/sessions/continuumPlanner";
import { auditPlanAccelerated } from "@/domain/sessions/workbench";

/** Private PWA adapter. One music recording loops; nature is the only extra lane. */
export function createListeningNatureProgram(
  work: ConsumerAudioWork,
  outcome: ConsumerOutcomeId,
  duration: SessionDurationMinutes,
  family: NatureAmbienceFamily | null,
  musicGuardSeconds = 0,
): AdaptiveSessionProgram {
  if (work.sourceKind !== "file" || soundFamilyFor(work) !== "music")
    throw new Error("Natural ambience can accompany a musical recording only.");
  const frames = duration * 60 * 48000;
  const seed = `single-loop-review:${work.id}:${outcome}:${duration}`;
  const program: AdaptiveSessionProgram = {
    kind: "adaptive-session",
    works: [work],
    fadeInSeconds: 2,
    fadeOutSeconds: 12,
    plan: {
      schemaVersion: 1,
      kind: "adaptive-session-plan",
      listeningWorkId: work.id,
      id: seed,
      seed,
      outcome,
      mode: "sound-only",
      soundKind: "music",
      requestedDurationMinutes: duration,
      sampleRateHz: 48000,
      targetFrames: frames,
      totalDurationSeconds: duration * 60,
      exactDuration: true,
      phases: [],
      transitions: [],
      segments: [
        {
          index: 0,
          lane: "primary",
          phase: "arrival",
          workId: work.id,
          title: work.title,
          startFrame: 0,
          endFrame: frames,
          startSeconds: 0,
          endSeconds: duration * 60,
          sourceEntryFrame: 0,
          sourceEntrySeconds: 0,
          sourceExitFrame: frames % work.frameCount,
          sourceExitSeconds: (frames % work.frameCount) / 48000,
          loopCount: Math.floor((frames - 1) / work.frameCount),
          playbackTrimDb: 0,
          finalEnvelopeSeconds: 12,
          phaseRuleAudit: [
            "One autonomous recording repeats; no generated music sequence or invented phases.",
          ],
        },
      ],
      endingStrategy: "controlled-final-envelope-no-editorial-outro",
      offlineReady: false,
      transitionReviewStatus: "PROVISIONAL — LISTENING REVIEW REQUIRED",
      metadataReviewStatus: "PROVISIONAL — QA ONLY",
    },
  };
  const result = attachCoordinatedNatureBed(
    program,
    seed,
    family ?? "rain",
    undefined,
    musicGuardSeconds,
  );
  result.plan.natureMix!.enabled = family !== null;
  if (family === null) result.plan.id += ":off";
  if (!auditPlanAccelerated(result).pass)
    throw new Error("Music and nature timeline failed safety checks.");
  return result;
}
