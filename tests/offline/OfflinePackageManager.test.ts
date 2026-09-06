import { OfflinePackageManager } from "@/offline/OfflinePackageManager";
import type {
  AudioBinaryStore,
  OfflineCatalogManifest,
  OfflinePackageRecord,
  OfflineStateStore,
  PackageSource,
} from "@/domain/offline/types";

const manifest: OfflineCatalogManifest = {
  schemaVersion: 1,
  catalogRevision: "test",
  assets: [
    {
      assetId: "a",
      workId: "work-a",
      objectKey: "A.flac",
      bytes: 10,
      sha256: "a".repeat(64),
      mediaType: "audio/flac",
    },
    {
      assetId: "b",
      workId: "work-b",
      objectKey: "B.flac",
      bytes: 15,
      sha256: "b".repeat(64),
      mediaType: "audio/flac",
    },
  ],
  packages: [
    {
      packageId: "pack",
      revision: "1",
      title: "Pack",
      assetIds: ["a", "b"],
      totalBytes: 25,
    },
  ],
};

function harness(
  options: {
    canDownload?: boolean;
    freeBytes?: number;
    verify?: boolean;
    committedIds?: string[];
    mismatchIds?: string[];
    removeFails?: boolean;
    truncateTransfer?: boolean;
  } = {},
) {
  let current: OfflinePackageRecord | null = null;
  const statuses: string[] = [];
  const removed: string[] = [];
  const rolledBack: string[][] = [];
  const committed = new Set(options.committedIds ?? []);
  const mismatch = new Set(options.mismatchIds ?? []);
  const state: OfflineStateStore = {
    load: async () => current,
    save: async (record) => {
      current = record;
      statuses.push(record.status);
    },
  };
  const binary: AudioBinaryStore = {
    freeBytes: async () => options.freeBytes ?? Number.MAX_SAFE_INTEGER,
    inspectCommitted: async (asset) =>
      mismatch.has(asset.assetId)
        ? "mismatch"
        : committed.has(asset.assetId)
          ? "verified"
          : "missing",
    openStagingSink: async () => ({
      write: async () => {},
      close: async () => {},
      abort: async () => {},
    }),
    verifyStaged: async () => options.verify ?? true,
    promoteAttempt: async (assets) => {
      for (const asset of assets) committed.add(asset.assetId);
    },
    rollbackAttempt: async (assets) => {
      rolledBack.push(assets.map(({ assetId }) => assetId));
    },
    removePackage: async (assets) => {
      if (options.removeFails) throw new Error("busy");
      for (const asset of assets) {
        removed.push(asset.assetId);
        committed.delete(asset.assetId);
      }
    },
  };
  const transferCalls: string[] = [];
  const source: PackageSource = {
    kind: options.canDownload === false ? "unavailable" : "remote",
    canDownload: options.canDownload ?? true,
    transfer: async (asset, sink, progress) => {
      transferCalls.push(asset.assetId);
      const bytes = asset.bytes - (options.truncateTransfer ? 1 : 0);
      await sink.write(new Uint8Array(bytes));
      await progress(bytes);
    },
  };
  const manager = new OfflinePackageManager(manifest, state, binary, source);
  return {
    manager,
    statuses,
    removed,
    rolledBack,
    transferCalls,
    setCurrent(record: OfflinePackageRecord) {
      current = record;
    },
  };
}

function availableRecord(): OfflinePackageRecord {
  return {
    schemaVersion: 2,
    packageId: "pack",
    revision: "1",
    catalogRevision: "test",
    status: "available",
    bytesDownloaded: 25,
    totalBytes: 25,
    verifiedAssetIds: ["a", "b"],
    attempt: 1,
    failureCode: null,
  };
}

describe("OfflinePackageManager", () => {
  it("streams to staging, verifies all assets and promotes one attempt", async () => {
    const test = harness();
    await expect(test.manager.download("pack")).resolves.toMatchObject({
      status: "available",
      catalogRevision: "test",
      bytesDownloaded: 25,
      verifiedAssetIds: ["a", "b"],
      attempt: 1,
      failureCode: null,
    });
    expect(test.transferCalls).toEqual(["a", "b"]);
    expect(test.statuses).toEqual([
      "queued",
      "downloading",
      "downloading",
      "verifying",
      "downloading",
      "downloading",
      "verifying",
      "available",
    ]);
  });

  it("reconciles shared files without requesting a download", async () => {
    const test = harness({ committedIds: ["a", "b"] });
    await expect(test.manager.reconcile("pack")).resolves.toMatchObject({
      status: "available",
      bytesDownloaded: 25,
    });
    expect(test.transferCalls).toEqual([]);
  });

  it("cancels before transfer without promoting or requesting audio", async () => {
    const test = harness();
    const controller = new AbortController();
    controller.abort();
    await expect(
      test.manager.download("pack", controller.signal),
    ).resolves.toMatchObject({ status: "failed", failureCode: "cancelled" });
    expect(test.transferCalls).toEqual([]);
  });

  it("rolls back a short closed file as an integrity failure", async () => {
    const test = harness({ truncateTransfer: true });
    await expect(test.manager.download("pack")).resolves.toMatchObject({
      status: "failed",
      failureCode: "integrity-mismatch",
    });
    expect(test.rolledBack).toEqual([["a"]]);
  });

  it("fails explicitly when source, space or integrity is unavailable", async () => {
    await expect(
      harness({ canDownload: false }).manager.download("pack"),
    ).resolves.toMatchObject({
      status: "failed",
      failureCode: "source-unavailable",
    });
    await expect(
      harness({ freeBytes: 1 }).manager.download("pack"),
    ).resolves.toMatchObject({
      status: "failed",
      failureCode: "insufficient-space",
    });
    const corrupt = harness({ verify: false });
    await expect(corrupt.manager.download("pack")).resolves.toMatchObject({
      status: "failed",
      failureCode: "integrity-mismatch",
      verifiedAssetIds: [],
    });
    expect(corrupt.rolledBack).toContainEqual(["a"]);
  });

  it("reconciles persisted availability against actual bytes and hashes", async () => {
    const test = harness({ committedIds: ["a"] });
    test.setCurrent(availableRecord());
    await expect(test.manager.hydrate("pack")).resolves.toMatchObject({
      status: "failed",
      failureCode: "integrity-mismatch",
      bytesDownloaded: 0,
    });
  });

  it("downloads only missing bytes and serializes package operations", async () => {
    const reserve = 64 * 1024 * 1024;
    const test = harness({ committedIds: ["a"], freeBytes: reserve + 15 });
    await Promise.all([
      test.manager.download("pack"),
      test.manager.download("pack"),
    ]);
    expect(test.transferCalls).toEqual(["b"]);
  });

  it("marks interrupted work failed and retries with a new attempt", async () => {
    const test = harness();
    test.setCurrent({
      schemaVersion: 2,
      packageId: "pack",
      revision: "1",
      catalogRevision: "test",
      status: "downloading",
      bytesDownloaded: 10,
      totalBytes: 25,
      verifiedAssetIds: ["a"],
      attempt: 2,
      failureCode: null,
    });
    await expect(test.manager.hydrate("pack")).resolves.toMatchObject({
      status: "failed",
      failureCode: "interrupted",
      attempt: 2,
    });
    await expect(test.manager.download("pack")).resolves.toMatchObject({
      status: "available",
      attempt: 3,
    });
  });

  it("removes atomically and preserves evidence when storage refuses", async () => {
    const test = harness({ committedIds: ["a", "b"], removeFails: true });
    test.setCurrent(availableRecord());
    await expect(test.manager.remove("pack")).resolves.toMatchObject({
      status: "failed",
      failureCode: "storage-error",
      bytesDownloaded: 25,
      verifiedAssetIds: ["a", "b"],
    });

    const removable = harness({ committedIds: ["a", "b"] });
    removable.setCurrent(availableRecord());
    await expect(removable.manager.remove("pack")).resolves.toMatchObject({
      status: "not-downloaded",
      bytesDownloaded: 0,
      verifiedAssetIds: [],
    });
    expect(removable.removed).toEqual(["a", "b"]);
  });
});
