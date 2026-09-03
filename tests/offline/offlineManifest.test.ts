import { readFileSync } from "node:fs";
import { join } from "node:path";
import { OFFLINE_CATALOG_MANIFEST } from "@/content/offlinePackageManifest";
import { CONSUMER_AUDIO_WORKS } from "@/content/consumerCatalog";

describe("offline package manifest", () => {
  it("is a unique, path-safe, internally consistent local contract", () => {
    const manifest = OFFLINE_CATALOG_MANIFEST;
    expect(manifest.schemaVersion).toBe(1);
    expect(manifest.assets).toHaveLength(12);
    expect(new Set(manifest.assets.map(({ assetId }) => assetId)).size).toBe(
      12,
    );
    expect(new Set(manifest.assets.map(({ workId }) => workId)).size).toBe(12);
    expect(
      new Set(manifest.assets.map(({ objectKey }) => objectKey)).size,
    ).toBe(12);
    for (const asset of manifest.assets) {
      expect(asset.objectKey).toMatch(/^[A-Z0-9_]+\.flac$/);
      expect(asset.objectKey).not.toMatch(/\.\.|\//);
      expect(asset.sha256).toMatch(/^[a-f0-9]{64}$/);
      expect(asset.bytes).toBeGreaterThan(0);
    }
    const pack = manifest.packages[0];
    expect(pack.assetIds).toEqual(
      manifest.assets.map(({ assetId }) => assetId),
    );
    expect(pack.totalBytes).toBe(
      manifest.assets.reduce((total, asset) => total + asset.bytes, 0),
    );
  });

  it("matches the approved catalog records and the local listening manifest", () => {
    const localManifest = JSON.parse(
      readFileSync(
        join(__dirname, "..", "..", "docs", "M4_LOCAL_LISTENING_MANIFEST.json"),
        "utf8",
      ),
    ) as {
      files: { filename: string; bytes: number; sha256: string }[];
    };
    for (const asset of OFFLINE_CATALOG_MANIFEST.assets) {
      const work = CONSUMER_AUDIO_WORKS.find(({ id }) => id === asset.workId);
      expect(work?.localPreviewFilename).toBe(asset.objectKey);
      expect(work?.listeningStatus).toBe("APPROVED — LISTENING PASSED");
      expect(localManifest.files).toContainEqual(
        expect.objectContaining({
          filename: asset.objectKey,
          bytes: asset.bytes,
          sha256: asset.sha256,
        }),
      );
    }
  });
});
