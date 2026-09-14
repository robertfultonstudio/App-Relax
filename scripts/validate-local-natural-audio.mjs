import assert from "node:assert/strict";
import { Buffer } from "node:buffer";
import { createHash } from "node:crypto";
import {
  constants,
  copyFileSync,
  createReadStream,
  existsSync,
  lstatSync,
  openSync,
  readSync,
  closeSync,
  readFileSync,
} from "node:fs";
import { join, resolve, basename } from "node:path";
import { fileURLToPath } from "node:url";

const root = fileURLToPath(new URL("..", import.meta.url));
const manifest = JSON.parse(
  readFileSync(
    new URL("../src/content/localNaturalAudioFiles.json", import.meta.url),
  ),
);
const args = process.argv.slice(2);
assert(
  args.length === 0 || (args.length === 2 && args[0] === "--install-local"),
  "Use --install-local SOURCE.wav or no arguments",
);
assert.equal(manifest.files.length, 2);
assert.deepEqual(manifest.files.map((file) => file.id).sort(), [
  "field-recording-01",
  "night-birds-b1",
]);
assert.equal(new Set(manifest.files.map((file) => file.filename)).size, 2);
assert.equal(manifest.deliveryScope, "local-only");
for (const file of manifest.files) {
  assert.equal(basename(file.filename), file.filename);
  assert.equal(file.primaryOutcome, null);
  assert.equal(file.natureFamily, null);
  assert.equal(file.materialKind, "nature");
  assert.equal(file.playbackGainDb, 0);
  assert(file.truePeakDbtp + file.playbackGainDb < -1);
  assert.equal(file.loopStartFrame, 0);
  assert.equal(file.loopEndFrameExclusive, file.frameCount);
}

async function hash(path, start, end) {
  const digest = createHash("sha256");
  for await (const chunk of createReadStream(path, { start, end }))
    digest.update(chunk);
  return digest.digest("hex");
}
async function verify(path, file) {
  const stat = lstatSync(path);
  assert(stat.isFile() && !stat.isSymbolicLink(), "Regular WAV required");
  assert.equal(stat.size, file.bytes);
  assert.equal(
    await hash(path),
    file.sha256,
    "File SHA differs from Editing delivery",
  );
  const fd = openSync(path, "r");
  let data;
  try {
    const header = Buffer.alloc(65536);
    const count = readSync(fd, header, 0, header.length, 0);
    assert.equal(header.toString("ascii", 0, 4), "RIFF");
    assert.equal(header.toString("ascii", 8, 12), "WAVE");
    assert.equal(header.readUInt32LE(4) + 8, stat.size);
    let fmt;
    for (let offset = 12; offset + 8 <= count;) {
      const size = header.readUInt32LE(offset + 4);
      const id = header.toString("ascii", offset, offset + 4);
      assert(offset + 8 + size <= stat.size, "Truncated RIFF chunk");
      if (id === "fmt ") fmt = header.subarray(offset + 8, offset + 8 + size);
      if (id === "data") {
        data = { offset: offset + 8, size };
        break;
      }
      offset += 8 + size + (size % 2);
    }
    assert(fmt && data, "PCM format/data missing");
    assert.equal(fmt.readUInt16LE(0), 65534);
    assert.equal(fmt.length, 40);
    assert.equal(
      fmt.subarray(24).toString("hex"),
      "0100000000001000800000aa00389b71",
    );
    assert.equal(fmt.readUInt16LE(2), 2);
    assert.equal(fmt.readUInt32LE(4), 48000);
    assert.equal(fmt.readUInt32LE(8), 288000);
    assert.equal(fmt.readUInt16LE(12), 6);
    assert.equal(fmt.readUInt16LE(14), 24);
    assert.equal(fmt.readUInt16LE(18), 24);
    assert.equal(data.size / 6, file.frameCount);
    assert.equal(data.size / 288000, file.durationSeconds);
  } finally {
    closeSync(fd);
  }
  assert.equal(
    await hash(path, data.offset, data.offset + data.size - 1),
    file.pcmSha256,
    "PCM SHA differs from Editing delivery",
  );
}

if (args.length) {
  const source = resolve(args[1]);
  const file = manifest.files.find(
    (item) => item.filename === basename(source),
  );
  assert(file, "Only an explicitly manifested delivered WAV may be installed");
  const destination = join(root, "public/audio-catalog", file.filename);
  assert.notEqual(source, destination);
  await verify(source, file);
  if (!existsSync(destination))
    copyFileSync(source, destination, constants.COPYFILE_EXCL);
  await verify(source, file); // Source remains read-only, including after the copy.
}
for (const file of manifest.files) {
  await verify(join(root, "public/audio-catalog", file.filename), file);
  console.log(
    JSON.stringify({
      result: "PASS",
      id: file.id,
      filename: file.filename,
      bytes: file.bytes,
      pcmSha256: file.pcmSha256,
      frames: file.frameCount,
      seconds: file.durationSeconds,
      delivery: "local-only",
      classification: "unassigned nature",
      humanListening: "NOT VERIFIED",
      sourceAndPcmUnchanged: true,
    }),
  );
}
