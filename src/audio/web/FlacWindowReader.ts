import type { PcmWindowReader } from "./ClockedWavSource";

export type FlacFrame = readonly [
  sample: number,
  byte: number,
  bytes: number,
  samples: number,
];
export interface FlacFrameIndex {
  version: 1;
  file: string;
  bytes: number;
  totalFrames: number;
  sampleRate: 48000;
  channels: 2;
  bitDepth: 24;
  entries: readonly FlacFrame[];
}
export interface FlacDecodedFrames {
  errors: readonly unknown[];
  channelData: readonly Float32Array[];
  samplesDecoded: number;
  sampleRate: number;
  bitDepth: number;
}
/** One reusable worker per reader. close MUST terminate pending work. */
export interface FlacFrameDecoder {
  decode(frames: Uint8Array[], signal: AbortSignal): Promise<FlacDecodedFrames>;
  close(): void;
}
const MAX_RANGE_BYTES = 4 * 1024 * 1024;
const MAX_WINDOW_FRAMES = 8 * 48000;
const cancelled = () => new Error("FLAC window cancelled.");

/** Shared by the decoder and bounded review prefetch: exact frame-aligned bytes. */
export function flacWindowSpan(
  index: FlacFrameIndex,
  start: number,
  count: number,
) {
  if (
    !Number.isSafeInteger(start) ||
    start < 0 ||
    !Number.isSafeInteger(count) ||
    count < 1 ||
    count > MAX_WINDOW_FRAMES ||
    start + count > index.totalFrames
  )
    throw new Error("FLAC window exceeds the supported sample range.");
  let low = 0,
    high = index.entries.length - 1;
  while (low < high) {
    const mid = Math.floor((low + high + 1) / 2);
    if (index.entries[mid]![0] <= start) low = mid;
    else high = mid - 1;
  }
  let last = low;
  while (index.entries[last]![0] + index.entries[last]![3] < start + count)
    last++;
  const entries = index.entries.slice(low, last + 1);
  const first = entries[0]!,
    end = entries.at(-1)!;
  return {
    entries,
    first,
    end,
    startByte: first[1],
    endByte: end[1] + end[2] - 1,
  };
}

export function validateFlacFrameIndex(value: unknown): FlacFrameIndex {
  const index = value as FlacFrameIndex | null;
  if (
    !index ||
    index.version !== 1 ||
    index.sampleRate !== 48000 ||
    index.channels !== 2 ||
    index.bitDepth !== 24 ||
    typeof index.file !== "string" ||
    !/^[a-zA-Z0-9_-]+\.flac$/.test(index.file) ||
    !Number.isSafeInteger(index.bytes) ||
    index.bytes < 42 ||
    !Number.isSafeInteger(index.totalFrames) ||
    index.totalFrames <= 0 ||
    !Array.isArray(index.entries) ||
    !index.entries.length ||
    index.entries.length > 100_000
  )
    throw new Error("Unsupported FLAC frame index.");
  let sample = 0,
    byte = index.entries[0]?.[1];
  if (!Number.isSafeInteger(byte) || byte < 42 || byte > 65536)
    throw new Error("FLAC metadata exceeds the bounded header probe.");
  for (const entry of index.entries) {
    if (
      !Array.isArray(entry) ||
      entry.length !== 4 ||
      !entry.every(Number.isSafeInteger) ||
      entry[0] !== sample ||
      entry[1] !== byte ||
      entry[2] <= 0 ||
      entry[2] > 524280 ||
      entry[3] < 1 ||
      entry[3] > 65535
    )
      throw new Error("FLAC frame index is not contiguous or bounded.");
    sample += entry[3];
    byte += entry[2];
  }
  if (sample !== index.totalFrames || byte !== index.bytes)
    throw new Error("FLAC frame index does not cover the complete source.");
  return index;
}

/** Header corroboration is not a full-file SHA check. The index resolver MUST
 * authenticate its metadata against the approved catalogue before returning it. */
export function validateFlacHeader(
  bytes: Uint8Array,
  index: FlacFrameIndex,
): void {
  const view = new DataView(bytes.buffer, bytes.byteOffset, bytes.byteLength);
  if (
    bytes.length < 42 ||
    String.fromCharCode(...bytes.subarray(0, 4)) !== "fLaC"
  )
    throw new Error("Expected native FLAC, not Ogg or another codec.");
  let at = 4,
    found = false;
  for (;;) {
    if (at + 4 > bytes.length) throw new Error("Truncated FLAC metadata.");
    const type = bytes[at]!,
      size = view.getUint32(at) & 0xffffff;
    if (at + 4 + size > bytes.length)
      throw new Error("Truncated FLAC metadata.");
    if ((type & 127) === 0) {
      if (at !== 4 || found || size !== 34)
        throw new Error("Invalid FLAC STREAMINFO.");
      const packed = view.getBigUint64(at + 14);
      if (
        Number(packed >> 44n) !== 48000 ||
        Number((packed >> 41n) & 7n) !== 1 ||
        Number((packed >> 36n) & 31n) !== 23 ||
        Number(packed & 0xfffffffffn) !== index.totalFrames
      )
        throw new Error(
          "FLAC format or duration differs from the verified index.",
        );
      found = true;
    }
    at += 4 + size;
    if (type & 128) break;
  }
  if (!found || at !== index.entries[0]![1])
    throw new Error("FLAC header/index boundary mismatch.");
}

export class FlacWindowReader implements PcmWindowReader {
  private index: FlacFrameIndex | null = null;
  private url = "";
  private generation = 0;
  private decoder: FlacFrameDecoder | null = null;
  private queued: Promise<unknown> = Promise.resolve();
  private controller = new AbortController();
  private etag: string | null = null;

  constructor(
    private readonly resolveIndex: (
      url: string,
      signal: AbortSignal,
    ) => Promise<FlacFrameIndex>,
    private readonly createDecoder: () => FlacFrameDecoder,
    private readonly fetcher: typeof fetch = (...args) => fetch(...args),
    private readonly sourceIdentity?: { sha256: string; verifiedBlob: boolean },
  ) {}

  async open(url: string, signal: AbortSignal): Promise<{ frames: number }> {
    this.close();
    const generation = this.generation,
      controller = this.controller;
    const abort = () => controller.abort();
    signal.addEventListener("abort", abort, { once: true });
    try {
      if (signal.aborted) throw cancelled();
      const index = validateFlacFrameIndex(
        await this.resolveIndex(url, controller.signal),
      );
      if (generation !== this.generation || controller.signal.aborted)
        throw cancelled();
      const header = await this.range(
        url,
        0,
        index.entries[0]![1] - 1,
        index.bytes,
        controller.signal,
      );
      validateFlacHeader(header, index);
      if (generation !== this.generation || controller.signal.aborted)
        throw cancelled();
      this.url = url;
      this.index = index;
      this.decoder = this.createDecoder();
      return { frames: index.totalFrames };
    } finally {
      signal.removeEventListener("abort", abort);
    }
  }

  read(start: number, count: number, signal: AbortSignal) {
    const generation = this.generation;
    // Decode reset is stateful: never overlap windows on one worker. A rejected
    // request does not poison the queue; source reset terminates the old worker.
    const result = this.queued
      .catch(() => {})
      .then(async () => {
        if (generation !== this.generation || signal.aborted) throw cancelled();
        return this.readWindow(start, count, signal, generation);
      });
    this.queued = result;
    return result;
  }

  close(): void {
    ++this.generation;
    this.controller.abort();
    this.controller = new AbortController();
    this.decoder?.close();
    this.decoder = null;
    this.index = null;
    this.etag = null;
    this.queued = Promise.resolve();
  }

  private async readWindow(
    start: number,
    count: number,
    signal: AbortSignal,
    generation: number,
  ): Promise<[Float32Array<ArrayBuffer>, Float32Array<ArrayBuffer>]> {
    const index = this.index,
      decoder = this.decoder,
      controller = this.controller;
    if (!index || !decoder) throw new Error("FLAC reader is not prepared.");
    if (
      !Number.isSafeInteger(start) ||
      start < 0 ||
      !Number.isSafeInteger(count) ||
      count < 1 ||
      count > MAX_WINDOW_FRAMES ||
      start + count > index.totalFrames
    )
      throw new Error("FLAC window exceeds the supported sample range.");
    const abort = () => controller.abort();
    signal.addEventListener("abort", abort, { once: true });
    try {
      if (signal.aborted || controller.signal.aborted) throw cancelled();
      const { entries, first, end, startByte, endByte } = flacWindowSpan(
        index,
        start,
        count,
      );
      const bytes = await this.range(
        this.url,
        startByte,
        endByte,
        index.bytes,
        controller.signal,
      );
      if (generation !== this.generation || controller.signal.aborted)
        throw cancelled();
      const decoded = await decoder.decode(
        entries.map((e) =>
          bytes.subarray(e[1] - first[1], e[1] - first[1] + e[2]),
        ),
        controller.signal,
      );
      if (generation !== this.generation || controller.signal.aborted)
        throw cancelled();
      const expected = end[0] + end[3] - first[0];
      if (
        !Array.isArray(decoded.errors) ||
        decoded.errors.length ||
        decoded.sampleRate !== 48000 ||
        decoded.bitDepth !== 24 ||
        decoded.samplesDecoded !== expected ||
        decoded.channelData.length !== 2 ||
        decoded.channelData.some(
          (c) => !(c instanceof Float32Array) || c.length !== expected,
        )
      )
        throw new Error("FLAC decoder returned corrupt or incomplete PCM.");
      const channels: [Float32Array<ArrayBuffer>, Float32Array<ArrayBuffer>] = [
        new Float32Array(count),
        new Float32Array(count),
      ];
      const skip = start - first[0];
      for (let c = 0; c < 2; c++)
        for (let i = 0; i < count; i++) {
          const integer = Math.round(
            decoded.channelData[c]![skip + i]! * 8388607,
          );
          if (
            !Number.isInteger(integer) ||
            integer < -8388608 ||
            integer > 8388607
          )
            throw new Error("FLAC decoder returned invalid PCM24.");
          channels[c]![i] = integer / 8388608;
        }
      return channels;
    } finally {
      signal.removeEventListener("abort", abort);
    }
  }

  private async range(
    url: string,
    start: number,
    end: number,
    total: number,
    signal: AbortSignal,
  ) {
    const length = end - start + 1;
    if (length < 1 || length > MAX_RANGE_BYTES)
      throw new Error("FLAC compressed window exceeds the 4 MiB cap.");
    const response = await this.fetcher(url, {
      headers: {
        Range: `bytes=${start}-${end}`,
        ...(this.etag ? { "If-Range": this.etag } : {}),
      },
      credentials: "same-origin",
      signal,
    });
    if (
      response.status !== 206 ||
      response.headers.get("content-range") !== `bytes ${start}-${end}/${total}`
    ) {
      await response.body?.cancel();
      throw new Error(
        "FLAC server did not return the exact bounded byte range.",
      );
    }
    if (
      this.sourceIdentity &&
      !(this.sourceIdentity.verifiedBlob && url.startsWith("blob:"))
    ) {
      const etag = response.headers.get("etag");
      if (
        !etag ||
        !/^"[^"\r\n]+"$/.test(etag) ||
        response.headers.get("x-content-sha256") !==
          this.sourceIdentity.sha256 ||
        (this.etag && this.etag !== etag)
      ) {
        await response.body?.cancel();
        throw new Error("FLAC source identity changed or is not verified.");
      }
      this.etag = etag;
    }
    const reader = response.body?.getReader();
    if (!reader) throw new Error("FLAC range stream unavailable.");
    const bytes = new Uint8Array(length);
    let received = 0;
    try {
      for (;;) {
        const { done, value } = await reader.read();
        if (signal.aborted) throw cancelled();
        if (done) break;
        if (received + value.length > length)
          throw new Error("FLAC range exceeded limit.");
        bytes.set(value, received);
        received += value.length;
      }
    } finally {
      await reader.cancel();
    }
    if (received !== length) throw new Error("Incomplete FLAC range.");
    return bytes;
  }
}
