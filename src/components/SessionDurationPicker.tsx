import { Pressable, StyleSheet, Text, View } from "react-native";
import type { SessionDurationMinutes } from "@/domain/sessions/types";
import { editorial } from "@/design/editorialTheme";
import { fonts, spacing } from "@/design/theme";
import { radioKeyboard } from "./radioKeyboard";

export function SessionDurationPicker({
  options,
  selected,
  onChange,
  disabled = false,
}: {
  options: readonly SessionDurationMinutes[];
  selected: SessionDurationMinutes;
  onChange: (duration: SessionDurationMinutes) => void;
  disabled?: boolean;
}) {
  return (
    <View
      accessibilityLabel="Choose session duration"
      accessibilityRole="radiogroup"
      style={styles.row}
    >
      {options.map((minutes) => (
        <Pressable
          {...(disabled ? {} : radioKeyboard(options, minutes, onChange))}
          accessibilityLabel={`${minutes} minutes`}
          accessibilityRole="radio"
          aria-checked={minutes === selected}
          accessibilityState={{ checked: minutes === selected, disabled }}
          disabled={disabled}
          key={minutes}
          onPress={() => onChange(minutes)}
          style={[
            styles.option,
            minutes === selected && styles.optionSelected,
            disabled && { opacity: 0.5 },
          ]}
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
    gap: 6,
    marginTop: spacing.md,
  },
  option: {
    alignItems: "center",
    backgroundColor: "transparent",
    borderColor: editorial.line,
    borderBottomWidth: StyleSheet.hairlineWidth,
    justifyContent: "center",
    minHeight: 56,
    minWidth: 48,
    paddingHorizontal: spacing.sm,
  },
  optionSelected: {
    backgroundColor: "#E9E2EF",
    borderColor: editorial.lavender,
    borderBottomWidth: 2,
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
    fontSize: 12,
    letterSpacing: 0.8,
  },
});
