import type { ConsumerAudioWork } from "@/domain/audio/consumerTypes";
import type { StemAssetKey } from "@/domain/audio/types";
import { getPwaOfflineDownloads } from "@/offline/PwaOfflineDownloads";
import {
  resolveLocalPreviewWork,
  awaitWebAudioSource,
  type WebAudioSourceResolver,
} from "./WebAudioSourceResolver";

export class PwaWebAudioSourceResolver implements WebAudioSourceResolver {
  resolveStem(_assetKey: StemAssetKey): string | null {
    return null;
  }

  resolveWork(work: ConsumerAudioWork): string | null {
    return resolveLocalPreviewWork(work);
  }

  async acquireWork(work: ConsumerAudioWork, signal?: AbortSignal) {
    const local = await awaitWebAudioSource(
      () => getPwaOfflineDownloads().acquire(work.id),
      signal,
    );
    if (local) return local;
    return awaitWebAudioSource(() => this.resolveWork(work), signal);
  }
}
