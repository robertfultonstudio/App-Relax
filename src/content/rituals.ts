import type { AudioSourceId, Goal } from "@/domain/audio/types";

export type RitualAvailability = "available" | "in-production" | "test-only";

export interface RitualContent {
  id: string;
  goal: Goal;
  title: string;
  shortDescription: string;
  themeId: string;
  artworkKey: string;
  availability: RitualAvailability;
  audioPresetId?: string;
  mixerLabels: Partial<Record<AudioSourceId, string>>;
  aboutSound?: {
    summary: string;
    details: readonly string[];
  };
}

export interface RitualTheme {
  id: string;
  palette: {
    background: string;
    surface: string;
    text: string;
    muted: string;
    accent: string;
  };
  artworkKey: string;
  overlay: "ink" | "mist" | "paper" | "sky";
  motion: "drift" | "breathe";
}

export const RITUAL_THEMES: readonly RitualTheme[] = [
  {
    id: "moon-current",
    palette: {
      background: "#071019",
      surface: "#111E2A",
      text: "#F4EEE5",
      muted: "#B9C5CD",
      accent: "#D8B98C",
    },
    artworkKey: "moon-current",
    overlay: "ink",
    motion: "drift",
  },
  {
    id: "quiet-tide",
    palette: {
      background: "#101816",
      surface: "#1A2924",
      text: "#FAF5E9",
      muted: "#C4D0C8",
      accent: "#A9C8B9",
    },
    artworkKey: "quiet-tide",
    overlay: "mist",
    motion: "breathe",
  },
  {
    id: "cedar-light",
    palette: {
      background: "#15110D",
      surface: "#282017",
      text: "#FBF1DE",
      muted: "#D0C0A9",
      accent: "#E2B36A",
    },
    artworkKey: "cedar-light",
    overlay: "paper",
    motion: "drift",
  },
  {
    id: "aquarian-sky",
    palette: {
      background: "#0B1020",
      surface: "#191B34",
      text: "#F6F0F8",
      muted: "#C9C2D5",
      accent: "#D8BB83",
    },
    artworkKey: "aquarian-sky",
    overlay: "sky",
    motion: "breathe",
  },
] as const;

export const RITUALS: readonly RitualContent[] = [
  {
    id: "sleep-rituals",
    goal: "sleep",
    title: "Sleep",
    shortDescription: "Future evening rituals for settling gently into rest.",
    themeId: "moon-current",
    artworkKey: "moon-current",
    availability: "in-production",
    mixerLabels: {},
  },
  {
    id: "quiet-tide",
    goal: "calm",
    title: "Quiet Tide",
    shortDescription: "A low shoreline for when the day still feels loud.",
    themeId: "quiet-tide",
    artworkKey: "quiet-tide",
    availability: "in-production",
    mixerLabels: {},
  },
  {
    id: "cedar-light",
    goal: "focus",
    title: "Cedar Light",
    shortDescription:
      "Steady texture for reading, writing, and unhurried work.",
    themeId: "cedar-light",
    artworkKey: "cedar-light",
    availability: "in-production",
    mixerLabels: {},
  },
  {
    id: "aquarian-sky",
    goal: "meditate",
    title: "Aquarian Sky",
    shortDescription:
      "An open field for sitting, breathing, or simply listening.",
    themeId: "aquarian-sky",
    artworkKey: "aquarian-sky",
    availability: "in-production",
    mixerLabels: {},
  },
] as const;

export const AUDIO_TEST_RITUAL: RitualContent = {
  id: "moon-current-audio-test",
  goal: "sleep",
  title: "Moon Current",
  shortDescription: "Engine validation with three authorised test stems.",
  themeId: "moon-current",
  artworkKey: "moon-current",
  availability: "test-only",
  audioPresetId: "deep-sleep-432",
  mixerLabels: {
    drone: "Moon drone",
    ambience: "Deep river",
    texture: "Soft air",
    binaural: "Stereo tones",
    brownNoise: "Low noise",
  },
  aboutSound: {
    summary:
      "The engine test uses A=432 Hz tuning metadata, a 180 Hz carrier and two stereo tones separated by 3.5 Hz.",
    details: [
      "These are technical sound-design details, not medical or scientific claims.",
      "The three WAV files are test material and do not form a consumer release.",
    ],
  },
};

export function getRitual(ritualId: string): RitualContent | undefined {
  return RITUALS.find((ritual) => ritual.id === ritualId);
}

export function getRitualForGoal(goal: Goal): RitualContent | undefined {
  return RITUALS.find((ritual) => ritual.goal === goal);
}

export function getRitualForPreset(
  audioPresetId: string,
): RitualContent | undefined {
  return AUDIO_TEST_RITUAL.audioPresetId === audioPresetId
    ? AUDIO_TEST_RITUAL
    : undefined;
}

export function getRitualTheme(themeId: string): RitualTheme | undefined {
  return RITUAL_THEMES.find((theme) => theme.id === themeId);
}

export function requireRitualTheme(themeId: string): RitualTheme {
  const theme = getRitualTheme(themeId);
  if (!theme) {
    throw new Error(`Unknown ritual theme: ${themeId}`);
  }
  return theme;
}
