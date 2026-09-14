import assert from "node:assert/strict";
import { createHash } from "node:crypto";
import {
  createReadStream,
  readFileSync,
  existsSync,
  mkdirSync,
  copyFileSync,
  constants,
  writeFileSync,
  readdirSync,
  lstatSync,
} from "node:fs";
import { resolve, join, basename } from "node:path";

// Explicit external destination only; originals and already matching copies are read-only.
const [derivativesArg, targetArg] = process.argv.slice(2);
assert(
  derivativesArg && targetArg,
  "Specify existing lossless directory and a new external kit directory.",
);
const root = process.cwd(),
  derivatives = resolve(derivativesArg),
  target = resolve(targetArg);
assert(
  !target.startsWith(root + "/") && target !== root && target !== derivatives,
);
assert.equal(basename(target), "AppRelaxAudio");
const manifest = JSON.parse(
  readFileSync("src/content/nativeAudioManifest.json", "utf8"),
);
assert.equal(manifest.files.length, 47);
assert.equal(new Set(manifest.files.map((f) => f.workId)).size, 47);
assert.equal(new Set(manifest.files.map((f) => f.filename)).size, 47);
assert(
  manifest.files.every(
    (f) => !/ECLYPSIS|NIRVANA|SLEEP_TEXTURE/i.test(f.filename),
  ),
);
async function hash(path) {
  const h = createHash("sha256");
  for await (const b of createReadStream(path)) h.update(b);
  return h.digest("hex");
}
async function verify(path, file) {
  const info = lstatSync(path);
  assert(info.isFile() && !info.isSymbolicLink());
  assert.equal(info.size, file.bytes, file.filename + " size");
  assert.equal(await hash(path), file.sha256, file.filename + " SHA-256");
}
mkdirSync(target, { recursive: true });
const allowed = new Set([
  ...manifest.files.map((f) => f.filename),
  "catalog.json",
  "README.txt",
]);
assert(
  readdirSync(target).every((name) => allowed.has(name)),
  "Kit contains unexpected files; no overwrite permitted.",
);
for (const file of manifest.files) {
  assert.equal(basename(file.filename), file.filename);
  const inCatalog = join(root, "public/audio-catalog", file.filename);
  const source = existsSync(inCatalog)
    ? inCatalog
    : join(derivatives, file.filename);
  const destination = join(target, file.filename);
  assert.notEqual(source, destination);
  await verify(source, file);
  if (!existsSync(destination))
    copyFileSync(source, destination, constants.COPYFILE_EXCL);
  await verify(destination, file);
  console.log("PASS " + file.workId);
}
writeFileSync(
  join(target, "catalog.json"),
  JSON.stringify(manifest, null, 2) + "\n",
);
writeFileSync(
  join(target, "README.txt"),
  "APP RELAX - ANDROID OFFLINE AUDIO\nCopy this entire AppRelaxAudio folder to your Android phone. Open the supplied APK and choose Import audio folder, then select this folder. Keep the app open until all 47 recordings are verified. Originals stay untouched. After import, listening does not need the Mac or an internet connection. No login is needed. This is a private device test, not a claim of listening or background certification.\n45 existing lossless FLAC + 2 recent PCM24 WAV textures, unmodified. Rejected music is excluded.\n",
);
console.log(
  JSON.stringify({
    files: manifest.files.length,
    bytes: manifest.files.reduce((n, f) => n + f.bytes, 0),
    flac: manifest.files.filter((f) => f.filename.endsWith(".flac")).length,
    wav: manifest.files.filter((f) => f.filename.endsWith(".wav")).length,
    manifestSha256: await hash(join(target, "catalog.json")),
    target,
    originalsUnchanged: true,
  }),
);
