import { createWholeFileReviewProgram } from "@/pwa-review/createWholeFileReviewProgram";
import { createAdaptiveSessionProgram } from "@/domain/sessions/continuumPlanner";
import { auditPlanAccelerated } from "@/domain/sessions/workbench";
import { HATHA_AUDIO_WORKS } from "@/content/hathaCatalog";
import { reviewMarkers } from "@/pwa-review/reviewTimeline";

const input = {
  outcome: "yoga" as const,
  mode: "sound-only" as const,
  soundKind: "music" as const,
  seed: "review-01",
  allowProvisionalMetadata: true,
};
describe("private whole-file cycle sessions", () => {
  it.each([30, 45, 60] as const)(
    "plays multiple whole files for exactly %i minutes",
    (durationMinutes) => {
      const program = createWholeFileReviewProgram({
        ...input,
        durationMinutes,
      });
      expect(auditPlanAccelerated(program).pass).toBe(true);
      expect(program.plan.segments.length).toBeGreaterThanOrEqual(4);
      expect(new Set(program.plan.segments.map((s) => s.workId)).size).toBe(
        program.plan.segments.length,
      );
      expect(
        program.plan.segments.every(
          (s, i) =>
            s.sourceEntryFrame === 0 &&
            s.endFrame - s.startFrame === program.works[i].frameCount &&
            s.loopCount === 0,
        ),
      ).toBe(true);
      expect(program.plan.segments.at(-1)!.endFrame).toBe(
        durationMinutes * 60 * 48000,
      );
      expect(
        program.plan.transitions.every(
          (t) =>
            t.durationSeconds >= 60 &&
            t.durationSeconds <= 300 &&
            t.clippingRiskDbtp! < -1,
        ),
      ).toBe(true);
      expect(program.works.map((w) => w.cycle!.structuralOrder)).toEqual(
        [...program.works.map((w) => w.cycle!.structuralOrder)].sort(
          (a, b) => a - b,
        ),
      );
      expect(program.plan.phases.map((p) => p.id)).toEqual([
        "arrival",
        "flow",
        "deepening",
        "return",
      ]);
      expect(program.plan.endingStrategy).toBe(
        "source-file-boundary-review-only",
      );
      expect(program.plan.metadataReviewStatus).toBe("PROVISIONAL — QA ONLY");
    },
  );
  it("is reproducible and prefers less recent material without shuffling cycle order", () => {
    const first = createWholeFileReviewProgram({
      ...input,
      durationMinutes: 30,
    });
    expect(
      createWholeFileReviewProgram({ ...input, durationMinutes: 30 }),
    ).toEqual(first);
    const recent = first.works.map((w) => w.id);
    const second = createWholeFileReviewProgram({
      ...input,
      durationMinutes: 30,
      recentWorkIds: recent,
    });
    expect(
      second.works.filter((w) => recent.includes(w.id)).length,
    ).toBeLessThan(first.works.length);
  });
  it.each([20] as const)(
    "fails at %i instead of cutting, looping or inventing a sequence",
    (durationMinutes) => {
      expect(() =>
        createWholeFileReviewProgram({ ...input, durationMinutes }),
      ).toThrow("30, 45, 60 or 90");
    },
  );
  it.each([undefined, "rain", "sea"] as const)(
    "builds an exact 90-minute extended-loop review with %s ambience",
    (natureFamily) => {
      for (const seed of ["review-90-a", "review-90-b", "review-90-c"]) {
        const request = {
          ...input,
          seed,
          durationMinutes: 90 as const,
          natureFamily,
          includeNatureBed: Boolean(natureFamily),
        };
        const program = createWholeFileReviewProgram(request);
        expect(createWholeFileReviewProgram(request)).toEqual(program);
        expect(auditPlanAccelerated(program).pass).toBe(true);
        expect(program.plan.targetFrames).toBe(259200000);
        expect(program.plan.totalDurationSeconds).toBe(5400);
        expect(program.plan.endingStrategy).toBe(
          "extended-loop-boundary-review-only",
        );
        const music = program.plan.segments.filter(
          (s) => (s.lane ?? "primary") === "primary",
        );
        expect(music.map((s) => s.workId)).toEqual(
          HATHA_AUDIO_WORKS.map((w) => w.id),
        );
        expect(music.at(-1)!.endFrame).toBe(program.plan.targetFrames);
        expect(
          music.filter((s) => s.loopCount === 1).map((s) => s.phase),
        ).toEqual(["flow", "deepening"]);
        for (const [index, segment] of music.entries()) {
          const source = HATHA_AUDIO_WORKS[index];
          expect(segment.endFrame - segment.startFrame).toBe(
            source.frameCount * (1 + segment.loopCount),
          );
          expect(segment.sourceEntryFrame).toBe(0);
          expect(segment.sourceExitFrame).toBe(source.frameCount);
        }
        const loops = reviewMarkers(program).filter(
          (m) => m.lane === "primary" && m.kind === "loop",
        );
        expect(loops).toHaveLength(2);
        for (const point of loops) {
          const segment = music[point.segmentIndex];
          expect(point.seconds).toBe(
            segment.startSeconds +
              HATHA_AUDIO_WORKS[point.segmentIndex].durationSeconds,
          );
          expect(point.seconds).toBeLessThan(segment.endSeconds);
        }
        expect(
          program.plan.transitions.filter(
            (t) => (t.lane ?? "primary") === "primary",
          ),
        ).toHaveLength(7);
        expect(
          program.plan.transitions.every(
            (t) =>
              t.durationSeconds >= 60 &&
              t.durationSeconds <= 300 &&
              t.clippingRiskDbtp! < -1,
          ),
        ).toBe(true);
        expect(program.plan.offlineReady).toBe(false);
      }
    },
  );
  it("does not relax the production planner or fake Guided/offline", () => {
    expect(() =>
      createAdaptiveSessionProgram({
        ...input,
        durationMinutes: 30,
        cycleId: "respiro-hatha-1",
      }),
    ).toThrow();
    expect(() =>
      createWholeFileReviewProgram({
        ...input,
        durationMinutes: 30,
        mode: "guided",
      }),
    ).toThrow("Guided");
    expect(
      createWholeFileReviewProgram({ ...input, durationMinutes: 30 }).plan
        .offlineReady,
    ).toBe(false);
    expect(() =>
      createWholeFileReviewProgram({
        ...input,
        durationMinutes: 30,
        availableWorkIds: [],
      }),
    ).toThrow();
  });
});
