import { type ReactNode, useEffect, useRef } from "react";
import {
  Image,
  Pressable,
  StyleSheet,
  Text,
  useWindowDimensions,
  View,
} from "react-native";
import type { ConsumerOutcomeId } from "@/content/productShell";
import { M6_PLAYER_PAINTING } from "@/design/shellArtwork";
import { editorial } from "@/design/editorialTheme";
import { fonts, spacing } from "@/design/theme";
import { PlaybackTransport } from "./PlaybackTransport";
import { VolumeRange } from "./VolumeRange";
import { consumerPlaybackError } from "@/audio/consumerPlaybackError";

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
  secondaryOptions?: ReactNode;
  outcome: ConsumerOutcomeId | null;
  playPauseTestID?: string;
  remainingMs: number;
  title: string;
  variant?: "session" | "single";
  volume?: number;
  volumeDisabled?: boolean;
  status?: string;
  onRetry?: () => void;
  hideTransport?: boolean;
  transportAfterControls?: boolean;
  previewTransport?: boolean;
  preparedSessionNote?: string;
  immersive?: boolean;
  onRevealControls?: () => void;
}

export const LISTENING_SCENE_COPY = "Un respiro alla volta";

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
  secondaryOptions,
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
  transportAfterControls = false,
  previewTransport = false,
  preparedSessionNote,
  immersive = false,
  onRevealControls,
}: ConsumerPlaybackSurfaceProps) {
  const { height } = useWindowDimensions();
  const artworkHeight = Math.min(360, Math.max(220, height * 0.42));
  const volumePercent = Math.round(volume * 100);
  const lastAudibleVolume = useRef(volume > 0 ? volume : 0.8);
  useEffect(() => {
    if (volume > 0) lastAudibleVolume.current = volume;
  }, [volume]);

  if (immersive) {
    return (
      <View
        style={[styles.surface, styles.immersiveSurface, { minHeight: height }]}
        testID="consumer-playback-surface"
      >
        <Image
          accessible={false}
          accessibilityIgnoresInvertColors
          resizeMode="cover"
          source={M6_PLAYER_PAINTING}
          style={StyleSheet.absoluteFill}
        />
        <View pointerEvents="none" style={styles.immersiveCopyBlock}>
          <Text style={styles.immersiveBrand}>APP RELAX</Text>
          <Text
            accessibilityRole="header"
            nativeID="consumer-screen-title"
            style={styles.immersiveTitle}
            testID="consumer-screen-title"
          >
            {title}
          </Text>
        </View>
        <Pressable
          accessibilityHint="Riporta Pausa e Stop sullo schermo"
          accessibilityLabel="Mostra controlli di ascolto"
          accessibilityRole="button"
          onPress={onRevealControls}
          style={StyleSheet.absoluteFill}
          testID="consumer-listening-scene"
        />
      </View>
    );
  }

  const transport = !hideTransport ? (
    <View style={styles.transport} testID="consumer-inline-transport">
      {preparedSessionNote ? (
        <Text style={styles.preparedNote} accessibilityLiveRegion="polite">
          {preparedSessionNote}
        </Text>
      ) : null}
      <PlaybackTransport
        previewOnly={previewTransport}
        canPlay={canPlay}
        canStop={canStop}
        isPlaying={isPlaying}
        onPlayPause={onPlayPause}
        onStop={onStop}
        playPauseTestID={playPauseTestID}
        primaryLabel={preparedSessionNote ? "Start new session" : undefined}
        playPauseAccessibilityLabel={
          preparedSessionNote ? "Start new session" : undefined
        }
      />
    </View>
  ) : null;

  return (
    <View testID="consumer-playback-surface" style={styles.surface}>
      {outcome ? (
        <View
          pointerEvents="none"
          style={[
            styles.artwork,
            variant === "session" && styles.sessionArtwork,
            { height: artworkHeight },
          ]}
        >
          <Image
            accessible={false}
            accessibilityIgnoresInvertColors
            resizeMode="cover"
            source={M6_PLAYER_PAINTING}
            style={{ width: "100%", height: "100%" }}
          />
        </View>
      ) : null}
      {contextLabel ? (
        <Text style={styles.functionLabel}>{contextLabel}</Text>
      ) : null}
      <Text
        accessibilityRole="header"
        nativeID="consumer-screen-title"
        style={[styles.title, variant === "session" && styles.sessionTitle]}
        testID="consumer-screen-title"
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
          {consumerPlaybackError(error)}
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

      {!transportAfterControls ? transport : null}

      <View style={styles.controls}>
        {options}

        {onVolumeChange ? (
          <View
            accessibilityLabel={`Main volume ${volumePercent} percent`}
            style={styles.volumePanel}
          >
            <Text style={styles.volumeLabel}>
              MAIN VOLUME · {volumePercent}%
            </Text>
            <View style={styles.volumeRow}>
              <VolumeRange
                disabled={volumeDisabled}
                label="Main volume"
                value={volume}
                onChange={onVolumeChange}
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
            </View>
          </View>
        ) : null}

        {secondaryOptions}
        {note ? <Text style={styles.note}>{note}</Text> : null}
      </View>
      {transportAfterControls ? transport : null}
    </View>
  );
}

const styles = StyleSheet.create({
  surface: { position: "relative" },
  immersiveSurface: {
    marginHorizontal: -22,
    marginTop: -8,
    overflow: "hidden",
  },
  immersiveCopyBlock: {
    left: 30,
    position: "absolute",
    right: 24,
    top: 34,
  },
  immersiveBrand: {
    color: editorial.ink,
    fontFamily: fonts.sansSemiBold,
    fontSize: 13,
    letterSpacing: 3.2,
  },
  immersiveTitle: {
    color: editorial.ink,
    fontFamily: fonts.serifItalic,
    fontSize: 34,
    lineHeight: 42,
    marginTop: 24,
  },
  artwork: {
    marginLeft: -22,
    marginRight: -22,
    width: undefined,
  },
  sessionArtwork: {},
  controls: {
    marginTop: spacing.md,
    paddingTop: 12,
  },
  functionLabel: {
    color: editorial.mineralBlue,
    fontFamily: fonts.sansSemiBold,
    fontSize: 13,
    letterSpacing: 1.2,
    marginTop: spacing.lg,
  },
  title: {
    color: editorial.ink,
    fontFamily: fonts.serif,
    fontSize: 28,
    lineHeight: 34,
    marginTop: spacing.sm,
  },
  sessionTitle: { fontSize: 28, lineHeight: 34 },
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
    fontSize: 52,
    lineHeight: 58,
    marginTop: 18,
    textAlign: "center",
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
  transport: { marginTop: spacing.xl, marginBottom: spacing.md },
  preparedNote: {
    color: editorial.inkMuted,
    fontFamily: fonts.sans,
    fontSize: 14,
    lineHeight: 20,
    marginBottom: spacing.sm,
  },
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
    marginTop: spacing.md,
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
    borderWidth: 0,
    minWidth: 64,
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
