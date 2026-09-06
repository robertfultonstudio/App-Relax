import type {
  OfflinePackageRecord,
  OfflineStateStore,
} from "@/domain/offline/types";
import type { VerifiedAudioFileResolver } from "@/domain/offline/verifiedAudio";
import { APPROVED_DOWNLOAD_MANIFEST } from "./approvedDownloads";
import { BrowserAudioBinaryStore } from "./BrowserAudioBinaryStore";
import { BrowserAudioFiles } from "./BrowserAudioFiles";
import { OfflinePackageManager } from "./OfflinePackageManager";
import { parseOfflinePackageRecord } from "./OfflineStateStore";
import { createSameOriginPackageSource } from "./SameOriginPackageSource";

export interface DownloadSnapshot {
  record: OfflinePackageRecord;
  supported: boolean;
  busy: boolean;
  removed: boolean;
  freeBytes: number | null;
  persistent: boolean | null;
  error: string | null;
}

export class PwaOfflineDownloads implements VerifiedAudioFileResolver {
  readonly manifest = APPROVED_DOWNLOAD_MANIFEST;
  private readonly snapshots = new Map<string, DownloadSnapshot>();
  private readonly serverSnapshots = new Map<string, DownloadSnapshot>();
  private readonly listeners = new Set<() => void>();
  private binary: BrowserAudioBinaryStore | null = null;
  private manager: OfflinePackageManager | null = null;
  private abortController: AbortController | null = null;
  private recovered = false;
  private queue: Promise<unknown> = Promise.resolve();

  constructor() {
    const supported =
      typeof window !== "undefined" &&
      window.isSecureContext &&
      typeof Worker !== "undefined" &&
      !!navigator.storage?.getDirectory &&
      !!navigator.storage.estimate &&
      !!navigator.locks;
    for (const entry of this.manifest.packages) {
      this.snapshots.set(entry.packageId, {
        supported,
        busy: false,
        removed: false,
        freeBytes: null,
        persistent: null,
        error: null,
        record: {
          schemaVersion: 2,
          packageId: entry.packageId,
          revision: entry.revision,
          catalogRevision: this.manifest.catalogRevision,
          status: "not-downloaded",
          bytesDownloaded: 0,
          totalBytes: entry.totalBytes,
          verifiedAssetIds: [],
          attempt: 0,
          failureCode: null,
        },
      });
      this.serverSnapshots.set(entry.packageId, {
        ...this.getSnapshot(entry.packageId),
        supported: false,
      });
    }
  }

  subscribe = (listener: () => void) => {
    this.listeners.add(listener);
    return () => {
      this.listeners.delete(listener);
    };
  };
  getSnapshot = (packageId: string): DownloadSnapshot => {
    const value = this.snapshots.get(packageId);
    if (!value) throw new Error("This sound is not approved for download.");
    return value;
  };
  getServerSnapshot = (packageId: string): DownloadSnapshot =>
    this.serverSnapshots.get(packageId)!;

  hydrate(packageId: string) {
    return this.exclusive(packageId, async () => {
      await this.initialize();
      const assets = this.assets(packageId);
      // Package records are not authoritative: another selected package may share a file.
      const record = await this.manager!.reconcile(packageId);
      this.update(packageId, {
        record,
        removed: assets.some((asset) => this.binary!.isRemoved(asset)),
        freeBytes: await this.binary!.freeBytes(),
        persistent: await navigator.storage.persisted(),
      });
    });
  }

  /** Only explicit UI actions call this. Packages are processed serially, not all-catalog by default. */
  download(packageIds: readonly string[]) {
    const uniqueIds = [...new Set(packageIds)];
    for (const id of uniqueIds) this.getSnapshot(id);
    return this.exclusive(uniqueIds[0], async () => {
      await this.initialize();
      this.abortController = new AbortController();
      try {
        // Best effort only; denial never changes integrity or fabricates durable storage.
        const persistent = await navigator.storage.persist().catch(() => false);
        for (const id of uniqueIds) {
          if (this.abortController.signal.aborted) break;
          this.update(id, { busy: true, error: null, persistent });
          const record = await this.manager!.download(
            id,
            this.abortController.signal,
          );
          this.update(id, {
            record,
            removed: false,
            busy: false,
            freeBytes: await this.binary!.freeBytes(),
          });
          if (record.status === "failed") break;
        }
      } finally {
        this.abortController = null;
      }
    });
  }

  cancel = () => {
    this.abortController?.abort();
  };

  remove(packageId: string) {
    return this.exclusive(packageId, async () => {
      await this.initialize();
      const record = await this.manager!.remove(packageId);
      this.update(packageId, {
        record,
        removed: record.status === "not-downloaded",
      });
    });
  }

  undoRemoval(packageId: string) {
    return this.exclusive(packageId, async () => {
      await this.initialize();
      for (const asset of this.assets(packageId)) {
        if (
          this.binary!.isRemoved(asset) &&
          !(await this.binary!.undoRemoval(asset))
        )
          throw new Error(
            "The removed copy is missing or incomplete. Download it again.",
          );
      }
      const record = await this.manager!.reconcile(packageId);
      this.update(packageId, { record, removed: false });
    });
  }

  purgeRemoval(packageId: string) {
    return this.exclusive(packageId, async () => {
      await this.initialize();
      for (const asset of this.assets(packageId))
        if (!(await this.binary!.purgeRemoval(asset)))
          throw new Error(
            "This sound is still in use. Stop playback, then free its space.",
          );
      this.update(packageId, {
        removed: false,
        freeBytes: await this.binary!.freeBytes(),
      });
    });
  }

  async acquire(workId: string) {
    const asset = this.manifest.assets.find(
      (candidate) => candidate.workId === workId,
    );
    if (!asset || !this.getSnapshot(workId).supported) return null;
    try {
      // No download or storage persistence prompt on the playback path.
      this.ensureStores();
      return await this.binary!.acquire(asset);
    } catch {
      return null;
    }
  }

  private assets(packageId: string) {
    const entry = this.manifest.packages.find(
      (item) => item.packageId === packageId,
    );
    if (!entry) throw new Error("Unapproved download package.");
    return entry.assetIds.map((id) =>
      this.manifest.assets.find((asset) => asset.assetId === id)!,
    );
  }

  private ensureStores() {
    if (this.binary) return;
    this.binary = new BrowserAudioBinaryStore(
      new BrowserAudioFiles(),
      window.localStorage,
    );
    const state: OfflineStateStore = {
      load: async (id) => {
        const value = window.localStorage.getItem(
          `@app-relax/pwa-download/${id}`,
        );
        return value ? parseOfflinePackageRecord(value) : null;
      },
      save: async (record) => {
        window.localStorage.setItem(
          `@app-relax/pwa-download/${record.packageId}`,
          JSON.stringify(record),
        );
        this.update(record.packageId, { record });
      },
    };
    this.manager = new OfflinePackageManager(
      this.manifest,
      state,
      this.binary,
      createSameOriginPackageSource(),
    );
  }

  private async initialize() {
    this.ensureStores();
    if (!this.recovered) {
      await this.binary!.recoverOrphans();
      this.recovered = true;
    }
  }

  private exclusive(
    packageId: string | undefined,
    operation: () => Promise<void>,
  ) {
    if (!packageId) return Promise.resolve();
    if (!this.getSnapshot(packageId).supported) {
      this.update(packageId, {
        error:
          "Offline downloads need a secure browser with private file storage, storage estimates and file locks. Online listening remains available.",
      });
      return Promise.resolve();
    }
    const run = this.queue.then(() =>
      navigator.locks.request("app-relax-audio-mutation", async () => {
        this.update(packageId, { busy: true, error: null });
        try {
          await operation();
        } catch (error) {
          this.update(packageId, {
            record: {
              ...this.getSnapshot(packageId).record,
              status: "failed",
              failureCode: "storage-error",
            },
            error:
              error instanceof Error
                ? error.message
                : "Browser storage could not be used. Retry when storage is available.",
          });
        } finally {
          this.update(packageId, { busy: false });
        }
      }),
    );
    this.queue = run.catch(() => undefined);
    return run;
  }

  private update(id: string, values: Partial<DownloadSnapshot>) {
    this.snapshots.set(id, { ...this.getSnapshot(id), ...values });
    for (const listener of this.listeners) listener();
  }
}

let singleton: PwaOfflineDownloads | null = null;
export function getPwaOfflineDownloads() {
  return (singleton ??= new PwaOfflineDownloads());
}
