import { createHash } from "node:crypto";
import { Buffer } from "node:buffer";
import { mkdirSync, writeFileSync } from "node:fs";
import { dirname, join } from "node:path";
import { fileURLToPath } from "node:url";

const projectRoot = dirname(dirname(fileURLToPath(import.meta.url)));
const outputDirectory = join(projectRoot, "assets", "audio", "placeholders");
const sampleRate = 48_000;
const durationSeconds = 8;
const frameCount = sampleRate * durationSeconds;

function xorshift32(seed) {
  let state = seed >>> 0;
  return () => {
    state ^= state << 13;
    state ^= state >>> 17;
    state ^= state << 5;
    return (state >>> 0) / 0x1_0000_0000;
  };
}

function periodicTime(frame) {
  return frame / sampleRate;
}

function drone(frame, channel) {
  const time = periodicTime(frame);
  const side = channel === 0 ? -1 : 1;
  const slowMotion =
    0.82 + 0.18 * Math.sin(2 * Math.PI * 0.25 * time + side * 0.25);
  return (
    slowMotion *
    (0.19 * Math.sin(2 * Math.PI * 54 * time + side * 0.08) +
      0.1 * Math.sin(2 * Math.PI * 81 * time + side * 0.16) +
      0.06 * Math.sin(2 * Math.PI * 108 * time + side * 0.24))
  );
}

function createAmbience(seed) {
  const random = xorshift32(seed);
  const components = Array.from({ length: 28 }, (_, index) => ({
    frequency: (32 + Math.floor(random() * 440)) / durationSeconds,
    amplitude: 0.022 / Math.sqrt(index + 1),
    phase: random() * Math.PI * 2,
    width: 0.2 + random() * 0.8,
  }));
  return (frame, channel) => {
    const time = periodicTime(frame);
    const side = channel === 0 ? -1 : 1;
    let sample = 0;
    for (const component of components) {
      sample +=
        component.amplitude *
        Math.sin(
          2 * Math.PI * component.frequency * time +
            component.phase +
            side * component.width,
        );
    }
    return sample + 0.018 * Math.sin(2 * Math.PI * 2.5 * time + side * 0.5);
  };
}

function texture(frame, channel) {
  const time = periodicTime(frame);
  const side = channel === 0 ? -1 : 1;
  const pulse = Math.pow(0.5 - 0.5 * Math.cos(2 * Math.PI * 0.5 * time), 8);
  const shimmer =
    0.1 * Math.sin(2 * Math.PI * 216 * time + side * 0.4) +
    0.06 * Math.sin(2 * Math.PI * 324 * time + side * 0.8) +
    0.03 * Math.sin(2 * Math.PI * 486 * time + side * 1.2);
  return pulse * shimmer;
}

function renderWav(sampleAt) {
  const channelCount = 2;
  const bytesPerSample = 2;
  const dataSize = frameCount * channelCount * bytesPerSample;
  const wav = Buffer.alloc(44 + dataSize);
  wav.write("RIFF", 0);
  wav.writeUInt32LE(36 + dataSize, 4);
  wav.write("WAVE", 8);
  wav.write("fmt ", 12);
  wav.writeUInt32LE(16, 16);
  wav.writeUInt16LE(1, 20);
  wav.writeUInt16LE(channelCount, 22);
  wav.writeUInt32LE(sampleRate, 24);
  wav.writeUInt32LE(sampleRate * channelCount * bytesPerSample, 28);
  wav.writeUInt16LE(channelCount * bytesPerSample, 32);
  wav.writeUInt16LE(bytesPerSample * 8, 34);
  wav.write("data", 36);
  wav.writeUInt32LE(dataSize, 40);

  let offset = 44;
  for (let frame = 0; frame < frameCount; frame += 1) {
    for (let channel = 0; channel < channelCount; channel += 1) {
      const sample = Math.max(-1, Math.min(1, sampleAt(frame, channel)));
      wav.writeInt16LE(Math.round(sample * 32_767), offset);
      offset += bytesPerSample;
    }
  }
  return wav;
}

const definitions = [
  {
    id: "sleep-drone-placeholder",
    role: "drone",
    filename: "sleep-drone-placeholder.wav",
    seed: null,
    algorithm: "periodic harmonic drone",
    render: drone,
  },
  {
    id: "sleep-ambience-placeholder",
    role: "ambience",
    filename: "sleep-ambience-placeholder.wav",
    seed: 0x432001,
    algorithm: "seeded periodic sine field",
    render: createAmbience(0x432001),
  },
  {
    id: "sleep-texture-placeholder",
    role: "texture",
    filename: "sleep-texture-placeholder.wav",
    seed: null,
    algorithm: "periodic pulsed harmonic texture",
    render: texture,
  },
];

mkdirSync(outputDirectory, { recursive: true });
const assets = definitions.map((definition) => {
  const wav = renderWav(definition.render);
  writeFileSync(join(outputDirectory, definition.filename), wav);
  return {
    id: definition.id,
    role: definition.role,
    filename: definition.filename,
    placeholder: true,
    generator: {
      script: "scripts/generate-placeholder-audio.mjs",
      version: 1,
      algorithm: definition.algorithm,
      seed: definition.seed,
    },
    format: {
      container: "WAV",
      codec: "PCM",
      bitDepth: 16,
      sampleRate,
      channels: 2,
      durationSeconds,
      loop: true,
    },
    provenance:
      "Generated locally from mathematical functions; no third-party audio used.",
    usage: "Technical placeholder only; not an approved creative master.",
    sha256: createHash("sha256").update(wav).digest("hex"),
  };
});

const manifest = {
  schemaVersion: 1,
  placeholderPack: "LOCAL_PLACEHOLDER_PACK_01",
  deterministic: true,
  assets,
};
writeFileSync(
  join(outputDirectory, "manifest.json"),
  `${JSON.stringify(manifest, null, 2)}\n`,
);
console.log(`Generated ${assets.length} deterministic placeholder WAV files.`);
