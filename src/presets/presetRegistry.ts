import type { AudioPreset, Goal } from "@/domain/audio/types";
import { DEEP_SLEEP_432 } from "./deepSleep432";

export const PRESETS: readonly AudioPreset[] = [DEEP_SLEEP_432];

export function getPreset(presetId: string): AudioPreset | undefined {
  return PRESETS.find((preset) => preset.id === presetId);
}

export function getPresetsForGoal(goal: Goal): readonly AudioPreset[] {
  return PRESETS.filter((preset) => preset.goal === goal);
}
