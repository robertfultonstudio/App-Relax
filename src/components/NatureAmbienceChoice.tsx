import { Pressable, Text, View } from "react-native";
import type { NatureAmbienceFamily } from "@/domain/sessions/types";
import { editorial } from "@/design/editorialTheme";
import { fonts } from "@/design/theme";
import { radioKeyboard } from "./radioKeyboard";

export function NatureAmbienceChoice({
  value,
  onChange,
  disabled = false,
  disabledMessage = "Stop to change the ambience. Its volume and mute stay available while listening.",
}: {
  value: NatureAmbienceFamily | null;
  onChange: (family: NatureAmbienceFamily | null) => void;
  disabled?: boolean;
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
            {...(disabled
              ? {}
              : radioKeyboard<NatureAmbienceFamily | null>(
                  [null, "rain", "sea"],
                  option.value,
                  onChange,
                ))}
            key={option.label}
            accessibilityRole="radio"
            accessibilityLabel={`Ambience ${option.label}`}
            accessibilityState={{ checked: value === option.value, disabled }}
            aria-checked={value === option.value}
            disabled={disabled}
            onPress={() => onChange(option.value)}
            style={{
              flex: 1,
              minHeight: 48,
              paddingHorizontal: 6,
              justifyContent: "center",
              alignItems: "center",
              borderWidth: 1,
              borderColor: editorial.inkMuted,
              backgroundColor:
                value === option.value ? editorial.ink : "transparent",
              opacity: disabled ? 0.6 : 1,
            }}
          >
            <Text
              style={{
                fontFamily: fonts.sans,
                fontSize: 15,
                textAlign: "center",
                color:
                  value === option.value ? editorial.paperLight : editorial.ink,
              }}
            >
              {option.label}
            </Text>
          </Pressable>
        ))}
      </View>
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
