export type RandomSource = () => number;

export interface BrownNoiseOptions {
  length: number;
  random?: RandomSource;
  peak?: number;
  leak?: number;
}

export function createBrownNoiseSamples({
  length,
  random = Math.random,
  peak = 0.72,
  leak = 0.997,
}: BrownNoiseOptions): Float32Array<ArrayBuffer> {
  if (!Number.isInteger(length) || length <= 0) {
    throw new Error("Brown noise length must be a positive integer.");
  }
  if (peak <= 0 || peak > 1) {
    throw new Error("Brown noise peak must be within (0, 1].");
  }
  if (leak <= 0 || leak >= 1) {
    throw new Error("Brown noise leak must be within (0, 1).");
  }

  const samples = new Float32Array(length);
  let integrated = 0;
  let sum = 0;

  for (let index = 0; index < length; index += 1) {
    const white = random() * 2 - 1;
    integrated = integrated * leak + white * (1 - leak);
    samples[index] = integrated;
    sum += integrated;
  }

  const mean = sum / length;
  let maxAbsolute = 0;
  for (let index = 0; index < length; index += 1) {
    samples[index] -= mean;
    maxAbsolute = Math.max(maxAbsolute, Math.abs(samples[index]));
  }

  if (maxAbsolute === 0) {
    return samples;
  }

  const scale = peak / maxAbsolute;
  for (let index = 0; index < length; index += 1) {
    samples[index] *= scale;
  }

  return samples;
}
