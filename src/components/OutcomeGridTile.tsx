import { Image, Pressable, StyleSheet, Text, View } from "react-native";
import type { ConsumerOutcome } from "@/content/productShell";
import { editorial, OUTCOME_EDITORIAL_SURFACE } from "@/design/editorialTheme";
import { OUTCOME_ARTWORK } from "@/design/outcomeArtwork";
import { fonts, spacing } from "@/design/theme";

export function OutcomeGridTile({
  onPress,
  outcome,
}: {
  onPress: () => void;
  outcome: ConsumerOutcome;
}) {
  return (
    <Pressable
      accessibilityHint="Choose a listening duration and sound"
      accessibilityLabel={`${outcome.functionLabel}. Choose your listening time.`}
      accessibilityRole="button"
      onPress={onPress}
      style={({ pressed }) => [
        styles.tile,
        { borderColor: outcome.wash },
        pressed && styles.pressed,
      ]}
      testID={`outcome-${outcome.id}`}
    >
      <View style={styles.artworkFrame}>
        <Image
          accessibilityIgnoresInvertColors
          accessible={false}
          resizeMode="cover"
          source={OUTCOME_ARTWORK[outcome.id]}
          style={styles.artwork}
          testID={`outcome-artwork-${outcome.id}`}
        />
      </View>
      <View
        style={[
          styles.caption,
          { backgroundColor: OUTCOME_EDITORIAL_SURFACE[outcome.id] },
        ]}
      >
        <Text style={styles.label}>{outcome.functionLabel}</Text>
        <Text accessible={false} style={styles.arrow}>
          →
        </Text>
      </View>
    </Pressable>
  );
}

const styles = StyleSheet.create({
  tile: {
    width: "48%",
    minHeight: 148,
    backgroundColor: editorial.paperLight,
    borderWidth: StyleSheet.hairlineWidth,
  },
  artworkFrame: { height: 102, width: "100%", overflow: "hidden" },
  artwork: { height: "100%", width: "100%" },
  caption: {
    minHeight: 46,
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    gap: spacing.xs,
    paddingHorizontal: spacing.sm,
    paddingVertical: spacing.xs,
  },
  label: {
    flexShrink: 1,
    color: editorial.ink,
    fontFamily: fonts.sansSemiBold,
    fontSize: 14,
    lineHeight: 20,
    letterSpacing: 0.3,
  },
  arrow: { color: editorial.ink, fontSize: 18 },
  pressed: { opacity: 0.82 },
});
