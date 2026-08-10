import { Pressable, StyleSheet, Text, View } from "react-native";
import { useRouter } from "expo-router";
import { colors, fonts, spacing } from "@/design/theme";

interface TopBarProps {
  label?: string;
  showBack?: boolean;
  actionLabel?: string;
  onAction?: () => void;
}

export function TopBar({
  label = "RITUAL AUDIO",
  showBack = false,
  actionLabel,
  onAction,
}: TopBarProps) {
  const router = useRouter();
  return (
    <View style={styles.row}>
      {showBack ? (
        <Pressable
          accessibilityLabel="Go back"
          accessibilityRole="button"
          hitSlop={12}
          onPress={() => router.back()}
          style={({ pressed }) => [styles.back, pressed && styles.pressed]}
        >
          <Text style={styles.backText}>‹</Text>
        </Pressable>
      ) : (
        <View style={styles.mark} accessibilityElementsHidden>
          <View style={styles.markInner} />
        </View>
      )}
      <Text style={styles.label}>{label}</Text>
      {actionLabel && onAction ? (
        <Pressable
          accessibilityRole="button"
          hitSlop={10}
          onPress={onAction}
          style={({ pressed }) => pressed && styles.pressed}
        >
          <Text style={styles.action}>{actionLabel}</Text>
        </Pressable>
      ) : (
        <View style={styles.actionSpacer} />
      )}
    </View>
  );
}

const styles = StyleSheet.create({
  row: {
    minHeight: 48,
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    marginBottom: spacing.lg,
  },
  mark: {
    width: 34,
    height: 34,
    borderRadius: 17,
    borderWidth: 1,
    borderColor: colors.moon,
    alignItems: "center",
    justifyContent: "center",
  },
  markInner: {
    width: 12,
    height: 12,
    borderRadius: 6,
    backgroundColor: colors.moon,
    opacity: 0.8,
  },
  back: {
    width: 44,
    height: 44,
    alignItems: "center",
    justifyContent: "center",
    marginLeft: -8,
  },
  backText: {
    color: colors.text,
    fontSize: 38,
    lineHeight: 40,
    fontFamily: fonts.serif,
  },
  label: {
    color: colors.textMuted,
    fontFamily: fonts.sans,
    fontSize: 11,
    letterSpacing: 2.2,
    fontWeight: "600",
  },
  action: {
    color: colors.moon,
    fontFamily: fonts.sans,
    fontSize: 13,
    fontWeight: "600",
  },
  actionSpacer: { width: 34 },
  pressed: { opacity: 0.55 },
});
