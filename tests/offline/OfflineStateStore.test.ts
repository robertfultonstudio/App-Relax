import { parseOfflinePackageRecord } from "@/offline/OfflineStateStore";

describe("offline state parsing", () => {
  it("accepts valid versioned state", () => {
    expect(
      parseOfflinePackageRecord(
        JSON.stringify({
          schemaVersion: 2,
          packageId: "pack",
          revision: "1",
          catalogRevision: "catalog-1",
          status: "available",
          bytesDownloaded: 25,
          totalBytes: 25,
          verifiedAssetIds: ["a"],
          attempt: 1,
          failureCode: null,
        }),
      ),
    ).toMatchObject({ status: "available" });
  });

  it("rejects corrupt states, unknown enums and invalid bounds", () => {
    expect(parseOfflinePackageRecord("not json")).toBeNull();
    expect(
      parseOfflinePackageRecord(
        JSON.stringify({
          schemaVersion: 2,
          packageId: "pack",
          revision: "1",
          catalogRevision: "catalog-1",
          status: "pretend-ready",
          bytesDownloaded: -1,
          totalBytes: 25,
          verifiedAssetIds: [],
          attempt: 0,
          failureCode: null,
        }),
      ),
    ).toBeNull();
    expect(
      parseOfflinePackageRecord(
        JSON.stringify({
          schemaVersion: 2,
          packageId: "pack",
          revision: "1",
          catalogRevision: "catalog-1",
          status: "available",
          bytesDownloaded: 24,
          totalBytes: 25,
          verifiedAssetIds: ["a", "a"],
          attempt: 0.5,
          failureCode: null,
        }),
      ),
    ).toBeNull();
    expect(
      parseOfflinePackageRecord(
        JSON.stringify({
          schemaVersion: 2,
          packageId: "pack",
          revision: "1",
          catalogRevision: "catalog-1",
          status: "failed",
          bytesDownloaded: null,
          totalBytes: 25,
          verifiedAssetIds: [],
          attempt: 1,
          failureCode: null,
        }),
      ),
    ).toBeNull();
  });
});
