const acceptedResiduals = new Map([
  [
    "GHSA-w3rx-r6r6-pgpr",
    "ICNS parser DoS constrained by the asset safety gate",
  ],
  [
    "GHSA-5p2g-fcmc-qvqq",
    "JXL/HEIF parser DoS constrained by the asset safety gate",
  ],
]);
const severities = ["info", "low", "moderate", "high", "critical"];
const record = (value) =>
  value !== null && typeof value === "object" && !Array.isArray(value);

/** pnpm's advisory schema only. An absent/failed report is never a clean audit. */
export function evaluateDependencyAudit(report, status) {
  const fail = (message) => {
    throw new Error(`Dependency audit policy: FAIL (${message})`);
  };
  if (status !== 0 && status !== 1) fail(`unexpected exit ${status}`);
  if (
    !record(report) ||
    report.error ||
    !record(report.advisories) ||
    !record(report.metadata?.vulnerabilities)
  )
    fail("missing or failed pnpm audit report");
  const counts = report.metadata.vulnerabilities;
  if (
    Object.keys(counts).some((key) => !severities.includes(key)) ||
    severities.some(
      (key) => !Number.isSafeInteger(counts[key]) || counts[key] < 0,
    )
  )
    fail("invalid vulnerability totals");
  const advisories = Object.values(report.advisories);
  const actualCounts = Object.fromEntries(severities.map((key) => [key, 0]));
  const ids = new Set();
  const accepted = [];
  for (const advisory of advisories) {
    if (!record(advisory)) fail("invalid advisory");
    const id = advisory.github_advisory_id;
    if (!acceptedResiduals.has(id) || ids.has(id))
      fail(`unknown or repeated advisory ${String(id)}`);
    ids.add(id);
    if (
      advisory.module_name !== "image-size" ||
      advisory.severity !== "high" ||
      advisory.vulnerable_versions !== "<=2.0.2" ||
      !Array.isArray(advisory.findings) ||
      advisory.findings.length === 0
    )
      fail(`${id}: exposure changed; review required`);
    for (const finding of advisory.findings) {
      if (
        !record(finding) ||
        finding.version !== "1.2.1" ||
        !Array.isArray(finding.paths) ||
        finding.paths.length === 0 ||
        finding.paths.some(
          (path) =>
            typeof path !== "string" || !path.endsWith(">metro>image-size"),
        )
      )
        fail(`${id}: version or dependency path changed; review required`);
    }
    actualCounts.high++;
    accepted.push(`${id}: ${acceptedResiduals.get(id)}`);
  }
  if (severities.some((key) => counts[key] !== actualCounts[key]))
    fail("advisories and vulnerability totals disagree");
  if (status !== (advisories.length ? 1 : 0))
    fail("exit and advisory count disagree");
  return accepted;
}
