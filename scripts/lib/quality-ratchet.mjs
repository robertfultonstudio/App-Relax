import { relative, resolve, sep } from "node:path";

const normalizeSlashes = (value) => value.split(sep).join("/");

export function relativeProjectPath(root, file) {
  const path = normalizeSlashes(relative(resolve(root), resolve(file)));
  if (!path || path === ".." || path.startsWith("../")) {
    throw new Error(`Quality ratchet path escapes project root: ${file}`);
  }
  return path;
}

export function lintFingerprint(root, result, message) {
  const path = relativeProjectPath(root, result.filePath);
  const rule = message.ruleId ?? (message.fatal ? "fatal" : "unknown");
  const text = String(message.message ?? "")
    .replace(/\s+/g, " ")
    .trim();
  return `${path}|${rule}|${text}`;
}

export function compareRatchet(current, baseline) {
  const count = (items) => {
    const counts = new Map();
    for (const item of items) counts.set(item, (counts.get(item) ?? 0) + 1);
    return counts;
  };
  const currentCounts = count(current);
  const baselineCounts = count(baseline);
  const added = [];
  const resolved = [];
  for (const [item, total] of currentCounts) {
    for (let index = baselineCounts.get(item) ?? 0; index < total; index++) {
      added.push(item);
    }
  }
  for (const [item, total] of baselineCounts) {
    for (let index = currentCounts.get(item) ?? 0; index < total; index++) {
      resolved.push(item);
    }
  }
  return { added: added.sort(), resolved: resolved.sort() };
}

export function monotonicUpdate(current, baseline) {
  const comparison = compareRatchet(current, baseline);
  if (comparison.added.length) {
    throw new Error(
      `Ratchet baseline cannot grow; fix new violations first:\n${comparison.added.join("\n")}`,
    );
  }
  return [...current].sort();
}

export function compareCoverage(current, baseline, tolerance = 0.01) {
  const regressions = [];
  const improvements = [];
  for (const metric of ["statements", "branches", "functions", "lines"]) {
    if (
      !Number.isFinite(current[metric]) ||
      !Number.isFinite(baseline[metric])
    ) {
      throw new Error(`Coverage metric is invalid: ${metric}`);
    }
    if (current[metric] + tolerance < baseline[metric]) {
      regressions.push({
        metric,
        baseline: baseline[metric],
        current: current[metric],
      });
    } else if (current[metric] > baseline[metric] + tolerance) {
      improvements.push({
        metric,
        baseline: baseline[metric],
        current: current[metric],
      });
    }
  }
  return { regressions, improvements };
}
