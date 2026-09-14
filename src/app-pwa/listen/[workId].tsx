import { getPwaWorkStaticParams } from "@/content/pwaStaticRoutes";
import ConsumerPlayerScreen from "../../app/listen/[workId]";
import { PwaPlayerReviewControls } from "@/pwa-review/PwaPlayerReviewControls";
import { createListeningNatureProgram } from "@/pwa-review/createListeningNatureProgram";
import { useLocalSearchParams } from "expo-router";
import { useSyncExternalStore } from "react";
import { Text } from "react-native";
import { EditorialScreen } from "@/components/EditorialScreen";
import { PlaybackTransport } from "@/components/PlaybackTransport";

const subscribe = () => () => {};
const clientReady = () => true;
const serverReady = () => false;

export default function PwaPlayer() {
  const { review, isolated } = useLocalSearchParams<{
    review?: string;
    isolated?: string;
  }>();
  const reviewOpen = review !== "0";
  const hydrated = useSyncExternalStore(subscribe, clientReady, serverReady);
  if (!hydrated)
    return (
      <EditorialScreen>
        <Text accessibilityRole="alert">Loading sound…</Text>
        <PlaybackTransport
          canPlay={false}
          canStop={false}
          isPlaying={false}
          onPlayPause={() => {}}
          onStop={() => {}}
        />
      </EditorialScreen>
    );
  const isolatedReview = review === "1" && isolated === "1";
  return (
    <ConsumerPlayerScreen
      key={String(isolatedReview)}
      createNatureProgram={
        isolatedReview ? undefined : createListeningNatureProgram
      }
      renderNatureReview={(program, matching, onVariant) => (
        <PwaPlayerReviewControls
          key={`${program.plan.id}:${reviewOpen}`}
          initiallyOpen={reviewOpen}
          target={{ kind: "adaptive", program, matching, onVariant }}
        />
      )}
      renderReviewControls={(work, matching, elapsedSeconds, error) => (
        <PwaPlayerReviewControls
          key={`${work.id}:${reviewOpen}`}
          initiallyOpen={reviewOpen}
          target={{ kind: "single", work, matching, elapsedSeconds, error }}
        />
      )}
    />
  );
}

export function generateStaticParams() {
  return getPwaWorkStaticParams();
}
