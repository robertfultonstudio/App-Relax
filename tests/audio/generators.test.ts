import { getBinauralFrequencies } from "@/audio/generators/binaural";
import { createBrownNoiseSamples } from "@/audio/generators/brownNoise";

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
});
