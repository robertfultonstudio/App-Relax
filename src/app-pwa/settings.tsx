import Constants from "expo-constants";
import { type Href, useRouter } from "expo-router";
import { Pressable, StyleSheet, Text, View } from "react-native";
import { EditorialHeader } from "@/components/EditorialHeader";
import { EditorialScreen } from "@/components/EditorialScreen";
import { editorial } from "@/design/editorialTheme";
import { fonts, spacing } from "@/design/theme";
import { DownloadControl } from "@/components/DownloadControl";
import { REVIEW_REVISION } from "@/content/reviewRevision";
import { ListeningPreferences } from "@/components/ListeningPreferences";
import { IndividualTrackReviewLink } from "@/pwa-review/IndividualTrackReview";
import { usePwaView } from "@/pwa-view/PwaViewProvider";

export default function PwaSettingsScreen() {
  const router = useRouter();
  const { viewMode } = usePwaView();
  const workbench = viewMode === "workbench";
  const version = Constants.expoConfig?.version ?? "development";

  return (
    <EditorialScreen>
      <EditorialHeader label="SETTINGS" showBack />
      <Text
        accessibilityRole="header"
        nativeID="consumer-screen-title"
        style={styles.title}
        testID="consumer-screen-title"
      >
        A quiet place to begin.
      </Text>
      <Text style={styles.intro}>
        Choose your moment and press Play. Your activity chooses the music; you
        can change the timer whenever you prepare a session.
      </Text>

      <View style={styles.list}>
        <SettingRow label="Autoplay" value="Off" />
        <SettingRow label="Reduce motion" value="Follows your device" />
        <SettingRow
          label="Saved locally"
          value="Listening choices and downloads"
        />
        <SettingRow label="Version" value={version} />
        {workbench ? (
          <SettingRow label="Review" value={REVIEW_REVISION} last />
        ) : null}
      </View>

      <View style={styles.downloads}>
        <Text accessibilityRole="header" style={styles.sectionTitle}>
          Saved sounds
        </Text>
        <Text style={styles.downloadNote}>
          Save the rain starter on this device for reuse. App access still
          depends on the connection requirements below.
        </Text>
        <DownloadControl />
      </View>

      <Pressable
        accessibilityRole="link"
        onPress={() => router.push("/legal" as Href)}
        style={({ pressed }) => [styles.link, pressed && styles.pressed]}
      >
        <View style={styles.linkCopy}>
          <Text style={styles.linkTitle}>About listening</Text>
          <Text style={styles.linkBody}>
            Sound availability and listening safely
          </Text>
        </View>
        <Text style={styles.arrow}>→</Text>
      </Pressable>
      <ListeningPreferences />
      {workbench ? <IndividualTrackReviewLink /> : null}
    </EditorialScreen>
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
    fontSize: 28,
    lineHeight: 34,
  },
  intro: {
    color: editorial.inkMuted,
    fontFamily: fonts.sans,
    fontSize: 15,
    lineHeight: 23,
    marginTop: spacing.sm,
  },
  list: {
    borderTopColor: editorial.lineStrong,
    borderTopWidth: StyleSheet.hairlineWidth,
    marginTop: spacing.xl,
  },
  downloads: { marginTop: spacing.lg },
  sectionTitle: {
    color: editorial.ink,
    fontFamily: fonts.serif,
    fontSize: 25,
    lineHeight: 30,
  },
  downloadNote: {
    color: editorial.inkMuted,
    fontFamily: fonts.sans,
    fontSize: 14,
    lineHeight: 21,
    marginTop: spacing.sm,
    marginBottom: spacing.md,
  },
  row: {
    alignItems: "center",
    borderBottomColor: editorial.line,
    borderBottomWidth: StyleSheet.hairlineWidth,
    flexDirection: "row",
    justifyContent: "space-between",
    minHeight: 66,
  },
  lastRow: { borderBottomWidth: 0 },
  rowLabel: {
    color: editorial.ink,
    fontFamily: fonts.sansSemiBold,
    fontSize: 14,
  },
  rowValue: {
    color: editorial.inkMuted,
    flexShrink: 1,
    fontFamily: fonts.sans,
    fontSize: 14,
    lineHeight: 20,
    maxWidth: "62%",
    textAlign: "right",
  },
  link: {
    alignItems: "center",
    borderTopColor: editorial.lineStrong,
    borderTopWidth: StyleSheet.hairlineWidth,
    flexDirection: "row",
    justifyContent: "space-between",
    marginTop: spacing.md,
    minHeight: 88,
    paddingVertical: spacing.lg,
  },
  linkCopy: { flex: 1, paddingRight: spacing.md },
  linkTitle: { color: editorial.ink, fontFamily: fonts.serif, fontSize: 20 },
  linkBody: {
    color: editorial.inkMuted,
    fontFamily: fonts.sans,
    fontSize: 14,
    lineHeight: 20,
    marginTop: 4,
  },
  arrow: { color: editorial.gold, fontSize: 20 },
  pressed: { backgroundColor: editorial.paperDeep },
});
