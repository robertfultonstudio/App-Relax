import { LinearGradient } from "expo-linear-gradient";
import {
  ImageBackground,
  Pressable,
  StyleSheet,
  Text,
  View,
} from "react-native";
import type { RitualContent, RitualTheme } from "@/content/rituals";
import { getRitualArtwork } from "@/design/ritualArtwork";
import { fonts, radii, spacing } from "@/design/theme";

interface RitualCardProps {
  ritual: RitualContent;
  theme: RitualTheme;
  onPress?: () => void;
  fullWidth?: boolean;
}

export function RitualCard({
  ritual,
  theme,
  onPress,
  fullWidth = false,
}: RitualCardProps) {
  const available = ritual.availability === "available";
  const stateLabel = available ? "AVAILABLE" : "IN PRODUCTION";

  return (
    <Pressable
      accessibilityHint={
        available
          ? `Open ${ritual.title}`
          : `${ritual.title} is in production and cannot be opened yet`
      }
      accessibilityLabel={`${ritual.goal}. ${ritual.title}. ${ritual.shortDescription}. ${stateLabel}`}
      accessibilityRole="button"
      accessibilityState={{ disabled: !available }}
      disabled={!available}
      onPress={onPress}
      style={({ pressed }) => [
        styles.card,
        fullWidth && styles.fullWidth,
        pressed && styles.pressed,
      ]}
      testID={`ritual-card-${ritual.id}`}
    >
      <ImageBackground
        accessibilityIgnoresInvertColors
        imageStyle={styles.image}
        resizeMode="cover"
        source={getRitualArtwork(ritual.artworkKey)}
        style={StyleSheet.absoluteFill}
      />
      <LinearGradient
        colors={[
          "rgba(3, 7, 10, 0.12)",
          "rgba(3, 7, 10, 0.48)",
          "rgba(3, 7, 10, 0.93)",
        ]}
        locations={[0, 0.48, 1]}
        style={StyleSheet.absoluteFill}
      />

      <View style={styles.topRow}>
        <Text style={[styles.goal, { color: theme.palette.accent }]}>
          {ritual.goal.toUpperCase()}
        </Text>
        <View
          style={[styles.state, { borderColor: `${theme.palette.accent}88` }]}
        >
          <Text style={styles.stateText}>{stateLabel}</Text>
        </View>
      </View>

      <View>
        <Text style={styles.title}>{ritual.title}</Text>
        <Text numberOfLines={3} style={styles.description}>
          {ritual.shortDescription}
        </Text>
        {available ? (
          <Text style={[styles.open, { color: theme.palette.accent }]}>
            Open →
          </Text>
        ) : null}
      </View>
    </Pressable>
  );
}

const styles = StyleSheet.create({
  card: {
    width: "48.3%",
    minHeight: 246,
    padding: spacing.md,
    justifyContent: "space-between",
    borderRadius: radii.lg,
    overflow: "hidden",
    borderWidth: 1,
    borderColor: "rgba(255, 255, 255, 0.16)",
    backgroundColor: "#111820",
  },
  fullWidth: { width: "100%", minHeight: 330 },
  image: { borderRadius: radii.lg },
  topRow: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    gap: spacing.xs,
  },
  goal: {
    flexShrink: 0,
    fontFamily: fonts.sansSemiBold,
    fontSize: 8,
    letterSpacing: 1,
  },
  state: {
    minHeight: 28,
    justifyContent: "center",
    paddingHorizontal: 6,
    borderRadius: radii.pill,
    borderWidth: 1,
    backgroundColor: "rgba(4, 8, 10, 0.52)",
  },
  stateText: {
    color: "#F6F1E8",
    fontFamily: fonts.sansSemiBold,
    fontSize: 6.5,
    letterSpacing: 0.55,
  },
  title: {
    color: "#FAF5EC",
    fontFamily: fonts.serif,
    fontSize: 25,
    lineHeight: 28,
  },
  description: {
    color: "#D9D9D2",
    fontFamily: fonts.sans,
    fontSize: 11,
    lineHeight: 16,
    marginTop: spacing.xs,
  },
  open: {
    minHeight: 32,
    paddingTop: spacing.sm,
    fontFamily: fonts.sansSemiBold,
    fontSize: 11,
  },
  pressed: { opacity: 0.82, transform: [{ scale: 0.99 }] },
});
