import AsyncStorage from "@react-native-async-storage/async-storage";
import type {
  OfflinePackageRecord,
  OfflineStateStore,
} from "@/domain/offline/types";
import type { StorageAdapter } from "@/state/playerPersistence";

const PREFIX = "@app-relax/offline-package/";
const STATUSES = [
  "not-downloaded",
  "queued",
  "downloading",
  "verifying",
  "available",
  "removing",
  "failed",
] as const;
const FAILURES = [
  "insufficient-space",
  "integrity-mismatch",
  "source-unavailable",
  "storage-error",
  "interrupted",
] as const;

function parseRecord(value: string): OfflinePackageRecord | null {
  try {
    const candidate = JSON.parse(value) as Partial<OfflinePackageRecord>;
    if (
      candidate.schemaVersion !== 2 ||
      typeof candidate.packageId !== "string" ||
      !candidate.packageId ||
      typeof candidate.revision !== "string" ||
      !candidate.revision ||
      typeof candidate.catalogRevision !== "string" ||
      !candidate.catalogRevision ||
      !STATUSES.includes(candidate.status as (typeof STATUSES)[number]) ||
      typeof candidate.bytesDownloaded !== "number" ||
      !Number.isSafeInteger(candidate.bytesDownloaded) ||
      candidate.bytesDownloaded < 0 ||
      typeof candidate.totalBytes !== "number" ||
      !Number.isSafeInteger(candidate.totalBytes) ||
      candidate.totalBytes <= 0 ||
      candidate.bytesDownloaded > candidate.totalBytes ||
      !Array.isArray(candidate.verifiedAssetIds) ||
      !candidate.verifiedAssetIds.every(
        (id) => typeof id === "string" && id.length > 0,
      ) ||
      new Set(candidate.verifiedAssetIds).size !==
        candidate.verifiedAssetIds.length ||
      typeof candidate.attempt !== "number" ||
      !Number.isSafeInteger(candidate.attempt) ||
      candidate.attempt < 0 ||
      (candidate.failureCode !== null &&
        !FAILURES.includes(candidate.failureCode as (typeof FAILURES)[number]))
    ) {
      return null;
    }
    const status = candidate.status as (typeof STATUSES)[number];
    const failureCode = candidate.failureCode as
      (typeof FAILURES)[number] | null;
    if (
      (status === "not-downloaded" &&
        (candidate.bytesDownloaded !== 0 ||
          candidate.verifiedAssetIds.length !== 0 ||
          failureCode !== null)) ||
      (status === "available" &&
        (candidate.bytesDownloaded !== candidate.totalBytes ||
          candidate.verifiedAssetIds.length === 0 ||
          failureCode !== null)) ||
      (status === "failed" && failureCode === null) ||
      (status !== "failed" && failureCode !== null)
    ) {
      return null;
    }
    return candidate as OfflinePackageRecord;
  } catch {
    return null;
  }
}

export function createOfflineStateStore(
  storage: StorageAdapter = AsyncStorage,
): OfflineStateStore {
  return {
    async load(packageId) {
      const value = await storage.getItem(`${PREFIX}${packageId}`);
      return value ? parseRecord(value) : null;
    },
    async save(record) {
      await storage.setItem(
        `${PREFIX}${record.packageId}`,
        JSON.stringify(record),
      );
    },
  };
}

export { parseRecord as parseOfflinePackageRecord };
