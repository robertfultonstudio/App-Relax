#!/usr/bin/env node
import { spawnSync } from "node:child_process";
import { mkdirSync, readFileSync, writeFileSync } from "node:fs";
import { dirname, join } from "node:path";
import { fileURLToPath } from "node:url";
import {
  compareRatchet,
  lintFingerprint,
  monotonicUpdate,
} from "../lib/quality-ratchet.mjs";

const root = join(dirname(fileURLToPath(import.meta.url)), "../..");
const baselinePath = join(root, "quality/ratchet-baseline.json");
const reportPath = join(root, "quality/reports/eslint-ratchet.json");
const update = process.argv.includes("--update");
const baseline = JSON.parse(readFileSync(baselinePath, "utf8"));
const eslint = join(root, "node_modules/eslint/bin/eslint.js");
const result = spawnSync(process.execPath, [eslint, ".", "--format", "json"], {
  cwd: root,
  encoding: "utf8",
  maxBuffer: 64 * 1024 * 1024,
});
if (![0, 1].includes(result.status) || result.error) {
  throw (
    result.error ?? new Error(result.stderr || `ESLint exited ${result.status}`)
  );
}
let parsed;
try {
  parsed = JSON.parse(result.stdout);
} catch (error) {
  throw new Error(`ESLint JSON output is invalid: ${error.message}`);
}
const current = parsed
  .flatMap((file) =>
    file.messages
      .filter((message) => message.severity > 0)
      .map((message) => lintFingerprint(root, file, message)),
  )
  .sort();
const comparison = compareRatchet(current, baseline.eslint);
mkdirSync(dirname(reportPath), { recursive: true });
writeFileSync(
  reportPath,
  `${JSON.stringify(
    {
      baseline: baseline.eslint.length,
      current: current.length,
      added: comparison.added,
      resolved: comparison.resolved,
    },
    null,
    2,
  )}\n`,
);
if (update) {
  baseline.eslint = monotonicUpdate(current, baseline.eslint);
  writeFileSync(baselinePath, `${JSON.stringify(baseline, null, 2)}\n`);
  console.log(
    `ESLint ratchet baseline reduced to ${current.length} violation(s).`,
  );
} else if (comparison.added.length) {
  console.error("ESLint ratchet: FAIL — new violations detected:");
  console.error(comparison.added.join("\n"));
  process.exitCode = 1;
} else {
  console.log(
    `ESLint ratchet: PASS — ${current.length}/${baseline.eslint.length} allowed violation(s).`,
  );
  if (comparison.resolved.length) {
    console.log(
      "Debt decreased; run pnpm lint:ratchet:update and commit the baseline.",
    );
  }
}
