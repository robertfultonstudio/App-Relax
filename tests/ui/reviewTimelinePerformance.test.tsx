import { Profiler } from "react";
import { render } from "@testing-library/react-native";
import { PwaReviewTimeline } from "@/pwa-review/PwaReviewTimeline";
import { createWholeFileReviewProgram } from "@/pwa-review/createWholeFileReviewProgram";

it("profiles 90-minute timeline clock updates without issuing seeks", async () => {
  const program = createWholeFileReviewProgram({
    outcome: "yoga",
    durationMinutes: 90,
    mode: "sound-only",
    soundKind: "music",
    natureFamily: "rain",
    seed: "D115-M2-benchmark",
  });
  const samples: number[] = [];
  const joins = jest.spyOn(program.plan.transitions, "map");
  const onSeek = jest.fn(),
    onTransition = jest.fn();
  const frame = (position: number) => (
    <Profiler
      id="timeline"
      onRender={(_id, phase, ms) => {
        if (phase !== "mount") samples.push(ms);
      }}
    >
      <PwaReviewTimeline
        program={program}
        position={position}
        disabled={false}
        onSeek={onSeek}
        onTransition={onTransition}
      />
    </Profiler>
  );
  const view = await render(frame(0));
  const initialJoinRenders = joins.mock.calls.length;
  for (let i = 1; i <= 24; i++) await view.rerender(frame(i));
  expect(onSeek).not.toHaveBeenCalled();
  expect(joins).toHaveBeenCalledTimes(initialJoinRenders);
  joins.mockRestore();
  expect(view.getByLabelText("Review position").props.value).toBe(24);
  const sorted = [...samples].sort((a, b) => a - b);
  const totalMs = samples.reduce((a, b) => a + b, 0);
  const p95Ms = sorted[Math.floor(sorted.length * 0.95)] ?? 0;
  expect(samples.length).toBeGreaterThanOrEqual(24);
  expect(samples.length).toBeLessThanOrEqual(72);
  expect(totalMs).toBeLessThan(500);
  expect(p95Ms).toBeLessThan(50);
  console.log(
    "D115_TIMELINE_PROFILE",
    JSON.stringify({
      updates: 24,
      commits: samples.length,
      segments: program.plan.segments.length,
      transitions: program.plan.transitions.length,
      thresholds: { totalMs: 500, p95Ms: 50 },
      totalMs,
      p50Ms: sorted[Math.floor(sorted.length * 0.5)],
      p95Ms,
    }),
  );
});
