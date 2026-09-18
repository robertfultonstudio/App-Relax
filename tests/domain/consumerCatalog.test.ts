import {
  CONSUMER_AUDIO_WORKS,
  getConsumerWork,
  getEmbeddedWorksForOutcome,
  getPlayableWorksForOutcome,
  getWorksForOutcome,
  getVisibleConsumerWorks,
  isPlayableWork,
  isPlayableWorkOnWeb,
} from "@/content/consumerCatalog";
import { CONSUMER_OUTCOMES } from "@/content/productShell";
import {
  createSingleTrackProgram,
  dbToLinear,
} from "@/domain/audio/consumerTypes";

describe("M4 autonomous consumer catalog", () => {
  it("registers 49 file works including one local unclassified texture and 8 autonomous noise generators", () => {
    expect(CONSUMER_AUDIO_WORKS).toHaveLength(58);
    expect(new Set(CONSUMER_AUDIO_WORKS.map((work) => work.id)).size).toBe(58);
    expect(
      new Set(CONSUMER_AUDIO_WORKS.map((work) => work.assetKey)).size,
    ).toBe(58);
    expect(
      CONSUMER_AUDIO_WORKS.every(
        (work) => createSingleTrackProgram(work).kind === "single-track",
      ),
    ).toBe(true);
  });

  it("makes all 37 listening-approved works playable in the web preview", () => {
    const approved = CONSUMER_AUDIO_WORKS.filter(
      (work) => work.listeningStatus === "APPROVED — LISTENING PASSED",
    );
    expect(approved).toHaveLength(37);
    expect(approved.every(isPlayableWorkOnWeb)).toBe(true);
    expect(
      approved.filter((work) => work.availability === "local-preview-file"),
    ).toHaveLength(37);
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
    for (const outcome of CONSUMER_OUTCOMES) {
      expect(getEmbeddedWorksForOutcome(outcome.id)).toEqual([]);
      for (const technicalId of ["moon-drone", "deep-river", "soft-air"]) {
        expect(
          getWorksForOutcome(outcome.id).map(({ id }) => id),
        ).not.toContain(technicalId);
        expect(
          getPlayableWorksForOutcome(outcome.id).map(({ id }) => id),
        ).not.toContain(technicalId);
      }
    }
    expect(
      CONSUMER_OUTCOMES.filter(
        (outcome) => getPlayableWorksForOutcome(outcome.id).length > 0,
      ).map((outcome) => outcome.id),
    ).toEqual(["meditation", "yoga", "massage", "relax", "sleep", "focus"]);
  });

  it("features the approved sea works and excludes both removed works", () => {
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
    expect(getConsumerWork("eclipse-veil")).toBeUndefined();
    expect(
      CONSUMER_AUDIO_WORKS.some((work) => work.assetKey === "eclypsis001"),
    ).toBe(false);
    expect(getConsumerWork("stillwater-halo")).toBeUndefined();
    expect(
      CONSUMER_AUDIO_WORKS.some((work) => work.assetKey === "nirvanaWaves001"),
    ).toBe(false);
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

  it("retains ATP01 technical metadata while making it non-playable on consumer surfaces", () => {
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
    expect(getConsumerWork("moon-drone")?.assetKey).toBe("sleepDrone001");
    expect(getConsumerWork("deep-river")?.assetKey).toBe("sleepAmbience001");
    expect(reused.every((work) => !isPlayableWork(work))).toBe(true);
    expect(reused.every((work) => !isPlayableWorkOnWeb(work))).toBe(true);
    const rejected = CONSUMER_AUDIO_WORKS.find(
      (work) => work.id === "soft-air",
    );
    expect(rejected).toMatchObject({
      assetKey: "sleepTexture001",
      availability: "rejected-listening",
      listeningStatus: "REJECTED — REPLACEMENT REQUIRED",
    });
    expect(isPlayableWork(rejected!)).toBe(false);
    expect(isPlayableWorkOnWeb(rejected!)).toBe(false);
    expect(getPlayableWorksForOutcome("focus")).not.toContainEqual(rejected);
  });

  it.each(["0", "1"])(
    "excludes each ATP work from consumer lists with PWA flag %s",
    (flag) => {
      const previous = process.env.EXPO_PUBLIC_APP_RELAX_PWA;
      try {
        process.env.EXPO_PUBLIC_APP_RELAX_PWA = flag;
        const visible = getVisibleConsumerWorks();
        expect(visible).toHaveLength(45);
        for (const technicalId of ["moon-drone", "deep-river", "soft-air"]) {
          expect(visible.map(({ id }) => id)).not.toContain(technicalId);
          expect(getConsumerWork(technicalId)).toBeDefined();
        }
      } finally {
        if (previous === undefined)
          delete process.env.EXPO_PUBLIC_APP_RELAX_PWA;
        else process.env.EXPO_PUBLIC_APP_RELAX_PWA = previous;
      }
    },
  );

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
