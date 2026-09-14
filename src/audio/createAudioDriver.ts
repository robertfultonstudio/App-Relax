import type { AudioGraphDriver } from "./AudioGraphDriver";
import { ReactNativeAudioDriver } from "./reactNativeAudioApi/ReactNativeAudioDriver";
import { getNativeCatalog } from "@/offline/nativeCatalogRuntime";
import { isNativeCatalogPreview } from "@/domain/sessions/playbackAvailability";

export function createAudioGraphDriver(): AudioGraphDriver {
  return new ReactNativeAudioDriver(
    isNativeCatalogPreview() ? getNativeCatalog() : undefined,
    { allowHathaPreview: isNativeCatalogPreview() },
  );
}
