import { Pressable, StyleSheet, Text, View } from "react-native";
import { getSessionPolicy } from "@/content/sessionPolicies";
import { PROVISIONAL_MUSIC_SESSION_PAIRINGS } from "@/content/sessionWorkProfiles";
import type { SavedSessionRequest } from "@/state/adaptiveSessionPersistence";
import { editorial } from "@/design/editorialTheme";
import { fonts, spacing } from "@/design/theme";

export function LastSessionAction({
  available,
  request,
  onPress,
}: {
  available: boolean;
  request: SavedSessionRequest | null;
  onPress: () => void;
}) {
  const unavailableMusicRequest =
    request?.soundKind === "music" &&
    PROVISIONAL_MUSIC_SESSION_PAIRINGS.length === 0;
  const summary = request
    ? `${getSessionPolicy(request.outcome).startLabel} · ${request.durationMinutes} min · ${request.soundKind === "music" ? "Music · In production" : "Natural sounds"} · Sound only`
    : "Your first started session will appear here.";
  const disabled = !available || !request || unavailableMusicRequest;
  return (
    <Pressable
      accessibilityHint={
        unavailableMusicRequest
          ? "Music sessions are in production"
          : request
            ? "Prepares a fresh variation using your last choices"
            : !request
              ? "No previous session is available"
              : "Session playback is in production on this device"
      }
      accessibilityLabel={`Play your last session. ${summary}`}
      accessibilityRole="button"
      accessibilityState={{ disabled }}
      disabled={disabled}
      onPress={onPress}
      style={[styles.root, disabled && styles.disabled]}
      testID="play-last-session"
    >
      <View style={styles.copy}>
        <Text style={styles.label}>Play your last session</Text>
        <Text style={styles.summary}>{summary}</Text>
      </View>
      <Text style={styles.arrow}>→</Text>
    </Pressable>
  );
}

const styles = StyleSheet.create({
  root: {
    alignItems: "center",
    backgroundColor: "rgba(232, 229, 232, 0.9)",
    borderColor: editorial.line,
    borderWidth: StyleSheet.hairlineWidth,
    flexDirection: "row",
    justifyContent: "space-between",
    marginTop: spacing.lg,
    minHeight: 76,
    paddingHorizontal: spacing.md,
    paddingVertical: spacing.sm,
  },
  copy: { flex: 1, paddingRight: spacing.md },
  label: {
    color: editorial.mineralBlue,
    fontFamily: fonts.sansSemiBold,
    fontSize: 11,
    letterSpacing: 0.9,
  },
  summary: {
    color: editorial.ink,
    fontFamily: fonts.serif,
    fontSize: 16,
    lineHeight: 20,
    marginTop: 4,
  },
  arrow: { color: editorial.gold, fontSize: 22 },
  disabled: { opacity: 0.58 },
});
