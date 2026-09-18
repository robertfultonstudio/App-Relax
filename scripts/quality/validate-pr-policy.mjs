#!/usr/bin/env node
import { execFileSync } from "node:child_process";
import { mkdirSync, readFileSync, writeFileSync } from "node:fs";
import { dirname, resolve } from "node:path";
import { validatePullRequestPolicy } from "../lib/pr-policy.mjs";

const args = process.argv.slice(2);
const valueAfter = (flag) => {
  const index = args.indexOf(flag);
  return index >= 0 ? args[index + 1] : undefined;
};
const eventPath = valueAfter("--event") ?? process.env.GITHUB_EVENT_PATH;
const outputPath = resolve(
  valueAfter("--output") ?? "quality/reports/pr-policy.json",
);
if (!eventPath) throw new Error("GitHub pull request event path is required");

const event = JSON.parse(readFileSync(resolve(eventPath), "utf8"));
const pullRequest = event.pull_request;
if (!pullRequest) throw new Error("Event does not contain a pull_request");
const baseSha = pullRequest.base?.sha;
const headSha = pullRequest.head?.sha;
if (!baseSha || !headSha) throw new Error("PR base and head SHA are required");

const rawDiff = execFileSync(
  "git",
  ["diff", "--numstat", `${baseSha}...${headSha}`, "--"],
  { encoding: "utf8" },
);
const diffEntries = rawDiff
  .trim()
  .split("\n")
  .filter(Boolean)
  .map((line) => {
    const [added, deleted, ...pathParts] = line.split("\t");
    const binary = added === "-" || deleted === "-";
    return {
      path: pathParts.join("\t"),
      additions: binary ? 0 : Number.parseInt(added, 10),
      deletions: binary ? 0 : Number.parseInt(deleted, 10),
      binary,
    };
  });
const report = validatePullRequestPolicy({
  branch: pullRequest.head.ref,
  title: pullRequest.title ?? "",
  body: pullRequest.body ?? "",
  labels: (pullRequest.labels ?? []).map((label) => label.name),
  diffEntries,
});
const payload = {
  schema: 1,
  pullRequest: pullRequest.number,
  branch: pullRequest.head.ref,
  title: pullRequest.title,
  baseSha,
  headSha,
  ...report,
};
mkdirSync(dirname(outputPath), { recursive: true });
writeFileSync(outputPath, `${JSON.stringify(payload, null, 2)}\n`);

const summary = [
  "## Pull request policy",
  "",
  `- Reviewable lines: **${report.size.reviewableLines}** (target <= ${report.thresholds.idealLines})`,
  `- Reviewable files: **${report.size.reviewableFiles}** (target <= ${report.thresholds.idealFiles})`,
  `- Mechanical lockfiles excluded from line count: **${report.size.mechanicalFiles}**`,
  `- Binary files: **${report.size.binaryFiles}**`,
  "",
  ...(report.warnings.length
    ? ["### Advisory", ...report.warnings.map((item) => `- ${item}`), ""]
    : []),
  ...(report.errors.length
    ? ["### Blocking", ...report.errors.map((item) => `- ${item}`), ""]
    : ["**PASS** — naming, description and scope policy are satisfied."]),
].join("\n");
if (process.env.GITHUB_STEP_SUMMARY) {
  writeFileSync(process.env.GITHUB_STEP_SUMMARY, `${summary}\n`, { flag: "a" });
}
console.log(summary);
if (report.errors.length) process.exitCode = 1;
