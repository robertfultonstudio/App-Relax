import { type Href, useRouter } from "expo-router";
import { StyleSheet, Text, View } from "react-native";
import { EditorialHeader } from "@/components/EditorialHeader";
import { EditorialScreen } from "@/components/EditorialScreen";
import { OutcomeActionCard } from "@/components/OutcomeActionCard";
import { ProductTabBar } from "@/components/ProductTabBar";
import { ProductionCard } from "@/components/ProductionCard";
import { CONSUMER_OUTCOMES, YOGA_JOURNEYS } from "@/content/productShell";
import { editorial } from "@/design/editorialTheme";
import { fonts, spacing } from "@/design/theme";

export default function YogaScreen() {
  const router = useRouter();
  const yogaOutcome = CONSUMER_OUTCOMES[0];
  return (
    <EditorialScreen footer={<ProductTabBar activeTab="yoga" />}>
      <EditorialHeader
        actionLabel="Settings"
        label="YOGA"
        onAction={() => router.push("/settings" as Href)}
      />
      <Text style={styles.kicker}>YOGA</Text>
      <Text accessibilityRole="header" style={styles.title}>
        Begin your practice.
      </Text>
      <Text style={styles.intro}>
        Choose a journey shaped to move with you.
      </Text>

      <View style={styles.primaryAction}>
        <OutcomeActionCard outcome={yogaOutcome} primary />
      </View>

      <Text style={styles.sectionLabel}>CHOOSE A FUTURE DURATION</Text>
      <View accessibilityLabel="Planned yoga journeys" style={styles.list}>
        {YOGA_JOURNEYS.map((journey) => (
          <ProductionCard key={journey.id} {...journey} />
        ))}
      </View>
      <Text style={styles.note}>
        These formats are planned. No yoga session or audio is available yet.
      </Text>
    </EditorialScreen>
  );
}

const styles = StyleSheet.create({
  kicker: {
    color: editorial.jade,
    fontFamily: fonts.sansSemiBold,
    fontSize: 11,
    letterSpacing: 1.8,
  },
  title: {
    color: editorial.ink,
    fontFamily: fonts.serif,
    fontSize: 43,
    lineHeight: 46,
    marginTop: spacing.sm,
  },
  intro: {
    color: editorial.inkMuted,
    fontFamily: fonts.sans,
    fontSize: 16,
    lineHeight: 24,
    marginTop: spacing.sm,
    maxWidth: 340,
  },
  list: { marginTop: spacing.xl },
  primaryAction: { marginTop: spacing.xl },
  sectionLabel: {
    color: editorial.inkFaint,
    fontFamily: fonts.sansSemiBold,
    fontSize: 11,
    letterSpacing: 1.15,
    marginTop: spacing.xl,
  },
  note: {
    color: editorial.inkFaint,
    fontFamily: fonts.sans,
    fontSize: 11,
    lineHeight: 17,
    marginTop: spacing.xl,
    borderTopWidth: StyleSheet.hairlineWidth,
    borderTopColor: editorial.line,
    paddingTop: spacing.md,
  },
});
