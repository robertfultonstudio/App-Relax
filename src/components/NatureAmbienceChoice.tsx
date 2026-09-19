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
  variant = "default",
  disabledMessage = "Stop to change the ambience. Its volume and mute stay available while listening.",
}: {
  value: NatureAmbienceFamily | null;
  onChange: (family: NatureAmbienceFamily | null) => void;
  disabled?: boolean;
  offDisabled?: boolean;
  changing?: boolean;
  onCancel?: () => void;
  variant?: "default" | "atmospheric";
  disabledMessage?: string;
}) {
  return (
    <View
      style={{
        gap: variant === "atmospheric" ? 0 : 8,
        marginVertical: variant === "atmospheric" ? 0 : 16,
      }}
    >
      {variant === "default" ? (
        <Text
          style={{
            fontFamily: fonts.sans,
            color: editorial.inkMuted,
            fontSize: 15,
          }}
        >
          Natural ambience · optional
        </Text>
      ) : null}
      <View
        accessibilityRole="radiogroup"
        accessibilityLabel="Natural ambience"
        style={{ flexDirection: "row", gap: 8 }}
      >
        {(
          [
            {
              value: null,
              label: variant === "atmospheric" ? "Nessuno" : "Off",
            },
            {
              value: "rain",
              label: variant === "atmospheric" ? "Pioggia" : "Rain",
            },
            {
              value: "sea",
              label:
                variant === "atmospheric" ? "Onde oceaniche" : "Ocean waves",
            },
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
            accessibilityLabel={`${variant === "atmospheric" ? "Ambiente" : "Ambience"} ${option.label}`}
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
              borderColor:
                variant === "atmospheric" ? editorial.ink : editorial.lavender,
              backgroundColor: pressed
                ? variant === "atmospheric"
                  ? "rgba(32,56,77,0.06)"
                  : "#DAD7E2"
                : "transparent",
              opacity:
                disabled || changing || (offDisabled && option.value === null)
                  ? 0.6
                  : 1,
            })}
          >
            <Text
              style={{
                fontFamily:
                  variant === "atmospheric" && value === option.value
                    ? fonts.sansSemiBold
                    : fonts.sans,
                fontSize: variant === "atmospheric" ? 16 : 15,
                textAlign: "center",
                color: editorial.ink,
              }}
            >
              {option.label}
            </Text>
          </Pressable>
        ))}
      </View>
      {changing && variant === "default" && (
        <Text
          accessibilityLiveRegion="polite"
          style={{ color: editorial.inkMuted, fontSize: 14 }}
        >
          Preparing ambience… Music keeps playing. You can cancel this change;
          Stop ends playback.
        </Text>
      )}
      {changing && onCancel && variant === "default" && (
        <Pressable
          accessibilityRole="button"
          accessibilityLabel="Cancel ambience change"
          onPress={onCancel}
          style={{ minHeight: 44, justifyContent: "center" }}
        >
          <Text style={{ color: editorial.ink }}>Cancel ambience change</Text>
        </Pressable>
      )}
      {disabled && variant === "default" && (
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
