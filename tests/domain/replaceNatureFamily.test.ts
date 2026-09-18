import { getConsumerWork } from "@/content/consumerCatalog";
import { createListeningNatureProgram } from "@/domain/sessions/createListeningNatureProgram";
import { replaceCoordinatedNatureBed } from "@/domain/sessions/continuumPlanner";
import { createWholeFileReviewProgram } from "@/pwa-review/createWholeFileReviewProgram";
import { auditPlanAccelerated } from "@/domain/sessions/workbench";

describe("live natural family plan replacement", () => {
  it.each([30, 45, 60] as const)(
    "preserves Hatha %i music, clock, seed and transition positions",
    (durationMinutes) => {
      const original = createWholeFileReviewProgram({
        outcome: "yoga",
        durationMinutes,
        mode: "sound-only",
        soundKind: "music",
        seed: "live-nature",
        natureFamily: "rain",
        includeNatureBed: true,
        allowProvisionalMetadata: true,
      });
      const next = replaceCoordinatedNatureBed(original, "sea");
      expect(next.plan.id).toBe(original.plan.id);
      expect(next.plan.seed).toBe(original.plan.seed);
      expect(next.plan.totalDurationSeconds).toBe(
        original.plan.totalDurationSeconds,
      );
      expect(next.plan.phases).toBe(original.plan.phases);
      for (const segment of original.plan.segments.filter(
        (s) => s.lane !== "nature",
      ))
        expect(next.plan.segments.find((s) => s.index === segment.index)).toBe(
          segment,
        );
      for (const transition of original.plan.transitions.filter(
        (t) => t.lane !== "nature",
      ))
        expect(
          next.plan.transitions.find((t) => t.index === transition.index),
        ).toBe(transition);
      expect(
        next.plan.segments.map(({ index, startFrame, endFrame }) => ({
          index,
          startFrame,
          endFrame,
        })),
      ).toEqual(
        original.plan.segments.map(({ index, startFrame, endFrame }) => ({
          index,
          startFrame,
          endFrame,
        })),
      );
      expect(
        next.plan.natureMix?.natureWorkIds.every((id) =>
          id.startsWith("field-sea"),
        ),
      ).toBe(true);
      expect(new Set(next.plan.natureMix?.natureWorkIds).size).toBe(
        next.plan.natureMix?.natureWorkIds.length,
      );
      expect(auditPlanAccelerated(next).pass).toBe(true);
      expect(replaceCoordinatedNatureBed(original, "sea")).toEqual(next);
      expect(original.plan.natureMix?.selectedFamily).toBe("rain");
    },
  );
  it("reschedules only nature for Hatha 90 when Ocean has fewer distinct recordings", () => {
    const original = createWholeFileReviewProgram({
      outcome: "yoga",
      durationMinutes: 90,
      mode: "sound-only",
      soundKind: "music",
      seed: "live-nature",
      natureFamily: "rain",
      includeNatureBed: true,
      allowProvisionalMetadata: true,
    });
    const next = replaceCoordinatedNatureBed(original, "sea");
    expect(next.plan.natureMix!.natureWorkIds.length).toBeLessThan(
      original.plan.natureMix!.natureWorkIds.length,
    );
    expect(new Set(next.plan.natureMix!.natureWorkIds).size).toBe(
      next.plan.natureMix!.natureWorkIds.length,
    );
    expect(next.plan.id).toBe(original.plan.id);
    expect(next.plan.seed).toBe(original.plan.seed);
    expect(auditPlanAccelerated(next).pass).toBe(true);
    for (const segment of original.plan.segments.filter(
      (s) => s.lane !== "nature",
    ))
      expect(next.plan.segments.find((s) => s.index === segment.index)).toBe(
        segment,
      );
    for (const transition of original.plan.transitions.filter(
      (t) => t.lane !== "nature",
    ))
      expect(
        next.plan.transitions.find((t) => t.index === transition.index),
      ).toBe(transition);
    expect(original.plan.natureMix?.selectedFamily).toBe("rain");
  });
  it("preserves a single musical loop and repeated choice is a no-op", () => {
    const original = createListeningNatureProgram(
      getConsumerWork("astral-thread")!,
      "focus",
      30,
      "rain",
    );
    expect(replaceCoordinatedNatureBed(original, "rain")).toBe(original);
    const ocean = replaceCoordinatedNatureBed(original, "sea");
    expect(ocean.plan.segments[0]).toBe(original.plan.segments[0]);
    expect(
      replaceCoordinatedNatureBed(ocean, "rain").plan.natureMix?.selectedFamily,
    ).toBe("rain");
  });
});
