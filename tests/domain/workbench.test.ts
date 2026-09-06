import { createAdaptiveSessionProgram } from "@/domain/sessions/continuumPlanner";
import {
  auditPlanAccelerated,
  createTransitionAudition,
} from "@/domain/sessions/workbench";

describe("Adaptive QA workbench model", () => {
  const program = createAdaptiveSessionProgram({
    outcome: "meditation",
    durationMinutes: 90,
    mode: "sound-only",
    soundKind: "nature",
    seed: "ninety-minute-nrt",
    allowProvisionalMetadata: true,
  });

  it("creates bounded transition audition windows", () => {
    const audition = createTransitionAudition(program.plan, 0, 60, "both");
    expect(audition.startSeconds).toBeGreaterThanOrEqual(0);
    expect(audition.endSeconds).toBeLessThanOrEqual(90 * 60);
    expect(audition.endSeconds).toBeGreaterThan(
      program.plan.transitions[0].endSeconds,
    );
  });

  it("audits a 90-minute plan without rendering or real-time waiting", () => {
    expect(auditPlanAccelerated(program)).toEqual(
      expect.objectContaining({
        pass: true,
        exactEnd: true,
        noGap: true,
        maxConcurrentSources: 2,
        invalidTransitions: [],
        inspectedIntervals: 7,
      }),
    );
  });

  it("detects a sub-second gap without interval sampling blind spots", () => {
    const transitionEnd = program.plan.transitions[0].endFrame;
    const broken = {
      ...program,
      plan: {
        ...program.plan,
        segments: program.plan.segments.map((segment, index) =>
          index === 1
            ? {
                ...segment,
                startFrame: transitionEnd + 100,
                startSeconds: (transitionEnd + 100) / 48_000,
              }
            : segment,
        ),
      },
    };
    expect(auditPlanAccelerated(broken)).toEqual(
      expect.objectContaining({ pass: false, noGap: false }),
    );
  });

  it("fails closed for an empty plan instead of passing vacuous lane checks", () => {
    expect(
      auditPlanAccelerated({
        ...program,
        plan: { ...program.plan, segments: [], transitions: [] },
      }),
    ).toMatchObject({ pass: false, exactEnd: false, noGap: false });
  });
});
