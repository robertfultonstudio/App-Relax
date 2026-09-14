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
  const safe = Math.max(0, n);
  return `${Math.floor(safe / 60)
    .toString()
    .padStart(2, "0")}:${Math.floor(safe % 60)
    .toString()
    .padStart(2, "0")}.${Math.floor((safe % 1) * 100)
    .toString()
    .padStart(2, "0")}`;
};
