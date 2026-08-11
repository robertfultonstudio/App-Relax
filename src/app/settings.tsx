import Constants from "expo-constants";
import { type Href, useRouter } from "expo-router";
import { Pressable, StyleSheet, Text, View } from "react-native";
import { AmbientScreen } from "@/components/AmbientScreen";
import { TopBar } from "@/components/TopBar";
import { colors, fonts, radii, spacing } from "@/design/theme";

export default function SettingsScreen() {
  const router = useRouter();
  const version = Constants.expoConfig?.version ?? "development";
  return (
    <AmbientScreen>
      <TopBar label="SETTINGS" showBack />
      <Text accessibilityRole="header" style={styles.title}>
        Quiet by default.
      </Text>
      <Text style={styles.intro}>
        The first build keeps decisions small and playback under your control.
      </Text>

      <View style={styles.card}>
        <SettingRow label="Autoplay" value="Off" />
        <SettingRow
          label="Background mode"
          value="Prepared · device test pending"
        />
        <SettingRow label="Saved locally" value="Timer and mix only" />
        <SettingRow label="Build" value={`MVP ${version}`} last />
      </View>

      <Pressable
        accessibilityRole="link"
        onPress={() => router.push("/legal" as Href)}
        style={({ pressed }) => [styles.link, pressed && styles.pressed]}
      >
        <View>
          <Text style={styles.linkTitle}>Legal & sound labels</Text>
          <Text style={styles.linkBody}>
            Claims, audio status and listening note
          </Text>
        </View>
        <Text style={styles.arrow}>→</Text>
      </Pressable>
    </AmbientScreen>
  );
}

function SettingRow({
  label,
  value,
  last = false,
}: {
  label: string;
  value: string;
  last?: boolean;
}) {
  return (
    <View style={[styles.row, last && styles.lastRow]}>
      <Text style={styles.rowLabel}>{label}</Text>
      <Text style={styles.rowValue}>{value}</Text>
    </View>
  );
}

const styles = StyleSheet.create({
  title: { color: colors.text, fontFamily: fonts.serif, fontSize: 40 },
  intro: {
    color: colors.textMuted,
    fontFamily: fonts.sans,
    fontSize: 15,
    lineHeight: 23,
    marginTop: spacing.sm,
  },
  card: {
    marginTop: spacing.xl,
    paddingHorizontal: spacing.md,
    borderRadius: radii.lg,
    backgroundColor: colors.surface,
    borderWidth: 1,
    borderColor: colors.surfaceLine,
  },
  row: {
    minHeight: 66,
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    borderBottomWidth: StyleSheet.hairlineWidth,
    borderBottomColor: colors.surfaceLine,
  },
  lastRow: { borderBottomWidth: 0 },
  rowLabel: {
    color: colors.text,
    fontFamily: fonts.sans,
    fontSize: 13,
    fontWeight: "600",
  },
  rowValue: {
    color: colors.textMuted,
    fontFamily: fonts.sans,
    fontSize: 11,
    textAlign: "right",
    maxWidth: "56%",
  },
  link: {
    minHeight: 86,
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    marginTop: spacing.md,
    padding: spacing.md,
    borderRadius: radii.lg,
    backgroundColor: colors.surface,
    borderWidth: 1,
    borderColor: colors.surfaceLine,
  },
  linkTitle: { color: colors.text, fontFamily: fonts.serif, fontSize: 18 },
  linkBody: {
    color: colors.textFaint,
    fontFamily: fonts.sans,
    fontSize: 10,
    marginTop: 4,
  },
  arrow: { color: colors.moon, fontSize: 20 },
  pressed: { opacity: 0.6 },
});
