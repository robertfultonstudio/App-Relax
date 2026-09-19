import {
  Image,
  Pressable,
  StyleSheet,
  Text,
  useWindowDimensions,
  View,
} from "react-native";
import type { ConsumerOutcome } from "@/content/productShell";
import { editorial } from "@/design/editorialTheme";
import { HOME_ACTIVITY_CROPS } from "@/design/homeActivityCrops";
import { M6_HOME_PAINTING } from "@/design/shellArtwork";
import { fonts } from "@/design/theme";

export function OutcomeGridTile({
  onPress,
  outcome,
  painted = false,
}: {
  onPress: () => void;
  outcome: ConsumerOutcome;
  painted?: boolean;
}) {
  const { fontScale, height, width } = useWindowDimensions();
  const landscape = painted && width > height;
  const crop = HOME_ACTIVITY_CROPS[outcome.id];
  return (
    <Pressable
      accessibilityHint="Open and press Play. The timer is optional."
      accessibilityLabel={`${outcome.functionLabel}. Open and press Play.`}
      accessibilityRole="button"
      onPress={onPress}
      style={({ pressed }) => [
        styles.tile,
        painted && styles.paintedTile,
        landscape && styles.paintedLandscape,
        fontScale > 1.3 && styles.largeText,
        pressed && styles.pressed,
      ]}
      testID={`outcome-${outcome.id}`}
    >
      {painted ? (
        <>
          <Image
            accessible={false}
            resizeMode="stretch"
            source={M6_HOME_PAINTING}
            style={[styles.artwork, { left: crop.left, top: crop.top }]}
            testID={`outcome-artwork-${outcome.id}`}
          />
          <View style={styles.wash} />
          <View style={styles.labelSurface}>
            <Text style={styles.paintedLabel}>
              {outcome.functionLabel.toLowerCase()}
            </Text>
          </View>
        </>
      ) : (
        <Text style={styles.label}>{outcome.functionLabel.toLowerCase()}</Text>
      )}
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
  paintedTile: {
    width: "48.8%",
    minHeight: 104,
    flexBasis: "48.8%",
    height: "31.5%",
    paddingBottom: 0,
    paddingHorizontal: 0,
    overflow: "hidden",
  },
  paintedLandscape: {
    width: "32%",
    flexBasis: "32%",
    height: "48%",
    minHeight: 80,
  },
  largeText: { minHeight: 220 },
  artwork: {
    position: "absolute",
    width: "200%",
    height: "300%",
  },
  wash: {
    position: "absolute",
    inset: 0,
    backgroundColor: "rgba(248,242,232,0.18)",
  },
  labelSurface: {
    width: "100%",
    minHeight: 36,
    justifyContent: "center",
    alignItems: "center",
    paddingHorizontal: 4,
    backgroundColor: "rgba(248,242,232,0.82)",
  },
  label: {
    flexShrink: 1,
    color: editorial.ink,
    fontFamily: fonts.sans,
    fontSize: 19,
    lineHeight: 26,
    textTransform: "capitalize",
    letterSpacing: -0.3,
  },
  paintedLabel: {
    flexShrink: 1,
    color: editorial.ink,
    fontFamily: fonts.sansSemiBold,
    fontSize: 15,
    lineHeight: 20,
    textTransform: "capitalize",
    letterSpacing: -0.3,
  },
  pressed: { opacity: 0.82 },
});
