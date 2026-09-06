import type { PackageSource, OfflineFailureCode } from "@/domain/offline/types";
import { AUDIO_CHUNK_BYTES } from "./IncrementalSha256";

export class OfflineTransferError extends Error {
  constructor(
    readonly failureCode: OfflineFailureCode,
    message: string,
  ) {
    super(message);
  }
}

export function createSameOriginPackageSource(
  fetcher: typeof fetch = fetch,
): PackageSource {
  return {
    kind: "remote",
    canDownload: true,
    async transfer(asset, sink, progress, signal) {
      if (!/^[A-Za-z0-9_.-]+\.(?:flac|wav)$/.test(asset.objectKey))
        throw new OfflineTransferError(
          "source-unavailable",
          "Unapproved audio path.",
        );
      const response = await fetcher(
        `/audio-catalog/${encodeURIComponent(asset.objectKey)}`,
        {
          credentials: "same-origin",
          redirect: "error",
          cache: "no-store",
          signal,
        },
      ).catch((error: unknown) => {
        if (signal?.aborted)
          throw new OfflineTransferError("cancelled", "Download cancelled.");
        throw new OfflineTransferError(
          "network-error",
          error instanceof Error ? error.message : "Download failed.",
        );
      });
      if (!response.ok || response.status !== 200 || !response.body)
        throw new OfflineTransferError(
          "source-unavailable",
          "The audio file is unavailable. Reconnect and retry.",
        );
      const length = response.headers.get("content-length");
      if (length !== null && Number(length) !== asset.bytes)
        throw new OfflineTransferError(
          "integrity-mismatch",
          "Audio length differs from the approved manifest.",
        );
      if (
        response.headers.get("content-type")?.split(";")[0] !== asset.mediaType
      )
        throw new OfflineTransferError(
          "source-unavailable",
          "Audio response type is incorrect.",
        );
      const reader = response.body.getReader();
      try {
        for (;;) {
          if (signal?.aborted)
            throw new OfflineTransferError("cancelled", "Download cancelled.");
          const result = await reader.read().catch(() => {
            throw new OfflineTransferError(
              "network-error",
              "The connection interrupted the audio download. Reconnect and retry.",
            );
          });
          if (result.done) break;
          for (
            let offset = 0;
            offset < result.value.length;
            offset += AUDIO_CHUNK_BYTES
          ) {
            if (signal?.aborted)
              throw new OfflineTransferError(
                "cancelled",
                "Download cancelled.",
              );
            const chunk = result.value.subarray(
              offset,
              offset + AUDIO_CHUNK_BYTES,
            );
            await sink.write(chunk);
            await progress(chunk.length);
          }
        }
      } catch (error) {
        if (signal?.aborted)
          throw new OfflineTransferError("cancelled", "Download cancelled.");
        throw error;
      } finally {
        await reader.cancel().catch(() => undefined);
        reader.releaseLock();
      }
    },
  };
}
