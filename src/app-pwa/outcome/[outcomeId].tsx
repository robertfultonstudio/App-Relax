import { getPwaOutcomeStaticParams } from "@/content/pwaStaticRoutes";

import OutcomeSessionScreen from "../../app/outcome/[outcomeId]";
import { createWholeFileReviewProgram } from "@/pwa-review/createWholeFileReviewProgram";
import { createListeningNatureProgram } from "@/pwa-review/createListeningNatureProgram";
import { usePwaView } from "@/pwa-view/PwaViewProvider";
export default function PwaOutcome() {
  const { viewMode } = usePwaView();
  return (
    <OutcomeSessionScreen
      reviewProgramFactory={createWholeFileReviewProgram}
      createNatureProgram={createListeningNatureProgram}
      showDevelopmentLink={viewMode === "workbench"}
      immersiveYoga={viewMode === "consumer-preview"}
    />
  );
}

export function generateStaticParams() {
  return getPwaOutcomeStaticParams();
}
