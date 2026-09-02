import { createHash } from "node:crypto";
import { readFileSync, readdirSync, statSync } from "node:fs";
import { join, resolve } from "node:path";
import { fileURLToPath } from "node:url";

const root = resolve(fileURLToPath(new URL("..", import.meta.url)));
const report = JSON.parse(
  readFileSync(
    join(root, "docs", "M4_LOSSLESS_DERIVATIVE_REPORT.json"),
    "utf8",
  ),
);
const starterDir = join(root, "assets", "audio", "consumer-starter");
const starter = readdirSync(starterDir).sort();
const catalog = readFileSync(
  join(root, "src", "content", "consumerCatalog.ts"),
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
  "catalog must register exactly 18 works",
);
assert(
  !catalog.includes("Esoteric Series"),
  "unverified works must not be assigned to Esoteric Series",
);
assert(
  !catalog.includes("field recording"),
  "River provenance must not claim field recording",
);

console.log(
  `Consumer audio: PASS (18 works; WAV ${report.totals.wavBytes} B -> FLAC ${report.totals.flacBytes} B; starter ${statSync(starterPath).size} B).`,
);
