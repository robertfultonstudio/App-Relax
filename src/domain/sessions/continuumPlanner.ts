import { getSessionPolicy } from "@/content/sessionPolicies";
import {
  PROVISIONAL_MUSIC_SESSION_PAIRINGS,
  PROVISIONAL_MUSIC_SESSION_WORK_IDS,
  SESSION_WORK_PROFILES,
} from "@/content/sessionWorkProfiles";
import { estimateOverlapPeakDbtp } from "./equalPower";
import {
  LEGACY_PHASE_WEIGHTS,
  SESSION_PHASE_IDS as PHASE_IDS,
  validateIntentPhasePolicy,
} from "./phasePolicies";
import {
  getReviewedTransitionWindows,
  hasReviewedTransitionWindowPair,
  MUSIC_CROSSFADE_SECONDS,
} from "./transitionWindows";
import type {
  AdaptiveSessionPlan,
  AdaptiveSessionProgram,
  AdaptiveSessionSegment,
  AdaptiveSessionTransition,
  CreateAdaptiveSessionInput,
  NatureAmbienceFamily,
  SessionIntentPhasePolicy,
  SessionPhaseId,
  SessionPhaseWindow,
  SessionWorkProfile,
} from "./types";
import { SessionPlanningError } from "./types";
import { HATHA_AUDIO_WORKS } from "@/content/hathaCatalog";
import { getCyclePhaseCandidates, matchesCyclePhase } from "./cycleStructure";
import { natureTransitionSlots } from "./natureTransitionSlots";

const SAMPLE_RATE = 48_000 as const;
const MIN_CROSSFADE_SECONDS = 4;
const MAX_CROSSFADE_SECONDS = 300;
const DEFAULT_NATURE_CROSSFADE_SECONDS = 180;
const COMPOSITE_HEADROOM_TRIM_DB = -0.2;

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
  // Preserve the same sample boundary across independently assembled lanes.
  // Decimal rounding can create a sub-sample four-deck overlap at a shared join.
  return frames / SAMPLE_RATE;
}

function hasValidBoundaryMetadata(profile: SessionWorkProfile): boolean {
  const duration = profile.work.durationSeconds;
  return (
    Number.isFinite(duration) &&
    duration > 0 &&
    Number.isSafeInteger(profile.work.frameCount) &&
    profile.work.frameCount > 0 &&
    profile.work.sampleRateHz === SAMPLE_RATE &&
    Math.round(duration * SAMPLE_RATE) === profile.work.frameCount &&
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

function buildPhases(
  targetFrames: number,
  policy?: SessionIntentPhasePolicy,
): SessionPhaseWindow[] {
  const weights =
    policy?.phases.map(({ weight }) => weight) ?? LEGACY_PHASE_WEIGHTS;
  let cursor = 0;
  return PHASE_IDS.map((id, index) => {
    const endFrame =
      index === PHASE_IDS.length - 1
        ? targetFrames
        : Math.round(
            targetFrames *
              weights
                .slice(0, index + 1)
                .reduce((sum, weight) => sum + weight, 0),
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
  policy?: SessionIntentPhasePolicy,
): CompatibilityResult {
  if (!matchesCyclePhase(profile.work, phase)) {
    return {
      compatible: false,
      audit: ["BLOCK · documented cycle phase role"],
    };
  }
  if (policy) {
    validateIntentPhasePolicy(policy, policy.outcome);
    const rule = policy.phases.find(({ id }) => id === phase)!;
    const inRange = (
      value: number,
      [minimum, maximum]: readonly [number, number],
    ) => value >= minimum && value <= maximum;
    const checks = [
      {
        pass: profile.continuumReadiness === "editorially-reviewed",
        text: "reviewed profile for intent policy",
      },
      {
        pass: profile.intents.includes(policy.outcome),
        text: `reviewed intent ${policy.outcome}`,
      },
      { pass: profile.phaseRoles.includes(phase), text: "declared phase role" },
      {
        pass: inRange(profile.energyStart, rule.energyStart),
        text: `${rule.role} initial energy`,
      },
      {
        pass: inRange(profile.energyEnd, rule.energyEnd),
        text: `${rule.role} final energy`,
      },
      {
        pass: inRange(profile.density, rule.density),
        text: `${rule.role} density`,
      },
      {
        pass: rule.melodicPresence.includes(profile.melodicPresence),
        text: `${rule.role} melody`,
      },
    ];
    return {
      compatible: checks.every(({ pass }) => pass),
      audit: checks.map(
        ({ pass, text }) => `${pass ? "PASS" : "BLOCK"} · ${phase} · ${text}`,
      ),
    };
  }
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
  crossfadeSeconds = MUSIC_CROSSFADE_SECONDS,
): CompatibilityResult {
  if (outgoing.work.cycle || incoming.work.cycle) {
    return {
      compatible: false,
      audit: ["BLOCK · final WAV cycle transition windows are not reviewed"],
    };
  }
  const userReviewedMusicPool =
    PROVISIONAL_MUSIC_SESSION_WORK_IDS.has(outgoing.work.id) ||
    PROVISIONAL_MUSIC_SESSION_WORK_IDS.has(incoming.work.id);
  const editorialMusicPair = PROVISIONAL_MUSIC_SESSION_PAIRINGS.some(
    ([outgoingId, incomingId]) =>
      outgoingId === outgoing.work.id && incomingId === incoming.work.id,
  );
  const checks = [
    ...(userReviewedMusicPool
      ? [
          {
            pass: editorialMusicPair,
            text: `user-reviewed direction ${outgoing.work.title} to ${incoming.work.title}`,
          },
        ]
      : []),
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
    ...(outgoing.transitionWindows || incoming.transitionWindows
      ? [
          {
            pass: hasReviewedTransitionWindowPair(
              outgoing,
              incoming,
              crossfadeSeconds,
            ),
            text: "complete reviewed pre-exit and post-entry windows",
          },
        ]
      : []),
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
  isFeasible: (sequence: readonly SessionWorkProfile[]) => boolean,
): SessionWorkProfile[] {
  const transitionDuration =
    input.crossfadeSeconds ??
    (input.soundKind === "music" ? MUSIC_CROSSFADE_SECONDS : 90);
  // D-060: recent listening is a preference, never an eligibility veto.
  // Newest first. Repeated IDs represent multiple successful listens.
  const recent = input.recentWorkIds?.slice(0, 12) ?? [];
  const recentScore = (id: string) =>
    recent.reduce(
      (score, item, index) => score + (item === id ? recent.length - index : 0),
      0,
    );
  const preferLessRecent = (
    values: readonly SessionWorkProfile[],
    random: () => number,
  ) =>
    stableShuffle(values, random).sort(
      (left, right) => recentScore(left.work.id) - recentScore(right.work.id),
    );
  const available = input.availableWorkIds
    ? new Set(input.availableWorkIds)
    : null;
  const eligible = profiles
    .filter(
      (profile) =>
        profile.work.listeningStatus === "APPROVED — LISTENING PASSED" &&
        profile.work.availability !== "rejected-listening",
    )
    .filter((profile) => profile.intents.includes(input.outcome))
    .filter((profile) => profile.materialKind === input.soundKind)
    .filter(
      (profile) =>
        !input.natureFamily ||
        profile.materialKind !== "nature" ||
        profile.aestheticFamily === input.natureFamily,
    )
    .filter(
      (profile) =>
        profile.continuumReadiness === "editorially-reviewed" ||
        input.allowProvisionalMetadata === true,
    )
    .filter((profile) => !available || available.has(profile.work.id))
    .filter(hasValidBoundaryMetadata)
    .sort((left, right) => left.work.id.localeCompare(right.work.id));

  if (input.soundKind === "music") {
    const eligibleById = new Map(
      eligible.map((profile) => [profile.work.id, profile]),
    );
    const pairs = PROVISIONAL_MUSIC_SESSION_PAIRINGS.flatMap(
      ([outgoingId, incomingId]) => {
        const outgoing = eligibleById.get(outgoingId);
        const incoming = eligibleById.get(incomingId);
        if (!outgoing || !incoming) return [];
        if (
          outgoing.work.id === incoming.work.id ||
          outgoing.work.familyId === incoming.work.familyId
        )
          return [];
        if (
          !evaluatePhasePlacement(outgoing, "arrival", input.phasePolicy)
            .compatible
        )
          return [];
        if (
          !evaluatePhasePlacement(incoming, "return", input.phasePolicy)
            .compatible
        )
          return [];
        if (
          !evaluateTransition(outgoing, incoming, transitionDuration).compatible
        )
          return [];
        return [[outgoing, incoming] as const];
      },
    );
    const selected = stableShuffle(
      pairs,
      seededRandom(
        `${input.seed}|${input.outcome}|${input.durationMinutes}|music-pair`,
      ),
    )
      .sort(
        (left, right) =>
          left.reduce((sum, profile) => sum + recentScore(profile.work.id), 0) -
          right.reduce((sum, profile) => sum + recentScore(profile.work.id), 0),
      )
      .find(isFeasible);
    if (!selected) {
      throw new SessionPlanningError(
        "NO_SAFE_SEQUENCE",
        `No user-reviewed music transition is available for ${input.outcome}.`,
      );
    }
    return [...selected];
  }

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
    preferLessRecent(
      eligible.filter(
        (profile) =>
          profile.phaseRoles.includes(phase) &&
          evaluatePhasePlacement(profile, phase, input.phasePolicy).compatible,
      ),
      random,
    ),
  );
  const chosen: SessionWorkProfile[] = [];

  function search(index: number): boolean {
    if (index === PHASE_IDS.length) return isFeasible(chosen);
    for (const candidate of byPhase[index]) {
      if (chosen.some(({ work }) => work.id === candidate.work.id)) continue;
      if (
        chosen.some(({ work }) => work.familyId === candidate.work.familyId)
      ) {
        continue;
      }
      const previous = chosen.at(-1);
      if (
        previous &&
        !evaluateTransition(previous, candidate, transitionDuration).compatible
      ) {
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

function safeEndCandidates(
  startFrame: number,
  profile: SessionWorkProfile,
  sourceEntryFrame: number,
  desiredEndFrame: number,
  earliestEndFrame: number,
  latestEndFrame: number,
  crossfadeSeconds: number,
): number[] {
  const sourceFrames = profile.work.frameCount;
  const safeExitFrames = profile.safeExitPointsSeconds
    .filter(
      (point) =>
        !profile.transitionWindows ||
        getReviewedTransitionWindows(profile, "exit", point, crossfadeSeconds)
          .length > 0,
    )
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
      if (end >= earliestEndFrame && end <= latestEndFrame)
        candidates.push(end);
    }
  }
  return candidates.sort(
    (left, right) =>
      Math.abs(left - desiredEndFrame) - Math.abs(right - desiredEndFrame) ||
      left - right,
  );
}

function chooseTimelineBoundaries(
  chosen: readonly SessionWorkProfile[],
  phases: readonly SessionPhaseWindow[],
  targetFrames: number,
  crossfadeFrames: number,
): readonly {
  startFrame: number;
  endFrame: number;
  sourceEntryFrame: number;
}[] {
  const placements: {
    startFrame: number;
    endFrame: number;
    sourceEntryFrame: number;
  }[] = [];
  const crossfadeSeconds = seconds(crossfadeFrames);
  function search(index: number): boolean {
    if (index === chosen.length) return true;
    const profile = chosen[index];
    const previous = placements.at(-1);
    const startFrame = previous ? previous.endFrame - crossfadeFrames : 0;
    const isFinal = index === chosen.length - 1;
    const latestEndFrame =
      targetFrames - (chosen.length - index - 1) * (crossfadeFrames + 1);
    const earliestEndFrame = previous
      ? previous.endFrame + crossfadeFrames
      : crossfadeFrames;
    for (const point of profile.safeEntryPointsSeconds) {
      if (
        profile.transitionWindows &&
        getReviewedTransitionWindows(profile, "entry", point, crossfadeSeconds)
          .length === 0
      )
        continue;
      const sourceEntryFrame = Math.round(point * SAMPLE_RATE);
      if (previous) {
        const outgoing = chosen[index - 1];
        const exitFrame =
          (previous.sourceEntryFrame +
            previous.endFrame -
            previous.startFrame) %
          outgoing.work.frameCount;
        const boundary =
          exitFrame === 0 ? outgoing.work.durationSeconds : seconds(exitFrame);
        if (
          !hasReviewedTransitionWindowPair(
            outgoing,
            profile,
            crossfadeSeconds,
            boundary,
            point,
          )
        )
          continue;
      }
      const desiredEndFrame =
        chosen.length === 2 ? phases[1].endFrame : phases[index].endFrame;
      const candidates = isFinal
        ? [targetFrames]
        : safeEndCandidates(
            startFrame,
            profile,
            sourceEntryFrame,
            desiredEndFrame,
            earliestEndFrame,
            latestEndFrame,
            crossfadeSeconds,
          );
      for (const endFrame of candidates) {
        if (endFrame <= startFrame) continue;
        const exitFrame =
          (sourceEntryFrame + endFrame - startFrame) % profile.work.frameCount;
        if (
          isFinal &&
          profile.endingPolicy === "editorial-ending-required" &&
          !isSafeExitFrame(profile, exitFrame)
        )
          continue;
        placements.push({ startFrame, endFrame, sourceEntryFrame });
        if (search(index + 1)) return true;
        placements.pop();
      }
    }
    return false;
  }
  if (!search(0))
    throw new SessionPlanningError(
      "NO_SAFE_SEQUENCE",
      "No complete safe-boundary timeline fits the requested duration.",
    );
  return placements;
}

function buildTimeline(
  chosen: readonly SessionWorkProfile[],
  phases: readonly SessionPhaseWindow[],
  targetFrames: number,
  crossfadeFrames: number,
  curve: AdaptiveSessionTransition["curve"],
  phasePolicy?: SessionIntentPhasePolicy,
): {
  segments: AdaptiveSessionSegment[];
  transitions: AdaptiveSessionTransition[];
  endingStrategy: AdaptiveSessionPlan["endingStrategy"];
} {
  const segments: AdaptiveSessionSegment[] = [];
  const transitions: AdaptiveSessionTransition[] = [];
  const placements = chooseTimelineBoundaries(
    chosen,
    phases,
    targetFrames,
    crossfadeFrames,
  );
  const segmentPhases: readonly SessionPhaseId[] =
    chosen.length === 2 ? ["arrival", "return"] : PHASE_IDS;

  for (let index = 0; index < chosen.length; index += 1) {
    const profile = chosen[index];
    const { startFrame, endFrame, sourceEntryFrame } = placements[index];
    const isFinal = index === chosen.length - 1;
    const playedFrames = endFrame - startFrame;
    const traversedFrames = sourceEntryFrame + playedFrames;
    const sourceExitFrame = traversedFrames % profile.work.frameCount;
    const safeEnding = isSafeExitFrame(profile, sourceExitFrame);
    const finalEnvelopeFrames = isFinal && !safeEnding ? crossfadeFrames : 0;
    segments.push({
      index,
      phase: segmentPhases[index],
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
      phaseRuleAudit: evaluatePhasePlacement(
        profile,
        segmentPhases[index],
        phasePolicy,
      ).audit,
    });

    if (!isFinal) {
      const incomingStartFrame = endFrame - crossfadeFrames;
      if (
        incomingStartFrame < startFrame ||
        (transitions.at(-1)?.endFrame ?? 0) > incomingStartFrame
      ) {
        throw new SessionPlanningError(
          "NO_SAFE_SEQUENCE",
          "A transition would overlap another transition on the same lane.",
        );
      }
      const next = chosen[index + 1];
      const compatibility = evaluateTransition(
        profile,
        next,
        seconds(crossfadeFrames),
      );
      if (!compatibility.compatible) {
        throw new SessionPlanningError(
          "NO_SAFE_SEQUENCE",
          `Blocked transition ${profile.work.id} to ${next.work.id}.`,
        );
      }
      const incomingEntry = seconds(placements[index + 1].sourceEntryFrame);
      const boundary =
        sourceExitFrame === 0
          ? profile.work.durationSeconds
          : seconds(sourceExitFrame);
      if (
        !hasReviewedTransitionWindowPair(
          profile,
          next,
          seconds(crossfadeFrames),
          boundary,
          incomingEntry,
        )
      ) {
        throw new SessionPlanningError(
          "NO_SAFE_SEQUENCE",
          "The selected source boundaries lack complete reviewed overlap windows.",
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

function createNatureSegment(
  profile: SessionWorkProfile,
  index: number,
  phase: SessionPhaseId,
  startFrame: number,
  endFrame: number,
  playbackTrimDb: number,
  finalEnvelopeSeconds: number,
): AdaptiveSessionSegment {
  const playedFrames = endFrame - startFrame;
  const sourceEntryFrame = 0;
  const sourceExitFrame = playedFrames % profile.work.frameCount;
  return {
    index,
    lane: "nature",
    phase,
    workId: profile.work.id,
    title: profile.work.title,
    startFrame,
    endFrame,
    startSeconds: seconds(startFrame),
    endSeconds: seconds(endFrame),
    sourceEntryFrame,
    sourceExitFrame,
    sourceEntrySeconds: 0,
    sourceExitSeconds: seconds(sourceExitFrame),
    loopCount: Math.ceil(playedFrames / profile.work.frameCount),
    playbackTrimDb,
    finalEnvelopeSeconds,
    phaseRuleAudit: [
      "PROVISIONAL · coordinated user-selected natural ambience",
      `PROVISIONAL · ${profile.aestheticFamily} remains within the selected family during ${phase}`,
    ],
  };
}

function selectNatureProfile(
  family: NatureAmbienceFamily,
  seed: string,
  excludedWorkIds: readonly string[] = [],
): SessionWorkProfile {
  const candidates = SESSION_WORK_PROFILES.filter(
    (profile) =>
      profile.materialKind === "nature" &&
      profile.aestheticFamily === family &&
      !excludedWorkIds.includes(profile.work.id),
  );
  const selected = stableShuffle(candidates, seededRandom(seed))[0];
  if (!selected) {
    throw new SessionPlanningError(
      "NATURE_BED_UNAVAILABLE",
      `No ${family} ambience is available for this music session.`,
    );
  }
  return selected;
}

export function attachCoordinatedNatureBed(
  program: AdaptiveSessionProgram,
  seed: string,
  natureFamily: NatureAmbienceFamily = "sea",
  natureCrossfadeSeconds = DEFAULT_NATURE_CROSSFADE_SECONDS,
  musicGuardSeconds = 0,
): AdaptiveSessionProgram {
  if (program.plan.soundKind !== "music") return program;
  if (
    !Number.isFinite(natureCrossfadeSeconds) ||
    natureCrossfadeSeconds < MIN_CROSSFADE_SECONDS ||
    natureCrossfadeSeconds > MAX_CROSSFADE_SECONDS
  ) {
    throw new SessionPlanningError(
      "NATURE_BED_UNAVAILABLE",
      "Natural ambience transition must be between 4 and 300 seconds.",
    );
  }
  const primary = program.plan.segments.filter(
    (s) => (s.lane ?? "primary") === "primary",
  );
  if (!primary.length) {
    throw new SessionPlanningError(
      "NATURE_BED_UNAVAILABLE",
      "A primary music source is required before adding natural ambience.",
    );
  }
  const transitionFrames = Math.round(natureCrossfadeSeconds * SAMPLE_RATE);
  const starts = natureTransitionSlots(
    program.plan,
    natureCrossfadeSeconds,
    new Set(
      SESSION_WORK_PROFILES.filter(
        (profile) =>
          profile.materialKind === "nature" &&
          profile.aestheticFamily === natureFamily,
      ).map(({ work }) => work.id),
    ).size,
    musicGuardSeconds,
  );
  if (!starts.length) {
    throw new SessionPlanningError(
      "NATURE_BED_UNAVAILABLE",
      "This session has no room for regularly changing ambience separate from its music transitions.",
    );
  }
  const profiles: SessionWorkProfile[] = [];
  for (let index = 0; index <= starts.length; index++) {
    profiles.push(
      selectNatureProfile(
        natureFamily,
        `${seed}|nature|${index}|${natureFamily}`,
        profiles.map(({ work }) => work.id),
      ),
    );
  }
  const peaks = profiles.slice(1).map((profile, index) => {
    const peak = estimateOverlapPeakDbtp(
      profiles[index].work,
      profile.work,
      "equal-power",
    );
    if (peak === null)
      throw new SessionPlanningError(
        "NATURE_BED_UNAVAILABLE",
        "Natural ambience peak metrics are unavailable.",
      );
    return peak;
  });
  // One stable trim across the entire lane; a shared source must not change
  // level merely because the following pair has a different peak estimate.
  const trim = Number(
    Math.min(0, ...peaks.map((peak) => -1.1 - peak)).toFixed(3),
  );
  const firstNatureIndex = program.plan.segments.length;
  const natureSegments = profiles.map((profile, index) => {
    const startFrame = index === 0 ? 0 : starts[index - 1];
    const last = index === profiles.length - 1;
    const phase =
      program.plan.phases.find(
        (phase) =>
          startFrame >= phase.startFrame && startFrame < phase.endFrame,
      )?.id ?? "arrival";
    return createNatureSegment(
      profile,
      firstNatureIndex + index,
      phase,
      startFrame,
      last ? program.plan.targetFrames : starts[index] + transitionFrames,
      trim,
      last ? natureCrossfadeSeconds : 0,
    );
  });
  const natureTransitions: AdaptiveSessionTransition[] = starts.map(
    (startFrame, index) => ({
      index: program.plan.transitions.length + index,
      lane: "nature",
      outgoingSegmentIndex: firstNatureIndex + index,
      incomingSegmentIndex: firstNatureIndex + index + 1,
      startFrame,
      endFrame: startFrame + transitionFrames,
      startSeconds: seconds(startFrame),
      endSeconds: seconds(startFrame + transitionFrames),
      durationSeconds: natureCrossfadeSeconds,
      curve: "equal-power",
      transitionClass: "natural-water",
      untrimmedPeakDbtp: peaks[index],
      transitionTrimDb: trim,
      clippingRiskDbtp: Number((peaks[index] + trim).toFixed(3)),
      ruleAudit: [
        "PROVISIONAL · user-selected natural ambience changes gradually",
        `PASS · ${natureFamily} family remains user-selected`,
        "PASS · outside every music transition",
        "PASS · no simultaneous music and nature crossfade",
        "PASS · distributed across the session; no repeated nature recording",
      ],
      reviewStatus: "PROVISIONAL — LISTENING REVIEW REQUIRED",
    }),
  );
  const segments = [
    ...program.plan.segments.map((segment) => ({
      ...segment,
      lane: segment.lane ?? ("primary" as const),
    })),
    ...natureSegments,
  ];
  const transitions = [
    ...program.plan.transitions.map((transition) => ({
      ...transition,
      lane: transition.lane ?? ("primary" as const),
    })),
    ...natureTransitions,
  ];
  const natureIdentity = JSON.stringify({
    seed,
    musicPlanId: program.plan.id,
    natureCrossfadeSeconds,
    natureFamily,
    works: natureSegments.map(({ workId }) => workId),
    transitions: natureTransitions.map(({ startFrame, endFrame }) => ({
      startFrame,
      endFrame,
    })),
  });
  const natureHash = hashSeed(natureIdentity).toString(16).padStart(8, "0");
  return {
    ...program,
    works: [...program.works, ...profiles.map(({ work }) => work)],
    fadeOutSeconds: Math.max(program.fadeOutSeconds, natureCrossfadeSeconds),
    plan: {
      ...program.plan,
      id: `${program.plan.id}-nature-${natureHash}`,
      segments,
      transitions,
      natureMix: {
        initialLevel: 0.5,
        minimumLevel: 0,
        maximumLevel: 1,
        levelStep: 0.1,
        selectedFamily: natureFamily,
        availableFamilies: ["sea", "rain"],
        headroomStrategy: "fixed-music-equal-ceiling",
        musicWorkIds: [...new Set(primary.map((s) => s.workId))],
        natureWorkIds: natureSegments.map(({ workId }) => workId),
      },
      compositeHeadroomTrimDb: COMPOSITE_HEADROOM_TRIM_DB,
      offlineReady: false,
    },
  };
}

/** Replace only nature recordings. A live family choice is not a new listening
 * run: identity, seed, music, timings and the consumer deadline stay intact. */
export function setCoordinatedNatureChoice(
  program: AdaptiveSessionProgram,
  family: NatureAmbienceFamily | null,
): AdaptiveSessionProgram {
  const mix = program.plan.natureMix;
  if (!mix) throw new Error("This session has no independent ambience lane.");
  const enabled = family !== null;
  if (
    (mix.enabled !== false) === enabled &&
    (!enabled || mix.selectedFamily === family)
  )
    return program;
  const next = family ? replaceCoordinatedNatureBed(program, family) : program;
  return {
    ...next,
    plan: { ...next.plan, natureMix: { ...next.plan.natureMix!, enabled } },
  };
}

export function replaceCoordinatedNatureBed(
  program: AdaptiveSessionProgram,
  family: NatureAmbienceFamily,
): AdaptiveSessionProgram {
  const mix = program.plan.natureMix;
  if (!mix || !mix.availableFamilies.includes(family))
    throw new Error("This session has no supported natural ambience family.");
  if (mix.selectedFamily === family) return program;
  const nature = program.plan.segments.filter((s) => s.lane === "nature");
  const available = SESSION_WORK_PROFILES.filter(
    (profile) =>
      profile.materialKind === "nature" && profile.aestheticFamily === family,
  ).length;
  if (nature.length > available) {
    const primary = program.plan.segments.filter(
      (segment) => segment.lane !== "nature",
    );
    const primaryTransitions = program.plan.transitions.filter(
      (transition) => transition.lane !== "nature",
    );
    const natureTransitions = program.plan.transitions.filter(
      (transition) => transition.lane === "nature",
    );
    const guard = primaryTransitions.length
      ? Math.max(
          0,
          Math.min(
            ...natureTransitions.flatMap((natureTransition) =>
              primaryTransitions.map((musicTransition) =>
                Math.max(
                  natureTransition.startSeconds - musicTransition.endSeconds,
                  musicTransition.startSeconds - natureTransition.endSeconds,
                ),
              ),
            ),
          ),
        )
      : 0;
    const rebuilt = attachCoordinatedNatureBed(
      {
        ...program,
        works: program.works.filter((work) =>
          primary.some((segment) => segment.workId === work.id),
        ),
        plan: {
          ...program.plan,
          natureMix: undefined,
          segments: primary,
          transitions: primaryTransitions,
        },
      },
      program.plan.seed,
      family,
      natureTransitions[0]?.durationSeconds,
      guard,
    );
    // A smaller target family needs a new nature-only schedule, never repeats.
    return {
      ...rebuilt,
      plan: {
        ...rebuilt.plan,
        id: program.plan.id,
        segments: [
          ...primary,
          ...rebuilt.plan.segments.filter(
            (segment) => segment.lane === "nature",
          ),
        ],
        transitions: [
          ...primaryTransitions,
          ...rebuilt.plan.transitions.filter(
            (transition) => transition.lane === "nature",
          ),
        ],
        natureMix: {
          ...mix,
          selectedFamily: family,
          natureWorkIds: rebuilt.plan.natureMix!.natureWorkIds,
        },
      },
    };
  }
  const profiles: SessionWorkProfile[] = [];
  for (let index = 0; index < nature.length; index++)
    profiles.push(
      selectNatureProfile(
        family,
        `${program.plan.seed}|nature|${index}|${family}`,
        profiles.map(({ work }) => work.id),
      ),
    );
  const byIndex = new Map(
    nature.map((segment, index) => [segment.index, profiles[index]]),
  );
  const peaks = new Map(
    program.plan.transitions
      .filter((t) => t.lane === "nature")
      .map((transition) => {
        const peak = estimateOverlapPeakDbtp(
          byIndex.get(transition.outgoingSegmentIndex)!.work,
          byIndex.get(transition.incomingSegmentIndex)!.work,
          transition.curve,
        );
        if (peak === null)
          throw new Error("Natural ambience peak metrics are unavailable.");
        return [transition.index, peak];
      }),
  );
  const trim = Number(
    Math.min(0, ...[...peaks.values()].map((peak) => -1.1 - peak)).toFixed(3),
  );
  const primaryIds = new Set(
    program.plan.segments
      .filter((s) => s.lane !== "nature")
      .map((s) => s.workId),
  );
  return {
    ...program,
    works: [
      ...program.works.filter((work) => primaryIds.has(work.id)),
      ...profiles.map(({ work }) => work),
    ],
    plan: {
      ...program.plan,
      segments: program.plan.segments.map((segment) => {
        const profile = byIndex.get(segment.index);
        if (!profile) return segment;
        return createNatureSegment(
          profile,
          segment.index,
          segment.phase,
          segment.startFrame,
          segment.endFrame,
          trim,
          segment.finalEnvelopeSeconds,
        );
      }),
      transitions: program.plan.transitions.map((transition) => {
        const peak = peaks.get(transition.index);
        return peak === undefined
          ? transition
          : {
              ...transition,
              untrimmedPeakDbtp: peak,
              transitionTrimDb: trim,
              clippingRiskDbtp: Number((peak + trim).toFixed(3)),
              ruleAudit: [
                "PROVISIONAL · live user-selected natural ambience",
                `PASS · ${family} family remains user-selected`,
                "PASS · unchanged music and transition timing",
              ],
            };
      }),
      natureMix: {
        ...mix,
        selectedFamily: family,
        natureWorkIds: profiles.map(({ work }) => work.id),
      },
    },
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
  if (input.cycleId) {
    const structuralCoverage = PHASE_IDS.every(
      (phase) =>
        getCyclePhaseCandidates(HATHA_AUDIO_WORKS, input.cycleId!, phase)
          .length > 0,
    );
    // MIDI functions are documented, but the edited/rotated WAVs have no
    // reviewed inter-work windows or ending contract. Never fall back to rain
    // or unrelated music when a specific cycle was requested.
    throw new SessionPlanningError(
      "CYCLE_TRANSITIONS_UNREVIEWED",
      structuralCoverage
        ? "This cycle has documented roles. Transitions on the final audio still need review. Choose an individual sound."
        : "This cycle has no complete documented structure. Choose an individual sound.",
    );
  }
  if (input.phasePolicy)
    validateIntentPhasePolicy(input.phasePolicy, input.outcome);
  const profiles = input.profiles ?? SESSION_WORK_PROFILES;
  const targetFrames = input.durationMinutes * 60 * SAMPLE_RATE;
  const crossfadeSeconds =
    input.crossfadeSeconds ??
    (input.soundKind === "music" ? MUSIC_CROSSFADE_SECONDS : 90);
  if (
    !Number.isFinite(crossfadeSeconds) ||
    crossfadeSeconds < MIN_CROSSFADE_SECONDS ||
    crossfadeSeconds > MAX_CROSSFADE_SECONDS
  ) {
    throw new Error("Crossfade duration must be between 4 and 300 seconds.");
  }
  const crossfadeFrames = Math.round(crossfadeSeconds * SAMPLE_RATE);
  const phases = buildPhases(targetFrames, input.phasePolicy);
  const selected = chooseSequence(input, profiles, (sequence) => {
    try {
      buildTimeline(
        sequence,
        phases,
        targetFrames,
        crossfadeFrames,
        input.curve ?? "equal-power",
        input.phasePolicy,
      );
      return true;
    } catch (error) {
      if (error instanceof SessionPlanningError) return false;
      throw error;
    }
  });
  const timeline = buildTimeline(
    selected,
    phases,
    targetFrames,
    crossfadeFrames,
    input.curve ?? "equal-power",
    input.phasePolicy,
  );
  const canonicalIdentity = JSON.stringify({
    seed: input.seed,
    outcome: input.outcome,
    soundKind: input.soundKind,
    durationMinutes: input.durationMinutes,
    recentWorkIds: [...(input.recentWorkIds ?? [])],
    availableWorkIds: [...(input.availableWorkIds ?? [])],
    crossfadeSeconds,
    phasePolicy: input.phasePolicy,
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
    id: `continuum-${input.outcome}-${input.soundKind}-${input.durationMinutes}-${identity}`,
    seed: input.seed,
    outcome: input.outcome,
    mode: "sound-only",
    soundKind: input.soundKind,
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
  const program: AdaptiveSessionProgram = {
    kind: "adaptive-session",
    plan,
    works: selected.map(({ work }) => work),
    fadeInSeconds: 2,
    fadeOutSeconds: crossfadeSeconds,
  };
  return input.soundKind === "music" && input.includeNatureBed !== false
    ? attachCoordinatedNatureBed(
        program,
        input.seed,
        input.natureFamily ?? "sea",
      )
    : program;
}

export function overrideTransition(
  program: AdaptiveSessionProgram,
  transitionIndex: number,
  durationSeconds: number,
  curve: AdaptiveSessionTransition["curve"],
): AdaptiveSessionProgram {
  if (
    durationSeconds < MIN_CROSSFADE_SECONDS ||
    durationSeconds > MAX_CROSSFADE_SECONDS
  ) {
    throw new Error("Workbench transition duration must be 4–300 seconds.");
  }
  const transition = program.plan.transitions[transitionIndex];
  if (!transition) throw new Error("Unknown transition.");
  const durationFrames = Math.round(durationSeconds * SAMPLE_RATE);
  const startFrame = transition.endFrame - durationFrames;
  if (startFrame <= 0) {
    throw new Error("The selected transition does not fit this session.");
  }
  const overlapsOtherLane = program.plan.transitions.some(
    (item) =>
      item.index !== transitionIndex &&
      (item.lane ?? "primary") !== (transition.lane ?? "primary") &&
      startFrame < item.endFrame &&
      transition.endFrame > item.startFrame,
  );
  if (overlapsOtherLane) {
    throw new Error(
      "This duration would overlap the music and natural ambience changes.",
    );
  }
  const segments = program.plan.segments.map((segment) => {
    if (segment.index !== transition.incomingSegmentIndex) return segment;
    const work = program.works.find(({ id }) => id === segment.workId);
    if (!work) throw new Error(`Unknown work ${segment.workId}.`);
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
    const outgoingSegment = segments.find(
      ({ index }) => index === item.outgoingSegmentIndex,
    );
    const incomingSegment = segments.find(
      ({ index }) => index === item.incomingSegmentIndex,
    );
    const outgoingWork = program.works.find(
      ({ id }) => id === outgoingSegment?.workId,
    );
    const incomingWork = program.works.find(
      ({ id }) => id === incomingSegment?.workId,
    );
    if (!outgoingWork || !incomingWork) {
      throw new Error("Transition work metadata is unavailable.");
    }
    const untrimmedPeakDbtp = estimateOverlapPeakDbtp(
      outgoingWork,
      incomingWork,
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
