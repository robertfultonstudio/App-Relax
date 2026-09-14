import assert from "node:assert/strict";
import { Buffer } from "node:buffer";
import { createHash } from "node:crypto";
import {
  constants,
  createReadStream,
  existsSync,
  lstatSync,
  openSync,
  closeSync,
  readSync,
  readFileSync,
  readdirSync,
  copyFileSync,
  mkdirSync,
  writeFileSync,
} from "node:fs";
import { resolve, join } from "node:path";
import { spawnSync } from "node:child_process";
import { fileURLToPath } from "node:url";

const manifest = JSON.parse(
  readFileSync(new URL("../src/content/hathaAudioFiles.json", import.meta.url)),
);
const root = fileURLToPath(new URL("..", import.meta.url));
const directory = resolve(
  process.argv[2] || join(root, "public/audio-catalog"),
);
const install = process.argv.includes("--install-local");
const ffmpegIndex = process.argv.indexOf("--ffmpeg");
const ffmpeg = ffmpegIndex < 0 ? null : process.argv[ffmpegIndex + 1];
const destination = join(root, "public/audio-catalog");

async function sha(path, start, end) {
  const hash = createHash("sha256");
  for await (const chunk of createReadStream(path, { start, end }))
    hash.update(chunk);
  return hash.digest("hex");
}

function inspectWav(path) {
  const info = lstatSync(path);
  assert(info.isFile() && !info.isSymbolicLink(), "WAV must be a regular file");
  const fd = openSync(path, "r");
  try {
    const header = Buffer.alloc(12);
    readSync(fd, header, 0, 12, 0);
    assert.equal(header.toString("ascii", 0, 4), "RIFF");
    assert.equal(header.toString("ascii", 8, 12), "WAVE");
    assert.equal(header.readUInt32LE(4) + 8, info.size);
    let fmt, data;
    for (let offset = 12; offset + 8 <= info.size;) {
      const chunk = Buffer.alloc(8);
      readSync(fd, chunk, 0, 8, offset);
      const id = chunk.toString("ascii", 0, 4),
        size = chunk.readUInt32LE(4);
      assert(offset + 8 + size <= info.size, "truncated RIFF chunk");
      if (id === "fmt ") {
        assert(size >= 16 && size <= 40, "unexpected PCM format");
        fmt = Buffer.alloc(size);
        readSync(fd, fmt, 0, size, offset + 8);
      }
      if (id === "data") {
        assert(!data, "multiple PCM data chunks");
        data = { offset: offset + 8, size };
      }
      offset += 8 + size + (size % 2);
    }
    assert(fmt && data);
    const format = fmt.readUInt16LE(0);
    assert(
      format === 1 ||
        (format === 65534 &&
          fmt.length === 40 &&
          fmt.subarray(24).toString("hex") ===
            "0100000000001000800000aa00389b71"),
    );
    assert.equal(fmt.readUInt16LE(2), 2);
    assert.equal(fmt.readUInt32LE(4), 48000);
    assert.equal(fmt.readUInt32LE(8), 288000);
    assert.equal(fmt.readUInt16LE(12), 6);
    assert.equal(fmt.readUInt16LE(14), 24);
    assert.equal(data.size % 6, 0);
    const first = Buffer.alloc(6),
      last = Buffer.alloc(6);
    readSync(fd, first, 0, 6, data.offset);
    readSync(fd, last, 0, 6, data.offset + data.size - 6);
    const boundaryStep = Math.max(
      ...[0, 3].map(
        (i) => Math.abs(first.readIntLE(i, 3) - last.readIntLE(i, 3)) / 8388608,
      ),
    );
    return {
      bytes: info.size,
      format,
      sampleRateHz: 48000,
      channels: 2,
      bitDepth: 24,
      frameCount: data.size / 6,
      durationSeconds: data.size / 288000,
      data,
      boundaryStepDbfs: boundaryStep ? 20 * Math.log10(boundaryStep) : null,
    };
  } finally {
    closeSync(fd);
  }
}

assert.equal(manifest.files.length, 8);
assert.deepEqual(
  manifest.files.map((x) => x.structuralOrder),
  [1, 2, 3, 4, 5, 6, 7, 8],
);
assert.equal(new Set(manifest.files.map((x) => x.id)).size, 8);
assert.equal(new Set(manifest.files.map((x) => x.filename)).size, 8);
assert.equal(
  manifest.files[7].sha256,
  "47cfdaa456cad4e959b0bed2c0b9404094b055c11757f85d00d41685d60ef61a",
);
const expectedNames = manifest.files.map((x) => x.filename).sort();
const actualNames = readdirSync(directory)
  .filter((x) => /^0[1-8]_.*_LOOP_48K24\.wav$/.test(x))
  .sort();
assert.deepEqual(actualNames, expectedNames);
const results = [];
for (const item of manifest.files) {
  assert(/^[A-Za-z][A-Za-z ]+$/.test(item.displayTitle));
  assert(/^[0-9]{2}_[a-z_]+_LOOP_48K24\.wav$/.test(item.filename));
  const path = join(directory, item.filename),
    wav = inspectWav(path);
  for (const key of ["bytes", "durationSeconds", "frameCount"])
    assert.equal(wav[key], item[key], `${item.id}: ${key}`);
  const hash = await sha(path);
  assert.equal(
    hash,
    item.sha256,
    `${item.id}: source hash mismatch; no replacement allowed`,
  );
  const pcmSha256 = await sha(
    path,
    wav.data.offset,
    wav.data.offset + wav.data.size - 1,
  );
  let meter = null;
  if (ffmpeg) {
    const run = spawnSync(
      ffmpeg,
      [
        "-hide_banner",
        "-nostdin",
        "-threads",
        "1",
        "-filter_threads",
        "1",
        "-i",
        path,
        "-af",
        "ebur128=peak=true",
        "-f",
        "null",
        "-",
      ],
      { encoding: "utf8", maxBuffer: 16 * 1024 * 1024 },
    );
    assert.equal(run.status, 0, run.error?.message || run.stderr.slice(-500));
    const summary = run.stderr.slice(run.stderr.lastIndexOf("Summary:"));
    meter = {
      measuredLufs: Number(summary.match(/I:\s+(-?[\d.]+) LUFS/)?.[1]),
      truePeakDbtp: Number(summary.match(/Peak:\s+(-?[\d.]+) dBFS/)?.[1]),
    };
    assert.equal(meter.measuredLufs, item.measuredLufs);
    assert.equal(meter.truePeakDbtp, item.truePeakDbtp);
    assert(meter.truePeakDbtp < -1, "true peak ceiling");
  }
  const target = join(destination, item.filename);
  if (install && existsSync(target))
    assert.equal(
      await sha(target),
      item.sha256,
      "Refusing to overwrite existing different audio",
    );
  results.push({
    id: item.id,
    filename: item.filename,
    ...wav,
    sha256: hash,
    pcmSha256,
    meter,
  });
  console.log(
    `PASS ${item.id}: PCM24 stereo 48k, ${wav.durationSeconds}s, SHA-256 verified`,
  );
}
// Two-phase installation: all sources and any existing destinations validated first.
if (install)
  for (const item of manifest.files) {
    const target = join(destination, item.filename);
    if (!existsSync(target))
      copyFileSync(
        join(directory, item.filename),
        target,
        constants.COPYFILE_EXCL,
      );
    assert.equal(await sha(target), item.sha256);
    assert.equal(
      await sha(join(directory, item.filename)),
      item.sha256,
      "Source changed during copy",
    );
  }
mkdirSync(join(root, "dist/hatha-integration"), { recursive: true });
writeFileSync(
  join(root, "dist/hatha-integration/audio-verification.json"),
  JSON.stringify(
    {
      status: "PASS",
      generatedAt: new Date().toISOString(),
      listeningApproved: false,
      totalBytes: results.reduce((n, x) => n + x.bytes, 0),
      installedLocally: install,
      results,
    },
    null,
    2,
  ) + "\n",
);
console.log(
  `Hatha audio: PASS (${results.length}/8; ${results.reduce((n, x) => n + x.bytes, 0)} bytes; no listening approval).`,
);
