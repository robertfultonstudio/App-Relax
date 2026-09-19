import { type Href, useRouter } from "expo-router";
import type { ReactNode } from "react";
import {
  Pressable,
  ScrollView,
  StyleSheet,
  Text,
  useWindowDimensions,
  View,
} from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import { LinearGradient } from "expo-linear-gradient";
import { EditorialScreen } from "@/components/EditorialScreen";
import { OutcomeGridTile } from "@/components/OutcomeGridTile";
import { LastListeningAction } from "@/components/LastListeningAction";
import { FullBleedArtwork } from "@/components/FullBleedArtwork";
import { ProductTabBar } from "@/components/ProductTabBar";
import { CONSUMER_OUTCOMES } from "@/content/productShell";
import { editorial } from "@/design/editorialTheme";
import { C3_HOME_FULL_BLEED, M6_HOME_PAINTING } from "@/design/shellArtwork";
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

  if (activityArtwork) {
    return (
      <AtmosphericHome
        reviewProgramFactory={reviewProgramFactory}
        onOpen={(route) => router.push(route as Href)}
      />
    );
  }

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

const HOME_LABELS = {
  meditation: "Meditazione",
  yoga: "Yoga",
  massage: "Massaggio",
  relax: "Relax",
  sleep: "Sonno",
  focus: "Concentrazione",
} as const;

function AtmosphericHome({
  onOpen,
  reviewProgramFactory,
}: {
  onOpen: (route: string) => void;
  reviewProgramFactory?: (
    input: CreateAdaptiveSessionInput,
  ) => AdaptiveSessionProgram;
}) {
  const { height, width } = useWindowDimensions();
  const large = width >= 420 || height >= 900;
  return (
    <View style={styles.atmosphericRoot} testID="atmospheric-home">
      <FullBleedArtwork
        source={C3_HOME_FULL_BLEED}
        testID="home-full-bleed-artwork"
      />
      <LinearGradient
        pointerEvents="none"
        colors={[
          "rgba(244,238,230,0.38)",
          "rgba(244,238,230,0.08)",
          "rgba(244,238,230,0.42)",
        ]}
        locations={[0, 0.56, 1]}
        style={StyleSheet.absoluteFill}
      />
      <SafeAreaView edges={["top", "left", "right"]} style={styles.safeArea}>
        <ScrollView
          contentContainerStyle={[
            styles.atmosphericContent,
            large && styles.atmosphericContentLarge,
          ]}
          showsVerticalScrollIndicator={false}
          testID="home-atmospheric-scroll"
        >
          <Text style={styles.eyebrow}>APP RELAX</Text>
          <Text
            accessibilityRole="header"
            nativeID="consumer-screen-title"
            style={[
              styles.atmosphericTitle,
              large && styles.atmosphericTitleLarge,
            ]}
            testID="consumer-screen-title"
          >
            Scegli il tuo momento
          </Text>
          <View
            accessibilityLabel="Scegli il tuo momento"
            style={[
              styles.destinationList,
              large && styles.destinationListLarge,
            ]}
            testID="outcome-list"
          >
            {CONSUMER_OUTCOMES.map((outcome) => (
              <Pressable
                accessibilityHint="Apre l’attività e prepara l’ascolto"
                accessibilityLabel={HOME_LABELS[outcome.id]}
                accessibilityRole="button"
                key={outcome.id}
                onPress={() => onOpen(`/outcome/${outcome.id}`)}
                style={({ pressed }) => [
                  styles.destination,
                  pressed && styles.atmosphericPressed,
                ]}
                testID={`outcome-${outcome.id}`}
              >
                <Text
                  style={[
                    styles.destinationLabel,
                    large && styles.destinationLabelLarge,
                  ]}
                >
                  {HOME_LABELS[outcome.id]}
                </Text>
                <Text accessible={false} style={styles.destinationArrow}>
                  →
                </Text>
              </Pressable>
            ))}
          </View>
          <LastListeningAction
            reviewProgramFactory={reviewProgramFactory}
            atmospheric
          />
        </ScrollView>
      </SafeAreaView>
    </View>
  );
}

const styles = StyleSheet.create({
  atmosphericRoot: {
    flex: 1,
    backgroundColor: "#F4EEE6",
    overflow: "hidden",
  },
  safeArea: { flex: 1 },
  atmosphericContent: {
    flexGrow: 1,
    paddingHorizontal: 24,
    paddingTop: 24,
    paddingBottom: 88,
  },
  atmosphericContentLarge: { paddingHorizontal: 28, paddingTop: 28 },
  eyebrow: {
    color: "#20384D",
    fontFamily: fonts.sansSemiBold,
    fontSize: 12,
    lineHeight: 16,
    letterSpacing: 2.4,
  },
  atmosphericTitle: {
    color: "#20384D",
    fontFamily: fonts.serif,
    fontSize: 40,
    lineHeight: 44,
    letterSpacing: -1.1,
    marginTop: 48,
    maxWidth: 330,
  },
  atmosphericTitleLarge: { fontSize: 44, lineHeight: 48, marginTop: 56 },
  destinationList: { marginTop: 74 },
  destinationListLarge: { marginTop: 90 },
  destination: {
    alignItems: "center",
    flexDirection: "row",
    justifyContent: "space-between",
    minHeight: 56,
    width: "100%",
  },
  destinationLabel: {
    color: "#20384D",
    fontFamily: fonts.serif,
    fontSize: 20,
    lineHeight: 26,
  },
  destinationLabelLarge: { fontSize: 22, lineHeight: 28 },
  destinationArrow: {
    color: "#20384D",
    fontFamily: fonts.sans,
    fontSize: 16,
  },
  atmosphericPressed: { backgroundColor: "rgba(32,56,77,0.06)" },
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
