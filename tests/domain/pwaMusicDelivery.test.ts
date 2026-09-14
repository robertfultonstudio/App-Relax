import { CONSUMER_AUDIO_WORKS } from "@/content/consumerCatalog";
import { pwaDeliveryFilename } from "@/pwa-review/pwaDeliveryFilename";
import registry from "@/pwa-review/flacIndexManifest.json";

it("maps all 21 approved music files one-to-one, preserving frames, work IDs and original catalog", () => {
  const entries = registry.files.filter((f) => "sourceFilename" in f);
  expect(entries).toHaveLength(21);
  expect(new Set(entries.map((f) => f.sourceFilename)).size).toBe(21);
  for (const entry of entries) {
    const works = CONSUMER_AUDIO_WORKS.filter(
      (w) => w.localPreviewFilename === entry.sourceFilename,
    );
    expect(works.length).toBeGreaterThan(0);
    for (const work of works) {
      expect(pwaDeliveryFilename(work)).toBe(entry.filename);
      expect(work.frameCount).toBe(entry.totalFrames);
      expect(work.localPreviewFilename).toBe(entry.sourceFilename);
      expect(() =>
        pwaDeliveryFilename({ ...work, frameCount: work.frameCount + 1 }),
      ).toThrow("duration");
    }
  }
  expect(entries.every((f) => f.onDemand === true)).toBe(true);
  expect(registry.files.filter((f) => !("sourceFilename" in f))).toHaveLength(
    24,
  );
});
