import { type Href, useRouter } from "expo-router";
import type { ReactNode } from "react";
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
  footer,
  compactViewport = false,
  activityArtwork = false,
  showHeaderSettings = true,
}: {
  reviewProgramFactory?: (
    input: CreateAdaptiveSessionInput,
  ) => AdaptiveSessionProgram;
  footer?: ReactNode | null;
  compactViewport?: boolean;
  activityArtwork?: boolean;
  showHeaderSettings?: boolean;
} = {}) {
  const router = useRouter();

  return (
    <EditorialScreen
      painted={!activityArtwork}
      backgroundArtwork={activityArtwork ? undefined : M6_HOME_PAINTING}
      backgroundArtworkTestID={
        activityArtwork ? undefined : "rituals-home-background"
      }
      footer={
        footer === undefined ? <ProductTabBar activeTab="rituals" /> : footer
      }
      contentStyle={compactViewport && styles.compactContent}
      scrollEnabled={!compactViewport}
    >
      <View
        style={[styles.mobileHeader, compactViewport && styles.compactHeader]}
      >
        <Text style={styles.brand}>App Relax</Text>
        {showHeaderSettings ? (
          <Pressable
            accessibilityRole="button"
            accessibilityLabel="Settings"
            onPress={() => router.push("/settings" as Href)}
            style={styles.settings}
          >
            <Text style={styles.settingsLabel}>Settings</Text>
          </Pressable>
        ) : null}
      </View>

      <Text
        accessibilityRole="header"
        nativeID="consumer-screen-title"
        style={[styles.title, compactViewport && styles.compactTitle]}
        testID="consumer-screen-title"
      >
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
            painted={activityArtwork}
          />
        ))}
      </View>
      <LastListeningAction
        reviewProgramFactory={reviewProgramFactory}
        compact
      />
      {!compactViewport ? (
        <Text style={styles.promise}>
          Choose your moment. Press Play. Leave the phone behind.
        </Text>
      ) : null}
    </EditorialScreen>
  );
}

const styles = StyleSheet.create({
  mobileHeader: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    minHeight: 36,
  },
  compactHeader: { minHeight: 56 },
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
    marginTop: 2,
    maxWidth: 260,
  },
  compactTitle: {
    fontSize: 28,
    lineHeight: 34,
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
    flex: 1,
    flexDirection: "row",
    flexWrap: "wrap",
    alignContent: "flex-start",
    justifyContent: "space-between",
    columnGap: 8,
    rowGap: 8,
    marginTop: 4,
  },
  compactContent: {
    paddingHorizontal: 16,
    paddingTop: 6,
    paddingBottom: 4,
  },
});
