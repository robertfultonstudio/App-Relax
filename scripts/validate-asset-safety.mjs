import { Buffer } from "node:buffer";
import { closeSync, openSync, readSync, readdirSync, statSync } from "node:fs";
import { extname, join, relative, resolve } from "node:path";
import { fileURLToPath } from "node:url";

const projectRoot = resolve(fileURLToPath(new URL("..", import.meta.url)));
const excludedDirectories = new Set([
  ".expo",
  ".git",
  ".pnpm-store",
  "dist",
  "node_modules",
  "output",
  "tmp",
]);
const rejectedExtensions = new Set([
  ".avif",
  ".heic",
  ".heif",
  ".icns",
  ".jxl",
]);
const heifBrands = new Set([
  "avif",
  "heic",
  "heix",
  "hevc",
  "hevx",
  "mif1",
  "msf1",
]);

function collectFiles(directory) {
  const files = [];

  for (const entry of readdirSync(directory, { withFileTypes: true })) {
    if (entry.isDirectory() && excludedDirectories.has(entry.name)) {
      continue;
    }

    const absolutePath = join(directory, entry.name);
    if (entry.isDirectory()) {
      files.push(...collectFiles(absolutePath));
    } else if (entry.isFile()) {
      files.push(absolutePath);
    }
  }

  return files;
}

function hasRejectedSignature(filePath) {
  const size = statSync(filePath).size;
  if (size === 0) {
    return undefined;
  }

  const header = Buffer.alloc(Math.min(size, 64));
  const descriptor = openSync(filePath, "r");
  try {
    readSync(descriptor, header, 0, header.length, 0);
  } finally {
    closeSync(descriptor);
  }
  if (
    header.length >= 4 &&
    header.subarray(0, 4).toString("ascii") === "icns"
  ) {
    return "ICNS";
  }

  if (header.length >= 2 && header[0] === 0xff && header[1] === 0x0a) {
    return "JPEG XL codestream";
  }

  if (
    header.length >= 12 &&
    header.subarray(0, 12).toString("hex") === "0000000c4a584c200d0a870a"
  ) {
    return "JPEG XL container";
  }

  if (
    header.length >= 12 &&
    header.subarray(4, 8).toString("ascii") === "ftyp" &&
    heifBrands.has(header.subarray(8, 12).toString("ascii"))
  ) {
    return "HEIF-family container";
  }

  return undefined;
}

const violations = [];
const files = collectFiles(projectRoot);

for (const filePath of files) {
  const projectPath = relative(projectRoot, filePath);
  const extension = extname(filePath).toLowerCase();

  if (rejectedExtensions.has(extension)) {
    violations.push(`${projectPath}: rejected image extension ${extension}`);
    continue;
  }

  const signature = hasRejectedSignature(filePath);
  if (signature) {
    violations.push(`${projectPath}: rejected ${signature} signature`);
  }
}

if (violations.length > 0) {
  console.error("Asset safety: FAIL");
  for (const violation of violations) {
    console.error(`- ${violation}`);
  }
  process.exitCode = 1;
} else {
  console.log(
    `Asset safety: PASS (${files.length} repository files scanned; risky image formats absent).`,
  );
}
