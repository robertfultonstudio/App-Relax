import type { ReviewReadMetrics } from "@/domain/audio/reviewReadMetrics";

let nextScope = 0;
type Phase = "open" | "read" | "decode";
/** Constant-sized sums; parallel timings overlap and must not be added together. */
export class PwaReadProbe {
  private readonly value = {
    scope: ++nextScope,
    opens: 0,
    openMs: 0,
    reads: 0,
    readMs: 0,
    decodes: 0,
    decodeMs: 0,
  };
  constructor(private readonly now = () => performance.now()) {}
  async measure<T>(phase: Phase, operation: () => Promise<T>): Promise<T> {
    const began = this.now();
    this.value[`${phase}s`]++;
    try {
      return await operation();
    } finally {
      this.value[`${phase}Ms`] += Math.max(0, this.now() - began);
    }
  }
  snapshot(counts: {
    networkReads: number;
    cacheReads: number;
  }): ReviewReadMetrics {
    return { ...this.value, ...counts };
  }
}

export function reviewReadSummary(
  before: ReviewReadMetrics | null,
  after: ReviewReadMetrics | null,
): string {
  if (!before || !after || before.scope !== after.scope) return "";
  const delta = (key: keyof Omit<ReviewReadMetrics, "scope">) =>
    Math.round(Math.max(0, after[key] - before[key]));
  return ` Online FLAC ranges: ${delta("networkReads")} HTTP attempts, ${delta("cacheReads")} memory hits. All indexed FLAC: ${delta("opens")} source opens / ${delta("openMs")} ms; ${delta("reads")} PCM reads / ${delta("readMs")} ms, including ${delta("decodes")} worker decodes / ${delta("decodeMs")} ms. Timings overlap across sources; not extra delays. Range counts exclude offline Blob, index and worker requests. Offline WAV is not measured. No remote telemetry.`;
}
