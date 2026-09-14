import { TextDecoder } from "node:util";
import { IncrementalSha256 } from "@/offline/IncrementalSha256";
import { PwaFlacIndexStore } from "@/pwa-review/PwaFlacIndexStore";

Object.assign(globalThis, { TextDecoder });
const index = {
  version: 1,
  file: "rain.flac",
  bytes: 52,
  totalFrames: 4096,
  sampleRate: 48000,
  channels: 2,
  bitDepth: 24,
  entries: [[0, 42, 10, 4096]],
};
const bytes = Uint8Array.from(JSON.stringify(index), (c) => c.charCodeAt(0));
const approved = {
  filename: index.file,
  sourceSha256: "a".repeat(64),
  bytes: index.bytes,
  totalFrames: index.totalFrames,
  indexSha256: new IncrementalSha256().update(bytes).digestHex(),
  indexBytes: bytes.length,
};
function response(payload = bytes, status = 200) {
  let done = false;
  return {
    status,
    body: {
      cancel: jest.fn(),
      getReader: () => ({
        cancel: jest.fn(),
        read: async () =>
          done
            ? { done: true }
            : ((done = true), { done: false, value: payload }),
      }),
    },
  } as unknown as Response;
}
const signal = () => new AbortController().signal;

it("loads only the selected index, checks its hash, and reuses a verified result", async () => {
  const fetcher = jest.fn(async () => response());
  const store = new PwaFlacIndexStore(fetcher as typeof fetch, [approved]);
  expect(fetcher).not.toHaveBeenCalled();
  expect(await store.get("rain.flac", signal())).toEqual(index);
  expect(await store.get("rain.flac", signal())).toEqual(index);
  expect(fetcher).toHaveBeenCalledTimes(1);
  expect(fetcher).toHaveBeenCalledWith(
    `/flac-index/${approved.indexSha256}.json`,
    expect.objectContaining({ credentials: "same-origin" }),
  );
});
it("rejects corruption, truncated and oversized indexes without caching a failure", async () => {
  for (const payload of [
    bytes.slice(1),
    new Uint8Array(bytes.length + 1),
    Uint8Array.from(bytes, (b, i) => (i === 0 ? b + 1 : b)),
  ]) {
    const fetcher = jest
      .fn()
      .mockResolvedValueOnce(response(payload))
      .mockResolvedValueOnce(response());
    const store = new PwaFlacIndexStore(fetcher, [approved]);
    await expect(store.get("rain.flac", signal())).rejects.toThrow();
    await expect(store.get("rain.flac", signal())).resolves.toEqual(index);
  }
});
it("rejects unapproved, changed metadata and aborted loads", async () => {
  const fetcher = jest.fn(async () => response());
  const store = new PwaFlacIndexStore(fetcher as typeof fetch, [
    { ...approved, totalFrames: 1 },
  ]);
  await expect(store.get("unknown.flac", signal())).rejects.toThrow(
    "No verified",
  );
  const abort = new AbortController();
  abort.abort();
  await expect(store.get("rain.flac", abort.signal)).rejects.toThrow(
    "cancelled",
  );
  expect(fetcher).not.toHaveBeenCalled();
  await expect(store.get("rain.flac", signal())).rejects.toThrow("differs");
});
