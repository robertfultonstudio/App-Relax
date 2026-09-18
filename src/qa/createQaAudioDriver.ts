import type { AudioGraphDriver } from "@/audio/AudioGraphDriver";
import { ReactNativeAudioDriver } from "@/audio/reactNativeAudioApi/ReactNativeAudioDriver";
import { STEM_ASSETS } from "@/audio/reactNativeAudioApi/stemAssets";
import { getNativeCatalog } from "@/offline/nativeCatalogRuntime";
import { isNativeCatalogPreview } from "@/domain/sessions/playbackAvailability";

/** QA-only entry point, physically excluded from consumer EAS archives. */
export function createAudioGraphDriver(): AudioGraphDriver {
  return new ReactNativeAudioDriver(
    isNativeCatalogPreview() ? getNativeCatalog() : undefined,
    { allowHathaPreview: isNativeCatalogPreview() },
    STEM_ASSETS,
  );
}
