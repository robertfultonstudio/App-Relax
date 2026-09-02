import { Image, Pressable, StyleSheet, Text, View } from "react-native";
import type {
  ConsumerOutcome,
  ConsumerOutcomeId,
} from "@/content/productShell";
import {
  editorial,
  OUTCOME_EDITORIAL_ACCENT,
  OUTCOME_EDITORIAL_SURFACE,
} from "@/design/editorialTheme";
import { OUTCOME_ARTWORK } from "@/design/outcomeArtwork";
import { fonts, spacing } from "@/design/theme";

interface OutcomeGridTileProps {
  available: boolean;
  featuredTitle: string;
  onPress: () => void;
  outcome: ConsumerOutcome;
}

const OUTCOME_NUMBER: Readonly<Record<ConsumerOutcomeId, string>> = {
  yoga: "01",
  massage: "02",
  relax: "03",
  meditation: "04",
  sleep: "05",
  focus: "06",
};

export function OutcomeGridTile({
  available,
  featuredTitle,
  onPress,
  outcome,
}: OutcomeGridTileProps) {
  const accent = OUTCOME_EDITORIAL_ACCENT[outcome.id];
  const surface = OUTCOME_EDITORIAL_SURFACE[outcome.id];

  return (
    <Pressable
      accessibilityHint={
        available
          ? "Opens a filtered list with locally available audio"
          : "The audio for this outcome requires delivery"
      }
      accessibilityLabel={`${outcome.functionLabel}. ${outcome.cta}. ${outcome.homeFormat}. ${available ? "Audio available locally" : "Audio delivery required"}.`}
      accessibilityRole="button"
      accessibilityState={{ disabled: !available }}
      disabled={!available}
      onPress={onPress}
      style={[styles.tile, { borderColor: outcome.wash }]}
      testID={`outcome-${outcome.id}`}
    >
      <View
        style={[
          styles.metaRow,
          {
            backgroundColor: outcome.accent,
            borderBottomColor: outcome.wash,
          },
        ]}
      >
        <Text style={styles.functionLabel}>{outcome.functionLabel}</Text>
        <Text style={styles.number}>{OUTCOME_NUMBER[outcome.id]}</Text>
      </View>

      <View style={[styles.artworkFrame, { borderBottomColor: outcome.wash }]}>
        <Image
          accessibilityIgnoresInvertColors
          accessible={false}
          resizeMode="cover"
          source={OUTCOME_ARTWORK[outcome.id]}
          style={styles.artwork}
          testID={`outcome-artwork-${outcome.id}`}
        />
      </View>

      <View style={[styles.copy, { backgroundColor: surface }]}>
        <Text style={styles.cta}>{outcome.cta}</Text>
        <Text style={styles.format}>{outcome.homeFormat}</Text>
        <View style={styles.futureRow}>
          <Text style={styles.futureLabel}>FEATURED</Text>
          <Text style={[styles.evocativeTitle, { color: accent }]}>
            {featuredTitle}
          </Text>
        </View>
        <Text style={[styles.state, { borderTopColor: outcome.wash }]}>
          {available ? "START HERE" : "DELIVERY REQUIRED"}
        </Text>
      </View>
    </Pressable>
  );
}

const styles = StyleSheet.create({
  tile: {
    width: "48%",
    minHeight: 348,
    backgroundColor: editorial.paperLight,
    borderWidth: StyleSheet.hairlineWidth,
  },
  metaRow: {
    minHeight: 40,
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    gap: spacing.xs,
    paddingHorizontal: spacing.sm,
    borderBottomWidth: StyleSheet.hairlineWidth,
  },
  functionLabel: {
    flexShrink: 1,
    color: editorial.ink,
    fontFamily: fonts.sansSemiBold,
    fontSize: 11,
    letterSpacing: 0.9,
  },
  number: {
    color: editorial.inkMuted,
    fontFamily: fonts.sansSemiBold,
    fontSize: 11,
    letterSpacing: 0.7,
  },
  artworkFrame: {
    width: "100%",
    aspectRatio: 1.25,
    borderBottomWidth: StyleSheet.hairlineWidth,
    overflow: "hidden",
  },
  artwork: {
    width: "100%",
    height: "100%",
  },
  copy: {
    flex: 1,
    paddingHorizontal: spacing.sm,
    paddingBottom: spacing.sm,
    paddingTop: 10,
  },
  cta: {
    minHeight: 66,
    color: editorial.ink,
    fontFamily: fonts.serif,
    fontSize: 20,
    lineHeight: 21,
    letterSpacing: -0.25,
  },
  format: {
    minHeight: 34,
    color: editorial.inkMuted,
    fontFamily: fonts.sansMedium,
    fontSize: 11,
    lineHeight: 16,
    marginTop: 6,
  },
  futureRow: {
    alignItems: "baseline",
    flexDirection: "row",
    gap: 5,
    marginTop: spacing.sm,
    minHeight: 20,
  },
  futureLabel: {
    color: editorial.inkFaint,
    fontFamily: fonts.sansSemiBold,
    fontSize: 11,
    letterSpacing: 0.65,
  },
  evocativeTitle: {
    flexShrink: 1,
    fontFamily: fonts.serifItalic,
    fontSize: 14,
    lineHeight: 18,
  },
  state: {
    color: editorial.inkFaint,
    fontFamily: fonts.sansSemiBold,
    fontSize: 11,
    letterSpacing: 0.65,
    borderTopWidth: StyleSheet.hairlineWidth,
    marginTop: 6,
    paddingTop: 6,
  },
});
