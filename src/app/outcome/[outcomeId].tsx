import { type Href, useLocalSearchParams, useRouter } from "expo-router";
import { Image, StyleSheet, Text, View } from "react-native";
import { ConsumerWorkCard } from "@/components/ConsumerWorkCard";
import { EditorialHeader } from "@/components/EditorialHeader";
import { EditorialScreen } from "@/components/EditorialScreen";
import {
  CONSUMER_OUTCOMES,
  type ConsumerOutcomeId,
} from "@/content/productShell";
import { getWorksForOutcome, isEmbeddedWork } from "@/content/consumerCatalog";
import { OUTCOME_ARTWORK } from "@/design/outcomeArtwork";
import { editorial } from "@/design/editorialTheme";
import { fonts, spacing } from "@/design/theme";

export default function OutcomeCatalogScreen() {
  const router = useRouter();
  const { outcomeId } = useLocalSearchParams<{ outcomeId: string }>();
  const outcome = CONSUMER_OUTCOMES.find((item) => item.id === outcomeId);
  if (!outcome) return null;
  const works = [...getWorksForOutcome(outcome.id as ConsumerOutcomeId)].sort(
    (left, right) =>
      Number(isEmbeddedWork(right)) - Number(isEmbeddedWork(left)),
  );

  return (
    <EditorialScreen>
      <EditorialHeader label={outcome.functionLabel} showBack />
      <Image
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
        Choose one complete work. No layers, setup or technical controls.
      </Text>
      <View style={styles.list}>
        {works.map((work, index) => (
          <ConsumerWorkCard
            featured={index === 0 && isEmbeddedWork(work)}
            key={work.id}
            onPress={() =>
              router.push(
                `/listen/${work.id}${index === 0 ? "?start=1" : ""}` as Href,
              )
            }
            startsPlayback={index === 0 && isEmbeddedWork(work)}
            work={work}
          />
        ))}
      </View>
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
  list: { marginTop: spacing.xl },
});
