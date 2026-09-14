import type { AdaptiveSessionPlan } from "./types";

/** Timeline policy, not musical approval: vary long ambience beds without
 * overlapping music changes or adding a third source in the nature lane. */
export function natureTransitionSlots(
  plan: AdaptiveSessionPlan,
  transitionSeconds: number,
  maximumRecordings = Infinity,
  musicGuardSeconds = 0,
): number[] {
  const rate = plan.sampleRateHz;
  if (!Number.isFinite(musicGuardSeconds) || musicGuardSeconds < 0) return [];
  const guard = Math.ceil(musicGuardSeconds * rate);
  const span = Math.round(transitionSeconds * rate);
  const quiet = 60 * rate;
  const targetCount = Math.max(
    1,
    Math.min(
      Math.ceil(plan.targetFrames / (10 * 60 * rate)) - 1,
      maximumRecordings - 1,
    ),
  );
  const music = plan.transitions
    .filter((t) => (t.lane ?? "primary") === "primary")
    .slice()
    .sort((a, b) => a.startFrame - b.startFrame);
  const gaps: { start: number; end: number }[] = [];
  let cursor = quiet;
  for (const change of music) {
    if (change.startFrame - guard > cursor)
      gaps.push({ start: cursor, end: change.startFrame - guard });
    cursor = Math.max(cursor, change.endFrame + guard);
  }
  gaps.push({ start: cursor, end: plan.targetFrames - quiet });

  const starts: number[] = [];
  for (let index = 1; index <= targetCount; index++) {
    const ideal = Math.round(
      (plan.targetFrames * index) / (targetCount + 1) - span / 2,
    );
    const earliest = starts.length ? starts.at(-1)! + span + quiet : quiet;
    const candidates = gaps.flatMap(({ start, end }) => {
      const low = Math.max(start, earliest);
      const high = end - span;
      return low <= high ? [Math.max(low, Math.min(high, ideal))] : [];
    });
    candidates.sort(
      (a, b) => Math.abs(a - ideal) - Math.abs(b - ideal) || a - b,
    );
    if (!candidates.length) return [];
    starts.push(candidates[0]);
  }
  return starts;
}
