import { type Href, useRouter } from "expo-router";
import { Pressable, StyleSheet, Text, View } from "react-native";
import { AmbientScreen } from "@/components/AmbientScreen";
import { TopBar } from "@/components/TopBar";
import { colors, fonts, radii, spacing } from "@/design/theme";

export default function AudioTestScreen() {
  const router = useRouter();
  return (
    <AmbientScreen washColors={["#C4AFD3", "#8FAFC6"]}>
      <TopBar label="AUDIO TEST" showBack />
      <View style={styles.badge}>
        <Text style={styles.badgeText}>TEST ONLY</Text>
      </View>
      <Text accessibilityRole="header" style={styles.title}>
        Engine room.
      </Text>
      <Text style={styles.intro}>
        Moon Current and the three ATP01 WAV files exist only to validate the
        audio engine. They are not part of the consumer catalogue.
      </Text>

      <View style={styles.card}>
        <TestRow label="Test material" value="3 authorised WAV stems" />
        <TestRow label="Generated layers" value="Stereo tones + low noise" />
        <TestRow label="Timers" value="15 / 30 / 60 minutes" />
        <TestRow
          label="Controls"
          value="Play, pause, stop, volume, mute"
          last
        />
      </View>

      <Pressable
        accessibilityHint="Open the technical Moon Current audio player"
        accessibilityRole="button"
        onPress={() => router.push("/session/deep-sleep-432" as Href)}
        style={({ pressed }) => [styles.openButton, pressed && styles.pressed]}
        testID="open-audio-test-player"
      >
        <Text style={styles.openButtonText}>Open audio test</Text>
      </Pressable>
      <Text style={styles.note}>
        Technical playback may be used for engine verification only.
      </Text>
    </AmbientScreen>
  );
}

function TestRow({
  label,
  value,
  last = false,
}: {
  label: string;
  value: string;
  last?: boolean;
}) {
  return (
    <View style={[styles.row, last && styles.lastRow]}>
      <Text style={styles.rowLabel}>{label}</Text>
      <Text style={styles.rowValue}>{value}</Text>
    </View>
  );
}

const styles = StyleSheet.create({
  badge: {
    minHeight: 32,
    alignSelf: "flex-start",
    justifyContent: "center",
    paddingHorizontal: spacing.md,
    borderRadius: radii.pill,
    backgroundColor: "rgba(196, 175, 211, 0.16)",
    borderWidth: 1,
    borderColor: "rgba(196, 175, 211, 0.52)",
  },
  badgeText: {
    color: "#DAC9E6",
    fontFamily: fonts.sansSemiBold,
    fontSize: 9,
    letterSpacing: 1.4,
  },
  title: {
    color: colors.text,
    fontFamily: fonts.serif,
    fontSize: 46,
    lineHeight: 48,
    marginTop: spacing.lg,
  },
  intro: {
    color: colors.textMuted,
    fontFamily: fonts.sans,
    fontSize: 15,
    lineHeight: 23,
    marginTop: spacing.md,
  },
  card: {
    marginTop: spacing.xl,
    paddingHorizontal: spacing.md,
    borderRadius: radii.lg,
    backgroundColor: colors.surface,
    borderWidth: 1,
    borderColor: colors.surfaceLine,
  },
  row: {
    minHeight: 70,
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    gap: spacing.md,
    borderBottomWidth: StyleSheet.hairlineWidth,
    borderBottomColor: colors.surfaceLine,
  },
  lastRow: { borderBottomWidth: 0 },
  rowLabel: {
    color: colors.text,
    fontFamily: fonts.sansSemiBold,
    fontSize: 12,
  },
  rowValue: {
    flex: 1,
    color: colors.textMuted,
    fontFamily: fonts.sans,
    fontSize: 11,
    lineHeight: 17,
    textAlign: "right",
  },
  openButton: {
    minHeight: 56,
    alignItems: "center",
    justifyContent: "center",
    marginTop: spacing.lg,
    paddingHorizontal: spacing.lg,
    borderRadius: radii.pill,
    backgroundColor: colors.text,
  },
  openButtonText: {
    color: colors.background,
    fontFamily: fonts.sansSemiBold,
    fontSize: 14,
  },
  note: {
    color: colors.textFaint,
    fontFamily: fonts.sans,
    fontSize: 10,
    lineHeight: 16,
    marginTop: spacing.md,
    textAlign: "center",
  },
  pressed: { opacity: 0.6 },
});
