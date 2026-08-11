import { CATEGORIES } from "@/domain/catalog";
import { validatePreset } from "@/domain/audio/presetValidation";
import { AUDIO_SOURCE_IDS } from "@/domain/audio/types";
import { DEEP_SLEEP_432 } from "@/presets/deepSleep432";
import { PRESETS } from "@/presets/presetRegistry";

describe("Deep Sleep 432 preset contract", () => {
  it("keeps one preset and four honest product categories", () => {
    expect(PRESETS).toHaveLength(1);
    expect(CATEGORIES.map((category) => category.id)).toEqual([
      "sleep",
      "calm",
      "focus",
      "meditate",
    ]);
  });

  it("contains three stem layers plus both generated sources", () => {
    expect(DEEP_SLEEP_432.stems.map((stem) => stem.id)).toEqual([
      "drone",
      "ambience",
      "texture",
    ]);
    expect(Object.keys(DEEP_SLEEP_432.defaultMix).sort()).toEqual(
      [...AUDIO_SOURCE_IDS].sort(),
    );
    expect(DEEP_SLEEP_432.stems.map((stem) => stem.assetKey)).toEqual([
      "sleepDrone001",
      "sleepAmbience001",
      "sleepTexture001",
    ]);
    expect(
      new Set(DEEP_SLEEP_432.stems.map((stem) => stem.assetKey)).size,
    ).toBe(3);
    expect(validatePreset(DEEP_SLEEP_432)).toEqual({ valid: true, errors: [] });
  });

  it("does not derive the binaural beat from the 432 Hz label", () => {
    expect(DEEP_SLEEP_432.tuningLabel).toBe("432 Hz");
    expect(DEEP_SLEEP_432.carrierHz).toBe(180);
    expect(DEEP_SLEEP_432.beatHz).toBe(3.5);
  });

  it("rejects a preset missing a required stem", () => {
    const invalid = {
      ...DEEP_SLEEP_432,
      stems: DEEP_SLEEP_432.stems.filter((stem) => stem.id !== "texture"),
    };
    expect(validatePreset(invalid).errors).toContain(
      "Missing required stem: texture.",
    );
  });
});
