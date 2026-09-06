import { Asset } from "expo-asset";
import { CONSUMER_ASSETS } from "@/audio/reactNativeAudioApi/consumerAssets";
import { STEM_ASSETS } from "@/audio/reactNativeAudioApi/stemAssets";
import type { ConsumerAudioWork } from "@/domain/audio/consumerTypes";
import type { StemAssetKey } from "@/domain/audio/types";
import {
  resolveLocalPreviewWork,
  type WebAudioSourceResolver,
} from "./WebAudioSourceResolver";

export class MetroWebAudioSourceResolver implements WebAudioSourceResolver {
  resolveStem(assetKey: StemAssetKey): string | null {
    return Asset.fromModule(STEM_ASSETS[assetKey].moduleId).uri || null;
  }

  resolveWork(work: ConsumerAudioWork): string | null {
    const descriptor = CONSUMER_ASSETS[work.assetKey];
    return descriptor
      ? Asset.fromModule(descriptor.moduleId).uri || null
      : resolveLocalPreviewWork(work);
  }
}
