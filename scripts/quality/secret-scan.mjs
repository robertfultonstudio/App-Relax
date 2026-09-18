#!/usr/bin/env node
import { execFileSync } from "node:child_process";
import { existsSync, lstatSync, readFileSync } from "node:fs";
import { dirname, extname, join } from "node:path";
import { fileURLToPath } from "node:url";
import { candidatePathViolation } from "../lib/repository-admission-policy.mjs";

const root = join(dirname(fileURLToPath(import.meta.url)), "../..");
const paths = execFileSync(
  "git",
  ["ls-files", "--cached", "--others", "--exclude-standard", "-z"],
  { cwd: root, encoding: "utf8", maxBuffer: 20 * 1024 * 1024 },
)
  .split("\0")
  .filter(Boolean)
  .sort();
const credentialExtensions = new Set([
  ".jks",
  ".keystore",
  ".key",
  ".mobileprovision",
  ".p12",
  ".p8",
  ".pem",
]);
const credentialNames = new Set([
  ".env",
  "google-services.json",
  "GoogleService-Info.plist",
]);
const patterns = [
  /-----BEGIN (?:RSA |EC |OPENSSH |DSA )?PRIVATE KEY-----/,
  /A[KS]IA[0-9A-Z]{16}/,
  /gh[pousr]_[A-Za-z0-9_]{20,}/,
  /sk-(?:proj-)?[A-Za-z0-9_-]{20,}/,
  /xox[baprs]-[A-Za-z0-9-]{20,}/,
  /"type"\s*:\s*"service_account"/,
  /https:\/\/[^\s/:]+:[^\s/@]+@/,
];
const violations = [];
let textFiles = 0;
for (const path of paths) {
  const pathViolation = candidatePathViolation(path);
  if (pathViolation) {
    violations.push(`${path}: ${pathViolation}`);
    continue;
  }
  const absolutePath = join(root, path);
  if (!existsSync(absolutePath)) continue;
  const stat = lstatSync(absolutePath);
  if (!stat.isFile()) continue;
  const filename = path.split("/").at(-1);
  if (
    credentialNames.has(filename) ||
    credentialExtensions.has(extname(filename).toLowerCase())
  ) {
    violations.push(`${path}: credential-like file name`);
    continue;
  }
  if (stat.size > 5 * 1024 * 1024) continue;
  const bytes = readFileSync(absolutePath);
  if (bytes.subarray(0, 8192).includes(0)) continue;
  textFiles += 1;
  const text = bytes.toString("utf8");
  if (patterns.some((pattern) => pattern.test(text))) {
    violations.push(`${path}: credential pattern`);
  }
}
if (violations.length) {
  console.error("Repository secret scan: FAIL");
  for (const violation of violations) console.error(`- ${violation}`);
  process.exitCode = 1;
} else {
  console.log(
    `Repository secret scan: PASS (${paths.length} paths, ${textFiles} text files).`,
  );
}
