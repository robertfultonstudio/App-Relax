import { createSameOriginPackageSource } from "@/offline/SameOriginPackageSource";
import type { OfflineAssetManifestEntry } from "@/domain/offline/types";

const asset: OfflineAssetManifestEntry = {
  assetId: "audio.a",
  workId: "a",
  objectKey: "A.flac",
  bytes: 300_000,
  sha256: "a".repeat(64),
  mediaType: "audio/flac",
};
function setup(
  options: { status?: number; length?: number; mime?: string } = {},
) {
  let sent = false;
  const reader = {
    read: jest.fn(async () => {
      const done = sent;
      sent = true;
      return { done, value: done ? undefined : new Uint8Array(asset.bytes) };
    }),
    cancel: jest.fn(async () => {}),
    releaseLock: jest.fn(),
  };
  const fetcher = jest.fn(async () => ({
    ok: (options.status ?? 200) === 200,
    status: options.status ?? 200,
    headers: {
      get: (name: string) =>
        name === "content-length"
          ? String(options.length ?? asset.bytes)
          : (options.mime ?? "audio/flac"),
    },
    body: { getReader: () => reader },
  })) as unknown as jest.MockedFunction<typeof fetch>;
  const sink = {
    write: jest.fn(async () => {}),
    close: jest.fn(async () => {}),
    abort: jest.fn(async () => {}),
  };
  return {
    reader,
    fetcher,
    sink,
    source: createSameOriginPackageSource(fetcher),
  };
}

describe("same-origin verified download transport", () => {
  it("uses credentials only at the approved origin and backpressures bounded chunks", async () => {
    const t = setup(),
      progress = jest.fn(async () => {});
    await t.source.transfer(asset, t.sink, progress);
    expect(t.fetcher).toHaveBeenCalledWith(
      "/audio-catalog/A.flac",
      expect.objectContaining({
        credentials: "same-origin",
        redirect: "error",
        cache: "no-store",
      }),
    );
    expect(
      t.sink.write.mock.calls.map(
        (call: unknown[]) => (call[0] as Uint8Array).length,
      ),
    ).toEqual([262144, 37856]);
    expect(progress.mock.calls).toEqual([[262144], [37856]]);
    expect(t.reader.cancel).toHaveBeenCalled();
    expect(t.reader.releaseLock).toHaveBeenCalled();
  });
  it.each([
    { status: 404 },
    { status: 206 },
    { length: 300001 },
    { mime: "text/html" },
  ])("rejects incorrect responses %j", async (options) => {
    const t = setup(options);
    await expect(
      t.source.transfer(asset, t.sink, async () => {}),
    ).rejects.toThrow();
    expect(t.sink.write).not.toHaveBeenCalled();
  });
  it("rejects path traversal before making a request", async () => {
    const t = setup();
    await expect(
      t.source.transfer(
        { ...asset, objectKey: "../A.flac" },
        t.sink,
        async () => {},
      ),
    ).rejects.toThrow();
    expect(t.fetcher).not.toHaveBeenCalled();
  });
  it("cancels immediately between chunks and releases the stream", async () => {
    const t = setup(),
      controller = new AbortController();
    await expect(
      t.source.transfer(
        asset,
        t.sink,
        async () => {
          controller.abort();
        },
        controller.signal,
      ),
    ).rejects.toMatchObject({ failureCode: "cancelled" });
    expect(t.sink.write).toHaveBeenCalledTimes(1);
    expect(t.reader.cancel).toHaveBeenCalled();
  });
});
