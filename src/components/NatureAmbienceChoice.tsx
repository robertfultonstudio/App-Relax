import { Pressable, Text, View } from "react-native";
import type { NatureAmbienceFamily } from "@/domain/sessions/types";
import { editorial } from "@/design/editorialTheme";
import { fonts } from "@/design/theme";
import { radioKeyboard } from "./radioKeyboard";

export function NatureAmbienceChoice({
  value,
  onChange,
  disabled = false,
  offDisabled = false,
  changing = false,
  onCancel,
  disabledMessage = "Stop to change the ambience. Its volume and mute stay available while listening.",
}: {
  value: NatureAmbienceFamily | null;
  onChange: (family: NatureAmbienceFamily | null) => void;
  disabled?: boolean;
  offDisabled?: boolean;
  changing?: boolean;
  onCancel?: () => void;
  disabledMessage?: string;
}) {
  return (
    <View style={{ gap: 8, marginVertical: 16 }}>
      <Text
        style={{
          fontFamily: fonts.sans,
          color: editorial.inkMuted,
          fontSize: 15,
        }}
      >
        Natural ambience · optional
      </Text>
      <View
        accessibilityRole="radiogroup"
        accessibilityLabel="Natural ambience"
        style={{ flexDirection: "row", gap: 8 }}
      >
        {(
          [
            { value: null, label: "Off" },
            { value: "rain", label: "Rain" },
            { value: "sea", label: "Ocean waves" },
          ] as const
        ).map((option) => (
          <Pressable
            {...(disabled || changing || (offDisabled && option.value === null)
              ? {}
              : radioKeyboard<NatureAmbienceFamily | null>(
                  offDisabled ? ["rain", "sea"] : [null, "rain", "sea"],
                  option.value,
                  onChange,
                ))}
            key={option.label}
            accessibilityRole="radio"
            accessibilityLabel={`Ambience ${option.label}`}
            accessibilityState={{
              checked: value === option.value,
              disabled:
                disabled || changing || (offDisabled && option.value === null),
            }}
            aria-checked={value === option.value}
            disabled={
              disabled || changing || (offDisabled && option.value === null)
            }
            onPress={() => {
              if (option.value !== value) onChange(option.value);
            }}
            style={({ pressed }) => ({
              flex: 1,
              minHeight: 48,
              paddingHorizontal: 6,
              justifyContent: "center",
              alignItems: "center",
              borderBottomWidth: value === option.value ? 2 : 0,
              borderColor: editorial.lavender,
              backgroundColor: pressed ? "#DAD7E2" : "transparent",
              opacity:
                disabled || changing || (offDisabled && option.value === null)
                  ? 0.6
                  : 1,
            })}
          >
            <Text
              style={{
                fontFamily: fonts.sans,
                fontSize: 15,
                textAlign: "center",
                color: editorial.ink,
              }}
            >
              {option.label}
            </Text>
          </Pressable>
        ))}
      </View>
      {changing && (
        <Text
          accessibilityLiveRegion="polite"
          style={{ color: editorial.inkMuted, fontSize: 14 }}
        >
          Preparing ambience… Music keeps playing. You can cancel this change;
          Stop ends playback.
        </Text>
      )}
      {changing && onCancel && (
        <Pressable
          accessibilityRole="button"
          accessibilityLabel="Cancel ambience change"
          onPress={onCancel}
          style={{ minHeight: 44, justifyContent: "center" }}
        >
          <Text style={{ color: editorial.ink }}>Cancel ambience change</Text>
        </Pressable>
      )}
      {disabled && (
        <Text
          style={{
            fontFamily: fonts.sans,
            color: editorial.inkMuted,
            fontSize: 14,
          }}
        >
          {disabledMessage}
        </Text>
      )}
    </View>
  );
}
