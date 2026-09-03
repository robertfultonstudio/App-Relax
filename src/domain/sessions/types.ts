import type { ConsumerOutcomeId } from "@/content/productShell";
import type { ConsumerAudioWork } from "@/domain/audio/consumerTypes";

export const SESSION_DURATIONS_MINUTES = [10, 20, 30, 45, 60, 90] as const;

export type SessionDurationMinutes = (typeof SESSION_DURATIONS_MINUTES)[number];
export type SessionMode = "sound-only" | "guided";
export type SessionPhaseId = "arrival" | "flow" | "deepening" | "return";
export type HarmonicFamily =
  "non-tonal-water" | "e-minor" | "c-major" | "catalog-untagged";
export type TransitionClass =
  "natural-water" | "harmonic-ambient" | "soft-tonal";
export type OfflineAssetState =
  "embedded" | "download-required" | "local-development-only";

export interface SessionWorkProfile {
  work: ConsumerAudioWork;
  intents: readonly ConsumerOutcomeId[];
  aestheticFamily: "rain" | "stream" | "sea" | "cosmic" | "soft-tonal";
  compatibilityGroup: string;
  harmonicFamily: HarmonicFamily;
  energyStart: 1 | 2 | 3 | 4 | 5;
  energyEnd: 1 | 2 | 3 | 4 | 5;
  density: 1 | 2 | 3 | 4 | 5;
  melodicPresence: "none" | "light" | "present";
  voiceCompatibility: "preferred" | "duckable" | "unsuitable";
  phaseRoles: readonly SessionPhaseId[];
  safeEntryPointsSeconds: readonly number[];
  safeExitPointsSeconds: readonly number[];
  transitionClass: TransitionClass;
  offlineState: OfflineAssetState;
  endingPolicy: "continuous-loop" | "editorial-ending-required";
  editorialStatus:
    | "PROVISIONAL — TRANSITION REVIEW REQUIRED"
    | "REVIEWED — TRANSITION RULES APPROVED";
  metadataBasis:
    | "PROVISIONAL — CATALOG AND FILENAME INFERENCE"
    | "REVIEWED — EDITORIAL METADATA";
  continuumReadiness: "provisional-qa" | "editorially-reviewed";
}

export interface SessionPhaseWindow {
  id: SessionPhaseId;
  startFrame: number;
  endFrame: number;
  startSeconds: number;
  endSeconds: number;
}

export type TransitionCurve = "equal-power" | "linear";

export interface AdaptiveSessionSegment {
  index: number;
  phase: SessionPhaseId;
  workId: string;
  title: string;
  startFrame: number;
  endFrame: number;
  startSeconds: number;
  endSeconds: number;
  sourceEntryFrame: number;
  sourceExitFrame: number;
  sourceEntrySeconds: number;
  sourceExitSeconds: number;
  loopCount: number;
  playbackTrimDb: number;
  finalEnvelopeSeconds: number;
  phaseRuleAudit: readonly string[];
}

export interface AdaptiveSessionTransition {
  index: number;
  outgoingSegmentIndex: number;
  incomingSegmentIndex: number;
  startFrame: number;
  endFrame: number;
  startSeconds: number;
  endSeconds: number;
  durationSeconds: number;
  curve: TransitionCurve;
  transitionClass: TransitionClass;
  untrimmedPeakDbtp: number;
  transitionTrimDb: number;
  clippingRiskDbtp: number | null;
  ruleAudit: readonly string[];
  reviewStatus: "PROVISIONAL — LISTENING REVIEW REQUIRED";
}

export interface AdaptiveSessionPlan {
  schemaVersion: 1;
  kind: "adaptive-session-plan";
  id: string;
  seed: string;
  outcome: ConsumerOutcomeId;
  mode: "sound-only";
  requestedDurationMinutes: SessionDurationMinutes;
  sampleRateHz: 48000;
  targetFrames: number;
  totalDurationSeconds: number;
  exactDuration: true;
  phases: readonly SessionPhaseWindow[];
  segments: readonly AdaptiveSessionSegment[];
  transitions: readonly AdaptiveSessionTransition[];
  endingStrategy:
    "editorial-boundary" | "controlled-final-envelope-no-editorial-outro";
  offlineReady: boolean;
  transitionReviewStatus: "PROVISIONAL — LISTENING REVIEW REQUIRED";
  metadataReviewStatus:
    "PROVISIONAL — QA ONLY" | "REVIEWED — EDITORIAL METADATA";
}

export interface AdaptiveSessionProgram {
  kind: "adaptive-session";
  plan: AdaptiveSessionPlan;
  works: readonly ConsumerAudioWork[];
  fadeInSeconds: number;
  fadeOutSeconds: number;
}

export interface CreateAdaptiveSessionInput {
  outcome: ConsumerOutcomeId;
  mode: SessionMode;
  durationMinutes: SessionDurationMinutes;
  seed: string;
  recentWorkIds?: readonly string[];
  availableWorkIds?: readonly string[];
  profiles?: readonly SessionWorkProfile[];
  crossfadeSeconds?: number;
  curve?: TransitionCurve;
  allowProvisionalMetadata?: boolean;
}

export type SessionPlanningErrorCode =
  | "GUIDED_UNAVAILABLE"
  | "UNSUPPORTED_DURATION"
  | "INSUFFICIENT_COMPATIBLE_WORKS"
  | "NO_SAFE_SEQUENCE"
  | "EDITORIAL_ENDING_UNAVAILABLE";

export class SessionPlanningError extends Error {
  constructor(
    public readonly code: SessionPlanningErrorCode,
    message: string,
  ) {
    super(message);
    this.name = "SessionPlanningError";
  }
}
