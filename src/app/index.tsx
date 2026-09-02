import { type Href, useRouter } from "expo-router";
import { StyleSheet, Text, View } from "react-native";
import { EditorialHeader } from "@/components/EditorialHeader";
import { EditorialScreen } from "@/components/EditorialScreen";
import { OutcomeGridTile } from "@/components/OutcomeGridTile";
import { ProductTabBar } from "@/components/ProductTabBar";
import { CONSUMER_OUTCOMES } from "@/content/productShell";
import {
  getEmbeddedWorksForOutcome,
  getWorksForOutcome,
} from "@/content/consumerCatalog";
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
        label="RITUALS"
        onAction={() => router.push("/settings" as Href)}
      />

      <Text accessibilityRole="header" style={styles.title}>
        What do you need right now?
      </Text>
      <Text style={styles.promise}>
        Choose your moment. Press start. Leave the phone behind.
      </Text>
      <Text style={styles.availability}>
        Four lossless works are available locally. All titles remain provisional
        until listening approval.
      </Text>

      <View
        accessibilityLabel="Planned consumer actions"
        style={styles.grid}
        testID="outcome-grid"
      >
        {CONSUMER_OUTCOMES.map((outcome) => {
          const embeddedWorks = getEmbeddedWorksForOutcome(outcome.id);
          return (
            <OutcomeGridTile
              available={embeddedWorks.length > 0}
              featuredTitle={
                embeddedWorks[0]?.title ??
                getWorksForOutcome(outcome.id)[0]?.title ??
                outcome.evocativeTitle
              }
              key={outcome.id}
              onPress={() => router.push(`/outcome/${outcome.id}` as Href)}
              outcome={outcome}
            />
          );
        })}
      </View>

      <Text style={styles.footerNote}>
        Function first. Each consumer work plays alone; the multilayer engine
        remains isolated in Audio Test.
      </Text>
    </EditorialScreen>
  );
}

const styles = StyleSheet.create({
  title: {
    color: editorial.ink,
    fontFamily: fonts.serif,
    fontSize: 38,
    lineHeight: 40,
    letterSpacing: -0.7,
    marginTop: spacing.sm,
    maxWidth: 340,
  },
  promise: {
    color: editorial.inkMuted,
    fontFamily: fonts.serifItalic,
    fontSize: 18,
    lineHeight: 24,
    marginTop: spacing.md,
    maxWidth: 320,
  },
  availability: {
    color: editorial.inkFaint,
    fontFamily: fonts.sansMedium,
    fontSize: 12,
    lineHeight: 18,
    marginTop: spacing.sm,
    maxWidth: 320,
  },
  grid: {
    flexDirection: "row",
    flexWrap: "wrap",
    justifyContent: "space-between",
    rowGap: spacing.md,
    marginTop: spacing.xl,
  },
  footerNote: {
    color: editorial.ink,
    fontFamily: fonts.sans,
    fontSize: 11,
    lineHeight: 17,
    marginTop: spacing.xl,
    borderTopWidth: StyleSheet.hairlineWidth,
    borderTopColor: editorial.lineStrong,
    backgroundColor: "rgba(248, 242, 232, 0.92)",
    padding: spacing.md,
  },
});
