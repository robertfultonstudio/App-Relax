// Builds metadata only. Approved audio and masters remain read-only.
import assert from "node:assert/strict";
import { Buffer } from "node:buffer";
import { createHash } from "node:crypto";
import {
  createReadStream,
  readFileSync,
  mkdirSync,
  writeFileSync,
} from "node:fs";
import { resolve, join } from "node:path";

const reports = resolve(
  process.argv[2] ?? "dist/flac-window-spike/full-catalog",
);
const destination = resolve("public-pwa/flac-index");
const manifest = JSON.parse(
  readFileSync("docs/M4_LOCAL_LISTENING_MANIFEST.json", "utf8"),
);
const assets = manifest.files.filter(({ filename }) =>
  filename.endsWith(".flac"),
);
assert.equal(assets.length, 24, "Revalidate a changed FLAC catalogue");
const musicRoot = resolve(process.argv[3] ?? "");
assert(
  process.argv[3],
  "An explicit external music derivative directory is required",
);
assert(
  !musicRoot.startsWith(process.cwd() + "/"),
  "Music stays outside the repository",
);
const music = JSON.parse(
  readFileSync("docs/SESSION_REVIEW_5_LOSSLESS_REPORT.json", "utf8"),
).files;
assert.equal(music.length, 21);
for (const file of music) {
  assert.equal(file.pcmIdentity, true);
  assets.push({
    filename: file.filename,
    bytes: file.flacBytes,
    sha256: file.sha256,
    sourceFilename: file.sourceFilename,
    sourceWavSha256: file.sourceSha256,
    frameCount: file.frames,
  });
}
mkdirSync(destination, { recursive: true });
const registry = [];
for (const asset of assets) {
  const report = JSON.parse(
    readFileSync(join(reports, asset.filename + ".report.json"), "utf8"),
  );
  const index = JSON.parse(
    readFileSync(join(reports, asset.filename + ".index.json"), "utf8"),
  );
  assert.equal(report.flacSha256, asset.sha256);
  assert.equal(report.fullDecodePcmIdentity, true);
  assert.equal(index.file, asset.filename);
  assert.equal(index.bytes, asset.bytes);
  assert.equal(index.totalFrames, report.totalFrames);
  if (asset.frameCount) assert.equal(index.totalFrames, asset.frameCount);
  assert.equal(index.sampleRate, 48000);
  assert.equal(index.channels, 2);
  assert.equal(index.bitDepth, 24);
  let sample = 0,
    byte = report.dataOffset;
  assert(
    byte >= 42 &&
      byte <= 65536 &&
      index.entries.length > 0 &&
      index.entries.length < 100000,
  );
  for (const e of index.entries) {
    assert(Array.isArray(e) && e.length === 4 && e.every(Number.isSafeInteger));
    assert.equal(e[0], sample);
    assert.equal(e[1], byte);
    assert(e[2] > 0 && e[2] <= 524280 && e[3] > 0 && e[3] <= 65535);
    sample += e[3];
    byte += e[2];
  }
  assert.equal(sample, index.totalFrames);
  assert.equal(byte, asset.bytes);
  const hash = createHash("sha256");
  for await (const chunk of createReadStream(
    join(
      asset.sourceFilename ? musicRoot : "public/audio-catalog",
      asset.filename,
    ),
  ))
    hash.update(chunk);
  assert.equal(
    hash.digest("hex"),
    asset.sha256,
    "Audio changed since the approved decoder report",
  );
  const payload = JSON.stringify(index) + "\n";
  const indexSha256 = createHash("sha256").update(payload).digest("hex");
  writeFileSync(join(destination, indexSha256 + ".json"), payload);
  registry.push({
    filename: asset.filename,
    sourceSha256: asset.sha256,
    bytes: asset.bytes,
    totalFrames: index.totalFrames,
    indexSha256,
    indexBytes: Buffer.byteLength(payload),
    ...(asset.sourceFilename
      ? {
          sourceFilename: asset.sourceFilename,
          sourceWavSha256: asset.sourceWavSha256,
          onDemand: true,
        }
      : {}),
  });
}
writeFileSync(
  "src/pwa-review/flacIndexManifest.json",
  JSON.stringify({ version: 1, files: registry }, null, 2) + "\n",
);
console.log(
  JSON.stringify({
    files: registry.length,
    indexBytes: registry.reduce((n, f) => n + f.indexBytes, 0),
    audioCopied: 0,
    scope:
      "45 approved lossless indexes; metadata only, no audio copied or uploaded",
  }),
);
