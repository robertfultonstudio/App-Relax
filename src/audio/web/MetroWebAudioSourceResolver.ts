import { Asset } from "expo-asset";
import type { ConsumerAudioWork } from "@/domain/audio/consumerTypes";
import type { StemAssetKey } from "@/domain/audio/types";
import {
  resolveLocalPreviewWork,
  type WebAudioSourceResolver,
} from "./WebAudioSourceResolver";

export class MetroWebAudioSourceResolver implements WebAudioSourceResolver {
  constructor(
    private readonly technicalAssets?: Readonly<
      Record<StemAssetKey, { moduleId: number; md5: string }>
    >,
  ) {}

  resolveStem(assetKey: StemAssetKey): string | null {
    const descriptor = this.technicalAssets?.[assetKey];
    return descriptor
      ? Asset.fromModule(descriptor.moduleId).uri || null
      : null;
  }

  resolveWork(work: ConsumerAudioWork): string | null {
    if (work.availability.startsWith("embedded-") && !this.technicalAssets)
      return null;
    const descriptor = this.technicalAssets?.[work.assetKey as StemAssetKey];
    return descriptor
      ? Asset.fromModule(descriptor.moduleId).uri || null
      : resolveLocalPreviewWork(work);
  }
}
