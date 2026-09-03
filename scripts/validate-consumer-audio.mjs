import { createHash } from "node:crypto";
import { createReadStream, readFileSync, readdirSync, statSync } from "node:fs";
import { join, resolve } from "node:path";
import { fileURLToPath } from "node:url";

const root = resolve(fileURLToPath(new URL("..", import.meta.url)));
const report = JSON.parse(
  readFileSync(
    join(root, "docs", "M4_LOSSLESS_DERIVATIVE_REPORT.json"),
    "utf8",
  ),
);
const localManifest = JSON.parse(
  readFileSync(join(root, "docs", "M4_LOCAL_LISTENING_MANIFEST.json"), "utf8"),
);
const localPreviewDir = join(root, "public", "audio-catalog");
const starterDir = join(root, "assets", "audio", "consumer-starter");
const starter = readdirSync(starterDir).sort();
const catalog = readFileSync(
  join(root, "src", "content", "consumerCatalog.ts"),
  "utf8",
);
const elementalCatalog = readFileSync(
  join(root, "src", "content", "approvedElementalCatalog.ts"),
  "utf8",
);
const consumerAssets = readFileSync(
  join(root, "src", "audio", "reactNativeAudioApi", "consumerAssets.ts"),
  "utf8",
);
const metro = readFileSync(join(root, "metro.config.js"), "utf8");

function assert(condition, message) {
  if (!condition)
    throw new Error(`Consumer audio validation failed: ${message}`);
}

assert(report.fileCount === 18, "lossless report must contain 18 derivatives");
assert(
  report.files.length === 18,
  "lossless report file list must contain 18 rows",
);
assert(report.totals.wavBytes === 2563271952, "unexpected WAV total");
assert(report.totals.flacBytes === 1455254377, "unexpected FLAC total");
assert(
  report.files.every((file) => file.decodedPcmSha256.length === 64),
  "every derivative needs a decoded PCM hash",
);
assert(
  starter.length === 1,
  "starter pack must remain deliberately limited to one FLAC",
);
assert(
  starter[0].endsWith(".flac"),
  "starter pack may not duplicate a WAV master",
);
const starterPath = join(starterDir, starter[0]);
assert(
  statSync(starterPath).size < 100_000_000,
  "starter asset exceeds GitHub's normal file limit",
);
const sha = createHash("sha256")
  .update(readFileSync(starterPath))
  .digest("hex");
assert(
  sha === "644a9c4037fd1262c770bd195d2ae8533cb3ee3795ce2341bd595e0f0f8522a5",
  "starter FLAC hash mismatch",
);
assert(
  metro.includes('["wav", "flac"]'),
  "Metro must declare FLAC as an asset extension",
);
assert(
  (catalog.match(/work\(\s*"/g) ?? []).length === 18,
  "base catalog must retain exactly 18 file-backed works",
);
assert(
  (elementalCatalog.match(/pack02Work\(\{/g) ?? []).length === 24,
  "approved elemental catalog must contain exactly 24 file-backed works",
);
assert(
  (catalog.match(/noiseWork\(\s*"/g) ?? []).length === 8,
  "catalog must register exactly 8 runtime noise generators",
);
assert(
  catalog.includes('availability: "generated-runtime"'),
  "runtime generators must be marked as locally generated",
);
assert(
  catalog.includes("sourceFilename: null"),
  "runtime generators must not declare audio files",
);
assert(
  !catalog.includes("Esoteric Series"),
  "unverified works must not be assigned to Esoteric Series",
);
assert(
  !catalog.includes("field recording"),
  "River provenance must not claim field recording",
);
assert(
  catalog.includes('"soft-air"') &&
    catalog.includes('"rejected-listening"') &&
    !consumerAssets.includes("sleepTexture001"),
  "rejected Soft Air must not remain addressable as a consumer asset",
);
assert(
  !localManifest.files.some(
    (file) => file.filename === "SLEEP_TEXTURE_001.wav",
  ),
  "rejected Soft Air bytes must not enter the local consumer preview",
);

const localAudioFiles = readdirSync(localPreviewDir)
  .filter((filename) => /\.(flac|wav)$/i.test(filename))
  .sort();
const expectedAudioFiles = localManifest.files
  .map((file) => file.filename)
  .sort();
assert(localManifest.fileCount === 38, "local manifest must declare 38 files");
assert(
  JSON.stringify(localAudioFiles) === JSON.stringify(expectedAudioFiles),
  "local preview filenames do not match the tracked manifest",
);

let localBytes = 0;
for (const file of localManifest.files) {
  const path = join(localPreviewDir, file.filename);
  const size = statSync(path).size;
  localBytes += size;
  assert(size === file.bytes, `${file.filename} byte size mismatch`);
  const hash = createHash("sha256");
  for await (const chunk of createReadStream(path)) hash.update(chunk);
  assert(
    hash.digest("hex") === file.sha256,
    `${file.filename} SHA-256 mismatch`,
  );
}
assert(
  localBytes === localManifest.totalBytes,
  "local preview total byte size mismatch",
);

console.log(
  `Consumer audio: PASS (42 file works + 8 runtime noise colours; 38 local preview files verified, ${localBytes} B; starter ${statSync(starterPath).size} B).`,
);
