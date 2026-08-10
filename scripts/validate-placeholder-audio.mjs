import { createHash } from "node:crypto";
import { readFileSync, readdirSync } from "node:fs";
import { dirname, join } from "node:path";
import { fileURLToPath } from "node:url";

const projectRoot = dirname(dirname(fileURLToPath(import.meta.url)));
const assetDirectory = join(projectRoot, "assets", "audio", "placeholders");
const manifestPath = join(assetDirectory, "manifest.json");
const expectedFiles = [
  "sleep-ambience-placeholder.wav",
  "sleep-drone-placeholder.wav",
  "sleep-texture-placeholder.wav",
];

function fail(message) {
  throw new Error(`Placeholder validation failed: ${message}`);
}

const manifest = JSON.parse(readFileSync(manifestPath, "utf8"));
if (
  manifest.schemaVersion !== 1 ||
  manifest.placeholderPack !== "LOCAL_PLACEHOLDER_PACK_01"
) {
  fail("unexpected manifest identity");
}
if (manifest.deterministic !== true || !Array.isArray(manifest.assets)) {
  fail("manifest must describe a deterministic asset list");
}

const actualWavs = readdirSync(assetDirectory)
  .filter((name) => name.endsWith(".wav"))
  .sort();
if (JSON.stringify(actualWavs) !== JSON.stringify(expectedFiles)) {
  fail(
    `expected exactly ${expectedFiles.join(", ")}, received ${actualWavs.join(", ")}`,
  );
}
if (manifest.assets.length !== expectedFiles.length) {
  fail("manifest must contain exactly three assets");
}

for (const asset of manifest.assets) {
  if (!expectedFiles.includes(asset.filename) || asset.placeholder !== true) {
    fail(`unexpected or non-placeholder asset ${String(asset.filename)}`);
  }
  if (!asset.provenance?.includes("no third-party audio")) {
    fail(`${asset.filename} is missing provenance`);
  }
  const wav = readFileSync(join(assetDirectory, asset.filename));
  if (
    wav.toString("ascii", 0, 4) !== "RIFF" ||
    wav.toString("ascii", 8, 12) !== "WAVE"
  ) {
    fail(`${asset.filename} is not a RIFF/WAVE file`);
  }
  const channels = wav.readUInt16LE(22);
  const sampleRate = wav.readUInt32LE(24);
  const bitDepth = wav.readUInt16LE(34);
  const dataSize = wav.readUInt32LE(40);
  const durationSeconds = dataSize / (sampleRate * channels * (bitDepth / 8));
  if (
    channels !== 2 ||
    sampleRate !== 48_000 ||
    bitDepth !== 16 ||
    durationSeconds !== 8
  ) {
    fail(`${asset.filename} has an unexpected technical format`);
  }
  let pcmPeak = 0;
  for (let offset = 44; offset < wav.length; offset += 2) {
    pcmPeak = Math.max(pcmPeak, Math.abs(wav.readInt16LE(offset)));
  }
  if (pcmPeak < 100) {
    fail(`${asset.filename} is unexpectedly silent`);
  }
  const bytesPerFrame = channels * (bitDepth / 8);
  for (let channel = 0; channel < channels; channel += 1) {
    const first = wav.readInt16LE(44 + channel * 2);
    const last = wav.readInt16LE(44 + dataSize - bytesPerFrame + channel * 2);
    const boundaryDelta = Math.abs(first - last) / 32_767;
    if (boundaryDelta > 0.04) {
      fail(`${asset.filename} has a discontinuous loop boundary`);
    }
  }
  const sha256 = createHash("sha256").update(wav).digest("hex");
  if (sha256 !== asset.sha256) {
    fail(`${asset.filename} hash does not match its manifest entry`);
  }
}

console.log(
  "Placeholder audio: PASS (3 deterministic PCM WAV files, format, loop boundary, manifest and hashes valid).",
);
