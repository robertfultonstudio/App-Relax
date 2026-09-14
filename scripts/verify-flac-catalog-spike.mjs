// Full read-only local catalog gate for the isolated candidate decoder.
import assert from "node:assert/strict";
import { readFileSync, writeFileSync, mkdirSync } from "node:fs";
import { resolve, join } from "node:path";
import { spawn } from "node:child_process";
const [modules, derivatives, destination] = process.argv.slice(2);
assert(modules && derivatives && destination);
const root = process.cwd(),
  output = resolve(destination);
const catalog = JSON.parse(
  readFileSync(join(root, "docs/M4_LOCAL_LISTENING_MANIFEST.json")),
);
const lossless = JSON.parse(
  readFileSync(join(root, "docs/SESSION_REVIEW_5_LOSSLESS_REPORT.json")),
);
const files = [
  ...catalog.files
    .filter((f) => f.filename.endsWith(".flac"))
    .map((f) => ({
      filename: f.filename,
      sha256: f.sha256,
      bytes: f.bytes,
      path: join(root, "public/audio-catalog", f.filename),
    })),
  ...lossless.files.map((f) => ({
    filename: f.filename,
    sha256: f.sha256,
    bytes: f.flacBytes,
    path: join(resolve(derivatives), f.filename),
    wav: join(root, "public/audio-catalog", f.sourceFilename),
  })),
];
assert.equal(files.length, 45);
assert.equal(new Set(files.map((f) => f.filename)).size, 45);
assert(files.every((f) => !/ECLYPSIS|NIRVANA|SLEEP_TEXTURE/i.test(f.filename)));
mkdirSync(output, { recursive: true });
const rows = [];
for (const file of files) {
  await new Promise((resolveRun, reject) => {
    const child = spawn(
      process.execPath,
      [
        join(root, "scripts/verify-flac-window-decoder.mjs"),
        resolve(modules),
        file.path,
        output,
        ...(file.wav ? [file.wav] : []),
      ],
      { stdio: ["ignore", "ignore", "pipe"] },
    );
    let error = "";
    child.stderr.on("data", (b) => {
      if (error.length < 8192) error += b.toString();
    });
    child.once("error", reject);
    child.once("exit", (code) =>
      code === 0 ? resolveRun() : reject(Error(file.filename + ": " + error)),
    );
  });
  const report = JSON.parse(
    readFileSync(join(output, file.filename + ".report.json")),
  );
  assert.equal(report.flacSha256, file.sha256, "Approved FLAC hash mismatch");
  assert.equal(report.bytes, file.bytes);
  assert(
    report.fullDecodePcmIdentity &&
      report.windows.every((w) => w.verifiedFullStreamIdentity),
  );
  rows.push({
    file: file.filename,
    sha256: report.flacSha256,
    bytes: report.bytes,
    flacFrames: report.flacFrames,
    fullDecodePcmIdentity: true,
    windows: report.windows.length,
    canonicalWavWindows: report.windows.filter((w) => w.wavIdentity).length,
    edgeChecks: report.alternatingEdgeDecodes,
  });
  console.log(
    rows.length +
      "/45 " +
      file.filename +
      ": full PCM identity + windows + edge reset PASS",
  );
}
const result = {
  status: "LOCAL DECODER PASS — NOT APP INTEGRATED OR PHONE VALIDATED",
  files: rows.length,
  bytes: rows.reduce((s, r) => s + r.bytes, 0),
  windows: rows.reduce((s, r) => s + r.windows, 0),
  canonicalWavWindows: rows.reduce((s, r) => s + r.canonicalWavWindows, 0),
  edgeChecks: rows.reduce((s, r) => s + r.edgeChecks, 0),
  rows,
};
writeFileSync(
  join(output, "catalog-report.json"),
  JSON.stringify(result, null, 2) + "\n",
);
console.log(JSON.stringify({ ...result, rows: undefined }));
