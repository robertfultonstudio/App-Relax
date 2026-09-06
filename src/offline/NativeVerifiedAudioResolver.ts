import type { OfflineCatalogManifest } from "@/domain/offline/types";
import type {
  VerifiedAudioFile,
  VerifiedAudioFileResolver,
} from "@/domain/offline/verifiedAudio";
import { AUDIO_CHUNK_BYTES, IncrementalSha256 } from "./IncrementalSha256";

/** Implement with the authorized native private file adapter; never HTTP or external master paths. */
export interface NativePrivateAudioFiles {
  find(workId: string): Promise<string | null>;
  lease(uri: string): Promise<() => void | Promise<void>>;
  size(uri: string): Promise<number>;
  read(uri: string, offset: number, bytes: number): Promise<Uint8Array>;
}

export class NativeVerifiedAudioResolver implements VerifiedAudioFileResolver {
  constructor(
    private readonly manifest: OfflineCatalogManifest,
    private readonly files: NativePrivateAudioFiles,
  ) {}
  async acquire(workId: string): Promise<VerifiedAudioFile | null> {
    const asset = this.manifest.assets.find((entry) => entry.workId === workId);
    if (!asset) return null;
    const uri = await this.files.find(workId);
    if (!uri || !/^file:\/\/\//.test(uri) || uri.includes("/../")) return null;
    const release = await this.files.lease(uri);
    try {
      if ((await this.files.size(uri)) !== asset.bytes) {
        await release();
        return null;
      }
      const hash = new IncrementalSha256();
      for (let offset = 0; offset < asset.bytes; offset += AUDIO_CHUNK_BYTES) {
        const count = Math.min(AUDIO_CHUNK_BYTES, asset.bytes - offset);
        const bytes = await this.files.read(uri, offset, count);
        if (bytes.length !== count) {
          await release();
          return null;
        }
        hash.update(bytes);
      }
      if (hash.digestHex() !== asset.sha256) {
        await release();
        return null;
      }
      let released = false;
      return {
        uri,
        workId,
        sha256: asset.sha256,
        byteSize: asset.bytes,
        release: async () => {
          if (!released) {
            released = true;
            await release();
          }
        },
      };
    } catch (error) {
      await release();
      throw error;
    }
  }
}
