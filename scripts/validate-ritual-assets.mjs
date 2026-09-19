import { Buffer } from "node:buffer";
import { createHash } from "node:crypto";
import { readFileSync, readdirSync, statSync } from "node:fs";
import { basename, dirname, join, resolve } from "node:path";
import { fileURLToPath } from "node:url";
import { inflateSync } from "node:zlib";
import Jimp from "jimp-compact";

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

const pngSignature = Buffer.from([137, 80, 78, 71, 13, 10, 26, 10]);

function paethPredictor(left, above, upperLeft) {
  const predictor = left + above - upperLeft;
  const leftDistance = Math.abs(predictor - left);
  const aboveDistance = Math.abs(predictor - above);
  const upperLeftDistance = Math.abs(predictor - upperLeft);
  if (leftDistance <= aboveDistance && leftDistance <= upperLeftDistance)
    return left;
  return aboveDistance <= upperLeftDistance ? above : upperLeft;
}

function decodePng(buffer) {
  if (!buffer.subarray(0, 8).equals(pngSignature))
    throw new Error("Invalid PNG signature");

  let offset = 8;
  let header = null;
  const compressed = [];
  while (offset < buffer.length) {
    const length = buffer.readUInt32BE(offset);
    const type = buffer.toString("ascii", offset + 4, offset + 8);
    const dataStart = offset + 8;
    const dataEnd = dataStart + length;
    if (dataEnd + 4 > buffer.length) throw new Error("Truncated PNG chunk");
    const chunk = buffer.subarray(dataStart, dataEnd);
    if (type === "IHDR") {
      header = {
        width: chunk.readUInt32BE(0),
        height: chunk.readUInt32BE(4),
        bitDepth: chunk[8],
        colorType: chunk[9],
        compression: chunk[10],
        filter: chunk[11],
        interlace: chunk[12],
      };
    } else if (type === "IDAT") compressed.push(chunk);
    else if (type === "IEND") break;
    offset = dataEnd + 4;
  }
  if (!header || compressed.length === 0) throw new Error("Incomplete PNG");
  if (
    header.bitDepth !== 8 ||
    ![2, 6].includes(header.colorType) ||
    header.compression !== 0 ||
    header.filter !== 0 ||
    header.interlace !== 0
  )
    throw new Error("PNG must be non-interlaced 8-bit RGB or RGBA");

  const channels = header.colorType === 6 ? 4 : 3;
  const stride = header.width * channels;
  const raw = inflateSync(Buffer.concat(compressed));
  if (raw.length !== (stride + 1) * header.height)
    throw new Error("Unexpected PNG scanline length");
  const pixels = Buffer.alloc(stride * header.height);
  for (let y = 0; y < header.height; y += 1) {
    const rawRow = y * (stride + 1);
    const filter = raw[rawRow];
    for (let x = 0; x < stride; x += 1) {
      const encoded = raw[rawRow + 1 + x];
      const outputOffset = y * stride + x;
      const left = x >= channels ? pixels[outputOffset - channels] : 0;
      const above = y > 0 ? pixels[outputOffset - stride] : 0;
      const upperLeft =
        y > 0 && x >= channels ? pixels[outputOffset - stride - channels] : 0;
      let value;
      if (filter === 0) value = encoded;
      else if (filter === 1) value = encoded + left;
      else if (filter === 2) value = encoded + above;
      else if (filter === 3) value = encoded + Math.floor((left + above) / 2);
      else if (filter === 4)
        value = encoded + paethPredictor(left, above, upperLeft);
      else throw new Error(`Unsupported PNG filter ${filter}`);
      pixels[outputOffset] = value & 0xff;
    }
  }
  return { ...header, channels, pixels };
}

const fullBleedContracts = {
  "home-full-bleed": {
    file: "home-full-bleed.png",
    sourceArtifact: "repository:assets/images/backgrounds/rituals-home-v1.jpg",
    sourceSha256:
      "93815a818e3284ad49966a5465cb35588aef79fe5c7f2c2608921e1d2decf560",
    historicalSourceArtifact:
      "codex-generated-image:019fec7b-07ab-7e50-b974-99cbc704a158/exec-2793319e-6892-448e-9789-b2887cefd5e8.png",
    historicalSourceSha256:
      "bdb63bbb1b1b1f3c0c25c5d5070b2b7a914404866769b38ffd63941f1eabdfb4",
    sourcePixelSha256:
      "da94d78648a44f563d466f37860e4d243e5b4212436360edf99792e72caed78a",
    sourceWidth: 864,
    sourceHeight: 1821,
    sourceCrop: { left: 2, right: 2, top: 0, bottom: 0 },
    retainedPixelSha256:
      "e1e5ddaba1d004962feddabe1442904e2cbb5e1d2b0bb9fad5d98c65ab1701ae",
    retainedWidth: 860,
    retainedHeight: 1821,
    targetWidth: 860,
    targetHeight: 1864,
    padding: { left: 0, right: 0, top: 21, bottom: 22 },
    bytes: 2_259_322,
    sha256: "3678acaf5c56c5579d80cdc12fa04a1777671059b358e0e57baaf982b456ba16",
  },
  "player-full-bleed": {
    file: "player-full-bleed.png",
    sourceArtifact:
      "repository:assets/images/backgrounds/player-presence-minima-source.png",
    sourceSha256:
      "87724132e08a2ab7cb5887d991018dbeae9ae08f9d2026ec31d03d5e7f909c4c",
    historicalSourceArtifact:
      "task:01a0b6b3-29c3-7ea3-9092-2441282fa3ea/hybrid-clean-plate.png",
    historicalSourceSha256:
      "87724132e08a2ab7cb5887d991018dbeae9ae08f9d2026ec31d03d5e7f909c4c",
    sourcePixelSha256:
      "20526d9855ff3c530ea1d6b64f981c31f2c6c41ec3bee9da6688eb0cc748aa31",
    sourceWidth: 1024,
    sourceHeight: 1536,
    sourceCrop: { left: 82, right: 82, top: 0, bottom: 0 },
    retainedPixelSha256:
      "fd1bd6ad9798b10208d0210647faf9cf2ea9c4953032bd9a8e510fee4f3519b6",
    retainedWidth: 860,
    retainedHeight: 1536,
    targetWidth: 860,
    targetHeight: 1536,
    padding: { left: 0, right: 0, top: 0, bottom: 0 },
    bytes: 2_381_357,
    sha256: "e748f0505ed64b384e91ab6a790c69c5c02676ec98e657394b9e582f67f7abec",
  },
};

async function validateFullBleedArtwork(manifestPath) {
  const manifest = JSON.parse(readFileSync(manifestPath, "utf8"));
  if (
    manifest.schemaVersion !== 1 ||
    manifest.method !==
      "center-crop-width-and-mirror-pad-minimum-no-resample" ||
    manifest.generator !== "scripts/derive-full-bleed-artwork.mjs" ||
    manifest.jimpCompactVersion !== "0.16.1" ||
    manifest.assets.length !== 2
  )
    throw new Error("Full-bleed artwork manifest contract failed");

  const keys = manifest.assets.map(({ key }) => key);
  if (
    JSON.stringify(keys) !==
    JSON.stringify(["home-full-bleed", "player-full-bleed"])
  )
    throw new Error("Full-bleed artwork keys or order changed");

  for (const asset of manifest.assets) {
    const contract = fullBleedContracts[asset.key];
    if (
      !contract ||
      JSON.stringify(asset) !== JSON.stringify({ key: asset.key, ...contract })
    )
      throw new Error(`${asset.key}: provenance contract changed`);
    if (
      asset.retainedWidth !==
        asset.sourceWidth - asset.sourceCrop.left - asset.sourceCrop.right ||
      asset.retainedHeight !==
        asset.sourceHeight - asset.sourceCrop.top - asset.sourceCrop.bottom ||
      asset.targetWidth < asset.retainedWidth ||
      asset.targetHeight < asset.retainedHeight
    )
      throw new Error(
        `${asset.key}: target is not the minimum full-bleed size`,
      );
    const horizontal = asset.targetWidth - asset.retainedWidth;
    const vertical = asset.targetHeight - asset.retainedHeight;
    if (
      asset.padding.left !== Math.floor(horizontal / 2) ||
      asset.padding.right !== Math.ceil(horizontal / 2) ||
      asset.padding.top !== Math.floor(vertical / 2) ||
      asset.padding.bottom !== Math.ceil(vertical / 2)
    )
      throw new Error(`${asset.key}: padding is not centered and minimal`);

    const path = join(dirname(manifestPath), asset.file);
    const data = readFileSync(path);
    if (data.length !== asset.bytes || data.length > 3_000_000)
      throw new Error(`${asset.file}: byte-size contract failed`);
    if (createHash("sha256").update(data).digest("hex") !== asset.sha256)
      throw new Error(`${asset.file}: SHA-256 mismatch`);
    const decoded = decodePng(data);
    if (
      decoded.width !== asset.targetWidth ||
      decoded.height !== asset.targetHeight
    )
      throw new Error(`${asset.file}: target dimensions changed`);

    if (!asset.sourceArtifact.startsWith("repository:"))
      throw new Error(`${asset.file}: source must be repository-owned`);
    const sourcePath = join(
      projectRoot,
      asset.sourceArtifact.slice("repository:".length),
    );
    const sourceBytes = readFileSync(sourcePath);
    if (
      createHash("sha256").update(sourceBytes).digest("hex") !==
      asset.sourceSha256
    )
      throw new Error(`${asset.file}: authoritative source SHA-256 changed`);
    const source = await Jimp.read(sourceBytes);
    if (
      source.bitmap.width !== asset.sourceWidth ||
      source.bitmap.height !== asset.sourceHeight ||
      createHash("sha256").update(source.bitmap.data).digest("hex") !==
        asset.sourcePixelSha256
    )
      throw new Error(`${asset.file}: decoded authoritative source changed`);

    const retainedHash = createHash("sha256");
    for (let y = 0; y < asset.retainedHeight; y += 1) {
      const sourceStart =
        ((asset.sourceCrop.top + y) * source.bitmap.width +
          asset.sourceCrop.left) *
        4;
      retainedHash.update(
        source.bitmap.data.subarray(
          sourceStart,
          sourceStart + asset.retainedWidth * 4,
        ),
      );
    }
    if (retainedHash.digest("hex") !== asset.retainedPixelSha256)
      throw new Error(`${asset.file}: retained source pixels changed`);

    const centralHash = createHash("sha256");
    const rowBytes = decoded.width * decoded.channels;
    for (let y = 0; y < asset.retainedHeight; y += 1) {
      const rowStart =
        (asset.padding.top + y) * rowBytes +
        asset.padding.left * decoded.channels;
      centralHash.update(
        decoded.pixels.subarray(
          rowStart,
          rowStart + asset.retainedWidth * decoded.channels,
        ),
      );
    }
    if (centralHash.digest("hex") !== asset.retainedPixelSha256)
      throw new Error(`${asset.file}: approved central pixels changed`);

    for (let y = 0; y < decoded.height; y += 1) {
      const sourceY =
        y < asset.padding.top
          ? asset.padding.top + asset.padding.top - 1 - y
          : y >= asset.padding.top + asset.retainedHeight
            ? asset.padding.top +
              asset.retainedHeight -
              1 -
              (y - asset.padding.top - asset.retainedHeight)
            : y;
      for (let x = 0; x < decoded.width; x += 1) {
        if (
          x >= asset.padding.left &&
          x < asset.padding.left + asset.retainedWidth &&
          y >= asset.padding.top &&
          y < asset.padding.top + asset.retainedHeight
        )
          continue;
        const sourceX =
          x < asset.padding.left
            ? asset.padding.left + asset.padding.left - 1 - x
            : x >= asset.padding.left + asset.retainedWidth
              ? asset.padding.left +
                asset.retainedWidth -
                1 -
                (x - asset.padding.left - asset.retainedWidth)
              : x;
        const actual = (y * decoded.width + x) * decoded.channels;
        const expected = (sourceY * decoded.width + sourceX) * decoded.channels;
        for (let channel = 0; channel < decoded.channels; channel += 1)
          if (
            decoded.pixels[actual + channel] !==
            decoded.pixels[expected + channel]
          )
            throw new Error(`${asset.file}: reflected border mismatch`);
      }
    }
  }
}

function validateManifest({
  registeredDirectories = [],
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

  const expectedDirectoryEntries = [
    "manifest.json",
    ...files,
    ...registeredDirectories,
  ].sort();
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
  registeredDirectories: ["m6", "player-presence-minima-source.png"],
  manifestPath: backgroundManifestPath,
  maxBytes: 500_000,
});

validateManifest({
  expectedCount: 2,
  expectedHeight: 1844,
  expectedKeys: ["home", "player"],
  expectedWidth: 853,
  label: "M6 painted artwork",
  registeredDirectories: [
    "full-bleed-manifest.json",
    "home-full-bleed.png",
    "player-full-bleed.png",
  ],
  manifestPath: join(dirname(backgroundManifestPath), "m6", "manifest.json"),
  maxBytes: 500_000,
});

await validateFullBleedArtwork(
  join(dirname(backgroundManifestPath), "m6", "full-bleed-manifest.json"),
);

console.log(
  "Artwork validation: PASS (4 ritual + 6 outcome + 1 shell + 2 M6 JPEG + 2 C3 lossless full-bleed PNG; provenance, dimensions, central pixels, reflected borders, size caps and hashes match).",
);
