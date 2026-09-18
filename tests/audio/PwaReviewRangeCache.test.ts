/** @jest-environment node */
import {
  PwaReviewRangeCache,
  type ReviewByteRange,
} from "@/pwa-review/PwaReviewRangeCache";
import { reviewStartupRanges } from "@/pwa-review/reviewStartupRanges";
import {
  FlacWindowReader,
  type FlacFrameIndex,
} from "@/audio/web/FlacWindowReader";
import { ClockedWavSource } from "@/audio/web/ClockedWavSource";

const sha256 = "a".repeat(64);
const signal = () => new AbortController().signal;
const request = (start = 42, end = 51, sha = sha256): ReviewByteRange => ({
  url: "/audio.flac",
  sha256: sha,
  start,
  end,
  total: 842,
});
function response(
  r: ReviewByteRange,
  headers: Record<string, string> = {},
  length = r.end - r.start + 1,
) {
  return new Response(new Uint8Array(length).fill(7), {
    status: 206,
    headers: {
      "content-range": `bytes ${r.start}-${r.end}/${r.total}`,
      etag: '"revision-a"',
      "x-content-sha256": r.sha256,
      ...headers,
    },
  });
}
function network() {
  return jest.fn(async (_url: unknown, init?: RequestInit) => {
    const [start, end] = new Headers(init?.headers)
      .get("Range")!
      .match(/\d+/g)!
      .map(Number);
    return response(request(start, end));
  });
}
const options = (r: ReviewByteRange) => ({
  headers: { Range: `bytes=${r.start}-${r.end}` },
  signal: signal(),
});
const index: FlacFrameIndex = {
  version: 1,
  file: "audio.flac",
  bytes: 842,
  totalFrames: 80 * 48000,
  sampleRate: 48000,
  channels: 2,
  bitDepth: 24,
  entries: Array.from(
    { length: 80 },
    (_, i) => [i * 48000, 42 + i * 10, 10, 48000] as const,
  ),
};
it("plans Last5 as exact tail plus head, then serves immutable range copies with zero extra network", async () => {
  const planned = reviewStartupRanges(index, "/audio.flac", sha256, 75);
  expect(planned.map((r) => [r.start, r.end])).toEqual([
    [0, 41],
    [792, 841],
    [42, 121],
  ]);
  const fetcher = network();
  const cache = new PwaReviewRangeCache(fetcher as typeof fetch);
  expect(await cache.prepare(planned, signal())).toBe(true);
  expect(fetcher).toHaveBeenCalledTimes(3);
  expect(cache.readCounts()).toEqual({ networkReads: 0, cacheReads: 0 });
  for (const r of planned) {
    const first = await cache.fetch(r.url, options(r), sha256);
    const bytes = new Uint8Array(await first.arrayBuffer());
    bytes.fill(0); // Worker consumption/mutation cannot affect the retained data.
    const second = await cache.fetch(r.url, options(r), sha256);
    expect(
      new Uint8Array(await second.arrayBuffer()).every((x) => x === 7),
    ).toBe(true);
  }
  expect(fetcher).toHaveBeenCalledTimes(3);
  expect(cache.readCounts()).toEqual({ networkReads: 0, cacheReads: 6 });
});
it("memoizes bounded authenticated headers by URL and SHA, not by URL alone", async () => {
  const fetcher = network();
  const cache = new PwaReviewRangeCache(fetcher as typeof fetch);
  const r = request(0, 41);
  await cache.fetch(r.url, options(r), sha256);
  await cache.fetch(r.url, options(r), sha256);
  expect(fetcher).toHaveBeenCalledTimes(1);
  await expect(cache.fetch(r.url, options(r), "b".repeat(64))).rejects.toThrow(
    "identity",
  );
  expect(fetcher).toHaveBeenCalledTimes(2);
  expect(cache.readCounts()).toEqual({ networkReads: 2, cacheReads: 1 });
});
it("keeps the whole point within budget without evicting its older cached header", async () => {
  const fetcher = network(),
    cache = new PwaReviewRangeCache(fetcher as typeof fetch, 100);
  const header = request(0, 41),
    unrelated = request(42, 91),
    next = request(200, 249);
  await cache.prepare([header, unrelated], signal());
  expect(await cache.prepare([header, next], signal())).toBe(true);
  const calls = fetcher.mock.calls.length;
  await cache.fetch(header.url, options(header), sha256);
  await cache.fetch(next.url, options(next), sha256);
  expect(fetcher).toHaveBeenCalledTimes(calls);
  expect(await cache.prepare([request(0, 100)], signal())).toBe(false);
  expect(fetcher).toHaveBeenCalledTimes(calls);
});
it("reuses foreground audio ranges within the same fixed LRU budget", async () => {
  const fetcher = network();
  const cache = new PwaReviewRangeCache(fetcher as typeof fetch, 20);
  const first = request(42, 51);
  await cache.fetch(first.url, options(first), sha256);
  await cache.fetch(first.url, options(first), sha256);
  expect(fetcher).toHaveBeenCalledTimes(1);
  expect(cache.readCounts()).toEqual({ networkReads: 1, cacheReads: 1 });
  for (const r of [request(52, 61), request(62, 71)])
    await cache.fetch(r.url, options(r), sha256);
  await cache.fetch(first.url, options(first), sha256);
  expect(fetcher).toHaveBeenCalledTimes(4); // Oldest was evicted, not retained above budget.
});
it("does not cache a foreground range with invalid source identity", async () => {
  const fetcher = jest.fn(async () => response(request(), { etag: "weak" }));
  const cache = new PwaReviewRangeCache(fetcher as typeof fetch);
  for (let attempt = 0; attempt < 2; attempt++)
    await expect(
      cache.fetch(request().url, options(request()), sha256),
    ).rejects.toThrow("identity");
  expect(fetcher).toHaveBeenCalledTimes(2);
  expect(cache.readCounts().cacheReads).toBe(0);
});
it.each<Record<string, string>>([
  { etag: "weak" },
  { "x-content-sha256": "b".repeat(64) },
  { "content-range": "bytes 42-51/900" },
])(
  "rejects invalid source evidence without caching it: %j",
  async (headers) => {
    const fetcher = jest.fn(async () => response(request(), headers));
    const cache = new PwaReviewRangeCache(fetcher as typeof fetch);
    await expect(cache.prepare([request()], signal())).rejects.toThrow(
      "identity",
    );
    await expect(cache.prepare([request()], signal())).rejects.toThrow(
      "identity",
    );
    expect(fetcher).toHaveBeenCalledTimes(2);
  },
);
it.each([9, 11])(
  "rejects truncated or overlong cached body (%s bytes)",
  async (length) => {
    const cache = new PwaReviewRangeCache(
      jest.fn(async () => response(request(), {}, length)) as typeof fetch,
    );
    await expect(cache.prepare([request()], signal())).rejects.toThrow(
      /Incomplete|bound/,
    );
  },
);
it("foreground miss aborts speculative work; late completion cannot populate the cache", async () => {
  let finish!: (r: Response) => void;
  let speculativeSignal: AbortSignal | undefined;
  const fetcher = network();
  fetcher.mockImplementationOnce(async (_url, init) => {
    speculativeSignal = init?.signal ?? undefined;
    return new Promise<Response>((resolve) => {
      finish = resolve;
    });
  });
  const cache = new PwaReviewRangeCache(fetcher as typeof fetch);
  const preparing = cache.prepare([request()], signal());
  const rejected = expect(preparing).rejects.toThrow("cancelled");
  await cache.fetch("/audio.flac", options(request(52, 61)), sha256);
  expect(speculativeSignal?.aborted).toBe(true);
  finish(response(request()));
  await rejected;
  const calls = fetcher.mock.calls.length;
  await cache.fetch("/audio.flac", options(request()), sha256);
  expect(fetcher).toHaveBeenCalledTimes(calls + 1);
});
it("abort and clear are idempotent and completed windows do not survive disposal", async () => {
  const fetcher = network(),
    cache = new PwaReviewRangeCache(fetcher as typeof fetch);
  const abort = new AbortController();
  abort.abort();
  expect(await cache.prepare([request()], abort.signal)).toBe(false);
  await cache.prepare([request()], signal());
  cache.clear();
  cache.clear();
  await cache.fetch(request().url, options(request()), sha256);
  expect(fetcher).toHaveBeenCalledTimes(2);
});
it("never declares a mixed-ETag plan ready, even when its approved SHA is unchanged", async () => {
  const fetcher = network();
  fetcher.mockImplementationOnce(async () => response(request(0, 41)));
  fetcher.mockImplementationOnce(async () =>
    response(request(), { etag: '"revision-b"' }),
  );
  const cache = new PwaReviewRangeCache(fetcher as typeof fetch);
  expect(await cache.prepare([request(0, 41), request()], signal())).toBe(
    false,
  );
  const calls = fetcher.mock.calls.length;
  await cache.fetch(request().url, options(request(0, 41)), sha256);
  await cache.fetch(request().url, options(request()), sha256);
  expect(fetcher).toHaveBeenCalledTimes(calls + 2);
});

it("feeds the real reader at EOF then frame zero with identical PCM and no new fetch", async () => {
  const tiny: FlacFrameIndex = {
    ...index,
    bytes: 72,
    totalFrames: 9,
    entries: [
      [0, 42, 10, 4],
      [4, 52, 10, 4],
      [8, 62, 10, 1],
    ],
  };
  const data = new Uint8Array(72);
  data.set([102, 76, 97, 67, 128, 0, 0, 34]);
  new DataView(data.buffer).setBigUint64(
    18,
    (48000n << 44n) | (1n << 41n) | (23n << 36n) | 9n,
  );
  data[42] = 0;
  data[52] = 4;
  data[62] = 8;
  const fetcher = jest.fn(async (_url: unknown, init?: RequestInit) => {
    const [start, end] = new Headers(init?.headers)
      .get("Range")!
      .match(/\d+/g)!
      .map(Number);
    return new Response(data.slice(start, end + 1), {
      status: 206,
      headers: {
        "content-range": `bytes ${start}-${end}/72`,
        etag: '"tiny"',
        "x-content-sha256": sha256,
      },
    });
  });
  const cache = new PwaReviewRangeCache(fetcher as typeof fetch);
  await cache.prepare(
    reviewStartupRanges(tiny, "/tiny.flac", sha256, 5 / 48000),
    signal(),
  );
  const calls = fetcher.mock.calls.length;
  const reader = new FlacWindowReader(
    async () => tiny,
    () => ({
      close: () => {},
      decode: async (frames) => {
        const first = frames[0]![0]!,
          last = frames.at(-1)![0]!;
        const samplesDecoded = last + (last === 8 ? 1 : 4) - first;
        const channel = Float32Array.from(
          { length: samplesDecoded },
          (_, i) => (first + i - 4) / 8388607,
        );
        return {
          errors: [],
          sampleRate: 48000,
          bitDepth: 24,
          samplesDecoded,
          channelData: [channel, channel],
        };
      },
    }),
    (url, init) => cache.fetch(String(url), init, sha256),
    { sha256, verifiedBlob: false },
  );
  await reader.open("/tiny.flac", signal());
  const tail = await reader.read(5, 4, signal());
  const head = await reader.read(0, 9, signal());
  expect([...tail[0], ...head[0]].map((x) => Math.round(x * 8388608))).toEqual([
    1, 2, 3, 4, -4, -3, -2, -1, 0, 1, 2, 3, 4,
  ]);
  expect(fetcher).toHaveBeenCalledTimes(calls);
  reader.close();
});

it("consumes prepared ranges through the real clocked source even with partial old PCM", async () => {
  const data = new Uint8Array(index.bytes);
  data.set([102, 76, 97, 67, 128, 0, 0, 34]);
  new DataView(data.buffer).setBigUint64(
    18,
    (48000n << 44n) | (1n << 41n) | (23n << 36n) | BigInt(index.totalFrames),
  );
  for (let i = 0; i < 80; i++) data[42 + i * 10] = i;
  const fetcher = jest.fn(async (_url: unknown, init?: RequestInit) => {
    const [start, end] = new Headers(init?.headers)
      .get("Range")!
      .match(/\d+/g)!
      .map(Number);
    return new Response(data.slice(start, end + 1), {
      status: 206,
      headers: {
        "content-range": `bytes ${start}-${end}/${data.length}`,
        etag: '"clock-fixture"',
        "x-content-sha256": sha256,
      },
    });
  });
  const cache = new PwaReviewRangeCache(fetcher as typeof fetch);
  const context = {
    sampleRate: 48000,
    currentTime: 0,
    createGain: () => ({ gain: { value: 1 } }),
    createBuffer: (_channels: number, length: number) => ({
      length,
      copyToChannel: jest.fn(),
    }),
  } as unknown as AudioContext;
  const source = new ClockedWavSource(
    context,
    undefined,
    () =>
      new FlacWindowReader(
        async () => index,
        () => ({
          close: () => {},
          decode: async (frames) => {
            const samplesDecoded =
              (frames.at(-1)![0]! + 1 - frames[0]![0]!) * 48000;
            return {
              errors: [],
              sampleRate: 48000,
              bitDepth: 24,
              samplesDecoded,
              channelData: [
                new Float32Array(samplesDecoded),
                new Float32Array(samplesDecoded),
              ],
            };
          },
        }),
        (url, init) => cache.fetch(String(url), init, sha256),
        { sha256, verifiedBlob: false },
      ),
  );
  source.loop = true;
  source.src = "/audio.flac";
  await source.prepareAt(0);
  source.pause();
  for (const position of [5, 75, 80 - 1 / 48000, 80, 5]) {
    expect(
      await cache.prepare(
        reviewStartupRanges(index, source.src, sha256, position),
        signal(),
      ),
    ).toBe(true);
    const count = fetcher.mock.calls.length;
    await source.prepareAt(position);
    expect(source.currentTime).toBeCloseTo(position % 80, 10);
    expect(source.readyState).toBe(3);
    expect(fetcher).toHaveBeenCalledTimes(count);
    source.pause();
  }
});
