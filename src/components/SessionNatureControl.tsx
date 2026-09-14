import { useEffect, useRef } from "react";
import { Pressable, StyleSheet, Text, View } from "react-native";
import type {
  NatureAmbienceFamily,
  NatureMixLevel,
} from "@/domain/sessions/types";
import { editorial } from "@/design/editorialTheme";
import { fonts, spacing } from "@/design/theme";

const FAMILIES = [
  { label: "Ocean waves", value: "sea" },
  { label: "Rain", value: "rain" },
] as const satisfies readonly {
  label: string;
  value: NatureAmbienceFamily;
}[];

export function SessionNatureControl({
  family,
  familyDisabled,
  hideFamilyChoice = false,
  level,
  onFamilyChange,
  onLevelChange,
  title,
  volumeDisabled,
}: {
  family: NatureAmbienceFamily;
  familyDisabled: boolean;
  hideFamilyChoice?: boolean;
  level: NatureMixLevel;
  onFamilyChange: (family: NatureAmbienceFamily) => void;
  onLevelChange: (level: NatureMixLevel) => void;
  title: string;
  volumeDisabled: boolean;
}) {
  const volumePercent = Math.round(level * 100);
  const lastAudibleLevel = useRef(level > 0 ? level : 0.5);
  useEffect(() => {
    if (level > 0) lastAudibleLevel.current = level;
  }, [level]);
  const changeVolume = (delta: number) =>
    onLevelChange(Number(Math.min(1, Math.max(0, level + delta)).toFixed(1)));

  return (
    <View style={styles.root} testID="session-nature-control">
      <Text style={styles.label}>NATURAL AMBIENCE</Text>
      <Text accessibilityLiveRegion="polite" style={styles.title}>
        {title}
      </Text>
      {!hideFamilyChoice && (
        <View
          accessibilityLabel="Natural ambience sound"
          accessibilityRole="radiogroup"
          style={styles.row}
        >
          {FAMILIES.map((item) => {
            const selected = item.value === family;
            return (
              <Pressable
                accessibilityLabel={item.label}
                accessibilityRole="radio"
                aria-checked={selected}
                accessibilityState={{
                  disabled: familyDisabled,
                  checked: selected,
                }}
                disabled={familyDisabled}
                key={item.label}
                onPress={() => onFamilyChange(item.value)}
                style={[
                  styles.option,
                  selected && styles.optionSelected,
                  familyDisabled && styles.disabled,
                ]}
                testID={`nature-family-${item.value}`}
              >
                <Text
                  style={[styles.optionText, selected && styles.selectedText]}
                >
                  {item.label}
                </Text>
              </Pressable>
            );
          })}
        </View>
      )}

      <Text style={styles.volumeLabel}>AMBIENCE VOLUME · {volumePercent}%</Text>
      <View
        accessibilityLabel={`Natural ambience volume ${volumePercent} percent`}
        style={styles.volumeRow}
      >
        <VolumeButton
          disabled={volumeDisabled || level <= 0}
          label="Lower natural ambience volume"
          onPress={() => changeVolume(-0.1)}
          text="−"
        />
        <Pressable
          accessibilityLabel={
            level === 0 ? "Unmute natural ambience" : "Mute natural ambience"
          }
          accessibilityRole="button"
          accessibilityState={{ disabled: volumeDisabled }}
          disabled={volumeDisabled}
          onPress={() =>
            onLevelChange(level === 0 ? lastAudibleLevel.current : 0)
          }
          style={[styles.muteButton, volumeDisabled && styles.disabled]}
          testID="nature-volume-mute"
        >
          <Text style={styles.optionText}>
            {level === 0 ? "Unmute" : "Mute"}
          </Text>
        </Pressable>
        <VolumeButton
          disabled={volumeDisabled || level >= 1}
          label="Raise natural ambience volume"
          onPress={() => changeVolume(0.1)}
          text="+"
        />
      </View>
    </View>
  );
}

function VolumeButton({
  disabled,
  label,
  onPress,
  text,
}: {
  disabled: boolean;
  label: string;
  onPress: () => void;
  text: string;
}) {
  return (
    <Pressable
      accessibilityLabel={label}
      accessibilityRole="button"
      accessibilityState={{ disabled }}
      disabled={disabled}
      onPress={onPress}
      style={[styles.volumeButton, disabled && styles.disabled]}
    >
      <Text style={styles.volumeGlyph}>{text}</Text>
    </Pressable>
  );
}

const styles = StyleSheet.create({
  root: {
    borderLeftColor: editorial.mineralBlue,
    borderLeftWidth: 2,
    marginTop: spacing.lg,
    paddingLeft: spacing.md,
  },
  label: {
    color: editorial.inkFaint,
    fontFamily: fonts.sansSemiBold,
    fontSize: 10,
    letterSpacing: 0.9,
  },
  title: {
    color: editorial.ink,
    fontFamily: fonts.serifItalic,
    fontSize: 18,
    marginTop: 3,
  },
  row: { flexDirection: "row", gap: spacing.sm, marginTop: spacing.sm },
  option: {
    alignItems: "center",
    borderColor: editorial.lineStrong,
    borderWidth: StyleSheet.hairlineWidth,
    flex: 1,
    justifyContent: "center",
    minHeight: 48,
  },
  optionSelected: { backgroundColor: editorial.ink },
  optionText: {
    color: editorial.ink,
    fontFamily: fonts.sansSemiBold,
    fontSize: 13,
  },
  selectedText: { color: editorial.paperLight },
  volumeLabel: {
    color: editorial.inkMuted,
    fontFamily: fonts.sansSemiBold,
    fontSize: 11,
    letterSpacing: 0.8,
    marginTop: spacing.md,
  },
  volumeRow: { flexDirection: "row", gap: spacing.sm, marginTop: spacing.sm },
  volumeButton: {
    alignItems: "center",
    borderColor: editorial.lineStrong,
    borderWidth: StyleSheet.hairlineWidth,
    height: 48,
    justifyContent: "center",
    width: 52,
  },
  volumeGlyph: {
    color: editorial.ink,
    fontFamily: fonts.sansMedium,
    fontSize: 24,
  },
  muteButton: {
    alignItems: "center",
    borderColor: editorial.lineStrong,
    borderWidth: StyleSheet.hairlineWidth,
    flex: 1,
    justifyContent: "center",
    minHeight: 48,
  },
  disabled: { opacity: 0.45 },
});
