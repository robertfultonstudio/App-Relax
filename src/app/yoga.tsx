import { type Href, useRouter } from "expo-router";
import { StyleSheet, Text, View } from "react-native";
import { EditorialHeader } from "@/components/EditorialHeader";
import { EditorialScreen } from "@/components/EditorialScreen";
import { AdaptiveSessionSetup } from "@/components/AdaptiveSessionSetup";
import { ProductTabBar } from "@/components/ProductTabBar";
import { CONSUMER_OUTCOMES } from "@/content/productShell";
import { editorial } from "@/design/editorialTheme";
import { fonts, spacing } from "@/design/theme";

export default function YogaScreen() {
  const router = useRouter();
  const yogaOutcome = CONSUMER_OUTCOMES.find(
    (outcome) => outcome.id === "yoga",
  );
  if (!yogaOutcome) return null;
  return (
    <EditorialScreen footer={<ProductTabBar activeTab="rituals" />}>
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
        <AdaptiveSessionSetup outcome="yoga" />
      </View>
      <Text style={styles.note}>
        Start with duration. Mode, voice and offline choices stay optional.
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
  primaryAction: { marginTop: spacing.xl },
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
