import { spawnSync } from "node:child_process";
import { basename, dirname } from "node:path";
import { fileURLToPath } from "node:url";

const root = dirname(dirname(fileURLToPath(import.meta.url)));
const pnpmEntrypoint = process.env.npm_execpath;
if (
  pnpmEntrypoint &&
  !["pnpm", "pnpm.js", "pnpm.cjs", "pnpm.mjs"].includes(
    basename(pnpmEntrypoint),
  )
) {
  throw new Error("EAS tool audit must be invoked through pnpm");
}
const command = pnpmEntrypoint ? process.execPath : "pnpm";
const args = pnpmEntrypoint
  ? [pnpmEntrypoint, "--dir", "tooling/eas", "audit", "--json"]
  : ["--dir", "tooling/eas", "audit", "--json"];
const audit = spawnSync(command, args, {
  cwd: root,
  encoding: "utf8",
  maxBuffer: 20 * 1024 * 1024,
  timeout: 60000,
});
if (audit.error)
  throw new Error(`EAS tool audit could not run: ${audit.error.message}`);
let report;
try {
  report = JSON.parse(audit.stdout);
} catch {
  throw new Error("EAS tool audit returned invalid or empty JSON");
}

const allowed = new Map([
  ["1112706", { module: "diff", severity: "low", versions: ["7.0.0"] }],
  [
    "1119441",
    {
      module: "uuid",
      severity: "moderate",
      versions: ["7.0.3", "8.3.2"],
    },
  ],
  [
    "1121318",
    { module: "ts-deepmerge", severity: "moderate", versions: ["6.2.0"] },
  ],
]);
const advisories = report.advisories;
if (!advisories || typeof advisories !== "object")
  throw new Error("EAS tool audit is missing advisories");
const accepted = [];
for (const [id, advisory] of Object.entries(advisories)) {
  const expectation = allowed.get(id);
  if (!expectation)
    throw new Error(`EAS tool audit found an unreviewed advisory ${id}`);
  const versions = [
    ...new Set((advisory.findings ?? []).map((finding) => finding.version)),
  ].sort();
  if (
    advisory.module_name !== expectation.module ||
    advisory.severity !== expectation.severity ||
    JSON.stringify(versions) !== JSON.stringify(expectation.versions)
  ) {
    throw new Error(`EAS tool advisory ${id} changed shape`);
  }
  const paths = (advisory.findings ?? []).flatMap(
    (finding) => finding.paths ?? [],
  );
  if (!paths.length || paths.some((path) => !path.startsWith(".>eas-cli>"))) {
    throw new Error(`EAS tool advisory ${id} escaped its isolated toolchain`);
  }
  accepted.push(`${id} ${expectation.module}@${versions.join(",")}`);
}
const totals = report.metadata?.vulnerabilities;
if (
  !totals ||
  totals.critical !== 0 ||
  totals.high !== 0 ||
  totals.moderate !== 2 ||
  totals.low !== 1
) {
  throw new Error("EAS tool audit totals changed from the reviewed residual");
}
const resolved = [...allowed.keys()].filter((id) => !advisories[id]);
console.log(
  `EAS tool audit: PASS WITH REVIEWED RESIDUALS (${accepted.length} present, ${resolved.length} resolved; zero high/critical).`,
);
for (const item of accepted.sort()) console.log(`- ${item}`);
if (resolved.length) {
  console.log(
    `Remove resolved IDs from the allowlist: ${resolved.sort().join(", ")}`,
  );
}
