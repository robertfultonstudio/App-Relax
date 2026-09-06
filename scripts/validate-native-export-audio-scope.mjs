import { createHash } from "node:crypto";
import {
  createReadStream,
  existsSync,
  lstatSync,
  readFileSync,
  readdirSync,
  statSync,
} from "node:fs";
import { dirname, extname, join, relative, resolve, sep } from "node:path";
import { fileURLToPath } from "node:url";

const projectRoot = dirname(dirname(fileURLToPath(import.meta.url)));
const exportDirectories = process.argv.slice(2);
const maximumExportBytes = 512 * 1024 * 1024;
const maximumSingleFileBytes = 100 * 1024 * 1024;
const expectedAudioSources = [
  "assets/audio/test-pack-01/SLEEP_AMBIENCE_001.wav",
  "assets/audio/test-pack-01/SLEEP_DRONE_001.wav",
  "assets/audio/test-pack-01/SLEEP_TEXTURE_001.wav",
];

function assert(condition, message) {
  if (!condition) {
    throw new Error(message);
  }
}

function listFiles(directory) {
  return readdirSync(directory, { withFileTypes: true }).flatMap((entry) => {
    const absolutePath = join(directory, entry.name);

    if (entry.isSymbolicLink()) {
      throw new Error(`Symlink non ammesso nell'export: ${absolutePath}`);
    }

    if (entry.isDirectory()) {
      return listFiles(absolutePath);
    }

    assert(
      entry.isFile(),
      `Elemento non regolare nell'export: ${absolutePath}`,
    );
    return [absolutePath];
  });
}

function sha256(filePath) {
  return new Promise((resolveHash, rejectHash) => {
    const hash = createHash("sha256");
    const stream = createReadStream(filePath);

    stream.on("data", (chunk) => hash.update(chunk));
    stream.on("error", rejectHash);
    stream.on("end", () => resolveHash(hash.digest("hex")));
  });
}

async function describeFile(filePath) {
  const stats = statSync(filePath);
  return {
    bytes: stats.size,
    extension: extname(filePath).slice(1).toLowerCase(),
    filePath,
    sha256: await sha256(filePath),
  };
}

async function validateExport(
  directoryArgument,
  expectedByHash,
  expectedAudioBytes,
) {
  const exportRoot = resolve(directoryArgument);
  assert(existsSync(exportRoot), `Export inesistente: ${exportRoot}`);
  assert(
    lstatSync(exportRoot).isDirectory(),
    `Non e una directory: ${exportRoot}`,
  );

  const metadataPath = join(exportRoot, "metadata.json");
  assert(existsSync(metadataPath), `metadata.json assente: ${exportRoot}`);

  const files = listFiles(exportRoot);
  const outputBytes = files.reduce(
    (total, filePath) => total + statSync(filePath).size,
    0,
  );
  assert(
    outputBytes <= maximumExportBytes,
    `Export troppo grande (${outputBytes} byte): possibile inclusione del catalogo locale`,
  );

  for (const filePath of files) {
    const relativePath = relative(exportRoot, filePath);
    const pathSegments = relativePath
      .split(sep)
      .map((segment) => segment.toLowerCase());
    const size = statSync(filePath).size;
    const extension = extname(filePath).toLowerCase();

    assert(
      !pathSegments.includes("audio-catalog"),
      `Catalogo localhost trovato nell'export: ${relativePath}`,
    );
    assert(
      size <= maximumSingleFileBytes,
      `File oltre 100 MiB nell'export: ${relativePath} (${size} byte)`,
    );
    assert(
      extension !== ".wav" && extension !== ".flac",
      `Audio pubblico non processato trovato nell'export: ${relativePath}`,
    );
  }

  const metadata = JSON.parse(readFileSync(metadataPath, "utf8"));
  const platformKeys = Object.keys(metadata.fileMetadata ?? {});
  assert(
    platformKeys.length === 1 && ["ios", "android"].includes(platformKeys[0]),
    `metadata.json deve contenere un solo export iOS o Android: ${platformKeys.join(", ")}`,
  );

  const platform = platformKeys[0];
  const audioAssets = (metadata.fileMetadata[platform].assets ?? []).filter(
    (asset) => ["wav", "flac"].includes(asset.ext),
  );
  const extensionCounts = audioAssets.reduce((counts, asset) => {
    counts[asset.ext] = (counts[asset.ext] ?? 0) + 1;
    return counts;
  }, {});

  assert(
    audioAssets.length === expectedAudioSources.length,
    `Attesi ${expectedAudioSources.length} asset audio Metro, trovati ${audioAssets.length}`,
  );
  assert(
    extensionCounts.wav === 3 && (extensionCounts.flac ?? 0) === 0,
    `Attesi 3 WAV e nessun FLAC, trovati ${extensionCounts.wav ?? 0} WAV e ${extensionCounts.flac ?? 0} FLAC`,
  );

  const exportedAudio = [];
  for (const asset of audioAssets) {
    const assetPath = resolve(exportRoot, asset.path);
    assert(
      assetPath.startsWith(`${exportRoot}${sep}`),
      `Percorso asset fuori dall'export: ${asset.path}`,
    );
    assert(existsSync(assetPath), `Asset Metro mancante: ${asset.path}`);

    const description = await describeFile(assetPath);
    const expected = expectedByHash.get(description.sha256);
    assert(expected, `Asset audio non autorizzato nell'export: ${asset.path}`);
    assert(
      description.bytes === expected.bytes,
      `Dimensione alterata per ${asset.path}: ${description.bytes} != ${expected.bytes}`,
    );
    assert(
      asset.ext === expected.extension,
      `Estensione metadata errata per ${asset.path}: ${asset.ext} != ${expected.extension}`,
    );
    exportedAudio.push(description);
  }

  const exportedHashes = exportedAudio.map((item) => item.sha256).sort();
  const expectedHashes = [...expectedByHash.keys()].sort();
  assert(
    JSON.stringify(exportedHashes) === JSON.stringify(expectedHashes),
    "L'export non contiene esattamente i tre asset AUDIO TEST PACK 01 autorizzati",
  );

  const exportedAudioBytes = exportedAudio.reduce(
    (total, item) => total + item.bytes,
    0,
  );
  assert(
    exportedAudioBytes === expectedAudioBytes,
    `Peso audio inatteso: ${exportedAudioBytes} != ${expectedAudioBytes}`,
  );

  return {
    audioBytes: exportedAudioBytes,
    audioFiles: exportedAudio.length,
    files: files.length,
    outputBytes,
    platform,
  };
}

assert(
  exportDirectories.length === 2,
  "Uso: node scripts/validate-native-export-audio-scope.mjs <ios-export-dir> <android-export-dir>",
);

const expectedDescriptions = [];
for (const sourcePath of expectedAudioSources) {
  const absolutePath = join(projectRoot, sourcePath);
  assert(existsSync(absolutePath), `Asset autorizzato mancante: ${sourcePath}`);
  expectedDescriptions.push(await describeFile(absolutePath));
}

const expectedByHash = new Map(
  expectedDescriptions.map((description) => [description.sha256, description]),
);
assert(
  expectedByHash.size === expectedAudioSources.length,
  "Gli asset audio autorizzati devono avere hash distinti",
);
const expectedAudioBytes = expectedDescriptions.reduce(
  (total, item) => total + item.bytes,
  0,
);

const results = [];
for (const exportDirectory of exportDirectories) {
  results.push(
    await validateExport(exportDirectory, expectedByHash, expectedAudioBytes),
  );
}
assert(
  JSON.stringify(results.map(({ platform }) => platform).sort()) ===
    JSON.stringify(["android", "ios"]),
  "Il gate richiede esattamente un export iOS e un export Android",
);

for (const result of results) {
  console.log(
    `PASS native export ${result.platform}: ${result.files} file, ${result.outputBytes} byte totali, ` +
      `${result.audioFiles} audio autorizzati (${result.audioBytes} byte), catalogo localhost assente`,
  );
}
