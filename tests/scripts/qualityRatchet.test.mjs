import assert from "node:assert/strict";
import { test } from "node:test";
import {
  compareCoverage,
  compareRatchet,
  lintFingerprint,
  monotonicUpdate,
  relativeProjectPath,
} from "../../scripts/lib/quality-ratchet.mjs";

test("ratchet rejects new debt and reports resolved debt", () => {
  assert.deepEqual(compareRatchet(["a", "b"], ["a"]), {
    added: ["b"],
    resolved: [],
  });
  assert.deepEqual(compareRatchet(["a"], ["a", "b"]), {
    added: [],
    resolved: ["b"],
  });
});

test("ratchet treats duplicate violations as separate debt", () => {
  assert.deepEqual(compareRatchet(["a", "a"], ["a"]), {
    added: ["a"],
    resolved: [],
  });
});

test("baseline updates can only stay equal or shrink", () => {
  assert.deepEqual(monotonicUpdate(["a"], ["a", "b"]), ["a"]);
  assert.throws(() => monotonicUpdate(["a", "c"], ["a", "b"]), /cannot grow/);
});

test("lint fingerprints ignore line movement but retain path, rule, and message", () => {
  const root = "/project";
  const result = { filePath: "/project/src/a.ts" };
  const first = lintFingerprint(root, result, {
    ruleId: "example/rule",
    message: "A   stable message",
    line: 2,
  });
  const moved = lintFingerprint(root, result, {
    ruleId: "example/rule",
    message: "A stable message",
    line: 200,
  });
  assert.equal(first, moved);
  assert.equal(first, "src/a.ts|example/rule|A stable message");
});

test("project-relative paths fail closed outside the repository", () => {
  assert.equal(
    relativeProjectPath("/project", "/project/src/a.ts"),
    "src/a.ts",
  );
  assert.throws(
    () => relativeProjectPath("/project", "/other/a.ts"),
    /escapes/,
  );
});

test("coverage ratchet blocks regressions and reports improvements", () => {
  assert.deepEqual(
    compareCoverage(
      { statements: 80, branches: 70, functions: 75, lines: 82 },
      { statements: 79, branches: 71, functions: 75, lines: 81 },
    ),
    {
      regressions: [{ metric: "branches", baseline: 71, current: 70 }],
      improvements: [
        { metric: "statements", baseline: 79, current: 80 },
        { metric: "lines", baseline: 81, current: 82 },
      ],
    },
  );
});
