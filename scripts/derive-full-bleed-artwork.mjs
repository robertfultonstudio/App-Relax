#!/usr/bin/env node

import { Buffer } from "node:buffer";
import { createHash } from "node:crypto";
import {
  existsSync,
  mkdirSync,
  readFileSync,
  renameSync,
  unlinkSync,
  writeFileSync,
} from "node:fs";
import { basename, dirname, join, relative, resolve } from "node:path";
import { fileURLToPath } from "node:url";
import Jimp from "jimp-compact";

const projectRoot = resolve(fileURLToPath(new URL("..", import.meta.url)));
const check = process.argv.includes("--check");

const specs = [
  {
    key: "home-full-bleed",
    source: join(projectRoot, "assets/images/backgrounds/rituals-home-v1.jpg"),
    sourceArtifact: "repository:assets/images/backgrounds/rituals-home-v1.jpg",
    sourceSha256:
      "93815a818e3284ad49966a5465cb35588aef79fe5c7f2c2608921e1d2decf560",
    historicalSourceArtifact:
      "codex-generated-image:019fec7b-07ab-7e50-b974-99cbc704a158/exec-2793319e-6892-448e-9789-b2887cefd5e8.png",
    historicalSourceSha256:
      "bdb63bbb1b1b1f3c0c25c5d5070b2b7a914404866769b38ffd63941f1eabdfb4",
    sourceSize: [864, 1821],
    sourceCrop: { left: 2, right: 2, top: 0, bottom: 0 },
    targetSize: [860, 1864],
    output: join(
      projectRoot,
      "assets/images/backgrounds/m6/home-full-bleed.png",
    ),
  },
  {
    key: "player-full-bleed",
    source: join(
      projectRoot,
      "assets/images/backgrounds/player-presence-minima-source.png",
    ),
    sourceArtifact:
      "repository:assets/images/backgrounds/player-presence-minima-source.png",
    sourceSha256:
      "87724132e08a2ab7cb5887d991018dbeae9ae08f9d2026ec31d03d5e7f909c4c",
    historicalSourceArtifact:
      "task:01a0b6b3-29c3-7ea3-9092-2441282fa3ea/hybrid-clean-plate.png",
    historicalSourceSha256:
      "87724132e08a2ab7cb5887d991018dbeae9ae08f9d2026ec31d03d5e7f909c4c",
    sourceSize: [1024, 1536],
    sourceCrop: { left: 82, right: 82, top: 0, bottom: 0 },
    targetSize: [860, 1536],
    output: join(
      projectRoot,
      "assets/images/backgrounds/m6/player-full-bleed.png",
    ),
  },
];

const hash = (data) => createHash("sha256").update(data).digest("hex");

function reflectedCoordinate(value, offset, retainedSize) {
  if (value < offset) return offset - 1 - value;
  if (value >= offset + retainedSize)
    return retainedSize - 1 - (value - offset - retainedSize);
  return value - offset;
}

function retainedPixels(source, crop) {
  const width = source.bitmap.width - crop.left - crop.right;
  const height = source.bitmap.height - crop.top - crop.bottom;
  const pixels = Buffer.alloc(width * height * 4);
  for (let y = 0; y < height; y += 1) {
    const sourceStart = ((crop.top + y) * source.bitmap.width + crop.left) * 4;
    source.bitmap.data.copy(
      pixels,
      y * width * 4,
      sourceStart,
      sourceStart + width * 4,
    );
  }
  return { height, pixels, width };
}

async function derive(spec) {
  const sourceBytes = readFileSync(spec.source);
  if (hash(sourceBytes) !== spec.sourceSha256)
    throw new Error(`${spec.source}: approved source SHA-256 mismatch`);
  const source = await Jimp.read(sourceBytes);
  if (
    source.bitmap.width !== spec.sourceSize[0] ||
    source.bitmap.height !== spec.sourceSize[1]
  )
    throw new Error(`${spec.source}: approved source dimensions changed`);

  const retained = retainedPixels(source, spec.sourceCrop);
  const [targetWidth, targetHeight] = spec.targetSize;
  if (targetWidth < retained.width || targetHeight < retained.height)
    throw new Error(`${spec.key}: target would crop retained source pixels`);
  const padding = {
    left: Math.floor((targetWidth - retained.width) / 2),
    right: Math.ceil((targetWidth - retained.width) / 2),
    top: Math.floor((targetHeight - retained.height) / 2),
    bottom: Math.ceil((targetHeight - retained.height) / 2),
  };
  const outputPixels = Buffer.alloc(targetWidth * targetHeight * 4);
  for (let y = 0; y < targetHeight; y += 1) {
    const retainedY = reflectedCoordinate(y, padding.top, retained.height);
    for (let x = 0; x < targetWidth; x += 1) {
      const retainedX = reflectedCoordinate(x, padding.left, retained.width);
      const sourceOffset = (retainedY * retained.width + retainedX) * 4;
      const outputOffset = (y * targetWidth + x) * 4;
      retained.pixels.copy(
        outputPixels,
        outputOffset,
        sourceOffset,
        sourceOffset + 4,
      );
    }
  }

  const output = new Jimp(targetWidth, targetHeight);
  output.bitmap.data = outputPixels;
  output.deflateLevel(9).deflateStrategy(3).filterType(-1);
  const outputBytes = await output.getBufferAsync(Jimp.MIME_PNG);
  if (check) {
    if (
      !existsSync(spec.output) ||
      !readFileSync(spec.output).equals(outputBytes)
    )
      throw new Error(`${spec.output}: derived output is missing or stale`);
  } else {
    mkdirSync(dirname(spec.output), { recursive: true });
    const temporary = join(
      dirname(spec.output),
      `.${basename(spec.output)}.${process.pid}.tmp`,
    );
    try {
      writeFileSync(temporary, outputBytes);
      renameSync(temporary, spec.output);
    } finally {
      if (existsSync(temporary)) unlinkSync(temporary);
    }
  }

  return {
    key: spec.key,
    method: "center-crop-width-and-mirror-pad-minimum-no-resample",
    sourceArtifact: spec.sourceArtifact,
    sourceSha256: spec.sourceSha256,
    historicalSourceArtifact: spec.historicalSourceArtifact,
    historicalSourceSha256: spec.historicalSourceSha256,
    sourcePixelSha256: hash(source.bitmap.data),
    sourceWidth: source.bitmap.width,
    sourceHeight: source.bitmap.height,
    sourceCrop: spec.sourceCrop,
    retainedPixelSha256: hash(retained.pixels),
    retainedWidth: retained.width,
    retainedHeight: retained.height,
    targetWidth,
    targetHeight,
    padding,
    output: relative(projectRoot, spec.output),
    outputBytes: outputBytes.length,
    outputSha256: hash(outputBytes),
  };
}

const report = [];
for (const spec of specs) report.push(await derive(spec));
process.stdout.write(`${JSON.stringify(report, null, 2)}\n`);
