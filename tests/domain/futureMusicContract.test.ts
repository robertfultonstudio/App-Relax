import {
  createAdaptiveSessionProgram,
  evaluatePhasePlacement,
  evaluateTransition,
} from "@/domain/sessions/continuumPlanner";
import {
  getReviewedTransitionWindows,
  hasReviewedTransitionWindowPair,
} from "@/domain/sessions/transitionWindows";
import type {
  SessionIntentPhasePolicy,
  SessionWorkProfile,
} from "@/domain/sessions/types";

// Technical fixtures only: this mock neither imports nor edits the app catalogue.
jest.mock("@/content/sessionWorkProfiles", () => ({
  PROVISIONAL_MUSIC_SESSION_WORK_IDS: new Set([
    "fixture-welcome",
    "fixture-return",
  ]),
  PROVISIONAL_MUSIC_SESSION_PAIRINGS: [["fixture-welcome", "fixture-return"]],
  SESSION_WORK_PROFILES: [],
}));

function fixture(id: string): SessionWorkProfile {
  return {
    work: {
      schemaVersion: 1,
      id,
      title: id,
      familyId: id,
      sourceKind: "file",
      assetKey: id,
      sourceFilename: null,
      localPreviewFilename: null,
      noiseColor: null,
      spectralDefinition: null,
      primaryOutcome: "yoga",
      secondaryOutcomes: [],
      collectionIds: [],
      durationSeconds: 540,
      frameCount: 540 * 48_000,
      loop: true,
      sampleRateHz: 48_000,
      channels: 2,
      bitDepth: 24,
      measuredLufs: -20,
      truePeakDbtp: -6,
      playbackGainDb: 0,
      postGainTruePeakDbtp: -6,
      generatedPeakCeilingDbfs: null,
      availability: "local-preview-file",
      listeningStatus: "APPROVED — LISTENING PASSED",
      provenance: {
        packId: "APP_READY_AUDIO_01",
        manifestReference: "qa/APP_READY_AUDIO_01_MANIFEST.json",
      },
    },
    materialKind: "music",
    intents: ["yoga"],
    aestheticFamily: "cosmic",
    compatibilityGroup: "technical-fixtures",
    harmonicFamily: "e-minor",
    energyStart: 1,
    energyEnd: 1,
    density: 1,
    melodicPresence: "none",
    voiceCompatibility: "preferred",
    phaseRoles: ["arrival", "flow", "deepening", "return"],
    safeEntryPointsSeconds: [0],
    safeExitPointsSeconds: [540],
    transitionClass: "harmonic-ambient",
    offlineState: "local-development-only",
    endingPolicy: "continuous-loop",
    editorialStatus: "REVIEWED — TRANSITION RULES APPROVED",
    metadataBasis: "REVIEWED — EDITORIAL METADATA",
    continuumReadiness: "editorially-reviewed",
    transitionWindows: {
      entry: [
        {
          boundarySeconds: 0,
          startSeconds: 0,
          endSeconds: 180,
          compatibilityKey: "technical-common-window",
          includesLoopBoundary: false,
          reviewStatus: "editorially-reviewed",
        },
      ],
      exit: [
        {
          boundarySeconds: 540,
          startSeconds: 360,
          endSeconds: 540,
          compatibilityKey: "technical-common-window",
          includesLoopBoundary: false,
          reviewStatus: "editorially-reviewed",
        },
      ],
    },
  };
}

const quietYogaPolicy: SessionIntentPhasePolicy = {
  outcome: "yoga",
  reviewStatus: "editorially-reviewed",
  phases: (["arrival", "flow", "deepening", "return"] as const).map(
    (id, index) => ({
      id,
      role:
        id === "deepening"
          ? "quiet"
          : id === "flow"
            ? "gentle-movement"
            : id === "arrival"
              ? "welcome"
              : "return",
      weight: [0.16, 0.38, 0.3, 0.16][index],
      energyStart: [1, 2],
      energyEnd: [1, 2],
      density: [1, 2],
      melodicPresence: ["none", "light"],
    }),
  ),
};

describe("A13 future editorial music contracts", () => {
  it("allows declared quiet deepening without changing legacy rules or retagging a work", () => {
    const quiet = fixture("fixture-quiet");
    const before = JSON.stringify(quiet);
    expect(evaluatePhasePlacement(quiet, "deepening").compatible).toBe(false);
    expect(
      evaluatePhasePlacement(quiet, "deepening", quietYogaPolicy).compatible,
    ).toBe(true);
    expect(JSON.stringify(quiet)).toBe(before);
    expect(quiet.harmonicFamily).toBe("e-minor");
    expect(
      evaluatePhasePlacement(
        { ...quiet, continuumReadiness: "provisional-qa" },
        "deepening",
        quietYogaPolicy,
      ).compatible,
    ).toBe(false);
    expect(() =>
      evaluatePhasePlacement(quiet, "deepening", {
        ...quietYogaPolicy,
        reviewStatus: "provisional",
      }),
    ).toThrow("editorially reviewed");
  });

  it("preserves the 180-second music overlap and intent-specific reviewed weights", () => {
    const policy = {
      ...quietYogaPolicy,
      phases: quietYogaPolicy.phases.map((phase, index) => ({
        ...phase,
        weight: [0.1, 0.4, 0.4, 0.1][index],
      })),
    };
    const program = createAdaptiveSessionProgram({
      outcome: "yoga",
      durationMinutes: 20,
      mode: "sound-only",
      soundKind: "music",
      seed: "technical-window",
      includeNatureBed: false,
      profiles: [fixture("fixture-welcome"), fixture("fixture-return")],
      phasePolicy: policy,
    });
    expect(program.plan.transitions[0].durationSeconds).toBe(180);
    expect(program.plan.phases[0].endSeconds).toBe(120);
    expect(program.plan.transitions[0].ruleAudit).toContain(
      "PASS · complete reviewed pre-exit and post-entry windows",
    );
    expect(() =>
      createAdaptiveSessionProgram({
        outcome: "relax",
        durationMinutes: 20,
        mode: "sound-only",
        soundKind: "music",
        seed: "wrong-intent",
        phasePolicy: policy,
      }),
    ).toThrow("intent phase policy");
  });

  it("requires the entire reviewed 180-second interval, not a marker or matching key alone", () => {
    const outgoing = fixture("fixture-welcome");
    const incoming = fixture("fixture-return");
    expect(hasReviewedTransitionWindowPair(outgoing, incoming, 180)).toBe(true);
    for (const patch of [
      { endSeconds: 179 },
      { reviewStatus: "provisional" as const },
      { compatibilityKey: "different" },
    ]) {
      const invalid = {
        ...incoming,
        transitionWindows: {
          ...incoming.transitionWindows!,
          entry: incoming.transitionWindows!.entry.map((window) => ({
            ...window,
            ...patch,
          })),
        },
      };
      expect(evaluateTransition(outgoing, invalid).compatible).toBe(false);
    }
    expect(
      hasReviewedTransitionWindowPair(
        outgoing,
        { ...incoming, transitionWindows: undefined },
        180,
      ),
    ).toBe(false);
    expect(hasReviewedTransitionWindowPair(outgoing, incoming, 240)).toBe(
      false,
    );
    const short = {
      ...incoming,
      transitionWindows: {
        ...incoming.transitionWindows!,
        entry: [{ ...incoming.transitionWindows!.entry[0], endSeconds: 90 }],
      },
    };
    expect(hasReviewedTransitionWindowPair(outgoing, short, 90)).toBe(false);
    expect(evaluateTransition(incoming, outgoing).compatible).toBe(false);
  });

  it("requires explicit review of a full window that wraps a loop seam", () => {
    const profile = fixture("fixture-loop");
    const window = {
      ...profile.transitionWindows!.entry[0],
      boundarySeconds: 500,
      startSeconds: 500,
      endSeconds: 680,
    };
    const wrapped = {
      ...profile,
      safeEntryPointsSeconds: [500],
      transitionWindows: { ...profile.transitionWindows!, entry: [window] },
    };
    expect(
      getReviewedTransitionWindows(wrapped, "entry", 500, 180),
    ).toHaveLength(0);
    expect(
      getReviewedTransitionWindows(
        {
          ...wrapped,
          transitionWindows: {
            ...wrapped.transitionWindows,
            entry: [{ ...window, includesLoopBoundary: true }],
          },
        },
        "entry",
        500,
        180,
      ),
    ).toHaveLength(1);
  });

  it("fails at planning when selected windows are incomplete despite a declared fixture pair", () => {
    const incoming = fixture("fixture-return");
    expect(() =>
      createAdaptiveSessionProgram({
        outcome: "yoga",
        durationMinutes: 20,
        mode: "sound-only",
        soundKind: "music",
        seed: "incomplete",
        includeNatureBed: false,
        profiles: [
          fixture("fixture-welcome"),
          {
            ...incoming,
            transitionWindows: { ...incoming.transitionWindows!, entry: [] },
          },
        ],
        phasePolicy: quietYogaPolicy,
      }),
    ).toThrow("No user-reviewed music transition");
  });
});
