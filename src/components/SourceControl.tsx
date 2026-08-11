import { Pressable, StyleSheet, Text, View } from "react-native";
import type { SourceSnapshot } from "@/domain/audio/types";
import { colors, fonts, radii, spacing } from "@/design/theme";

interface SourceControlProps {
  source: SourceSnapshot;
  onGainChange: (gain: number) => void;
  onToggleMuted: () => void;
}

function formatGain(gain: number): string {
  return `${Math.round(gain * 100)}%`;
}

function sourceState(source: SourceSnapshot): string {
  if (source.error) {
    return source.error;
  }
  if (source.loadingState !== "ready") {
    return source.loadingState;
  }
  if (source.fadeState !== "idle") {
    return source.fadeState === "fadingIn" ? "fading in" : "fading out";
  }
  return source.kind;
}

export function SourceControl({
  source,
  onGainChange,
  onToggleMuted,
}: SourceControlProps) {
  const unavailable = source.loadingState !== "ready";
  return (
    <View style={styles.row}>
      <Pressable
        accessibilityLabel={`${source.label}, ${source.muted ? "muted" : "active"}`}
        accessibilityRole="button"
        accessibilityState={{ disabled: unavailable, selected: source.muted }}
        disabled={unavailable}
        onPress={onToggleMuted}
        testID={`source-${source.id}-mute`}
        style={({ pressed }) => [
          styles.mute,
          source.muted && styles.muted,
          pressed && styles.pressed,
        ]}
      >
        <Text style={styles.muteGlyph}>{source.muted ? "×" : "≈"}</Text>
      </Pressable>
      <View style={styles.meta}>
        <Text style={styles.label}>{source.label}</Text>
        <Text style={styles.state}>{sourceState(source)}</Text>
      </View>
      <View style={styles.stepper}>
        <Pressable
          accessibilityLabel={`Lower ${source.label}`}
          accessibilityRole="button"
          disabled={unavailable || source.gain <= 0}
          onPress={() => onGainChange(Math.max(0, source.gain - 0.05))}
          testID={`source-${source.id}-lower`}
          style={({ pressed }) => [
            styles.stepButton,
            pressed && styles.pressed,
          ]}
        >
          <Text style={styles.stepText}>−</Text>
        </Pressable>
        <Text
          accessibilityLabel={`${source.label} level ${formatGain(source.gain)}`}
          style={styles.value}
          testID={`source-${source.id}-level`}
        >
          {formatGain(source.gain)}
        </Text>
        <Pressable
          accessibilityLabel={`Raise ${source.label}`}
          accessibilityRole="button"
          disabled={unavailable || source.gain >= 1}
          onPress={() => onGainChange(Math.min(1, source.gain + 0.05))}
          testID={`source-${source.id}-raise`}
          style={({ pressed }) => [
            styles.stepButton,
            pressed && styles.pressed,
          ]}
        >
          <Text style={styles.stepText}>+</Text>
        </Pressable>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  row: {
    minHeight: 70,
    flexDirection: "row",
    alignItems: "center",
    borderBottomWidth: StyleSheet.hairlineWidth,
    borderBottomColor: colors.surfaceLine,
    paddingVertical: spacing.sm,
  },
  mute: {
    width: 42,
    height: 42,
    borderRadius: 21,
    alignItems: "center",
    justifyContent: "center",
    backgroundColor: colors.surfaceRaised,
    borderWidth: 1,
    borderColor: colors.surfaceLine,
  },
  muted: {
    backgroundColor: "rgba(215, 146, 131, 0.16)",
    borderColor: colors.danger,
  },
  muteGlyph: { color: colors.text, fontSize: 19, fontFamily: fonts.serif },
  meta: { flex: 1, marginHorizontal: spacing.md },
  label: {
    color: colors.text,
    fontFamily: fonts.sans,
    fontSize: 14,
    fontWeight: "600",
  },
  state: {
    color: colors.textFaint,
    fontFamily: fonts.sans,
    fontSize: 10,
    marginTop: 3,
    textTransform: "uppercase",
    letterSpacing: 0.8,
  },
  stepper: {
    flexDirection: "row",
    alignItems: "center",
    borderRadius: radii.pill,
    backgroundColor: colors.backgroundSoft,
  },
  stepButton: {
    width: 36,
    height: 42,
    alignItems: "center",
    justifyContent: "center",
  },
  stepText: { color: colors.moon, fontSize: 19, fontFamily: fonts.sans },
  value: {
    width: 38,
    textAlign: "center",
    color: colors.textMuted,
    fontSize: 10,
  },
  pressed: { opacity: 0.5 },
});
