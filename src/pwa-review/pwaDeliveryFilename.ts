import type { ConsumerAudioWork } from "@/domain/audio/consumerTypes";
import manifest from "./flacIndexManifest.json";

/** PWA online delivery only. Catalog identities, native assets and verified
 * offline WAV packages retain their original contracts. */
export function pwaDeliveryFilename(work: ConsumerAudioWork): string | null {
  const original = work.localPreviewFilename;
  if (!original) return null;
  const delivery = manifest.files.find(
    (file) => "sourceFilename" in file && file.sourceFilename === original,
  );
  if (!delivery) return original;
  if (delivery.totalFrames !== work.frameCount)
    throw new Error(
      "Lossless delivery duration differs from the selected work.",
    );
  return delivery.filename;
}
