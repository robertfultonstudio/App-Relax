import type { SessionWorkProfile, SourceTransitionWindow } from "./types";

export const MUSIC_CROSSFADE_SECONDS = 180;
const SAMPLE_RATE = 48_000;
const frame = (seconds: number) => Math.round(seconds * SAMPLE_RATE);

/** This only checks declared coverage. It never approves a musical pairing. */
export function getReviewedTransitionWindows(
  profile: SessionWorkProfile,
  direction: "entry" | "exit",
  boundarySeconds: number,
  durationSeconds: number,
): readonly SourceTransitionWindow[] {
  if (profile.continuumReadiness !== "editorially-reviewed") return [];
  const markers =
    direction === "entry"
      ? profile.safeEntryPointsSeconds
      : profile.safeExitPointsSeconds;
  if (
    !Number.isFinite(durationSeconds) ||
    durationSeconds <= 0 ||
    !markers.some((point) => frame(point) === frame(boundarySeconds))
  )
    return [];
  const duration = profile.work.durationSeconds;
  const requiredDuration = Math.max(
    durationSeconds,
    profile.materialKind === "music" ? MUSIC_CROSSFADE_SECONDS : 0,
  );
  const requiredStart =
    direction === "exit" ? boundarySeconds - requiredDuration : boundarySeconds;
  const requiredEnd =
    direction === "entry"
      ? boundarySeconds + requiredDuration
      : boundarySeconds;
  return (profile.transitionWindows?.[direction] ?? []).filter((window) => {
    const crossesLoop = window.startSeconds < 0 || window.endSeconds > duration;
    return (
      window.reviewStatus === "editorially-reviewed" &&
      window.compatibilityKey.trim().length > 0 &&
      [window.boundarySeconds, window.startSeconds, window.endSeconds].every(
        Number.isFinite,
      ) &&
      frame(window.boundarySeconds) === frame(boundarySeconds) &&
      window.boundarySeconds >= 0 &&
      window.boundarySeconds <= duration &&
      window.startSeconds < window.endSeconds &&
      frame(window.startSeconds) <= frame(requiredStart) &&
      frame(window.endSeconds) >= frame(requiredEnd) &&
      (!crossesLoop || window.includesLoopBoundary)
    );
  });
}

export function hasReviewedTransitionWindowPair(
  outgoing: SessionWorkProfile,
  incoming: SessionWorkProfile,
  durationSeconds: number,
  outgoingBoundarySeconds?: number,
  incomingBoundarySeconds?: number,
): boolean {
  if (!outgoing.transitionWindows && !incoming.transitionWindows) return true;
  const exits =
    outgoingBoundarySeconds === undefined
      ? outgoing.safeExitPointsSeconds
      : [outgoingBoundarySeconds];
  const entries =
    incomingBoundarySeconds === undefined
      ? incoming.safeEntryPointsSeconds
      : [incomingBoundarySeconds];
  return exits.some((exit) =>
    entries.some((entry) => {
      const outgoingWindows = getReviewedTransitionWindows(
        outgoing,
        "exit",
        exit,
        durationSeconds,
      );
      const incomingWindows = getReviewedTransitionWindows(
        incoming,
        "entry",
        entry,
        durationSeconds,
      );
      return outgoingWindows.some((left) =>
        incomingWindows.some(
          (right) => left.compatibilityKey === right.compatibilityKey,
        ),
      );
    }),
  );
}
