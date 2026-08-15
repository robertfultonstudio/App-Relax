import type { ConsumerOutcomeId } from "@/content/productShell";

export const editorial = {
  paper: "#F2E9DA",
  paperLight: "#F8F2E8",
  paperDeep: "#E7D9C5",
  ink: "#172220",
  inkMuted: "#4B5954",
  inkFaint: "#55615B",
  line: "#81796D",
  lineStrong: "#5F5B52",
  gold: "#735A27",
  jade: "#3E665E",
  rose: "#815247",
  lavender: "#6D5578",
  mineralBlue: "#445D78",
} as const;

export const OUTCOME_EDITORIAL_ACCENT: Readonly<
  Record<ConsumerOutcomeId, string>
> = {
  yoga: editorial.jade,
  massage: editorial.rose,
  relax: editorial.jade,
  meditation: editorial.mineralBlue,
  sleep: editorial.lavender,
  focus: editorial.gold,
};
