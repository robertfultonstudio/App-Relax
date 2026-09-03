import {
  CONSUMER_AUDIO_WORKS,
  getEmbeddedWorksForOutcome,
  getPlayableWorksForOutcome,
  getWorksForOutcome,
  isPlayableWorkOnWeb,
} from "@/content/consumerCatalog";
import { CONSUMER_OUTCOMES } from "@/content/productShell";
import {
  createSingleTrackProgram,
  dbToLinear,
} from "@/domain/audio/consumerTypes";

describe("M4 autonomous consumer catalog", () => {
  it("registers 42 file works and 8 autonomous noise generators", () => {
    expect(CONSUMER_AUDIO_WORKS).toHaveLength(50);
    expect(new Set(CONSUMER_AUDIO_WORKS.map((work) => work.id)).size).toBe(50);
    expect(
      new Set(CONSUMER_AUDIO_WORKS.map((work) => work.assetKey)).size,
    ).toBe(50);
    expect(
      CONSUMER_AUDIO_WORKS.every(
        (work) => createSingleTrackProgram(work).kind === "single-track",
      ),
    ).toBe(true);
  });

  it("makes all 39 listening-approved works playable in the web preview", () => {
    const approved = CONSUMER_AUDIO_WORKS.filter(
      (work) => work.listeningStatus === "APPROVED — LISTENING PASSED",
    );
    expect(approved).toHaveLength(39);
    expect(approved.every(isPlayableWorkOnWeb)).toBe(true);
    expect(
      approved.filter((work) => work.availability === "local-preview-file"),
    ).toHaveLength(38);
  });

  it("keeps every generated colour single-source, local and asset-free", () => {
    const generated = CONSUMER_AUDIO_WORKS.filter(
      (work) => work.sourceKind === "generated-noise",
    );
    expect(generated).toHaveLength(8);
    expect(generated.map((work) => work.noiseColor)).toEqual([
      "white",
      "pink",
      "brown",
      "blue",
      "violet",
      "grey",
      "green",
      "black",
    ]);
    expect(
      generated.every(
        (work) =>
          work.sourceFilename === null &&
          work.availability === "generated-runtime" &&
          work.collectionIds.length === 1 &&
          work.collectionIds[0] === "noise-colours",
      ),
    ).toBe(true);
  });

  it("covers and enables every outcome with a local file or generator", () => {
    for (const outcome of CONSUMER_OUTCOMES) {
      expect(
        CONSUMER_AUDIO_WORKS.some(
          (work) =>
            work.primaryOutcome === outcome.id ||
            work.secondaryOutcomes.includes(outcome.id),
        ),
      ).toBe(true);
    }
    expect(
      CONSUMER_OUTCOMES.filter(
        (outcome) => getEmbeddedWorksForOutcome(outcome.id).length > 0,
      ).map((outcome) => outcome.id),
    ).toEqual(["meditation", "relax", "sleep"]);
    expect(
      CONSUMER_OUTCOMES.filter(
        (outcome) => getPlayableWorksForOutcome(outcome.id).length > 0,
      ).map((outcome) => outcome.id),
    ).toEqual(["meditation", "yoga", "massage", "relax", "sleep", "focus"]);
  });

  it("features the approved sea works before Eclipse Veil in Meditation", () => {
    const meditationWorks = getWorksForOutcome("meditation");
    expect(meditationWorks.slice(0, 6).map((work) => work.id)).toEqual([
      "field-sea-003-open-tide",
      "field-sea-001-tidal-breath",
      "field-sea-005-pearl-tide",
      "field-sea-007-blue-interval",
      "field-sea-002-moon-shore",
      "field-sea-004-night-shore",
    ]);
    expect(meditationWorks[0]?.title).toBe("Open Tide");
    expect(
      meditationWorks.findIndex((work) => work.id === "eclipse-veil"),
    ).toBeGreaterThanOrEqual(6);
  });

  it("keeps every post-gain true peak below -1 dBTP", () => {
    for (const work of CONSUMER_AUDIO_WORKS.filter(
      (candidate) => candidate.sourceKind === "file",
    )) {
      expect(work.postGainTruePeakDbtp).not.toBeNull();
      expect(work.postGainTruePeakDbtp!).toBeLessThan(-1);
      expect(dbToLinear(work.playbackGainDb)).toBeGreaterThan(0);
      expect(work.measuredLufs! + work.playbackGainDb).toBeLessThanOrEqual(
        -17.9,
      );
    }
  });

  it("reuses ATP01 asset keys without declaring new consumer WAV copies", () => {
    const reused = CONSUMER_AUDIO_WORKS.filter(
      (work) => work.availability === "embedded-wav",
    );
    expect(reused.map((work) => work.assetKey)).toEqual([
      "sleepDrone001",
      "sleepAmbience001",
    ]);
    expect(reused.every((work) => work.familyId === "audio-test-pack-01")).toBe(
      true,
    );
    const rejected = CONSUMER_AUDIO_WORKS.find(
      (work) => work.id === "soft-air",
    );
    expect(rejected).toMatchObject({
      assetKey: "sleepTexture001",
      availability: "rejected-listening",
      listeningStatus: "REJECTED — REPLACEMENT REQUIRED",
    });
    expect(getPlayableWorksForOutcome("focus")).not.toContainEqual(rejected);
  });

  it("keeps pair members as separate editorial variants", () => {
    for (const familyId of [
      "zen-dream-003",
      "zen-generator-003",
      "zen-generator-004",
      "zen-generator-005",
    ]) {
      const family = CONSUMER_AUDIO_WORKS.filter(
        (work) => work.familyId === familyId,
      );
      expect(family).toHaveLength(2);
      expect(new Set(family.map((work) => work.assetKey)).size).toBe(2);
    }
  });
});
