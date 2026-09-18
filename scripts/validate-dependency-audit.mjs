import { spawnSync } from "node:child_process";
import { basename } from "node:path";
import { evaluateDependencyAudit } from "./lib/dependency-audit-policy.mjs";

const entrypoint = process.env.npm_execpath;
if (
  entrypoint &&
  !["pnpm", "pnpm.js", "pnpm.cjs", "pnpm.mjs"].includes(basename(entrypoint))
) {
  throw new Error(
    "Dependency audit requires pnpm: use pnpm security:audit, not npm run security:audit.",
  );
}
const audit = spawnSync(
  entrypoint ? process.execPath : "pnpm",
  entrypoint ? [entrypoint, "audit", "--json"] : ["audit", "--json"],
  { encoding: "utf8", maxBuffer: 20 * 1024 * 1024, timeout: 60000 },
);
if (audit.error)
  throw new Error(`Dependency audit could not run: ${audit.error.message}`);
let report;
try {
  report = JSON.parse(audit.stdout);
} catch {
  throw new Error("Dependency audit returned invalid or empty JSON.");
}
const accepted = evaluateDependencyAudit(report, audit.status);
console.log(
  accepted.length
    ? "Dependency audit policy: PASS WITH ACCEPTED RESIDUALS"
    : "Dependency audit policy: PASS (no advisories detected).",
);
for (const finding of accepted) console.log(`- ${finding}`);
if (accepted.length) console.log("Recheck upstream before every EAS build.");
