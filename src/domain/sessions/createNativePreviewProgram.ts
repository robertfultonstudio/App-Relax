import { createWholeFileReviewProgram } from "./createWholeFileReviewProgram";
import { createListeningNatureProgram } from "./createListeningNatureProgram";
import type { CreateAdaptiveSessionInput } from "./types";

// Native keeps three decoders maximum. Reserve time to release an outgoing
// deck, prepare the next behind silence (5s timeout), then schedule its start.
export const NATIVE_DECK_PREPARATION_GUARD_SECONDS = 10;
export function createNativePreviewProgram(input: CreateAdaptiveSessionInput) {
  return createWholeFileReviewProgram(
    input,
    NATIVE_DECK_PREPARATION_GUARD_SECONDS,
  );
}
export function createNativeListeningNatureProgram(
  ...args: Parameters<typeof createListeningNatureProgram>
) {
  return createListeningNatureProgram(
    args[0],
    args[1],
    args[2],
    args[3],
    NATIVE_DECK_PREPARATION_GUARD_SECONDS,
  );
}
