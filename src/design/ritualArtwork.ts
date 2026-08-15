import type { ImageSourcePropType } from "react-native";

const RITUAL_ARTWORK: Readonly<Record<string, ImageSourcePropType>> = {
  "moon-current": require("../../assets/images/rituals/moon-current.jpg"),
  "quiet-tide": require("../../assets/images/rituals/quiet-tide.jpg"),
  "cedar-light": require("../../assets/images/rituals/cedar-light.jpg"),
  "aquarian-sky": require("../../assets/images/rituals/aquarian-sky.jpg"),
};

export function getRitualArtwork(artworkKey: string): ImageSourcePropType {
  const artwork = RITUAL_ARTWORK[artworkKey];
  if (!artwork) {
    throw new Error(`Unknown ritual artwork: ${artworkKey}`);
  }
  return artwork;
}
