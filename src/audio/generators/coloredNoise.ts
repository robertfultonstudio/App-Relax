import type { NoiseColorId } from "@/domain/audio/consumerTypes";

export interface ColoredNoiseOptions {
  color: NoiseColorId;
  length: number;
  sampleRate?: number;
  random?: () => number;
  peak?: number;
}

export const NOISE_COLOR_DEFINITIONS: Readonly<
  Record<
    NoiseColorId,
    { title: string; aliases: readonly string[]; spectralDefinition: string }
  >
> = {
  white: {
    title: "White Noise",
    aliases: [],
    spectralDefinition: "Equal power per hertz",
  },
  pink: {
    title: "Pink Noise",
    aliases: [],
    spectralDefinition: "Approximately -3 dB per octave",
  },
  brown: {
    title: "Brown / Red Noise",
    aliases: ["red"],
    spectralDefinition: "Approximately -6 dB per octave",
  },
  blue: {
    title: "Blue Noise",
    aliases: ["azure"],
    spectralDefinition: "Approximately +3 dB per octave",
  },
  violet: {
    title: "Violet / Purple Noise",
    aliases: ["purple"],
    spectralDefinition: "Approximately +6 dB per octave",
  },
  grey: {
    title: "Grey Noise",
    aliases: ["gray"],
    spectralDefinition: "Non-standard balanced low, mid and high profile",
  },
  green: {
    title: "Green Noise",
    aliases: [],
    spectralDefinition: "Non-standard mid-band nature-style profile",
  },
  black: {
    title: "Black Noise",
    aliases: [],
    spectralDefinition: "Non-standard deep profile with slow quiet intervals",
  },
};

export function createSeededRandom(seed: number): () => number {
  let state = seed >>> 0;
  return () => {
    state ^= state << 13;
    state ^= state >>> 17;
    state ^= state << 5;
    return (state >>> 0) / 0x1_0000_0000;
  };
}

export function createColoredNoiseSamples({
  color,
  length,
  sampleRate = 48000,
  random = Math.random,
  peak = 0.5,
}: ColoredNoiseOptions): Float32Array<ArrayBuffer> {
  if (!Number.isInteger(length) || length <= 0) {
    throw new Error("Noise length must be a positive integer.");
  }
  if (!Number.isFinite(sampleRate) || sampleRate < 8000) {
    throw new Error("Noise sample rate must be at least 8000 Hz.");
  }
  if (peak <= 0 || peak > 1) {
    throw new Error("Noise peak must be within (0, 1].");
  }

  const white = new Float32Array(length);
  for (let index = 0; index < length; index += 1) {
    white[index] = random() * 2 - 1;
  }

  const samples = renderProfile(color, white, sampleRate);
  makeLoopBoundaryContinuous(samples, sampleRate);
  centreAndNormalize(samples, peak);
  return samples;
}

function renderProfile(
  color: NoiseColorId,
  white: Float32Array<ArrayBuffer>,
  sampleRate: number,
): Float32Array<ArrayBuffer> {
  const samples = new Float32Array(white.length);
  if (color === "white") {
    samples.set(white);
    return samples;
  }

  if (color === "pink") {
    let b0 = 0;
    let b1 = 0;
    let b2 = 0;
    let b3 = 0;
    let b4 = 0;
    let b5 = 0;
    let b6 = 0;
    for (let index = 0; index < white.length; index += 1) {
      const value = white[index];
      b0 = 0.99886 * b0 + value * 0.0555179;
      b1 = 0.99332 * b1 + value * 0.0750759;
      b2 = 0.969 * b2 + value * 0.153852;
      b3 = 0.8665 * b3 + value * 0.3104856;
      b4 = 0.55 * b4 + value * 0.5329522;
      b5 = -0.7616 * b5 - value * 0.016898;
      samples[index] = b0 + b1 + b2 + b3 + b4 + b5 + b6 + value * 0.5362;
      b6 = value * 0.115926;
    }
    return samples;
  }

  if (color === "brown") {
    let integrated = 0;
    for (let index = 0; index < white.length; index += 1) {
      integrated = integrated * 0.997 + white[index] * 0.003;
      samples[index] = integrated;
    }
    return samples;
  }

  if (color === "black") {
    let integrated = 0;
    for (let index = 0; index < white.length; index += 1) {
      integrated = integrated * 0.998 + white[index] * 0.002;
      const phase = (2 * Math.PI * index) / white.length;
      const envelope = 0.08 + 0.92 * ((1 + Math.cos(phase)) / 2) ** 3;
      samples[index] = integrated * envelope;
    }
    return samples;
  }

  if (color === "blue" || color === "violet") {
    let previous = 0;
    let previousDifference = 0;
    for (let index = 0; index < white.length; index += 1) {
      const difference = white[index] - previous;
      samples[index] =
        color === "blue" ? difference : difference - previousDifference;
      previous = white[index];
      previousDifference = difference;
    }
    return samples;
  }

  if (color === "green") {
    const lowPassAlpha = 1 - Math.exp((-2 * Math.PI * 2400) / sampleRate);
    const lowCutAlpha = 1 - Math.exp((-2 * Math.PI * 180) / sampleRate);
    let lowPassed = 0;
    let lowBand = 0;
    for (let index = 0; index < white.length; index += 1) {
      lowPassed += lowPassAlpha * (white[index] - lowPassed);
      lowBand += lowCutAlpha * (lowPassed - lowBand);
      samples[index] = lowPassed - lowBand;
    }
    return samples;
  }

  let integrated = 0;
  let previous = 0;
  for (let index = 0; index < white.length; index += 1) {
    integrated = integrated * 0.996 + white[index] * 0.004;
    const high = white[index] - previous;
    samples[index] = white[index] * 0.62 + integrated * 2.2 + high * 0.18;
    previous = white[index];
  }
  return samples;
}

function makeLoopBoundaryContinuous(
  samples: Float32Array<ArrayBuffer>,
  sampleRate: number,
): void {
  if (samples.length < 4) return;
  const crossfadeLength = Math.min(
    Math.floor(sampleRate * 0.05),
    Math.floor(samples.length / 4),
  );
  const start = samples.length - crossfadeLength;
  for (let index = 0; index < crossfadeLength; index += 1) {
    const mix = (index + 1) / crossfadeLength;
    const targetIndex = (index + 1) % crossfadeLength;
    samples[start + index] =
      samples[start + index] * (1 - mix) + samples[targetIndex] * mix;
  }
  samples[samples.length - 1] = samples[0];
}

function centreAndNormalize(
  samples: Float32Array<ArrayBuffer>,
  peak: number,
): void {
  let sum = 0;
  for (const sample of samples) sum += sample;
  const mean = sum / samples.length;
  let maxAbsolute = 0;
  for (let index = 0; index < samples.length; index += 1) {
    samples[index] -= mean;
    maxAbsolute = Math.max(maxAbsolute, Math.abs(samples[index]));
  }
  if (maxAbsolute === 0) return;
  const scale = peak / maxAbsolute;
  for (let index = 0; index < samples.length; index += 1) {
    samples[index] *= scale;
  }
  samples[samples.length - 1] = samples[0];
}
