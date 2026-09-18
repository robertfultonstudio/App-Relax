import { useEffect, useState } from "react";
import { type Href, useRouter } from "expo-router";
import {
  Animated,
  Platform,
  Pressable,
  ScrollView,
  StyleSheet,
  Text,
  View,
  useWindowDimensions,
} from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import { LinearGradient } from "expo-linear-gradient";
import { M6_PLAYER_PAINTING } from "@/design/shellArtwork";
import { editorial } from "@/design/editorialTheme";
import { fonts } from "@/design/theme";
import { useReducedMotionPreference } from "@/design/useReducedMotionPreference";

/** No autoplay or catalogue acquisition at the entrance. Only the painting
 * moves; text stays crisp. Motion is finite, cancellable and optional. */
export default function WelcomeScreen() {
  const router = useRouter();
  const { height } = useWindowDimensions();
  const reduceMotion = useReducedMotionPreference();
  const [arrival] = useState(() => new Animated.Value(1));
  const [touch] = useState(() => new Animated.Value(0));
  const [entering, setEntering] = useState(false);
  useEffect(() => {
    if (reduceMotion) {
      arrival.stopAnimation();
      touch.stopAnimation();
      arrival.setValue(1);
      touch.setValue(0);
      return;
    }
    arrival.setValue(0);
    const animation = Animated.timing(arrival, {
      toValue: 1,
      duration: 1800,
      useNativeDriver: Platform.OS !== "web",
    });
    animation.start();
    return () => {
      animation.stop();
      touch.stopAnimation();
    };
  }, [arrival, touch, reduceMotion]);
  function respond(pressed: boolean) {
    if (reduceMotion) return;
    Animated.timing(touch, {
      toValue: pressed ? 1 : 0,
      duration: pressed ? 100 : 240,
      useNativeDriver: Platform.OS !== "web",
    }).start();
  }
  function enter() {
    if (entering) return;
    setEntering(true);
    router.replace("/moments" as Href);
  }
  return (
    <View style={styles.screen} testID="welcome-screen">
      <Animated.Image
        accessible={false}
        source={M6_PLAYER_PAINTING}
        resizeMode="cover"
        style={[
          styles.painting,
          {
            transform: [
              {
                translateY: arrival.interpolate({
                  inputRange: [0, 1],
                  outputRange: [12, 0],
                }),
              },
              {
                scale: touch.interpolate({
                  inputRange: [0, 1],
                  outputRange: [1.025, 1.04],
                }),
              },
            ],
          },
        ]}
      />
      <LinearGradient
        pointerEvents="none"
        colors={[
          "rgba(247,241,228,0.3)",
          "rgba(247,241,228,0)",
          "rgba(247,241,228,0.96)",
        ]}
        locations={[0, 0.48, 0.92]}
        style={StyleSheet.absoluteFill}
      />
      <SafeAreaView style={{ flex: 1 }}>
        <ScrollView
          contentContainerStyle={[
            styles.content,
            { minHeight: Math.max(600, height - 56) },
          ]}
        >
          <View style={styles.masthead}>
            <Text style={styles.brand}>App Relax</Text>
            <Text style={styles.aside}>A little space for you</Text>
          </View>
          <View style={styles.openSpace} accessible={false} />
          <View style={styles.invitation}>
            <Text accessibilityRole="header" style={styles.title}>
              Make room{"\n"}for quiet.
            </Text>
            <Text style={styles.description}>
              Sound for the moment you need. Nothing to keep up with.
            </Text>
            <Pressable
              accessibilityRole="button"
              accessibilityLabel="Choose your moment"
              accessibilityHint="Enter the activities and listening experience"
              accessibilityState={{ busy: entering, disabled: entering }}
              disabled={entering}
              onPressIn={() => respond(true)}
              onPressOut={() => respond(false)}
              onPress={enter}
              style={({ pressed }) => [styles.enter, pressed && styles.pressed]}
              testID="welcome-enter"
            >
              <Text style={styles.enterText}>
                {entering ? "Opening…" : "Choose your moment"}
              </Text>
              <View accessible={false} style={styles.arrow}>
                <View style={styles.arrowHead} />
              </View>
            </Pressable>
            <Text style={styles.footnote}>
              Press Play. Leave the phone behind.
            </Text>
          </View>
        </ScrollView>
      </SafeAreaView>
    </View>
  );
}
const styles = StyleSheet.create({
  screen: { flex: 1, backgroundColor: editorial.paper },
  painting: {
    position: "absolute",
    top: 0,
    left: 0,
    width: "100%",
    height: "100%",
  },
  content: {
    flexGrow: 1,
    paddingHorizontal: 28,
    paddingTop: 26,
    paddingBottom: 32,
    width: "100%",
    maxWidth: 720,
    alignSelf: "center",
  },
  masthead: { gap: 8 },
  brand: { fontFamily: fonts.serif, color: editorial.ink, fontSize: 25 },
  aside: { fontFamily: fonts.sans, fontSize: 13, color: editorial.inkMuted },
  openSpace: { flex: 1, minHeight: 150 },
  invitation: { gap: 20 },
  title: {
    fontFamily: fonts.serif,
    fontSize: 46,
    lineHeight: 53,
    letterSpacing: -1.4,
    color: editorial.ink,
  },
  description: {
    maxWidth: 280,
    fontFamily: fonts.sans,
    fontSize: 17,
    lineHeight: 25,
    color: editorial.inkMuted,
  },
  enter: {
    minHeight: 60,
    paddingHorizontal: 22,
    paddingVertical: 16,
    backgroundColor: "#D9D6E1",
    borderWidth: 1,
    borderColor: "#82788F",
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    gap: 16,
  },
  pressed: { backgroundColor: "#C9C4D6", borderColor: editorial.ink },
  enterText: {
    fontFamily: fonts.sansSemiBold,
    color: editorial.ink,
    fontSize: 17,
    flexShrink: 1,
  },
  arrow: {
    width: 25,
    height: 1,
    backgroundColor: editorial.ink,
    marginRight: 2,
  },
  arrowHead: {
    position: "absolute",
    right: 0,
    top: -4,
    width: 9,
    height: 9,
    borderRightWidth: 1,
    borderTopWidth: 1,
    borderColor: editorial.ink,
    transform: [{ rotate: "45deg" }],
  },
  footnote: {
    fontFamily: fonts.sans,
    fontSize: 13,
    lineHeight: 20,
    color: editorial.inkMuted,
  },
});
