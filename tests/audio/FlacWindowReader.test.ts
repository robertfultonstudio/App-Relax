import {
  FlacWindowReader,
  validateFlacFrameIndex,
  validateFlacHeader,
  type FlacFrameIndex,
  type FlacFrameDecoder,
  type FlacDecodedFrames,
} from "@/audio/web/FlacWindowReader";

function fixture(verified = false) {
  const index: FlacFrameIndex = {
    version: 1,
    file: "rain.flac",
    bytes: 72,
    totalFrames: 9,
    sampleRate: 48000,
    channels: 2,
    bitDepth: 24,
    entries: [
      [0, 42, 10, 4],
      [4, 52, 10, 4],
      [8, 62, 10, 1],
    ],
  };
  const data = new Uint8Array(72),
    v = new DataView(data.buffer);
  data.set([102, 76, 97, 67, 128, 0, 0, 34]);
  v.setBigUint64(18, (48000n << 44n) | (1n << 41n) | (23n << 36n) | 9n);
  data[42] = 0;
  data[52] = 4;
  data[62] = 8;
  const fetcher = jest.fn(async (_: unknown, init?: RequestInit) => {
    const [start, end] = (init!.headers as Record<string, string>).Range.match(
      /\d+/g,
    )!.map(Number);
    const value = data.slice(start, end + 1);
    let done = false;
    return {
      status: 206,
      headers: {
        get: (name: string) =>
          name === "etag"
            ? '"source-1"'
            : name === "x-content-sha256"
              ? "a".repeat(64)
              : `bytes ${start}-${end}/72`,
      },
      body: {
        cancel: jest.fn(),
        getReader: () => ({
          cancel: jest.fn(),
          read: async () => {
            if (done) return { done: true };
            done = true;
            return { done: false, value };
          },
        }),
      },
    } as unknown as Response;
  });
  const decode = jest.fn(
    async (frames: Uint8Array[]): Promise<FlacDecodedFrames> => {
      const start = frames[0]![0]!,
        last = frames.at(-1)![0]!,
        count = last + (last === 8 ? 1 : 4) - start;
      const channel = Float32Array.from(
        { length: count },
        (_, i) => (start + i - 4) / 8388607,
      );
      return {
        errors: [],
        sampleRate: 48000,
        bitDepth: 24,
        samplesDecoded: count,
        channelData: [channel, channel],
      };
    },
  );
  const close = jest.fn(),
    decoder: FlacFrameDecoder = { decode, close };
  const reader = new FlacWindowReader(
    async () => index,
    () => decoder,
    fetcher as typeof fetch,
    verified ? { sha256: "a".repeat(64), verifiedBlob: false } : undefined,
  );
  return { reader, index, data, fetcher, decode, close };
}
const signal = () => new AbortController().signal;
async function settle() {
  for (let i = 0; i < 30; i++) await Promise.resolve();
}

describe("indexed FLAC PCM reader", () => {
  it("binds later ranges to the verified source revision and refuses changes", async () => {
    const { reader, fetcher } = fixture(true);
    await reader.open("/rain.flac", signal());
    await reader.read(0, 4, signal());
    expect(fetcher.mock.calls[1]![1]!.headers).toEqual({
      Range: "bytes=42-51",
      "If-Range": '"source-1"',
    });
    const original = fetcher.getMockImplementation()!;
    fetcher.mockImplementation(async (...args) => {
      const response = await original(...args);
      const oldGet = response.headers.get.bind(response.headers);
      response.headers.get = (name: string) =>
        name === "etag" ? '"source-2"' : oldGet(name);
      return response;
    });
    await expect(reader.read(4, 4, signal())).rejects.toThrow(
      "identity changed",
    );
    reader.close();
  });
  it("validates contiguous byte/sample coverage and rejects unsupported metadata", () => {
    const { index, data } = fixture();
    expect(validateFlacFrameIndex(index)).toBe(index);
    expect(() => validateFlacHeader(data.subarray(0, 42), index)).not.toThrow();
    expect(() => validateFlacFrameIndex({ ...index, bytes: 73 })).toThrow(
      /complete/,
    );
    expect(() => validateFlacFrameIndex({ ...index, channels: 1 })).toThrow(
      /Unsupported/,
    );
    expect(() =>
      validateFlacFrameIndex({
        ...index,
        entries: [
          [0, 42, 10, 4],
          [5, 52, 20, 4],
        ],
      }),
    ).toThrow(/contiguous/);
    expect(() =>
      validateFlacFrameIndex({ ...index, file: "../rain.flac" }),
    ).toThrow(/Unsupported/);
    data[0] = 79;
    expect(() => validateFlacHeader(data, index)).toThrow(/native FLAC/);
  });
  it("requests only covering frames and trims exactly to signed PCM24 samples", async () => {
    const { reader, fetcher } = fixture();
    await expect(reader.open("/rain.flac", signal())).resolves.toEqual({
      frames: 9,
    });
    const [l, r] = await reader.read(3, 3, signal());
    expect([...l]).toEqual([-1 / 8388608, 0, 1 / 8388608]);
    expect([...r]).toEqual([...l]);
    const [last] = await reader.read(8, 1, signal());
    expect([...last]).toEqual([4 / 8388608]);
    expect(
      fetcher.mock.calls.map(
        ([, init]) => (init!.headers as Record<string, string>).Range,
      ),
    ).toEqual(["bytes=0-41", "bytes=42-61", "bytes=62-71"]);
    reader.close();
  });
  it("fails closed on changed length or a server that ignores Range", async () => {
    const { reader, fetcher } = fixture();
    const cancel = jest.fn(),
      bodyRead = jest.fn();
    fetcher.mockResolvedValueOnce({
      status: 200,
      headers: { get: () => null },
      body: { cancel, getReader: bodyRead },
    } as unknown as Response);
    await expect(reader.open("/rain.flac", signal())).rejects.toThrow(
      /exact bounded/,
    );
    expect(cancel).toHaveBeenCalled();
    expect(bodyRead).not.toHaveBeenCalled();
    reader.close();
  });
  it("rejects invalid windows before requesting audio", async () => {
    const { reader, fetcher } = fixture();
    await reader.open("/rain.flac", signal());
    for (const [start, count] of [
      [-1, 2],
      [0, 0],
      [0, 384001],
      [8, 2],
      [0, 1.5],
    ])
      await expect(reader.read(start, count, signal())).rejects.toThrow(
        /sample range/,
      );
    expect(fetcher).toHaveBeenCalledTimes(1);
    reader.close();
  });
  it("refuses corrupt, incomplete, nonfinite or out-of-range decoder output", async () => {
    const { reader, decode } = fixture();
    await reader.open("/rain.flac", signal());
    const good = await decode([new Uint8Array([0])]);
    for (const output of [
      { ...good, errors: undefined },
      { ...good, errors: ["CRC"] },
      { ...good, samplesDecoded: 3 },
      { ...good, sampleRate: 44100 },
      { ...good, channelData: [new Float32Array(4), new Float32Array(3)] },
      {
        ...good,
        channelData: [Float32Array.of(NaN, 0, 0, 0), new Float32Array(4)],
      },
      {
        ...good,
        channelData: [Float32Array.of(2, 0, 0, 0), new Float32Array(4)],
      },
    ]) {
      decode.mockResolvedValueOnce(output as unknown as FlacDecodedFrames);
      await expect(reader.read(0, 4, signal())).rejects.toThrow(/PCM/);
    }
    reader.close();
  });
  it("serializes reset/decode work and a failed read does not poison the next", async () => {
    const { reader, decode } = fixture();
    await reader.open("/rain.flac", signal());
    const output = await decode([new Uint8Array([0])]);
    decode.mockClear();
    let finish!: (value: FlacDecodedFrames) => void;
    decode.mockImplementationOnce(
      () =>
        new Promise((resolve) => {
          finish = resolve;
        }),
    );
    const first = reader.read(0, 4, signal()),
      second = reader.read(4, 4, signal());
    await settle();
    expect(decode).toHaveBeenCalledTimes(1);
    finish(output);
    await first;
    await second;
    expect(decode).toHaveBeenCalledTimes(2);
    decode.mockRejectedValueOnce(new Error("corrupt frame"));
    await expect(reader.read(0, 4, signal())).rejects.toThrow("corrupt frame");
    await expect(reader.read(8, 1, signal())).resolves.toHaveLength(2);
    reader.close();
  });
  it("reset closes the old decoder and rejects its late PCM without contaminating the new source", async () => {
    const { reader, decode, close } = fixture();
    await reader.open("/rain.flac", signal());
    const output = await decode([new Uint8Array([0])]);
    let finish!: (value: FlacDecodedFrames) => void;
    decode.mockImplementationOnce(
      () =>
        new Promise((resolve) => {
          finish = resolve;
        }),
    );
    const pending = reader.read(0, 4, signal());
    const rejection = expect(pending).rejects.toThrow(/cancelled/);
    await settle();
    reader.close();
    expect(close).toHaveBeenCalledTimes(1);
    await reader.open("/new.flac", signal());
    const [last] = await reader.read(8, 1, signal());
    expect([...last]).toEqual([4 / 8388608]);
    finish(output);
    await rejection;
    reader.close();
  });
  it("an aborted queued read never fetches or decodes", async () => {
    const { reader, fetcher, decode } = fixture();
    await reader.open("/rain.flac", signal());
    const abort = new AbortController();
    abort.abort();
    await expect(reader.read(0, 4, abort.signal)).rejects.toThrow(/cancelled/);
    expect(fetcher).toHaveBeenCalledTimes(1);
    expect(decode).not.toHaveBeenCalled();
    reader.close();
  });
});
