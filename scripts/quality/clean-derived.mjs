#!/usr/bin/env node
import { rmSync } from "node:fs";
import { dirname, join, relative, resolve } from "node:path";
import { fileURLToPath } from "node:url";

const root = resolve(join(dirname(fileURLToPath(import.meta.url)), "../.."));
const targets = [
  "dist/m5-export-ios",
  "dist/m5-export-android",
  "dist/m5-web-consumer",
  "dist/m5-web-qa",
  "dist/m5-pwa",
  "dist/ci-manifests",
  "coverage",
  "quality/reports",
];
for (const target of targets) {
  const path = resolve(root, target);
  const rel = relative(root, path);
  if (!rel || rel.startsWith(".."))
    throw new Error(`Unsafe cleanup target: ${target}`);
  rmSync(path, { recursive: true, force: true });
}
console.log(`Removed ${targets.length} derived CI path(s).`);
