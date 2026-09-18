import { type Href, useRouter } from "expo-router";
import { Pressable, StyleSheet, Text, View } from "react-native";
import { EditorialScreen } from "@/components/EditorialScreen";
import { OutcomeGridTile } from "@/components/OutcomeGridTile";
import { LastListeningAction } from "@/components/LastListeningAction";
import { ProductTabBar } from "@/components/ProductTabBar";
import { CONSUMER_OUTCOMES } from "@/content/productShell";
import { editorial } from "@/design/editorialTheme";
import { M6_HOME_PAINTING } from "@/design/shellArtwork";
import { fonts, spacing } from "@/design/theme";
import { platformReviewProgramFactory } from "@/domain/sessions/platformSessionFactories";
import type {
  CreateAdaptiveSessionInput,
  AdaptiveSessionProgram,
} from "@/domain/sessions/types";

export default function MomentsScreen({
  reviewProgramFactory = platformReviewProgramFactory,
}: {
  reviewProgramFactory?: (
    input: CreateAdaptiveSessionInput,
  ) => AdaptiveSessionProgram;
} = {}) {
  const router = useRouter();

  return (
    <EditorialScreen
      painted
      backgroundArtwork={M6_HOME_PAINTING}
      backgroundArtworkTestID="rituals-home-background"
      footer={<ProductTabBar activeTab="rituals" />}
    >
      <View style={styles.mobileHeader}>
        <Text style={styles.brand}>App Relax</Text>
        <Pressable
          accessibilityRole="button"
          accessibilityLabel="Settings"
          onPress={() => router.push("/settings" as Href)}
          style={styles.settings}
        >
          <Text style={styles.settingsLabel}>Settings</Text>
        </Pressable>
      </View>

      <Text accessibilityRole="header" style={styles.title}>
        What do you need right now?
      </Text>
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
      <LastListeningAction
        reviewProgramFactory={reviewProgramFactory}
        compact
      />
      <Text style={styles.promise}>
        Choose your moment. Press Play. Leave the phone behind.
      </Text>
    </EditorialScreen>
  );
}

const styles = StyleSheet.create({
  mobileHeader: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    minHeight: 44,
  },
  brand: { fontFamily: fonts.sans, fontSize: 15, color: editorial.lavender },
  settings: {
    minHeight: 44,
    minWidth: 72,
    alignItems: "flex-end",
    justifyContent: "center",
  },
  settingsLabel: {
    fontFamily: fonts.sansSemiBold,
    fontSize: 14,
    color: editorial.ink,
  },
  title: {
    color: editorial.ink,
    fontFamily: fonts.serif,
    fontSize: 26,
    lineHeight: 31,
    letterSpacing: -0.7,
    marginTop: spacing.sm,
    maxWidth: 260,
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
    marginTop: 4,
  },
});
