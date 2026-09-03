import type {
  AudioBinaryStore,
  OfflineAssetManifestEntry,
  OfflineCatalogManifest,
  OfflineFailureCode,
  OfflinePackageManifestEntry,
  OfflinePackageRecord,
  OfflineStateStore,
  PackageSource,
} from "@/domain/offline/types";

const SPACE_RESERVE_BYTES = 64 * 1024 * 1024;

function initialRecord(
  catalogRevision: string,
  entry: OfflinePackageManifestEntry,
): OfflinePackageRecord {
  return {
    schemaVersion: 2,
    packageId: entry.packageId,
    revision: entry.revision,
    catalogRevision,
    status: "not-downloaded",
    bytesDownloaded: 0,
    totalBytes: entry.totalBytes,
    verifiedAssetIds: [],
    attempt: 0,
    failureCode: null,
  };
}

export class OfflinePackageManager {
  private readonly packageQueues = new Map<string, Promise<void>>();

  constructor(
    private readonly manifest: OfflineCatalogManifest,
    private readonly stateStore: OfflineStateStore,
    private readonly binaryStore: AudioBinaryStore,
    private readonly source: PackageSource,
  ) {}

  hydrate(packageId: string): Promise<OfflinePackageRecord> {
    return this.exclusive(packageId, () => this.hydrateUnlocked(packageId));
  }

  download(packageId: string): Promise<OfflinePackageRecord> {
    return this.exclusive(packageId, async () => {
      const entry = this.requirePackage(packageId);
      const assets = entry.assetIds.map((assetId) =>
        this.requireAsset(assetId),
      );
      const previous = await this.hydrateUnlocked(packageId);
      if (previous.status === "available") return previous;
      const attempt = previous.attempt + 1;
      if (!this.source.canDownload) {
        return this.fail(entry, attempt, "source-unavailable", 0, []);
      }

      const alreadyVerified: OfflineAssetManifestEntry[] = [];
      const missing: OfflineAssetManifestEntry[] = [];
      for (const asset of assets) {
        const inspection = await this.binaryStore.inspectCommitted(asset);
        if (inspection === "verified") alreadyVerified.push(asset);
        else missing.push(asset);
      }
      const existingBytes = alreadyVerified.reduce(
        (sum, asset) => sum + asset.bytes,
        0,
      );
      const missingBytes = missing.reduce((sum, asset) => sum + asset.bytes, 0);
      if (
        (await this.binaryStore.freeBytes()) <
        missingBytes + SPACE_RESERVE_BYTES
      ) {
        return this.fail(
          entry,
          attempt,
          "insufficient-space",
          existingBytes,
          alreadyVerified.map(({ assetId }) => assetId),
        );
      }

      let bytesDownloaded = existingBytes;
      const verifiedAssetIds = alreadyVerified.map(({ assetId }) => assetId);
      const staged: OfflineAssetManifestEntry[] = [];
      await this.save(
        entry,
        attempt,
        "queued",
        bytesDownloaded,
        verifiedAssetIds,
        null,
      );
      try {
        for (const asset of missing) {
          await this.save(
            entry,
            attempt,
            "downloading",
            bytesDownloaded,
            verifiedAssetIds,
            null,
          );
          const sink = await this.binaryStore.openStagingSink(asset, attempt);
          let assetProgress = 0;
          try {
            await this.source.transfer(asset, sink, async (bytesDelta) => {
              if (!Number.isFinite(bytesDelta) || bytesDelta <= 0) {
                throw new Error("Invalid offline transfer progress.");
              }
              assetProgress += bytesDelta;
              if (assetProgress > asset.bytes) {
                throw new Error("Offline transfer exceeded the manifest size.");
              }
              bytesDownloaded =
                existingBytes +
                staged.reduce((sum, item) => sum + item.bytes, 0) +
                assetProgress;
              await this.save(
                entry,
                attempt,
                "downloading",
                bytesDownloaded,
                verifiedAssetIds,
                null,
              );
            });
            await sink.close();
          } catch (error) {
            await sink.abort().catch(() => undefined);
            throw error;
          }
          if (assetProgress !== asset.bytes) {
            throw new Error(
              "Offline transfer size did not match the manifest.",
            );
          }
          staged.push(asset);
          await this.save(
            entry,
            attempt,
            "verifying",
            bytesDownloaded,
            verifiedAssetIds,
            null,
          );
          if (!(await this.binaryStore.verifyStaged(asset, attempt))) {
            await this.binaryStore.rollbackAttempt(staged, attempt);
            return this.fail(
              entry,
              attempt,
              "integrity-mismatch",
              existingBytes,
              alreadyVerified.map(({ assetId }) => assetId),
            );
          }
          verifiedAssetIds.push(asset.assetId);
        }
        await this.binaryStore.promoteAttempt(staged, attempt);
        return this.save(
          entry,
          attempt,
          "available",
          entry.totalBytes,
          assets.map(({ assetId }) => assetId),
          null,
        );
      } catch {
        await this.binaryStore
          .rollbackAttempt(staged, attempt)
          .catch(() => undefined);
        return this.fail(
          entry,
          attempt,
          "storage-error",
          existingBytes,
          alreadyVerified.map(({ assetId }) => assetId),
        );
      }
    });
  }

  remove(packageId: string): Promise<OfflinePackageRecord> {
    return this.exclusive(packageId, async () => {
      const entry = this.requirePackage(packageId);
      const previous = await this.hydrateUnlocked(packageId);
      const assets = entry.assetIds.map((assetId) =>
        this.requireAsset(assetId),
      );
      await this.save(
        entry,
        previous.attempt,
        "removing",
        previous.bytesDownloaded,
        previous.verifiedAssetIds,
        null,
      );
      try {
        await this.binaryStore.removePackage(assets);
        return this.save(
          entry,
          previous.attempt,
          "not-downloaded",
          0,
          [],
          null,
        );
      } catch {
        return this.fail(
          entry,
          previous.attempt,
          "storage-error",
          previous.bytesDownloaded,
          previous.verifiedAssetIds,
        );
      }
    });
  }

  private async hydrateUnlocked(
    packageId: string,
  ): Promise<OfflinePackageRecord> {
    const entry = this.requirePackage(packageId);
    const stored = await this.stateStore.load(packageId);
    if (
      !stored ||
      stored.revision !== entry.revision ||
      stored.catalogRevision !== this.manifest.catalogRevision ||
      stored.totalBytes !== entry.totalBytes
    ) {
      return initialRecord(this.manifest.catalogRevision, entry);
    }
    if (
      ["queued", "downloading", "verifying", "removing"].includes(stored.status)
    ) {
      const recovered = {
        ...stored,
        status: "failed" as const,
        failureCode: "interrupted" as const,
      };
      await this.stateStore.save(recovered);
      return recovered;
    }
    if (stored.status === "available") {
      for (const assetId of entry.assetIds) {
        const asset = this.requireAsset(assetId);
        if ((await this.binaryStore.inspectCommitted(asset)) !== "verified") {
          return this.fail(entry, stored.attempt, "integrity-mismatch", 0, []);
        }
      }
    }
    return stored;
  }

  private requirePackage(packageId: string): OfflinePackageManifestEntry {
    const entry = this.manifest.packages.find(
      (candidate) => candidate.packageId === packageId,
    );
    if (!entry) throw new Error(`Unknown offline package ${packageId}.`);
    return entry;
  }

  private requireAsset(assetId: string): OfflineAssetManifestEntry {
    const asset = this.manifest.assets.find(
      (candidate) => candidate.assetId === assetId,
    );
    if (!asset) throw new Error(`Unknown offline asset ${assetId}.`);
    return asset;
  }

  private fail(
    entry: OfflinePackageManifestEntry,
    attempt: number,
    failureCode: OfflineFailureCode,
    bytesDownloaded: number,
    verifiedAssetIds: readonly string[],
  ) {
    return this.save(
      entry,
      attempt,
      "failed",
      bytesDownloaded,
      verifiedAssetIds,
      failureCode,
    );
  }

  private async save(
    entry: OfflinePackageManifestEntry,
    attempt: number,
    status: OfflinePackageRecord["status"],
    bytesDownloaded: number,
    verifiedAssetIds: readonly string[],
    failureCode: OfflineFailureCode | null,
  ): Promise<OfflinePackageRecord> {
    const record: OfflinePackageRecord = {
      schemaVersion: 2,
      packageId: entry.packageId,
      revision: entry.revision,
      catalogRevision: this.manifest.catalogRevision,
      status,
      bytesDownloaded,
      totalBytes: entry.totalBytes,
      verifiedAssetIds: [...verifiedAssetIds],
      attempt,
      failureCode,
    };
    await this.stateStore.save(record);
    return record;
  }

  private async exclusive<T>(
    packageId: string,
    operation: () => Promise<T>,
  ): Promise<T> {
    const previous = this.packageQueues.get(packageId) ?? Promise.resolve();
    let release: () => void = () => {};
    const gate = new Promise<void>((resolve) => {
      release = resolve;
    });
    const queued = previous.then(() => gate);
    this.packageQueues.set(packageId, queued);
    await previous;
    try {
      return await operation();
    } finally {
      release();
      if (this.packageQueues.get(packageId) === queued) {
        this.packageQueues.delete(packageId);
      }
    }
  }
}
