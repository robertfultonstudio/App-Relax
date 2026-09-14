import manifest from "@/content/nativeAudioManifest.json";
import { NativeCatalogStore } from "./NativeCatalogStore";
import { ExpoPrivateCatalogPort } from "./ExpoPrivateCatalogPort";
import { setVerifiedNativeWorkIds } from "./nativeCatalogAvailability";

let store: NativeCatalogStore | undefined;
export function getNativeCatalog(): NativeCatalogStore {
  return (store ??= new NativeCatalogStore(
    manifest.files,
    new ExpoPrivateCatalogPort(),
    setVerifiedNativeWorkIds,
  ));
}
