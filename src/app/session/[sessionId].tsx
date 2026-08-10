import { useEffect } from "react";
import { useLocalSearchParams } from "expo-router";
import { Pressable, StyleSheet, Text, View } from "react-native";
import { AmbientScreen } from "@/components/AmbientScreen";
import { SourceControl } from "@/components/SourceControl";
import { TopBar } from "@/components/TopBar";
import { useAudioSession } from "@/audio/AudioProvider";
import { AUDIO_SOURCE_IDS } from "@/domain/audio/types";
import { getPreset } from "@/presets/presetRegistry";
import { colors, fonts, radii, spacing } from "@/design/theme";

function formatRemaining(milliseconds: number): string {
  const totalSeconds = Math.max(0, Math.ceil(milliseconds / 1000));
  const minutes = Math.floor(totalSeconds / 60);
  const seconds = totalSeconds % 60;
  return `${String(minutes).padStart(2, "0")}:${String(seconds).padStart(2, "0")}`;
}

function statusLabel(status: string): string {
  switch (status) {
    case "loading":
      return "PREPARING LAYERS";
    case "playing":
      return "RITUAL IN PROGRESS";
    case "paused":
      return "PAUSED";
    case "fadingOut":
      return "DRIFTING TO QUIET";
    case "error":
      return "AUDIO NEEDS ATTENTION";
    default:
      return "READY WHEN YOU ARE";
  }
}

export default function SessionScreen() {
  const { sessionId } = useLocalSearchParams<{ sessionId: string }>();
  const preset = getPreset(sessionId);
  const { controller, snapshot } = useAudioSession();

  useEffect(() => {
    if (preset) {
      void controller.loadPreset(preset);
    }
  }, [controller, preset]);

  if (!preset) {
    return (
      <AmbientScreen>
        <TopBar showBack />
        <Text style={styles.title}>This ritual is not available.</Text>
      </AmbientScreen>
    );
  }

  const isPlaying = snapshot.status === "playing";
  const isFading = snapshot.status === "fadingOut";
  const canPlay = snapshot.status === "ready" || snapshot.status === "paused";
  const timerLocked = isPlaying || isFading;

  return (
    <AmbientScreen>
      <TopBar label="SLEEP RITUAL" showBack />

      <View
        style={styles.visual}
        accessibilityLabel={`Player status: ${statusLabel(snapshot.status)}`}
      >
        <View style={styles.outerOrbit} />
        <View style={styles.middleOrbit} />
        <View
          style={[styles.core, (isPlaying || isFading) && styles.coreActive]}
        >
          <View style={styles.coreCutout} />
        </View>
        <View style={styles.dotOne} />
        <View style={styles.dotTwo} />
      </View>

      <Text style={styles.status}>{statusLabel(snapshot.status)}</Text>
      <Text accessibilityRole="header" style={styles.title}>
        {preset.title}
      </Text>
      <Text style={styles.subtitle}>{preset.subtitle}</Text>
      <View style={styles.tags}>
        <Text style={styles.tag}>{preset.tuningLabel} label</Text>
        <Text style={styles.tag}>{preset.beatHz} Hz beat</Text>
        <Text style={styles.tag}>placeholder stems</Text>
      </View>

      <Text
        accessibilityLabel={`${formatRemaining(snapshot.remainingMs)} remaining`}
        style={styles.timer}
      >
        {formatRemaining(snapshot.remainingMs)}
      </Text>
      <View style={styles.durationRow}>
        {preset.durationOptionsMinutes.map((minutes) => (
          <Pressable
            accessibilityRole="button"
            accessibilityState={{
              disabled: timerLocked,
              selected: snapshot.selectedDurationMinutes === minutes,
            }}
            disabled={timerLocked}
            key={minutes}
            onPress={() => void controller.setTimer(minutes)}
            style={({ pressed }) => [
              styles.duration,
              snapshot.selectedDurationMinutes === minutes &&
                styles.durationSelected,
              pressed && styles.pressed,
              timerLocked && styles.disabled,
            ]}
          >
            <Text
              style={[
                styles.durationText,
                snapshot.selectedDurationMinutes === minutes &&
                  styles.durationTextSelected,
              ]}
            >
              {minutes} min
            </Text>
          </Pressable>
        ))}
      </View>

      {snapshot.error ? (
        <View accessibilityRole="alert" style={styles.errorBox}>
          <Text style={styles.errorText}>{snapshot.error}</Text>
          <Pressable
            onPress={() => void controller.loadPreset(preset)}
            style={styles.retry}
          >
            <Text style={styles.retryText}>Retry load</Text>
          </Pressable>
        </View>
      ) : null}

      <View style={styles.transport}>
        <Pressable
          accessibilityLabel="Stop session"
          accessibilityRole="button"
          disabled={snapshot.status === "loading" || snapshot.status === "idle"}
          onPress={() => void controller.stop()}
          style={({ pressed }) => [
            styles.secondaryButton,
            pressed && styles.pressed,
          ]}
        >
          <Text style={styles.stopGlyph}>■</Text>
        </Pressable>
        <Pressable
          accessibilityLabel={isPlaying ? "Pause session" : "Play session"}
          accessibilityRole="button"
          accessibilityState={{ disabled: !isPlaying && !canPlay }}
          disabled={!isPlaying && !canPlay}
          onPress={() =>
            void (isPlaying ? controller.pause() : controller.play())
          }
          style={({ pressed }) => [
            styles.primaryButton,
            pressed && styles.pressed,
          ]}
        >
          <Text style={styles.primaryGlyph}>{isPlaying ? "Ⅱ" : "▶"}</Text>
        </Pressable>
        <View style={styles.secondaryButton}>
          <Text style={styles.headphoneGlyph}>⌁</Text>
        </View>
      </View>

      <View style={styles.mixHeader}>
        <View>
          <Text style={styles.mixTitle}>The living mix</Text>
          <Text style={styles.mixSubtitle}>Fine-tune only if you want to.</Text>
        </View>
        <Text style={styles.mixCount}>5 SOURCES</Text>
      </View>
      <View style={styles.mixCard}>
        {AUDIO_SOURCE_IDS.map((sourceId) => (
          <SourceControl
            key={sourceId}
            onGainChange={(gain) =>
              void controller.setSourceGain(sourceId, gain)
            }
            onToggleMuted={() =>
              void controller.setSourceMuted(
                sourceId,
                !snapshot.sources[sourceId].muted,
              )
            }
            source={snapshot.sources[sourceId]}
          />
        ))}
      </View>

      <View style={styles.note}>
        <Text style={styles.noteTitle}>STEREO NOTE</Text>
        <Text style={styles.noteText}>
          Headphones reveal the left/right binaural separation. This session is
          for atmosphere and personal ritual, not medical treatment.
        </Text>
      </View>
    </AmbientScreen>
  );
}

const styles = StyleSheet.create({
  visual: {
    height: 238,
    alignItems: "center",
    justifyContent: "center",
    marginTop: spacing.xs,
  },
  outerOrbit: {
    position: "absolute",
    width: 224,
    height: 224,
    borderRadius: 112,
    borderWidth: 1,
    borderColor: "rgba(142, 168, 200, 0.19)",
  },
  middleOrbit: {
    position: "absolute",
    width: 174,
    height: 174,
    borderRadius: 87,
    borderWidth: 1,
    borderColor: "rgba(212, 185, 124, 0.17)",
  },
  core: {
    width: 118,
    height: 118,
    borderRadius: 59,
    backgroundColor: "rgba(142, 168, 200, 0.22)",
    borderWidth: 1,
    borderColor: "rgba(243, 233, 216, 0.26)",
    overflow: "hidden",
  },
  coreActive: {
    backgroundColor: "rgba(145, 183, 163, 0.34)",
    borderColor: colors.moss,
  },
  coreCutout: {
    position: "absolute",
    width: 104,
    height: 104,
    borderRadius: 52,
    left: 28,
    top: -8,
    backgroundColor: colors.backgroundSoft,
  },
  dotOne: {
    position: "absolute",
    width: 7,
    height: 7,
    borderRadius: 4,
    backgroundColor: colors.moon,
    top: 38,
    right: 78,
  },
  dotTwo: {
    position: "absolute",
    width: 5,
    height: 5,
    borderRadius: 3,
    backgroundColor: colors.dusk,
    bottom: 34,
    left: 86,
  },
  status: {
    color: colors.moss,
    fontFamily: fonts.sans,
    fontSize: 9,
    letterSpacing: 1.8,
    fontWeight: "700",
    textAlign: "center",
  },
  title: {
    color: colors.text,
    fontFamily: fonts.serif,
    fontSize: 35,
    textAlign: "center",
    marginTop: spacing.sm,
  },
  subtitle: {
    color: colors.textMuted,
    fontFamily: fonts.sans,
    fontSize: 12,
    textAlign: "center",
    marginTop: 7,
  },
  tags: {
    flexDirection: "row",
    justifyContent: "center",
    flexWrap: "wrap",
    gap: 7,
    marginTop: spacing.md,
  },
  tag: {
    color: colors.textFaint,
    fontFamily: fonts.sans,
    fontSize: 9,
    paddingHorizontal: 9,
    paddingVertical: 5,
    borderRadius: radii.pill,
    borderWidth: 1,
    borderColor: colors.surfaceLine,
  },
  timer: {
    color: colors.text,
    fontFamily: fonts.mono,
    fontSize: 31,
    letterSpacing: 2.5,
    textAlign: "center",
    marginTop: spacing.lg,
  },
  durationRow: {
    flexDirection: "row",
    justifyContent: "center",
    gap: 8,
    marginTop: spacing.md,
  },
  duration: {
    minHeight: 40,
    justifyContent: "center",
    paddingHorizontal: spacing.md,
    borderRadius: radii.pill,
    backgroundColor: colors.surface,
    borderWidth: 1,
    borderColor: colors.surfaceLine,
  },
  durationSelected: { backgroundColor: colors.text, borderColor: colors.text },
  durationText: {
    color: colors.textMuted,
    fontFamily: fonts.sans,
    fontSize: 11,
    fontWeight: "600",
  },
  durationTextSelected: { color: colors.background, fontWeight: "800" },
  disabled: { opacity: 0.48 },
  errorBox: {
    marginTop: spacing.lg,
    padding: spacing.md,
    borderRadius: radii.md,
    backgroundColor: "rgba(215, 146, 131, 0.12)",
    borderWidth: 1,
    borderColor: colors.danger,
  },
  errorText: { color: colors.text, fontSize: 12, lineHeight: 18 },
  retry: { minHeight: 44, justifyContent: "center", alignSelf: "flex-start" },
  retryText: { color: colors.moon, fontWeight: "700" },
  transport: {
    flexDirection: "row",
    justifyContent: "center",
    alignItems: "center",
    gap: spacing.lg,
    marginTop: spacing.lg,
  },
  primaryButton: {
    width: 78,
    height: 78,
    borderRadius: 39,
    alignItems: "center",
    justifyContent: "center",
    backgroundColor: colors.text,
    shadowColor: colors.moon,
    shadowOpacity: 0.2,
    shadowRadius: 18,
  },
  primaryGlyph: {
    color: colors.background,
    fontSize: 23,
    marginLeft: 2,
    fontWeight: "700",
  },
  secondaryButton: {
    width: 50,
    height: 50,
    borderRadius: 25,
    alignItems: "center",
    justifyContent: "center",
    backgroundColor: colors.surface,
    borderWidth: 1,
    borderColor: colors.surfaceLine,
  },
  stopGlyph: { color: colors.textMuted, fontSize: 14 },
  headphoneGlyph: { color: colors.textFaint, fontSize: 25 },
  pressed: { opacity: 0.55, transform: [{ scale: 0.97 }] },
  mixHeader: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "flex-end",
    marginTop: spacing.xxl,
    marginBottom: spacing.md,
  },
  mixTitle: { color: colors.text, fontFamily: fonts.serif, fontSize: 24 },
  mixSubtitle: {
    color: colors.textFaint,
    fontFamily: fonts.sans,
    fontSize: 11,
    marginTop: 3,
  },
  mixCount: {
    color: colors.textFaint,
    fontSize: 9,
    letterSpacing: 1.1,
    fontWeight: "700",
  },
  mixCard: {
    paddingHorizontal: spacing.md,
    borderRadius: radii.lg,
    backgroundColor: colors.surface,
    borderWidth: 1,
    borderColor: colors.surfaceLine,
    overflow: "hidden",
  },
  note: {
    marginTop: spacing.lg,
    padding: spacing.md,
    borderRadius: radii.md,
    backgroundColor: "rgba(212, 185, 124, 0.08)",
    borderLeftWidth: 2,
    borderLeftColor: colors.moon,
  },
  noteTitle: {
    color: colors.moon,
    fontSize: 9,
    letterSpacing: 1.4,
    fontWeight: "700",
  },
  noteText: {
    color: colors.textMuted,
    fontFamily: fonts.sans,
    fontSize: 11,
    lineHeight: 17,
    marginTop: 6,
  },
});
