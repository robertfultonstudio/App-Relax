/** Ephemeral diagnostic counters. No paths, identities, persistence or telemetry. */
export interface ReviewReadMetrics {
  scope: number;
  opens: number;
  openMs: number;
  reads: number;
  readMs: number;
  decodes: number;
  decodeMs: number;
  networkReads: number;
  cacheReads: number;
}
