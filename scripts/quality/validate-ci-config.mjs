#!/usr/bin/env node
import { readFileSync, readdirSync } from "node:fs";
import { dirname, join } from "node:path";
import { fileURLToPath } from "node:url";
import { parse } from "yaml";

const root = join(dirname(fileURLToPath(import.meta.url)), "../..");
const workflowRoot = join(root, ".github/workflows");
const errors = [];
const fail = (message) => errors.push(message);
const workflows = readdirSync(workflowRoot)
  .filter((file) => /\.ya?ml$/.test(file))
  .sort();
if (!workflows.length) fail("No GitHub Actions workflows found");
for (const file of workflows) {
  const path = join(workflowRoot, file);
  let workflow;
  try {
    workflow = parse(readFileSync(path, "utf8"));
  } catch (error) {
    fail(`${file}: invalid YAML (${error.message})`);
    continue;
  }
  if (!workflow?.name || !workflow?.on || !workflow?.jobs) {
    fail(`${file}: name, on, and jobs are required`);
    continue;
  }
  if (workflow.on.pull_request_target)
    fail(`${file}: pull_request_target is forbidden`);
  if (!workflow.permissions)
    fail(`${file}: explicit top-level permissions are required`);
  for (const [jobId, job] of Object.entries(workflow.jobs)) {
    if (!Number.isInteger(job["timeout-minutes"])) {
      fail(`${file}:${jobId}: timeout-minutes is required`);
    }
    for (const step of job.steps ?? []) {
      if (typeof step.uses !== "string" || step.uses.startsWith("./")) continue;
      if (!/@[0-9a-f]{40}$/i.test(step.uses)) {
        fail(
          `${file}:${jobId}: action must be pinned to a full commit SHA (${step.uses})`,
        );
      }
    }
  }
}
const release = parse(readFileSync(join(workflowRoot, "release.yml"), "utf8"));
const prepareRelease = parse(
  readFileSync(join(workflowRoot, "prepare-release.yml"), "utf8"),
);
const ci = parse(readFileSync(join(workflowRoot, "ci.yml"), "utf8"));
const prPolicy = parse(
  readFileSync(join(workflowRoot, "pr-policy.yml"), "utf8"),
);
const requiredJobs = [
  "static-quality",
  "tests",
  "security-boundaries",
  "mobile-exports",
  "web-exports",
];
const requiredGate = ci.jobs?.["required-gate"];
if (!requiredGate) fail("ci.yml requires the aggregate required-gate job");
else {
  const dependencies = Array.isArray(requiredGate.needs)
    ? requiredGate.needs
    : [requiredGate.needs];
  for (const job of requiredJobs) {
    if (!dependencies.includes(job))
      fail(`ci.yml required-gate does not depend on ${job}`);
  }
}
if (release.permissions?.contents !== "write")
  fail("release.yml requires contents: write");
if (!prPolicy.on?.pull_request) fail("pr-policy.yml must run on pull_request");
if (
  prPolicy.permissions?.contents !== "read" ||
  prPolicy.permissions?.["pull-requests"] !== "read"
) {
  fail(
    "pr-policy.yml must use read-only contents and pull-request permissions",
  );
}
for (const [permission, value] of Object.entries(prPolicy.permissions ?? {})) {
  if (value === "write")
    fail(`pr-policy.yml must not grant write permission (${permission})`);
}
const policyGate = prPolicy.jobs?.["policy-gate"];
if (!policyGate) fail("pr-policy.yml requires policy-gate");
else if (
  !(policyGate.steps ?? []).some((step) =>
    String(step.run ?? "").includes("validate-pr-policy.mjs"),
  )
) {
  fail("pr-policy.yml policy-gate must run the PR policy validator");
}
if (
  prepareRelease.permissions?.contents !== "write" ||
  prepareRelease.permissions?.["pull-requests"] !== "write"
) {
  fail("prepare-release.yml requires contents and pull-requests write");
}
for (const environment of [
  "eas-production-android",
  "eas-production-ios",
  "store-android",
  "store-ios",
]) {
  const found = Object.values(release.jobs).some((job) => {
    const name =
      typeof job.environment === "string"
        ? job.environment
        : job.environment?.name;
    return name === environment || String(name).includes("matrix.platform");
  });
  if (!found)
    fail(`release.yml is missing protected environment ${environment}`);
}
const eas = JSON.parse(readFileSync(join(root, "eas.json"), "utf8"));
const pkg = JSON.parse(readFileSync(join(root, "package.json"), "utf8"));
if (eas.cli?.version !== "24.3.0")
  fail("EAS CLI version must be exactly 24.3.0");
if (pkg.devDependencies?.["eas-cli"] !== undefined)
  fail("eas-cli must stay isolated from application dependencies");
const easTool = JSON.parse(
  readFileSync(join(root, "tooling/eas/package.json"), "utf8"),
);
if (easTool.devDependencies?.["eas-cli"] !== "24.3.0")
  fail("isolated EAS toolchain must pin eas-cli exactly to 24.3.0");
if (!pkg.scripts?.["ci:eas-archive"]?.includes("tooling/eas"))
  fail("EAS archive inspection must invoke the isolated toolchain");
if (
  !pkg.scripts?.["ci:eas-archive"]?.includes(
    "tooling/eas/node_modules/.bin/eas",
  )
) {
  fail("EAS commands must execute from the repository root");
}
for (const platform of ["android", "ios"]) {
  const profile = eas.build?.[`production-${platform}`];
  if (
    profile?.distribution !== "store" ||
    profile?.environment !== "production"
  ) {
    fail(
      `EAS production-${platform} must use store distribution and production environment`,
    );
  }
  if (profile?.autoIncrement !== false) {
    fail(
      `EAS production-${platform} must use repository-controlled build numbers`,
    );
  }
  if (profile?.node !== "22.23.1") {
    fail(`EAS production-${platform} must pin Node 22.23.1`);
  }
  if (!profile?.[platform]?.image) {
    fail(`EAS production-${platform} must pin its builder image`);
  }
}
if (
  eas.submit?.["production-android"]?.android?.track !== "internal" ||
  eas.submit?.["production-android"]?.android?.releaseStatus !== "draft"
) {
  fail("Android production submission must remain an internal draft");
}
const baseline = JSON.parse(
  readFileSync(join(root, "quality/ratchet-baseline.json"), "utf8"),
);
for (const key of ["eslint", "prettier"]) {
  if (!Array.isArray(baseline[key]))
    fail(`Ratchet baseline ${key} must be an array`);
  else if (
    key === "prettier" &&
    new Set(baseline[key]).size !== baseline[key].length
  )
    fail(`Ratchet baseline ${key} contains duplicates`);
}
for (const metric of ["statements", "branches", "functions", "lines"]) {
  const value = baseline.coverage?.[metric];
  if (typeof value !== "number" || !Number.isFinite(value) || value < 0) {
    fail(`Ratchet coverage ${metric} must be a non-negative number`);
  }
}
const prTemplate = readFileSync(
  join(root, ".github/pull_request_template.md"),
  "utf8",
);
for (const heading of [
  "## Why",
  "## What changed",
  "## Validation",
  "## Risk and rollback",
]) {
  if (!prTemplate.includes(heading))
    fail(`Pull request template is missing ${heading}`);
}
const codeowners = readFileSync(join(root, ".github/CODEOWNERS"), "utf8");
for (const protectedPath of [
  "/.github/",
  "/quality/",
  "/scripts/quality/",
  "/scripts/release/",
  "/eas.json",
]) {
  if (!codeowners.includes(protectedPath))
    fail(`CODEOWNERS is missing ${protectedPath}`);
}
if (errors.length) {
  console.error(
    `CI configuration: FAIL\n${errors.map((error) => `- ${error}`).join("\n")}`,
  );
  process.exitCode = 1;
} else {
  console.log(`CI configuration: PASS (${workflows.length} workflow files).`);
}
