/** Small lossless PCM windows, scheduled on the audio clock. No full-file decode,
 * HTML media loop or network seek at the seam. Source samples remain unchanged. */
import type { ConsumerAudioWork } from "@/domain/audio/consumerTypes";
import type { ReviewReadMetrics } from "@/domain/audio/reviewReadMetrics";

export type PcmReviewTarget = {
  url: string;
  work: ConsumerAudioWork;
  positionSeconds: number;
};
export type PcmWorkReaderFactory = ((
  url: string,
  work: ConsumerAudioWork,
) => PcmWindowReader | null) & {
  prepareReview?: (
    targets: readonly PcmReviewTarget[],
    signal: AbortSignal,
  ) => Promise<boolean>;
  cancelReview?: () => void;
  clearReview?: () => void;
  getReviewReadMetrics?: () => ReviewReadMetrics;
};
export type AudioElementPort = Pick<
  HTMLAudioElement,
  | "src"
  | "loop"
  | "preload"
  | "currentTime"
  | "readyState"
  | "seeking"
  | "error"
  | "play"
  | "pause"
  | "load"
  | "removeAttribute"
  | "addEventListener"
  | "removeEventListener"
> & {
  prepareForPlayback?: () => Promise<void>;
  prepareAt?: (positionSeconds: number) => Promise<void>;
  prepareLookahead?: () => Promise<void>;
  /** Stop/dispose releases a paused PCM reader without discarding cached PCM. */
  releasePcmReader?: () => void;
  playAt?: (contextTime: number) => Promise<void>;
};

export const PCM_WINDOW_SECONDS = 8;
export const PCM_INITIAL_SECONDS = 2;
const STARTUP_BUFFER_SECONDS = 8;
// Refill a longer bounded runway after Play. This does not increase the
// startup reserve or decode an entire recording; each request stays <= 8 s.
const LOOKAHEAD_SECONDS = 32;
const MAX_CACHED_WINDOWS = 4;
const SAMPLE_RATE = 48000;
const FRAME_BYTES = 6;

/** Decoders supply exact PCM windows; only this source owns the audio clock. */
export interface PcmWindowReader {
  open(url: string, signal: AbortSignal): Promise<{ frames: number }>;
  read(
    start: number,
    frames: number,
    signal: AbortSignal,
  ): Promise<[Float32Array<ArrayBuffer>, Float32Array<ArrayBuffer>]>;
  close(): void;
}

interface WavHeader {
  dataOffset: number;
  frames: number;
  totalBytes: number;
}
export function parsePcm24WavHeader(bytes: Uint8Array): WavHeader {
  const view = new DataView(bytes.buffer, bytes.byteOffset, bytes.byteLength);
  if (bytes.length < 12) throw new Error("Truncated WAV header.");
  const text = (p: number, n: number) =>
    String.fromCharCode(...bytes.subarray(p, p + n));
  if (text(0, 4) !== "RIFF" || text(8, 4) !== "WAVE")
    throw new Error("Expected a PCM WAV file.");
  const totalBytes = view.getUint32(4, true) + 8;
  let validFormat = false;
  for (let p = 12; p + 8 <= bytes.length;) {
    const n = view.getUint32(p + 4, true),
      id = text(p, 4);
    if (id === "fmt ") {
      if (n < 16 || p + 8 + n > bytes.length)
        throw new Error("Invalid WAV format.");
      const f = p + 8,
        code = view.getUint16(f, true);
      const pcm =
        code === 1 ||
        (code === 65534 &&
          n === 40 &&
          text(f + 24, 16) ===
            "\u0001\u0000\u0000\u0000\u0000\u0000\u0010\u0000\u0080\u0000\u0000\u00aa\u0000\u0038\u009b\u0071");
      validFormat =
        pcm &&
        view.getUint16(f + 2, true) === 2 &&
        view.getUint32(f + 4, true) === SAMPLE_RATE &&
        view.getUint16(f + 12, true) === FRAME_BYTES &&
        view.getUint16(f + 14, true) === 24;
    }
    if (id === "data") {
      if (!validFormat || n % FRAME_BYTES || n === 0 || p + 8 + n > totalBytes)
        throw new Error("Unsupported or truncated PCM24 stereo/48kHz WAV.");
      return { dataOffset: p + 8, frames: n / FRAME_BYTES, totalBytes };
    }
    p += 8 + n + (n % 2);
  }
  throw new Error("WAV data header exceeds the bounded 64 KiB probe.");
}

export function decodePcm24(
  bytes: Uint8Array,
): [Float32Array<ArrayBuffer>, Float32Array<ArrayBuffer>] {
  if (bytes.length % FRAME_BYTES) throw new Error("Partial PCM frame.");
  const channels: [Float32Array<ArrayBuffer>, Float32Array<ArrayBuffer>] = [
    new Float32Array(bytes.length / 6),
    new Float32Array(bytes.length / 6),
  ];
  for (let frame = 0; frame < channels[0].length; frame++)
    for (let channel = 0; channel < 2; channel++) {
      const p = frame * 6 + channel * 3;
      const signed =
        ((bytes[p]! | (bytes[p + 1]! << 8) | (bytes[p + 2]! << 16)) << 8) >> 8;
      channels[channel]![frame] = signed / 8388608;
    }
  return channels;
}

export class ClockedWavSource extends EventTarget implements AudioElementPort {
  readonly output: GainNode;
  loop = true;
  preload: HTMLAudioElement["preload"] = "metadata";
  readyState = 0;
  seeking = false;
  error: MediaError | null = null;
  private url = "";
  private header: WavHeader | null = null;
  private etag: string | null = null;
  private controller = new AbortController();
  private preparing: Promise<void> | null = null;
  private generation = 0;
  private playbackEpoch = 0;
  private playing = false;
  private offsetFrames = 0;
  private clockStart = 0;
  private scheduledFrames = 0;
  private scheduledUntil = 0;
  private filling = false;
  private initialRefill: Promise<void> | null = null;
  private timer: ReturnType<typeof setInterval> | null = null;
  private nodes = new Map<
    AudioBufferSourceNode,
    { buffer: AudioBuffer; start: number }
  >();
  private cache = new Map<number, AudioBuffer>();
  private windows = new Map<
    number,
    Promise<{ buffer: AudioBuffer; start: number }>
  >();
  private reader: PcmWindowReader | null = null;
  private readerOpening: Promise<PcmWindowReader | null> | null = null;

  constructor(
    private readonly context: AudioContext,
    private readonly fetcher: typeof fetch = (...args) => fetch(...args),
    private readonly readerFactory?: (url: string) => PcmWindowReader | null,
  ) {
    super();
    if (context.sampleRate !== SAMPLE_RATE)
      throw new Error(
        "Clocked WAV playback requires a 48 kHz audio context. This browser did not provide the requested rate.",
      );
    this.output = context.createGain();
    this.output.gain.value = 1;
  }
  get src() {
    return this.url;
  }
  set src(value: string) {
    if (value === this.url) return;
    this.reset();
    this.url = value;
  }
  get currentTime() {
    const frames =
      this.offsetFrames +
      (this.playing
        ? Math.max(0, this.context.currentTime - this.clockStart) * SAMPLE_RATE
        : 0);
    return this.header
      ? (this.loop
          ? frames % this.header.frames
          : Math.min(frames, this.header.frames)) / SAMPLE_RATE
      : frames / SAMPLE_RATE;
  }
  set currentTime(value: number) {
    const resume = this.playing;
    this.pause();
    this.offsetFrames = Math.round(Math.max(0, value) * SAMPLE_RATE);
    this.seeking = true;
    const generation = this.playbackEpoch;
    const sourceGeneration = this.generation;
    void this.ensurePrepared()
      .then(async () => {
        await this.primePosition();
        if (generation !== this.playbackEpoch) return;
        this.seeking = false;
        this.dispatchEvent(new Event("seeked"));
        if (resume) await this.play();
      })
      .catch((error) => {
        if (generation === this.playbackEpoch)
          this.fail(error, sourceGeneration);
      });
  }
  load() {
    if (!this.url) {
      this.reset();
      return;
    }
    const generation = this.generation;
    void this.ensurePrepared().catch((error) => this.fail(error, generation));
  }
  removeAttribute(name: string) {
    if (name === "src") this.src = "";
  }
  async prepareForPlayback() {
    const generation = this.playbackEpoch;
    await this.ensurePrepared();
    await this.primePosition();
    if (generation !== this.playbackEpoch)
      throw new Error("Playback cancelled.");
  }
  /** Position before fetching PCM: never load the beginning just to seek away. */
  async prepareAt(positionSeconds: number) {
    if (!Number.isFinite(positionSeconds) || positionSeconds < 0)
      throw new Error("Invalid PCM position.");
    if (Math.abs(this.currentTime - positionSeconds) > 0.00001) {
      this.pause();
      this.offsetFrames = Math.round(positionSeconds * SAMPLE_RATE);
    }
    await this.prepareForPlayback();
  }
  async play() {
    await this.prepareForPlayback();
    return this.playAt(this.context.currentTime + 0.06);
  }
  async prepareLookahead() {
    const epoch = this.playbackEpoch;
    await this.initialRefill;
    if (epoch !== this.playbackEpoch || !this.playing)
      throw new Error("Audio refill cancelled.");
  }
  async playAt(contextTime: number) {
    const generation = this.playbackEpoch;
    if (this.playing) return;
    if (!this.header || this.readyState < 3 || this.seeking)
      throw new Error("Audio must be prepared before scheduling playback.");
    if (!Number.isFinite(contextTime) || contextTime < this.context.currentTime)
      throw new Error("Audio start clock has already passed.");
    this.playing = true;
    this.clockStart = contextTime;
    this.scheduledFrames = 0;
    this.scheduledUntil = this.clockStart;
    try {
      await this.fill(generation, true);
      if (generation !== this.playbackEpoch || !this.playing)
        throw new Error("Playback cancelled.");
      this.timer = setInterval(() => {
        if (
          !this.loop &&
          this.scheduledFrames + this.offsetFrames >= this.header!.frames &&
          this.context.currentTime >= this.scheduledUntil
        ) {
          this.pause();
          this.offsetFrames = this.header!.frames;
          this.dispatchEvent(new Event("ended"));
          return;
        }
        if (this.scheduledUntil < this.context.currentTime) {
          this.fail(
            new Error(
              "Audio buffer ran out. Playback paused; reconnect and retry.",
            ),
            this.generation,
          );
          return;
        }
        void this.fill(generation).catch((error) => {
          if (generation === this.playbackEpoch)
            this.fail(error, this.generation);
        });
      }, 150);
      this.initialRefill = this.fill(generation);
      void this.initialRefill.catch((error) => {
        if (generation === this.playbackEpoch)
          this.fail(error, this.generation);
      });
    } catch (error) {
      if (generation === this.playbackEpoch) this.fail(error, this.generation);
      throw error;
    }
  }
  pause() {
    // An idle reader has no listeners on the old operation signal. Keep its
    // authenticated header and worker for the same URL; busy readers MUST be
    // closed because cancelling a FLAC batch terminates its worker.
    const retainReader =
      this.reader !== null &&
      this.readerOpening === null &&
      this.windows.size === 0;
    this.offsetFrames = Math.round(this.currentTime * SAMPLE_RATE);
    // Scheduled buffers already exist in memory. Retain those nearest the
    // pause point instead of discarding the current window during 32 s refill.
    // No PCM copy or cache expansion: at most the same four windows survive.
    if (this.header && this.nodes.size) {
      const frame = this.offsetFrames % this.header.frames;
      const distance = ({
        start,
        buffer,
      }: {
        start: number;
        buffer: AudioBuffer;
      }) =>
        frame >= start && frame < start + buffer.length
          ? 0
          : (start - frame + this.header!.frames) % this.header!.frames;
      const nearest = [...this.nodes.values()].sort(
        (a, b) => distance(a) - distance(b),
      );
      const retained = new Map<number, AudioBuffer>();
      for (const { start, buffer } of nearest) {
        if (retained.size >= MAX_CACHED_WINDOWS) break;
        retained.set(start, buffer);
      }
      for (const [start, buffer] of this.cache) {
        if (retained.size >= MAX_CACHED_WINDOWS) break;
        if (!retained.has(start)) retained.set(start, buffer);
      }
      this.cache = retained;
    }
    this.playing = false;
    this.readyState = 0;
    ++this.playbackEpoch;
    ++this.generation;
    this.controller.abort();
    this.controller = new AbortController();
    this.preparing = null;
    this.windows.clear();
    this.seeking = false;
    if (!retainReader) this.releasePcmReader();
    // Keep immutable metadata and verified PCM for this URL. In-flight work
    // is cancelled; an idle decoder can serve the next uncached seek directly.
    this.readerOpening = null;
    this.filling = false;
    this.initialRefill = null;
    if (this.timer) clearInterval(this.timer);
    this.timer = null;
    for (const node of this.nodes.keys()) {
      try {
        node.stop();
      } catch {
        /* already ended */
      }
      node.disconnect();
    }
    this.nodes.clear();
  }
  releasePcmReader() {
    this.reader?.close();
    this.reader = null;
    this.readerOpening = null;
  }
  private reset() {
    this.pause();
    ++this.generation;
    this.controller.abort();
    this.releasePcmReader();
    this.controller = new AbortController();
    this.header = null;
    this.readyState = 0;
    this.etag = null;
    this.error = null;
    this.offsetFrames = 0;
    this.preparing = null;
    this.cache.clear();
    this.seeking = false;
  }
  private fail(reason: unknown, generation: number) {
    if (generation !== this.generation) return;
    this.pause();
    this.releasePcmReader();
    this.error = {
      code: 2,
      message:
        reason instanceof Error ? reason.message : "PCM stream unavailable.",
    } as MediaError;
    this.dispatchEvent(new Event("error"));
  }
  private async range(start: number, end: number) {
    const generation = this.generation;
    const response = await this.fetcher(this.url, {
      headers: {
        Range: `bytes=${start}-${end}`,
        ...(this.etag ? { "If-Range": this.etag } : {}),
      },
      credentials: "same-origin",
      signal: this.controller.signal,
    });
    const match = /^bytes (\d+)-(\d+)\/(\d+)$/.exec(
      response.headers.get("content-range") ?? "",
    );
    if (
      response.status !== 206 ||
      !match ||
      Number(match[1]) !== start ||
      Number(match[2]) !== end
    ) {
      await response.body?.cancel();
      throw new Error(
        "Audio server did not return the requested bounded byte range.",
      );
    }
    if (generation !== this.generation) {
      await response.body?.cancel();
      throw new Error("Audio range cancelled.");
    }
    const etag = response.headers.get("etag");
    if (this.etag && etag !== this.etag) {
      await response.body?.cancel();
      throw new Error("Audio revision changed.");
    }
    if (etag && /^"[^"\r\n]+"$/.test(etag)) this.etag = etag;
    if (this.header && Number(match[3]) !== this.header.totalBytes) {
      await response.body?.cancel();
      throw new Error("Audio length changed.");
    }
    const reader = response.body?.getReader();
    if (!reader) throw new Error("Audio stream body unavailable.");
    const bytes = new Uint8Array(end - start + 1);
    let received = 0;
    try {
      for (;;) {
        const { done, value } = await reader.read();
        if (done) break;
        if (received + value.length > bytes.length)
          throw new Error("Audio range exceeded limit.");
        bytes.set(value, received);
        received += value.length;
      }
    } finally {
      await reader.cancel();
    }
    if (received !== bytes.length) throw new Error("Incomplete audio range.");
    return bytes;
  }
  private ensurePrepared(): Promise<void> {
    if (this.preparing) return this.preparing;
    this.readyState = 0;
    const generation = this.generation;
    this.preparing = (async () => {
      if (!this.url) throw new Error("Audio URL missing.");
      let header: WavHeader;
      if (!this.header) await this.ensureReader();
      header = this.header ?? parsePcm24WavHeader(await this.range(0, 65535));
      if (generation !== this.generation)
        throw new Error("Audio preparation cancelled.");
      this.header = header;
      await this.primePosition();
      if (generation !== this.generation)
        throw new Error("Audio preparation cancelled.");
      this.readyState = 3;
      this.dispatchEvent(new Event("loadedmetadata"));
    })().catch((error) => {
      if (generation === this.generation) this.preparing = null;
      throw error;
    });
    return this.preparing;
  }
  private ensureReader(): Promise<PcmWindowReader | null> {
    if (this.readerOpening) return this.readerOpening;
    if (this.reader) return Promise.resolve(this.reader);
    const candidate = this.readerFactory?.(this.url);
    if (!candidate) return Promise.resolve(null);
    const generation = this.generation;
    this.reader = candidate;
    const opening = (async () => {
      const metadata = await candidate.open(this.url, this.controller.signal);
      if (generation !== this.generation)
        throw new Error("Audio reader preparation cancelled.");
      if (
        !Number.isSafeInteger(metadata.frames) ||
        metadata.frames <= 0 ||
        (this.header && this.header.frames !== metadata.frames)
      )
        throw new Error("Invalid or changed PCM source length.");
      this.header = { frames: metadata.frames, dataOffset: 0, totalBytes: 0 };
      return candidate;
    })().catch((error) => {
      candidate.close();
      if (generation === this.generation) {
        this.reader = null;
        this.readerOpening = null;
      }
      throw error;
    });
    this.readerOpening = opening;
    // Mark idle only after open has settled. A late old open cannot clear a
    // newer reader's busy marker or make it eligible for reuse.
    void opening
      .finally(() => {
        if (this.readerOpening === opening) this.readerOpening = null;
      })
      .catch(() => {});
    return opening;
  }
  private async windowAt(
    frame: number,
    exactAnchor = false,
  ): Promise<{ buffer: AudioBuffer; start: number }> {
    const generation = this.generation;
    const header = this.header!;
    const size = PCM_WINDOW_SECONDS * SAMPLE_RATE;
    const initial = this.initialWindowSeconds() * SAMPLE_RATE;
    const indexedPcm = header.totalBytes === 0;
    const covering =
      indexedPcm && !exactAnchor ? this.cachedWindowAt(frame) : undefined;
    // The FLAC index can decode any exact sample position. On a cold seek,
    // anchor the bounded 8 s window there, not on a previous global boundary:
    // one transfer, no discarded preroll and no second serial window request.
    const start =
      covering?.[0] ??
      (indexedPcm
        ? frame
        : frame < initial
          ? 0
          : initial + Math.floor((frame - initial) / size) * size);
    const cached = this.cache.get(start);
    if (cached) {
      this.cache.delete(start);
      this.cache.set(start, cached);
      return { buffer: cached, start };
    }
    const pending = this.windows.get(start);
    if (pending) return pending;
    const request = this.readWindow(start, header, generation);
    this.windows.set(start, request);
    try {
      return await request;
    } finally {
      if (this.windows.get(start) === request) this.windows.delete(start);
    }
  }
  private cachedWindowAt(frame: number): [number, AudioBuffer] | undefined {
    let best: [number, AudioBuffer] | undefined;
    for (const entry of this.cache) {
      const [start, buffer] = entry;
      if (frame < start || frame >= start + buffer.length) continue;
      if (!best || start + buffer.length > best[0] + best[1].length)
        best = entry;
    }
    return best;
  }
  private hasCachedRunway(frame: number, required: number): boolean {
    let buffered = 0;
    for (let i = 0; i <= MAX_CACHED_WINDOWS && buffered < required; i++) {
      const cached = this.cachedWindowAt(frame);
      if (!cached) return false;
      const available = cached[1].length - (frame - cached[0]);
      buffered += available;
      frame = (frame + available) % this.header!.frames;
    }
    return buffered >= required;
  }
  private async readWindow(
    start: number,
    header: WavHeader,
    generation: number,
  ) {
    const frames = Math.min(
      (start === 0 ? this.initialWindowSeconds() : PCM_WINDOW_SECONDS) *
        SAMPLE_RATE,
      header.frames - start,
    );
    const reader = await this.ensureReader();
    if (generation !== this.generation)
      throw new Error("Audio window cancelled.");
    const decoded = reader
      ? await reader.read(start, frames, this.controller.signal)
      : decodePcm24(
          await this.range(
            header.dataOffset + start * 6,
            header.dataOffset + (start + frames) * 6 - 1,
          ),
        );
    if (generation !== this.generation)
      throw new Error("Audio window cancelled.");
    const buffer = this.context.createBuffer(2, frames, SAMPLE_RATE);
    if (
      decoded.length !== 2 ||
      decoded.some((channel) => channel.length !== frames)
    )
      throw new Error("PCM decoder returned an incomplete window.");
    buffer.copyToChannel(decoded[0], 0);
    buffer.copyToChannel(decoded[1], 1);
    while (this.cache.size >= MAX_CACHED_WINDOWS)
      this.cache.delete(this.cache.keys().next().value!);
    this.cache.set(start, buffer);
    return { buffer, start };
  }
  private async primePosition() {
    const generation = this.generation;
    const header = this.header;
    if (!header) throw new Error("Audio preparation cancelled.");
    let frame = this.offsetFrames % header.frames;
    const required = Math.min(
      STARTUP_BUFFER_SECONDS * SAMPLE_RATE,
      this.loop ? header.frames : header.frames - frame,
    );
    let buffered = 0,
      iterations = 0;
    // A partial old PCM window must not shift a cold seek away from the exact
    // byte range the review prepared. Keep the fast path if the full runway
    // already exists, including adjacent cached windows and EOF -> zero.
    const exactAnchor =
      header.totalBytes === 0 && !this.hasCachedRunway(frame, required);
    // A two-second probe is not a playable reserve on a remote connection:
    // the next eight-second transfer may take longer than those two seconds.
    // Readiness includes a bounded runway before opening the shared clock.
    while (buffered < required) {
      if (++iterations > MAX_CACHED_WINDOWS + 1)
        throw new Error(
          "PCM startup reserve exceeds its bounded window budget.",
        );
      const { buffer, start } = await this.windowAt(
        frame,
        exactAnchor && iterations === 1,
      );
      if (generation !== this.generation)
        throw new Error("Audio preparation cancelled.");
      const available = buffer.length - (frame - start);
      if (available <= 0) throw new Error("PCM window made no progress.");
      buffered += available;
      frame = (frame + available) % header.frames;
    }
    if (generation !== this.generation)
      throw new Error("Audio preparation cancelled.");
  }
  private initialWindowSeconds() {
    // Indexed FLAC already has a verified frame map. One 8 s transfer gives
    // the same safety reserve without the old serial 2 s + 8 s round trips.
    return this.header?.totalBytes === 0
      ? PCM_WINDOW_SECONDS
      : PCM_INITIAL_SECONDS;
  }
  private async fill(generation: number, initialOnly = false) {
    if (this.filling || !this.playing) return;
    this.filling = true;
    try {
      while (
        this.playing &&
        generation === this.playbackEpoch &&
        this.scheduledUntil < this.context.currentTime + LOOKAHEAD_SECONDS
      ) {
        if (
          !this.loop &&
          this.offsetFrames + this.scheduledFrames >= this.header!.frames
        )
          return;
        const frame =
          (this.offsetFrames + this.scheduledFrames) % this.header!.frames;
        const { buffer, start } = await this.windowAt(frame);
        if (!this.playing || generation !== this.playbackEpoch) return;
        const when = this.clockStart + this.scheduledFrames / SAMPLE_RATE;
        if (when < this.context.currentTime)
          throw new Error(
            "Audio connection could not keep up. Playback paused; no samples skipped.",
          );
        const count = buffer.length - (frame - start);
        const node = this.context.createBufferSource();
        node.buffer = buffer;
        node.connect(this.output);
        node.onended = () => {
          node.disconnect();
          this.nodes.delete(node);
        };
        this.nodes.set(node, { buffer, start });
        node.start(when, (frame - start) / SAMPLE_RATE, count / SAMPLE_RATE);
        this.scheduledFrames += count;
        this.scheduledUntil =
          this.clockStart + this.scheduledFrames / SAMPLE_RATE;
        if (initialOnly) return;
      }
    } finally {
      if (generation === this.playbackEpoch) this.filling = false;
    }
  }
}
