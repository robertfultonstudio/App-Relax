import { AUDIO_SOURCE_IDS, type AudioPreset } from "./types";

export interface PresetValidationResult {
  valid: boolean;
  errors: string[];
}

export function validatePreset(preset: AudioPreset): PresetValidationResult {
  const errors: string[] = [];
  const stemIds = new Set(preset.stems.map((stem) => stem.id));

  if (preset.schemaVersion !== 1) {
    errors.push("Unsupported preset schema version.");
  }
  if (!preset.id.trim() || !preset.title.trim()) {
    errors.push("Preset id and title are required.");
  }
  if (preset.tuningLabel.trim() === "") {
    errors.push(
      "Tuning label is required and remains independent from synthesis values.",
    );
  }
  if (!Number.isFinite(preset.carrierHz) || preset.carrierHz <= 0) {
    errors.push("Carrier frequency must be a positive finite number.");
  }
  if (!Number.isFinite(preset.beatHz) || preset.beatHz <= 0) {
    errors.push("Beat frequency must be a positive finite number.");
  }
  if (preset.beatHz >= preset.carrierHz) {
    errors.push("Beat frequency must remain below the carrier frequency.");
  }

  for (const requiredStem of ["drone", "ambience", "texture"] as const) {
    if (!stemIds.has(requiredStem)) {
      errors.push(`Missing required stem: ${requiredStem}.`);
    }
  }

  for (const sourceId of AUDIO_SOURCE_IDS) {
    const gain = preset.defaultMix[sourceId];
    if (!Number.isFinite(gain) || gain < 0 || gain > 1) {
      errors.push(`Gain for ${sourceId} must be between 0 and 1.`);
    }
  }

  if (
    preset.durationOptionsMinutes.length === 0 ||
    preset.durationOptionsMinutes.some(
      (minutes) => !Number.isInteger(minutes) || minutes <= 0,
    )
  ) {
    errors.push("Duration options must contain positive whole minutes.");
  }
  if (preset.fadeInSeconds < 0 || preset.fadeOutSeconds < 0) {
    errors.push("Fade durations cannot be negative.");
  }

  return { valid: errors.length === 0, errors };
}

export function assertValidPreset(preset: AudioPreset): void {
  const result = validatePreset(preset);
  if (!result.valid) {
    throw new Error(`Invalid audio preset: ${result.errors.join(" ")}`);
  }
}
