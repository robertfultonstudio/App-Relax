#!/usr/bin/env node
import { spawnSync } from "node:child_process";
import { mkdirSync, readFileSync, writeFileSync } from "node:fs";
import { dirname, join } from "node:path";
import { fileURLToPath } from "node:url";
import { compareRatchet, monotonicUpdate } from "../lib/quality-ratchet.mjs";

const root = join(dirname(fileURLToPath(import.meta.url)), "../..");
const baselinePath = join(root, "quality/ratchet-baseline.json");
const reportPath = join(root, "quality/reports/prettier-ratchet.json");
const update = process.argv.includes("--update");
const baseline = JSON.parse(readFileSync(baselinePath, "utf8"));
const prettier = join(root, "node_modules/prettier/bin/prettier.cjs");
const result = spawnSync(
  process.execPath,
  [prettier, "**/*.{js,mjs,json,md,ts,tsx,yml,yaml}", "--list-different"],
  { cwd: root, encoding: "utf8", maxBuffer: 64 * 1024 * 1024 },
);
if (![0, 1].includes(result.status) || result.error) {
  throw (
    result.error ??
    new Error(result.stderr || `Prettier exited ${result.status}`)
  );
}
const current = result.stdout
  .split(/\r?\n/)
  .map((line) => line.trim())
  .filter(Boolean)
  .sort();
const comparison = compareRatchet(current, baseline.prettier);
mkdirSync(dirname(reportPath), { recursive: true });
writeFileSync(
  reportPath,
  `${JSON.stringify(
    {
      baseline: baseline.prettier.length,
      current: current.length,
      added: comparison.added,
      resolved: comparison.resolved,
    },
    null,
    2,
  )}\n`,
);
if (update) {
  baseline.prettier = monotonicUpdate(current, baseline.prettier);
  writeFileSync(baselinePath, `${JSON.stringify(baseline, null, 2)}\n`);
  console.log(
    `Prettier ratchet baseline reduced to ${current.length} file(s).`,
  );
} else if (comparison.added.length) {
  console.error("Prettier ratchet: FAIL — newly unformatted files detected:");
  console.error(comparison.added.join("\n"));
  process.exitCode = 1;
} else {
  console.log(
    `Prettier ratchet: PASS — ${current.length}/${baseline.prettier.length} allowed file(s).`,
  );
  if (comparison.resolved.length) {
    console.log(
      "Debt decreased; run pnpm format:ratchet:update and commit the baseline.",
    );
  }
}
