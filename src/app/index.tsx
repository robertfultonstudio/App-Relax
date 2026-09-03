import { type Href, useFocusEffect, useRouter } from "expo-router";
import { useCallback, useState } from "react";
import { StyleSheet, Text, View } from "react-native";
import { EditorialHeader } from "@/components/EditorialHeader";
import { EditorialScreen } from "@/components/EditorialScreen";
import { OutcomeGridTile } from "@/components/OutcomeGridTile";
import { LastSessionAction } from "@/components/LastSessionAction";
import { ProductTabBar } from "@/components/ProductTabBar";
import { CONSUMER_OUTCOMES } from "@/content/productShell";
import { editorial } from "@/design/editorialTheme";
import { RITUALS_HOME_BACKGROUND } from "@/design/shellArtwork";
import { fonts, spacing } from "@/design/theme";
import {
  createAdaptiveSessionHistoryStore,
  type SavedSessionRequest,
} from "@/state/adaptiveSessionPersistence";
import { isAdaptivePlaybackAvailable } from "@/domain/sessions/playbackAvailability";

const sessionHistoryStore = createAdaptiveSessionHistoryStore();

export default function HomeScreen() {
  const router = useRouter();
  const [lastRequest, setLastRequest] = useState<SavedSessionRequest | null>(
    null,
  );
  const playbackAvailable = isAdaptivePlaybackAvailable();

  useFocusEffect(
    useCallback(() => {
      let mounted = true;
      void sessionHistoryStore
        .load()
        .then((history) => {
          if (mounted) setLastRequest(history.lastRequest);
        })
        .catch(() => {
          if (mounted) setLastRequest(null);
        });
      return () => {
        mounted = false;
      };
    }, []),
  );

  function playLastSession(): void {
    if (!lastRequest) return;
    router.push(
      `/adaptive-session/${lastRequest.outcome}?duration=${lastRequest.durationMinutes}&start=1` as Href,
    );
  }

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
        Choose a need, choose a duration, then start. Personalisation stays
        optional.
      </Text>

      <LastSessionAction
        available={playbackAvailable}
        onPress={playLastSession}
        request={lastRequest}
      />

      <View
        accessibilityLabel="Planned consumer actions"
        style={styles.grid}
        testID="outcome-grid"
      >
        {CONSUMER_OUTCOMES.map((outcome) => {
          return (
            <OutcomeGridTile
              featuredTitle={outcome.evocativeTitle}
              key={outcome.id}
              onPress={() => router.push(`/outcome/${outcome.id}` as Href)}
              outcome={outcome}
            />
          );
        })}
      </View>

      <Text style={styles.footerNote}>
        Choose the purpose first. Music names and deeper choices come later.
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
