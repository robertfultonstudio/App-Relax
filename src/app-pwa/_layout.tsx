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
import { CurrentSessionBar } from "@/components/CurrentSessionBar";

void SplashScreen.preventAutoHideAsync();

export default function PwaRootLayout() {
  const [fontsLoaded, fontError] = useFonts({
    Manrope_400Regular: require("@expo-google-fonts/manrope/400Regular/Manrope_400Regular.ttf"),
    Manrope_500Medium: require("@expo-google-fonts/manrope/500Medium/Manrope_500Medium.ttf"),
    Manrope_600SemiBold: require("@expo-google-fonts/manrope/600SemiBold/Manrope_600SemiBold.ttf"),
    Newsreader_500Medium: require("@expo-google-fonts/newsreader/500Medium/Newsreader_500Medium.ttf"),
    Newsreader_500Medium_Italic: require("@expo-google-fonts/newsreader/500Medium_Italic/Newsreader_500Medium_Italic.ttf"),
  });

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
            animation: "fade",
          }}
        />
        <CurrentSessionBar />
        <StatusBar style="dark" />
      </AudioProvider>
    </SafeAreaProvider>
  );
}
