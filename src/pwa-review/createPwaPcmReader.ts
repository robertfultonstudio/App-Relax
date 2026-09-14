import type { PcmWorkReaderFactory } from "@/audio/web/ClockedWavSource";
import { FlacWindowReader } from "@/audio/web/FlacWindowReader";
import { PwaFlacIndexStore } from "./PwaFlacIndexStore";
import { createDecoder } from "./flac/create-flac-frame-decoder";
import { pwaDeliveryFilename } from "./pwaDeliveryFilename";
import { PwaReviewRangeCache } from "./PwaReviewRangeCache";
import { reviewStartupRanges } from "./reviewStartupRanges";
import { PwaReadProbe } from "./PwaReadProbe";

// Share authenticated metadata across candidate drivers/duration changes.
// Only completed indexes are retained; audio and workers remain deck-local.
const indexes = new PwaFlacIndexStore(undefined, undefined, 18);

export function createPwaPcmReaderFactory(): PcmWorkReaderFactory {
  const ranges = new PwaReviewRangeCache();
  const probe = new PwaReadProbe();
  const factory: PcmWorkReaderFactory = (url, work) => {
    // A verified offline WAV lease remains WAV; only online delivery changes.
    const filename = url.startsWith("blob:")
      ? work.localPreviewFilename
      : pwaDeliveryFilename(work);
    if (!filename?.endsWith(".flac")) return null;
    const approved = indexes.approved(filename);
    if (approved.totalFrames !== work.frameCount)
      throw new Error("FLAC source duration differs from the selected work.");
    const reader = new FlacWindowReader(
      (_url, signal) => indexes.get(filename, signal),
      () => {
        const decoder = createDecoder();
        return {
          decode: (frames, signal) =>
            probe.measure("decode", () => decoder.decode(frames, signal)),
          close: () => decoder.close(),
        };
      },
      (input, init) =>
        url.startsWith("blob:")
          ? fetch(input, init)
          : ranges.fetch(String(input), init, approved.sourceSha256),
      // blob: leases reach this factory only after PWA offline SHA verification.
      { sha256: approved.sourceSha256, verifiedBlob: url.startsWith("blob:") },
    );
    return {
      open: (source, signal) =>
        probe.measure("open", () => reader.open(source, signal)),
      read: (start, frames, signal) =>
        probe.measure("read", () => reader.read(start, frames, signal)),
      close: () => reader.close(),
    };
  };
  factory.prepareReview = async (targets, signal) => {
    ranges.cancel();
    if (signal.aborted || targets.length === 0 || targets.length > 4)
      return false;
    const requests = [];
    for (const { url, work, positionSeconds } of targets) {
      // Blob URLs are owned, hash-verified offline leases supplied by the
      // resolver. Their bytes are already local: they must not prevent the
      // online music in the same session from being prepared.
      if (url.startsWith("blob:")) continue;
      const filename = pwaDeliveryFilename(work);
      if (!filename?.endsWith(".flac")) return false;
      const approved = indexes.approved(filename);
      if (approved.totalFrames !== work.frameCount)
        throw new Error("Review source duration changed.");
      const index = await indexes.get(filename, signal);
      requests.push(
        ...reviewStartupRanges(
          index,
          url,
          approved.sourceSha256,
          positionSeconds,
        ),
      );
    }
    if (signal.aborted) return false;
    return requests.length === 0 || ranges.prepare(requests, signal);
  };
  factory.cancelReview = () => ranges.cancel();
  factory.clearReview = () => ranges.clear();
  factory.getReviewReadMetrics = () => probe.snapshot(ranges.readCounts());
  return factory;
}
