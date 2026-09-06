import { Pressable, StyleSheet, Text, View } from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import { editorial } from "@/design/editorialTheme";
import { fonts } from "@/design/theme";

export interface PlaybackTransportProps {
  canPlay: boolean;
  canStop: boolean;
  isPlaying: boolean;
  busy?: boolean;
  onPlayPause: () => void;
  onStop: () => void;
  playPauseTestID?: string;
  fixedFooter?: boolean;
  playPauseAccessibilityLabel?: string;
  stopAccessibilityLabel?: string;
  primaryLabel?: string;
  previewOnly?: boolean;
}

/** Fixed order and geometry: square Stop left, Play/Pause right. */
export function PlaybackTransport({
  canPlay,
  canStop,
  isPlaying,
  busy = false,
  onPlayPause,
  onStop,
  playPauseTestID,
  fixedFooter = false,
  playPauseAccessibilityLabel,
  stopAccessibilityLabel,
  primaryLabel,
  previewOnly = false,
}: PlaybackTransportProps) {
  const controls = (
    <View style={styles.row} testID="playback-transport">
      {!previewOnly && (
        <Pressable
          accessibilityRole="button"
          accessibilityLabel={stopAccessibilityLabel ?? "Stop"}
          accessibilityHint="End this listening session"
          accessibilityState={{ disabled: !canStop }}
          disabled={!canStop}
          onPress={onStop}
          style={({ pressed }) => [
            styles.button,
            styles.stop,
            !canStop && styles.disabled,
            pressed && styles.pressed,
          ]}
        >
          <TransportSymbol kind="stop" />
          <Text style={styles.stopLabel}>Stop</Text>
        </Pressable>
      )}
      <Pressable
        accessibilityRole="button"
        accessibilityLabel={
          playPauseAccessibilityLabel ??
          (previewOnly ? "Play this sound" : isPlaying ? "Pause" : "Play")
        }
        accessibilityHint={
          isPlaying
            ? "Silence now and keep your place"
            : "Begin or resume listening"
        }
        accessibilityState={{ disabled: !isPlaying && !canPlay, busy }}
        disabled={!isPlaying && !canPlay}
        onPress={onPlayPause}
        testID={playPauseTestID}
        style={({ pressed }) => [
          styles.button,
          styles.play,
          !isPlaying && !canPlay && styles.disabled,
          pressed && styles.pressed,
        ]}
      >
        <TransportSymbol kind={isPlaying ? "pause" : "play"} light />
        <Text style={styles.playLabel}>
          {primaryLabel ??
            (previewOnly
              ? "Play this sound"
              : isPlaying
                ? "Pause"
                : busy
                  ? "Starting…"
                  : "Play")}
        </Text>
      </Pressable>
    </View>
  );
  return fixedFooter ? (
    <SafeAreaView
      edges={["bottom"]}
      style={styles.footer}
      testID="fixed-player-controls"
    >
      {controls}
    </SafeAreaView>
  ) : (
    controls
  );
}

export function TransportSymbol({
  kind,
  light = false,
}: {
  kind: "play" | "pause" | "stop";
  light?: boolean;
}) {
  const color = light ? editorial.paperLight : editorial.ink;
  return (
    <View
      accessible={false}
      accessibilityElementsHidden
      importantForAccessibility="no-hide-descendants"
      style={styles.symbol}
      testID={`transport-symbol-${kind}`}
    >
      {kind === "play" ? (
        <View style={[styles.triangle, { borderLeftColor: color }]} />
      ) : kind === "stop" ? (
        <View style={[styles.square, { backgroundColor: color }]} />
      ) : (
        <View style={styles.pauseBars}>
          <View style={[styles.pauseBar, { backgroundColor: color }]} />
          <View style={[styles.pauseBar, { backgroundColor: color }]} />
        </View>
      )}
    </View>
  );
}

const styles = StyleSheet.create({
  footer: {
    backgroundColor: editorial.paperLight,
    borderTopWidth: 1,
    borderColor: editorial.lineStrong,
    paddingHorizontal: 18,
    paddingTop: 8,
    paddingBottom: 8,
  },
  row: { flexDirection: "row", gap: 12 },
  button: {
    minHeight: 52,
    flexDirection: "row",
    gap: 8,
    justifyContent: "center",
    alignItems: "center",
    borderWidth: 1,
    paddingHorizontal: 12,
    paddingVertical: 8,
  },
  stop: {
    flex: 1,
    backgroundColor: editorial.paperLight,
    borderColor: editorial.lineStrong,
  },
  play: {
    flex: 1.65,
    backgroundColor: editorial.ink,
    borderColor: editorial.ink,
  },
  stopLabel: {
    fontFamily: fonts.sansSemiBold,
    fontSize: 16,
    flexShrink: 1,
    color: editorial.ink,
  },
  playLabel: {
    fontFamily: fonts.sansSemiBold,
    fontSize: 16,
    flexShrink: 1,
    color: editorial.paperLight,
  },
  symbol: {
    width: 20,
    height: 22,
    flexShrink: 0,
    alignItems: "center",
    justifyContent: "center",
  },
  square: { width: 18, height: 18 },
  triangle: {
    width: 0,
    height: 0,
    borderTopWidth: 10,
    borderBottomWidth: 10,
    borderLeftWidth: 17,
    borderTopColor: "transparent",
    borderBottomColor: "transparent",
    marginLeft: 3,
  },
  pauseBars: { flexDirection: "row", gap: 5 },
  pauseBar: { width: 6, height: 20 },
  disabled: { opacity: 0.48 },
  pressed: { opacity: 0.8 },
});
