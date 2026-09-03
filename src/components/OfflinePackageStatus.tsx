import { StyleSheet, Text, View } from "react-native";
import { OFFLINE_CATALOG_MANIFEST } from "@/content/offlinePackageManifest";
import { editorial } from "@/design/editorialTheme";
import { fonts, spacing } from "@/design/theme";

function megabytes(bytes: number): string {
  return `${(bytes / 1_000_000).toFixed(1)} MB`;
}

export function OfflinePackageStatus() {
  const sessionPackage = OFFLINE_CATALOG_MANIFEST.packages[0];
  return (
    <View
      accessibilityLabel={`Offline sessions. In production. Planned package ${megabytes(sessionPackage.totalBytes)}.`}
      style={styles.panel}
      testID="offline-package-status"
    >
      <View style={styles.headingRow}>
        <Text style={styles.heading}>OFFLINE SESSIONS</Text>
        <Text style={styles.state}>IN PRODUCTION</Text>
      </View>
      <Text style={styles.body}>
        Offline listening is in production and is not available on this device
        yet.
      </Text>
      <Text style={styles.meta}>
        PLANNED WATER PACK · {megabytes(sessionPackage.totalBytes)} ·{" "}
        {sessionPackage.assetIds.length} WORKS
      </Text>
    </View>
  );
}

const styles = StyleSheet.create({
  panel: {
    borderTopColor: editorial.line,
    borderTopWidth: StyleSheet.hairlineWidth,
    marginTop: spacing.lg,
    paddingTop: spacing.md,
  },
  headingRow: {
    alignItems: "center",
    flexDirection: "row",
    justifyContent: "space-between",
  },
  heading: {
    color: editorial.ink,
    fontFamily: fonts.sansSemiBold,
    fontSize: 11,
    letterSpacing: 1,
  },
  state: {
    color: editorial.gold,
    fontFamily: fonts.sansSemiBold,
    fontSize: 11,
    letterSpacing: 0.6,
  },
  body: {
    color: editorial.inkMuted,
    fontFamily: fonts.sans,
    fontSize: 13,
    lineHeight: 20,
    marginTop: spacing.sm,
  },
  meta: {
    color: editorial.inkFaint,
    fontFamily: fonts.sansMedium,
    fontSize: 10,
    letterSpacing: 0.6,
    marginTop: spacing.sm,
  },
});
