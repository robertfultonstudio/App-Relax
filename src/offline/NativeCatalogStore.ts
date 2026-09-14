import { AUDIO_CHUNK_BYTES, IncrementalSha256 } from "./IncrementalSha256";
import type { VerifiedAudioFileResolver } from "@/domain/offline/verifiedAudio";

export interface NativeCatalogAsset {
  workId: string;
  filename: string;
  sha256: string;
  bytes: number;
  frames: number;
}
export interface PrivateFileStamp {
  bytes: number;
  modified: number;
}
export interface PrivateCatalogPort {
  initialize(): Promise<void>;
  stat(key: string): Promise<PrivateFileStamp | null>;
  receipt(key: string): Promise<PrivateFileStamp | null>;
  saveReceipt(key: string, stamp: PrivateFileStamp): Promise<void>;
  freeBytes(): number;
  copy(sourceUri: string, key: string): Promise<void>;
  read(key: string, offset: number, bytes: number): Promise<Uint8Array>;
  move(from: string, to: string): Promise<void>;
  remove(key: string): Promise<void>;
  uri(key: string): string;
  yield(): Promise<void>;
}
export interface CatalogImportSource {
  filename: string;
  uri: string;
}
export interface NativeCatalogSnapshot {
  initialized: boolean;
  busy: boolean;
  ready: number;
  total: number;
  checkedBytes: number;
  totalBytes: number;
  error: string | null;
}

/** Only immutable app-private files can be leased. Hash once at import; on each
 * acquire match the receipt and private-file stamp. This is not a bit-rot scan.
 * Neither the imported folder nor an imported manifest is a trust authority. */
export class NativeCatalogStore implements VerifiedAudioFileResolver {
  private readonly ready = new Map<string, PrivateFileStamp>();
  private readonly leases = new Map<string, number>();
  private readonly listeners = new Set<() => void>();
  private initializing: Promise<void> | null = null;
  private cancelled = false;
  private snapshot: NativeCatalogSnapshot;
  constructor(
    readonly assets: readonly NativeCatalogAsset[],
    private readonly port: PrivateCatalogPort,
    private readonly availability: (ids: readonly string[]) => void = () => {},
  ) {
    if (
      new Set(assets.map((a) => a.workId)).size !== assets.length ||
      new Set(assets.map((a) => a.sha256)).size !== assets.length ||
      assets.some(
        (a) =>
          !/^[a-f0-9]{64}$/.test(a.sha256) ||
          !/^[\w .-]+\.(flac|wav)$/.test(a.filename) ||
          !Number.isSafeInteger(a.bytes) ||
          a.bytes <= 0,
      )
    )
      throw new Error("Invalid bundled audio manifest.");
    this.snapshot = {
      initialized: false,
      busy: false,
      ready: 0,
      total: assets.length,
      checkedBytes: 0,
      totalBytes: assets.reduce((s, a) => s + a.bytes, 0),
      error: null,
    };
  }
  subscribe = (listener: () => void) => {
    this.listeners.add(listener);
    return () => {
      this.listeners.delete(listener);
    };
  };
  getSnapshot = () => this.snapshot;
  private emit(patch: Partial<NativeCatalogSnapshot> = {}) {
    this.availability([...this.ready.keys()]);
    this.snapshot = { ...this.snapshot, ...patch, ready: this.ready.size };
    for (const listener of this.listeners) listener();
  }
  private key(asset: NativeCatalogAsset) {
    return `${asset.sha256}.${asset.filename.endsWith(".flac") ? "flac" : "wav"}`;
  }
  private matches(
    asset: NativeCatalogAsset,
    a: PrivateFileStamp | null,
    b: PrivateFileStamp | null,
  ): a is PrivateFileStamp {
    return (
      !!a &&
      !!b &&
      Number.isFinite(a.modified) &&
      a.bytes === asset.bytes &&
      a.bytes === b.bytes &&
      a.modified === b.modified
    );
  }
  initialize(): Promise<void> {
    if (!this.initializing)
      this.initializing = this.hydrate().catch((error) => {
        this.initializing = null;
        this.emit({ error: "Could not check device storage. Please retry." });
        throw error;
      });
    return this.initializing;
  }
  private async hydrate() {
    await this.port.initialize();
    for (const asset of this.assets) {
      const key = this.key(asset),
        stamp = await this.port.stat(key);
      if (this.matches(asset, stamp, await this.port.receipt(key)))
        this.ready.set(asset.workId, stamp);
    }
    this.emit({
      initialized: true,
      checkedBytes: this.assets
        .filter((a) => this.ready.has(a.workId))
        .reduce((s, a) => s + a.bytes, 0),
    });
  }
  cancel = () => {
    this.cancelled = true;
  };
  async importSources(sources: readonly CatalogImportSource[]): Promise<void> {
    await this.initialize();
    if (this.snapshot.busy) throw new Error("An import is already running.");
    this.cancelled = false;
    this.emit({ busy: true, error: null });
    let temporary: string | null = null;
    try {
      const pending = this.assets.filter((a) => !this.ready.has(a.workId));
      const map = new Map(sources.map((s) => [s.filename, s.uri]));
      if (
        map.size !== sources.length ||
        pending.some((a) => !map.has(a.filename))
      )
        throw new Error(
          "Choose the AppRelaxAudio folder containing all 47 audio files. Verified files are kept.",
        );
      const required =
        pending.reduce((n, a) => n + a.bytes, 0) + 64 * 1024 * 1024;
      if (
        !Number.isFinite(this.port.freeBytes()) ||
        this.port.freeBytes() < required
      )
        throw new Error(
          `Not enough free storage. Free at least ${(required / 1e9).toFixed(2)} GB, then retry.`,
        );
      let done = this.assets
        .filter((a) => this.ready.has(a.workId))
        .reduce((s, a) => s + a.bytes, 0);
      for (const asset of pending) {
        if (this.cancelled)
          throw new Error(
            "Import cancelled. Verified recordings are kept; choose the folder again to continue.",
          );
        const key = this.key(asset);
        temporary = `${key}.part`;
        // These are only our own staging files; never delete anything in the selected folder.
        await this.port.remove(temporary);
        await this.port.copy(map.get(asset.filename)!, temporary);
        if ((await this.port.stat(temporary))?.bytes !== asset.bytes)
          throw new Error(`Incomplete audio file: ${asset.filename}`);
        const hash = new IncrementalSha256();
        for (
          let offset = 0;
          offset < asset.bytes;
          offset += AUDIO_CHUNK_BYTES
        ) {
          if (this.cancelled)
            throw new Error("Import cancelled. Verified recordings are kept.");
          const count = Math.min(AUDIO_CHUNK_BYTES, asset.bytes - offset);
          const bytes = await this.port.read(temporary, offset, count);
          if (bytes.length !== count)
            throw new Error(`Incomplete audio file: ${asset.filename}`);
          hash.update(bytes);
          this.emit({ checkedBytes: done + offset + count });
          await this.port.yield();
        }
        if (hash.digestHex() !== asset.sha256)
          throw new Error(
            `Audio integrity check failed: ${asset.filename}. Copy the original kit again.`,
          );
        if (this.leases.get(asset.workId))
          throw new Error("Stop playback before replacing an audio file.");
        await this.port.remove(key); // Unattested private copy from an interrupted/invalid prior import only.
        await this.port.move(temporary, key);
        temporary = null;
        const stamp = await this.port.stat(key);
        if (
          !stamp ||
          stamp.bytes !== asset.bytes ||
          !Number.isFinite(stamp.modified)
        )
          throw new Error("Could not verify the saved audio file.");
        await this.port.saveReceipt(key, stamp);
        this.ready.set(asset.workId, stamp);
        done += asset.bytes;
        this.emit({ checkedBytes: done });
      }
    } catch (error) {
      this.emit({
        error:
          error instanceof Error
            ? error.message
            : "Import failed. Please retry.",
      });
    } finally {
      try {
        if (temporary) await this.port.remove(temporary);
      } finally {
        this.emit({ busy: false });
      }
    }
  }
  async acquire(workId: string) {
    await this.initialize();
    const asset = this.assets.find((a) => a.workId === workId),
      receipt = this.ready.get(workId);
    if (!asset || !receipt) return null;
    const key = this.key(asset);
    // Reserve before awaiting stat, so removal cannot race this acquisition.
    this.leases.set(workId, (this.leases.get(workId) ?? 0) + 1);
    let released = false;
    const release = () => {
      if (!released) {
        released = true;
        this.leases.set(
          workId,
          Math.max(0, (this.leases.get(workId) ?? 1) - 1),
        );
      }
    };
    try {
      const stamp = await this.port.stat(key);
      if (!this.matches(asset, stamp, receipt)) {
        this.ready.delete(workId);
        this.emit({
          error:
            "A saved recording changed or is missing. Import the audio folder again.",
        });
        release();
        return null;
      }
      return {
        workId,
        uri: this.port.uri(key),
        sha256: asset.sha256,
        byteSize: asset.bytes,
        release,
      };
    } catch (error) {
      release();
      throw error;
    }
  }
}
