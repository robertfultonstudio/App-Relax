import { Pressable, StyleSheet, Text, View } from "react-native";
import { editorial } from "@/design/editorialTheme";
import { fonts, spacing } from "@/design/theme";

interface ProductionCardProps {
  accent: string;
  compact?: boolean;
  cosmic?: boolean;
  description: string;
  id: string;
  label: string;
  meta?: string;
  title: string;
  wash: string;
}

export function ProductionCard({
  accent,
  compact = false,
  cosmic = false,
  description,
  id,
  label,
  meta,
  title,
}: ProductionCardProps) {
  const textAccent = cosmic ? editorial.mineralBlue : editorial.jade;

  return (
    <Pressable
      accessibilityHint={`${title} is in production and has no audio yet`}
      accessibilityLabel={`${label}. ${title}. ${description}. In production.`}
      accessibilityRole="button"
      accessibilityState={{ disabled: true }}
      disabled
      style={[styles.section, compact && styles.compactSection]}
      testID={`production-card-${id}`}
    >
      <View style={styles.rule} />
      <View style={styles.topRow}>
        <View style={styles.labelGroup}>
          <View style={[styles.accentMark, { backgroundColor: accent }]} />
          <Text style={[styles.label, { color: textAccent }]}>{label}</Text>
        </View>
        <Text style={styles.state}>IN PRODUCTION</Text>
      </View>

      <Text style={[styles.title, compact && styles.compactTitle]}>
        {title}
      </Text>
      <Text style={styles.description}>{description}</Text>
      {meta ? <Text style={styles.meta}>{meta}</Text> : null}
    </Pressable>
  );
}

const styles = StyleSheet.create({
  section: { minHeight: 182, paddingBottom: 34, paddingTop: 28 },
  compactSection: { width: "48.3%", minHeight: 220 },
  rule: {
    height: StyleSheet.hairlineWidth,
    backgroundColor: editorial.line,
    marginBottom: spacing.md,
  },
  topRow: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    gap: spacing.sm,
  },
  labelGroup: { flexDirection: "row", alignItems: "center", gap: spacing.sm },
  accentMark: { width: 22, height: 2 },
  label: {
    flexShrink: 1,
    fontFamily: fonts.sansSemiBold,
    fontSize: 11,
    letterSpacing: 1,
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
    fontSize: 34,
    lineHeight: 36,
    marginTop: spacing.xl,
  },
  compactTitle: { fontSize: 28, lineHeight: 30 },
  description: {
    color: editorial.inkMuted,
    fontFamily: fonts.sans,
    fontSize: 13,
    lineHeight: 20,
    marginTop: spacing.sm,
    maxWidth: 320,
  },
  meta: {
    color: editorial.gold,
    fontFamily: fonts.serifItalic,
    fontSize: 15,
    marginTop: spacing.md,
  },
});
