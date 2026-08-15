import { Image, Pressable, StyleSheet, Text, View } from "react-native";
import type {
  ConsumerOutcome,
  ConsumerOutcomeId,
} from "@/content/productShell";
import { editorial, OUTCOME_EDITORIAL_ACCENT } from "@/design/editorialTheme";
import { OUTCOME_ARTWORK } from "@/design/outcomeArtwork";
import { fonts, spacing } from "@/design/theme";

interface OutcomeGridTileProps {
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

export function OutcomeGridTile({ outcome }: OutcomeGridTileProps) {
  const accent = OUTCOME_EDITORIAL_ACCENT[outcome.id];

  return (
    <Pressable
      accessibilityHint="This consumer experience is in production and has no audio yet"
      accessibilityLabel={`${outcome.functionLabel}. ${outcome.cta}. ${outcome.homeFormat}. Future title: ${outcome.evocativeTitle}. In production.`}
      accessibilityRole="button"
      accessibilityState={{ disabled: true }}
      disabled
      style={styles.tile}
      testID={`outcome-${outcome.id}`}
    >
      <View style={styles.metaRow}>
        <Text style={[styles.functionLabel, { color: accent }]}>
          {outcome.functionLabel}
        </Text>
        <Text style={styles.number}>{OUTCOME_NUMBER[outcome.id]}</Text>
      </View>

      <Image
        accessibilityIgnoresInvertColors
        accessible={false}
        resizeMode="cover"
        source={OUTCOME_ARTWORK[outcome.id]}
        style={styles.artwork}
        testID={`outcome-artwork-${outcome.id}`}
      />

      <View style={styles.copy}>
        <Text style={styles.cta}>{outcome.cta}</Text>
        <Text style={styles.format}>{outcome.homeFormat}</Text>
        <View style={styles.futureRow}>
          <Text style={styles.futureLabel}>FUTURE TITLE</Text>
          <Text style={[styles.evocativeTitle, { color: accent }]}>
            {outcome.evocativeTitle}
          </Text>
        </View>
        <Text style={styles.state}>IN PRODUCTION</Text>
      </View>
    </Pressable>
  );
}

const styles = StyleSheet.create({
  tile: {
    width: "48%",
    minHeight: 356,
    backgroundColor: "rgba(248, 242, 232, 0.9)",
    borderColor: editorial.line,
    borderWidth: StyleSheet.hairlineWidth,
  },
  metaRow: {
    minHeight: 44,
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    gap: spacing.xs,
    paddingHorizontal: spacing.sm,
  },
  functionLabel: {
    flexShrink: 1,
    fontFamily: fonts.sansSemiBold,
    fontSize: 11,
    letterSpacing: 0.9,
  },
  number: {
    color: editorial.inkFaint,
    fontFamily: fonts.sansSemiBold,
    fontSize: 11,
    letterSpacing: 0.7,
  },
  artwork: {
    width: "100%",
    aspectRatio: 1.12,
  },
  copy: {
    flex: 1,
    paddingHorizontal: spacing.sm,
    paddingBottom: spacing.sm,
    paddingTop: spacing.md,
  },
  cta: {
    minHeight: 76,
    color: editorial.ink,
    fontFamily: fonts.serif,
    fontSize: 24,
    lineHeight: 25,
    letterSpacing: -0.25,
  },
  format: {
    minHeight: 34,
    color: editorial.inkMuted,
    fontFamily: fonts.sansMedium,
    fontSize: 11,
    lineHeight: 16,
    marginTop: spacing.sm,
  },
  futureRow: {
    marginTop: spacing.md,
    minHeight: 46,
  },
  futureLabel: {
    color: editorial.inkFaint,
    fontFamily: fonts.sansSemiBold,
    fontSize: 11,
    letterSpacing: 0.65,
  },
  evocativeTitle: {
    fontFamily: fonts.serifItalic,
    fontSize: 15,
    lineHeight: 19,
    marginTop: 2,
  },
  state: {
    color: editorial.inkFaint,
    fontFamily: fonts.sansSemiBold,
    fontSize: 11,
    letterSpacing: 0.65,
    borderTopColor: editorial.line,
    borderTopWidth: StyleSheet.hairlineWidth,
    marginTop: spacing.sm,
    paddingTop: spacing.sm,
  },
});
