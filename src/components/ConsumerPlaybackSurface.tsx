import { type ReactNode, useEffect, useRef } from "react";
import {
  Image,
  Pressable,
  StyleSheet,
  Text,
  useWindowDimensions,
  View,
} from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import { LinearGradient } from "expo-linear-gradient";
import type { ConsumerOutcomeId } from "@/content/productShell";
import { C3_PLAYER_FULL_BLEED } from "@/design/shellArtwork";
import { editorial } from "@/design/editorialTheme";
import { fonts, spacing } from "@/design/theme";
import { PlaybackTransport } from "./PlaybackTransport";
import { VolumeRange } from "./VolumeRange";
import { consumerPlaybackError } from "@/audio/consumerPlaybackError";
import { FullBleedArtwork } from "./FullBleedArtwork";

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
  atmospheric?: boolean;
  sessionDescriptor?: string;
  completed?: boolean;
  onReturn?: () => void;
}

export const LISTENING_SCENE_COPY = "Un respiro alla volta.";
export const LISTENING_SCENE_SUBTITLE = "La natura ti renderà consapevole.";

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
  atmospheric = false,
  sessionDescriptor,
  completed = false,
  onReturn,
}: ConsumerPlaybackSurfaceProps) {
  const { height, width } = useWindowDimensions();
  const showListeningCopy = title === LISTENING_SCENE_COPY;
  const artworkHeight = Math.min(360, Math.max(220, height * 0.42));
  const volumePercent = Math.round(volume * 100);
  const lastAudibleVolume = useRef(volume > 0 ? volume : 0.8);
  useEffect(() => {
    if (volume > 0) lastAudibleVolume.current = volume;
  }, [volume]);

  if (atmospheric) {
    const large = width >= 420 || height >= 900;
    const actionLabel = isPlaying
      ? "Pausa"
      : completed
        ? "Ascolta di nuovo"
        : canStop
          ? "Riprendi"
          : "Inizia";
    return (
      <View
        style={[styles.atmosphericSurface, { minHeight: height }]}
        testID="consumer-playback-surface"
      >
        <FullBleedArtwork
          source={C3_PLAYER_FULL_BLEED}
          testID="player-full-bleed-artwork"
        />
        <LinearGradient
          pointerEvents="none"
          colors={[
            "rgba(244,238,230,0.26)",
            "rgba(244,238,230,0.01)",
            "rgba(244,238,230,0.42)",
          ]}
          locations={[0, 0.58, 1]}
          style={StyleSheet.absoluteFill}
        />
        {immersive ? (
          <Pressable
            accessibilityHint="Mostra Pausa e Interrompi"
            accessibilityLabel="Mostra controlli di ascolto"
            accessibilityRole="button"
            onPress={onRevealControls}
            style={StyleSheet.absoluteFill}
            testID="consumer-listening-scene"
          />
        ) : null}
        <SafeAreaView
          edges={["top", "left", "right"]}
          pointerEvents="box-none"
          style={styles.atmosphericSafeArea}
        >
          <View
            pointerEvents={immersive ? "none" : "auto"}
            style={[
              styles.atmosphericContent,
              large && styles.atmosphericContentLarge,
            ]}
          >
            {!immersive ? (
              <View pointerEvents="none" style={styles.atmosphericHeading}>
                <Text style={styles.atmosphericBrand}>APP RELAX</Text>
                <Text
                  accessibilityRole="header"
                  nativeID="consumer-screen-title"
                  style={[
                    styles.atmosphericTitle,
                    large && styles.atmosphericTitleLarge,
                  ]}
                  testID="consumer-screen-title"
                >
                  {title}
                </Text>
                {showListeningCopy ? (
                  <Text
                    style={styles.atmosphericSubtitle}
                    testID="listening-scene-subtitle"
                  >
                    {LISTENING_SCENE_SUBTITLE}
                  </Text>
                ) : null}
              </View>
            ) : null}
            <Text
              accessibilityLabel={`${formatPlaybackTime(remainingMs)} remaining`}
              style={[
                styles.atmosphericTimer,
                large && styles.atmosphericTimerLarge,
              ]}
              testID="atmospheric-player-timer"
            >
              {formatPlaybackTime(remainingMs)}
            </Text>
            <View style={styles.atmosphericOpenSpace} />
            {!immersive ? (
              <View style={styles.atmosphericControls}>
                {error ? (
                  <Text
                    accessibilityRole="alert"
                    style={styles.atmosphericError}
                  >
                    L’audio non è disponibile. Riprova.
                  </Text>
                ) : null}
                {error && onRetry ? (
                  <Pressable
                    accessibilityRole="button"
                    onPress={onRetry}
                    style={styles.atmosphericTextAction}
                  >
                    <Text style={styles.atmosphericActionLabel}>Riprova</Text>
                  </Pressable>
                ) : (
                  <Pressable
                    accessibilityLabel={actionLabel}
                    accessibilityRole="button"
                    accessibilityState={{
                      disabled: !isPlaying && !canPlay,
                    }}
                    disabled={!isPlaying && !canPlay}
                    onPress={onPlayPause}
                    style={({ pressed }) => [
                      styles.atmosphericPrimary,
                      !isPlaying && !canPlay && styles.disabled,
                      pressed && styles.atmosphericPressed,
                    ]}
                    testID={playPauseTestID}
                  >
                    <View style={styles.atmosphericPrimaryDisc}>
                      <View
                        style={
                          isPlaying
                            ? styles.atmosphericPause
                            : styles.atmosphericPlay
                        }
                      >
                        {isPlaying ? (
                          <>
                            <View style={styles.atmosphericPauseBar} />
                            <View style={styles.atmosphericPauseBar} />
                          </>
                        ) : null}
                      </View>
                    </View>
                    <Text style={styles.atmosphericActionLabel}>
                      {actionLabel}
                    </Text>
                  </Pressable>
                )}
                {canStop ? (
                  <Pressable
                    accessibilityLabel="Interrompi"
                    accessibilityRole="button"
                    onPress={onStop}
                    style={({ pressed }) => [
                      styles.atmosphericTextAction,
                      pressed && styles.atmosphericPressed,
                    ]}
                  >
                    <Text style={styles.atmosphericStop}>Interrompi</Text>
                  </Pressable>
                ) : null}
                {completed && onReturn ? (
                  <Pressable
                    accessibilityLabel="Torna a Yoga"
                    accessibilityRole="button"
                    onPress={onReturn}
                    style={({ pressed }) => [
                      styles.atmosphericTextAction,
                      pressed && styles.atmosphericPressed,
                    ]}
                  >
                    <Text style={styles.atmosphericStop}>Torna a Yoga</Text>
                  </Pressable>
                ) : null}
                {sessionDescriptor ? (
                  <Text style={styles.atmosphericDescriptor}>
                    {sessionDescriptor}
                  </Text>
                ) : null}
              </View>
            ) : null}
          </View>
        </SafeAreaView>
      </View>
    );
  }

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
          source={C3_PLAYER_FULL_BLEED}
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
          {showListeningCopy ? (
            <Text style={styles.immersiveSubtitle}>
              {LISTENING_SCENE_SUBTITLE}
            </Text>
          ) : null}
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
            source={C3_PLAYER_FULL_BLEED}
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
      {showListeningCopy ? (
        <Text style={styles.subtitle}>{LISTENING_SCENE_SUBTITLE}</Text>
      ) : null}
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
  atmosphericSurface: {
    backgroundColor: "#F4EEE6",
    flex: 1,
    marginHorizontal: -22,
    overflow: "hidden",
  },
  atmosphericSafeArea: { flex: 1 },
  atmosphericContent: {
    flex: 1,
    paddingBottom: 34,
    paddingHorizontal: 24,
    paddingTop: 24,
  },
  atmosphericContentLarge: {
    paddingBottom: 40,
    paddingHorizontal: 28,
    paddingTop: 28,
  },
  atmosphericHeading: { maxWidth: 310 },
  atmosphericBrand: {
    color: "#20384D",
    fontFamily: fonts.sansSemiBold,
    fontSize: 12,
    letterSpacing: 2.4,
    lineHeight: 16,
  },
  atmosphericTitle: {
    color: "#20384D",
    fontFamily: fonts.serif,
    fontSize: 40,
    letterSpacing: -1.1,
    lineHeight: 44,
    marginTop: 10,
  },
  atmosphericTitleLarge: { fontSize: 44, lineHeight: 48 },
  atmosphericSubtitle: {
    color: "#29353B",
    fontFamily: fonts.sans,
    fontSize: 15,
    lineHeight: 22,
    marginTop: 10,
    maxWidth: 260,
  },
  atmosphericTimer: {
    color: "#20384D",
    fontFamily: fonts.serif,
    fontSize: 30,
    lineHeight: 36,
    position: "absolute",
    right: 24,
    textAlign: "right",
    top: 96,
  },
  atmosphericTimerLarge: { right: 28, top: 108 },
  atmosphericOpenSpace: { flex: 1, minHeight: 350 },
  atmosphericControls: { alignItems: "center", minHeight: 214 },
  atmosphericPrimary: {
    alignItems: "center",
    justifyContent: "center",
    minHeight: 86,
    minWidth: 96,
  },
  atmosphericPrimaryDisc: {
    alignItems: "center",
    borderColor: "#20384D",
    borderRadius: 32,
    borderWidth: 1,
    height: 64,
    justifyContent: "center",
    width: 64,
  },
  atmosphericPlay: {
    borderBottomColor: "transparent",
    borderBottomWidth: 10,
    borderLeftColor: "#20384D",
    borderLeftWidth: 17,
    borderTopColor: "transparent",
    borderTopWidth: 10,
    height: 0,
    marginLeft: 3,
    width: 0,
  },
  atmosphericPause: { flexDirection: "row", gap: 5 },
  atmosphericPauseBar: { backgroundColor: "#20384D", height: 20, width: 5 },
  atmosphericActionLabel: {
    color: "#20384D",
    fontFamily: fonts.sansSemiBold,
    fontSize: 17,
    marginTop: 6,
  },
  atmosphericTextAction: {
    alignItems: "center",
    justifyContent: "center",
    minHeight: 48,
    minWidth: 96,
  },
  atmosphericStop: {
    color: "#20384D",
    fontFamily: fonts.sansSemiBold,
    fontSize: 16,
    textDecorationLine: "underline",
  },
  atmosphericDescriptor: {
    color: "#29353B",
    fontFamily: fonts.sans,
    fontSize: 15,
    lineHeight: 22,
    marginTop: 4,
  },
  atmosphericError: {
    color: editorial.rose,
    fontFamily: fonts.sansMedium,
    fontSize: 15,
    lineHeight: 22,
    textAlign: "center",
  },
  atmosphericPressed: { backgroundColor: "rgba(32,56,77,0.06)" },
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
  immersiveSubtitle: {
    color: editorial.inkMuted,
    fontFamily: fonts.sans,
    fontSize: 15,
    lineHeight: 22,
    marginTop: 8,
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
  subtitle: {
    color: editorial.inkMuted,
    fontFamily: fonts.sans,
    fontSize: 15,
    lineHeight: 22,
    marginTop: 8,
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
