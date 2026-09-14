/** Ephemeral compressed QA windows, never full files or decoded PCM.
 * Foreground misses cancel background work; playback always has priority. */
export interface ReviewByteRange {
  url: string;
  sha256: string;
  start: number;
  end: number;
  total: number;
}
type CachedRange = { bytes: Uint8Array<ArrayBuffer>; headers: Headers };
export const REVIEW_RANGE_BUDGET_BYTES = 8 * 1024 * 1024;
const MAX_RANGE_BYTES = 4 * 1024 * 1024;

export class PwaReviewRangeCache {
  private readonly entries = new Map<string, CachedRange>();
  private bytes = 0;
  private pending: AbortController | null = null;
  private networkReads = 0;
  private cacheReads = 0;
  readCounts() {
    return { networkReads: this.networkReads, cacheReads: this.cacheReads };
  }
  constructor(
    private readonly fetcher: typeof fetch = (...args) => fetch(...args),
    private readonly capacity = REVIEW_RANGE_BUDGET_BYTES,
  ) {}
  private key(url: string, sha256: string, range: string) {
    return `${url}\n${sha256}\n${range}`;
  }
  private response(value: CachedRange) {
    return new Response(value.bytes.slice(), {
      status: 206,
      headers: value.headers,
    });
  }
  cancel() {
    this.pending?.abort();
    this.pending = null;
  }
  clear() {
    this.cancel();
    this.entries.clear();
    this.bytes = 0;
  }
  /** Reader verifies every cached response exactly like a network response. */
  async fetch(
    url: string,
    init: RequestInit | undefined,
    sha256: string,
  ): Promise<Response> {
    if (init?.signal?.aborted) throw new Error("Review range cancelled.");
    const range = new Headers(init?.headers).get("Range") ?? "";
    const key = this.key(url, sha256, range);
    const cached = this.entries.get(key);
    if (cached) {
      this.cacheReads++;
      this.entries.delete(key);
      this.entries.set(key, cached);
      return this.response(cached);
    }
    this.cancel();
    this.networkReads++;
    const response = await this.fetcher(url, init);
    const etag = response.headers.get("etag");
    const prefix = `${url}\n${sha256}\n`;
    if (
      etag &&
      [...this.entries].some(
        ([key, value]) =>
          key.startsWith(prefix) && value.headers.get("etag") !== etag,
      )
    )
      this.purgeSource(prefix);
    // Only metadata probes are memoized during normal playback. Audio windows
    // enter this cache solely through explicit paused review preparation.
    const match = /^bytes=0-(\d+)$/.exec(range);
    if (!match || Number(match[1]) >= 65536 || url.startsWith("blob:"))
      return response;
    const content = /^bytes 0-(\d+)\/(\d+)$/.exec(
      response.headers.get("content-range") ?? "",
    );
    if (!content || content[1] !== match[1]) return response;
    const value = await this.readVerified(
      response,
      {
        url,
        sha256,
        start: 0,
        end: Number(match[1]),
        total: Number(content[2]),
      },
      init?.signal ?? new AbortController().signal,
    );
    this.put(key, value);
    return this.response(value);
  }
  async prepare(
    requests: readonly ReviewByteRange[],
    signal: AbortSignal,
  ): Promise<boolean> {
    this.cancel();
    if (signal.aborted || requests.length === 0) return false;
    const unique = new Map(
      requests.map((r) => [
        this.key(r.url, r.sha256, `bytes=${r.start}-${r.end}`),
        r,
      ]),
    );
    const plannedBytes = [...unique.values()].reduce(
      (n, r) => n + r.end - r.start + 1,
      0,
    );
    // A point exceeding the fixed budget is honestly left cold, not partly
    // advertised as prepared and not allowed to grow the memory footprint.
    if (
      plannedBytes > this.capacity ||
      [...unique.values()].some(
        (r) =>
          r.url.startsWith("blob:") ||
          !/^[a-f0-9]{64}$/.test(r.sha256) ||
          ![r.start, r.end, r.total].every(Number.isSafeInteger) ||
          r.start < 0 ||
          r.end < r.start ||
          r.end >= r.total ||
          r.end - r.start + 1 > MAX_RANGE_BYTES,
      )
    )
      return false;
    const controller = new AbortController();
    this.pending = controller;
    const abort = () => controller.abort();
    signal.addEventListener("abort", abort, { once: true });
    try {
      // Existing bytes of this plan must not be evicted by unrelated old data.
      for (const key of unique.keys()) {
        const retained = this.entries.get(key);
        if (retained) {
          this.entries.delete(key);
          this.entries.set(key, retained);
        }
      }
      for (const [key, request] of unique) {
        if (controller.signal.aborted) return false;
        if (this.entries.has(key)) continue;
        const response = await this.fetcher(request.url, {
          headers: { Range: `bytes=${request.start}-${request.end}` },
          credentials: "same-origin",
          signal: controller.signal,
        });
        const value = await this.readVerified(
          response,
          request,
          controller.signal,
        );
        if (controller.signal.aborted) return false;
        this.put(key, value);
      }
      const revisions = new Map<string, string | null>();
      for (const [key, request] of unique) {
        const value = this.entries.get(key);
        if (!value) return false;
        const prefix = `${request.url}\n${request.sha256}\n`;
        const etag = value.headers.get("etag");
        if (revisions.has(prefix) && revisions.get(prefix) !== etag) {
          this.purgeSource(prefix);
          return false;
        }
        revisions.set(prefix, etag);
      }
      return (
        !controller.signal.aborted &&
        [...unique.keys()].every((key) => this.entries.has(key))
      );
    } finally {
      signal.removeEventListener("abort", abort);
      if (this.pending === controller) this.pending = null;
    }
  }
  private purgeSource(prefix: string) {
    for (const [key, value] of this.entries) {
      if (!key.startsWith(prefix)) continue;
      this.bytes -= value.bytes.length;
      this.entries.delete(key);
    }
  }
  private put(key: string, value: CachedRange) {
    const old = this.entries.get(key);
    if (old) {
      this.bytes -= old.bytes.length;
      this.entries.delete(key);
    }
    while (
      this.bytes + value.bytes.length > this.capacity &&
      this.entries.size
    ) {
      const oldest = this.entries.keys().next().value!;
      this.bytes -= this.entries.get(oldest)!.bytes.length;
      this.entries.delete(oldest);
    }
    if (value.bytes.length > this.capacity) return;
    this.entries.set(key, value);
    this.bytes += value.bytes.length;
  }
  private async readVerified(
    response: Response,
    request: ReviewByteRange,
    signal: AbortSignal,
  ): Promise<CachedRange> {
    const etag = response.headers.get("etag");
    if (
      response.status !== 206 ||
      !etag ||
      !/^"[^"\r\n]+"$/.test(etag) ||
      response.headers.get("x-content-sha256") !== request.sha256 ||
      response.headers.get("content-range") !==
        `bytes ${request.start}-${request.end}/${request.total}`
    ) {
      await response.body?.cancel();
      throw new Error("Review window source identity or byte range changed.");
    }
    const reader = response.body?.getReader();
    if (!reader) throw new Error("Review window body unavailable.");
    const bytes = new Uint8Array(request.end - request.start + 1);
    let count = 0;
    try {
      for (;;) {
        const { done, value } = await reader.read();
        if (signal.aborted) throw new Error("Review range cancelled.");
        if (done) break;
        if (count + value.length > bytes.length)
          throw new Error("Review window exceeded its bound.");
        bytes.set(value, count);
        count += value.length;
      }
    } finally {
      await reader.cancel();
    }
    if (count !== bytes.length) throw new Error("Incomplete review window.");
    return { bytes, headers: new Headers(response.headers) };
  }
}
