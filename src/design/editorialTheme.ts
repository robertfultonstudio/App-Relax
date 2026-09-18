import type { ConsumerOutcomeId } from "@/content/productShell";

export const editorial = {
  paper: "#F6EFE4",
  paperLight: "#FAF5ED",
  paperDeep: "#E7D9C5",
  ink: "#29353B",
  inkMuted: "#4B5954",
  inkFaint: "#55615B",
  line: "#81796D",
  lineStrong: "#5F5B52",
  gold: "#735A27",
  jade: "#3E665E",
  rose: "#815247",
  lavender: "#625875",
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

export const OUTCOME_EDITORIAL_SURFACE: Readonly<
  Record<ConsumerOutcomeId, string>
> = {
  yoga: "#E8EBDE",
  massage: "#F2E3D7",
  relax: "#E3E9DE",
  meditation: "#E7E5E8",
  sleep: "#EDE3E7",
  focus: "#EDE8D4",
};
