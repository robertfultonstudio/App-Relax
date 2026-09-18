import "react-native-gesture-handler";
import { useFonts } from "expo-font";
import { Stack, usePathname } from "expo-router";
import * as SplashScreen from "expo-splash-screen";
import { StatusBar } from "expo-status-bar";
import { useEffect } from "react";
import { View } from "react-native";
import { SafeAreaProvider } from "react-native-safe-area-context";
import { AudioProvider } from "@/audio/AudioProvider";
import { createAudioGraphDriver } from "@/qa/createQaAudioDriver";
import { colors } from "@/design/theme";
import { fontAssets } from "@/design/fontAssets";

void SplashScreen.preventAutoHideAsync();

export default function QaRootLayout() {
  const pathname = usePathname();
  const [fontsLoaded, fontError] = useFonts(fontAssets);

  useEffect(() => {
    if (fontsLoaded || fontError) void SplashScreen.hideAsync();
  }, [fontError, fontsLoaded]);

  if (!fontsLoaded && !fontError) {
    return <View style={{ flex: 1, backgroundColor: colors.background }} />;
  }

  const usesTechnicalShell =
    pathname === "/audio-test" ||
    pathname === "/legal" ||
    pathname.startsWith("/category/") ||
    pathname.startsWith("/session/");

  return (
    <SafeAreaProvider>
      <AudioProvider createDriver={createAudioGraphDriver}>
        <Stack
          screenOptions={{
            headerShown: false,
            contentStyle: { backgroundColor: colors.background },
            animation: "fade",
          }}
        />
        <StatusBar style={usesTechnicalShell ? "light" : "dark"} />
      </AudioProvider>
    </SafeAreaProvider>
  );
}
