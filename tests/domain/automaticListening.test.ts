import {
  automaticListeningPool,
  chooseAutomaticWork,
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
    expect(pool.length).toBeGreaterThan(0);
    for (const work of pool) {
      expect(work.sourceKind).toBe("file");
      expect(work.cycle).toBeUndefined();
      expect(work.loop).toBe(true);
      expect(soundFamilyFor(work)).toBe("music");
      expect([work.primaryOutcome, ...work.secondaryOutcomes]).toContain(id);
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
