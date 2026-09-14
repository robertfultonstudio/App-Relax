import {
  flacWindowSpan,
  type FlacFrameIndex,
} from "@/audio/web/FlacWindowReader";
import type { ReviewByteRange } from "./PwaReviewRangeCache";

/** Exactly the cold indexed-PCM startup reserve, including EOF -> zero. */
export function reviewStartupRanges(
  index: FlacFrameIndex,
  url: string,
  sha256: string,
  positionSeconds: number,
): ReviewByteRange[] {
  if (!Number.isFinite(positionSeconds) || positionSeconds < 0)
    throw new Error("Invalid review position.");
  let frame = Math.round(positionSeconds * 48000) % index.totalFrames;
  const required = Math.min(8 * 48000, index.totalFrames);
  const ranges: ReviewByteRange[] = [
    {
      url,
      sha256,
      start: 0,
      end: index.entries[0]![1] - 1,
      total: index.bytes,
    },
  ];
  let buffered = 0;
  while (buffered < required) {
    const frames = Math.min(8 * 48000, index.totalFrames - frame);
    const span = flacWindowSpan(index, frame, frames);
    ranges.push({
      url,
      sha256,
      start: span.startByte,
      end: span.endByte,
      total: index.bytes,
    });
    buffered += frames;
    frame = (frame + frames) % index.totalFrames;
  }
  return ranges;
}
