import {
  CONSUMER_AUDIO_WORKS,
  getEmbeddedWorksForOutcome,
} from "@/content/consumerCatalog";
import { CONSUMER_OUTCOMES } from "@/content/productShell";
import {
  createSingleTrackProgram,
  dbToLinear,
} from "@/domain/audio/consumerTypes";

describe("M4 autonomous consumer catalog", () => {
  it("registers 18 autonomous works with unique asset keys", () => {
    expect(CONSUMER_AUDIO_WORKS).toHaveLength(18);
    expect(new Set(CONSUMER_AUDIO_WORKS.map((work) => work.id)).size).toBe(18);
    expect(
      new Set(CONSUMER_AUDIO_WORKS.map((work) => work.assetKey)).size,
    ).toBe(18);
    expect(
      CONSUMER_AUDIO_WORKS.every(
        (work) => createSingleTrackProgram(work).kind === "single-track",
      ),
    ).toBe(true);
  });

  it("covers every outcome but enables only embedded files", () => {
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
    ).toEqual(["relax", "meditation", "sleep", "focus"]);
  });

  it("keeps every post-gain true peak below -1 dBTP", () => {
    for (const work of CONSUMER_AUDIO_WORKS) {
      expect(work.postGainTruePeakDbtp).toBeLessThan(-1);
      expect(dbToLinear(work.playbackGainDb)).toBeGreaterThan(0);
      expect(work.measuredLufs + work.playbackGainDb).toBeCloseTo(-18, 2);
    }
  });

  it("reuses ATP01 asset keys without declaring new consumer WAV copies", () => {
    const reused = CONSUMER_AUDIO_WORKS.filter(
      (work) => work.availability === "embedded-wav",
    );
    expect(reused.map((work) => work.assetKey)).toEqual([
      "sleepDrone001",
      "sleepAmbience001",
      "sleepTexture001",
    ]);
    expect(reused.every((work) => work.familyId === "audio-test-pack-01")).toBe(
      true,
    );
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
