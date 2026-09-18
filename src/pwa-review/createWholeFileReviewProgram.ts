import { createWholeFileReviewProgram as createProgram } from "@/domain/sessions/createWholeFileReviewProgram";
import type { CreateAdaptiveSessionInput } from "@/domain/sessions/types";
export function createWholeFileReviewProgram(
  input: CreateAdaptiveSessionInput,
) {
  return createProgram({ ...input, prepareNatureControls: true });
}
