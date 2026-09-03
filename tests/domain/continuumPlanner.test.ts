import {
  createAdaptiveSessionProgram,
  evaluateTransition,
  overrideTransition,
} from "@/domain/sessions/continuumPlanner";
import { SESSION_WORK_PROFILES } from "@/content/sessionWorkProfiles";
import { SESSION_POLICIES } from "@/content/sessionPolicies";
import type { SessionWorkProfile } from "@/domain/sessions/types";

describe("Continuum constraint planner", () => {
  it("is deterministic for the same seed and inputs", () => {
    const input = {
      outcome: "meditation" as const,
      durationMinutes: 20 as const,
      mode: "sound-only" as const,
      seed: "qa-repeatable-001",
      allowProvisionalMetadata: true,
    };
    expect(createAdaptiveSessionProgram(input)).toEqual(
      createAdaptiveSessionProgram(input),
    );
  });

  it("builds exact, four-phase plans for every supported outcome and duration", () => {
    for (const policy of Object.values(SESSION_POLICIES)) {
      for (const durationMinutes of policy.durations) {
        const { plan } = createAdaptiveSessionProgram({
          outcome: policy.outcome,
          durationMinutes,
          mode: "sound-only",
          seed: `${policy.outcome}-${durationMinutes}-coverage`,
          allowProvisionalMetadata: true,
        });
        expect(plan.targetFrames).toBe(durationMinutes * 60 * 48_000);
        expect(plan.segments.at(-1)?.endFrame).toBe(plan.targetFrames);
        expect(plan.phases.map(({ id }) => id)).toEqual([
          "arrival",
          "flow",
          "deepening",
          "return",
        ]);
        expect(new Set(plan.segments.map(({ workId }) => workId)).size).toBe(4);
        expect(plan.transitions).toHaveLength(3);
        expect(
          plan.transitions.every(
            ({ clippingRiskDbtp }) =>
              clippingRiskDbtp !== null && clippingRiskDbtp <= -1.1,
          ),
        ).toBe(true);
      }
    }
  });

  it("varies eligible works with the seed without breaking constraints", () => {
    const first = createAdaptiveSessionProgram({
      outcome: "meditation",
      durationMinutes: 20,
      mode: "sound-only",
      seed: "variation-a",
      allowProvisionalMetadata: true,
    });
    const second = createAdaptiveSessionProgram({
      outcome: "meditation",
      durationMinutes: 20,
      mode: "sound-only",
      seed: "variation-b",
      allowProvisionalMetadata: true,
    });
    expect(first.plan.segments.map(({ workId }) => workId)).not.toEqual(
      second.plan.segments.map(({ workId }) => workId),
    );
  });

  it("applies the recent-session exclusion window", () => {
    const first = createAdaptiveSessionProgram({
      outcome: "meditation",
      durationMinutes: 20,
      mode: "sound-only",
      seed: "history-first",
      allowProvisionalMetadata: true,
    });
    const recent = first.plan.segments.map(({ workId }) => workId);
    const next = createAdaptiveSessionProgram({
      outcome: "meditation",
      durationMinutes: 20,
      mode: "sound-only",
      seed: "history-next",
      recentWorkIds: recent,
      allowProvisionalMetadata: true,
    });
    expect(
      next.plan.segments.every(({ workId }) => !recent.includes(workId)),
    ).toBe(true);
  });

  it("requires every harmonic, timbral, energy and marker rule", () => {
    const outgoing = SESSION_WORK_PROFILES[0];
    const incoming: SessionWorkProfile = {
      ...SESSION_WORK_PROFILES[1],
      harmonicFamily: outgoing.harmonicFamily,
      transitionClass: outgoing.transitionClass,
      compatibilityGroup: "different-curated-group",
    };
    const result = evaluateTransition(outgoing, incoming);
    expect(result.compatible).toBe(false);
    expect(result.audit).toContain(
      `BLOCK · curated compatibility group ${outgoing.compatibilityGroup}`,
    );
  });

  it("fails closed for Guided and unsupported durations", () => {
    expect(() =>
      createAdaptiveSessionProgram({
        outcome: "meditation",
        durationMinutes: 20,
        mode: "guided",
        seed: "guided",
      }),
    ).toThrow("no recorded voice");
    expect(() =>
      createAdaptiveSessionProgram({
        outcome: "yoga",
        durationMinutes: 10,
        mode: "sound-only",
        seed: "unsupported",
      }),
    ).toThrow("not offered");
  });

  it("fails instead of inventing a sequence when too few works are available", () => {
    expect(() =>
      createAdaptiveSessionProgram({
        outcome: "meditation",
        durationMinutes: 20,
        mode: "sound-only",
        seed: "too-few",
        allowProvisionalMetadata: true,
        availableWorkIds: SESSION_WORK_PROFILES.slice(0, 3).map(
          ({ work }) => work.id,
        ),
      }),
    ).toThrow("No reviewed four-part session");
  });

  it("recomputes a QA override and preserves conservative headroom", () => {
    const base = createAdaptiveSessionProgram({
      outcome: "meditation",
      durationMinutes: 20,
      mode: "sound-only",
      seed: "override",
      allowProvisionalMetadata: true,
    });
    const variant = overrideTransition(base, 0, 20, "linear");
    expect(variant.plan.id).toContain("-t0-20-linear");
    expect(variant.plan.transitions[0]).toMatchObject({
      durationSeconds: 20,
      curve: "linear",
    });
    expect(variant.plan.transitions[0].clippingRiskDbtp).toBeLessThanOrEqual(
      -1.1,
    );
  });

  it("keeps inferred musical metadata out of consumer-ready planning", () => {
    expect(() =>
      createAdaptiveSessionProgram({
        outcome: "meditation",
        durationMinutes: 20,
        mode: "sound-only",
        seed: "consumer-fail-closed",
      }),
    ).toThrow("No reviewed four-part session");
  });

  it("accepts an editorially reviewed profile set without the QA override", () => {
    const provisional = createAdaptiveSessionProgram({
      outcome: "meditation",
      durationMinutes: 20,
      mode: "sound-only",
      seed: "reviewed-fixture-source",
      allowProvisionalMetadata: true,
    });
    const selectedIds = new Set(
      provisional.plan.segments.map(({ workId }) => workId),
    );
    const reviewedProfiles = SESSION_WORK_PROFILES.filter(({ work }) =>
      selectedIds.has(work.id),
    ).map((profile): SessionWorkProfile => ({
      ...profile,
      editorialStatus: "REVIEWED — TRANSITION RULES APPROVED",
      metadataBasis: "REVIEWED — EDITORIAL METADATA",
      continuumReadiness: "editorially-reviewed",
    }));
    const reviewed = createAdaptiveSessionProgram({
      outcome: "meditation",
      durationMinutes: 20,
      mode: "sound-only",
      seed: "reviewed-fixture-source",
      profiles: reviewedProfiles,
    });
    expect(reviewed.plan.metadataReviewStatus).toBe(
      "REVIEWED — EDITORIAL METADATA",
    );
    expect(
      reviewed.plan.transitions.every(({ ruleAudit }) =>
        ruleAudit.every((entry) => entry.startsWith("PASS")),
      ),
    ).toBe(true);
  });

  it("uses phase-specific rules and distinct plan identities", () => {
    const base = {
      outcome: "meditation" as const,
      durationMinutes: 20 as const,
      mode: "sound-only" as const,
      seed: "identity",
      allowProvisionalMetadata: true,
    };
    const equalPower = createAdaptiveSessionProgram(base);
    const linear = createAdaptiveSessionProgram({ ...base, curve: "linear" });
    expect(equalPower.plan.id).not.toBe(linear.plan.id);
    expect(
      equalPower.plan.segments.every(({ phaseRuleAudit }) =>
        phaseRuleAudit.every((entry) => !entry.startsWith("BLOCK")),
      ),
    ).toBe(true);
    expect(equalPower.plan.metadataReviewStatus).toBe("PROVISIONAL — QA ONLY");
  });
});
