import { getPwaOutcomeStaticParams } from "@/content/pwaStaticRoutes";
import { useSyncExternalStore } from "react";
import { Text } from "react-native";
import { EditorialScreen } from "@/components/EditorialScreen";
import AdaptiveSessionPlayerScreen from "../../app/adaptive-session/[outcomeId]";
import { PwaPlayerReviewControls } from "@/pwa-review/PwaPlayerReviewControls";
import { createWholeFileReviewProgram } from "@/pwa-review/createWholeFileReviewProgram";
import { usePwaView } from "@/pwa-view/PwaViewProvider";

const subscribe = () => () => {};
const clientReady = () => true;
const serverReady = () => false;

export default function PwaSessionPlayer() {
  const { viewMode } = usePwaView();
  const workbench = viewMode === "workbench";
  // Static exports do not know the requested query or session seed. Hydrate a
  // stable shell before creating the actual client plan, never a different plan.
  const hydrated = useSyncExternalStore(subscribe, clientReady, serverReady);
  if (!hydrated)
    return (
      <EditorialScreen>
        <Text>Preparing your session…</Text>
      </EditorialScreen>
    );
  return (
    <AdaptiveSessionPlayerScreen
      hidePersistentTransport={workbench}
      reviewProgramFactory={createWholeFileReviewProgram}
      renderReviewControls={(program, matching, onVariant, transport) => (
        <PwaPlayerReviewControls
          initiallyOpen
          visible={workbench}
          target={{ kind: "adaptive", program, matching, onVariant }}
          transport={transport}
        />
      )}
    />
  );
}

export function generateStaticParams() {
  return getPwaOutcomeStaticParams();
}
