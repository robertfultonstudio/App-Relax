import { getBinauralFrequencies } from "@/audio/generators/binaural";
import { createBrownNoiseSamples } from "@/audio/generators/brownNoise";
import {
  createColoredNoiseSamples,
  createSeededRandom,
  NOISE_COLOR_DEFINITIONS,
} from "@/audio/generators/coloredNoise";
import type { NoiseColorId } from "@/domain/audio/consumerTypes";

function seededRandom(seed: number): () => number {
  let state = seed >>> 0;
  return () => {
    state ^= state << 13;
    state ^= state >>> 17;
    state ^= state << 5;
    return (state >>> 0) / 0x1_0000_0000;
  };
}

describe("generated audio sources", () => {
  it("centres the configured beat around the independent carrier", () => {
    const result = getBinauralFrequencies(180, 3.5);
    expect(result).toEqual({
      leftHz: 178.25,
      rightHz: 181.75,
      carrierHz: 180,
      beatHz: 3.5,
    });
    expect(result.rightHz - result.leftHz).toBe(3.5);
  });

  it("produces deterministic, centred and bounded brown noise", () => {
    const first = createBrownNoiseSamples({
      length: 4096,
      random: seededRandom(432),
    });
    const second = createBrownNoiseSamples({
      length: 4096,
      random: seededRandom(432),
    });
    expect(Array.from(first)).toEqual(Array.from(second));

    const mean = first.reduce((sum, value) => sum + value, 0) / first.length;
    const peak = first.reduce(
      (maximum, value) => Math.max(maximum, Math.abs(value)),
      0,
    );
    expect(Math.abs(mean)).toBeLessThan(1e-6);
    expect(peak).toBeLessThanOrEqual(0.720001);
    expect(peak).toBeGreaterThan(0.7);
  });

  it("rejects invalid generator inputs", () => {
    expect(() => createBrownNoiseSamples({ length: 0 })).toThrow(
      "positive integer",
    );
    expect(() => getBinauralFrequencies(180, 180)).toThrow("below the carrier");
  });

  it("provides the complete supported noise-colour palette and aliases", () => {
    expect(Object.keys(NOISE_COLOR_DEFINITIONS)).toEqual([
      "white",
      "pink",
      "brown",
      "blue",
      "violet",
      "grey",
      "green",
      "black",
    ]);
    expect(NOISE_COLOR_DEFINITIONS.brown.aliases).toContain("red");
    expect(NOISE_COLOR_DEFINITIONS.violet.aliases).toContain("purple");
    expect(NOISE_COLOR_DEFINITIONS.grey.spectralDefinition).toContain(
      "Non-standard",
    );
    expect(NOISE_COLOR_DEFINITIONS.green.spectralDefinition).toContain(
      "Non-standard",
    );
    expect(NOISE_COLOR_DEFINITIONS.black.spectralDefinition).toContain(
      "Non-standard",
    );
  });

  it.each(Object.keys(NOISE_COLOR_DEFINITIONS) as NoiseColorId[])(
    "generates deterministic, centred, bounded and loop-safe %s noise",
    (color) => {
      const first = createColoredNoiseSamples({
        color,
        length: 16384,
        random: createSeededRandom(20260902),
      });
      const second = createColoredNoiseSamples({
        color,
        length: 16384,
        random: createSeededRandom(20260902),
      });
      expect(Array.from(first)).toEqual(Array.from(second));
      const mean = first.reduce((sum, value) => sum + value, 0) / first.length;
      const peak = first.reduce(
        (maximum, value) => Math.max(maximum, Math.abs(value)),
        0,
      );
      expect(Math.abs(mean)).toBeLessThan(0.0001);
      expect(peak).toBeLessThanOrEqual(0.500001);
      expect(peak).toBeGreaterThan(0.49);
      expect(first.at(-1)).toBe(first[0]);
    },
  );

  it("orders the five standard spectral profiles from dark to bright", () => {
    const roughness = (color: NoiseColorId) => {
      const samples = createColoredNoiseSamples({
        color,
        length: 65536,
        random: createSeededRandom(432),
      });
      let differencePower = 0;
      let signalPower = 0;
      for (let index = 1; index < samples.length; index += 1) {
        differencePower += (samples[index] - samples[index - 1]) ** 2;
        signalPower += samples[index] ** 2;
      }
      return differencePower / signalPower;
    };
    const values = ["brown", "pink", "white", "blue", "violet"].map((color) =>
      roughness(color as NoiseColorId),
    );
    expect(values).toEqual([...values].sort((left, right) => left - right));
  });

  it("rejects invalid coloured-noise inputs", () => {
    expect(() =>
      createColoredNoiseSamples({ color: "white", length: 0 }),
    ).toThrow("positive integer");
    expect(() =>
      createColoredNoiseSamples({
        color: "white",
        length: 100,
        sampleRate: 1000,
      }),
    ).toThrow("at least 8000 Hz");
  });
});
