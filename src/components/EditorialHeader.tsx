import { useRouter } from "expo-router";
import { Pressable, StyleSheet, Text, View } from "react-native";
import { editorial } from "@/design/editorialTheme";
import { fonts, spacing } from "@/design/theme";

interface EditorialHeaderProps {
  actionLabel?: string;
  label: string;
  onAction?: () => void;
  showBack?: boolean;
}

export function EditorialHeader({
  actionLabel,
  label,
  onAction,
  showBack = false,
}: EditorialHeaderProps) {
  const router = useRouter();

  return (
    <View style={styles.header}>
      {showBack ? (
        <Pressable
          accessibilityLabel="Go back"
          accessibilityRole="button"
          hitSlop={10}
          onPress={() =>
            router.canGoBack() ? router.back() : router.replace("/")
          }
          style={({ pressed }) => [
            styles.sideAction,
            pressed && styles.pressed,
          ]}
        >
          <Text style={styles.backLabel}>‹ Back</Text>
        </Pressable>
      ) : (
        <View style={styles.brandBlock}>
          <Text style={styles.brand}>APP RELAX</Text>
          <Text style={styles.edition}>QUIET EDITION</Text>
        </View>
      )}

      <Text style={styles.section}>{label}</Text>

      {actionLabel && onAction ? (
        <Pressable
          accessibilityRole="button"
          hitSlop={10}
          onPress={onAction}
          style={({ pressed }) => [
            styles.sideAction,
            pressed && styles.pressed,
          ]}
        >
          <Text style={styles.action}>{actionLabel}</Text>
        </Pressable>
      ) : (
        <View style={styles.sideAction} />
      )}
    </View>
  );
}

const styles = StyleSheet.create({
  header: {
    zIndex: 1,
    minHeight: 48,
    flexDirection: "row",
    flexWrap: "wrap",
    columnGap: spacing.sm,
    rowGap: spacing.xs,
    alignItems: "center",
    justifyContent: "space-between",
    borderBottomWidth: 0,
    borderBottomColor: editorial.line,
    marginBottom: spacing.md,
  },
  brandBlock: { width: 92 },
  brand: {
    color: editorial.ink,
    fontFamily: fonts.sansSemiBold,
    fontSize: 14,
    letterSpacing: 1.1,
  },
  edition: {
    color: editorial.inkFaint,
    fontFamily: fonts.sans,
    fontSize: 12,
    lineHeight: 16,
    letterSpacing: 0.75,
    marginTop: 2,
  },
  section: {
    color: editorial.inkMuted,
    fontFamily: fonts.sansMedium,
    fontSize: 14,
    flexShrink: 1,
    textAlign: "center",
    letterSpacing: 0.3,
  },
  sideAction: {
    minWidth: 92,
    minHeight: 48,
    alignItems: "flex-end",
    justifyContent: "center",
  },
  action: {
    color: editorial.gold,
    fontFamily: fonts.sansSemiBold,
    fontSize: 14,
  },
  backLabel: {
    alignSelf: "flex-start",
    color: editorial.ink,
    fontFamily: fonts.sansSemiBold,
    fontSize: 14,
    letterSpacing: 0.65,
  },
  pressed: {
    backgroundColor: editorial.paperDeep,
    transform: [{ translateY: 1 }],
  },
});
