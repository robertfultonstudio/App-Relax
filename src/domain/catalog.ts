import type { Goal } from "./audio/types";

export interface Category {
  id: Goal;
  title: string;
  eyebrow: string;
  description: string;
  accent: string;
  glyph: string;
}

export const CATEGORIES: readonly Category[] = [
  {
    id: "sleep",
    title: "Sleep",
    eyebrow: "DEEP REST",
    description: "Slow layers for the quietest part of the day.",
    accent: "#8EA8C8",
    glyph: "☾",
  },
  {
    id: "calm",
    title: "Calm",
    eyebrow: "SOFT RESET",
    description: "Gentle spaces for unhurried breathing.",
    accent: "#91B7A3",
    glyph: "○",
  },
  {
    id: "focus",
    title: "Focus",
    eyebrow: "CLEAR SPACE",
    description: "Warm texture without the noise of urgency.",
    accent: "#D0AE77",
    glyph: "◇",
  },
  {
    id: "meditate",
    title: "Meditate",
    eyebrow: "INNER ROOM",
    description: "A simple ritual for returning to stillness.",
    accent: "#AD95B9",
    glyph: "✦",
  },
] as const;

export function getCategory(categoryId: string): Category | undefined {
  return CATEGORIES.find((category) => category.id === categoryId);
}
