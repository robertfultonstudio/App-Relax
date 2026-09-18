#!/usr/bin/env node
import { mkdirSync, readFileSync, writeFileSync } from "node:fs";
import { dirname, join } from "node:path";
import { fileURLToPath } from "node:url";
import { compareCoverage } from "../lib/quality-ratchet.mjs";

const root = join(dirname(fileURLToPath(import.meta.url)), "../..");
const baselinePath = join(root, "quality/ratchet-baseline.json");
const summaryPath = join(root, "coverage/coverage-summary.json");
const reportPath = join(root, "quality/reports/coverage-ratchet.json");
const update = process.argv.includes("--update");
const baseline = JSON.parse(readFileSync(baselinePath, "utf8"));
const summary = JSON.parse(readFileSync(summaryPath, "utf8"));
const current = Object.fromEntries(
  ["statements", "branches", "functions", "lines"].map((metric) => [
    metric,
    summary.total?.[metric]?.pct,
  ]),
);
const comparison = compareCoverage(current, baseline.coverage);
mkdirSync(dirname(reportPath), { recursive: true });
writeFileSync(
  reportPath,
  `${JSON.stringify({ baseline: baseline.coverage, current, ...comparison }, null, 2)}\n`,
);
if (comparison.regressions.length) {
  console.error("Coverage ratchet: FAIL — coverage regressed:");
  for (const item of comparison.regressions) {
    console.error(`- ${item.metric}: ${item.current}% < ${item.baseline}%`);
  }
  process.exitCode = 1;
} else if (update) {
  baseline.coverage = Object.fromEntries(
    Object.keys(current).map((metric) => [
      metric,
      Math.max(current[metric], baseline.coverage[metric]),
    ]),
  );
  writeFileSync(baselinePath, `${JSON.stringify(baseline, null, 2)}\n`);
  console.log(
    "Coverage ratchet baseline updated without decreasing any metric.",
  );
} else {
  console.log(
    `Coverage ratchet: PASS — statements ${current.statements}%, branches ${current.branches}%, functions ${current.functions}%, lines ${current.lines}%.`,
  );
  if (comparison.improvements.length) {
    console.log(
      "Coverage improved; run pnpm coverage:ratchet:update and commit the baseline.",
    );
  }
}
