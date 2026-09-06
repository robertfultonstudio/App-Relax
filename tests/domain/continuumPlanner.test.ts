import {
  createAdaptiveSessionProgram,
  evaluateTransition,
  overrideTransition,
} from "@/domain/sessions/continuumPlanner";
import {
  PROVISIONAL_MUSIC_SESSION_PAIRINGS,
  PROVISIONAL_MUSIC_SESSION_WORK_IDS,
  SESSION_WORK_PROFILES,
} from "@/content/sessionWorkProfiles";
import { SESSION_POLICIES } from "@/content/sessionPolicies";
import type { SessionWorkProfile } from "@/domain/sessions/types";

describe("Continuum constraint planner", () => {
  it("is deterministic for the same seed and inputs", () => {
    const input = {
      outcome: "meditation" as const,
      durationMinutes: 20 as const,
      mode: "sound-only" as const,
      soundKind: "nature" as const,
      seed: "qa-repeatable-001",
      allowProvisionalMetadata: true,
    };
    expect(createAdaptiveSessionProgram(input)).toEqual(
      createAdaptiveSessionProgram(input),
    );
  });

  it("builds exact, four-phase nature plans for every supported outcome and duration", () => {
    for (const policy of Object.values(SESSION_POLICIES)) {
      for (const durationMinutes of policy.durations) {
        const program = createAdaptiveSessionProgram({
          outcome: policy.outcome,
          durationMinutes,
          mode: "sound-only",
          soundKind: "nature",
          seed: `${policy.outcome}-nature-${durationMinutes}-coverage`,
          allowProvisionalMetadata: true,
        });
        const { plan } = program;
        expect(plan.soundKind).toBe("nature");
        expect(plan.targetFrames).toBe(durationMinutes * 60 * 48_000);
        expect(plan.segments.at(-1)?.endFrame).toBe(plan.targetFrames);
        expect(plan.phases.map(({ id }) => id)).toEqual([
          "arrival",
          "flow",
          "deepening",
          "return",
        ]);
        expect(new Set(plan.segments.map(({ workId }) => workId)).size).toBe(4);
        expect(plan.segments).toHaveLength(4);
        expect(plan.natureMix).toBeUndefined();
        expect(plan.transitions).toHaveLength(3);
        expect(plan.transitions[0]?.durationSeconds).toBe(90);
        expect(
          plan.transitions.every(
            ({ clippingRiskDbtp }) =>
              clippingRiskDbtp !== null && clippingRiskDbtp <= -1.1,
          ),
        ).toBe(true);
      }
    }
  });

  it("keeps a user-selected rain or ocean family while changing recordings", () => {
    for (const natureFamily of ["sea", "rain"] as const) {
      const program = createAdaptiveSessionProgram({
        outcome: "relax",
        durationMinutes: 20,
        mode: "sound-only",
        soundKind: "nature",
        natureFamily,
        seed: `selected-${natureFamily}`,
        allowProvisionalMetadata: true,
      });
      expect(program.plan.natureMix).toBeUndefined();
      expect(
        new Set(program.plan.segments.map(({ workId }) => workId)).size,
      ).toBe(4);
      expect(
        program.plan.segments.every(({ workId }) =>
          workId.startsWith(`field-${natureFamily}`),
        ),
      ).toBe(true);
    }
  });

  it("filters a natural-sounds session to the selected family", () => {
    const program = createAdaptiveSessionProgram({
      outcome: "relax",
      durationMinutes: 20,
      mode: "sound-only",
      soundKind: "nature",
      natureFamily: "rain",
      seed: "rain-only",
      allowProvisionalMetadata: true,
    });
    expect(
      program.plan.segments.every(({ workId }) =>
        workId.startsWith("field-rain"),
      ),
    ).toBe(true);
  });

  it("keeps the default natural family available for every consumer outcome", () => {
    for (const policy of Object.values(SESSION_POLICIES)) {
      const natureFamily =
        policy.outcome === "sleep" || policy.outcome === "focus"
          ? "rain"
          : "sea";
      const program = createAdaptiveSessionProgram({
        outcome: policy.outcome,
        durationMinutes: policy.defaultDuration,
        mode: "sound-only",
        soundKind: "nature",
        natureFamily,
        seed: `default-family-${policy.outcome}`,
        allowProvisionalMetadata: true,
      });
      expect(
        program.plan.segments.every(({ workId }) =>
          workId.startsWith(`field-${natureFamily}`),
        ),
      ).toBe(true);
    }
  });

  it("keeps the remaining four-work E-minor QA pool but authorizes no consumer pairing", () => {
    const musicPool = SESSION_WORK_PROFILES.filter(({ work }) =>
      PROVISIONAL_MUSIC_SESSION_WORK_IDS.has(work.id),
    );
    expect(musicPool).toHaveLength(4);
    expect(
      musicPool.every(
        (profile) =>
          profile.materialKind === "music" &&
          profile.harmonicFamily === "e-minor" &&
          profile.transitionClass === "harmonic-ambient" &&
          profile.intents.length === 6,
      ),
    ).toBe(true);
    expect(
      SESSION_WORK_PROFILES.find(
        ({ work }) => work.id === "esoteric-air-001-second-element",
      )?.materialKind,
    ).toBe("unclassified");
  });

  it("fails closed rather than substituting nature for requested music", () => {
    const naturalIds = SESSION_WORK_PROFILES.filter(
      ({ materialKind }) => materialKind === "nature",
    ).map(({ work }) => work.id);
    expect(() =>
      createAdaptiveSessionProgram({
        outcome: "relax",
        durationMinutes: 20,
        mode: "sound-only",
        soundKind: "music",
        seed: "music-no-substitute",
        availableWorkIds: naturalIds,
        allowProvisionalMetadata: true,
      }),
    ).toThrow("No user-reviewed music transition");
  });

  it("removes both rejected works and authorizes no directed music pairing", () => {
    expect(PROVISIONAL_MUSIC_SESSION_PAIRINGS).toEqual([]);
    const profile = (id: string) =>
      SESSION_WORK_PROFILES.find(({ work }) => work.id === id);
    expect(profile("eclipse-veil")).toBeUndefined();
    expect(profile("stillwater-halo")).toBeUndefined();
    expect(
      evaluateTransition(profile("cedar-current")!, profile("quiet-field")!)
        .compatible,
    ).toBe(false);
  });

  it("fails closed for music across every supported outcome and duration", () => {
    for (const policy of Object.values(SESSION_POLICIES)) {
      for (const durationMinutes of policy.durations) {
        expect(() =>
          createAdaptiveSessionProgram({
            outcome: policy.outcome,
            durationMinutes,
            mode: "sound-only",
            soundKind: "music",
            seed: `music-unavailable-${policy.outcome}-${durationMinutes}`,
            allowProvisionalMetadata: true,
          }),
        ).toThrow("No user-reviewed music transition");
      }
    }
  });

  it("varies eligible works with the seed without breaking constraints", () => {
    const first = createAdaptiveSessionProgram({
      outcome: "meditation",
      durationMinutes: 20,
      mode: "sound-only",
      soundKind: "nature",
      seed: "variation-a",
      allowProvisionalMetadata: true,
    });
    const second = createAdaptiveSessionProgram({
      outcome: "meditation",
      durationMinutes: 20,
      mode: "sound-only",
      soundKind: "nature",
      seed: "variation-b",
      allowProvisionalMetadata: true,
    });
    expect(first.plan.segments.map(({ workId }) => workId)).not.toEqual(
      second.plan.segments.map(({ workId }) => workId),
    );
  });

  it("prefers works outside recent history when a safe alternative exists", () => {
    const first = createAdaptiveSessionProgram({
      outcome: "meditation",
      durationMinutes: 20,
      mode: "sound-only",
      soundKind: "nature",
      seed: "history-first",
      allowProvisionalMetadata: true,
    });
    const recent = first.plan.segments.map(({ workId }) => workId);
    const next = createAdaptiveSessionProgram({
      outcome: "meditation",
      durationMinutes: 20,
      mode: "sound-only",
      soundKind: "nature",
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
        soundKind: "nature",
        seed: "guided",
      }),
    ).toThrow("no recorded voice");
    expect(() =>
      createAdaptiveSessionProgram({
        outcome: "yoga",
        durationMinutes: 10,
        mode: "sound-only",
        soundKind: "nature",
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
        soundKind: "nature",
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
      soundKind: "nature",
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
        soundKind: "nature",
        seed: "consumer-fail-closed",
      }),
    ).toThrow("No reviewed four-part session");
  });

  it("accepts an editorially reviewed profile set without the QA override", () => {
    const provisional = createAdaptiveSessionProgram({
      outcome: "meditation",
      durationMinutes: 20,
      mode: "sound-only",
      soundKind: "nature",
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
      soundKind: "nature",
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
      soundKind: "nature" as const,
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
