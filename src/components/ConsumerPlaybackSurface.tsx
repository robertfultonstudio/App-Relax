import { type ReactNode, useEffect, useRef } from "react";
import { Image, Pressable, StyleSheet, Text, View } from "react-native";
import type { ConsumerOutcomeId } from "@/content/productShell";
import { OUTCOME_ARTWORK } from "@/design/outcomeArtwork";
import { editorial } from "@/design/editorialTheme";
import { fonts, spacing } from "@/design/theme";
import { PlaybackTransport } from "./PlaybackTransport";

export function formatPlaybackTime(milliseconds: number): string {
  const seconds = Math.max(0, Math.ceil(milliseconds / 1000));
  return `${String(Math.floor(seconds / 60)).padStart(2, "0")}:${String(seconds % 60).padStart(2, "0")}`;
}

interface ConsumerPlaybackSurfaceProps {
  canPlay: boolean;
  canStop: boolean;
  contextLabel: string;
  currentLabel?: string;
  currentTitle?: string;
  error?: string | null;
  gateLabel?: string | null;
  isPlaying: boolean;
  note: string;
  onPlayPause: () => void;
  onStop: () => void;
  onVolumeChange?: (volume: number) => void;
  options?: ReactNode;
  outcome: ConsumerOutcomeId;
  playPauseTestID?: string;
  remainingMs: number;
  title: string;
  variant?: "session" | "single";
  volume?: number;
  volumeDisabled?: boolean;
  status?: string;
  onRetry?: () => void;
  hideTransport?: boolean;
  previewTransport?: boolean;
}

export function ConsumerPlaybackSurface({
  canPlay,
  canStop,
  contextLabel,
  currentLabel,
  currentTitle,
  error,
  gateLabel,
  isPlaying,
  note,
  onPlayPause,
  onStop,
  onVolumeChange,
  options,
  outcome,
  playPauseTestID,
  remainingMs,
  title,
  variant = "single",
  volume = 0.8,
  volumeDisabled = false,
  status,
  onRetry,
  hideTransport = false,
  previewTransport = false,
}: ConsumerPlaybackSurfaceProps) {
  const volumePercent = Math.round(volume * 100);
  const lastAudibleVolume = useRef(volume > 0 ? volume : 0.8);
  useEffect(() => {
    if (volume > 0) lastAudibleVolume.current = volume;
  }, [volume]);

  return (
    <View testID="consumer-playback-surface">
      <Image
        accessible={false}
        accessibilityIgnoresInvertColors
        resizeMode="cover"
        source={OUTCOME_ARTWORK[outcome]}
        style={[styles.artwork, variant === "session" && styles.sessionArtwork]}
      />
      <Text style={styles.functionLabel}>{contextLabel}</Text>
      <Text
        accessibilityRole="header"
        style={[styles.title, variant === "session" && styles.sessionTitle]}
      >
        {title}
      </Text>
      {gateLabel ? <Text style={styles.gate}>{gateLabel}</Text> : null}
      {status ? (
        <Text accessibilityLiveRegion="polite" style={styles.gate}>
          {status}
        </Text>
      ) : null}

      <Text
        accessibilityLabel={`${formatPlaybackTime(remainingMs)} remaining`}
        style={styles.timer}
      >
        {formatPlaybackTime(remainingMs)}
      </Text>

      {currentLabel && currentTitle ? (
        <View style={styles.nowPanel}>
          <Text style={styles.nowLabel}>{currentLabel}</Text>
          <Text style={styles.nowTitle}>{currentTitle}</Text>
        </View>
      ) : null}

      {error ? (
        <Text accessibilityRole="alert" style={styles.error}>
          {error}
        </Text>
      ) : null}
      {error && onRetry ? (
        <Pressable
          accessibilityRole="button"
          onPress={onRetry}
          style={styles.secondaryButton}
        >
          <Text style={styles.secondaryText}>Retry loading</Text>
        </Pressable>
      ) : null}

      {!hideTransport && (
        <View style={styles.transport}>
          <PlaybackTransport
            previewOnly={previewTransport}
            canPlay={canPlay}
            canStop={canStop}
            isPlaying={isPlaying}
            onPlayPause={onPlayPause}
            onStop={onStop}
            playPauseTestID={playPauseTestID}
          />
        </View>
      )}

      {options}

      {onVolumeChange ? (
        <View
          accessibilityLabel={`Main volume ${volumePercent} percent`}
          style={styles.volumePanel}
        >
          <Text style={styles.volumeLabel}>MAIN VOLUME · {volumePercent}%</Text>
          <View style={styles.volumeRow}>
            <VolumeButton
              disabled={volumeDisabled}
              label="Lower volume"
              onPress={() => onVolumeChange(Math.max(0, volume - 0.1))}
              text="−"
            />
            <Pressable
              accessibilityLabel={volumePercent === 0 ? "Unmute" : "Mute"}
              accessibilityRole="button"
              accessibilityState={{ disabled: volumeDisabled }}
              disabled={volumeDisabled}
              onPress={() =>
                onVolumeChange(
                  volumePercent === 0 ? lastAudibleVolume.current : 0,
                )
              }
              style={[styles.muteButton, volumeDisabled && styles.disabled]}
            >
              <Text style={styles.secondaryText}>
                {volumePercent === 0 ? "Unmute" : "Mute"}
              </Text>
            </Pressable>
            <VolumeButton
              disabled={volumeDisabled}
              label="Raise volume"
              onPress={() => onVolumeChange(Math.min(1, volume + 0.1))}
              text="+"
            />
          </View>
        </View>
      ) : null}

      <Text style={styles.note}>{note}</Text>
    </View>
  );
}

function VolumeButton({
  disabled,
  label,
  onPress,
  text,
}: {
  disabled: boolean;
  label: string;
  onPress: () => void;
  text: string;
}) {
  return (
    <Pressable
      accessibilityLabel={label}
      accessibilityRole="button"
      accessibilityState={{ disabled }}
      disabled={disabled}
      onPress={onPress}
      style={[styles.volumeButton, disabled && styles.disabled]}
    >
      <Text style={styles.volumeGlyph}>{text}</Text>
    </Pressable>
  );
}

const styles = StyleSheet.create({
  artwork: { height: 110, width: "100%" },
  sessionArtwork: { height: 110 },
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
    fontSize: 34,
    lineHeight: 38,
    marginTop: spacing.sm,
  },
  sessionTitle: { fontSize: 32, lineHeight: 36 },
  gate: {
    color: editorial.gold,
    fontFamily: fonts.sansSemiBold,
    fontSize: 14,
    letterSpacing: 0.25,
    marginTop: spacing.sm,
  },
  timer: {
    color: editorial.ink,
    fontFamily: fonts.serif,
    fontSize: 58,
    lineHeight: 64,
    marginTop: spacing.md,
  },
  nowPanel: {
    borderLeftColor: editorial.jade,
    borderLeftWidth: 2,
    marginTop: spacing.md,
    paddingLeft: spacing.md,
  },
  nowLabel: {
    color: editorial.inkFaint,
    fontFamily: fonts.sansSemiBold,
    fontSize: 13,
    letterSpacing: 0.9,
  },
  nowTitle: {
    color: editorial.ink,
    fontFamily: fonts.serifItalic,
    fontSize: 22,
    marginTop: 3,
  },
  transport: { marginTop: spacing.md },
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
    fontSize: 14,
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
    fontSize: 14,
    letterSpacing: 0.3,
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
    borderTopColor: editorial.line,
    borderTopWidth: StyleSheet.hairlineWidth,
    color: editorial.inkMuted,
    fontFamily: fonts.sans,
    fontSize: 14,
    lineHeight: 19,
    marginTop: spacing.xl,
    paddingTop: spacing.md,
  },
  error: {
    color: editorial.rose,
    fontFamily: fonts.sansMedium,
    fontSize: 13,
    lineHeight: 20,
    marginTop: spacing.md,
  },
  disabled: { opacity: 0.45 },
});
