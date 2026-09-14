// Generates metadata only for the authorized, staged private music replacement.
import assert from "node:assert/strict";
import { readFileSync, writeFileSync } from "node:fs";
import { createHash } from "node:crypto";
import { resolve, join } from "node:path";
const [baselinePath, sitePath, phase] = process.argv.slice(2);
assert(["stage", "activate"].includes(phase));
const site = resolve(sitePath);
assert.equal(site, resolve("tmp/pwa-private-site"));
const base = JSON.parse(readFileSync(baselinePath, "utf8"));
const music = JSON.parse(
  readFileSync("docs/SESSION_REVIEW_5_LOSSLESS_REPORT.json", "utf8"),
).files;
assert.equal(base.files.length, 45);
assert.equal(
  base.files.reduce((n, f) => n + f.bytes, 0),
  4002191597,
);
assert.equal(music.length, 21);
const converted = base.files.map((f) => {
  const match = music.find((m) => m.sourceFilename === f.filename);
  if (!match) {
    assert(f.filename.endsWith(".flac"));
    return f;
  }
  assert.equal(f.sha256, match.sourceSha256);
  assert.equal(f.bytes, match.wavBytes);
  assert.equal(match.pcmIdentity, true);
  return {
    ...f,
    filename: match.filename,
    bytes: match.flacBytes,
    sha256: match.sha256,
  };
});
assert.equal(new Set(converted.map((f) => f.filename)).size, 45);
assert.equal(
  converted.reduce((n, f) => n + f.bytes, 0),
  2371806490,
);
const imports = converted.filter((f) =>
  music.some((m) => m.filename === f.filename),
);
assert.equal(imports.length, 21);
const readyKey =
  "review-ready/" +
  createHash("sha256")
    .update(converted.map((f) => f.sha256).join("\n"))
    .digest("hex");
const files = phase === "stage" ? base.files : converted;
const output = {
  schemaVersion: 1,
  phase,
  fileCount: files.length,
  totalBytes: files.reduce((n, f) => n + f.bytes, 0),
  files,
  alternateFiles:
    phase === "stage"
      ? imports
      : base.files.filter((f) => f.filename.endsWith(".wav")),
  importFiles: imports,
  readyKey: phase === "stage" ? "review-ready" : readyKey,
  publishFiles: converted,
  publishReadyKey: readyKey,
};
writeFileSync(
  join(site, "catalog.json"),
  JSON.stringify(output, null, 2) + "\n",
);
console.log(
  JSON.stringify({
    phase,
    currentFiles: files.length,
    currentBytes: output.totalBytes,
    importFiles: imports.length,
    importBytes: imports.reduce((n, f) => n + f.bytes, 0),
    originalsChanged: false,
  }),
);
