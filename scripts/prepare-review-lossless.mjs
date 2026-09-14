import assert from "node:assert/strict";
import { Buffer } from "node:buffer";
import { createHash } from "node:crypto";
import { spawnSync } from "node:child_process";
import {
  createReadStream,
  readFileSync,
  statSync,
  writeFileSync,
  existsSync,
  openSync,
  readSync,
  closeSync,
} from "node:fs";
import { resolve, join } from "node:path";

// Read-only source; explicit existing external destination; never overwrite audio.
const root = process.cwd();
const destination = resolve(process.argv[2] ?? "");
const ffmpeg = process.argv[3];
assert(ffmpeg && destination !== root && !destination.startsWith(root + "/"));
assert(statSync(destination).isDirectory());
const hatha = JSON.parse(
  readFileSync("src/content/hathaAudioFiles.json", "utf8"),
);
const catalog = JSON.parse(
  readFileSync("docs/M4_LOCAL_LISTENING_MANIFEST.json", "utf8"),
);
const files = [
  ...hatha.files,
  ...catalog.files.filter((f) => f.filename.endsWith(".wav")),
];
async function hash(file, start, end) {
  const digest = createHash("sha256");
  for await (const part of createReadStream(file, { start, end }))
    digest.update(part);
  return digest.digest("hex");
}
function wav(file) {
  const fd = openSync(file, "r");
  try {
    const header = Buffer.alloc(12);
    readSync(fd, header, 0, 12, 0);
    assert.equal(header.toString("ascii", 0, 4), "RIFF");
    assert.equal(header.toString("ascii", 8, 12), "WAVE");
    let data, format;
    for (let p = 12; p + 8 <= statSync(file).size;) {
      const ch = Buffer.alloc(8);
      readSync(fd, ch, 0, 8, p);
      const size = ch.readUInt32LE(4);
      if (ch.toString("ascii", 0, 4) === "fmt ") {
        assert(size >= 16 && size <= 40);
        format = Buffer.alloc(size);
        readSync(fd, format, 0, size, p + 8);
      }
      if (ch.toString("ascii", 0, 4) === "data") data = { offset: p + 8, size };
      p += 8 + size + (size % 2);
    }
    assert(data && data.size % 6 === 0);
    assert(format && [1, 65534].includes(format.readUInt16LE(0)));
    assert.equal(format.readUInt16LE(2), 2);
    assert.equal(format.readUInt32LE(4), 48000);
    assert.equal(format.readUInt16LE(12), 6);
    assert.equal(format.readUInt16LE(14), 24);
    if (format.readUInt16LE(0) === 65534) {
      assert.equal(format.length, 40);
      assert.equal(format.readUInt16LE(18), 24);
      assert.equal(
        format.subarray(24).toString("hex"),
        "0100000000001000800000aa00389b71",
      );
    }
    assert(data.offset + data.size <= statSync(file).size);
    const n = Math.min(4800 * 6, data.size);
    const head = Buffer.alloc(n),
      tail = Buffer.alloc(n);
    readSync(fd, head, 0, n, data.offset);
    readSync(fd, tail, 0, n, data.offset + data.size - n);
    const rms = (b) =>
      Math.sqrt(
        Array.from(
          { length: b.length / 3 },
          (_, i) => (b.readIntLE(i * 3, 3) / 8388608) ** 2,
        ).reduce((s, v) => s + v, 0) /
          (b.length / 3),
      );
    const step = Math.max(
      ...[0, 3].map(
        (c) =>
          Math.abs(head.readIntLE(c, 3) - tail.readIntLE(n - 6 + c, 3)) /
          8388608,
      ),
    );
    return {
      ...data,
      frames: data.size / 6,
      boundaryStepDbfs: 20 * Math.log10(step || 1e-12),
      headRmsDbfs: 20 * Math.log10(rms(head) || 1e-12),
      tailRmsDbfs: 20 * Math.log10(rms(tail) || 1e-12),
    };
  } finally {
    closeSync(fd);
  }
}
function run(args) {
  const r = spawnSync(
    ffmpeg,
    ["-nostdin", "-hide_banner", "-loglevel", "error", ...args],
    { encoding: "utf8", timeout: 600000, maxBuffer: 1024 * 1024 },
  );
  assert.equal(r.status, 0, r.stderr || r.error?.message);
  return r.stdout.trim();
}
const results = [];
for (const file of files) {
  const source = join(root, "public/audio-catalog", file.filename);
  assert.equal(await hash(source), file.sha256, "Source hash mismatch");
  const info = wav(source),
    filename = file.filename.replace(/\.wav$/, ".flac"),
    target = join(destination, filename);
  if (!existsSync(target))
    run([
      "-n",
      "-i",
      source,
      "-map",
      "0:a:0",
      "-map_metadata",
      "-1",
      "-c:a",
      "flac",
      "-compression_level",
      "8",
      "-sample_fmt",
      "s32",
      "-bits_per_raw_sample",
      "24",
      "-threads",
      "1",
      target,
    ]);
  const pcmHash = await hash(source, info.offset, info.offset + info.size - 1);
  const decoded = run([
    "-i",
    target,
    "-map",
    "0:a:0",
    "-c:a",
    "pcm_s24le",
    "-f",
    "hash",
    "-hash",
    "sha256",
    "-",
  ]);
  assert.equal(decoded, "SHA256=" + pcmHash, "Lossless PCM identity failed");
  const row = {
    sourceFilename: file.filename,
    filename,
    sourceSha256: file.sha256,
    sha256: await hash(target),
    pcmSha256: pcmHash,
    wavBytes: file.bytes,
    flacBytes: statSync(target).size,
    ...info,
    pcmIdentity: true,
  };
  results.push(row);
  writeFileSync(
    join(destination, "manifest.json"),
    JSON.stringify(
      {
        status: "LOCAL DERIVATIVES — NOT PUBLISHED OR PHONE VALIDATED",
        format: "FLAC PCM24 stereo 48kHz level8",
        files: results,
      },
      null,
      2,
    ) + "\n",
  );
  console.log(
    `${results.length}/${files.length} ${filename}: ${row.wavBytes} -> ${row.flacBytes} bytes; PCM identical; seam ${info.boundaryStepDbfs.toFixed(1)} dBFS`,
  );
}
console.log(
  JSON.stringify(
    {
      files: results.length,
      wavBytes: results.reduce((s, f) => s + f.wavBytes, 0),
      flacBytes: results.reduce((s, f) => s + f.flacBytes, 0),
    },
    null,
    2,
  ),
);
