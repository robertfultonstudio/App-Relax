import assert from "node:assert/strict";
import { execFileSync, spawnSync } from "node:child_process";
import { mkdtempSync, readFileSync, rmSync, writeFileSync } from "node:fs";
import { tmpdir } from "node:os";
import { join } from "node:path";
import test from "node:test";
import { validatePullRequestPolicy } from "../../scripts/lib/pr-policy.mjs";

const validBody = `
## Why
Riduce i passaggi prima dell'ascolto.

## What changed
Avvia la sessione dalla Home.

## Validation
Test UI e typecheck.

## Risk and rollback
Rischio limitato alla navigazione; revert dello squash commit.
`;

test("accepts a coherent, reviewable pull request", () => {
  const report = validatePullRequestPolicy({
    branch: "feat/one-tap-listening",
    title: "feat(home): start listening in one tap",
    body: validBody,
    diffEntries: [
      { path: "src/app/index.tsx", additions: 80, deletions: 20 },
      { path: "tests/ui/home.test.tsx", additions: 70, deletions: 0 },
    ],
  });
  assert.deepEqual(report.errors, []);
  assert.deepEqual(report.warnings, []);
});

test("rejects invalid naming and incomplete descriptions", () => {
  const report = validatePullRequestPolicy({
    branch: "my changes",
    title: "Various updates",
    body: "No structured review context",
  });
  assert.equal(report.errors.length, 6);
});

test("warns above the target and gates very large pull requests", () => {
  const entries = Array.from({ length: 20 }, (_, index) => ({
    path: `src/feature/file-${index}.ts`,
    additions: 70,
    deletions: 0,
  }));
  const blocked = validatePullRequestPolicy({
    branch: "feat/large-migration",
    title: "feat(storage): migrate the offline index",
    body: validBody,
    diffEntries: entries,
  });
  assert.equal(blocked.warnings.length, 1);
  assert.equal(blocked.errors.length, 1);

  const approved = validatePullRequestPolicy({
    branch: "feat/large-migration",
    title: "feat(storage): migrate the offline index",
    body: validBody,
    labels: ["large-pr-approved"],
    diffEntries: entries,
  });
  assert.deepEqual(approved.errors, []);
});

test("excludes lockfile churn from reviewable line thresholds", () => {
  const report = validatePullRequestPolicy({
    branch: "chore/update-dependencies",
    title: "chore(deps): update Expo packages",
    body: validBody,
    diffEntries: [
      { path: "package.json", additions: 5, deletions: 5 },
      { path: "pnpm-lock.yaml", additions: 5000, deletions: 4500 },
    ],
  });
  assert.equal(report.size.reviewableLines, 10);
  assert.equal(report.size.mechanicalFiles, 1);
  assert.deepEqual(report.errors, []);
});

test("accepts the managed Dependabot namespace", () => {
  const report = validatePullRequestPolicy({
    branch: "dependabot/npm_and_yarn/expo-runtime-123abc",
    title: "build(deps): update the Expo runtime group",
    body: validBody,
  });
  assert.deepEqual(report.errors, []);
});

test("CLI reads a GitHub event and measures the three-dot diff", () => {
  const directory = mkdtempSync(join(tmpdir(), "app-relax-pr-policy-"));
  try {
    const runGit = (...args) =>
      execFileSync("git", args, { cwd: directory, encoding: "utf8" }).trim();
    runGit("init", "-b", "main");
    runGit("config", "user.name", "PR Policy Test");
    runGit("config", "user.email", "test@example.invalid");
    writeFileSync(join(directory, "app.ts"), "export const value = 1;\n");
    runGit("add", "app.ts");
    runGit("commit", "-m", "chore: create base");
    const baseSha = runGit("rev-parse", "HEAD");
    runGit("switch", "-c", "fix/session-resume");
    writeFileSync(join(directory, "app.ts"), "export const value = 2;\n");
    runGit("add", "app.ts");
    runGit("commit", "-m", "fix: resume session");
    const headSha = runGit("rev-parse", "HEAD");
    const eventPath = join(directory, "event.json");
    const outputPath = join(directory, "report.json");
    writeFileSync(
      eventPath,
      JSON.stringify({
        pull_request: {
          number: 7,
          title: "fix(player): resume the current session",
          body: validBody,
          labels: [],
          base: { sha: baseSha },
          head: { sha: headSha, ref: "fix/session-resume" },
        },
      }),
    );
    const result = spawnSync(
      process.execPath,
      [
        join(process.cwd(), "scripts/quality/validate-pr-policy.mjs"),
        "--event",
        eventPath,
        "--output",
        outputPath,
      ],
      { cwd: directory, encoding: "utf8" },
    );
    assert.equal(result.status, 0, result.stderr);
    const report = JSON.parse(readFileSync(outputPath, "utf8"));
    assert.equal(report.pullRequest, 7);
    assert.equal(report.size.reviewableFiles, 1);
    assert.equal(report.size.reviewableLines, 2);
  } finally {
    rmSync(directory, { recursive: true, force: true });
  }
});
