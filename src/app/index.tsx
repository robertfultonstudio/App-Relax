import { type Href, useRouter } from "expo-router";
import { StyleSheet, Text, View } from "react-native";
import { EditorialScreen } from "@/components/EditorialScreen";
import { EditorialHeader } from "@/components/EditorialHeader";
import { OutcomeGridTile } from "@/components/OutcomeGridTile";
import { LastListeningAction } from "@/components/LastListeningAction";
import { ProductTabBar } from "@/components/ProductTabBar";
import { CONSUMER_OUTCOMES } from "@/content/productShell";
import { editorial } from "@/design/editorialTheme";
import { RITUALS_HOME_BACKGROUND } from "@/design/shellArtwork";
import { fonts, spacing } from "@/design/theme";

export default function HomeScreen() {
  const router = useRouter();

  return (
    <EditorialScreen
      backgroundArtwork={RITUALS_HOME_BACKGROUND}
      backgroundArtworkTestID="rituals-home-background"
      footer={<ProductTabBar activeTab="rituals" />}
    >
      <EditorialHeader
        actionLabel="Settings"
        label="HOME"
        onAction={() => router.push("/settings" as Href)}
      />

      <Text accessibilityRole="header" style={styles.title}>
        What do you need right now?
      </Text>
      <Text style={styles.promise}>
        Choose your moment and how long you have.
      </Text>

      <LastListeningAction />

      <View
        accessibilityLabel="Choose your moment"
        style={styles.grid}
        testID="outcome-grid"
      >
        {CONSUMER_OUTCOMES.map((outcome) => (
          <OutcomeGridTile
            key={outcome.id}
            onPress={() => router.push(`/outcome/${outcome.id}` as Href)}
            outcome={outcome}
          />
        ))}
      </View>
    </EditorialScreen>
  );
}

const styles = StyleSheet.create({
  title: {
    color: editorial.ink,
    fontFamily: fonts.serif,
    fontSize: 32,
    lineHeight: 35,
    letterSpacing: -0.7,
    marginTop: spacing.md,
    maxWidth: 340,
  },
  promise: {
    color: editorial.inkMuted,
    fontFamily: fonts.sans,
    fontSize: 14,
    lineHeight: 20,
    marginTop: spacing.sm,
    maxWidth: 320,
  },
  grid: {
    flexDirection: "row",
    flexWrap: "wrap",
    justifyContent: "space-between",
    rowGap: spacing.sm,
    marginTop: spacing.lg,
  },
});
