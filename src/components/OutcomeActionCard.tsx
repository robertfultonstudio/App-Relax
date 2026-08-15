import { Image, Pressable, StyleSheet, Text, View } from "react-native";
import type {
  ConsumerOutcome,
  ConsumerOutcomeId,
} from "@/content/productShell";
import { editorial, OUTCOME_EDITORIAL_ACCENT } from "@/design/editorialTheme";
import { OUTCOME_ARTWORK } from "@/design/outcomeArtwork";
import { fonts, spacing } from "@/design/theme";

interface OutcomeActionCardProps {
  outcome: ConsumerOutcome;
  primary?: boolean;
}

const OUTCOME_NUMBER: Readonly<Record<ConsumerOutcomeId, string>> = {
  yoga: "01",
  massage: "02",
  relax: "03",
  meditation: "04",
  sleep: "05",
  focus: "06",
};

const LEADING_ARTWORK = new Set<ConsumerOutcomeId>([
  "massage",
  "meditation",
  "focus",
]);

export function OutcomeActionCard({
  outcome,
  primary = false,
}: OutcomeActionCardProps) {
  const accent = OUTCOME_EDITORIAL_ACCENT[outcome.id];
  const artwork = (
    <Image
      accessibilityIgnoresInvertColors
      accessible={false}
      resizeMode="cover"
      source={OUTCOME_ARTWORK[outcome.id]}
      style={primary ? styles.primaryArtwork : styles.artwork}
      testID={`outcome-artwork-${outcome.id}`}
    />
  );

  return (
    <Pressable
      accessibilityHint="This consumer experience is in production and has no audio yet"
      accessibilityLabel={`${outcome.functionLabel}. ${outcome.cta}. ${outcome.plannedFormat}. Future title: ${outcome.evocativeTitle}. In production.`}
      accessibilityRole="button"
      accessibilityState={{ disabled: true }}
      disabled
      style={[styles.section, primary && styles.primarySection]}
      testID={`outcome-${outcome.id}`}
    >
      <View style={styles.rule} />
      <View style={styles.metaRow}>
        <Text style={[styles.functionLabel, { color: accent }]}>
          {OUTCOME_NUMBER[outcome.id]} / {outcome.functionLabel}
        </Text>
        <Text style={styles.state}>IN PRODUCTION</Text>
      </View>

      {primary ? (
        <View>
          <Text style={styles.primaryCta}>{outcome.cta}</Text>
          <Text style={styles.format}>{outcome.plannedFormat}</Text>
          <View
            accessibilityElementsHidden
            importantForAccessibility="no-hide-descendants"
            style={styles.primaryArtworkStage}
          >
            <View style={[styles.verticalRule, { backgroundColor: accent }]} />
            {artwork}
          </View>
        </View>
      ) : (
        <View
          style={[
            styles.actionRow,
            LEADING_ARTWORK.has(outcome.id) && styles.actionRowReversed,
          ]}
        >
          <View style={styles.actionCopy}>
            <Text style={styles.cta}>{outcome.cta}</Text>
            <Text style={styles.format}>{outcome.plannedFormat}</Text>
          </View>
          <View
            accessibilityElementsHidden
            importantForAccessibility="no-hide-descendants"
            style={styles.artworkStage}
          >
            {artwork}
          </View>
        </View>
      )}

      <View style={styles.futureRow}>
        <Text style={styles.futureLabel}>FUTURE WORK</Text>
        <Text style={[styles.evocativeTitle, { color: accent }]}>
          {outcome.evocativeTitle}
        </Text>
      </View>
      <Text style={styles.description}>{outcome.description}</Text>
    </Pressable>
  );
}

const styles = StyleSheet.create({
  section: {
    paddingBottom: 38,
    paddingTop: 30,
  },
  primarySection: { paddingTop: 8, paddingBottom: 48 },
  rule: {
    height: StyleSheet.hairlineWidth,
    backgroundColor: editorial.lineStrong,
    marginBottom: spacing.md,
  },
  metaRow: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    gap: spacing.md,
  },
  functionLabel: {
    fontFamily: fonts.sansSemiBold,
    fontSize: 11,
    letterSpacing: 1.15,
  },
  state: {
    color: editorial.inkFaint,
    fontFamily: fonts.sansSemiBold,
    fontSize: 11,
    letterSpacing: 0.65,
  },
  primaryCta: {
    color: editorial.ink,
    fontFamily: fonts.serif,
    fontSize: 45,
    lineHeight: 46,
    letterSpacing: -0.5,
    marginTop: spacing.xl,
    maxWidth: 310,
  },
  cta: {
    color: editorial.ink,
    fontFamily: fonts.serif,
    fontSize: 31,
    lineHeight: 33,
    letterSpacing: -0.3,
  },
  format: {
    color: editorial.inkMuted,
    fontFamily: fonts.sansMedium,
    fontSize: 12,
    lineHeight: 18,
    marginTop: spacing.sm,
  },
  primaryArtworkStage: {
    minHeight: 274,
    justifyContent: "flex-end",
    marginTop: spacing.xl,
  },
  verticalRule: {
    position: "absolute",
    bottom: 0,
    left: 0,
    top: 48,
    width: 2,
    opacity: 0.72,
  },
  primaryArtwork: {
    width: "84%",
    aspectRatio: 1,
    alignSelf: "flex-end",
  },
  actionRow: {
    flexDirection: "row",
    alignItems: "center",
    gap: spacing.lg,
    marginTop: spacing.xl,
  },
  actionRowReversed: { flexDirection: "row-reverse" },
  actionCopy: { flex: 1 },
  artworkStage: { width: 114, height: 114 },
  artwork: { width: "100%", height: "100%" },
  futureRow: {
    flexDirection: "row",
    alignItems: "baseline",
    flexWrap: "wrap",
    gap: spacing.xs,
    marginTop: spacing.lg,
  },
  futureLabel: {
    color: editorial.inkFaint,
    fontFamily: fonts.sansSemiBold,
    fontSize: 11,
    letterSpacing: 0.9,
  },
  evocativeTitle: {
    fontFamily: fonts.serifItalic,
    fontSize: 19,
  },
  description: {
    color: editorial.inkMuted,
    fontFamily: fonts.sans,
    fontSize: 12,
    lineHeight: 19,
    marginTop: spacing.xs,
    maxWidth: 315,
  },
});
