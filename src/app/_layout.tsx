import "react-native-gesture-handler";
import { useFonts } from "expo-font";
import { Stack } from "expo-router";
import * as SplashScreen from "expo-splash-screen";
import { StatusBar } from "expo-status-bar";
import { useEffect } from "react";
import { View } from "react-native";
import { SafeAreaProvider } from "react-native-safe-area-context";
import { AudioProvider } from "@/audio/AudioProvider";
import { createAudioGraphDriver } from "@/audio/createAudioDriver";
import { colors } from "@/design/theme";
import { fontAssets } from "@/design/fontAssets";
import { useReducedMotionPreference } from "@/design/useReducedMotionPreference";
import { CurrentSessionBar } from "@/components/CurrentSessionBar";
import { NativeCatalogGate } from "@/components/NativeCatalogGate";

void SplashScreen.preventAutoHideAsync();

export default function RootLayout() {
  const reducedMotion = useReducedMotionPreference();
  const [fontsLoaded, fontError] = useFonts(fontAssets);

  useEffect(() => {
    if (fontsLoaded || fontError) {
      void SplashScreen.hideAsync();
    }
  }, [fontError, fontsLoaded]);

  if (!fontsLoaded && !fontError) {
    return <View style={{ flex: 1, backgroundColor: colors.background }} />;
  }

  return (
    <SafeAreaProvider>
      <AudioProvider createDriver={createAudioGraphDriver}>
        <NativeCatalogGate>
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
        </NativeCatalogGate>
      </AudioProvider>
    </SafeAreaProvider>
  );
}
