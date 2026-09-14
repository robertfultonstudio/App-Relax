import { createListeningNatureProgram } from "@/pwa-review/createListeningNatureProgram";
import { getConsumerWork } from "@/content/consumerCatalog";
import { natureTransitionSlots } from "@/domain/sessions/natureTransitionSlots";
import { attachCoordinatedNatureBed } from "@/domain/sessions/continuumPlanner";
import { auditPlanAccelerated } from "@/domain/sessions/workbench";

it.each([10, 20, 30, 45, 60, 90] as const)(
  "varies nature throughout %i minutes without repeats or additional simultaneous decks",
  (minutes) => {
    for (const family of ["sea", "rain"] as const) {
      const create = () =>
        createListeningNatureProgram(
          getConsumerWork("astral-thread")!,
          "focus",
          minutes,
          family,
        );
      const program = create();
      expect(program).toEqual(create());
      const nature = program.plan.segments.filter((s) => s.lane === "nature");
      // The approved sea family has seven actual recordings, not nine.
      const count = Math.min(
        family === "sea" ? 7 : 11,
        Math.max(2, Math.ceil(minutes / 10)),
      );
      expect(nature).toHaveLength(count);
      expect(new Set(nature.map((s) => s.workId)).size).toBe(count);
      expect(nature.every((s) => s.workId.startsWith(`field-${family}`))).toBe(
        true,
      );
      expect(
        nature.every((s) => s.endSeconds - s.startSeconds <= 16 * 60),
      ).toBe(true);
      expect(new Set(nature.map((s) => s.playbackTrimDb)).size).toBe(1);
      expect(auditPlanAccelerated(program)).toMatchObject({
        pass: true,
        maxConcurrentSources: 3,
        overlappingLaneTransitions: false,
      });
      for (let i = 1; i < nature.length - 1; i++)
        expect(
          nature[i + 1].startSeconds - nature[i - 1].endSeconds,
        ).toBeGreaterThanOrEqual(60);
      expect(
        program.plan.transitions.every(
          (t) => t.clippingRiskDbtp !== null && t.clippingRiskDbtp <= -1.099,
        ),
      ).toBe(true);
    }
  },
);

it("fails closed when music occupies every possible nature transition window", () => {
  const program = createListeningNatureProgram(
    getConsumerWork("astral-thread")!,
    "focus",
    20,
    "rain",
  );
  const blocked = {
    ...program,
    plan: {
      ...program.plan,
      transitions: [
        {
          ...program.plan.transitions[0],
          lane: "primary" as const,
          startFrame: 0,
          endFrame: program.plan.targetFrames,
        },
      ],
    },
  };
  expect(natureTransitionSlots(blocked.plan, 180)).toEqual([]);
  expect(() => attachCoordinatedNatureBed(blocked, "blocked", "rain")).toThrow(
    /no room/,
  );
});

it.each([NaN, Infinity, -1, 301])("rejects invalid nature fade %s", (fade) => {
  const program = createListeningNatureProgram(
    getConsumerWork("astral-thread")!,
    "focus",
    20,
    "rain",
  );
  expect(() =>
    attachCoordinatedNatureBed(program, "invalid", "rain", fade),
  ).toThrow(/between/);
});
