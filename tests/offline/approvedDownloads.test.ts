import {
  APPROVED_DOWNLOAD_MANIFEST,
  STARTER_PACKAGE_ID,
  STARTER_WORK_IDS,
} from "@/offline/approvedDownloads";
import { CONSUMER_AUDIO_WORKS } from "@/content/consumerCatalog";

describe("approved selective downloads", () => {
  it("includes exactly all 37 delivery files without generators or rejected audio", () => {
    expect(APPROVED_DOWNLOAD_MANIFEST.assets).toHaveLength(37);
    expect(
      APPROVED_DOWNLOAD_MANIFEST.assets.reduce(
        (sum, asset) => sum + asset.bytes,
        0,
      ),
    ).toBe(2_657_446_897);
    for (const asset of APPROVED_DOWNLOAD_MANIFEST.assets) {
      const work = CONSUMER_AUDIO_WORKS.find(
        (entry) => entry.id === asset.workId,
      )!;
      expect(work.listeningStatus).toBe("APPROVED — LISTENING PASSED");
      expect(work.localPreviewFilename).toBe(asset.objectKey);
      expect(asset.sha256).toMatch(/^[a-f0-9]{64}$/);
    }
  });
  it("offers a 16.6 MB explicit starter, distinct from the full catalogue", () => {
    const starter = APPROVED_DOWNLOAD_MANIFEST.packages.find(
      (entry) => entry.packageId === STARTER_PACKAGE_ID,
    )!;
    expect(starter.assetIds).toEqual(
      STARTER_WORK_IDS.map((id) => `audio.${id}`),
    );
    expect(starter.totalBytes).toBe(16_622_588);
    expect(starter.assetIds).toHaveLength(3);
    expect(JSON.stringify(APPROVED_DOWNLOAD_MANIFEST)).not.toMatch(
      /https?:|eclipse-veil|stillwater-halo|soft-air|SLEEP_TEXTURE/,
    );
  });
});
