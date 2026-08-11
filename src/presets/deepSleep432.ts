import type { AudioPreset } from "@/domain/audio/types";

export const DEEP_SLEEP_432: AudioPreset = {
  schemaVersion: 1,
  id: "deep-sleep-432",
  title: "Deep Sleep 432",
  subtitle: "432 drone · deep river · air texture",
  goal: "sleep",
  tuningLabel: "432 Hz",
  carrierHz: 180,
  beatHz: 3.5,
  noise: { type: "brown" },
  stems: [
    {
      id: "drone",
      label: "Moon drone",
      assetKey: "sleepDrone001",
      required: true,
    },
    {
      id: "ambience",
      label: "Deep river",
      assetKey: "sleepAmbience001",
      required: true,
    },
    {
      id: "texture",
      label: "Air texture",
      assetKey: "sleepTexture001",
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
