import { transitionGains } from "./equalPower";
import type {
  AdaptiveSessionPlan,
  AdaptiveSessionProgram,
  TransitionCurve,
} from "./types";

export type AuditionMode = "outgoing" | "incoming" | "both";

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
  inspectedIntervals: number;
}

export function auditPlanAccelerated(
  program: AdaptiveSessionProgram,
): AcceleratedPlanAudit {
  const plan = program.plan;
  let maxConcurrentSources = 0;
  let noGap = true;
  let inspectedIntervals = 0;
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
    const active = plan.segments.filter(
      (segment) => frame >= segment.startFrame && frame < segment.endFrame,
    ).length;
    maxConcurrentSources = Math.max(maxConcurrentSources, active);
    if (active === 0) noGap = false;
    inspectedIntervals += 1;
  }
  const invalidTransitions = plan.transitions
    .filter((transition) => {
      const outgoing = plan.segments[transition.outgoingSegmentIndex];
      const incoming = plan.segments[transition.incomingSegmentIndex];
      return (
        transition.startFrame !== incoming.startFrame ||
        transition.endFrame !== outgoing.endFrame ||
        transition.startFrame >= transition.endFrame ||
        transition.durationSeconds <= 0
      );
    })
    .map(({ index }) => index);
  const exactEnd =
    plan.segments[0]?.startFrame === 0 &&
    plan.segments.at(-1)?.endFrame === plan.targetFrames &&
    plan.segments.every(({ startFrame, endFrame }) => startFrame < endFrame);
  return {
    pass:
      exactEnd &&
      noGap &&
      maxConcurrentSources <= 2 &&
      !invalidTransitions.length,
    exactEnd,
    noGap,
    maxConcurrentSources,
    invalidTransitions,
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
