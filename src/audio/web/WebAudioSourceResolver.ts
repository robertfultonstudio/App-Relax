import type { StemAssetKey } from "@/domain/audio/types";
import type { ConsumerAudioWork } from "@/domain/audio/consumerTypes";
import {
  isAdaptivePlaybackAvailable,
  isPwaWebSurface,
} from "@/domain/sessions/playbackAvailability";

export interface WebAudioSourceResolver {
  resolveStem(assetKey: StemAssetKey): string | null;
  resolveWork(work: ConsumerAudioWork): string | null;
  acquireWork?(
    work: ConsumerAudioWork,
    signal?: AbortSignal,
  ): Promise<WebAudioSourceLease | null>;
}

export interface WebAudioSourceLease {
  uri: string;
  release(): void | Promise<void>;
}

export type WebAudioWorkSource = string | WebAudioSourceLease | null;

export function cancelledWebAudioLoad(): Error {
  const error = new Error("Audio loading was cancelled or superseded.");
  error.name = "AbortError";
  return error;
}

/** Cancellation settles promptly; a resolver finishing later must release its unused lease. */
export function awaitWebAudioSource(
  resolveSource: () => WebAudioWorkSource | Promise<WebAudioWorkSource>,
  signal?: AbortSignal,
): Promise<WebAudioSourceLease | null> {
  if (signal?.aborted) return Promise.reject(cancelledWebAudioLoad());
  return new Promise((resolve, reject) => {
    let settled = false;
    const abort = () => {
      if (!settled) {
        settled = true;
        reject(cancelledWebAudioLoad());
      }
    };
    signal?.addEventListener("abort", abort, { once: true });
    Promise.resolve()
      .then(() => {
        if (signal?.aborted) throw cancelledWebAudioLoad();
        return resolveSource();
      })
      .then(
        (value) => {
          const lease =
            typeof value === "string"
              ? { uri: value, release: () => {} }
              : value;
          signal?.removeEventListener("abort", abort);
          if (settled || signal?.aborted) {
            if (lease)
              void Promise.resolve()
                .then(() => lease.release())
                .catch(() => undefined);
            if (!settled) reject(cancelledWebAudioLoad());
            return;
          }
          settled = true;
          resolve(lease);
        },
        (error) => {
          signal?.removeEventListener("abort", abort);
          if (!settled) {
            settled = true;
            reject(error);
          }
        },
      );
  });
}

export function acquireWebAudioWork(
  resolver: WebAudioSourceResolver,
  work: ConsumerAudioWork,
  signal?: AbortSignal,
) {
  return awaitWebAudioSource(
    () =>
      resolver.acquireWork
        ? resolver.acquireWork(work, signal)
        : resolver.resolveWork(work),
    signal,
  );
}

export function localCatalogUrl(filename: string): string {
  return `/audio-catalog/${encodeURIComponent(filename)}`;
}

export function resolveLocalPreviewWork(
  work: ConsumerAudioWork,
): string | null {
  if (
    work.deliveryScope === "local-only" &&
    (isPwaWebSurface() || !isAdaptivePlaybackAvailable())
  )
    return null;
  return work.availability === "local-preview-file" && work.localPreviewFilename
    ? localCatalogUrl(work.localPreviewFilename)
    : null;
}
