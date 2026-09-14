import { getPwaOutcomeStaticParams } from "@/content/pwaStaticRoutes";
import { useSyncExternalStore } from "react";
import { useLocalSearchParams } from "expo-router";
import { Text } from "react-native";
import { EditorialScreen } from "@/components/EditorialScreen";
import AdaptiveSessionPlayerScreen from "../../app/adaptive-session/[outcomeId]";
import { PwaPlayerReviewControls } from "@/pwa-review/PwaPlayerReviewControls";
import { createWholeFileReviewProgram } from "@/pwa-review/createWholeFileReviewProgram";

const subscribe = () => () => {};
const clientReady = () => true;
const serverReady = () => false;

export default function PwaSessionPlayer() {
  const { review } = useLocalSearchParams<{ review?: string }>();
  const reviewOpen = review !== "0";
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
      reviewProgramFactory={createWholeFileReviewProgram}
      renderReviewControls={(program, matching, onVariant) => (
        <PwaPlayerReviewControls
          key={`${program.plan.seed}:${reviewOpen}`}
          initiallyOpen={reviewOpen}
          target={{ kind: "adaptive", program, matching, onVariant }}
        />
      )}
    />
  );
}

export function generateStaticParams() {
  return getPwaOutcomeStaticParams();
}
