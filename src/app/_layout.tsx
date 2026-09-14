import "react-native-gesture-handler";
import { useFonts } from "expo-font";
import { Stack, usePathname } from "expo-router";
import * as SplashScreen from "expo-splash-screen";
import { StatusBar } from "expo-status-bar";
import { useEffect } from "react";
import { View } from "react-native";
import { SafeAreaProvider } from "react-native-safe-area-context";
import { AudioProvider } from "@/audio/AudioProvider";
import { createAudioGraphDriver } from "@/audio/createAudioDriver";
import { colors } from "@/design/theme";
import { CurrentSessionBar } from "@/components/CurrentSessionBar";
import { NativeCatalogGate } from "@/components/NativeCatalogGate";

void SplashScreen.preventAutoHideAsync();

export default function RootLayout() {
  const pathname = usePathname();
  const [fontsLoaded, fontError] = useFonts({
    Manrope_400Regular: require("@expo-google-fonts/manrope/400Regular/Manrope_400Regular.ttf"),
    Manrope_500Medium: require("@expo-google-fonts/manrope/500Medium/Manrope_500Medium.ttf"),
    Manrope_600SemiBold: require("@expo-google-fonts/manrope/600SemiBold/Manrope_600SemiBold.ttf"),
    Newsreader_500Medium: require("@expo-google-fonts/newsreader/500Medium/Newsreader_500Medium.ttf"),
    Newsreader_500Medium_Italic: require("@expo-google-fonts/newsreader/500Medium_Italic/Newsreader_500Medium_Italic.ttf"),
  });

  useEffect(() => {
    if (fontsLoaded || fontError) {
      void SplashScreen.hideAsync();
    }
  }, [fontError, fontsLoaded]);

  if (!fontsLoaded && !fontError) {
    return <View style={{ flex: 1, backgroundColor: colors.background }} />;
  }

  const usesTechnicalShell =
    pathname === "/audio-test" ||
    pathname.startsWith("/category/") ||
    pathname.startsWith("/session/");

  return (
    <SafeAreaProvider>
      <AudioProvider createDriver={createAudioGraphDriver}>
        <NativeCatalogGate>
          <Stack
            screenOptions={{
              headerShown: false,
              contentStyle: { backgroundColor: colors.background },
              animation: "fade",
            }}
          />
          <CurrentSessionBar />
          <StatusBar style={usesTechnicalShell ? "light" : "dark"} />
        </NativeCatalogGate>
      </AudioProvider>
    </SafeAreaProvider>
  );
}
