import { Pressable, StyleSheet, Text, View } from "react-native";
import { editorial } from "@/design/editorialTheme";
import { fonts, spacing } from "@/design/theme";
import { radioKeyboard } from "./radioKeyboard";

interface ConsumerDurationOptionsProps {
  disabled: boolean;
  onSelect: (minutes: number) => void;
  options: readonly number[];
  selectedMinutes: number;
}

export function ConsumerDurationOptions({
  disabled,
  onSelect,
  options,
  selectedMinutes,
}: ConsumerDurationOptionsProps) {
  return (
    <View
      accessibilityLabel="Session duration"
      accessibilityRole="radiogroup"
      style={styles.durationRow}
    >
      {options.map((minutes) => (
        <Pressable
          {...(!disabled ? radioKeyboard(options, minutes, onSelect) : {})}
          accessibilityLabel={`${minutes} minutes`}
          accessibilityRole="radio"
          aria-checked={selectedMinutes === minutes}
          accessibilityState={{
            disabled,
            checked: selectedMinutes === minutes,
          }}
          disabled={disabled}
          key={minutes}
          onPress={() => onSelect(minutes)}
          style={[
            styles.duration,
            selectedMinutes === minutes && styles.selected,
          ]}
        >
          <Text style={styles.durationText}>{minutes} min</Text>
        </Pressable>
      ))}
    </View>
  );
}

const styles = StyleSheet.create({
  durationRow: {
    flexDirection: "row",
    flexWrap: "wrap",
    gap: 6,
    marginTop: spacing.md,
  },
  duration: {
    alignItems: "center",
    borderColor: editorial.line,
    borderWidth: StyleSheet.hairlineWidth,
    justifyContent: "center",
    minHeight: 48,
    minWidth: 48,
    paddingHorizontal: 8,
  },
  selected: { backgroundColor: "#DDE5E0", borderColor: editorial.jade },
  durationText: {
    color: editorial.ink,
    fontFamily: fonts.sansMedium,
    fontSize: 14,
  },
});
