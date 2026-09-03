import { useLocalSearchParams } from "expo-router";
import { Image, StyleSheet, Text } from "react-native";
import { AdaptiveSessionSetup } from "@/components/AdaptiveSessionSetup";
import { EditorialHeader } from "@/components/EditorialHeader";
import { EditorialScreen } from "@/components/EditorialScreen";
import {
  CONSUMER_OUTCOMES,
  type ConsumerOutcomeId,
} from "@/content/productShell";
import { OUTCOME_ARTWORK } from "@/design/outcomeArtwork";
import { editorial } from "@/design/editorialTheme";
import { fonts, spacing } from "@/design/theme";

export default function OutcomeSessionScreen() {
  const { outcomeId } = useLocalSearchParams<{ outcomeId: string }>();
  const outcome = CONSUMER_OUTCOMES.find((item) => item.id === outcomeId);
  if (!outcome) return null;

  return (
    <EditorialScreen>
      <EditorialHeader label={outcome.functionLabel} showBack />
      <Image
        accessible={false}
        accessibilityIgnoresInvertColors
        resizeMode="cover"
        source={OUTCOME_ARTWORK[outcome.id]}
        style={styles.artwork}
      />
      <Text style={styles.kicker}>{outcome.functionLabel}</Text>
      <Text accessibilityRole="header" style={styles.title}>
        {outcome.cta}
      </Text>
      <Text style={styles.intro}>
        One simple choice, then let the session move with you.
      </Text>
      <AdaptiveSessionSetup outcome={outcome.id as ConsumerOutcomeId} />
    </EditorialScreen>
  );
}

const styles = StyleSheet.create({
  artwork: { height: 190, width: "100%" },
  kicker: {
    color: editorial.gold,
    fontFamily: fonts.sansSemiBold,
    fontSize: 11,
    letterSpacing: 1.5,
    marginTop: spacing.lg,
  },
  title: {
    color: editorial.ink,
    fontFamily: fonts.serif,
    fontSize: 40,
    lineHeight: 43,
    marginTop: spacing.sm,
  },
  intro: {
    color: editorial.inkMuted,
    fontFamily: fonts.sans,
    fontSize: 14,
    lineHeight: 22,
    marginTop: spacing.md,
  },
});
