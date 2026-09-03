import { getSessionPolicy } from "@/content/sessionPolicies";
import { SESSION_WORK_PROFILES } from "@/content/sessionWorkProfiles";
import { estimateOverlapPeakDbtp } from "./equalPower";
import type {
  AdaptiveSessionPlan,
  AdaptiveSessionProgram,
  AdaptiveSessionSegment,
  AdaptiveSessionTransition,
  CreateAdaptiveSessionInput,
  SessionPhaseId,
  SessionPhaseWindow,
  SessionWorkProfile,
} from "./types";
import { SessionPlanningError } from "./types";

const SAMPLE_RATE = 48_000 as const;
const PHASE_IDS: readonly SessionPhaseId[] = [
  "arrival",
  "flow",
  "deepening",
  "return",
];
const PHASE_WEIGHTS = [0.16, 0.38, 0.3, 0.16] as const;

function hashSeed(seed: string): number {
  let value = 2166136261;
  for (let index = 0; index < seed.length; index += 1) {
    value ^= seed.charCodeAt(index);
    value = Math.imul(value, 16777619);
  }
  return value >>> 0;
}

function seededRandom(seed: string): () => number {
  let state = hashSeed(seed) || 0x6d2b79f5;
  return () => {
    state += 0x6d2b79f5;
    let value = state;
    value = Math.imul(value ^ (value >>> 15), value | 1);
    value ^= value + Math.imul(value ^ (value >>> 7), value | 61);
    return ((value ^ (value >>> 14)) >>> 0) / 4_294_967_296;
  };
}

function stableShuffle<T>(values: readonly T[], random: () => number): T[] {
  return [...values]
    .map((value) => ({ value, rank: random() }))
    .sort((left, right) => left.rank - right.rank)
    .map(({ value }) => value);
}

function seconds(frames: number): number {
  return Number((frames / SAMPLE_RATE).toFixed(6));
}

function hasValidBoundaryMetadata(profile: SessionWorkProfile): boolean {
  const duration = profile.work.durationSeconds;
  return (
    profile.safeEntryPointsSeconds.length > 0 &&
    profile.safeExitPointsSeconds.length > 0 &&
    profile.safeEntryPointsSeconds.every(
      (point) => Number.isFinite(point) && point >= 0 && point < duration,
    ) &&
    profile.safeExitPointsSeconds.every(
      (point) => Number.isFinite(point) && point > 0 && point <= duration,
    )
  );
}

function isSafeExitFrame(
  profile: SessionWorkProfile,
  sourceExitFrame: number,
): boolean {
  return profile.safeExitPointsSeconds.some(
    (point) =>
      Math.round(point * SAMPLE_RATE) % profile.work.frameCount ===
      sourceExitFrame,
  );
}

function buildPhases(targetFrames: number): SessionPhaseWindow[] {
  let cursor = 0;
  return PHASE_IDS.map((id, index) => {
    const endFrame =
      index === PHASE_IDS.length - 1
        ? targetFrames
        : Math.round(
            targetFrames *
              PHASE_WEIGHTS.slice(0, index + 1).reduce(
                (sum, weight) => sum + weight,
                0,
              ),
          );
    const phase = {
      id,
      startFrame: cursor,
      endFrame,
      startSeconds: seconds(cursor),
      endSeconds: seconds(endFrame),
    };
    cursor = endFrame;
    return phase;
  });
}

export interface CompatibilityResult {
  compatible: boolean;
  audit: readonly string[];
}

function auditPrefix(profile: SessionWorkProfile): "PASS" | "UNREVIEWED" {
  return profile.continuumReadiness === "editorially-reviewed"
    ? "PASS"
    : "UNREVIEWED";
}

export function evaluatePhasePlacement(
  profile: SessionWorkProfile,
  phase: SessionPhaseId,
): CompatibilityResult {
  const checks =
    phase === "arrival"
      ? [
          { pass: profile.energyStart <= 2, text: "gentle initial energy" },
          { pass: profile.energyEnd <= 3, text: "controlled arrival rise" },
        ]
      : phase === "flow"
        ? [
            { pass: profile.energyStart >= 2, text: "sustained flow energy" },
            { pass: profile.energyEnd >= 2, text: "no premature return" },
          ]
        : phase === "deepening"
          ? [
              { pass: profile.energyStart >= 2, text: "deepening energy" },
              { pass: profile.density >= 2, text: "deepening density" },
            ]
          : [
              { pass: profile.energyEnd <= 2, text: "settled return energy" },
              {
                pass: profile.melodicPresence !== "present",
                text: "non-dominant return melody",
              },
            ];
  const prefix = auditPrefix(profile);
  return {
    compatible: checks.every(({ pass }) => pass),
    audit: checks.map(
      ({ pass, text }) => `${pass ? prefix : "BLOCK"} · ${phase} · ${text}`,
    ),
  };
}

export function evaluateTransition(
  outgoing: SessionWorkProfile,
  incoming: SessionWorkProfile,
): CompatibilityResult {
  const checks = [
    {
      pass: outgoing.compatibilityGroup === incoming.compatibilityGroup,
      text: `curated compatibility group ${outgoing.compatibilityGroup}`,
    },
    {
      pass: outgoing.harmonicFamily === incoming.harmonicFamily,
      text: `harmonic family ${outgoing.harmonicFamily}`,
    },
    {
      pass: outgoing.transitionClass === incoming.transitionClass,
      text: `transition class ${outgoing.transitionClass}`,
    },
    {
      pass: Math.abs(outgoing.energyEnd - incoming.energyStart) <= 2,
      text: `energy delta ${Math.abs(outgoing.energyEnd - incoming.energyStart)}`,
    },
    {
      pass: Math.abs(outgoing.density - incoming.density) <= 2,
      text: `density delta ${Math.abs(outgoing.density - incoming.density)}`,
    },
    {
      pass:
        outgoing.safeExitPointsSeconds.length > 0 &&
        incoming.safeEntryPointsSeconds.length > 0,
      text: "documented source boundary markers",
    },
    {
      pass:
        outgoing.melodicPresence === incoming.melodicPresence ||
        (outgoing.melodicPresence !== "present" &&
          incoming.melodicPresence !== "present"),
      text: `melodic handoff ${outgoing.melodicPresence} to ${incoming.melodicPresence}`,
    },
  ];
  const prefix =
    outgoing.continuumReadiness === "editorially-reviewed" &&
    incoming.continuumReadiness === "editorially-reviewed"
      ? "PASS"
      : "UNREVIEWED";
  return {
    compatible: checks.every(({ pass }) => pass),
    audit: checks.map(
      ({ pass, text }) => `${pass ? prefix : "BLOCK"} · ${text}`,
    ),
  };
}

function chooseSequence(
  input: CreateAdaptiveSessionInput,
  profiles: readonly SessionWorkProfile[],
): SessionWorkProfile[] {
  const recent = new Set(input.recentWorkIds?.slice(0, 12) ?? []);
  const available = input.availableWorkIds
    ? new Set(input.availableWorkIds)
    : null;
  const eligible = profiles
    .filter((profile) => profile.intents.includes(input.outcome))
    .filter(
      (profile) =>
        profile.continuumReadiness === "editorially-reviewed" ||
        input.allowProvisionalMetadata === true,
    )
    .filter((profile) => !recent.has(profile.work.id))
    .filter((profile) => !available || available.has(profile.work.id))
    .filter(hasValidBoundaryMetadata)
    .sort((left, right) => left.work.id.localeCompare(right.work.id));

  if (eligible.length < PHASE_IDS.length) {
    throw new SessionPlanningError(
      "INSUFFICIENT_COMPATIBLE_WORKS",
      `No reviewed four-part session is available for ${input.outcome}.`,
    );
  }

  const random = seededRandom(
    `${input.seed}|${input.outcome}|${input.durationMinutes}`,
  );
  const byPhase = PHASE_IDS.map((phase) =>
    stableShuffle(
      eligible.filter(
        (profile) =>
          profile.phaseRoles.includes(phase) &&
          evaluatePhasePlacement(profile, phase).compatible,
      ),
      random,
    ),
  );
  const chosen: SessionWorkProfile[] = [];

  function search(index: number): boolean {
    if (index === PHASE_IDS.length) return true;
    for (const candidate of byPhase[index]) {
      if (chosen.some(({ work }) => work.id === candidate.work.id)) continue;
      if (
        chosen.some(({ work }) => work.familyId === candidate.work.familyId)
      ) {
        continue;
      }
      const previous = chosen.at(-1);
      if (previous && !evaluateTransition(previous, candidate).compatible) {
        continue;
      }
      chosen.push(candidate);
      if (search(index + 1)) return true;
      chosen.pop();
    }
    return false;
  }

  if (!search(0)) {
    throw new SessionPlanningError(
      "NO_SAFE_SEQUENCE",
      `No transition-safe sequence is available for ${input.outcome}.`,
    );
  }
  return chosen;
}

function nearestSafeEnd(
  startFrame: number,
  profile: SessionWorkProfile,
  sourceEntryFrame: number,
  desiredEndFrame: number,
  latestEndFrame: number,
): number {
  const sourceFrames = profile.work.frameCount;
  const safeExitFrames = profile.safeExitPointsSeconds
    .map((point) => Math.round(point * SAMPLE_RATE))
    .filter((point) => point > 0 && point <= sourceFrames);
  const candidates: number[] = [];
  const maximumLoops = Math.ceil((latestEndFrame - startFrame) / sourceFrames);
  for (let loop = 0; loop <= maximumLoops; loop += 1) {
    for (const sourceExitFrame of safeExitFrames) {
      const firstTraversal =
        sourceExitFrame > sourceEntryFrame
          ? sourceExitFrame - sourceEntryFrame
          : sourceFrames - sourceEntryFrame + sourceExitFrame;
      const end = startFrame + loop * sourceFrames + firstTraversal;
      if (end > startFrame && end <= latestEndFrame) candidates.push(end);
    }
  }
  const closest = candidates.sort(
    (left, right) =>
      Math.abs(left - desiredEndFrame) - Math.abs(right - desiredEndFrame) ||
      left - right,
  )[0];
  if (closest !== undefined) return closest;
  throw new SessionPlanningError(
    "NO_SAFE_SEQUENCE",
    "A safe loop-boundary transition does not fit the requested duration.",
  );
}

function buildTimeline(
  chosen: readonly SessionWorkProfile[],
  phases: readonly SessionPhaseWindow[],
  targetFrames: number,
  crossfadeFrames: number,
  curve: AdaptiveSessionTransition["curve"],
): {
  segments: AdaptiveSessionSegment[];
  transitions: AdaptiveSessionTransition[];
  endingStrategy: AdaptiveSessionPlan["endingStrategy"];
} {
  const segments: AdaptiveSessionSegment[] = [];
  const transitions: AdaptiveSessionTransition[] = [];
  let startFrame = 0;

  for (let index = 0; index < chosen.length; index += 1) {
    const profile = chosen[index];
    const sourceEntryFrame = Math.round(
      profile.safeEntryPointsSeconds[0] * SAMPLE_RATE,
    );
    const isFinal = index === chosen.length - 1;
    const remainingTransitions = chosen.length - index - 1;
    const latestEndFrame =
      targetFrames - remainingTransitions * (crossfadeFrames + 1);
    const endFrame = isFinal
      ? targetFrames
      : nearestSafeEnd(
          startFrame,
          profile,
          sourceEntryFrame,
          phases[index].endFrame,
          latestEndFrame,
        );
    const playedFrames = endFrame - startFrame;
    const traversedFrames = sourceEntryFrame + playedFrames;
    const sourceExitFrame = traversedFrames % profile.work.frameCount;
    const safeEnding = isSafeExitFrame(profile, sourceExitFrame);
    const finalEnvelopeFrames = isFinal && !safeEnding ? crossfadeFrames : 0;
    segments.push({
      index,
      phase: PHASE_IDS[index],
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
      finalEnvelopeSeconds: seconds(finalEnvelopeFrames),
      phaseRuleAudit: evaluatePhasePlacement(profile, PHASE_IDS[index]).audit,
    });

    if (!isFinal) {
      const incomingStartFrame = endFrame - crossfadeFrames;
      const next = chosen[index + 1];
      const compatibility = evaluateTransition(profile, next);
      if (!compatibility.compatible) {
        throw new SessionPlanningError(
          "NO_SAFE_SEQUENCE",
          `Blocked transition ${profile.work.id} to ${next.work.id}.`,
        );
      }
      const untrimmedPeakDbtp = estimateOverlapPeakDbtp(
        profile.work,
        next.work,
        curve,
      );
      if (untrimmedPeakDbtp === null) {
        throw new SessionPlanningError(
          "NO_SAFE_SEQUENCE",
          "Transition peak metrics are unavailable.",
        );
      }
      const transitionTrimDb = Math.min(0, -1.1 - untrimmedPeakDbtp);
      transitions.push({
        index,
        outgoingSegmentIndex: index,
        incomingSegmentIndex: index + 1,
        startFrame: incomingStartFrame,
        endFrame,
        startSeconds: seconds(incomingStartFrame),
        endSeconds: seconds(endFrame),
        durationSeconds: seconds(crossfadeFrames),
        curve,
        transitionClass: profile.transitionClass,
        untrimmedPeakDbtp,
        transitionTrimDb: Number(transitionTrimDb.toFixed(3)),
        clippingRiskDbtp: Number(
          (untrimmedPeakDbtp + transitionTrimDb).toFixed(3),
        ),
        ruleAudit: compatibility.audit,
        reviewStatus: "PROVISIONAL — LISTENING REVIEW REQUIRED",
      });
      startFrame = incomingStartFrame;
    }
  }

  const trimmedSegments = segments.map((segment) => {
    const adjacentTrims = transitions
      .filter(
        (transition) =>
          transition.outgoingSegmentIndex === segment.index ||
          transition.incomingSegmentIndex === segment.index,
      )
      .map(({ transitionTrimDb }) => transitionTrimDb);
    return {
      ...segment,
      playbackTrimDb: Math.min(0, ...adjacentTrims),
    };
  });

  const finalProfile = chosen.at(-1)!;
  const finalSegment = segments.at(-1)!;
  const boundaryEnding = isSafeExitFrame(
    finalProfile,
    finalSegment.sourceExitFrame,
  );
  if (
    finalProfile.endingPolicy === "editorial-ending-required" &&
    !boundaryEnding
  ) {
    throw new SessionPlanningError(
      "EDITORIAL_ENDING_UNAVAILABLE",
      "The requested duration has no approved editorial ending.",
    );
  }
  return {
    segments: trimmedSegments,
    transitions,
    endingStrategy: boundaryEnding
      ? "editorial-boundary"
      : "controlled-final-envelope-no-editorial-outro",
  };
}

export function createAdaptiveSessionProgram(
  input: CreateAdaptiveSessionInput,
): AdaptiveSessionProgram {
  if (input.mode === "guided") {
    throw new SessionPlanningError(
      "GUIDED_UNAVAILABLE",
      "Guided sessions are in production; no recorded voice is available.",
    );
  }
  const policy = getSessionPolicy(input.outcome);
  if (!policy.durations.includes(input.durationMinutes)) {
    throw new SessionPlanningError(
      "UNSUPPORTED_DURATION",
      `${input.durationMinutes} minutes is not offered for ${input.outcome}.`,
    );
  }
  const profiles = input.profiles ?? SESSION_WORK_PROFILES;
  const selected = chooseSequence(input, profiles);
  const targetFrames = input.durationMinutes * 60 * SAMPLE_RATE;
  const crossfadeSeconds = input.crossfadeSeconds ?? 12;
  if (crossfadeSeconds < 4 || crossfadeSeconds > 30) {
    throw new Error("Crossfade duration must be between 4 and 30 seconds.");
  }
  const crossfadeFrames = Math.round(crossfadeSeconds * SAMPLE_RATE);
  const phases = buildPhases(targetFrames);
  const timeline = buildTimeline(
    selected,
    phases,
    targetFrames,
    crossfadeFrames,
    input.curve ?? "equal-power",
  );
  const canonicalIdentity = JSON.stringify({
    seed: input.seed,
    outcome: input.outcome,
    durationMinutes: input.durationMinutes,
    recentWorkIds: [...(input.recentWorkIds ?? [])],
    availableWorkIds: [...(input.availableWorkIds ?? [])],
    crossfadeSeconds,
    curve: input.curve ?? "equal-power",
    segments: timeline.segments.map(
      ({
        workId,
        startFrame,
        endFrame,
        sourceEntryFrame,
        sourceExitFrame,
      }) => ({
        workId,
        startFrame,
        endFrame,
        sourceEntryFrame,
        sourceExitFrame,
      }),
    ),
  });
  const identity = [
    hashSeed(canonicalIdentity),
    hashSeed(`continuum-plan|${canonicalIdentity}`),
  ]
    .map((value) => value.toString(16).padStart(8, "0"))
    .join("");
  const hasProvisionalMetadata = selected.some(
    ({ continuumReadiness }) => continuumReadiness !== "editorially-reviewed",
  );
  const plan: AdaptiveSessionPlan = {
    schemaVersion: 1,
    kind: "adaptive-session-plan",
    id: `continuum-${input.outcome}-${input.durationMinutes}-${identity}`,
    seed: input.seed,
    outcome: input.outcome,
    mode: "sound-only",
    requestedDurationMinutes: input.durationMinutes,
    sampleRateHz: SAMPLE_RATE,
    targetFrames,
    totalDurationSeconds: input.durationMinutes * 60,
    exactDuration: true,
    phases,
    segments: timeline.segments,
    transitions: timeline.transitions,
    endingStrategy: timeline.endingStrategy,
    offlineReady: selected.every(
      ({ offlineState }) => offlineState === "embedded",
    ),
    transitionReviewStatus: "PROVISIONAL — LISTENING REVIEW REQUIRED",
    metadataReviewStatus: hasProvisionalMetadata
      ? "PROVISIONAL — QA ONLY"
      : "REVIEWED — EDITORIAL METADATA",
  };
  return {
    kind: "adaptive-session",
    plan,
    works: selected.map(({ work }) => work),
    fadeInSeconds: 2,
    fadeOutSeconds: crossfadeSeconds,
  };
}

export function overrideTransition(
  program: AdaptiveSessionProgram,
  transitionIndex: number,
  durationSeconds: number,
  curve: AdaptiveSessionTransition["curve"],
): AdaptiveSessionProgram {
  if (durationSeconds < 4 || durationSeconds > 30) {
    throw new Error("Workbench transition duration must be 4–30 seconds.");
  }
  const transition = program.plan.transitions[transitionIndex];
  if (!transition) throw new Error("Unknown transition.");
  const durationFrames = Math.round(durationSeconds * SAMPLE_RATE);
  const startFrame = transition.endFrame - durationFrames;
  const segments = program.plan.segments.map((segment) => {
    if (segment.index !== transition.incomingSegmentIndex) return segment;
    const work = program.works[segment.index];
    const playedFrames = segment.endFrame - startFrame;
    const traversedFrames = segment.sourceEntryFrame + playedFrames;
    return {
      ...segment,
      startFrame,
      startSeconds: seconds(startFrame),
      sourceExitFrame: traversedFrames % work.frameCount,
      sourceExitSeconds: seconds(traversedFrames % work.frameCount),
      loopCount: Math.ceil(traversedFrames / work.frameCount),
    };
  });
  const transitions = program.plan.transitions.map((item) => {
    if (item.index !== transitionIndex) return item;
    const untrimmedPeakDbtp = estimateOverlapPeakDbtp(
      program.works[item.outgoingSegmentIndex],
      program.works[item.incomingSegmentIndex],
      curve,
    );
    if (untrimmedPeakDbtp === null) {
      throw new Error("Transition peak metrics are unavailable.");
    }
    const transitionTrimDb = Math.min(0, -1.1 - untrimmedPeakDbtp);
    return {
      ...item,
      startFrame,
      startSeconds: seconds(startFrame),
      durationSeconds,
      curve,
      untrimmedPeakDbtp,
      transitionTrimDb: Number(transitionTrimDb.toFixed(3)),
      clippingRiskDbtp: Number(
        (untrimmedPeakDbtp + transitionTrimDb).toFixed(3),
      ),
    };
  });
  const trimmedSegments = segments.map((segment) => {
    const adjacentTrims = transitions
      .filter(
        (item) =>
          item.outgoingSegmentIndex === segment.index ||
          item.incomingSegmentIndex === segment.index,
      )
      .map(({ transitionTrimDb }) => transitionTrimDb);
    return {
      ...segment,
      playbackTrimDb: Math.min(0, ...adjacentTrims),
    };
  });
  return {
    ...program,
    plan: {
      ...program.plan,
      id: `${program.plan.id}-t${transitionIndex}-${durationSeconds}-${curve}`,
      segments: trimmedSegments,
      transitions,
    },
  };
}
