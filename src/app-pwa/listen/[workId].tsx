import { getPwaWorkStaticParams } from "@/content/pwaStaticRoutes";
import ConsumerPlayerScreen from "../../app/listen/[workId]";
import { PwaPlayerReviewControls } from "@/pwa-review/PwaPlayerReviewControls";
import { createListeningNatureProgram } from "@/pwa-review/createListeningNatureProgram";
import { useLocalSearchParams } from "expo-router";
import { useSyncExternalStore } from "react";
import { Pressable, StyleSheet, Text, View } from "react-native";
import { LinearGradient } from "expo-linear-gradient";
import { SafeAreaView } from "react-native-safe-area-context";
import { FullBleedArtwork } from "@/components/FullBleedArtwork";
import {
  LISTENING_SCENE_COPY,
  LISTENING_SCENE_SUBTITLE,
} from "@/components/ConsumerPlaybackSurface";
import { C3_PLAYER_FULL_BLEED } from "@/design/shellArtwork";
import { fonts } from "@/design/theme";
import { usePwaView } from "@/pwa-view/PwaViewProvider";

let browserHydrated = false;
let hydrationTimer: ReturnType<typeof setTimeout> | null = null;
const hydrationListeners = new Set<() => void>();

function subscribeAfterHydration(onStoreChange: () => void) {
  hydrationListeners.add(onStoreChange);
  if (!browserHydrated && hydrationTimer === null)
    hydrationTimer = setTimeout(() => {
      browserHydrated = true;
      hydrationTimer = null;
      for (const listener of hydrationListeners) listener();
    }, 0);
  return () => hydrationListeners.delete(onStoreChange);
}

const clientReady = () => browserHydrated;
const serverReady = () => false;
const testReady = () => true;
const subscribeTestReady = () => () => undefined;

export default function PwaPlayer() {
  const { isolated } = useLocalSearchParams<{
    isolated?: string;
  }>();
  const { viewMode } = usePwaView();
  const workbench = viewMode === "workbench";
  const hydrationRequired = process.env.NODE_ENV !== "test";
  const hydrated = useSyncExternalStore(
    hydrationRequired ? subscribeAfterHydration : subscribeTestReady,
    hydrationRequired ? clientReady : testReady,
    hydrationRequired ? serverReady : testReady,
  );
  if (!hydrated)
    return (
      <View style={styles.staticSurface} testID="static-player-shell">
        <FullBleedArtwork
          source={C3_PLAYER_FULL_BLEED}
          testID="player-full-bleed-artwork"
        />
        <LinearGradient
          pointerEvents="none"
          colors={[
            "rgba(244,238,230,0.26)",
            "rgba(244,238,230,0.01)",
            "rgba(244,238,230,0.42)",
          ]}
          locations={[0, 0.58, 1]}
          style={StyleSheet.absoluteFill}
        />
        <SafeAreaView edges={["top", "left", "right"]} style={styles.safeArea}>
          <View style={styles.staticContent}>
            <Text style={styles.staticBrand}>APP RELAX</Text>
            <Text
              accessibilityRole="header"
              style={styles.staticTitle}
              testID="consumer-screen-title"
            >
              {LISTENING_SCENE_COPY}
            </Text>
            <Text style={styles.staticSubtitle}>
              {LISTENING_SCENE_SUBTITLE}
            </Text>
            <View style={styles.staticSpacer} />
            <Text accessibilityRole="alert" style={styles.staticStatus}>
              Caricamento
            </Text>
            <Pressable
              accessibilityLabel="Inizia"
              accessibilityRole="button"
              accessibilityState={{ disabled: true }}
              disabled
              style={styles.staticAction}
            >
              <Text style={styles.staticActionLabel}>Inizia</Text>
            </Pressable>
          </View>
        </SafeAreaView>
      </View>
    );
  const isolatedReview = isolated === "1";
  return (
    <ConsumerPlayerScreen
      atmospheric={!workbench}
      disableAutoHide={workbench}
      hidePersistentTransport
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

const styles = StyleSheet.create({
  safeArea: { flex: 1 },
  staticAction: {
    alignItems: "center",
    alignSelf: "center",
    justifyContent: "center",
    minHeight: 64,
    minWidth: 96,
    opacity: 0.56,
  },
  staticActionLabel: {
    color: "#20384D",
    fontFamily: fonts.sansSemiBold,
    fontSize: 17,
  },
  staticBrand: {
    color: "#20384D",
    fontFamily: fonts.sansSemiBold,
    fontSize: 12,
    letterSpacing: 2.4,
    lineHeight: 16,
  },
  staticContent: {
    flex: 1,
    paddingBottom: 34,
    paddingHorizontal: 24,
    paddingTop: 24,
  },
  staticSpacer: { flex: 1 },
  staticStatus: {
    color: "#20384D",
    fontFamily: fonts.sans,
    fontSize: 15,
    lineHeight: 22,
    textAlign: "center",
  },
  staticSurface: {
    backgroundColor: "#F4EEE6",
    bottom: 0,
    left: 0,
    overflow: "hidden",
    position: "absolute",
    right: 0,
    top: 0,
  },
  staticTitle: {
    color: "#20384D",
    fontFamily: fonts.serif,
    fontSize: 40,
    letterSpacing: -1.1,
    lineHeight: 44,
    marginTop: 10,
    maxWidth: 310,
  },
  staticSubtitle: {
    color: "#29353B",
    fontFamily: fonts.sans,
    fontSize: 15,
    lineHeight: 22,
    marginTop: 10,
    maxWidth: 260,
  },
});
