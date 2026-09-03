import { Pressable, StyleSheet, Text, View } from "react-native";
import type { ConsumerAudioWork } from "@/domain/audio/consumerTypes";
import { isPlayableWork } from "@/content/consumerCatalog";
import { editorial } from "@/design/editorialTheme";
import { fonts, spacing } from "@/design/theme";

function formatSourceDuration(seconds: number): string {
  return seconds < 60
    ? `${Math.round(seconds)} sec`
    : `${Math.round(seconds / 60)} min`;
}

export function ConsumerWorkCard({
  featured = false,
  onPress,
  startsPlayback = false,
  work,
}: {
  featured?: boolean;
  onPress: () => void;
  startsPlayback?: boolean;
  work: ConsumerAudioWork;
}) {
  const available = isPlayableWork(work);
  const rejected = work.availability === "rejected-listening";
  const approved = work.listeningStatus === "APPROVED — LISTENING PASSED";
  return (
    <Pressable
      accessibilityHint={
        rejected
          ? "A replacement is being prepared"
          : available
            ? startsPlayback
              ? "Starts this sound"
              : "Opens this sound"
            : "This sound is in production"
      }
      accessibilityLabel={`${work.title}. ${work.primaryOutcome}. ${rejected || !available ? "In production" : "Available"}.`}
      accessibilityRole="button"
      accessibilityState={{ disabled: !available }}
      disabled={!available}
      onPress={onPress}
      style={({ pressed }) => [
        styles.card,
        featured && styles.featured,
        !available && styles.unavailable,
        pressed && styles.pressed,
      ]}
      testID={`consumer-work-${work.id}`}
    >
      <View style={styles.topRow}>
        <Text style={styles.outcome}>{work.primaryOutcome.toUpperCase()}</Text>
        <Text style={styles.state}>
          {rejected
            ? "IN PRODUCTION"
            : available
              ? startsPlayback
                ? "START"
                : "AVAILABLE"
              : "IN PRODUCTION"}
        </Text>
      </View>
      <Text style={styles.title}>{work.title}</Text>
      <Text style={styles.meta}>
        {rejected
          ? "A new version is being prepared"
          : `Complete sound · ${formatSourceDuration(work.durationSeconds)}`}
      </Text>
      <Text style={styles.gate}>
        {rejected
          ? "REJECTED AFTER LISTENING"
          : approved
            ? "READY TO LISTEN"
            : "PREVIEW · LISTENING REVIEW PENDING"}
      </Text>
    </Pressable>
  );
}

const styles = StyleSheet.create({
  card: {
    borderTopColor: editorial.line,
    borderTopWidth: StyleSheet.hairlineWidth,
    minHeight: 154,
    paddingBottom: spacing.lg,
    paddingTop: spacing.md,
  },
  featured: {
    backgroundColor: "rgba(232, 229, 232, 0.72)",
    borderColor: editorial.mineralBlue,
    borderWidth: StyleSheet.hairlineWidth,
    paddingHorizontal: spacing.md,
  },
  topRow: {
    alignItems: "center",
    flexDirection: "row",
    justifyContent: "space-between",
  },
  outcome: {
    color: editorial.mineralBlue,
    fontFamily: fonts.sansSemiBold,
    fontSize: 11,
    letterSpacing: 1.1,
  },
  state: {
    color: editorial.inkFaint,
    fontFamily: fonts.sansSemiBold,
    fontSize: 11,
    letterSpacing: 0.5,
  },
  title: {
    color: editorial.ink,
    fontFamily: fonts.serif,
    fontSize: 30,
    lineHeight: 34,
    marginTop: spacing.md,
  },
  meta: {
    color: editorial.inkMuted,
    fontFamily: fonts.sans,
    fontSize: 12,
    lineHeight: 18,
    marginTop: spacing.xs,
  },
  gate: {
    color: editorial.gold,
    fontFamily: fonts.sansSemiBold,
    fontSize: 11,
    letterSpacing: 0.55,
    marginTop: spacing.md,
  },
  unavailable: { opacity: 0.63 },
  pressed: { backgroundColor: editorial.paperDeep },
});
