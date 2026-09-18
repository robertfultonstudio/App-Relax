import { createHash } from "node:crypto";
import { Buffer } from "node:buffer";
import {
  createReadStream,
  existsSync,
  readFileSync,
  readdirSync,
  statSync,
} from "node:fs";
import { open } from "node:fs/promises";
import { basename, dirname, extname, join, resolve } from "node:path";
import { spawn } from "node:child_process";
import { fileURLToPath } from "node:url";

const repositoryRoot = resolve(dirname(fileURLToPath(import.meta.url)), "..");

async function wavDataRegion(path) {
  const handle = await open(path, "r");
  try {
    const header = Buffer.alloc(12);
    await handle.read(header, 0, 12, 0);
    if (
      header.toString("ascii", 0, 4) !== "RIFF" ||
      header.toString("ascii", 8, 12) !== "WAVE"
    ) {
      throw new Error(`${basename(path)} is not a RIFF/WAVE file.`);
    }
    let offset = 12;
    for (;;) {
      const chunk = Buffer.alloc(8);
      const { bytesRead } = await handle.read(chunk, 0, 8, offset);
      if (bytesRead !== 8)
        throw new Error(`No data chunk in ${basename(path)}.`);
      const size = chunk.readUInt32LE(4);
      if (chunk.toString("ascii", 0, 4) === "data") {
        return { start: offset + 8, size };
      }
      offset += 8 + size + (size % 2);
    }
  } finally {
    await handle.close();
  }
}

async function hashStream(stream) {
  const hash = createHash("sha256");
  let bytes = 0;
  for await (const chunk of stream) {
    hash.update(chunk);
    bytes += chunk.length;
  }
  return { hash: hash.digest("hex"), bytes };
}

function decodedPcm(flacPath) {
  const child = spawn(flacBinary, [
    "--decode",
    "--stdout",
    "--force-raw-format",
    "--endian=little",
    "--sign=signed",
    "--silent",
    flacPath,
  ]);
  let stderr = "";
  child.stderr.on("data", (chunk) => {
    stderr += chunk;
  });
  child.completion = new Promise((resolve, reject) => {
    child.on("error", reject);
    child.on("close", (code) => {
      if (code === 0) resolve();
      else reject(new Error(stderr || `FLAC decoder exited ${code}.`));
    });
  });
  return child;
}

async function verifyCatalogExclusion() {
  const reportPath = join(
    repositoryRoot,
    "docs",
    "M4_LOSSLESS_DERIVATIVE_REPORT.json",
  );
  const starterDir = join(
    repositoryRoot,
    "assets",
    "audio",
    "consumer-starter",
  );
  const report = JSON.parse(readFileSync(reportPath, "utf8"));
  const catalog = readFileSync(
    join(repositoryRoot, "src", "content", "consumerCatalog.ts"),
    "utf8",
  );
  const nativeConsumerDriver = readFileSync(
    join(
      repositoryRoot,
      "src",
      "audio",
      "reactNativeAudioApi",
      "ReactNativeAudioDriver.ts",
    ),
    "utf8",
  );
  const webConsumerResolver = readFileSync(
    join(
      repositoryRoot,
      "src",
      "audio",
      "web",
      "MetroWebAudioSourceResolver.ts",
    ),
    "utf8",
  );
  const starterFiles = existsSync(starterDir)
    ? readdirSync(starterDir)
        .filter((name) => extname(name).toLowerCase() === ".flac")
        .sort()
    : [];

  if (starterFiles.length !== 0) {
    throw new Error(
      `Consumer starter must contain no FLAC after the listening rejection; found ${starterFiles.join(", ")}.`,
    );
  }
  const excludedFilenames = [
    "SOUNDSCAPE_ECLYPSIS_001_EMINOR_48K24_LOOP.flac",
    "SOUNDSCAPE_NIRVANA_WAVES_001_EMINOR_48K24_LOOP.flac",
  ];
  const historicalDerivatives = excludedFilenames.map((filename) =>
    report.files.find((entry) => entry.filename === filename),
  );
  if (historicalDerivatives.some((entry) => !entry)) {
    throw new Error(
      "Historical lossless derivative evidence is missing for an excluded work.",
    );
  }
  if (
    /eclipse|eclypsis|stillwater|nirvana/i.test(
      `${catalog}\n${nativeConsumerDriver}\n${webConsumerResolver}`,
    )
  ) {
    throw new Error(
      "An excluded work remains referenced by the consumer catalog or asset map.",
    );
  }

  console.log(
    JSON.stringify(
      {
        status: "CATALOG_EXCLUSIONS_CONFIRMED",
        evidence:
          "Eclipse Veil and Nirvana Waves are absent from the app package and consumer registry while their historical PCM-verified derivatives remain documented.",
        embeddedFlacCount: starterFiles.length,
        excludedDerivatives: historicalDerivatives.map((entry) => ({
          filename: entry.filename,
          flacBytes: entry.flacBytes,
          flacSha256: entry.flacSha256,
          decodedPcmSha256: entry.decodedPcmSha256,
        })),
      },
      null,
      2,
    ),
  );
}

const requestedArgs = process.argv
  .slice(2)
  .filter((argument) => argument !== "--");
if (requestedArgs.length === 0) {
  await verifyCatalogExclusion();
  process.exit(0);
}

const [sourceDir, flacDir, flacBinary] = requestedArgs;
if (!sourceDir || !flacDir || !flacBinary) {
  throw new Error(
    "Usage: node scripts/verify-lossless-derivatives.mjs [<wav-dir> <flac-dir> <flac-binary>]",
  );
}
if (![sourceDir, flacDir, flacBinary].every(existsSync)) {
  throw new Error("One or more verification inputs do not exist.");
}

const wavFiles = readdirSync(sourceDir)
  .filter((name) => extname(name).toLowerCase() === ".wav")
  .sort();
const rows = [];
for (const wavName of wavFiles) {
  const base = basename(wavName, ".wav");
  const wavPath = join(sourceDir, wavName);
  const flacPath = join(flacDir, `${base}.flac`);
  if (!existsSync(flacPath)) throw new Error(`Missing ${base}.flac.`);

  const region = await wavDataRegion(wavPath);
  const wavPcm = await hashStream(
    createReadStream(wavPath, {
      start: region.start,
      end: region.start + region.size - 1,
    }),
  );
  const decoder = decodedPcm(flacPath);
  const flacPcm = await hashStream(decoder.stdout);
  await decoder.completion;
  if (wavPcm.hash !== flacPcm.hash || wavPcm.bytes !== flacPcm.bytes) {
    throw new Error(`Decoded PCM mismatch for ${base}.`);
  }
  const wavBytes = statSync(wavPath).size;
  const flacBytes = statSync(flacPath).size;
  rows.push({
    filename: `${base}.flac`,
    wavBytes,
    flacBytes,
    savedBytes: wavBytes - flacBytes,
    savedPercent: Number(
      (((wavBytes - flacBytes) / wavBytes) * 100).toFixed(4),
    ),
    flacSha256: (await hashStream(createReadStream(flacPath))).hash,
    decodedPcmSha256: flacPcm.hash,
  });
}

const totals = rows.reduce(
  (sum, row) => ({
    wavBytes: sum.wavBytes + row.wavBytes,
    flacBytes: sum.flacBytes + row.flacBytes,
  }),
  { wavBytes: 0, flacBytes: 0 },
);
const report = {
  schemaVersion: 1,
  codec: "FLAC lossless, compression level 8",
  sampleFormat: "stereo PCM24 48 kHz",
  fileCount: rows.length,
  totals: {
    ...totals,
    savedBytes: totals.wavBytes - totals.flacBytes,
    savedPercent: Number(
      (((totals.wavBytes - totals.flacBytes) / totals.wavBytes) * 100).toFixed(
        4,
      ),
    ),
  },
  files: rows,
};
console.log(JSON.stringify(report, null, 2));
