import type { PlaceholderAssetKey } from "@/domain/audio/types";

export const PLACEHOLDER_ASSETS: Readonly<Record<PlaceholderAssetKey, number>> =
  {
    sleepDronePlaceholder: require("../../../assets/audio/placeholders/sleep-drone-placeholder.wav"),
    sleepAmbiencePlaceholder: require("../../../assets/audio/placeholders/sleep-ambience-placeholder.wav"),
    sleepTexturePlaceholder: require("../../../assets/audio/placeholders/sleep-texture-placeholder.wav"),
  };
