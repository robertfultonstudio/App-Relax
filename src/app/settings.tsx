import Constants from "expo-constants";
import { type Href, useRouter } from "expo-router";
import { Pressable, StyleSheet, Text, View } from "react-native";
import { EditorialHeader } from "@/components/EditorialHeader";
import { EditorialScreen } from "@/components/EditorialScreen";
import { editorial } from "@/design/editorialTheme";
import { fonts, spacing } from "@/design/theme";
import { ListeningPreferences } from "@/components/ListeningPreferences";
import { NativeCatalogInfo } from "@/components/NativeCatalogGate";
import { isNativeCatalogPreview } from "@/domain/sessions/playbackAvailability";

export default function SettingsScreen() {
  const router = useRouter();
  const version = Constants.expoConfig?.version ?? "development";
  return (
    <EditorialScreen>
      <EditorialHeader label="SETTINGS" showBack />
      <Text accessibilityRole="header" style={styles.title}>
        A quiet place to begin.
      </Text>
      <Text style={styles.intro}>
        Choose your moment and press Play. Your activity chooses the music; you
        can change the timer whenever you prepare a session.
      </Text>

      <View style={styles.card}>
        <SettingRow label="Autoplay" value="Off" />
        <SettingRow label="Reduce motion" value="Follows your device" />
        <SettingRow label="Guided sessions" value="In production" />
        <SettingRow
          label="Offline downloads"
          value={
            isNativeCatalogPreview()
              ? "Imported on this phone"
              : "In production on this device"
          }
        />
        <SettingRow label="Saved locally" value="Last session choices" />
        <SettingRow label="Version" value={version} last />
      </View>

      <SettingLink
        body="Sound availability and listening safely"
        onPress={() => router.push("/legal" as Href)}
        title="About listening"
      />
      <ListeningPreferences />
      <NativeCatalogInfo />
    </EditorialScreen>
  );
}

function SettingLink({
  body,
  hint,
  onPress,
  title,
}: {
  body: string;
  hint?: string;
  onPress: () => void;
  title: string;
}) {
  return (
    <Pressable
      accessibilityHint={hint}
      accessibilityRole="link"
      onPress={onPress}
      style={({ pressed }) => [styles.link, pressed && styles.pressed]}
    >
      <View style={styles.linkCopy}>
        <Text style={styles.linkTitle}>{title}</Text>
        <Text style={styles.linkBody}>{body}</Text>
      </View>
      <Text style={styles.arrow}>→</Text>
    </Pressable>
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
  title: {
    color: editorial.ink,
    fontFamily: fonts.serif,
    fontSize: 40,
    lineHeight: 44,
  },
  intro: {
    color: editorial.inkMuted,
    fontFamily: fonts.sans,
    fontSize: 15,
    lineHeight: 23,
    marginTop: spacing.sm,
  },
  card: {
    marginTop: spacing.xl,
    borderTopWidth: StyleSheet.hairlineWidth,
    borderTopColor: editorial.lineStrong,
  },
  row: {
    minHeight: 66,
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    borderBottomWidth: StyleSheet.hairlineWidth,
    borderBottomColor: editorial.line,
  },
  lastRow: { borderBottomWidth: 0 },
  rowLabel: {
    color: editorial.ink,
    fontSize: 13,
    fontFamily: fonts.sansSemiBold,
  },
  rowValue: {
    color: editorial.inkMuted,
    fontFamily: fonts.sans,
    fontSize: 12,
    lineHeight: 18,
    textAlign: "right",
    flexShrink: 1,
    maxWidth: "62%",
  },
  link: {
    minHeight: 88,
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    marginTop: spacing.md,
    paddingVertical: spacing.lg,
    borderTopWidth: StyleSheet.hairlineWidth,
    borderTopColor: editorial.lineStrong,
  },
  linkCopy: { flex: 1, paddingRight: spacing.md },
  linkTitle: { color: editorial.ink, fontFamily: fonts.serif, fontSize: 20 },
  linkBody: {
    color: editorial.inkMuted,
    fontFamily: fonts.sans,
    fontSize: 11,
    lineHeight: 16,
    marginTop: 4,
  },
  arrow: { color: editorial.gold, fontSize: 20 },
  pressed: {
    backgroundColor: editorial.paperDeep,
    transform: [{ translateY: 1 }],
  },
});
