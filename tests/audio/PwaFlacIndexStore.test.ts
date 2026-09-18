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

it("shares one cold index request across preparation and source open", async () => {
  let ready!: (value: Response) => void;
  const fetcher = jest.fn(
    () =>
      new Promise<Response>((resolve) => {
        ready = resolve;
      }),
  );
  const store = new PwaFlacIndexStore(fetcher as typeof fetch, [approved]);
  const first = store.get("rain.flac", signal());
  const second = store.get("rain.flac", signal());
  expect(fetcher).toHaveBeenCalledTimes(1);
  ready(response());
  expect(await first).toEqual(index);
  expect(await second).toEqual(index);
  expect(await store.get("rain.flac", signal())).toEqual(index);
  expect(fetcher).toHaveBeenCalledTimes(1);
});

it("cancels only the withdrawing consumer, not another reader of the shared index", async () => {
  let ready!: (value: Response) => void;
  const fetcher = jest.fn(
    (_url: unknown, _init?: RequestInit) =>
      new Promise<Response>((resolve) => {
        ready = resolve;
      }),
  );
  const store = new PwaFlacIndexStore(fetcher as typeof fetch, [approved]);
  const cancel = new AbortController();
  const first = store.get("rain.flac", cancel.signal);
  const second = store.get("rain.flac", signal());
  cancel.abort();
  await expect(first).rejects.toThrow("cancelled");
  expect(fetcher.mock.calls[0]![1]!.signal!.aborted).toBe(false);
  ready(response());
  await expect(second).resolves.toEqual(index);
  expect(fetcher).toHaveBeenCalledTimes(1);
});

it("aborts the request when all consumers leave and lets a fresh caller retry", async () => {
  const fetcher = jest.fn(
    (_url: unknown, init?: RequestInit) =>
      new Promise<Response>((_resolve, reject) => {
        init!.signal!.addEventListener(
          "abort",
          () => reject(new Error("request aborted")),
          { once: true },
        );
      }),
  );
  const store = new PwaFlacIndexStore(fetcher as typeof fetch, [approved]);
  const cancel = new AbortController();
  const load = store.get("rain.flac", cancel.signal);
  cancel.abort();
  await expect(load).rejects.toThrow("cancelled");
  expect(fetcher.mock.calls[0]![1]!.signal!.aborted).toBe(true);
  fetcher.mockResolvedValueOnce(response());
  await expect(store.get("rain.flac", signal())).resolves.toEqual(index);
  expect(fetcher).toHaveBeenCalledTimes(2);
});

it("shares an integrity failure without poisoning the next attempt", async () => {
  let ready!: (value: Response) => void;
  const fetcher = jest.fn(
    () =>
      new Promise<Response>((resolve) => {
        ready = resolve;
      }),
  );
  const store = new PwaFlacIndexStore(fetcher as typeof fetch, [approved]);
  const first = store.get("rain.flac", signal());
  const second = store.get("rain.flac", signal());
  ready(response(bytes.slice(1)));
  await expect(first).rejects.toThrow("integrity");
  await expect(second).rejects.toThrow("integrity");
  fetcher.mockResolvedValueOnce(response());
  await expect(store.get("rain.flac", signal())).resolves.toEqual(index);
  expect(fetcher).toHaveBeenCalledTimes(2);
});

it("ignores an abandoned fetch completing after a new load of the same index begins", async () => {
  let finishOld!: (value: Response) => void;
  let finishNew!: (value: Response) => void;
  // Simulate a transport that cannot cancel a response already in flight.
  const fetcher = jest
    .fn()
    .mockImplementationOnce(
      () =>
        new Promise<Response>((resolve) => {
          finishOld = resolve;
        }),
    )
    .mockImplementationOnce(
      () =>
        new Promise<Response>((resolve) => {
          finishNew = resolve;
        }),
    );
  const store = new PwaFlacIndexStore(fetcher as typeof fetch, [approved]);
  const firstAbort = new AbortController();
  const secondAbort = new AbortController();
  const first = store.get("rain.flac", firstAbort.signal);
  const second = store.get("rain.flac", secondAbort.signal);
  firstAbort.abort();
  secondAbort.abort();
  await expect(first).rejects.toThrow("cancelled");
  await expect(second).rejects.toThrow("cancelled");
  const replacement = store.get("rain.flac", signal());
  expect(fetcher).toHaveBeenCalledTimes(2);
  finishOld(response());
  for (let i = 0; i < 20; i++) await Promise.resolve();
  let joinedFinished = false;
  const joined = store.get("rain.flac", signal());
  void joined.then(() => {
    joinedFinished = true;
  });
  for (let i = 0; i < 20; i++) await Promise.resolve();
  expect(joinedFinished).toBe(false); // The abandoned response did not populate cache.
  expect(fetcher).toHaveBeenCalledTimes(2); // Its cleanup did not remove the replacement load.
  finishNew(response());
  await expect(replacement).resolves.toEqual(index);
  await expect(joined).resolves.toEqual(index);
  await expect(store.get("rain.flac", signal())).resolves.toEqual(index);
  expect(fetcher).toHaveBeenCalledTimes(2);
});
