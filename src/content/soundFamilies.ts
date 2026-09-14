import type { ConsumerAudioWork } from "@/domain/audio/consumerTypes";

export type SoundFamilyId =
  "music" | "sea" | "rain" | "stream" | "noise" | "air" | "unclassified-nature";

/** One editorial classification shared by browsing and the session chooser. */
export function soundFamilyFor(work: ConsumerAudioWork): SoundFamilyId {
  if (work.familyId === "unclassified-natural-texture")
    return "unclassified-nature";
  if (work.sourceKind === "generated-noise") return "noise";
  if (work.familyId.startsWith("field-sea-")) return "sea";
  if (work.familyId.startsWith("field-rain-")) return "rain";
  if (work.familyId.startsWith("field-stream-") || work.id === "deep-river")
    return "stream";
  if (
    work.collectionIds.includes("elemental-air") ||
    work.collectionIds.includes("esoteric-series")
  )
    return "air";
  return "music";
}
