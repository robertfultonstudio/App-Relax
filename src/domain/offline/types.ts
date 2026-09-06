export type OfflinePackageStatus =
  | "not-downloaded"
  | "queued"
  | "downloading"
  | "verifying"
  | "available"
  | "removing"
  | "failed";

export type OfflineFailureCode =
  | "insufficient-space"
  | "integrity-mismatch"
  | "source-unavailable"
  | "storage-error"
  | "cancelled"
  | "network-error"
  | "interrupted";

export interface OfflineAssetManifestEntry {
  assetId: string;
  workId: string;
  objectKey: string;
  bytes: number;
  sha256: string;
  mediaType: "audio/flac" | "audio/wav";
}

export interface OfflinePackageManifestEntry {
  packageId: string;
  revision: string;
  title: string;
  assetIds: readonly string[];
  totalBytes: number;
}

export interface OfflineCatalogManifest {
  schemaVersion: 1;
  catalogRevision: string;
  assets: readonly OfflineAssetManifestEntry[];
  packages: readonly OfflinePackageManifestEntry[];
}

export interface OfflinePackageRecord {
  schemaVersion: 2;
  packageId: string;
  revision: string;
  catalogRevision: string;
  status: OfflinePackageStatus;
  bytesDownloaded: number;
  totalBytes: number;
  verifiedAssetIds: readonly string[];
  attempt: number;
  failureCode: OfflineFailureCode | null;
}

export interface OfflineStateStore {
  load(packageId: string): Promise<OfflinePackageRecord | null>;
  save(record: OfflinePackageRecord): Promise<void>;
}

export interface PackageSource {
  readonly kind: "unavailable" | "local-qa" | "remote";
  readonly canDownload: boolean;
  transfer(
    asset: OfflineAssetManifestEntry,
    sink: AudioStagingSink,
    onProgress: (bytesDelta: number) => Promise<void>,
    signal?: AbortSignal,
  ): Promise<void>;
}

export interface AudioStagingSink {
  write(chunk: Uint8Array): Promise<void>;
  close(): Promise<void>;
  abort(): Promise<void>;
}

export type CommittedAssetInspection = "verified" | "missing" | "mismatch";

export interface AudioBinaryStore {
  freeBytes(): Promise<number>;
  inspectCommitted(
    asset: OfflineAssetManifestEntry,
  ): Promise<CommittedAssetInspection>;
  openStagingSink(
    asset: OfflineAssetManifestEntry,
    attempt: number,
  ): Promise<AudioStagingSink>;
  verifyStaged(
    asset: OfflineAssetManifestEntry,
    attempt: number,
  ): Promise<boolean>;
  promoteAttempt(
    assets: readonly OfflineAssetManifestEntry[],
    attempt: number,
  ): Promise<void>;
  rollbackAttempt(
    assets: readonly OfflineAssetManifestEntry[],
    attempt: number,
  ): Promise<void>;
  removePackage(assets: readonly OfflineAssetManifestEntry[]): Promise<void>;
}
