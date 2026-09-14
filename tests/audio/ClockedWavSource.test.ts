import {
  ClockedWavSource,
  decodePcm24,
  parsePcm24WavHeader,
} from "@/audio/web/ClockedWavSource";

function wav(seconds = 20) {
  const bytes = new Uint8Array(44 + 48000 * 6 * seconds);
  const view = new DataView(bytes.buffer);
  const word = (at: number, value: string) =>
    [...value].forEach((ch, i) => (bytes[at + i] = ch.charCodeAt(0)));
  word(0, "RIFF");
  view.setUint32(4, bytes.length - 8, true);
  word(8, "WAVE");
  word(12, "fmt ");
  view.setUint32(16, 16, true);
  view.setUint16(20, 1, true);
  view.setUint16(22, 2, true);
  view.setUint32(24, 48000, true);
  view.setUint32(28, 288000, true);
  view.setUint16(32, 6, true);
  view.setUint16(34, 24, true);
  word(36, "data");
  view.setUint32(40, bytes.length - 44, true);
  return bytes;
}
function setup(seconds = 20) {
  const data = wav(seconds);
  const starts: number[][] = [];
  const stops = jest.fn();
  const context = {
    sampleRate: 48000,
    currentTime: 0,
    createGain: () => ({ gain: { value: 1 } }),
    createBuffer: (_channels: number, length: number) => ({
      length,
      copyToChannel: jest.fn(),
    }),
    createBufferSource: () => ({
      connect: jest.fn(),
      disconnect: jest.fn(),
      stop: stops,
      start: (...args: number[]) => starts.push(args),
    }),
  } as unknown as AudioContext;
  const fetcher = jest.fn(async (_url: unknown, init?: RequestInit) => {
    const [start, end] = (init!.headers as Record<string, string>).Range.match(
      /\d+/g,
    )!.map(Number);
    const value = data.slice(start, end + 1);
    let done = false;
    return {
      status: 206,
      headers: { get: () => `bytes ${start}-${end}/${data.length}` },
      body: {
        cancel: async () => {},
        getReader: () => ({
          read: async () => {
            if (done) return { done: true };
            done = true;
            return { done: false, value };
          },
          cancel: async () => {},
        }),
      },
    } as unknown as Response;
  });
  const source = new ClockedWavSource(
    context,
    fetcher as unknown as typeof fetch,
  );
  source.src = "https://review.test/sound.wav";
  return { source, context, fetcher, starts, stops };
}
async function settle() {
  for (let i = 0; i < 80; i++) await Promise.resolve();
}
describe("bounded clocked PCM source", () => {
  it("rejects a mismatched render grid instead of producing fractional-frame seams", () => {
    expect(
      () => new ClockedWavSource({ sampleRate: 44100 } as AudioContext),
    ).toThrow(/48 kHz audio context/);
  });
  beforeEach(() => jest.useFakeTimers());
  afterEach(() => jest.useRealTimers());
  function flacSetup() {
    const { context } = setup(80);
    const reads = jest.fn(
      async (_start: number, frames: number, _signal: AbortSignal) =>
        [new Float32Array(frames), new Float32Array(frames)] as [
          Float32Array<ArrayBuffer>,
          Float32Array<ArrayBuffer>,
        ],
    );
    const open = jest.fn(async () => ({ frames: 80 * 48000 }));
    const close = jest.fn();
    const source = new ClockedWavSource(context, undefined, () => ({
      open,
      read: reads,
      close,
    }));
    source.src = "https://review.test/indexed.flac";
    return { source, reads, open, close };
  }
  it("FLAC cold start reads one 8-second window, without the old 2+8 round trips", async () => {
    const { source, reads, open } = flacSetup();
    await source.prepareAt(0);
    expect(open).toHaveBeenCalledTimes(1);
    expect(reads.mock.calls).toEqual([[0, 8 * 48000, expect.any(AbortSignal)]]);
    expect(source.readyState).toBe(3);
    source.pause();
  });
  it("cold FLAC seek reads only target windows and a warm repeat never reopens the decoder", async () => {
    const { source, reads, open } = flacSetup();
    await source.prepareAt(35);
    expect(reads.mock.calls.map(([frame]) => frame)).toEqual([35 * 48000]);
    expect(source.currentTime).toBe(35);
    source.pause();
    await source.prepareAt(35);
    expect(open).toHaveBeenCalledTimes(1);
    expect(reads).toHaveBeenCalledTimes(1);
    expect(source.readyState).toBe(3);
    source.src = "https://review.test/different.flac";
    await source.prepareAt(35);
    expect(open).toHaveBeenCalledTimes(2);
    expect(reads).toHaveBeenCalledTimes(2);
    source.pause();
  });
  it("uses the exact planned cold window when cached PCM covers only part of a seek reserve", async () => {
    const { source, reads } = flacSetup();
    await source.prepareAt(0);
    source.pause();
    reads.mockClear();
    // Review prepared compressed bytes for [5,13). Reusing only [5,8)
    // of the old PCM would request [8,16), missing that prepared range.
    await source.prepareAt(5);
    expect(reads.mock.calls).toEqual([
      [5 * 48000, 8 * 48000, expect.any(AbortSignal)],
    ]);
    expect(source.currentTime).toBe(5);
    source.pause();
  });
  it("keeps a complete multi-window PCM runway without decoding it again", async () => {
    const { source, reads } = flacSetup();
    await source.prepareAt(0);
    await source.prepareAt(8);
    reads.mockClear();
    await source.prepareAt(5);
    expect(reads).not.toHaveBeenCalled();
    source.pause();
  });
  it("reuses an idle decoder across paused seeks to different uncached positions", async () => {
    const { source, reads, open, close } = flacSetup();
    await source.prepareAt(0);
    source.pause();
    source.pause();
    await source.prepareAt(35);
    await source.prepareAt(60);
    expect(reads.mock.calls.map(([frame]) => frame)).toEqual([
      0,
      35 * 48000,
      60 * 48000,
    ]);
    expect(open).toHaveBeenCalledTimes(1);
    expect(close).not.toHaveBeenCalled();
    source.removeAttribute("src");
    expect(close).toHaveBeenCalledTimes(1);
  });
  it("still closes a busy decoder on pause and ignores its late PCM", async () => {
    const { source, reads, open, close } = flacSetup();
    await source.prepareAt(0);
    let finish!: () => void;
    let pendingSignal!: AbortSignal;
    reads.mockImplementationOnce(async (_start, frames, signal) => {
      pendingSignal = signal;
      await new Promise<void>((resolve) => {
        finish = resolve;
      });
      return [new Float32Array(frames), new Float32Array(frames)];
    });
    const pending = source.prepareAt(35);
    const rejected = expect(pending).rejects.toThrow(/cancelled/);
    await settle();
    source.pause();
    expect(pendingSignal.aborted).toBe(true);
    expect(close).toHaveBeenCalledTimes(1);
    await source.prepareAt(60);
    finish();
    await rejected;
    expect(open).toHaveBeenCalledTimes(2);
    expect(source.currentTime).toBe(60);
    expect(source.error).toBeNull();
    source.removeAttribute("src");
  });
  it("does not retain a reader whose metadata open is still pending", async () => {
    const { source, open, close } = flacSetup();
    let finish!: () => void;
    open.mockImplementationOnce(async () => {
      await new Promise<void>((resolve) => {
        finish = resolve;
      });
      return { frames: 80 * 48000 };
    });
    const pending = source.prepareAt(35);
    const rejected = expect(pending).rejects.toThrow(/cancelled/);
    await settle();
    source.pause();
    expect(close).toHaveBeenCalledTimes(1);
    finish();
    await rejected;
    await source.prepareAt(60);
    expect(open).toHaveBeenCalledTimes(2);
    expect(source.currentTime).toBe(60);
    source.removeAttribute("src");
  });
  it("explicit decoder release frees idle resources while keeping verified PCM", async () => {
    const { source, reads, open, close } = flacSetup();
    await source.prepareAt(0);
    source.pause();
    source.releasePcmReader();
    source.releasePcmReader();
    expect(close).toHaveBeenCalledTimes(1);
    await source.prepareAt(0);
    expect(reads).toHaveBeenCalledTimes(1);
    await source.prepareAt(35);
    expect(open).toHaveBeenCalledTimes(2);
    source.removeAttribute("src");
    expect(close).toHaveBeenCalledTimes(2);
  });
  it("decodes signed PCM24 without changing samples", () => {
    const [left, right] = decodePcm24(
      new Uint8Array([0, 0, 128, 255, 255, 127, 255, 255, 255, 0, 0, 0]),
    );
    expect([...left]).toEqual([-1, -1 / 8388608]);
    expect([...right]).toEqual([8388607 / 8388608, 0]);
    expect(() => decodePcm24(new Uint8Array(5))).toThrow("Partial");
  });
  it("validates exact supported format and rejects malformed headers", () => {
    expect(parsePcm24WavHeader(wav().subarray(0, 65536))).toEqual({
      dataOffset: 44,
      frames: 960000,
      totalBytes: 5760044,
    });
    const invalid = wav();
    new DataView(invalid.buffer).setUint16(34, 16, true);
    expect(() => parsePcm24WavHeader(invalid)).toThrow("Unsupported");
    expect(() => parsePcm24WavHeader(new Uint8Array(2))).toThrow("Truncated");
  });
  it("prepares a bounded 64KiB probe plus a safe startup reserve, not the full recording", async () => {
    const { source, fetcher } = setup();
    source.load();
    await settle();
    expect(source.readyState).toBe(3);
    expect(fetcher).toHaveBeenCalledTimes(3);
    expect(
      fetcher.mock.calls.map(
        ([, init]) => (init!.headers as Record<string, string>).Range,
      ),
    ).toEqual(["bytes=0-65535", "bytes=44-576043", "bytes=576044-2880043"]);
    source.pause();
  });
  it("does not claim Ready or open the clock with only the two-second probe on a slow remote response", async () => {
    const { source, fetcher, context, starts } = setup();
    const original = fetcher.getMockImplementation()!;
    let releaseReserve!: () => void;
    let releaseNext!: () => void;
    fetcher.mockImplementation(async (url, init) => {
      const range = (init!.headers as Record<string, string>).Range;
      if (range === "bytes=576044-2880043")
        await new Promise<void>((resolve) => {
          releaseReserve = resolve;
        });
      if (range === "bytes=2880044-5184043")
        await new Promise<void>((resolve) => {
          releaseNext = resolve;
        });
      return original(url, init);
    });
    source.load();
    await settle();
    expect(releaseReserve).toBeDefined();
    expect(source.readyState).toBe(0);
    expect(starts).toEqual([]);
    Object.assign(context, { currentTime: 4 });
    releaseReserve();
    await settle();
    expect(source.readyState).toBe(3);
    await source.play();
    await settle();
    expect(releaseNext).toBeDefined();
    Object.assign(context, { currentTime: 7 });
    jest.advanceTimersByTime(150);
    expect(source.error).toBeNull();
    expect(starts.slice(0, 2).map((call) => call[2])).toEqual([2, 8]);
    releaseNext();
    await settle();
    source.pause();
  });

  it("schedules contiguous windows and the wrap on the audio clock", async () => {
    const { source, starts } = setup(3);
    await source.play();
    await settle();
    expect(starts.length).toBeGreaterThan(4);
    for (let i = 1; i < starts.length; i++)
      expect(starts[i][0]).toBeCloseTo(starts[i - 1][0] + starts[i - 1][2], 9);
    expect(starts.slice(0, 4).map((call) => call[2])).toEqual([2, 1, 2, 1]);
    expect(starts.every((call) => call[1] === 0)).toBe(true);
    source.pause();
  });
  it("cancels play that is still preparing and never schedules late audio", async () => {
    const { source, starts } = setup();
    const playing = source.play();
    source.pause();
    await expect(playing).rejects.toThrow("cancelled");
    await settle();
    expect(starts).toEqual([]);
  });
  it("seek uses the requested source offset and pause stops scheduled nodes", async () => {
    const { source, starts, stops } = setup();
    source.load();
    await settle();
    source.currentTime = 5;
    await settle();
    expect(source.seeking).toBe(false);
    await source.play();
    await settle();
    expect(starts[0][1]).toBe(3);
    source.pause();
    expect(stops).toHaveBeenCalled();
    expect(source.currentTime).toBe(5);
  });
  it("ends a non-looping file without scheduling its beginning again", async () => {
    const { source, context, starts } = setup(3);
    source.loop = false;
    const ended = jest.fn();
    source.addEventListener("ended", ended);
    await source.play();
    await settle();
    expect(starts).toHaveLength(2);
    Object.assign(context, { currentTime: 3.1 });
    jest.advanceTimersByTime(150);
    expect(ended).toHaveBeenCalledTimes(1);
    expect(source.currentTime).toBe(3);
  });
  it("fails closed if the server ignores Range, without reading the full body", async () => {
    const { source, fetcher } = setup();
    const read = jest.fn();
    fetcher.mockResolvedValueOnce({
      status: 200,
      headers: { get: () => null },
      body: { cancel: async () => {}, getReader: read },
    } as unknown as Response);
    await expect(source.play()).rejects.toThrow("bounded byte range");
    expect(read).not.toHaveBeenCalled();
  });
  it("reports underrun and pauses instead of skipping source samples", async () => {
    const { source, context, stops } = setup();
    const error = jest.fn();
    source.addEventListener("error", error);
    await source.play();
    await settle();
    Object.assign(context, { currentTime: 100 });
    jest.advanceTimersByTime(150);
    expect(error).toHaveBeenCalledTimes(1);
    expect(stops).toHaveBeenCalled();
    expect(source.error?.message).toContain("ran out");
  });
  it("survives a twenty-second refill stall after warming up without enlarging startup or HTTP windows", async () => {
    const { source, context, fetcher, starts } = setup(100);
    await source.prepareForPlayback();
    expect(fetcher).toHaveBeenCalledTimes(3);
    await source.play();
    await settle();
    const scheduledEnd = starts.at(-1)![0] + starts.at(-1)![2];
    expect(scheduledEnd).toBeGreaterThanOrEqual(32);
    expect(scheduledEnd).toBeLessThan(40);
    const original = fetcher.getMockImplementation()!;
    let release!: () => void;
    fetcher.mockImplementationOnce(async (url, init) => {
      await new Promise<void>((resolve) => {
        release = resolve;
      });
      return original(url, init);
    });
    Object.assign(context, { currentTime: 2.2 });
    jest.advanceTimersByTime(150);
    await settle();
    expect(release).toBeDefined();
    Object.assign(context, { currentTime: 22.2 });
    jest.advanceTimersByTime(150);
    expect(source.error).toBeNull();
    release();
    await settle();
    for (let i = 1; i < starts.length; i++)
      expect(starts[i][0]).toBeCloseTo(starts[i - 1][0] + starts[i - 1][2], 9);
    expect(
      fetcher.mock.calls.every(([, init]) => {
        const [start, end] = (
          init!.headers as Record<string, string>
        ).Range.match(/\d+/g)!.map(Number);
        return end - start + 1 <= 8 * 48000 * 6;
      }),
    ).toBe(true);
    expect(source.error).toBeNull();
    source.pause();
  });
  it("prepares the next window before completing a seek one sample before a boundary", async () => {
    const { source, fetcher, context, starts } = setup();
    source.load();
    await settle();
    const original = fetcher.getMockImplementation()!;
    let release!: () => void;
    fetcher.mockImplementation(async (url, init) => {
      if (
        (init!.headers as Record<string, string>).Range ===
        "bytes=2880044-5184043"
      )
        await new Promise<void>((resolve) => {
          release = resolve;
        });
      return original(url, init);
    });
    source.currentTime = 10 - 1 / 48000;
    await settle();
    expect(release).toBeDefined();
    expect(source.seeking).toBe(true);
    Object.assign(context, { currentTime: 1 });
    release();
    await settle();
    expect(source.seeking).toBe(false);
    await source.play();
    await settle();
    expect(starts[0][0]).toBeCloseTo(1.06, 9);
    expect(starts[0][2]).toBeCloseTo(1 / 48000, 9);
    expect(starts[1][0]).toBeCloseTo(starts[0][0] + 1 / 48000, 9);
    expect(source.error).toBeNull();
    source.pause();
  });
  it("aborts superseded seek requests and late responses cannot change the new position", async () => {
    const { source, fetcher } = setup();
    source.load();
    await settle();
    const original = fetcher.getMockImplementation()!;
    let release!: () => void, oldSignal!: AbortSignal;
    fetcher.mockImplementationOnce(async (url, init) => {
      oldSignal = init!.signal!;
      await new Promise<void>((resolve) => {
        release = resolve;
      });
      return original(url, init);
    });
    source.currentTime = 5;
    await settle();
    expect(source.seeking).toBe(true);
    source.currentTime = 13;
    await settle();
    expect(oldSignal.aborted).toBe(true);
    expect(source.seeking).toBe(false);
    release();
    await settle();
    expect(source.currentTime).toBe(13);
    expect(source.error).toBeNull();
    source.pause();
  });
  it("pause clears an unfinished seek and preserves cancellation rather than an error", async () => {
    const { source, fetcher } = setup();
    source.load();
    await settle();
    const original = fetcher.getMockImplementation()!;
    let release!: () => void;
    fetcher.mockImplementationOnce(async (url, init) => {
      await new Promise<void>((resolve) => {
        release = resolve;
      });
      return original(url, init);
    });
    source.currentTime = 5;
    await settle();
    source.pause();
    expect(source.seeking).toBe(false);
    release();
    await settle();
    expect(source.error).toBeNull();
  });
  it("accepts an explicit common audio clock without adding another start delay", async () => {
    const { source, context, starts } = setup();
    await source.prepareForPlayback();
    await source.playAt(2);
    await settle();
    expect(starts[0][0]).toBe(2);
    Object.assign(context, { currentTime: 5 });
    expect(source.currentTime).toBe(3);
    source.pause();
    await source.prepareForPlayback();
    await source.playAt(6);
    await settle();
    Object.assign(context, { currentTime: 8 });
    expect(source.currentTime).toBe(5);
    source.pause();
  });
  it("retains the current scheduled buffer for resume after a 32-second refill", async () => {
    const { source, context, fetcher } = setup(80);
    await source.play();
    await settle();
    Object.assign(context, { currentTime: 1 });
    source.pause();
    const count = fetcher.mock.calls.length;
    await source.prepareForPlayback();
    expect(fetcher).toHaveBeenCalledTimes(count);
    expect(source.readyState).toBe(3);
    source.pause();
  });
});
