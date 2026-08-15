import { useEffect, useState } from "react";
import { AccessibilityInfo, Animated, StyleSheet, View } from "react-native";
import type { RitualContent, RitualTheme } from "@/content/rituals";
import { getRitualArtwork } from "@/design/ritualArtwork";
import { radii } from "@/design/theme";

interface RitualArtworkProps {
  active: boolean;
  ritual: RitualContent;
  theme: RitualTheme;
}

export function RitualArtwork({ active, ritual, theme }: RitualArtworkProps) {
  const [progress] = useState(() => new Animated.Value(0));
  const [reduceMotion, setReduceMotion] = useState(true);

  useEffect(() => {
    let mounted = true;
    void AccessibilityInfo.isReduceMotionEnabled().then((enabled) => {
      if (mounted) {
        setReduceMotion(enabled);
      }
    });
    const subscription = AccessibilityInfo.addEventListener(
      "reduceMotionChanged",
      setReduceMotion,
    );
    return () => {
      mounted = false;
      subscription.remove();
    };
  }, []);

  useEffect(() => {
    progress.stopAnimation();
    if (!active || reduceMotion) {
      progress.setValue(0);
      return;
    }

    const duration = theme.motion === "drift" ? 22000 : 24000;
    const loop = Animated.loop(
      Animated.sequence([
        Animated.timing(progress, {
          duration,
          toValue: 1,
          useNativeDriver: true,
        }),
        Animated.timing(progress, {
          duration,
          toValue: 0,
          useNativeDriver: true,
        }),
      ]),
    );
    loop.start();
    return () => loop.stop();
  }, [active, progress, reduceMotion, theme.motion]);

  const translateX = progress.interpolate({
    inputRange: [0, 1],
    outputRange: theme.motion === "drift" ? [-2, 4] : [0, 0],
  });
  const scale = progress.interpolate({
    inputRange: [0, 1],
    outputRange: [1, theme.motion === "drift" ? 1.03 : 1.02],
  });

  return (
    <View
      accessibilityLabel={`${ritual.title} artwork. Player is ${active ? "playing" : "still"}.`}
      style={styles.frame}
    >
      <Animated.Image
        accessibilityIgnoresInvertColors
        resizeMode="cover"
        source={getRitualArtwork(ritual.artworkKey)}
        style={[styles.image, { transform: [{ translateX }, { scale }] }]}
      />
      <View pointerEvents="none" style={styles.shade} />
    </View>
  );
}

const styles = StyleSheet.create({
  frame: {
    height: 330,
    marginTop: 2,
    borderRadius: radii.lg,
    overflow: "hidden",
    backgroundColor: "#071019",
    borderWidth: 1,
    borderColor: "rgba(255, 255, 255, 0.12)",
  },
  image: {
    position: "absolute",
    left: -5,
    right: -5,
    top: -5,
    bottom: -5,
    width: "104%",
    height: "104%",
  },
  shade: {
    position: "absolute",
    top: 0,
    right: 0,
    bottom: 0,
    left: 0,
    backgroundColor: "rgba(2, 6, 10, 0.12)",
  },
});
