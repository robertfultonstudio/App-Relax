#!/usr/bin/env node

import { rm } from "node:fs/promises";
import { dirname, join, resolve } from "node:path";
import { fileURLToPath, pathToFileURL } from "node:url";

const [outputArgument] = process.argv.slice(2);
if (!outputArgument) {
  throw new Error("Usage: create-eas-archive-offline.mjs OUTPUT_DIRECTORY");
}

const root = dirname(dirname(fileURLToPath(import.meta.url)));
const output = resolve(outputArgument);
if (root === output || root.startsWith(`${output}/`)) {
  throw new Error("Archive output cannot contain the project root");
}

const localVcsModule = join(
  root,
  "tooling",
  "eas",
  "node_modules",
  "eas-cli",
  "build",
  "vcs",
  "local.js",
);
const { makeShallowCopyAsync } = await import(pathToFileURL(localVcsModule));
await rm(output, { recursive: true, force: true });
await makeShallowCopyAsync(root, output);
console.log(
  `Offline EAS archive: PASS (${output}; .easignore applied without account access).`,
);
