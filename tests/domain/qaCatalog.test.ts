import {
  createQaPairProgram,
  QA_CATALOG,
  qaPairCompatibility,
} from "@/qa/qaCatalog";

describe("QA catalog and direct transition programs", () => {
  it("exposes the complete local catalog with honest playback states", () => {
    expect(QA_CATALOG).toHaveLength(58);
    expect(QA_CATALOG.filter(({ playable }) => playable)).toHaveLength(57);
    expect(
      QA_CATALOG.filter(({ readiness }) => readiness === "transition-ready"),
    ).toHaveLength(33);
    expect(
      QA_CATALOG.filter(({ readiness }) => readiness === "single-only"),
    ).toHaveLength(24);
    expect(
      QA_CATALOG.filter(({ readiness }) => readiness === "rejected"),
    ).toHaveLength(1);
    expect(QA_CATALOG.find(({ work }) => work.id === "soft-air")).toMatchObject(
      {
        playable: false,
        readiness: "rejected",
        work: { title: "Soft Air" },
      },
    );
    expect(QA_CATALOG.some(({ work }) => work.id === "eclipse-veil")).toBe(
      false,
    );
    expect(QA_CATALOG.some(({ work }) => work.id === "stillwater-halo")).toBe(
      false,
    );
    expect(
      QA_CATALOG.find(({ work }) => work.id === "astral-thread")?.readiness,
    ).toBe("single-only");
    expect(
      QA_CATALOG.find(({ work }) => work.id === "celestial-current")?.readiness,
    ).toBe("single-only");
  });

  it("gives every transition-ready work at least one strict compatible partner", () => {
    const transitionReady = QA_CATALOG.filter(
      ({ readiness }) => readiness === "transition-ready",
    );
    for (const outgoing of transitionReady) {
      expect(
        transitionReady.some(
          (incoming) =>
            incoming.work.id !== outgoing.work.id &&
            (qaPairCompatibility(outgoing.work.id, incoming.work.id)
              .compatible ||
              qaPairCompatibility(incoming.work.id, outgoing.work.id)
                .compatible),
        ),
      ).toBe(true);
    }
  });

  it("builds an explicitly selected QA-only slow music candidate", () => {
    const program = createQaPairProgram({
      outgoingWorkId: "distant-garden",
      incomingWorkId: "luminous-grain",
      outcome: "meditation",
      durationMinutes: 20,
      crossfadeSeconds: 180,
      curve: "equal-power",
      natureFamily: "rain",
    });
    expect(program.plan.transitions[0]).toMatchObject({
      durationSeconds: 180,
      curve: "equal-power",
    });
    expect(program.plan.transitions[0].ruleAudit).toContainEqual(
      expect.stringMatching(/^UNREVIEWED/),
    );
    expect(program.plan.natureMix).toBeDefined();
    expect(program.plan.natureMix?.selectedFamily).toBe("rain");
    expect(
      program.plan.segments
        .filter((segment) => segment.lane === "nature")
        .every(({ workId }) => workId.startsWith("field-rain")),
    ).toBe(true);
    expect(program.plan.transitions[1]).toMatchObject({
      lane: "nature",
      durationSeconds: 180,
    });
    expect(
      program.plan.transitions[0].endFrame <=
        program.plan.transitions[1].startFrame ||
        program.plan.transitions[1].endFrame <=
          program.plan.transitions[0].startFrame,
    ).toBe(true);
    expect(() =>
      createQaPairProgram({
        outgoingWorkId: "distant-garden",
        incomingWorkId: "field-sea-003-open-tide",
        outcome: "meditation",
        durationMinutes: 20,
        crossfadeSeconds: 180,
        curve: "equal-power",
      }),
    ).toThrow(/Blocked transition/);
  });

  it("builds the selected pair exactly and fails closed for an incompatible pair", () => {
    const program = createQaPairProgram({
      outgoingWorkId: "field-sea-003-open-tide",
      incomingWorkId: "field-sea-001-tidal-breath",
      outcome: "meditation",
      crossfadeSeconds: 12,
      curve: "equal-power",
    });
    expect(program.works.map(({ id }) => id)).toEqual([
      "field-sea-003-open-tide",
      "field-sea-001-tidal-breath",
    ]);
    expect(program.plan.segments).toHaveLength(2);
    expect(program.plan.transitions).toHaveLength(1);
    expect(program.plan.transitions[0]).toMatchObject({
      durationSeconds: 12,
      curve: "equal-power",
      outgoingSegmentIndex: 0,
      incomingSegmentIndex: 1,
    });
    expect(program.plan.transitions[0].clippingRiskDbtp).toBeLessThanOrEqual(
      -1.1,
    );
    const outgoingProfile = QA_CATALOG.find(
      ({ work }) => work.id === "field-sea-003-open-tide",
    )!.transitionProfile!;
    expect(
      outgoingProfile.safeExitPointsSeconds.some(
        (safeExit) =>
          Math.round(safeExit * 48_000) % outgoingProfile.work.frameCount ===
          program.plan.segments[0].sourceExitFrame,
      ),
    ).toBe(true);
    expect(program.plan.id).toContain("-10m-");
    expect(() =>
      createQaPairProgram({
        outgoingWorkId: "distant-garden",
        incomingWorkId: "field-sea-003-open-tide",
        outcome: "meditation",
        crossfadeSeconds: 12,
        curve: "equal-power",
      }),
    ).toThrow(/Blocked transition/);
  });

  it("blocks a musically compatible pair when no safe exit fits the chosen QA window", () => {
    expect(
      qaPairCompatibility("distant-garden", "luminous-grain").compatible,
    ).toBe(true);
    const readiness = qaPairCompatibility("distant-garden", "luminous-grain", {
      durationMinutes: 10,
      crossfadeSeconds: 12,
    });
    expect(readiness.compatible).toBe(false);
    expect(readiness.audit).toContainEqual(
      expect.stringMatching(/^BLOCK · 10 minute QA window/),
    );
  });
});
