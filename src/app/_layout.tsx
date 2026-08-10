import "react-native-gesture-handler";
import { Stack } from "expo-router";
import { StatusBar } from "expo-status-bar";
import { SafeAreaProvider } from "react-native-safe-area-context";
import { AudioProvider } from "@/audio/AudioProvider";
import { colors } from "@/design/theme";

export default function RootLayout() {
  return (
    <SafeAreaProvider>
      <AudioProvider>
        <Stack
          screenOptions={{
            headerShown: false,
            contentStyle: { backgroundColor: colors.background },
            animation: "fade",
          }}
        />
        <StatusBar style="light" />
      </AudioProvider>
    </SafeAreaProvider>
  );
}
