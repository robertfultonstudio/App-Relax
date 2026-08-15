import { lstatSync, readFileSync, readdirSync } from "node:fs";
import { resolve, relative, sep } from "node:path";

const archiveArgument = process.argv[2];
if (!archiveArgument) {
  throw new Error(
    "Usage: pnpm eas:validate-archive <build:inspect archive directory>",
  );
}

const archiveRoot = resolve(archiveArgument);
assert(
  lstatSync(archiveRoot).isDirectory(),
  "archive path must be a directory",
);

const files = [];
let totalBytes = 0;

function walk(directory) {
  for (const entry of readdirSync(directory, { withFileTypes: true })) {
    const absolutePath = resolve(directory, entry.name);
    const archivePath = relative(archiveRoot, absolutePath)
      .split(sep)
      .join("/");

    if (entry.isSymbolicLink()) {
      throw new Error(`EAS archive contains a symbolic link: ${archivePath}`);
    }
    if (entry.isDirectory()) {
      walk(absolutePath);
      continue;
    }
    assert(entry.isFile(), `unexpected archive entry type: ${archivePath}`);
    files.push({ absolutePath, archivePath });
    totalBytes += lstatSync(absolutePath).size;
  }
}

function assert(condition, message) {
  if (!condition) {
    throw new Error(`EAS archive validation failed: ${message}`);
  }
}

walk(archiveRoot);
files.sort((left, right) => left.archivePath.localeCompare(right.archivePath));

const forbiddenSegments = new Set([
  ".git",
  ".pnpm-store",
  ".expo",
  ".vscode",
  "android",
  "coverage",
  "dist",
  "docs",
  "ios",
  "node_modules",
  "output",
  "scripts",
  "tests",
  "tmp",
]);
const forbiddenRootFiles = new Set([
  "AGENTS.md",
  "README.md",
  "STATO.md",
  "eslint.config.js",
  "jest.config.js",
]);
const forbiddenCredentialExtensions = new Set([
  ".jks",
  ".keystore",
  ".key",
  ".mobileprovision",
  ".p12",
  ".p8",
  ".pem",
]);
const requiredFiles = [
  "app.json",
  "eas.json",
  "metro.config.js",
  "package.json",
  "pnpm-lock.yaml",
  "pnpm-workspace.yaml",
  "tsconfig.json",
];
const expectedAudioFiles = [
  "assets/audio/test-pack-01/SLEEP_AMBIENCE_001.wav",
  "assets/audio/test-pack-01/SLEEP_DRONE_001.wav",
  "assets/audio/test-pack-01/SLEEP_TEXTURE_001.wav",
  "assets/audio/test-pack-01/manifest.json",
].sort((left, right) => left.localeCompare(right));
const secretPatterns = [
  /-----BEGIN (?:RSA |EC |OPENSSH |DSA )?PRIVATE KEY-----/,
  /A[KS]IA[0-9A-Z]{16}/,
  /xox[baprs]-[A-Za-z0-9-]+/,
  /gh[pousr]_[A-Za-z0-9_]{20,}/,
  /sk-(?:proj-)?[A-Za-z0-9_-]{20,}/,
  /EXPO_TOKEN\s*=/,
  /file:\/\/\/Users\//,
];

const archivePaths = new Set(files.map(({ archivePath }) => archivePath));
for (const requiredFile of requiredFiles) {
  assert(
    archivePaths.has(requiredFile),
    `missing required file: ${requiredFile}`,
  );
}

for (const { absolutePath, archivePath } of files) {
  const segments = archivePath.split("/");
  assert(
    !segments.some((segment) => forbiddenSegments.has(segment)),
    `forbidden path: ${archivePath}`,
  );
  assert(
    !forbiddenRootFiles.has(archivePath),
    `forbidden file: ${archivePath}`,
  );
  assert(
    !archivePath.startsWith(".env") &&
      !segments.some((segment) => /^credentials(?:\.|$)/i.test(segment)),
    `environment or credential file: ${archivePath}`,
  );
  const extension = archivePath.includes(".")
    ? `.${archivePath.split(".").at(-1).toLowerCase()}`
    : "";
  assert(
    !forbiddenCredentialExtensions.has(extension),
    `credential extension: ${archivePath}`,
  );

  if (!archivePath.toLowerCase().endsWith(".wav")) {
    const contents = readFileSync(absolutePath).toString("utf8");
    for (const pattern of secretPatterns) {
      assert(
        !pattern.test(contents),
        `secret or local path pattern in ${archivePath}`,
      );
    }
  }
}

const audioFiles = files
  .map(({ archivePath }) => archivePath)
  .filter((archivePath) => archivePath.startsWith("assets/audio/"));
assert(
  JSON.stringify(audioFiles) === JSON.stringify(expectedAudioFiles),
  `unexpected audio scope: ${audioFiles.join(", ")}`,
);

console.log(
  `EAS archive: PASS (${files.length} files, ${totalBytes} bytes, no Git metadata/secrets/local paths, 3 AUDIO TEST PACK 01 WAV files).`,
);
