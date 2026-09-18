import { Buffer } from "node:buffer";
import {
  existsSync,
  lstatSync,
  readFileSync,
  readdirSync,
  statSync,
} from "node:fs";
import { extname, join, relative, resolve, sep } from "node:path";

const exportDirectories = process.argv.slice(2);
const maximumExportBytes = 512 * 1024 * 1024;
const maximumSingleFileBytes = 100 * 1024 * 1024;

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

async function validateExport(directoryArgument) {
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
  const bundlePath = resolve(
    exportRoot,
    metadata.fileMetadata[platform].bundle,
  );
  assert(
    bundlePath.startsWith(`${exportRoot}${sep}`),
    "Bundle path escapes export",
  );
  const bundle = readFileSync(bundlePath);
  for (const marker of [
    "./audio-test.tsx",
    "./session/[sessionId].tsx",
    "./category/[categoryId].tsx",
    "Engine room.",
    "AUDIO QA WORKBENCH",
    "@app-relax/qa-workbench-draft",
  ]) {
    assert(
      !bundle.includes(Buffer.from(marker)),
      `Technical marker in ${platform} bundle: ${marker}`,
    );
  }
  const audioAssets = (metadata.fileMetadata[platform].assets ?? []).filter(
    (asset) => ["wav", "flac"].includes(asset.ext),
  );
  assert(
    audioAssets.length === 0,
    `Attesi zero asset audio Metro nel consumer, trovati ${audioAssets.length}`,
  );

  return {
    audioBytes: 0,
    audioFiles: 0,
    files: files.length,
    outputBytes,
    platform,
  };
}

assert(
  exportDirectories.length === 2,
  "Uso: node scripts/validate-native-export-audio-scope.mjs <ios-export-dir> <android-export-dir>",
);

const results = [];
for (const exportDirectory of exportDirectories) {
  results.push(await validateExport(exportDirectory));
}
assert(
  JSON.stringify(results.map(({ platform }) => platform).sort()) ===
    JSON.stringify(["android", "ios"]),
  "Il gate richiede esattamente un export iOS e un export Android",
);

for (const result of results) {
  console.log(
    `PASS native export ${result.platform}: ${result.files} file, ${result.outputBytes} byte totali, ` +
      `${result.audioFiles} asset audio (${result.audioBytes} byte), catalogo localhost assente`,
  );
}
