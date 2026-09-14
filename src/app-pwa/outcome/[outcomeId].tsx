import { getPwaOutcomeStaticParams } from "@/content/pwaStaticRoutes";

import OutcomeSessionScreen from "../../app/outcome/[outcomeId]";
import { createWholeFileReviewProgram } from "@/pwa-review/createWholeFileReviewProgram";
import { createListeningNatureProgram } from "@/pwa-review/createListeningNatureProgram";
export default function PwaOutcome() {
  return (
    <OutcomeSessionScreen
      reviewProgramFactory={createWholeFileReviewProgram}
      createNatureProgram={createListeningNatureProgram}
    />
  );
}

export function generateStaticParams() {
  return getPwaOutcomeStaticParams();
}
