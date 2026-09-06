import type {
  AudioBinaryStore,
  OfflineAssetManifestEntry,
  AudioStagingSink,
} from "@/domain/offline/types";
import type { VerifiedAudioFile } from "@/domain/offline/verifiedAudio";
import type { AudioFilePort } from "./BrowserAudioFiles";
import { hashBlob, IncrementalSha256 } from "./IncrementalSha256";

const INDEX_KEY = "@app-relax/audio-index/v1";
interface Entry {
  file: string;
  workId: string;
  bytes: number;
  sha256: string;
  removed: boolean;
}
type Index = Record<string, Entry>;
interface KeyValueStore {
  getItem(key: string): string | null;
  setItem(key: string, value: string): void;
}
interface Stage {
  file: string;
  bytes: number;
  hash: IncrementalSha256;
  digest?: string;
  verified: boolean;
}

/** Immutable OPFS files + one atomic localStorage pointer commit. No rename/copy of large files. */
export class BrowserAudioBinaryStore implements AudioBinaryStore {
  private readonly stages = new Map<string, Stage>();
  constructor(
    private readonly files: AudioFilePort,
    private readonly metadata: KeyValueStore,
    private readonly newId: () => string = () => crypto.randomUUID(),
    private readonly urls = {
      create: (blob: Blob) => URL.createObjectURL(blob),
      revoke: (uri: string) => URL.revokeObjectURL(uri),
    },
  ) {}

  freeBytes() {
    return this.files.freeBytes();
  }

  async inspectCommitted(asset: OfflineAssetManifestEntry) {
    const entry = this.index()[asset.assetId];
    if (!entry || entry.removed) return "missing" as const;
    if (!this.matches(entry, asset)) return "mismatch" as const;
    const blob = await this.files.read(entry.file);
    if (!blob) return "missing" as const;
    return blob.size === asset.bytes && (await hashBlob(blob)) === asset.sha256
      ? ("verified" as const)
      : ("mismatch" as const);
  }

  async openStagingSink(
    asset: OfflineAssetManifestEntry,
    attempt: number,
  ): Promise<AudioStagingSink> {
    const key = this.stageKey(asset, attempt);
    const stage: Stage = {
      file: `${this.newId()}.audio`,
      bytes: 0,
      hash: new IncrementalSha256(),
      verified: false,
    };
    this.stages.set(key, stage);
    const sink = await this.files.open(stage.file);
    return {
      write: async (chunk) => {
        if (stage.bytes + chunk.length > asset.bytes)
          throw new Error("Audio exceeds its approved byte length.");
        await sink.write(chunk);
        stage.hash.update(chunk);
        stage.bytes += chunk.length;
      },
      close: async () => {
        await sink.close();
        stage.digest = stage.hash.digestHex();
      },
      abort: async () => {
        try {
          await sink.abort();
        } finally {
          this.stages.delete(key);
        }
      },
    };
  }

  async verifyStaged(asset: OfflineAssetManifestEntry, attempt: number) {
    const stage = this.stages.get(this.stageKey(asset, attempt));
    if (!stage || stage.bytes !== asset.bytes || stage.digest !== asset.sha256)
      return false;
    const blob = await this.files.read(stage.file);
    // Independently read bytes back from disk: network digest metadata alone is not proof.
    stage.verified =
      !!blob &&
      blob.size === asset.bytes &&
      (await hashBlob(blob)) === asset.sha256;
    return stage.verified;
  }

  async promoteAttempt(
    assets: readonly OfflineAssetManifestEntry[],
    attempt: number,
  ) {
    const index = this.index();
    for (const asset of assets) {
      const stage = this.stages.get(this.stageKey(asset, attempt));
      if (!stage?.verified)
        throw new Error("Unverified audio cannot be committed.");
      index[asset.assetId] = {
        file: stage.file,
        workId: asset.workId,
        bytes: asset.bytes,
        sha256: asset.sha256,
        removed: false,
      };
    }
    this.save(index); // single synchronous, atomic metadata write, all files already durable
    for (const asset of assets)
      this.stages.delete(this.stageKey(asset, attempt));
  }

  async rollbackAttempt(
    assets: readonly OfflineAssetManifestEntry[],
    attempt: number,
  ) {
    for (const asset of assets) {
      const key = this.stageKey(asset, attempt),
        stage = this.stages.get(key);
      if (stage) {
        await this.files.remove(stage.file);
        this.stages.delete(key);
      }
    }
  }

  async removePackage(assets: readonly OfflineAssetManifestEntry[]) {
    const index = this.index();
    for (const asset of assets)
      if (index[asset.assetId])
        index[asset.assetId] = { ...index[asset.assetId], removed: true };
    this.save(index); // reversible: active leases and original bytes remain untouched
  }

  isRemoved(asset: OfflineAssetManifestEntry) {
    return this.index()[asset.assetId]?.removed ?? false;
  }

  async undoRemoval(asset: OfflineAssetManifestEntry) {
    const index = this.index(),
      entry = index[asset.assetId];
    if (!entry?.removed || !this.matches(entry, asset)) return false;
    const blob = await this.files.read(entry.file);
    if (
      !blob ||
      blob.size !== asset.bytes ||
      (await hashBlob(blob)) !== asset.sha256
    )
      return false;
    index[asset.assetId] = { ...entry, removed: false };
    this.save(index);
    return true;
  }

  async purgeRemoval(asset: OfflineAssetManifestEntry) {
    const index = this.index(),
      entry = index[asset.assetId];
    if (!entry?.removed) return true;
    if (!(await this.files.removeIfUnused(entry.file))) return false;
    delete index[asset.assetId];
    this.save(index);
    return true;
  }

  async acquire(
    asset: OfflineAssetManifestEntry,
  ): Promise<VerifiedAudioFile | null> {
    const entry = this.index()[asset.assetId];
    if (!entry || entry.removed || !this.matches(entry, asset)) return null;
    const unlock = await this.files.lease(entry.file);
    try {
      const blob = await this.files.read(entry.file);
      if (
        !blob ||
        blob.size !== asset.bytes ||
        (await hashBlob(blob)) !== asset.sha256
      ) {
        unlock();
        return null;
      }
      const uri = this.urls.create(blob.slice(0, blob.size, asset.mediaType));
      let released = false;
      return {
        uri,
        workId: asset.workId,
        sha256: asset.sha256,
        byteSize: blob.size,
        release: () => {
          if (!released) {
            released = true;
            this.urls.revoke(uri);
            unlock();
          }
        },
      };
    } catch (error) {
      unlock();
      throw error;
    }
  }

  /** Only unreferenced files owned by this app; invoke under the origin mutation lock. */
  async recoverOrphans() {
    const referenced = new Set(
      Object.values(this.index()).map((entry) => entry.file),
    );
    for (const name of await this.files.list())
      if (!referenced.has(name)) await this.files.removeIfUnused(name);
  }

  private matches(entry: Entry, asset: OfflineAssetManifestEntry) {
    return (
      entry.workId === asset.workId &&
      entry.bytes === asset.bytes &&
      entry.sha256 === asset.sha256
    );
  }
  private stageKey(asset: OfflineAssetManifestEntry, attempt: number) {
    return `${asset.assetId}:${attempt}`;
  }
  private save(index: Index) {
    this.metadata.setItem(INDEX_KEY, JSON.stringify(index));
  }
  private index(): Index {
    const raw = this.metadata.getItem(INDEX_KEY);
    if (!raw) return {};
    const value: unknown = JSON.parse(raw);
    if (!value || typeof value !== "object" || Array.isArray(value))
      throw new Error(
        "Offline index is invalid. Browser storage needs recovery.",
      );
    for (const [key, candidate] of Object.entries(value)) {
      const item = candidate as Partial<Entry> | null;
      if (
        !key.startsWith("audio.") ||
        !item ||
        !/^[a-f0-9-]+\.audio$/.test(item.file ?? "") ||
        !/^[a-f0-9]{64}$/.test(item.sha256 ?? "") ||
        !Number.isSafeInteger(item.bytes) ||
        Number(item.bytes) <= 0 ||
        typeof item.workId !== "string" ||
        typeof item.removed !== "boolean"
      )
        throw new Error(
          "Offline index is invalid. Browser storage needs recovery.",
        );
    }
    return value as Index;
  }
}
