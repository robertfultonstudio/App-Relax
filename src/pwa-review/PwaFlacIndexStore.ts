import { IncrementalSha256 } from "@/offline/IncrementalSha256";
import {
  validateFlacFrameIndex,
  type FlacFrameIndex,
} from "@/audio/web/FlacWindowReader";
import manifest from "./flacIndexManifest.json";

export type ApprovedFlacIndex = (typeof manifest.files)[number];
const aborted = () => new Error("FLAC index loading cancelled.");
type IndexLoad = {
  controller: AbortController;
  promise: Promise<FlacFrameIndex>;
  consumers: number;
  settled: boolean;
};

/** The registry is bundled with the shell; frame indexes are loaded only for
 * selected sounds and authenticated before any offsets reach the decoder. */
export class PwaFlacIndexStore {
  private readonly cache = new Map<string, FlacFrameIndex>();
  private readonly pending = new Map<string, IndexLoad>();
  constructor(
    private readonly fetcher: typeof fetch = (...args) => fetch(...args),
    private readonly files: readonly ApprovedFlacIndex[] = manifest.files,
    private readonly capacity = 4,
  ) {}

  approved(filename: string): ApprovedFlacIndex {
    const file = this.files.find((item) => item.filename === filename);
    if (!file) throw new Error("No verified FLAC index for this sound.");
    return file;
  }

  async get(filename: string, signal: AbortSignal): Promise<FlacFrameIndex> {
    if (signal.aborted) throw aborted();
    const file = this.approved(filename);
    const cached = this.cache.get(file.indexSha256);
    if (cached) {
      this.cache.delete(file.indexSha256);
      this.cache.set(file.indexSha256, cached);
      return cached;
    }
    if (
      !Number.isSafeInteger(file.indexBytes) ||
      file.indexBytes < 1 ||
      file.indexBytes > 1024 * 1024 ||
      !/^[a-f0-9]{64}$/.test(file.indexSha256)
    )
      throw new Error("Invalid FLAC index registry.");
    let load = this.pending.get(file.indexSha256);
    if (!load) {
      const controller = new AbortController();
      load = {
        controller,
        promise: this.loadVerified(file, controller.signal),
        consumers: 0,
        settled: false,
      };
      this.pending.set(file.indexSha256, load);
      const current = load;
      void current.promise
        .finally(() => {
          current.settled = true;
          if (this.pending.get(file.indexSha256) === current)
            this.pending.delete(file.indexSha256);
        })
        .catch(() => undefined);
    }
    return this.consume(file.indexSha256, load, signal);
  }

  private consume(
    key: string,
    load: IndexLoad,
    signal: AbortSignal,
  ): Promise<FlacFrameIndex> {
    load.consumers += 1;
    return new Promise((resolve, reject) => {
      let finished = false;
      const release = () => {
        if (finished) return false;
        finished = true;
        signal.removeEventListener("abort", cancel);
        load.consumers -= 1;
        if (!load.settled && load.consumers === 0) {
          if (this.pending.get(key) === load) this.pending.delete(key);
          load.controller.abort();
        }
        return true;
      };
      const cancel = () => {
        if (release()) reject(aborted());
      };
      signal.addEventListener("abort", cancel, { once: true });
      if (signal.aborted) cancel();
      void load.promise.then(
        (value) => {
          if (release()) resolve(value);
        },
        (error: unknown) => {
          if (release()) reject(error);
        },
      );
    });
  }

  private async loadVerified(
    file: ApprovedFlacIndex,
    signal: AbortSignal,
  ): Promise<FlacFrameIndex> {
    const response = await this.fetcher(
      `/flac-index/${file.indexSha256}.json`,
      { signal, credentials: "same-origin" },
    );
    if (response.status !== 200) {
      await response.body?.cancel();
      throw new Error("Could not load the verified FLAC index.");
    }
    const reader = response.body?.getReader();
    if (!reader) throw new Error("FLAC index stream unavailable.");
    const bytes = new Uint8Array(file.indexBytes);
    let received = 0;
    try {
      for (;;) {
        const { done, value } = await reader.read();
        if (signal.aborted) throw aborted();
        if (done) break;
        if (received + value.length > bytes.length)
          throw new Error("FLAC index exceeds its verified size.");
        bytes.set(value, received);
        received += value.length;
      }
    } finally {
      await reader.cancel();
    }
    if (
      received !== bytes.length ||
      new IncrementalSha256().update(bytes).digestHex() !== file.indexSha256
    )
      throw new Error("FLAC index integrity mismatch.");
    const index = validateFlacFrameIndex(
      JSON.parse(new TextDecoder().decode(bytes)),
    );
    if (
      index.file !== file.filename ||
      index.bytes !== file.bytes ||
      index.totalFrames !== file.totalFrames
    )
      throw new Error("FLAC index differs from the approved sound.");
    if (signal.aborted) throw aborted();
    this.cache.set(file.indexSha256, index);
    while (this.cache.size > this.capacity)
      this.cache.delete(this.cache.keys().next().value!);
    return index;
  }
}
