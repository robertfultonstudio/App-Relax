import type { AudioPreset } from "@/domain/audio/types";

export const DEEP_SLEEP_432: AudioPreset = {
  schemaVersion: 1,
  id: "deep-sleep-432",
  title: "Deep Sleep 432",
  subtitle: "Celestial drone · night field · soft grain",
  goal: "sleep",
  tuningLabel: "432 Hz",
  carrierHz: 180,
  beatHz: 3.5,
  noise: { type: "brown" },
  stems: [
    {
      id: "drone",
      label: "Moon drone",
      assetKey: "sleepDronePlaceholder",
      required: true,
    },
    {
      id: "ambience",
      label: "Night air",
      assetKey: "sleepAmbiencePlaceholder",
      required: true,
    },
    {
      id: "texture",
      label: "Soft grain",
      assetKey: "sleepTexturePlaceholder",
      required: true,
    },
  ],
  defaultMix: {
    drone: 0.25,
    ambience: 0.2,
    texture: 0.12,
    binaural: 0.07,
    brownNoise: 0.11,
  },
  durationOptionsMinutes: [15, 30, 60],
  fadeInSeconds: 8,
  fadeOutSeconds: 12,
  variation: {
    strategy: "future-gentle-rotation",
    poolIds: [],
    minimumHoldSeconds: 180,
  },
};
