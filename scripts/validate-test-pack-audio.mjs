import { createHash } from "node:crypto";
import { readFileSync, readdirSync } from "node:fs";
import { dirname, join } from "node:path";
import { fileURLToPath } from "node:url";

const projectRoot = dirname(dirname(fileURLToPath(import.meta.url)));
const assetDirectory = join(projectRoot, "assets", "audio", "test-pack-01");
const manifestPath = join(assetDirectory, "manifest.json");
const expectedFiles = [
  "SLEEP_AMBIENCE_001.wav",
  "SLEEP_DRONE_001.wav",
  "SLEEP_TEXTURE_001.wav",
];
const expectedRoles = new Set(["drone", "ambience", "texture"]);

function fail(message) {
  throw new Error(`AUDIO TEST PACK 01 validation failed: ${message}`);
}

function assert(condition, message) {
  if (!condition) {
    fail(message);
  }
}

function dbfs(value) {
  return 20 * Math.log10(Math.max(Math.abs(value), 1e-15));
}

function assertClose(actual, expected, tolerance, label) {
  assert(
    Math.abs(actual - expected) <= tolerance,
    `${label}: expected ${expected}, received ${actual}`,
  );
}

function readInt24LE(buffer, offset) {
  const unsigned =
    buffer[offset] | (buffer[offset + 1] << 8) | (buffer[offset + 2] << 16);
  return unsigned & 0x800000 ? unsigned - 0x1000000 : unsigned;
}

function parseWav(buffer, filename) {
  assert(buffer.toString("ascii", 0, 4) === "RIFF", `${filename} is not RIFF`);
  assert(buffer.toString("ascii", 8, 12) === "WAVE", `${filename} is not WAVE`);

  let format = null;
  let dataOffset = null;
  let dataSize = null;
  let offset = 12;

  while (offset + 8 <= buffer.length) {
    const chunkId = buffer.toString("ascii", offset, offset + 4);
    const chunkSize = buffer.readUInt32LE(offset + 4);
    const contentsOffset = offset + 8;
    assert(
      contentsOffset + chunkSize <= buffer.length,
      `${filename} contains a truncated ${chunkId} chunk`,
    );

    if (chunkId === "fmt ") {
      assert(chunkSize >= 16, `${filename} has a short fmt chunk`);
      format = {
        codec: buffer.readUInt16LE(contentsOffset),
        channels: buffer.readUInt16LE(contentsOffset + 2),
        sampleRate: buffer.readUInt32LE(contentsOffset + 4),
        blockAlign: buffer.readUInt16LE(contentsOffset + 12),
        bitDepth: buffer.readUInt16LE(contentsOffset + 14),
      };
    } else if (chunkId === "data") {
      dataOffset = contentsOffset;
      dataSize = chunkSize;
    }

    offset = contentsOffset + chunkSize + (chunkSize % 2);
  }

  assert(format, `${filename} is missing its fmt chunk`);
  assert(
    dataOffset !== null && dataSize !== null,
    `${filename} is missing data`,
  );
  return { ...format, dataOffset, dataSize };
}

function validateAsset(asset) {
  assert(
    expectedFiles.includes(asset.filename),
    `unexpected ${asset.filename}`,
  );
  assert(
    expectedRoles.has(asset.role),
    `${asset.filename} has an invalid role`,
  );
  assert(
    asset.format?.container === "WAV",
    `${asset.filename} container mismatch`,
  );
  assert(asset.format?.codec === "PCM", `${asset.filename} codec mismatch`);
  assert(
    asset.loop?.automaticResult === "pass",
    `${asset.filename} loop is not passed`,
  );
  assert(
    asset.loop.boundaryRatioToInternalP999LR.every((value) => value < 1),
    `${asset.filename} loop boundary exceeds internal transient baseline`,
  );
  assert(
    asset.loop.slopeResidualRatioLR.every((value) => value < 1),
    `${asset.filename} loop slope exceeds internal transient baseline`,
  );

  const wav = readFileSync(join(assetDirectory, asset.filename));
  const parsed = parseWav(wav, asset.filename);
  assert(parsed.codec === 1, `${asset.filename} must use integer PCM`);
  assert(parsed.channels === 2, `${asset.filename} must be stereo`);
  assert(parsed.sampleRate === 48_000, `${asset.filename} must be 48 kHz`);
  assert(parsed.bitDepth === 24, `${asset.filename} must be 24 bit`);
  assert(
    parsed.blockAlign === 6,
    `${asset.filename} block alignment is invalid`,
  );
  assert(
    parsed.dataSize % parsed.blockAlign === 0,
    `${asset.filename} has partial frames`,
  );

  const frames = parsed.dataSize / parsed.blockAlign;
  assert(
    frames === 8_640_000,
    `${asset.filename} must contain 8,640,000 frames`,
  );
  assert(
    asset.format.frames === frames,
    `${asset.filename} manifest frame mismatch`,
  );
  assert(
    asset.format.durationSeconds === 180,
    `${asset.filename} duration mismatch`,
  );
  assert(
    asset.format.loopStartFrame === 0,
    `${asset.filename} loop must start at zero`,
  );
  assert(
    asset.format.loopEndFrameExclusive === frames,
    `${asset.filename} loop must end at the final frame`,
  );

  const peak = [0, 0];
  const sums = [0, 0];
  const squareSums = [0, 0];
  const first = [0, 0];
  const last = [0, 0];
  let clippedSamples = 0;

  for (let frame = 0; frame < frames; frame += 1) {
    const frameOffset = parsed.dataOffset + frame * parsed.blockAlign;
    for (let channel = 0; channel < 2; channel += 1) {
      const sample = readInt24LE(wav, frameOffset + channel * 3);
      const normalized = sample / 8_388_608;
      const absolute = Math.abs(normalized);
      if (frame === 0) first[channel] = normalized;
      if (frame === frames - 1) last[channel] = normalized;
      peak[channel] = Math.max(peak[channel], absolute);
      sums[channel] += normalized;
      squareSums[channel] += normalized * normalized;
      if (sample === -8_388_608 || sample === 8_388_607) {
        clippedSamples += 1;
      }
    }
  }

  const peakDbfs = peak.map(dbfs);
  const rmsDbfs = squareSums.map((sum) => dbfs(Math.sqrt(sum / frames)));
  const dcDbfs = sums.map((sum) => dbfs(sum / frames));
  const boundaryStep = first.map((value, channel) =>
    Math.abs(value - last[channel]),
  );

  assert(clippedSamples === 0, `${asset.filename} reaches full scale`);
  assert(
    asset.metrics.clippedSamples === 0,
    `${asset.filename} manifest reports clipping`,
  );
  for (let channel = 0; channel < 2; channel += 1) {
    assertClose(
      peakDbfs[channel],
      asset.metrics.peakDbfsLR[channel],
      0.002,
      `${asset.filename} peak channel ${channel}`,
    );
    assertClose(
      rmsDbfs[channel],
      asset.metrics.rmsDbfsLR[channel],
      0.002,
      `${asset.filename} RMS channel ${channel}`,
    );
    assertClose(
      dcDbfs[channel],
      asset.metrics.dcDbfsLR[channel],
      0.05,
      `${asset.filename} DC channel ${channel}`,
    );
    assertClose(
      boundaryStep[channel],
      asset.loop.boundaryStepLR[channel],
      1 / 8_388_608,
      `${asset.filename} boundary channel ${channel}`,
    );
  }

  const sha256 = createHash("sha256").update(wav).digest("hex");
  assert(sha256 === asset.sha256, `${asset.filename} hash mismatch`);
}

const manifest = JSON.parse(readFileSync(manifestPath, "utf8"));
assert(manifest.schemaVersion === 1, "unexpected manifest schema");
assert(manifest.packId === "AUDIO_TEST_PACK_01", "unexpected pack identity");
assert(manifest.presetId === "deep-sleep-432", "unexpected preset identity");
assert(
  manifest.placeholder === false,
  "test pack cannot be marked placeholder",
);
assert(
  manifest.automaticValidation === "pass",
  "automatic validation is not passed",
);
assert(
  manifest.listeningApproval === "pending",
  "listening status must remain pending",
);
assert(
  manifest.deviceValidation === "pending",
  "device status must remain pending",
);
assert(
  Array.isArray(manifest.assets) && manifest.assets.length === 3,
  "expected three assets",
);

const actualWavs = readdirSync(assetDirectory)
  .filter((name) => name.endsWith(".wav"))
  .sort();
assert(
  JSON.stringify(actualWavs) === JSON.stringify(expectedFiles),
  `expected exactly ${expectedFiles.join(", ")}`,
);

for (const asset of manifest.assets) {
  validateAsset(asset);
}

console.log(
  "AUDIO TEST PACK 01: PASS (3 canonical PCM24 WAV files, exact duration, metrics, loop evidence, manifest and hashes valid; listening/device approval pending).",
);
