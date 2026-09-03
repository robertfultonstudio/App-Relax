import {
  createLocalPreviewPackageSource,
  isLocalQaHost,
} from "@/offline/LocalPreviewPackageSource.web";

describe("local preview package source boundary", () => {
  it("recognises only loopback hosts", () => {
    expect(isLocalQaHost("localhost")).toBe(true);
    expect(isLocalQaHost("127.0.0.1")).toBe(true);
    expect(isLocalQaHost("example.com")).toBe(false);
  });

  it("never pretends the read-only listening folder is offline delivery", () => {
    expect(
      createLocalPreviewPackageSource({ hostname: "localhost" }, "qa"),
    ).toMatchObject({
      kind: "local-qa",
      canDownload: false,
    });
    expect(
      createLocalPreviewPackageSource({ hostname: "example.com" }, "qa"),
    ).toMatchObject({
      kind: "unavailable",
      canDownload: false,
    });
    expect(
      createLocalPreviewPackageSource({ hostname: "localhost" }, "consumer"),
    ).toMatchObject({ kind: "unavailable", canDownload: false });
  });
});
