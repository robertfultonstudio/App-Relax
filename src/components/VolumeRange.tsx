import { useState } from "react";
import { View, type GestureResponderEvent } from "react-native";
import { editorial } from "@/design/editorialTheme";

export interface VolumeRangeProps {
  label: string;
  value: number;
  disabled?: boolean;
  onChange: (value: number) => void;
}
/** Native control; UI events only. Audio remains behind the session controller. */
export function VolumeRange({
  label,
  value,
  disabled = false,
  onChange,
}: VolumeRangeProps) {
  const [width, setWidth] = useState(0);
  const change = (event: GestureResponderEvent) => {
    if (!disabled && width > 0)
      onChange(Math.max(0, Math.min(1, event.nativeEvent.locationX / width)));
  };
  return (
    <View
      accessible
      accessibilityRole="adjustable"
      accessibilityLabel={label}
      accessibilityState={{ disabled }}
      accessibilityValue={{ min: 0, max: 100, now: Math.round(value * 100) }}
      accessibilityActions={[{ name: "increment" }, { name: "decrement" }]}
      onAccessibilityAction={(event) => {
        if (
          !disabled &&
          ["increment", "decrement"].includes(event.nativeEvent.actionName)
        )
          onChange(
            Math.max(
              0,
              Math.min(
                1,
                value +
                  (event.nativeEvent.actionName === "increment" ? 0.05 : -0.05),
              ),
            ),
          );
      }}
      onLayout={(event) => setWidth(event.nativeEvent.layout.width)}
      onStartShouldSetResponder={() => !disabled}
      onMoveShouldSetResponder={() => !disabled}
      onResponderGrant={change}
      onResponderMove={change}
      style={{
        flexBasis: 0,
        flexGrow: 1,
        flexShrink: 0,
        height: 48,
        minHeight: 48,
        justifyContent: "center",
        opacity: disabled ? 0.45 : 1,
      }}
    >
      <View
        pointerEvents="none"
        style={{ height: 4, backgroundColor: "#D5CEDB", borderRadius: 2 }}
      >
        <View
          style={{
            width: `${value * 100}%`,
            height: 4,
            backgroundColor: editorial.lavender,
            borderRadius: 2,
          }}
        />
        <View
          style={{
            position: "absolute",
            left: `${value * 100}%`,
            marginLeft: -7,
            top: -5,
            width: 14,
            height: 14,
            borderRadius: 7,
            backgroundColor: editorial.lavender,
          }}
        />
      </View>
    </View>
  );
}
