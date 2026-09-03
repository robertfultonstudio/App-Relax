import { Pressable, StyleSheet, Text, View } from "react-native";
import type { SessionDurationMinutes } from "@/domain/sessions/types";
import { editorial } from "@/design/editorialTheme";
import { fonts, spacing } from "@/design/theme";

export function SessionDurationPicker({
  options,
  selected,
  onChange,
}: {
  options: readonly SessionDurationMinutes[];
  selected: SessionDurationMinutes;
  onChange: (duration: SessionDurationMinutes) => void;
}) {
  return (
    <View
      accessibilityLabel="Choose session duration"
      accessibilityRole="radiogroup"
      style={styles.row}
    >
      {options.map((minutes) => (
        <Pressable
          accessibilityLabel={`${minutes} minutes`}
          accessibilityRole="radio"
          accessibilityState={{ selected: minutes === selected }}
          key={minutes}
          onPress={() => onChange(minutes)}
          style={[styles.option, minutes === selected && styles.optionSelected]}
          testID={`duration-${minutes}`}
        >
          <Text
            style={[
              styles.minutes,
              minutes === selected && styles.minutesSelected,
            ]}
          >
            {minutes}
          </Text>
          <Text style={styles.unit}>MIN</Text>
        </Pressable>
      ))}
    </View>
  );
}

const styles = StyleSheet.create({
  row: {
    flexDirection: "row",
    flexWrap: "wrap",
    gap: spacing.sm,
    marginTop: spacing.md,
  },
  option: {
    alignItems: "center",
    backgroundColor: "rgba(248, 242, 232, 0.72)",
    borderColor: editorial.line,
    borderWidth: StyleSheet.hairlineWidth,
    justifyContent: "center",
    minHeight: 56,
    minWidth: 58,
    paddingHorizontal: spacing.sm,
  },
  optionSelected: {
    backgroundColor: "#DCE5DD",
    borderColor: editorial.jade,
    borderWidth: 1,
  },
  minutes: {
    color: editorial.inkMuted,
    fontFamily: fonts.serif,
    fontSize: 21,
    lineHeight: 23,
  },
  minutesSelected: { color: editorial.ink },
  unit: {
    color: editorial.inkFaint,
    fontFamily: fonts.sansSemiBold,
    fontSize: 10,
    letterSpacing: 0.8,
  },
});
