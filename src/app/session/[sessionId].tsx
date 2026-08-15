import { useEffect, useState } from "react";
import { useLocalSearchParams } from "expo-router";
import { Pressable, StyleSheet, Text, View } from "react-native";
import { AmbientScreen } from "@/components/AmbientScreen";
import { RitualArtwork } from "@/components/RitualArtwork";
import { SourceControl } from "@/components/SourceControl";
import { TopBar } from "@/components/TopBar";
import { useAudioSession } from "@/audio/AudioProvider";
import { getRitualForPreset, requireRitualTheme } from "@/content/rituals";
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
      return "PREPARING TEST AUDIO";
    case "playing":
      return "PLAYING TEST";
    case "paused":
      return "TEST PAUSED";
    case "fadingOut":
      return "STOPPING TEST";
    case "error":
      return "TEST AUDIO NEEDS ATTENTION";
    default:
      return "ENGINE READY";
  }
}

export default function SessionScreen() {
  const { sessionId } = useLocalSearchParams<{ sessionId: string }>();
  const preset = getPreset(sessionId);
  const ritual = preset ? getRitualForPreset(preset.id) : undefined;
  const { controller, snapshot } = useAudioSession();
  const [mixerOpen, setMixerOpen] = useState(false);
  const [aboutOpen, setAboutOpen] = useState(false);

  useEffect(() => {
    if (preset && ritual?.availability === "test-only") {
      void controller.loadPreset(preset);
    }
  }, [controller, preset, ritual]);

  if (!preset || !ritual || ritual.availability !== "test-only") {
    return (
      <AmbientScreen>
        <TopBar showBack />
        <Text style={styles.unavailableTitle}>
          This audio test is unavailable.
        </Text>
      </AmbientScreen>
    );
  }

  const theme = requireRitualTheme(ritual.themeId);
  const isPlaying = snapshot.status === "playing";
  const isFading = snapshot.status === "fadingOut";
  const canPlay = snapshot.status === "ready" || snapshot.status === "paused";
  const timerLocked = isPlaying || isFading;
  const stopDisabled =
    snapshot.status === "loading" || snapshot.status === "idle";

  return (
    <AmbientScreen scrollProps={{ testID: "session-scroll" }} theme={theme}>
      <TopBar label="AUDIO TEST" showBack />

      <View accessibilityRole="summary" style={styles.testBanner}>
        <Text style={styles.testLabel}>TEST ONLY</Text>
        <Text style={styles.testCopy}>
          Engine validation. This material is outside the consumer catalogue.
        </Text>
      </View>

      <RitualArtwork
        active={isPlaying || isFading}
        ritual={ritual}
        theme={theme}
      />

      <Text style={[styles.status, { color: theme.palette.accent }]}>
        {statusLabel(snapshot.status)}
      </Text>
      <Text accessibilityRole="header" style={styles.title}>
        {ritual.title}
      </Text>
      <Text style={styles.subtitle}>{ritual.shortDescription}</Text>

      <Text
        accessibilityLabel={`${formatRemaining(snapshot.remainingMs)} remaining`}
        style={styles.timer}
      >
        {formatRemaining(snapshot.remainingMs)}
      </Text>
      <View accessibilityLabel="Audio test duration" style={styles.durationRow}>
        {preset.durationOptionsMinutes.map((minutes) => (
          <Pressable
            accessibilityLabel={`${minutes} minutes`}
            accessibilityRole="button"
            accessibilityState={{
              disabled: timerLocked,
              selected: snapshot.selectedDurationMinutes === minutes,
            }}
            disabled={timerLocked}
            key={minutes}
            onPress={() => void controller.setTimer(minutes)}
            testID={`timer-${minutes}`}
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
            accessibilityRole="button"
            onPress={() => void controller.loadPreset(preset)}
            style={styles.retry}
          >
            <Text style={styles.retryText}>Retry</Text>
          </Pressable>
        </View>
      ) : null}

      <View style={styles.transport}>
        <Pressable
          accessibilityLabel="Stop audio test"
          accessibilityRole="button"
          accessibilityState={{ disabled: stopDisabled }}
          disabled={stopDisabled}
          onPress={() => void controller.stop()}
          testID="player-stop"
          style={({ pressed }) => [
            styles.secondaryButton,
            stopDisabled && styles.disabled,
            pressed && styles.pressed,
          ]}
        >
          <Text style={styles.secondaryButtonText}>Stop</Text>
        </Pressable>
        <Pressable
          accessibilityLabel={
            isPlaying ? "Pause audio test" : "Play audio test"
          }
          accessibilityRole="button"
          accessibilityState={{ disabled: !isPlaying && !canPlay }}
          disabled={!isPlaying && !canPlay}
          onPress={() =>
            void (isPlaying ? controller.pause() : controller.play())
          }
          testID="player-play-pause"
          style={({ pressed }) => [
            styles.primaryButton,
            !isPlaying && !canPlay && styles.disabled,
            pressed && styles.pressed,
          ]}
        >
          <Text style={styles.primaryButtonText}>
            {isPlaying ? "Pause" : "Play"}
          </Text>
        </Pressable>
      </View>

      <Disclosure
        label="Volume & mute"
        onPress={() => setMixerOpen((open) => !open)}
        open={mixerOpen}
        testID="player-open-mixer"
      >
        <Text style={styles.disclosureIntro}>
          Technical controls for the five engine layers. This panel is not part
          of the consumer product.
        </Text>
        <View style={styles.mixCard}>
          {AUDIO_SOURCE_IDS.map((sourceId) => (
            <SourceControl
              displayLabel={ritual.mixerLabels[sourceId]}
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
      </Disclosure>

      <Disclosure
        label="Test details"
        onPress={() => setAboutOpen((open) => !open)}
        open={aboutOpen}
        testID="player-about-sound"
      >
        <Text style={styles.aboutText}>{ritual.aboutSound?.summary}</Text>
        {ritual.aboutSound?.details.map((detail) => (
          <Text key={detail} style={styles.aboutDetail}>
            {detail}
          </Text>
        ))}
      </Disclosure>
    </AmbientScreen>
  );
}

function Disclosure({
  children,
  label,
  onPress,
  open,
  testID,
}: {
  children: React.ReactNode;
  label: string;
  onPress: () => void;
  open: boolean;
  testID: string;
}) {
  return (
    <View style={styles.disclosure}>
      <Pressable
        accessibilityRole="button"
        accessibilityState={{ expanded: open }}
        onPress={onPress}
        style={({ pressed }) => [
          styles.disclosureButton,
          pressed && styles.pressed,
        ]}
        testID={testID}
      >
        <Text style={styles.disclosureLabel}>{label}</Text>
        <Text style={styles.disclosureGlyph}>{open ? "−" : "+"}</Text>
      </Pressable>
      {open ? <View style={styles.disclosureBody}>{children}</View> : null}
    </View>
  );
}

const styles = StyleSheet.create({
  unavailableTitle: {
    color: colors.text,
    fontFamily: fonts.serif,
    fontSize: 40,
  },
  testBanner: {
    minHeight: 64,
    justifyContent: "center",
    marginBottom: spacing.md,
    paddingHorizontal: spacing.md,
    paddingVertical: spacing.sm,
    borderRadius: radii.md,
    backgroundColor: "rgba(196, 175, 211, 0.13)",
    borderWidth: 1,
    borderColor: "rgba(196, 175, 211, 0.38)",
  },
  testLabel: {
    color: "#DAC9E6",
    fontFamily: fonts.sansSemiBold,
    fontSize: 9,
    letterSpacing: 1.5,
  },
  testCopy: {
    color: colors.textMuted,
    fontFamily: fonts.sans,
    fontSize: 10,
    lineHeight: 16,
    marginTop: 4,
  },
  status: {
    fontFamily: fonts.sansSemiBold,
    fontSize: 9,
    letterSpacing: 1.8,
    marginTop: spacing.lg,
    textAlign: "center",
  },
  title: {
    color: colors.text,
    fontFamily: fonts.serif,
    fontSize: 39,
    lineHeight: 42,
    textAlign: "center",
    marginTop: spacing.xs,
  },
  subtitle: {
    color: colors.textMuted,
    fontFamily: fonts.sans,
    fontSize: 13,
    lineHeight: 20,
    textAlign: "center",
    marginHorizontal: spacing.md,
    marginTop: spacing.sm,
  },
  timer: {
    color: colors.text,
    fontFamily: fonts.mono,
    fontSize: 30,
    letterSpacing: 2,
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
    minHeight: 44,
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
    fontFamily: fonts.sansMedium,
    fontSize: 11,
  },
  durationTextSelected: { color: colors.background },
  disabled: { opacity: 0.42 },
  errorBox: {
    marginTop: spacing.lg,
    padding: spacing.md,
    borderRadius: radii.md,
    backgroundColor: "rgba(215, 146, 131, 0.12)",
    borderWidth: 1,
    borderColor: colors.danger,
  },
  errorText: {
    color: colors.text,
    fontFamily: fonts.sans,
    fontSize: 12,
    lineHeight: 18,
  },
  retry: { minHeight: 44, justifyContent: "center", alignSelf: "flex-start" },
  retryText: { color: colors.moon, fontFamily: fonts.sansSemiBold },
  transport: {
    flexDirection: "row",
    justifyContent: "center",
    alignItems: "center",
    gap: spacing.sm,
    marginTop: spacing.lg,
  },
  primaryButton: {
    minWidth: 150,
    minHeight: 56,
    alignItems: "center",
    justifyContent: "center",
    paddingHorizontal: spacing.xl,
    borderRadius: radii.pill,
    backgroundColor: colors.text,
    shadowColor: colors.moon,
    shadowOpacity: 0.12,
    shadowRadius: 12,
  },
  primaryButtonText: {
    color: colors.background,
    fontSize: 14,
    fontFamily: fonts.sansSemiBold,
  },
  secondaryButton: {
    minWidth: 96,
    minHeight: 56,
    alignItems: "center",
    justifyContent: "center",
    paddingHorizontal: spacing.lg,
    borderRadius: radii.pill,
    backgroundColor: colors.surface,
    borderWidth: 1,
    borderColor: colors.surfaceLine,
  },
  secondaryButtonText: {
    color: colors.textMuted,
    fontFamily: fonts.sansSemiBold,
    fontSize: 13,
  },
  pressed: { opacity: 0.58, transform: [{ scale: 0.98 }] },
  disclosure: {
    marginTop: spacing.md,
    borderRadius: radii.lg,
    borderWidth: 1,
    borderColor: colors.surfaceLine,
    backgroundColor: "rgba(22, 32, 35, 0.82)",
    overflow: "hidden",
  },
  disclosureButton: {
    minHeight: 58,
    paddingHorizontal: spacing.md,
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
  },
  disclosureLabel: {
    color: colors.text,
    fontFamily: fonts.serif,
    fontSize: 21,
  },
  disclosureGlyph: {
    color: colors.moon,
    fontFamily: fonts.sans,
    fontSize: 24,
  },
  disclosureBody: {
    paddingHorizontal: spacing.md,
    paddingBottom: spacing.md,
  },
  disclosureIntro: {
    color: colors.textFaint,
    fontFamily: fonts.sans,
    fontSize: 11,
    lineHeight: 17,
    marginBottom: spacing.sm,
  },
  mixCard: {
    paddingHorizontal: spacing.sm,
    borderRadius: radii.md,
    backgroundColor: colors.surface,
    overflow: "hidden",
  },
  aboutText: {
    color: colors.textMuted,
    fontFamily: fonts.sans,
    fontSize: 12,
    lineHeight: 19,
  },
  aboutDetail: {
    color: colors.textFaint,
    fontFamily: fonts.sans,
    fontSize: 11,
    lineHeight: 17,
    marginTop: spacing.sm,
  },
});
