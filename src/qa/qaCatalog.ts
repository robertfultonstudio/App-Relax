import {
  CONSUMER_AUDIO_WORKS,
  isPlayableWorkOnWeb,
} from "@/content/consumerCatalog";
import { SESSION_WORK_PROFILES } from "@/content/sessionWorkProfiles";
import type { ConsumerOutcomeId } from "@/content/productShell";
import { estimateOverlapPeakDbtp } from "@/domain/sessions/equalPower";
import {
  attachCoordinatedNatureBed,
  evaluatePhasePlacement,
  evaluateTransition,
} from "@/domain/sessions/continuumPlanner";
import type {
  AdaptiveSessionProgram,
  AdaptiveSessionSegment,
  NatureAmbienceFamily,
  SessionDurationMinutes,
  SessionWorkProfile,
  TransitionCurve,
} from "@/domain/sessions/types";

const SAMPLE_RATE = 48_000;

export type QaCatalogReadiness =
  "transition-ready" | "single-only" | "rejected";

export interface QaCatalogEntry {
  playable: boolean;
  readiness: QaCatalogReadiness;
  transitionProfile: SessionWorkProfile | null;
  work: (typeof CONSUMER_AUDIO_WORKS)[number];
}

function hasCompatibleTransition(profile: SessionWorkProfile): boolean {
  return SESSION_WORK_PROFILES.some(
    (candidate) =>
      candidate.work.id !== profile.work.id &&
      (evaluateTransition(profile, candidate).compatible ||
        evaluateTransition(candidate, profile).compatible),
  );
}

export const QA_CATALOG: readonly QaCatalogEntry[] = CONSUMER_AUDIO_WORKS.map(
  (work) => {
    const transitionProfile =
      SESSION_WORK_PROFILES.find((profile) => profile.work.id === work.id) ??
      null;
    const playable = isPlayableWorkOnWeb(work);
    return {
      work,
      playable,
      transitionProfile,
      readiness: !playable
        ? "rejected"
        : transitionProfile && hasCompatibleTransition(transitionProfile)
          ? "transition-ready"
          : "single-only",
    };
  },
);

export function getQaTransitionProfile(workId: string): SessionWorkProfile {
  const profile = SESSION_WORK_PROFILES.find(
    (candidate) => candidate.work.id === workId,
  );
  if (!profile) {
    throw new Error(`${workId} is available only as a single work.`);
  }
  return profile;
}

export function qaPairCompatibility(
  outgoingWorkId: string,
  incomingWorkId: string,
  window?: {
    crossfadeSeconds: number;
    durationMinutes: SessionDurationMinutes;
  },
) {
  if (outgoingWorkId === incomingWorkId) {
    return {
      compatible: false,
      audit: ["BLOCK · outgoing and incoming works must be different"],
    } as const;
  }
  const outgoing = getQaTransitionProfile(outgoingWorkId);
  const compatibility = evaluateTransition(
    outgoing,
    getQaTransitionProfile(incomingWorkId),
  );
  if (!compatibility.compatible || !window) return compatibility;

  if (window.crossfadeSeconds < 4 || window.crossfadeSeconds > 300) {
    return {
      compatible: false,
      audit: [
        ...compatibility.audit,
        "BLOCK · crossfade duration must be 4–300 seconds",
      ],
    };
  }

  const targetFrames = window.durationMinutes * 60 * SAMPLE_RATE;
  const crossfadeFrames = Math.round(window.crossfadeSeconds * SAMPLE_RATE);
  const desiredEndFrame =
    Math.round(targetFrames / 2) + Math.floor(crossfadeFrames / 2);
  try {
    const outgoingEndFrame = nearestSafeOutgoingEndFrame(
      outgoing,
      desiredEndFrame,
      targetFrames,
    );
    if (outgoingEndFrame - crossfadeFrames <= 0) {
      throw new Error("safe boundary leaves no room for the crossfade");
    }
    return {
      compatible: true,
      audit: [
        ...compatibility.audit,
        `PASS · ${window.durationMinutes} minute QA window contains a safe outgoing boundary`,
      ],
    };
  } catch (error) {
    return {
      compatible: false,
      audit: [
        ...compatibility.audit,
        `BLOCK · ${window.durationMinutes} minute QA window · ${error instanceof Error ? error.message : "no safe outgoing boundary"}`,
      ],
    };
  }
}

interface CreateQaPairProgramInput {
  crossfadeSeconds: number;
  curve: TransitionCurve;
  durationMinutes?: SessionDurationMinutes;
  incomingWorkId: string;
  natureFamily?: NatureAmbienceFamily;
  outcome: ConsumerOutcomeId;
  outgoingWorkId: string;
}

export function createQaPairProgram({
  crossfadeSeconds,
  curve,
  durationMinutes = 10,
  incomingWorkId,
  natureFamily = "sea",
  outcome,
  outgoingWorkId,
}: CreateQaPairProgramInput): AdaptiveSessionProgram {
  if (crossfadeSeconds < 4 || crossfadeSeconds > 300) {
    throw new Error("Workbench transition duration must be 4–300 seconds.");
  }
  const outgoing = getQaTransitionProfile(outgoingWorkId);
  const incoming = getQaTransitionProfile(incomingWorkId);
  const compatibility = qaPairCompatibility(outgoingWorkId, incomingWorkId, {
    durationMinutes,
    crossfadeSeconds,
  });
  if (!compatibility.compatible) {
    const reasons = compatibility.audit
      .filter((line) => line.startsWith("BLOCK"))
      .join("; ");
    throw new Error(`Blocked transition. ${reasons}`);
  }

  const totalDurationSeconds = durationMinutes * 60;
  const targetFrames = totalDurationSeconds * SAMPLE_RATE;
  const crossfadeFrames = Math.round(crossfadeSeconds * SAMPLE_RATE);
  const midpointFrame = Math.round(targetFrames / 2);
  const outgoingEndFrame = nearestSafeOutgoingEndFrame(
    outgoing,
    midpointFrame + Math.floor(crossfadeFrames / 2),
    targetFrames,
  );
  const incomingStartFrame = outgoingEndFrame - crossfadeFrames;
  if (incomingStartFrame <= 0) {
    throw new Error(
      "A safe outgoing boundary does not fit this pair duration.",
    );
  }
  const outgoingSegment = createSegment(
    outgoing,
    0,
    "arrival",
    0,
    outgoingEndFrame,
    0,
  );
  const incomingSegment = createSegment(
    incoming,
    1,
    "return",
    incomingStartFrame,
    targetFrames,
    crossfadeSeconds,
  );
  const untrimmedPeakDbtp = estimateOverlapPeakDbtp(
    outgoing.work,
    incoming.work,
    curve,
  );
  if (untrimmedPeakDbtp === null) {
    throw new Error("Transition peak metrics are unavailable.");
  }
  const transitionTrimDb = Math.min(0, -1.1 - untrimmedPeakDbtp);
  const trim = Number(transitionTrimDb.toFixed(3));
  const segments = [outgoingSegment, incomingSegment].map((segment) => ({
    ...segment,
    playbackTrimDb: trim,
  }));
  const id = `qa-pair-${outgoing.work.id}-${incoming.work.id}-${durationMinutes}m-${crossfadeSeconds}-${curve}`;

  const baseProgram: AdaptiveSessionProgram = {
    kind: "adaptive-session",
    fadeInSeconds: 2,
    fadeOutSeconds: crossfadeSeconds,
    works: [outgoing.work, incoming.work],
    plan: {
      schemaVersion: 1,
      kind: "adaptive-session-plan",
      id,
      seed: id,
      outcome,
      mode: "sound-only",
      soundKind:
        outgoing.materialKind === "nature" && incoming.materialKind === "nature"
          ? "nature"
          : "music",
      requestedDurationMinutes: durationMinutes,
      sampleRateHz: SAMPLE_RATE,
      targetFrames,
      totalDurationSeconds,
      exactDuration: true,
      phases: [
        {
          id: "arrival",
          startFrame: 0,
          endFrame: midpointFrame,
          startSeconds: 0,
          endSeconds: seconds(midpointFrame),
        },
        {
          id: "return",
          startFrame: midpointFrame,
          endFrame: targetFrames,
          startSeconds: seconds(midpointFrame),
          endSeconds: totalDurationSeconds,
        },
      ],
      segments,
      transitions: [
        {
          index: 0,
          outgoingSegmentIndex: 0,
          incomingSegmentIndex: 1,
          startFrame: incomingStartFrame,
          endFrame: outgoingEndFrame,
          startSeconds: seconds(incomingStartFrame),
          endSeconds: seconds(outgoingEndFrame),
          durationSeconds: crossfadeSeconds,
          curve,
          transitionClass: outgoing.transitionClass,
          untrimmedPeakDbtp,
          transitionTrimDb: trim,
          clippingRiskDbtp: Number(
            (untrimmedPeakDbtp + transitionTrimDb).toFixed(3),
          ),
          ruleAudit: [
            "QA DIRECT PAIR · selected by reviewer",
            `SAFE EXIT · ${outgoing.work.title} boundary ${seconds(outgoingSegment.sourceExitFrame)}s`,
            ...compatibility.audit,
          ],
          reviewStatus: "PROVISIONAL — LISTENING REVIEW REQUIRED",
        },
      ],
      endingStrategy: "controlled-final-envelope-no-editorial-outro",
      offlineReady: [outgoing, incoming].every(
        ({ offlineState }) => offlineState === "embedded",
      ),
      transitionReviewStatus: "PROVISIONAL — LISTENING REVIEW REQUIRED",
      metadataReviewStatus: "PROVISIONAL — QA ONLY",
    },
  };
  return outgoing.materialKind === "music" && incoming.materialKind === "music"
    ? attachCoordinatedNatureBed(baseProgram, id, natureFamily)
    : baseProgram;
}

function nearestSafeOutgoingEndFrame(
  profile: SessionWorkProfile,
  desiredEndFrame: number,
  latestEndFrame: number,
): number {
  const sourceEntryFrame = Math.round(
    profile.safeEntryPointsSeconds[0] * SAMPLE_RATE,
  );
  const sourceFrames = profile.work.frameCount;
  const candidates: number[] = [];
  const maximumLoops = Math.ceil(latestEndFrame / sourceFrames);
  for (let loop = 0; loop <= maximumLoops; loop += 1) {
    for (const safeExitSeconds of profile.safeExitPointsSeconds) {
      const safeExitFrame = Math.round(safeExitSeconds * SAMPLE_RATE);
      const firstTraversal =
        safeExitFrame > sourceEntryFrame
          ? safeExitFrame - sourceEntryFrame
          : sourceFrames - sourceEntryFrame + safeExitFrame;
      const candidate = loop * sourceFrames + firstTraversal;
      if (candidate > 0 && candidate <= latestEndFrame) {
        candidates.push(candidate);
      }
    }
  }
  const nearest = candidates.sort(
    (left, right) =>
      Math.abs(left - desiredEndFrame) - Math.abs(right - desiredEndFrame) ||
      left - right,
  )[0];
  if (nearest === undefined) {
    throw new Error("No safe outgoing boundary fits this pair duration.");
  }
  return nearest;
}

function createSegment(
  profile: SessionWorkProfile,
  index: number,
  phase: "arrival" | "return",
  startFrame: number,
  endFrame: number,
  finalEnvelopeSeconds: number,
): AdaptiveSessionSegment {
  const sourceEntryFrame = Math.round(
    profile.safeEntryPointsSeconds[0] * SAMPLE_RATE,
  );
  const traversedFrames = sourceEntryFrame + endFrame - startFrame;
  const sourceExitFrame = traversedFrames % profile.work.frameCount;
  return {
    index,
    phase,
    workId: profile.work.id,
    title: profile.work.title,
    startFrame,
    endFrame,
    startSeconds: seconds(startFrame),
    endSeconds: seconds(endFrame),
    sourceEntryFrame,
    sourceExitFrame,
    sourceEntrySeconds: seconds(sourceEntryFrame),
    sourceExitSeconds: seconds(sourceExitFrame),
    loopCount: Math.ceil(traversedFrames / profile.work.frameCount),
    playbackTrimDb: 0,
    finalEnvelopeSeconds,
    phaseRuleAudit: [
      "QA DIRECT PAIR · phase placement is displayed, not consumer-approved",
      ...evaluatePhasePlacement(profile, phase).audit,
    ],
  };
}

function seconds(frames: number): number {
  return Number((frames / SAMPLE_RATE).toFixed(6));
}
