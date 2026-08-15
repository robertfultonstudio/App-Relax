import { createHash } from "node:crypto";
import { readFileSync, readdirSync, statSync } from "node:fs";
import { basename, dirname, join, resolve } from "node:path";
import { fileURLToPath } from "node:url";

const projectRoot = resolve(fileURLToPath(new URL("..", import.meta.url)));
const ritualManifestPath = join(
  projectRoot,
  "assets",
  "images",
  "rituals",
  "manifest.json",
);
const outcomeManifestPath = join(
  projectRoot,
  "assets",
  "images",
  "outcomes",
  "manifest.json",
);
const backgroundManifestPath = join(
  projectRoot,
  "assets",
  "images",
  "backgrounds",
  "manifest.json",
);

function jpegDimensions(buffer) {
  let offset = 2;
  while (offset < buffer.length) {
    if (buffer[offset] !== 0xff) {
      throw new Error("Invalid JPEG marker");
    }
    const marker = buffer[offset + 1];
    const length = buffer.readUInt16BE(offset + 2);
    if (marker >= 0xc0 && marker <= 0xc3) {
      return {
        height: buffer.readUInt16BE(offset + 5),
        width: buffer.readUInt16BE(offset + 7),
      };
    }
    offset += 2 + length;
  }
  throw new Error("JPEG dimensions not found");
}

function validateManifest({
  expectedCount,
  expectedHeight,
  expectedKeys,
  expectedWidth,
  label,
  manifestPath,
  maxBytes,
}) {
  const manifest = JSON.parse(readFileSync(manifestPath, "utf8"));

  if (
    manifest.schemaVersion !== 1 ||
    manifest.assets.length !== expectedCount
  ) {
    throw new Error(
      `${label} manifest must contain exactly ${expectedCount} assets`,
    );
  }

  const actualKeys = manifest.assets.map((asset) => asset.key);
  if (JSON.stringify(actualKeys) !== JSON.stringify(expectedKeys)) {
    throw new Error(`${label} manifest keys or order do not match contract`);
  }

  const files = manifest.assets.map((asset) => asset.file);
  const hashes = manifest.assets.map((asset) => asset.sha256);
  if (
    new Set(actualKeys).size !== expectedCount ||
    new Set(files).size !== expectedCount ||
    new Set(hashes).size !== expectedCount
  ) {
    throw new Error(`${label} keys, files and hashes must be unique`);
  }

  const expectedDirectoryEntries = ["manifest.json", ...files].sort();
  const actualDirectoryEntries = readdirSync(dirname(manifestPath)).sort();
  if (
    JSON.stringify(actualDirectoryEntries) !==
    JSON.stringify(expectedDirectoryEntries)
  ) {
    throw new Error(`${label} directory contains unregistered files`);
  }

  for (const asset of manifest.assets) {
    if (asset.file !== basename(asset.file) || !asset.file.endsWith(".jpg")) {
      throw new Error(`${asset.file}: expected a local .jpg filename`);
    }
    const path = join(dirname(manifestPath), basename(asset.file));
    const data = readFileSync(path);
    const actual = jpegDimensions(data);
    const sha256 = createHash("sha256").update(data).digest("hex");
    const bytes = statSync(path).size;

    if (data[0] !== 0xff || data[1] !== 0xd8) {
      throw new Error(`${asset.file}: missing JPEG SOI marker`);
    }

    if (
      actual.width !== expectedWidth ||
      actual.height !== expectedHeight ||
      asset.width !== expectedWidth ||
      asset.height !== expectedHeight
    ) {
      throw new Error(
        `${asset.file}: expected ${expectedWidth}x${expectedHeight}`,
      );
    }
    if (bytes > maxBytes || bytes !== asset.bytes) {
      throw new Error(`${asset.file}: byte-size contract failed`);
    }
    if (sha256 !== asset.sha256) {
      throw new Error(`${asset.file}: SHA-256 mismatch`);
    }
  }
}

validateManifest({
  expectedCount: 4,
  expectedHeight: 1440,
  expectedKeys: ["moon-current", "quiet-tide", "cedar-light", "aquarian-sky"],
  expectedWidth: 1080,
  label: "Ritual artwork",
  manifestPath: ritualManifestPath,
  maxBytes: 1_200_000,
});

validateManifest({
  expectedCount: 6,
  expectedHeight: 720,
  expectedKeys: ["yoga", "massage", "relax", "meditation", "sleep", "focus"],
  expectedWidth: 720,
  label: "Outcome artwork",
  manifestPath: outcomeManifestPath,
  maxBytes: 300_000,
});

validateManifest({
  expectedCount: 1,
  expectedHeight: 1821,
  expectedKeys: ["rituals-home"],
  expectedWidth: 864,
  label: "Shell background artwork",
  manifestPath: backgroundManifestPath,
  maxBytes: 500_000,
});

console.log(
  "Artwork validation: PASS (4 ritual JPEG + 6 outcome JPEG + 1 shell background JPEG; dimensions, size caps and hashes match).",
);
