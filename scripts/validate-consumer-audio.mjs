import { createHash } from "node:crypto";
import {
  createReadStream,
  existsSync,
  readFileSync,
  readdirSync,
  statSync,
} from "node:fs";
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
const starter = existsSync(starterDir) ? readdirSync(starterDir).sort() : [];
const catalog = readFileSync(
  join(root, "src", "content", "consumerCatalog.ts"),
  "utf8",
);
const elementalCatalog = readFileSync(
  join(root, "src", "content", "approvedElementalCatalog.ts"),
  "utf8",
);
const nativeConsumerDriver = readFileSync(
  join(
    root,
    "src",
    "audio",
    "reactNativeAudioApi",
    "ReactNativeAudioDriver.ts",
  ),
  "utf8",
);
const webConsumerResolver = readFileSync(
  join(root, "src", "audio", "web", "MetroWebAudioSourceResolver.ts"),
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
  starter.length === 0,
  "consumer starter pack must be empty after the listening rejection",
);
assert(
  metro.includes('["wav", "flac"]'),
  "Metro must declare FLAC as an asset extension",
);
assert(
  (catalog.match(/work\(\s*"/g) ?? []).length === 16,
  "base catalog must contain exactly 16 file-backed works after the listening exclusions",
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
    catalog.includes('"audio-test-pack-01"'),
  "rejected Soft Air metadata must remain explicitly TEST ONLY",
);
assert(
  !/eclipse|eclypsis/i.test(catalog) &&
    !/eclipse|eclypsis/i.test(nativeConsumerDriver) &&
    !/eclipse|eclypsis/i.test(webConsumerResolver),
  "rejected Eclipse Veil must not remain in consumer runtime sources",
);
assert(
  !/stillwater|nirvana/i.test(catalog) &&
    !/stillwater|nirvana/i.test(nativeConsumerDriver) &&
    !/stillwater|nirvana/i.test(webConsumerResolver),
  "removed Nirvana Waves must not remain in consumer runtime sources",
);
assert(
  !/consumerAssets|test-pack-01|SLEEP_(?:DRONE|AMBIENCE|TEXTURE)_001/.test(
    `${nativeConsumerDriver}\n${webConsumerResolver}`,
  ),
  "consumer runtime graph must not contain ATP01 asset references",
);
assert(
  report.files.some(
    (file) =>
      file.filename === "SOUNDSCAPE_ECLYPSIS_001_EMINOR_48K24_LOOP.flac",
  ),
  "historical lossless processing report must retain the excluded derivative evidence",
);
assert(
  report.files.some(
    (file) =>
      file.filename === "SOUNDSCAPE_NIRVANA_WAVES_001_EMINOR_48K24_LOOP.flac",
  ),
  "historical lossless processing report must retain the removed Nirvana derivative evidence",
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
  .concat(
    JSON.parse(
      readFileSync(
        new URL("../src/content/localNaturalAudioFiles.json", import.meta.url),
        "utf8",
      ),
    ).files,
  )
  .concat(
    JSON.parse(
      readFileSync(
        new URL("../src/content/hathaAudioFiles.json", import.meta.url),
        "utf8",
      ),
    ).files,
  )
  .map((file) => file.filename)
  .sort();
assert(localManifest.fileCount === 37, "local manifest must declare 37 files");
assert(
  !localManifest.files.some((file) => /nirvana/i.test(file.filename)),
  "removed Nirvana Waves bytes must not enter the local consumer preview",
);
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
  `Consumer audio: PASS (40 file works + 8 runtime noise colours; 37 approved local preview files verified, ${localBytes} B; no consumer starter FLAC).`,
);
await import("./validate-hatha-audio.mjs");
await import("./validate-local-natural-audio.mjs");
