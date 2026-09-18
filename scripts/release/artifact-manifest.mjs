#!/usr/bin/env node
import { execFileSync } from "node:child_process";
import {
  lstatSync,
  mkdirSync,
  readdirSync,
  readFileSync,
  writeFileSync,
} from "node:fs";
import { createHash } from "node:crypto";
import { dirname, join, relative, resolve, sep } from "node:path";
import { fileURLToPath } from "node:url";

const root = resolve(join(dirname(fileURLToPath(import.meta.url)), "../.."));
const args = process.argv.slice(2);
const outputIndex = args.indexOf("--output");
if (outputIndex < 0 || !args[outputIndex + 1]) {
  throw new Error("Usage: artifact-manifest.mjs --output FILE PATH [PATH ...]");
}
const output = resolve(root, args[outputIndex + 1]);
const requireClean = args.includes("--require-clean");
const requested = args.filter(
  (argument, index) =>
    index !== outputIndex &&
    index !== outputIndex + 1 &&
    argument !== "--require-clean",
);
if (!requested.length)
  throw new Error("At least one artifact path is required");
const slash = (value) => value.split(sep).join("/");
const sha256 = (bytes) => createHash("sha256").update(bytes).digest("hex");
const insideRoot = (path) => {
  const rel = slash(relative(root, path));
  if (!rel || rel === ".." || rel.startsWith("../")) {
    throw new Error(`Artifact path escapes project root: ${path}`);
  }
  return rel;
};
insideRoot(output);

const files = [];
function walk(path) {
  const stat = lstatSync(path);
  if (stat.isSymbolicLink())
    throw new Error(`Artifact symlink is not allowed: ${path}`);
  if (stat.isDirectory()) {
    for (const child of readdirSync(path).sort()) walk(join(path, child));
    return;
  }
  if (!stat.isFile() || path === output) return;
  const bytes = readFileSync(path);
  files.push({
    path: insideRoot(path),
    bytes: stat.size,
    sha256: sha256(bytes),
  });
}
for (const item of requested) walk(resolve(root, item));
files.sort((left, right) => left.path.localeCompare(right.path));
if (!files.length) throw new Error("Artifact set is empty");
const git = (...gitArgs) =>
  execFileSync("git", gitArgs, { cwd: root, encoding: "utf8" }).trim();
const pkg = JSON.parse(readFileSync(join(root, "package.json"), "utf8"));
const app = JSON.parse(readFileSync(join(root, "app.json"), "utf8"));
const dirtyWorktree = Boolean(git("status", "--porcelain"));
if (requireClean && dirtyWorktree) {
  throw new Error("Artifact manifest requires a clean source worktree");
}
const configurationFiles = [
  "app.json",
  "eas.json",
  "package.json",
  "pnpm-lock.yaml",
];
const manifest = {
  schema: 1,
  product: "App Relax",
  version: pkg.version,
  androidVersionCode: app.expo.android.versionCode,
  iosBuildNumber: app.expo.ios.buildNumber,
  gitCommit: git("rev-parse", "HEAD"),
  sourceDateEpoch: Number(git("show", "-s", "--format=%ct", "HEAD")),
  dirtyWorktree,
  releaseRef: process.env.GITHUB_REF_NAME ?? null,
  ciRunId: process.env.GITHUB_RUN_ID ?? null,
  runtime: { node: process.version, packageManager: pkg.packageManager },
  configurationSha256: Object.fromEntries(
    configurationFiles.map((path) => [
      path,
      sha256(readFileSync(join(root, path))),
    ]),
  ),
  files,
};
mkdirSync(dirname(output), { recursive: true });
writeFileSync(output, `${JSON.stringify(manifest, null, 2)}\n`);
console.log(
  `Artifact manifest PASS: ${files.length} file(s) -> ${insideRoot(output)}`,
);
