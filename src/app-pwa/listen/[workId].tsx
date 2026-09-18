import { getPwaWorkStaticParams } from "@/content/pwaStaticRoutes";
import ConsumerPlayerScreen from "../../app/listen/[workId]";
import { PwaPlayerReviewControls } from "@/pwa-review/PwaPlayerReviewControls";
import { createListeningNatureProgram } from "@/pwa-review/createListeningNatureProgram";
import { useLocalSearchParams } from "expo-router";
import { useSyncExternalStore } from "react";
import { Text } from "react-native";
import { EditorialScreen } from "@/components/EditorialScreen";
import { PlaybackTransport } from "@/components/PlaybackTransport";
import { usePwaView } from "@/pwa-view/PwaViewProvider";
import { PwaConsumerTransportDock } from "@/pwa-view/PwaConsumerTransportDock";

const subscribe = () => () => {};
const clientReady = () => true;
const serverReady = () => false;

export default function PwaPlayer() {
  const { isolated } = useLocalSearchParams<{
    isolated?: string;
  }>();
  const { viewMode } = usePwaView();
  const workbench = viewMode === "workbench";
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
  const isolatedReview = isolated === "1";
  return (
    <ConsumerPlayerScreen
      hidePersistentTransport={workbench}
      renderPersistentTransport={(props) => (
        <PwaConsumerTransportDock {...props} />
      )}
      createNatureProgram={
        isolatedReview ? undefined : createListeningNatureProgram
      }
      renderNatureReview={(program, matching, onVariant, transport) => (
        <PwaPlayerReviewControls
          initiallyOpen
          visible={workbench}
          target={{ kind: "adaptive", program, matching, onVariant }}
          transport={transport}
        />
      )}
      renderReviewControls={(
        work,
        matching,
        elapsedSeconds,
        error,
        transport,
      ) => (
        <PwaPlayerReviewControls
          initiallyOpen
          visible={workbench}
          target={{ kind: "single", work, matching, elapsedSeconds, error }}
          transport={transport}
        />
      )}
    />
  );
}

export function generateStaticParams() {
  return getPwaWorkStaticParams();
}
