import { Blob as NodeBlob } from "node:buffer";
import { createHash } from "node:crypto";
import { BrowserAudioBinaryStore } from "@/offline/BrowserAudioBinaryStore";
import type { AudioFilePort } from "@/offline/BrowserAudioFiles";
import type { OfflineAssetManifestEntry } from "@/domain/offline/types";

function harness() {
  const files = new Map<string, Uint8Array>(),
    metadata = new Map<string, string>(),
    leases = new Map<string, number>();
  const chunks: number[] = [];
  const port: AudioFilePort = {
    freeBytes: async () => 1e9,
    open: async (name) => {
      let written = new Uint8Array();
      return {
        write: async (chunk) => {
          chunks.push(chunk.length);
          const next = new Uint8Array(written.length + chunk.length);
          next.set(written);
          next.set(chunk, written.length);
          written = next;
        },
        close: async () => {
          files.set(name, written);
        },
        abort: async () => {
          files.delete(name);
        },
      };
    },
    read: async (name) =>
      files.has(name)
        ? (new NodeBlob([files.get(name)!]) as unknown as Blob)
        : null,
    remove: async (name) => {
      files.delete(name);
    },
    list: async () => [...files.keys()],
    lease: async (name) => {
      leases.set(name, (leases.get(name) ?? 0) + 1);
      return () => {
        leases.set(name, leases.get(name)! - 1);
      };
    },
    removeIfUnused: async (name) => {
      if (leases.get(name)) return false;
      files.delete(name);
      return true;
    },
  };
  let sequence = 0;
  const urls = { create: jest.fn(() => "blob:verified"), revoke: jest.fn() };
  const store = new BrowserAudioBinaryStore(
    port,
    {
      getItem: (key) => metadata.get(key) ?? null,
      setItem: (key, value) => {
        metadata.set(key, value);
      },
    },
    () => `${++sequence}`,
    urls,
  );
  const bytes = Uint8Array.from([1, 2, 3, 4]);
  const asset: OfflineAssetManifestEntry = {
    assetId: "audio.a",
    workId: "a",
    bytes: bytes.length,
    sha256: createHash("sha256").update(bytes).digest("hex"),
    mediaType: "audio/flac",
    objectKey: "A.flac",
  };
  const stage = async () => {
    const sink = await store.openStagingSink(asset, 1);
    await sink.write(bytes.subarray(0, 2));
    await sink.write(bytes.subarray(2));
    await sink.close();
  };
  return {
    files,
    metadata,
    leases,
    port,
    store,
    urls,
    asset,
    bytes,
    stage,
    chunks,
  };
}

describe("browser private audio storage", () => {
  it("stages bounded writes, hashes actual disk bytes and promotes atomically", async () => {
    const t = harness();
    await t.stage();
    expect(await t.store.inspectCommitted(t.asset)).toBe("missing");
    await expect(t.store.promoteAttempt([t.asset], 1)).rejects.toThrow(
      "Unverified",
    );
    expect(await t.store.verifyStaged(t.asset, 1)).toBe(true);
    await t.store.promoteAttempt([t.asset], 1);
    expect(await t.store.inspectCommitted(t.asset)).toBe("verified");
    expect(t.chunks).toEqual([2, 2]);
    expect(t.metadata.size).toBe(1);
  });

  it("rejects altered disk bytes despite a matching network digest", async () => {
    const t = harness();
    await t.stage();
    t.files.set("1.audio", Uint8Array.of(4, 3, 2, 1));
    expect(await t.store.verifyStaged(t.asset, 1)).toBe(false);
    await t.store.rollbackAttempt([t.asset], 1);
    expect(t.files.size).toBe(0);
  });

  it("leases a verified blob; removal is undoable and cannot purge during playback", async () => {
    const t = harness();
    await t.stage();
    await t.store.verifyStaged(t.asset, 1);
    await t.store.promoteAttempt([t.asset], 1);
    const lease = await t.store.acquire(t.asset);
    expect(lease).toMatchObject({
      uri: "blob:verified",
      workId: "a",
      byteSize: 4,
      sha256: t.asset.sha256,
    });
    await t.store.removePackage([t.asset]);
    expect(await t.store.acquire(t.asset)).toBeNull();
    expect(await t.store.purgeRemoval(t.asset)).toBe(false);
    expect(await t.store.undoRemoval(t.asset)).toBe(true);
    await t.store.removePackage([t.asset]);
    await lease!.release();
    await lease!.release();
    expect(t.urls.revoke).toHaveBeenCalledTimes(1);
    expect(await t.store.purgeRemoval(t.asset)).toBe(true);
    expect(t.files.size).toBe(0);
  });

  it("fails closed and releases a lease on corruption or missing files", async () => {
    const t = harness();
    await t.stage();
    await t.store.verifyStaged(t.asset, 1);
    await t.store.promoteAttempt([t.asset], 1);
    t.files.set("1.audio", Uint8Array.of(4, 3, 2, 1));
    expect(await t.store.acquire(t.asset)).toBeNull();
    expect(await t.store.inspectCommitted(t.asset)).toBe("mismatch");
    t.files.delete("1.audio");
    expect(await t.store.inspectCommitted(t.asset)).toBe("missing");
    expect(t.leases.get("1.audio")).toBe(0);
  });

  it("recovers abandoned stages without deleting committed or leased audio", async () => {
    const t = harness();
    await t.stage();
    await t.store.verifyStaged(t.asset, 1);
    await t.store.promoteAttempt([t.asset], 1);
    t.files.set("2.audio", Uint8Array.of(0));
    t.files.set("3.audio", Uint8Array.of(0));
    const release = await t.port.lease("3.audio");
    await t.store.recoverOrphans();
    expect([...t.files.keys()]).toEqual(["1.audio", "3.audio"]);
    release();
    await t.store.recoverOrphans();
    expect([...t.files.keys()]).toEqual(["1.audio"]);
  });

  it("does not make a partial attempt visible when a second file is unverified", async () => {
    const t = harness();
    await t.stage();
    await t.store.verifyStaged(t.asset, 1);
    await expect(
      t.store.promoteAttempt([t.asset, { ...t.asset, assetId: "audio.b" }], 1),
    ).rejects.toThrow();
    expect(t.metadata.size).toBe(0);
  });
});
