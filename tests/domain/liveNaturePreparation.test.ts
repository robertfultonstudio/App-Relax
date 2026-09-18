import { createWholeFileReviewProgram as core } from "@/domain/sessions/createWholeFileReviewProgram";
import { createWholeFileReviewProgram as consumer } from "@/pwa-review/createWholeFileReviewProgram";
import { setCoordinatedNatureChoice } from "@/domain/sessions/continuumPlanner";
import { consumerSelectionUrl } from "@/domain/audio/consumerSelection";

it.each([30, 45, 60, 90] as const)(
  "keeps the frozen musical sequence intact with dormant nature controls (%s min)",
  (durationMinutes) => {
    const input = {
      outcome: "yoga" as const,
      mode: "sound-only" as const,
      soundKind: "music" as const,
      durationMinutes,
      seed: "live-nature",
      includeNatureBed: false,
      natureFamily: "rain" as const,
    };
    const original = core(input);
    const off = consumer(input);
    expect(off.plan.natureMix?.enabled).toBe(false);
    expect(off.plan.segments.filter((s) => s.lane !== "nature")).toEqual(
      original.plan.segments.map((s) => ({ ...s, lane: "primary" })),
    );
    expect(off.plan.transitions.filter((t) => t.lane !== "nature")).toEqual(
      original.plan.transitions.map((t) => ({ ...t, lane: "primary" })),
    );
    const on = setCoordinatedNatureChoice(off, "sea");
    expect(on.plan.id).toBe(off.plan.id);
    expect(on.plan.seed).toBe(off.plan.seed);
    expect(on.plan.compositeHeadroomTrimDb).toBe(
      off.plan.compositeHeadroomTrimDb,
    );
    expect(on.plan.segments.filter((s) => s.lane !== "nature")).toEqual(
      original.plan.segments.map((s) => ({ ...s, lane: "primary" })),
    );
    const again = setCoordinatedNatureChoice(on, null);
    expect(again.plan.id).toBe(off.plan.id);
    expect(
      consumerSelectionUrl({
        kind: "adaptive",
        program: again,
        request: input,
      }),
    ).toContain("nature=off");
    expect(setCoordinatedNatureChoice(again, null)).toBe(again);
  },
);
