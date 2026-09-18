import { createListeningNatureProgram } from "@/pwa-review/createListeningNatureProgram";
import { createWholeFileReviewProgram } from "@/domain/sessions/createWholeFileReviewProgram";
import { reviewMarkers, reviewTime } from "@/pwa-review/reviewTimeline";
import { getConsumerWork } from "@/content/consumerCatalog";
import { soundFamilyFor } from "@/content/soundFamilies";
import { auditPlanAccelerated } from "@/domain/sessions/workbench";
import { consumerSelectionUrl } from "@/domain/audio/consumerSelection";
import { parseSavedSessionRequest } from "@/state/adaptiveSessionPersistence";

it("formats deterministic precise review points without floating-point truncation", () => {
  expect(reviewTime(10.29)).toBe("00:10.29");
  expect(reviewTime(59.999)).toBe("01:00.00");
  expect(reviewTime(404.25)).toBe("06:44.25");
  expect(reviewTime(Number.NaN)).toBe("00:00.00");
});

it.each(["rain", "sea"] as const)(
  "keeps one music recording, adds only %s, and maps every real loop",
  (family) => {
    const work = getConsumerWork("astral-thread")!;
    const p = createListeningNatureProgram(work, "focus", 30, family);
    expect(auditPlanAccelerated(p)).toEqual(
      expect.objectContaining({
        pass: true,
        maxConcurrentSources: 3,
        overlappingLaneTransitions: false,
      }),
    );
    expect(p.plan.segments.filter((s) => s.lane === "primary")).toHaveLength(1);
    expect(p.plan.transitions.every((t) => t.lane === "nature")).toBe(true);
    expect(
      p.works
        .filter((w) => w.id !== work.id)
        .every((w) => soundFamilyFor(w) === family),
    ).toBe(true);
    const loops = reviewMarkers(p).filter(
      (m) => m.segmentIndex === 0 && m.kind === "loop",
    );
    expect(loops.map((m) => m.seconds)).toEqual(
      Array.from(
        { length: Math.floor((30 * 60 * 48000 - 1) / work.frameCount) },
        (_, i) => ((i + 1) * work.frameCount) / 48000,
      ),
    );
    expect(
      consumerSelectionUrl({
        kind: "adaptive",
        program: p,
        request: {
          outcome: "focus",
          durationMinutes: 30,
          soundKind: "music",
          mode: "sound-only",
          natureFamily: family,
        },
      }),
    ).toBe(`/listen/astral-thread?outcome=focus&duration=30&nature=${family}`);
  },
);

it.each([30, 45, 60] as const)(
  "keeps Hatha %i intact with nature outside every music join",
  (duration) => {
    for (const family of ["sea", "rain"] as const) {
      for (let i = 0; i < 12; i++) {
        const input = {
          outcome: "yoga" as const,
          soundKind: "music" as const,
          mode: "sound-only" as const,
          durationMinutes: duration,
          seed: `review-${i}`,
        };
        const dry = createWholeFileReviewProgram(input);
        const wet = createWholeFileReviewProgram({
          ...input,
          natureFamily: family,
          includeNatureBed: true,
        });
        expect(auditPlanAccelerated(wet).pass).toBe(true);
        const natureCount = Math.max(2, Math.ceil(duration / 10));
        expect(wet.works).toHaveLength(dry.works.length + natureCount);
        const nature = wet.plan.segments.filter((s) => s.lane === "nature");
        expect(nature).toHaveLength(natureCount);
        expect(new Set(nature.map((s) => s.workId)).size).toBe(natureCount);
        expect(nature[0].startFrame).toBe(0);
        expect(nature.at(-1)!.endFrame).toBe(wet.plan.targetFrames);
        // No hour-long programme may fall back to one early ambience change.
        expect(
          nature.every((s) => s.endSeconds - s.startSeconds <= 16 * 60),
        ).toBe(true);
        expect(wet.plan.natureMix?.musicWorkIds).toEqual(
          dry.works.map((w) => w.id),
        );
        expect(
          wet.plan.segments
            .filter((s) => s.lane === "primary")
            .map(({ lane: _lane, ...s }) => s),
        ).toEqual(dry.plan.segments);
        const markers = reviewMarkers(wet);
        expect(markers.filter((m) => m.kind === "change-start")).toHaveLength(
          wet.plan.transitions.length,
        );
        expect(markers.filter((m) => m.kind === "change-end")).toHaveLength(
          wet.plan.transitions.length,
        );
        expect(
          markers.filter((m) => m.kind === "loop" && m.lane === "primary"),
        ).toHaveLength(0);
        expect(
          markers.every((m) => m.seconds >= 0 && m.seconds <= duration * 60),
        ).toBe(true);
      }
    }
  },
);
it("fails closed for an extra nature layer over a nonmusical work", () => {
  expect(() =>
    createListeningNatureProgram(
      getConsumerWork("field-sea-003-open-tide")!,
      "relax",
      30,
      "rain",
    ),
  ).toThrow(/musical recording only/);
});
it("restores the same music plus chosen ambience from the saved request, not a new playlist", () => {
  const request = parseSavedSessionRequest({
    outcome: "focus",
    durationMinutes: 30,
    mode: "sound-only",
    soundKind: "music",
    natureFamily: "rain",
    listeningWorkId: "astral-thread",
    includeNatureBed: true,
  })!;
  const restored = createWholeFileReviewProgram({
    ...request,
    seed: "new-history-seed",
  });
  expect(restored.plan.listeningWorkId).toBe("astral-thread");
  expect(restored.plan.natureMix?.selectedFamily).toBe("rain");
  expect(restored).toEqual(
    createListeningNatureProgram(
      getConsumerWork("astral-thread")!,
      "focus",
      30,
      "rain",
    ),
  );
});
