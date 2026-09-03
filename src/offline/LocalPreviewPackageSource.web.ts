import Constants from "expo-constants";
import type {
  OfflineAssetManifestEntry,
  PackageSource,
} from "@/domain/offline/types";

export function isLocalQaHost(hostname: string): boolean {
  return hostname === "localhost" || hostname === "127.0.0.1";
}

export function createLocalPreviewPackageSource(
  location: Pick<Location, "hostname"> = window.location,
  surface = Constants.expoConfig?.extra?.buildSurface,
): PackageSource {
  const enabled =
    process.env.NODE_ENV !== "production" &&
    surface === "qa" &&
    isLocalQaHost(location.hostname);
  return {
    kind: enabled ? "local-qa" : "unavailable",
    canDownload: false,
    async transfer(_asset: OfflineAssetManifestEntry) {
      throw new Error(
        enabled
          ? "LOCAL QA SOURCE is read-only; mobile download storage is in production."
          : "Offline delivery is not configured.",
      );
    },
  };
}
