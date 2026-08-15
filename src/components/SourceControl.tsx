import { Pressable, StyleSheet, Text, View } from "react-native";
import type { SourceSnapshot } from "@/domain/audio/types";
import { colors, fonts, radii, spacing } from "@/design/theme";

interface SourceControlProps {
  source: SourceSnapshot;
  displayLabel?: string;
  onGainChange: (gain: number) => void;
  onToggleMuted: () => void;
}

function formatGain(gain: number): string {
  return `${Math.round(gain * 100)}%`;
}

function sourceState(source: SourceSnapshot): string {
  if (source.error) {
    return "needs attention";
  }
  if (source.loadingState === "idle") {
    return "waiting";
  }
  if (source.loadingState === "loading") {
    return "preparing";
  }
  if (source.loadingState === "error") {
    return "needs attention";
  }
  if (source.fadeState !== "idle") {
    return source.fadeState === "fadingIn" ? "fading in" : "fading out";
  }
  return source.muted ? "muted" : "ready";
}

export function SourceControl({
  source,
  displayLabel,
  onGainChange,
  onToggleMuted,
}: SourceControlProps) {
  const unavailable = source.loadingState !== "ready";
  const label = displayLabel ?? source.label;
  return (
    <View style={styles.row}>
      <Pressable
        accessibilityLabel={`${label}, ${source.muted ? "muted" : "active"}`}
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
        <Text style={styles.muteText}>{source.muted ? "Muted" : "Mute"}</Text>
      </Pressable>
      <View style={styles.meta}>
        <Text style={styles.label}>{label}</Text>
        <Text style={styles.state}>{sourceState(source)}</Text>
      </View>
      <View style={styles.stepper}>
        <Pressable
          accessibilityLabel={`Lower ${label}`}
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
          accessibilityLabel={`${label} level ${formatGain(source.gain)}`}
          style={styles.value}
          testID={`source-${source.id}-level`}
        >
          {formatGain(source.gain)}
        </Text>
        <Pressable
          accessibilityLabel={`Raise ${label}`}
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
    minWidth: 68,
    height: 44,
    borderRadius: radii.pill,
    alignItems: "center",
    justifyContent: "center",
    paddingHorizontal: spacing.sm,
    backgroundColor: colors.surfaceRaised,
    borderWidth: 1,
    borderColor: colors.surfaceLine,
  },
  muted: {
    backgroundColor: "rgba(215, 146, 131, 0.16)",
    borderColor: colors.danger,
  },
  muteText: {
    color: colors.text,
    fontSize: 10,
    fontFamily: fonts.sansSemiBold,
  },
  meta: { flex: 1, marginHorizontal: spacing.md },
  label: {
    color: colors.text,
    fontFamily: fonts.sans,
    fontSize: 14,
    fontWeight: "600",
  },
  state: {
    color: colors.textMuted,
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
    width: 44,
    height: 44,
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
