import { Pressable, StyleSheet, Text, useWindowDimensions } from "react-native";
import type { ConsumerOutcome } from "@/content/productShell";
import { editorial } from "@/design/editorialTheme";
import { fonts } from "@/design/theme";

export function OutcomeGridTile({
  onPress,
  outcome,
}: {
  onPress: () => void;
  outcome: ConsumerOutcome;
}) {
  const { fontScale } = useWindowDimensions();
  return (
    <Pressable
      accessibilityHint="Open and press Play. The timer is optional."
      accessibilityLabel={`${outcome.functionLabel}. Open and press Play.`}
      accessibilityRole="button"
      onPress={onPress}
      style={({ pressed }) => [
        styles.tile,
        fontScale > 1.3 && styles.largeText,
        pressed && styles.pressed,
      ]}
      testID={`outcome-${outcome.id}`}
    >
      <Text style={styles.label}>{outcome.functionLabel.toLowerCase()}</Text>
    </Pressable>
  );
}

const styles = StyleSheet.create({
  tile: {
    width: "50%",
    minHeight: 190,
    backgroundColor: "transparent",
    justifyContent: "flex-end",
    alignItems: "center",
    paddingBottom: 12,
    paddingHorizontal: 4,
  },
  largeText: { minHeight: 220 },
  label: {
    flexShrink: 1,
    color: editorial.ink,
    fontFamily: fonts.sans,
    fontSize: 19,
    lineHeight: 26,
    textTransform: "capitalize",
    letterSpacing: -0.3,
  },
  pressed: { opacity: 0.82 },
});
