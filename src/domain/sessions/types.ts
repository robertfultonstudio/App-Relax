import type { ConsumerOutcomeId } from "@/content/productShell";
import type { ConsumerAudioWork } from "@/domain/audio/consumerTypes";

export const SESSION_DURATIONS_MINUTES = [10, 20, 30, 45, 60, 90] as const;

export type SessionDurationMinutes = (typeof SESSION_DURATIONS_MINUTES)[number];
export type SessionMode = "sound-only" | "guided";
export type SessionSoundKind = "music" | "nature";
export type AdaptiveSessionLaneId = "primary" | "nature";
export type NatureAmbienceFamily = "rain" | "sea";
export type NatureMixLevel = number;
export type SessionPhaseId = "arrival" | "flow" | "deepening" | "return";
export type HarmonicFamily =
  "non-tonal-water" | "e-minor" | "c-major" | "catalog-untagged";
export type TransitionClass =
  "natural-water" | "harmonic-ambient" | "soft-tonal";
export type OfflineAssetState =
  "embedded" | "download-required" | "local-development-only";

export type EditorialReviewStatus = "provisional" | "editorially-reviewed";
export type SessionIntensity = 1 | 2 | 3 | 4 | 5;

/** An explicit editorial contract, never inferred from the name of a practice. */
export interface SessionIntentPhasePolicy {
  outcome: ConsumerOutcomeId;
  reviewStatus: EditorialReviewStatus;
  phases: readonly {
    id: SessionPhaseId;
    role: "welcome" | "gentle-movement" | "quiet" | "return";
    weight: number;
    energyStart: readonly [SessionIntensity, SessionIntensity];
    energyEnd: readonly [SessionIntensity, SessionIntensity];
    density: readonly [SessionIntensity, SessionIntensity];
    melodicPresence: readonly SessionWorkProfile["melodicPresence"][];
  }[];
}

/** Unwrapped source coordinates allow a reviewed interval to cross a loop seam. */
export interface SourceTransitionWindow {
  boundarySeconds: number;
  startSeconds: number;
  endSeconds: number;
  compatibilityKey: string;
  includesLoopBoundary: boolean;
  reviewStatus: EditorialReviewStatus;
}

export interface SessionWorkProfile {
  work: ConsumerAudioWork;
  materialKind: SessionSoundKind | "unclassified";
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
  /** Optional future metadata. Markers alone remain the legacy QA contract. */
  transitionWindows?: {
    entry: readonly SourceTransitionWindow[];
    exit: readonly SourceTransitionWindow[];
  };
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
  lane?: AdaptiveSessionLaneId;
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
  lane?: AdaptiveSessionLaneId;
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
  /** Private review: one autonomous looping recording, not a music playlist. */
  listeningWorkId?: string;
  schemaVersion: 1;
  kind: "adaptive-session-plan";
  id: string;
  seed: string;
  outcome: ConsumerOutcomeId;
  mode: "sound-only";
  soundKind: SessionSoundKind;
  requestedDurationMinutes: SessionDurationMinutes;
  sampleRateHz: 48000;
  targetFrames: number;
  totalDurationSeconds: number;
  exactDuration: true;
  phases: readonly SessionPhaseWindow[];
  segments: readonly AdaptiveSessionSegment[];
  transitions: readonly AdaptiveSessionTransition[];
  endingStrategy:
    | "editorial-boundary"
    | "controlled-final-envelope-no-editorial-outro"
    | "source-file-boundary-review-only"
    | "extended-loop-boundary-review-only";
  offlineReady: boolean;
  transitionReviewStatus: "PROVISIONAL — LISTENING REVIEW REQUIRED";
  metadataReviewStatus:
    "PROVISIONAL — QA ONLY" | "REVIEWED — EDITORIAL METADATA";
  natureMix?: {
    /** Off retains the independent lane contract, but acquires no audio. */
    enabled?: boolean;
    initialLevel: NatureMixLevel;
    minimumLevel: 0;
    maximumLevel: 1;
    levelStep: 0.1;
    selectedFamily: NatureAmbienceFamily;
    availableFamilies: readonly NatureAmbienceFamily[];
    headroomStrategy: "fixed-music-equal-ceiling";
    musicWorkIds: readonly string[];
    natureWorkIds: readonly string[];
  };
  compositeHeadroomTrimDb?: number;
}

export interface AdaptiveSessionProgram {
  kind: "adaptive-session";
  plan: AdaptiveSessionPlan;
  works: readonly ConsumerAudioWork[];
  fadeInSeconds: number;
  fadeOutSeconds: number;
}

export interface CreateAdaptiveSessionInput {
  listeningWorkId?: string;
  cycleId?: string;
  outcome: ConsumerOutcomeId;
  mode: SessionMode;
  soundKind: SessionSoundKind;
  durationMinutes: SessionDurationMinutes;
  seed: string;
  recentWorkIds?: readonly string[];
  availableWorkIds?: readonly string[];
  profiles?: readonly SessionWorkProfile[];
  crossfadeSeconds?: number;
  curve?: TransitionCurve;
  allowProvisionalMetadata?: boolean;
  includeNatureBed?: boolean;
  /** Consumer adapter opt-in: prepare metadata, but no bytes, while Off. */
  prepareNatureControls?: boolean;
  natureFamily?: NatureAmbienceFamily;
  phasePolicy?: SessionIntentPhasePolicy;
}

export type SessionPlanningErrorCode =
  | "CYCLE_TRANSITIONS_UNREVIEWED"
  | "GUIDED_UNAVAILABLE"
  | "UNSUPPORTED_DURATION"
  | "INSUFFICIENT_COMPATIBLE_WORKS"
  | "NO_SAFE_SEQUENCE"
  | "NATURE_BED_UNAVAILABLE"
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
