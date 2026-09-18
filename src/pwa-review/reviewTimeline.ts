import type { AdaptiveSessionProgram } from "@/domain/sessions/types";

export interface ReviewMarker {
  id: string;
  kind: "entry" | "exit" | "loop" | "change-start" | "change-end";
  lane: "primary" | "nature";
  seconds: number;
  segmentIndex: number;
  transitionIndex?: number;
}

/** Derived from actual frame positions, not rounded metadata or loopCount estimates. */
export function reviewMarkers(program: AdaptiveSessionProgram): ReviewMarker[] {
  const rate = program.plan.sampleRateHz;
  const markers: ReviewMarker[] = [];
  for (const segment of program.plan.segments) {
    const lane = segment.lane ?? "primary";
    const common = { lane, segmentIndex: segment.index };
    markers.push({
      ...common,
      id: `${segment.index}:entry`,
      kind: "entry",
      seconds: segment.startFrame / rate,
    });
    const work = program.works.find((w) => w.id === segment.workId);
    if (work && work.frameCount > 0) {
      const first =
        work.frameCount - (segment.sourceEntryFrame % work.frameCount);
      for (
        let offset = first;
        offset < segment.endFrame - segment.startFrame;
        offset += work.frameCount
      ) {
        markers.push({
          ...common,
          id: `${segment.index}:loop:${offset}`,
          kind: "loop",
          seconds: (segment.startFrame + offset) / rate,
        });
      }
    }
    markers.push({
      ...common,
      id: `${segment.index}:exit`,
      kind: "exit",
      seconds: segment.endFrame / rate,
    });
  }
  for (const transition of program.plan.transitions) {
    const common = {
      lane: transition.lane ?? "primary",
      transitionIndex: transition.index,
    } as const;
    markers.push({
      ...common,
      segmentIndex: transition.incomingSegmentIndex,
      id: `change:${transition.index}:start`,
      kind: "change-start",
      seconds: transition.startFrame / rate,
    });
    markers.push({
      ...common,
      segmentIndex: transition.outgoingSegmentIndex,
      id: `change:${transition.index}:end`,
      kind: "change-end",
      seconds: transition.endFrame / rate,
    });
  }
  return markers.sort(
    (a, b) => a.seconds - b.seconds || a.id.localeCompare(b.id),
  );
}

export const reviewTime = (n: number) => {
  // Round once in integer centiseconds: 10.29 must not render as 10.28
  // through binary floating point, nor 59.999 as an impossible 00:59.100.
  const centiseconds = Math.round(
    Math.max(0, Number.isFinite(n) ? n : 0) * 100,
  );
  return `${Math.floor(centiseconds / 6000)
    .toString()
    .padStart(2, "0")}:${Math.floor((centiseconds % 6000) / 100)
    .toString()
    .padStart(2, "0")}.${(centiseconds % 100).toString().padStart(2, "0")}`;
};
