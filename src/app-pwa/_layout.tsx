import "react-native-gesture-handler";
import { useFonts } from "expo-font";
import { Stack } from "expo-router";
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
        <Head>
          <title>App Relax</title>
        </Head>
        <Stack
          screenOptions={{
            headerShown: false,
            contentStyle: { backgroundColor: colors.background },
            animation: reducedMotion ? "none" : "fade",
            animationDuration: 200,
          }}
        />
        <CurrentSessionBar />
        <StatusBar style="dark" />
      </AudioProvider>
    </SafeAreaProvider>
  );
}
