import { spawnSync } from "node:child_process";

const acceptedResiduals = new Map([
  [
    "GHSA-w3rx-r6r6-pgpr",
    {
      moduleName: "image-size",
      version: "1.2.1",
      reason: "unpatched ICNS parser DoS constrained by the asset safety gate",
    },
  ],
  [
    "GHSA-5p2g-fcmc-qvqq",
    {
      moduleName: "image-size",
      version: "1.2.1",
      reason:
        "unpatched JXL/HEIF parser DoS constrained by the asset safety gate",
    },
  ],
]);

const audit = spawnSync("pnpm", ["audit", "--json"], {
  encoding: "utf8",
  maxBuffer: 20 * 1024 * 1024,
});

if (audit.error) {
  throw new Error(`Dependency audit could not run: ${audit.error.message}`);
}

if (audit.status !== 0 && audit.status !== 1) {
  throw new Error(
    `Dependency audit failed unexpectedly with exit ${String(audit.status)}: ${audit.stderr.trim()}`,
  );
}

let report;
try {
  report = JSON.parse(audit.stdout);
} catch (error) {
  throw new Error(`Dependency audit returned invalid JSON: ${String(error)}`);
}

const advisories = Object.values(report.advisories ?? {});
const unexpected = [];
const accepted = [];

for (const advisory of advisories) {
  const id = advisory.github_advisory_id;
  const policy = acceptedResiduals.get(id);

  if (!policy) {
    unexpected.push(`${id ?? advisory.id}: ${advisory.title}`);
    continue;
  }

  const versions = new Set(
    advisory.findings?.map((finding) => finding.version) ?? [],
  );
  if (
    advisory.module_name !== policy.moduleName ||
    versions.size !== 1 ||
    !versions.has(policy.version)
  ) {
    unexpected.push(
      `${id}: dependency/version changed and requires a new review`,
    );
    continue;
  }

  accepted.push(`${id}: ${policy.reason}`);
}

if (unexpected.length > 0) {
  console.error("Dependency audit policy: FAIL");
  for (const finding of unexpected) {
    console.error(`- ${finding}`);
  }
  process.exitCode = 1;
} else if (accepted.length > 0) {
  console.log("Dependency audit policy: PASS WITH ACCEPTED RESIDUALS");
  for (const finding of accepted) {
    console.log(`- ${finding}`);
  }
  console.log("Recheck upstream before every EAS build.");
} else {
  console.log("Dependency audit policy: PASS (no advisories detected).");
}
