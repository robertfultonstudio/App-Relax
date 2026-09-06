import { createHash } from "node:crypto";
import { NativeVerifiedAudioResolver } from "@/offline/NativeVerifiedAudioResolver";
import type { OfflineCatalogManifest } from "@/domain/offline/types";

describe("native verified local file port", () => {
  const bytes = new Uint8Array(300_001).fill(97);
  const manifest: OfflineCatalogManifest = {
    schemaVersion: 1,
    catalogRevision: "test",
    packages: [],
    assets: [
      {
        assetId: "audio.a",
        workId: "a",
        bytes: bytes.length,
        sha256: createHash("sha256").update(bytes).digest("hex"),
        objectKey: "A.flac",
        mediaType: "audio/flac",
      },
    ],
  };
  it("checks current bytes in bounded reads and releases exactly once", async () => {
    const release = jest.fn(),
      read = jest.fn(async (_uri: string, offset: number, count: number) =>
        bytes.slice(offset, offset + count),
      );
    const resolver = new NativeVerifiedAudioResolver(manifest, {
      find: async () => "file:///private/app/A.flac",
      size: async () => bytes.length,
      lease: async () => release,
      read,
    });
    const file = await resolver.acquire("a");
    expect(file?.byteSize).toBe(bytes.length);
    expect(read.mock.calls.map((call) => call[2])).toEqual([262144, 37857]);
    await file!.release();
    await file!.release();
    expect(release).toHaveBeenCalledTimes(1);
  });
  it("rejects remote, missing, incomplete and corrupt files", async () => {
    const release = jest.fn();
    for (const uri of [
      null,
      "https://example.org/A.flac",
      "file:///private/../A.flac",
    ]) {
      const resolver = new NativeVerifiedAudioResolver(manifest, {
        find: async () => uri,
        size: async () => bytes.length,
        lease: async () => release,
        read: async () => bytes,
      });
      expect(await resolver.acquire("a")).toBeNull();
    }
    const resolver = new NativeVerifiedAudioResolver(manifest, {
      find: async () => "file:///private/app/A.flac",
      size: async () => bytes.length,
      lease: async () => release,
      read: async (_uri, _offset, count) => new Uint8Array(count).fill(98),
    });
    expect(await resolver.acquire("a")).toBeNull();
    expect(release).toHaveBeenCalledTimes(1);
  });
});
