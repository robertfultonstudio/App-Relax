import { SESSION_POLICIES } from "@/content/sessionPolicies";
import { SESSION_WORK_PROFILES } from "@/content/sessionWorkProfiles";
import {
  createAdaptiveSessionProgram,
  evaluatePhasePlacement,
  evaluateTransition,
} from "@/domain/sessions/continuumPlanner";
import { getNatureSessionFeasibility } from "@/domain/sessions/natureSessionFeasibility";

describe("A03 repeatable nature planning", () => {
  it("checks every published outcome, duration and family through ten restarts or rapid abandons", () => {
    let availableCombinations = 0;
    for (const policy of Object.values(SESSION_POLICIES)) {
      for (const durationMinutes of policy.durations) {
        const input = {
          outcome: policy.outcome,
          durationMinutes,
          allowProvisionalMetadata: true,
        };
        const options = getNatureSessionFeasibility(input);
        for (const option of options) {
          if (!option.available) {
            expect(option.reasonCode).not.toBeNull();
            expect(() =>
              createAdaptiveSessionProgram({
                ...input,
                natureFamily: option.natureFamily,
                mode: "sound-only",
                soundKind: "nature",
                seed: "unavailable",
              }),
            ).toThrow();
            continue;
          }
          availableCombinations += 1;
          for (const scenario of ["complete", "rapid-abandon"] as const) {
            let recentWorkIds: string[] = [];
            for (let start = 0; start < 10; start += 1) {
              const request = {
                ...input,
                natureFamily: option.natureFamily,
                mode: "sound-only" as const,
                soundKind: "nature" as const,
                seed: `${scenario}-${start}`,
                recentWorkIds,
              };
              const program = createAdaptiveSessionProgram(request);
              expect(createAdaptiveSessionProgram(request)).toEqual(program);
              expect(program.plan.targetFrames).toBe(
                durationMinutes * 60 * 48_000,
              );
              expect(
                program.plan.transitions.every(
                  (transition, index) =>
                    transition.startFrame >= 0 &&
                    (index === 0 ||
                      transition.startFrame >=
                        program.plan.transitions[index - 1].endFrame),
                ),
              ).toBe(true);
              const profiles = program.plan.segments.map((segment) => {
                const profile = SESSION_WORK_PROFILES.find(
                  ({ work }) => work.id === segment.workId,
                )!;
                expect(profile.aestheticFamily).toBe(option.natureFamily);
                expect(
                  evaluatePhasePlacement(profile, segment.phase).compatible,
                ).toBe(true);
                expect(profile.work.listeningStatus).toBe(
                  "APPROVED — LISTENING PASSED",
                );
                return profile;
              });
              expect(new Set(profiles.map(({ work }) => work.id)).size).toBe(4);
              expect(
                new Set(profiles.map(({ work }) => work.familyId)).size,
              ).toBe(4);
              expect(
                profiles
                  .slice(1)
                  .every(
                    (profile, index) =>
                      evaluateTransition(profiles[index], profile).compatible,
                  ),
              ).toBe(true);
              const heard =
                // Simulates the persistence contract; controller event tests live separately.
                scenario === "rapid-abandon"
                  ? [profiles[0].work.id]
                  : profiles.map(({ work }) => work.id);
              recentWorkIds = [...heard, ...recentWorkIds].slice(0, 12);
            }
          }
        }
      }
    }
    expect(availableCombinations).toBe(35);
  });

  it("reports only the source-backed family choices executable before the first play", () => {
    const matrix = Object.fromEntries(
      Object.values(SESSION_POLICIES).map((policy) => [
        policy.outcome,
        getNatureSessionFeasibility({
          outcome: policy.outcome,
          durationMinutes: policy.defaultDuration,
          allowProvisionalMetadata: true,
        })
          .filter(({ available }) => available)
          .map(({ natureFamily }) => natureFamily),
      ]),
    );
    expect(matrix).toEqual({
      meditation: ["sea"],
      yoga: ["sea"],
      massage: ["sea"],
      relax: ["sea", "rain"],
      sleep: ["rain"],
      focus: ["rain"],
    });
  });

  it("fails closed for Meditation ten-minute sea instead of allowing three simultaneous sources", () => {
    expect(
      getNatureSessionFeasibility({
        outcome: "meditation",
        durationMinutes: 10,
        allowProvisionalMetadata: true,
      }).find(({ natureFamily }) => natureFamily === "sea"),
    ).toEqual({
      natureFamily: "sea",
      available: false,
      reasonCode: "NO_SAFE_SEQUENCE",
    });
  });

  it("prefers a less recent safe opening even with every candidate in history", () => {
    const base = {
      outcome: "meditation" as const,
      durationMinutes: 20 as const,
      mode: "sound-only" as const,
      soundKind: "nature" as const,
      natureFamily: "sea" as const,
      seed: "all-recent",
      allowProvisionalMetadata: true,
    };
    const first = createAdaptiveSessionProgram(base);
    const recent = first.plan.segments[0].workId;
    const next = createAdaptiveSessionProgram({
      ...base,
      recentWorkIds: [recent],
    });
    expect(next.plan.segments[0].workId).not.toBe(recent);
    expect(
      createAdaptiveSessionProgram({
        ...base,
        recentWorkIds: Array(12).fill(recent),
      }),
    ).toEqual(
      createAdaptiveSessionProgram({
        ...base,
        recentWorkIds: Array(12).fill(recent),
      }),
    );
  });

  it("does not turn metadata, unsupported duration or missing delivery into available options", () => {
    expect(
      getNatureSessionFeasibility({
        outcome: "meditation",
        durationMinutes: 20,
      }).every(({ available }) => !available),
    ).toBe(true);
    expect(
      getNatureSessionFeasibility({
        outcome: "yoga",
        durationMinutes: 10,
        allowProvisionalMetadata: true,
      }).every(({ reasonCode }) => reasonCode === "UNSUPPORTED_DURATION"),
    ).toBe(true);
    expect(
      getNatureSessionFeasibility({
        outcome: "relax",
        durationMinutes: 20,
        availableWorkIds: [],
        allowProvisionalMetadata: true,
      }).every(({ available }) => !available),
    ).toBe(true);
  });
});
