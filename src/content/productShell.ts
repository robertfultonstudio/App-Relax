export type ProductTabId = "rituals" | "yoga" | "soundscapes";

export interface ProductTab {
  id: ProductTabId;
  label: string;
  route: "/" | "/yoga" | "/soundscapes";
}

export interface PlannedCollection {
  id: string;
  label: string;
  title: string;
  description: string;
  meta: string;
  accent: string;
  wash: string;
  cosmic?: boolean;
}

export type ConsumerOutcomeId =
  "meditation" | "yoga" | "massage" | "relax" | "sleep" | "focus";

export interface ConsumerOutcome {
  id: ConsumerOutcomeId;
  functionLabel: string;
  cta: string;
  homeFormat: string;
  plannedFormat: string;
  evocativeTitle: string;
  description: string;
  accent: string;
  wash: string;
  cosmic?: boolean;
}

export const PRODUCT_TABS: readonly ProductTab[] = [
  { id: "rituals", label: "HOME", route: "/" },
  { id: "yoga", label: "HATHA", route: "/yoga" },
] as const;

export const CONSUMER_OUTCOMES: readonly ConsumerOutcome[] = [
  {
    id: "meditation",
    functionLabel: "MEDITATION",
    cta: "Begin meditation",
    homeFormat: "10 / 20 / 30 / 45 / 60 / 90 min",
    plannedFormat: "10 / 20 / 30 / 45 / 60 / 90 min",
    evocativeTitle: "Aquarian Sky",
    description:
      "A clear entry into stillness, shaped around the time you have.",
    accent: "#C5CBE8",
    wash: "#8397C8",
    cosmic: true,
  },
  {
    id: "yoga",
    functionLabel: "YOGA",
    cta: "Start your yoga session",
    homeFormat: "20 / 30 / 45 / 60 / 90 min",
    plannedFormat: "20 / 30 / 45 / 60 / 90 min",
    evocativeTitle: "Cedar Ascent",
    description: "A direct class-ready path, with duration chosen before play.",
    accent: "#C8DCCB",
    wash: "#8FB69C",
  },
  {
    id: "massage",
    functionLabel: "MASSAGE",
    cta: "Start your massage session",
    homeFormat: "30 / 45 / 60 / 90 min",
    plannedFormat: "30 / 45 / 60 / 90 min",
    evocativeTitle: "Quiet Tide",
    description: "A future continuous atmosphere for preparing the room.",
    accent: "#E5C6B7",
    wash: "#C9967F",
  },
  {
    id: "relax",
    functionLabel: "RELAX",
    cta: "Relax now",
    homeFormat: "10 / 20 / 30 / 45 / 60 / 90 min",
    plannedFormat: "10 / 20 / 30 / 45 / 60 / 90 min",
    evocativeTitle: "Soft Horizon",
    description: "A future immediate pause without setup or exploration.",
    accent: "#B9D8CC",
    wash: "#7FB29F",
  },
  {
    id: "sleep",
    functionLabel: "SLEEP",
    cta: "Prepare for sleep",
    homeFormat: "30 / 45 / 60 / 90 min",
    plannedFormat: "30 / 45 / 60 / 90 min",
    evocativeTitle: "Night Garden",
    description: "A future evening path designed to begin in one clear step.",
    accent: "#D9C6E5",
    wash: "#A68CBE",
    cosmic: true,
  },
  {
    id: "focus",
    functionLabel: "FOCUS",
    cta: "Focus",
    homeFormat: "20 / 30 / 45 / 60 / 90 min",
    plannedFormat: "20 / 30 / 45 / 60 / 90 min",
    evocativeTitle: "Cedar Light",
    description: "A future uncomplicated start for reading and steady work.",
    accent: "#D8D6AE",
    wash: "#AAA567",
  },
] as const;

export const YOGA_JOURNEYS: readonly PlannedCollection[] = [
  {
    id: "arrive-20",
    label: "20 MINUTES",
    title: "Arrive",
    description: "A future gentle entry for breath, mobility and attention.",
    meta: "Planned practice format",
    accent: "#C8DCCB",
    wash: "#9FBFA8",
  },
  {
    id: "move-30",
    label: "30 MINUTES",
    title: "Move",
    description: "A future unhurried sequence with room between transitions.",
    meta: "Planned practice format",
    accent: "#E7C9B4",
    wash: "#D7A98C",
  },
  {
    id: "deepen-45",
    label: "45 MINUTES",
    title: "Deepen",
    description: "A future longer arc for steady movement and quiet pauses.",
    meta: "Planned practice format",
    accent: "#D9C6E5",
    wash: "#B59BC8",
  },
  {
    id: "unfold-60",
    label: "60 MINUTES",
    title: "Unfold",
    description: "A future full practice with a spacious beginning and close.",
    meta: "Planned practice format",
    accent: "#D8D6AE",
    wash: "#B7B06E",
  },
] as const;

export const SOUNDSCAPE_COLLECTIONS: readonly PlannedCollection[] = [
  {
    id: "standalone-works",
    label: "AUTONOMOUS WORKS",
    title: "Standalone works",
    description:
      "Future complete pieces designed as destinations of their own.",
    meta: "No catalogue published yet",
    accent: "#D9C4E8",
    wash: "#AA8DC1",
  },
  {
    id: "elemental-worlds",
    label: "CURATED SERIES",
    title: "Elemental Worlds",
    description:
      "Future environments shaped around air, water, earth and fire.",
    meta: "No audio available yet",
    accent: "#B9D8CC",
    wash: "#7FB29F",
  },
  {
    id: "field-recording",
    label: "REAL PLACES",
    title: "Field recordings",
    description:
      "Future listening works grounded in carefully recorded places.",
    meta: "No recordings published yet",
    accent: "#E5C69F",
    wash: "#C18F63",
  },
  {
    id: "cosmic-zen-ambient",
    label: "COSMIC",
    title: "Cosmic / Zen ambient",
    description:
      "Future celestial works with a spacious, restrained and contemporary voice.",
    meta: "No audio available yet",
    accent: "#B9CCE8",
    wash: "#829FC8",
    cosmic: true,
  },
  {
    id: "esoteric-series",
    label: "COSMIC",
    title: "Esoteric Series",
    description:
      "A future editorial family for rarefied, symbolic and luminous listening.",
    meta: "No audio available yet",
    accent: "#E2C9E8",
    wash: "#A784BB",
    cosmic: true,
  },
] as const;
