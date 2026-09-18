import assert from "node:assert/strict";
import { test } from "node:test";
import { spawnSync } from "node:child_process";
import { mkdtempSync, writeFileSync, rmSync } from "node:fs";
import { tmpdir } from "node:os";
import { join } from "node:path";
import { evaluateDependencyAudit } from "../../scripts/lib/dependency-audit-policy.mjs";

const counts = (high = 0) => ({
  info: 0,
  low: 0,
  moderate: 0,
  high,
  critical: 0,
});
const clean = () => ({
  advisories: {},
  metadata: { vulnerabilities: counts() },
});
const residual = () => ({
  advisories: {
    one: {
      github_advisory_id: "GHSA-w3rx-r6r6-pgpr",
      module_name: "image-size",
      severity: "high",
      vulnerable_versions: "<=2.0.2",
      findings: [{ version: "1.2.1", paths: [".>expo>metro>image-size"] }],
    },
  },
  metadata: { vulnerabilities: counts(1) },
});
test("accepts only a complete zero report or the exact reviewed exposure", () => {
  assert.deepEqual(evaluateDependencyAudit(clean(), 0), []);
  assert.equal(evaluateDependencyAudit(residual(), 1).length, 1);
});
for (const value of [
  {},
  { error: { code: "ENOLOCK" } },
  { vulnerabilities: {}, metadata: { vulnerabilities: counts() } },
  { advisories: [] },
  null,
]) {
  test(`rejects missing or npm-shaped report ${JSON.stringify(value)}`, () =>
    assert.throws(() => evaluateDependencyAudit(value, 1), /FAIL/));
}
test("rejects missing totals, inconsistent status and network/tool errors", () => {
  for (const [report, status] of [
    [clean(), 1],
    [residual(), 0],
    [clean(), 2],
    [clean(), null],
    [{ ...clean(), metadata: {} }, 0],
    [{ ...clean(), metadata: { vulnerabilities: counts(1) } }, 1],
  ]) {
    assert.throws(() => evaluateDependencyAudit(report, status), /FAIL/);
  }
});
test("rejects new advisory, version, severity, path, empty findings and changed totals", () => {
  for (const patch of [
    { github_advisory_id: "GHSA-unknown" },
    { severity: "critical" },
    { module_name: "other" },
    { vulnerable_versions: "*" },
    { findings: [] },
    { findings: [{ version: "1.2.2", paths: [".>metro>image-size"] }] },
    { findings: [{ version: "1.2.1", paths: [".>app>image-size"] }] },
    { findings: [{ version: "1.2.1", paths: [] }] },
  ]) {
    const report = residual();
    Object.assign(report.advisories.one, patch);
    assert.throws(() => evaluateDependencyAudit(report, 1), /FAIL/);
  }
  const report = residual();
  report.metadata.vulnerabilities.high = 0;
  assert.throws(() => evaluateDependencyAudit(report, 1), /totals disagree/);
});
test("npm invocation fails before a network audit instead of emitting a false green", () => {
  const result = spawnSync(
    process.execPath,
    ["scripts/validate-dependency-audit.mjs"],
    {
      encoding: "utf8",
      env: { ...process.env, npm_execpath: "/example/npm-cli.js" },
    },
  );
  assert.notEqual(result.status, 0);
  assert.match(result.stderr, /requires pnpm/);
  assert.doesNotMatch(result.stdout, /PASS/);
});

test("pnpm mjs/cjs entrypoints accept the reviewed report end to end without a network request", () => {
  const directory = mkdtempSync(join(tmpdir(), "app-relax-audit-fixture-"));
  try {
    for (const extension of ["mjs", "cjs"]) {
      const entrypoint = join(directory, `pnpm.${extension}`);
      writeFileSync(
        entrypoint,
        `console.log(${JSON.stringify(JSON.stringify(residual()))}); process.exitCode = 1;`,
      );
      const result = spawnSync(
        process.execPath,
        ["scripts/validate-dependency-audit.mjs"],
        { encoding: "utf8", env: { ...process.env, npm_execpath: entrypoint } },
      );
      assert.equal(result.status, 0, result.stderr);
      assert.match(result.stdout, /PASS WITH ACCEPTED RESIDUALS/);
    }
  } finally {
    rmSync(directory, { recursive: true });
  }
});
