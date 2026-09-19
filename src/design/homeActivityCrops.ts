import type { ConsumerOutcomeId } from "@/content/productShell";

export type HomeActivityCrop = {
  column: 0 | 1;
  row: 0 | 1 | 2;
  left: "0%" | "-100%";
  top: "0%" | "-100%" | "-200%";
};

/** Deterministic 2 x 3 mapping of the six approved vignettes in home.jpg. */
export const HOME_ACTIVITY_CROPS: Record<ConsumerOutcomeId, HomeActivityCrop> =
  {
    meditation: { column: 0, row: 0, left: "0%", top: "0%" },
    yoga: { column: 1, row: 0, left: "-100%", top: "0%" },
    massage: { column: 0, row: 1, left: "0%", top: "-100%" },
    relax: { column: 1, row: 1, left: "-100%", top: "-100%" },
    sleep: { column: 0, row: 2, left: "0%", top: "-200%" },
    focus: { column: 1, row: 2, left: "-100%", top: "-200%" },
  };
