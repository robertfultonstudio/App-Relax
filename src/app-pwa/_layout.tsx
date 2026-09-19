import "react-native-gesture-handler";
import { useFonts } from "expo-font";
import { Stack, usePathname } from "expo-router";
import Head from "expo-router/head";
import * as SplashScreen from "expo-splash-screen";
import { StatusBar } from "expo-status-bar";
import { useEffect } from "react";
import { Platform, View } from "react-native";
import { SafeAreaProvider } from "react-native-safe-area-context";
import { AudioProvider } from "@/audio/AudioProvider";
import { createPwaAudioGraphDriver } from "@/audio/createPwaAudioDriver";
import { colors } from "@/design/theme";
import { fontAssets } from "@/design/fontAssets";
import { useReducedMotionPreference } from "@/design/useReducedMotionPreference";
import { CurrentSessionBar } from "@/components/CurrentSessionBar";
import { PwaViewProvider, usePwaView } from "@/pwa-view/PwaViewProvider";
import { PwaListeningNavigation } from "@/pwa-view/PwaListeningNavigation";

void SplashScreen.preventAutoHideAsync();

export default function PwaRootLayout() {
  const reducedMotion = useReducedMotionPreference();
  const [fontsLoaded, fontError] = useFonts(fontAssets);

  useEffect(() => {
    if (fontsLoaded || fontError) void SplashScreen.hideAsync();
  }, [fontError, fontsLoaded]);

  if (Platform.OS !== "web" && !fontsLoaded && !fontError) {
    return <View style={{ flex: 1, backgroundColor: colors.background }} />;
  }

  return (
    <SafeAreaProvider>
      <AudioProvider createDriver={createPwaAudioGraphDriver}>
        <PwaViewProvider>
          <Head>
            <title>App Relax</title>
            <meta
              content="PWA_DUAL_VIEW_SENTINEL"
              name="app-relax-build-surface"
            />
            <style>{`
              button:focus-visible,
              a:focus-visible,
              [role="button"]:focus-visible,
              [role="tab"]:focus-visible,
              input:focus-visible,
              summary:focus-visible {
                outline: 2px solid #397260 !important;
                outline-offset: 2px !important;
              }
              [data-testid^="outcome-"] {
                animation: app-relax-tile-in 340ms ease-out both;
              }
              [data-testid^="outcome-"]:nth-child(2) { animation-delay: 35ms; }
              [data-testid^="outcome-"]:nth-child(3) { animation-delay: 70ms; }
              [data-testid^="outcome-"]:nth-child(4) { animation-delay: 105ms; }
              [data-testid^="outcome-"]:nth-child(5) { animation-delay: 140ms; }
              [data-testid^="outcome-"]:nth-child(6) { animation-delay: 175ms; }
              @keyframes app-relax-tile-in {
                from { opacity: 0; transform: translateY(4px); }
                to { opacity: 1; transform: translateY(0); }
              }
              @media (prefers-reduced-motion: reduce) {
                [data-testid^="outcome-"] { animation: none; }
              }
              @media (orientation: landscape) and (min-width: 600px) and (max-height: 500px) {
                [data-testid="outcome-grid"] {
                  flex: 0 0 188px !important;
                  height: 188px !important;
                  min-height: 188px !important;
                  overflow: hidden !important;
                }
                [data-testid="outcome-meditation"],
                [data-testid="outcome-yoga"],
                [data-testid="outcome-massage"],
                [data-testid="outcome-relax"],
                [data-testid="outcome-sleep"],
                [data-testid="outcome-focus"] {
                  flex-basis: 32% !important;
                  width: 32% !important;
                  min-height: 90px !important;
                  height: 90px !important;
                }
              }
            `}</style>
          </Head>
          <Stack
            screenOptions={{
              headerShown: false,
              contentStyle: { backgroundColor: colors.background },
              animation: reducedMotion ? "none" : "fade",
              animationDuration: 180,
            }}
          />
          <PwaChrome />
          <StatusBar style="dark" />
        </PwaViewProvider>
      </AudioProvider>
    </SafeAreaProvider>
  );
}

function PwaChrome() {
  const path = usePathname();
  const { viewMode } = usePwaView();
  if (path === "/") return null;
  return (
    <>
      <CurrentSessionBar showReviewCopy={viewMode === "workbench"} />
      <PwaListeningNavigation />
    </>
  );
}
