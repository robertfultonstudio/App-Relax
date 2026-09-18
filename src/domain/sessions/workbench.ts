import { transitionGains } from "./equalPower";
import type {
  AdaptiveSessionPlan,
  AdaptiveSessionProgram,
  TransitionCurve,
} from "./types";

export type AuditionMode = "outgoing" | "incoming" | "both";

export interface AdaptiveAuditionOptions {
  /** Change the audition mix without seeking or restarting the sources. */
  preservePosition?: boolean;
  /** Auditioning one side need not imply repeating the window. */
  loop?: boolean;
}

export interface TransitionAudition {
  transitionIndex: number;
  startSeconds: number;
  endSeconds: number;
  loopWindowSeconds: 30 | 60;
  mode: AuditionMode;
}

export function createTransitionAudition(
  plan: AdaptiveSessionPlan,
  transitionIndex: number,
  loopWindowSeconds: 30 | 60,
  mode: AuditionMode,
): TransitionAudition {
  const transition = plan.transitions[transitionIndex];
  if (!transition) throw new Error("Unknown transition.");
  return {
    transitionIndex,
    startSeconds: Math.max(0, transition.startSeconds - loopWindowSeconds),
    endSeconds: Math.min(
      plan.totalDurationSeconds,
      transition.endSeconds + loopWindowSeconds,
    ),
    loopWindowSeconds,
    mode,
  };
}

export interface AcceleratedPlanAudit {
  pass: boolean;
  exactEnd: boolean;
  noGap: boolean;
  maxConcurrentSources: number;
  invalidTransitions: number[];
  overlappingLaneTransitions: boolean;
  inspectedIntervals: number;
}

export function auditPlanAccelerated(
  program: AdaptiveSessionProgram,
): AcceleratedPlanAudit {
  const plan = program.plan;
  let maxConcurrentSources = 0;
  let noGap = plan.segments.length > 0;
  let inspectedIntervals = 0;
  const lanes = [
    ...new Set(
      plan.segments.map((segment) => segment.lane ?? ("primary" as const)),
    ),
  ];
  const eventFrames = [
    ...new Set([
      0,
      plan.targetFrames,
      ...plan.segments.flatMap(({ startFrame, endFrame }) => [
        startFrame,
        endFrame,
      ]),
    ]),
  ].sort((left, right) => left - right);
  for (let index = 0; index < eventFrames.length - 1; index += 1) {
    const startFrame = eventFrames[index];
    const endFrame = eventFrames[index + 1];
    if (endFrame <= startFrame) continue;
    const frame = startFrame + Math.floor((endFrame - startFrame) / 2);
    const activeSegments = plan.segments.filter(
      (segment) => frame >= segment.startFrame && frame < segment.endFrame,
    );
    maxConcurrentSources = Math.max(
      maxConcurrentSources,
      activeSegments.length,
    );
    for (const lane of lanes) {
      if (
        !activeSegments.some((segment) => (segment.lane ?? "primary") === lane)
      ) {
        noGap = false;
      }
    }
    inspectedIntervals += 1;
  }
  const invalidTransitions = plan.transitions
    .filter((transition) => {
      const outgoing = plan.segments.find(
        ({ index }) => index === transition.outgoingSegmentIndex,
      );
      const incoming = plan.segments.find(
        ({ index }) => index === transition.incomingSegmentIndex,
      );
      return (
        !outgoing ||
        !incoming ||
        transition.startFrame !== incoming?.startFrame ||
        transition.endFrame !== outgoing?.endFrame ||
        transition.startFrame >= transition.endFrame ||
        transition.durationSeconds <= 0
      );
    })
    .map(({ index }) => index);
  const overlappingLaneTransitions = plan.transitions.some((left, leftIndex) =>
    plan.transitions
      .slice(leftIndex + 1)
      .some(
        (right) =>
          (left.lane ?? "primary") !== (right.lane ?? "primary") &&
          left.startFrame < right.endFrame &&
          left.endFrame > right.startFrame,
      ),
  );
  const exactEnd =
    plan.segments.length > 0 &&
    plan.segments.every(({ startFrame, endFrame }) => startFrame < endFrame) &&
    lanes.every((lane) => {
      const laneSegments = plan.segments.filter(
        (segment) => (segment.lane ?? "primary") === lane,
      );
      return (
        Math.min(...laneSegments.map(({ startFrame }) => startFrame)) === 0 &&
        Math.max(...laneSegments.map(({ endFrame }) => endFrame)) ===
          plan.targetFrames
      );
    });
  const maximumSources = plan.natureMix ? 3 : 2;
  return {
    pass:
      exactEnd &&
      noGap &&
      maxConcurrentSources <= maximumSources &&
      !invalidTransitions.length &&
      !overlappingLaneTransitions,
    exactEnd,
    noGap,
    maxConcurrentSources,
    invalidTransitions,
    overlappingLaneTransitions,
    inspectedIntervals,
  };
}

export function sampleTransitionEnergy(
  curve: TransitionCurve,
  points = 101,
): { minimum: number; maximum: number } {
  let minimum = Number.POSITIVE_INFINITY;
  let maximum = Number.NEGATIVE_INFINITY;
  for (let index = 0; index < points; index += 1) {
    const gains = transitionGains(index / (points - 1), curve);
    const energy = gains.outgoing ** 2 + gains.incoming ** 2;
    minimum = Math.min(minimum, energy);
    maximum = Math.max(maximum, energy);
  }
  return { minimum, maximum };
}
