import { useEffect, useSyncExternalStore } from "react";
import { Pressable, StyleSheet, Text, View } from "react-native";
import { editorial } from "@/design/editorialTheme";
import { fonts, spacing } from "@/design/theme";
import { getPwaOfflineDownloads } from "@/offline/PwaOfflineDownloads";
import {
  APPROVED_DOWNLOAD_MANIFEST,
  STARTER_PACKAGE_ID,
} from "@/offline/approvedDownloads";
import { getPwaShellReadiness } from "@/offline/PwaShellReadiness";

const size = (bytes: number) => `${(bytes / 1_000_000).toFixed(1)} MB`;
const failures: Record<string, string> = {
  "insufficient-space": "Not enough browser storage. Free space, then retry.",
  "integrity-mismatch":
    "This copy is missing or incomplete. Download it again.",
  "source-unavailable": "This file is unavailable. Reconnect and retry.",
  "network-error": "Connection interrupted. Reconnect and retry.",
  cancelled: "Download cancelled. You can retry when ready.",
  interrupted: "Download interrupted. Retry to recover the missing files.",
  "storage-error":
    "Browser storage could not save this sound. Free space or retry.",
};

/** PWA-only surface. Omitting workId offers the small, explicitly selected starter. */
export function DownloadControl({ workId }: { workId?: string }) {
  const id = workId ?? STARTER_PACKAGE_ID;
  if (
    !APPROVED_DOWNLOAD_MANIFEST.packages.some((entry) => entry.packageId === id)
  ) {
    return (
      <Text style={styles.body} testID="review-online-only">
        Review audio · online listening only.
      </Text>
    );
  }
  return <AvailableDownloadControl workId={workId} />;
}

function AvailableDownloadControl({ workId }: { workId?: string }) {
  const downloads = getPwaOfflineDownloads();
  const shell = getPwaShellReadiness();
  const shellState = useSyncExternalStore(
    shell.subscribe,
    shell.getSnapshot,
    shell.getServerSnapshot,
  );
  const id = workId ?? STARTER_PACKAGE_ID;
  const snapshot = useSyncExternalStore(
    downloads.subscribe,
    () => downloads.getSnapshot(id),
    () => downloads.getServerSnapshot(id),
  );
  const onlineOnly = shellState === "online-only";
  useEffect(() => {
    void downloads.hydrate(id);
  }, [downloads, id]);
  useEffect(() => {
    if (!onlineOnly) void shell.check();
  }, [shell, onlineOnly]);
  const { record, busy, removed } = snapshot;
  const downloading = ["queued", "downloading", "verifying"].includes(
    record.status,
  );
  const available = record.status === "available" && !removed;
  const error =
    snapshot.error ??
    (record.failureCode ? failures[record.failureCode] : null);
  const button = (label: string, action: () => void, disabled = busy) => (
    <Pressable
      accessibilityRole="button"
      accessibilityLabel={label}
      accessibilityState={{ disabled }}
      disabled={disabled}
      onPress={action}
      style={styles.button}
    >
      <Text style={styles.buttonText}>{label}</Text>
    </Pressable>
  );
  return (
    <View style={styles.panel} testID="download-control">
      <Text style={styles.heading}>
        {workId
          ? onlineOnly
            ? "SAVE AUDIO ON THIS DEVICE"
            : "SAVE FOR OFFLINE"
          : "RAIN STARTER · 3 APPROVED SOUNDS"}
      </Text>
      <Text style={styles.body} accessibilityLiveRegion="polite">
        {busy
          ? record.status === "verifying"
            ? "Checking the saved audio…"
            : downloading
              ? `Downloading ${size(record.bytesDownloaded)} of ${size(record.totalBytes)}`
              : "Checking browser storage…"
          : available
            ? `Downloaded and verified · ${size(record.totalBytes)}`
            : removed
              ? "Saved copy removed from listening. Undo is available until you free the space."
              : `Download only this ${workId ? "sound" : "starter"} · ${size(record.totalBytes)}`}
      </Text>
      {!workId && (
        <Text style={styles.body}>
          Quiet Weather · Sheltered Rain · Soft Weather
        </Text>
      )}
      <Text
        style={styles.body}
        accessibilityLiveRegion="polite"
        testID="offline-shell-status"
      >
        {onlineOnly
          ? "This private review needs an internet connection to open. Saved audio can be reused, but does not make the app available offline. Your saved sounds and settings are unchanged."
          : shellState === "ready"
            ? "App screens are saved. Test reopening before going offline; only verified downloads can play."
            : shellState === "reopen"
              ? "App screens are saved. When listening has stopped, close all App Relax tabs and reopen online, then check again."
              : shellState === "checking" || shellState === "unchecked"
                ? "Checking whether this app can reopen offline… Keep your connection on."
                : "Offline reopening is not ready. Keep your connection on. Stop listening, close App Relax tabs and reopen online, then check again. Saved audio has not been removed."}
      </Text>
      {!onlineOnly &&
        shellState !== "checking" &&
        shellState !== "unchecked" &&
        button(
          "Check offline readiness",
          () => {
            void shell.check();
          },
          false,
        )}
      {error && (
        <Text accessibilityRole="alert" style={styles.body}>
          {error}
        </Text>
      )}
      {downloading ? (
        button("Cancel download", downloads.cancel, false)
      ) : removed ? (
        <View>
          {button("Undo removal", () => {
            void downloads.undoRemoval(id);
          })}
          {button("Free space permanently", () => {
            void downloads.purgeRemoval(id);
          })}
        </View>
      ) : available ? (
        button("Remove download", () => {
          void downloads.remove(id);
        })
      ) : (
        button(
          record.status === "failed"
            ? "Retry download"
            : `Download · ${size(record.totalBytes)}`,
          () => {
            void downloads.download([id]);
          },
          busy || !snapshot.supported,
        )
      )}
      <Text style={styles.note}>
        {snapshot.freeBytes === null
          ? "Available browser space is not yet known."
          : `Estimated browser space available: ${size(snapshot.freeBytes)}.`}{" "}
        {snapshot.persistent === true
          ? "Persistent browser storage granted."
          : onlineOnly
            ? "The browser may clear local data. Keep your connection on."
            : "The browser may clear local data. Check downloads before going offline."}{" "}
        No automatic catalogue download. Keep this app open until verification
        finishes.
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
    gap: spacing.sm,
  },
  heading: {
    color: editorial.ink,
    fontFamily: fonts.sansSemiBold,
    fontSize: 12,
  },
  body: {
    color: editorial.ink,
    fontFamily: fonts.sans,
    fontSize: 14,
    lineHeight: 21,
  },
  note: {
    color: editorial.inkMuted,
    fontFamily: fonts.sans,
    fontSize: 12,
    lineHeight: 19,
  },
  button: {
    minHeight: 48,
    justifyContent: "center",
    paddingVertical: spacing.sm,
  },
  buttonText: {
    color: editorial.ink,
    fontFamily: fonts.sansSemiBold,
    fontSize: 14,
    textDecorationLine: "underline",
  },
});
