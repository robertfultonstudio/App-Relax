import {
  automaticListeningPool,
  chooseAutomaticWork,
  ACTIVITY_MUSIC_POOLS,
  previousListeningWorkId,
} from "@/content/automaticListening";
import { CONSUMER_OUTCOMES } from "@/content/productShell";
import { soundFamilyFor } from "@/content/soundFamilies";
jest.mock("@/domain/sessions/playbackAvailability", () => ({
  isNativeCatalogPreview: () => false,
  isAdaptivePlaybackAvailable: () => true,
  isPwaWebSurface: () => true,
}));

it.each(CONSUMER_OUTCOMES)(
  "selects available standalone music for $id, never rejected files or Hatha cycle fragments",
  ({ id }) => {
    const pool = automaticListeningPool(id);
    expect(pool.length).toBeGreaterThan(1);
    for (const work of pool) {
      expect(work.sourceKind).toBe("file");
      expect(work.cycle).toBeUndefined();
      expect(work.loop).toBe(true);
      expect(soundFamilyFor(work)).toBe("music");
      expect(ACTIVITY_MUSIC_POOLS[id]).toContain(work.id);
      expect(work.listeningStatus).not.toBe("REJECTED — REPLACEMENT REQUIRED");
      expect(["eclipse-veil", "stillwater-halo", "soft-air"]).not.toContain(
        work.id,
      );
    }
    expect(chooseAutomaticWork(id, 0)).toBe(pool[0]);
    expect(chooseAutomaticWork(id, 1)).toBe(pool.at(-1));
    expect(chooseAutomaticWork(id, NaN)).toBe(pool[0]);
    expect(chooseAutomaticWork(id, -10)).toBe(pool[0]);
    expect(chooseAutomaticWork(id, 100)).toBe(pool.at(-1));
    if (pool.length > 1)
      expect(chooseAutomaticWork(id, 0, pool[0].id)?.id).not.toBe(pool[0].id);
  },
);

it("reads the previous musical work from a persisted music-plus-nature session", () => {
  expect(
    previousListeningWorkId(null, {
      kind: "adaptive",
      request: {
        outcome: "sleep",
        durationMinutes: 90,
        mode: "sound-only",
        soundKind: "music",
        natureFamily: "rain",
        listeningWorkId: "moonlit-veil",
        includeNatureBed: true,
      },
    }),
  ).toBe("moonlit-veil");
  expect(chooseAutomaticWork("sleep", 0, "moonlit-veil")?.id).toBe(
    "aquarian-drift",
  );
});
