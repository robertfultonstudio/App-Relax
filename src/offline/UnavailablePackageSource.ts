import type { PackageSource } from "@/domain/offline/types";

export const unavailablePackageSource: PackageSource = {
  kind: "unavailable",
  canDownload: false,
  async transfer() {
    throw new Error("Offline delivery is not configured.");
  },
};
