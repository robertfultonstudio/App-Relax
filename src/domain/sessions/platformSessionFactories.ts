import {
  createNativePreviewProgram,
  createNativeListeningNatureProgram,
} from "./createNativePreviewProgram";
import { isNativeCatalogPreview } from "./playbackAvailability";

// Undefined on web/iOS/default builds: existing platform gates remain intact.
export const platformReviewProgramFactory = isNativeCatalogPreview()
  ? createNativePreviewProgram
  : undefined;
export const platformNatureProgramFactory = isNativeCatalogPreview()
  ? createNativeListeningNatureProgram
  : undefined;
