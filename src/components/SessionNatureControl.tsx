import { useEffect, useRef } from "react";
import { Pressable, StyleSheet, Text, View } from "react-native";
import type {
  NatureAmbienceFamily,
  NatureMixLevel,
} from "@/domain/sessions/types";
import { editorial } from "@/design/editorialTheme";
import { fonts, spacing } from "@/design/theme";
import { VolumeRange } from "./VolumeRange";

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

  return (
    <View
      style={[styles.root, hideFamilyChoice && styles.compactRoot]}
      testID="session-nature-control"
    >
      {!hideFamilyChoice && (
        <>
          <Text style={styles.label}>NATURAL AMBIENCE</Text>
          <Text accessibilityLiveRegion="polite" style={styles.title}>
            {title}
          </Text>
        </>
      )}
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
        <VolumeRange
          disabled={volumeDisabled}
          label="Natural ambience volume"
          value={level}
          onChange={onLevelChange}
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
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  root: {
    marginTop: spacing.lg,
  },
  compactRoot: { marginTop: 4 },
  label: {
    color: editorial.inkFaint,
    fontFamily: fonts.sansSemiBold,
    fontSize: 14,
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
    borderBottomWidth: StyleSheet.hairlineWidth,
    flex: 1,
    justifyContent: "center",
    minHeight: 48,
  },
  optionSelected: { borderBottomWidth: 2, borderColor: editorial.lavender },
  optionText: {
    color: editorial.ink,
    fontFamily: fonts.sansSemiBold,
    fontSize: 13,
  },
  selectedText: { color: editorial.ink },
  volumeLabel: {
    color: editorial.inkMuted,
    fontFamily: fonts.sansSemiBold,
    fontSize: 14,
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
    borderWidth: 0,
    minWidth: 64,
    justifyContent: "center",
    minHeight: 48,
  },
  disabled: { opacity: 0.45 },
});
