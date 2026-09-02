import { useEffect, useMemo, useRef } from "react";
import { useLocalSearchParams } from "expo-router";
import { Image, Pressable, StyleSheet, Text, View } from "react-native";
import { useAudioSession } from "@/audio/AudioProvider";
import { EditorialHeader } from "@/components/EditorialHeader";
import { EditorialScreen } from "@/components/EditorialScreen";
import { getConsumerWork, isEmbeddedWork } from "@/content/consumerCatalog";
import { createSingleTrackProgram } from "@/domain/audio/consumerTypes";
import { OUTCOME_ARTWORK } from "@/design/outcomeArtwork";
import { editorial } from "@/design/editorialTheme";
import { fonts, spacing } from "@/design/theme";

function formatRemaining(milliseconds: number): string {
  const seconds = Math.max(0, Math.ceil(milliseconds / 1000));
  return `${String(Math.floor(seconds / 60)).padStart(2, "0")}:${String(seconds % 60).padStart(2, "0")}`;
}

export default function ConsumerPlayerScreen() {
  const { start, workId } = useLocalSearchParams<{
    start?: string;
    workId: string;
  }>();
  const work = getConsumerWork(workId);
  const { controller, snapshot } = useAudioSession();
  const autoStartedWorkId = useRef<string | null>(null);
  const program = useMemo(
    () => (work ? createSingleTrackProgram(work) : null),
    [work],
  );

  useEffect(() => {
    if (program && isEmbeddedWork(program.work)) {
      void (async () => {
        await controller.loadProgram(program);
        if (start === "1" && autoStartedWorkId.current !== program.work.id) {
          autoStartedWorkId.current = program.work.id;
          await controller.play();
        }
      })();
    }
  }, [controller, program, start]);

  if (!work || !program || !isEmbeddedWork(work)) return null;
  const isPlaying = snapshot.status === "playing";
  const isFading = snapshot.status === "fadingOut";
  const canPlay = snapshot.status === "ready" || snapshot.status === "paused";
  const timerLocked = isPlaying || isFading;
  const volumePercent = Math.round(snapshot.volume * 100);

  return (
    <EditorialScreen>
      <EditorialHeader label={work.primaryOutcome.toUpperCase()} showBack />
      <Image
        accessibilityIgnoresInvertColors
        resizeMode="cover"
        source={OUTCOME_ARTWORK[work.primaryOutcome]}
        style={styles.artwork}
      />
      <Text style={styles.functionLabel}>
        {work.primaryOutcome.toUpperCase()} · SINGLE WORK
      </Text>
      <Text accessibilityRole="header" style={styles.title}>
        {work.title}
      </Text>
      <Text style={styles.gate}>PROVISIONAL · LISTENING APPROVAL REQUIRED</Text>

      <Text
        accessibilityLabel={`${formatRemaining(snapshot.remainingMs)} remaining`}
        style={styles.timer}
      >
        {formatRemaining(snapshot.remainingMs)}
      </Text>
      <View accessibilityLabel="Session duration" style={styles.durationRow}>
        {program.durationOptionsMinutes.map((minutes) => (
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
            style={[
              styles.duration,
              snapshot.selectedDurationMinutes === minutes && styles.selected,
            ]}
          >
            <Text style={styles.durationText}>{minutes} min</Text>
          </Pressable>
        ))}
      </View>

      {snapshot.error ? (
        <Text accessibilityRole="alert" style={styles.error}>
          {snapshot.error}
        </Text>
      ) : null}

      <View style={styles.transport}>
        <Pressable
          accessibilityLabel="Stop"
          accessibilityRole="button"
          onPress={() => void controller.stop()}
          style={styles.secondaryButton}
        >
          <Text style={styles.secondaryText}>Stop</Text>
        </Pressable>
        <Pressable
          accessibilityLabel={isPlaying ? "Pause" : "Play"}
          accessibilityRole="button"
          accessibilityState={{ disabled: !isPlaying && !canPlay }}
          disabled={!isPlaying && !canPlay}
          onPress={() =>
            void (isPlaying ? controller.pause() : controller.play())
          }
          style={[
            styles.primaryButton,
            !isPlaying && !canPlay && styles.disabled,
          ]}
          testID="consumer-play-pause"
        >
          <Text style={styles.primaryText}>{isPlaying ? "Pause" : "Play"}</Text>
        </Pressable>
      </View>

      <View
        accessibilityLabel={`Main volume ${volumePercent} percent`}
        style={styles.volumePanel}
      >
        <Text style={styles.volumeLabel}>MAIN VOLUME · {volumePercent}%</Text>
        <View style={styles.volumeRow}>
          <VolumeButton
            label="Lower volume"
            text="−"
            onPress={() =>
              void controller.setVolume(Math.max(0, snapshot.volume - 0.1))
            }
          />
          <Pressable
            accessibilityLabel={volumePercent === 0 ? "Unmute" : "Mute"}
            accessibilityRole="button"
            onPress={() =>
              void controller.setVolume(volumePercent === 0 ? 0.8 : 0)
            }
            style={styles.muteButton}
          >
            <Text style={styles.secondaryText}>
              {volumePercent === 0 ? "Unmute" : "Mute"}
            </Text>
          </Pressable>
          <VolumeButton
            label="Raise volume"
            text="+"
            onPress={() =>
              void controller.setVolume(Math.min(1, snapshot.volume + 0.1))
            }
          />
        </View>
      </View>
      <Text style={styles.note}>
        One file plays alone in a lossless loop. No mixer or hidden layers.
      </Text>
    </EditorialScreen>
  );
}

function VolumeButton({
  label,
  onPress,
  text,
}: {
  label: string;
  onPress: () => void;
  text: string;
}) {
  return (
    <Pressable
      accessibilityLabel={label}
      accessibilityRole="button"
      onPress={onPress}
      style={styles.volumeButton}
    >
      <Text style={styles.volumeGlyph}>{text}</Text>
    </Pressable>
  );
}

const styles = StyleSheet.create({
  artwork: { height: 220, width: "100%" },
  functionLabel: {
    color: editorial.mineralBlue,
    fontFamily: fonts.sansSemiBold,
    fontSize: 11,
    letterSpacing: 1.2,
    marginTop: spacing.lg,
  },
  title: {
    color: editorial.ink,
    fontFamily: fonts.serif,
    fontSize: 44,
    lineHeight: 47,
    marginTop: spacing.sm,
  },
  gate: {
    color: editorial.gold,
    fontFamily: fonts.sansSemiBold,
    fontSize: 11,
    letterSpacing: 0.55,
    marginTop: spacing.sm,
  },
  timer: {
    color: editorial.ink,
    fontFamily: fonts.serif,
    fontSize: 58,
    lineHeight: 64,
    marginTop: spacing.xl,
  },
  durationRow: { flexDirection: "row", gap: spacing.sm, marginTop: spacing.md },
  duration: {
    alignItems: "center",
    borderColor: editorial.line,
    borderWidth: StyleSheet.hairlineWidth,
    justifyContent: "center",
    minHeight: 44,
    paddingHorizontal: spacing.md,
  },
  selected: { backgroundColor: "#DDE5E0", borderColor: editorial.jade },
  durationText: {
    color: editorial.ink,
    fontFamily: fonts.sansMedium,
    fontSize: 12,
  },
  transport: { flexDirection: "row", gap: spacing.md, marginTop: spacing.xl },
  secondaryButton: {
    alignItems: "center",
    borderColor: editorial.lineStrong,
    borderWidth: StyleSheet.hairlineWidth,
    flex: 1,
    justifyContent: "center",
    minHeight: 56,
  },
  primaryButton: {
    alignItems: "center",
    backgroundColor: editorial.ink,
    flex: 2,
    justifyContent: "center",
    minHeight: 56,
  },
  primaryText: {
    color: editorial.paperLight,
    fontFamily: fonts.sansSemiBold,
    fontSize: 15,
  },
  secondaryText: {
    color: editorial.ink,
    fontFamily: fonts.sansSemiBold,
    fontSize: 13,
  },
  volumePanel: {
    borderTopColor: editorial.line,
    borderTopWidth: StyleSheet.hairlineWidth,
    marginTop: spacing.xl,
    paddingTop: spacing.md,
  },
  volumeLabel: {
    color: editorial.inkMuted,
    fontFamily: fonts.sansSemiBold,
    fontSize: 11,
    letterSpacing: 0.8,
  },
  volumeRow: { flexDirection: "row", gap: spacing.md, marginTop: spacing.md },
  volumeButton: {
    alignItems: "center",
    borderColor: editorial.lineStrong,
    borderWidth: StyleSheet.hairlineWidth,
    height: 48,
    justifyContent: "center",
    width: 52,
  },
  volumeGlyph: {
    color: editorial.ink,
    fontFamily: fonts.sansMedium,
    fontSize: 24,
  },
  muteButton: {
    alignItems: "center",
    borderColor: editorial.lineStrong,
    borderWidth: StyleSheet.hairlineWidth,
    flex: 1,
    justifyContent: "center",
    minHeight: 48,
  },
  note: {
    color: editorial.inkMuted,
    fontFamily: fonts.sans,
    fontSize: 12,
    lineHeight: 19,
    marginTop: spacing.lg,
  },
  error: {
    color: editorial.rose,
    fontFamily: fonts.sansMedium,
    fontSize: 13,
    marginTop: spacing.md,
  },
  disabled: { opacity: 0.45 },
});
