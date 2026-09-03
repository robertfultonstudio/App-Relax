import { readFileSync, readdirSync } from "node:fs";
import { dirname, join, relative } from "node:path";
import { fileURLToPath } from "node:url";
import { spawnSync } from "node:child_process";

const projectRoot = dirname(dirname(fileURLToPath(import.meta.url)));
const expoCli = join(projectRoot, "node_modules", "expo", "bin", "cli");

function assert(condition, message) {
  if (!condition) throw new Error(`QA boundary validation failed: ${message}`);
}

function expoConfig(surface) {
  const result = spawnSync(process.execPath, [expoCli, "config", "--json"], {
    cwd: projectRoot,
    env: { ...process.env, APP_RELAX_SURFACE: surface },
    encoding: "utf8",
  });
  assert(
    result.status === 0,
    result.stderr || `Expo config failed for ${surface}`,
  );
  return JSON.parse(result.stdout);
}

function filesBelow(directory) {
  return readdirSync(directory, { withFileTypes: true }).flatMap((entry) => {
    const path = join(directory, entry.name);
    return entry.isDirectory() ? filesBelow(path) : [path];
  });
}

const consumer = expoConfig("consumer");
const qa = expoConfig("qa");
assert(
  consumer.extra?.router?.root === "src/app",
  "consumer root is not src/app",
);
assert(
  consumer.extra?.buildSurface === "consumer",
  "consumer surface marker is missing",
);
assert(qa.extra?.router?.root === "src/app-qa", "QA root is not src/app-qa");
assert(qa.extra?.buildSurface === "qa", "QA surface marker is missing");

const easIgnore = readFileSync(join(projectRoot, ".easignore"), "utf8").split(
  "\n",
);
assert(
  easIgnore.includes("/src/app-qa/"),
  "src/app-qa is not excluded from EAS",
);
assert(easIgnore.includes("/src/qa/"), "src/qa is not excluded from EAS");

const consumerFiles = filesBelow(join(projectRoot, "src", "app"));
const consumerSource = consumerFiles
  .map(
    (path) => `${relative(projectRoot, path)}\n${readFileSync(path, "utf8")}`,
  )
  .join("\n");
for (const forbidden of [
  "AUDIO QA WORKBENCH",
  "qa-workbench",
  "@/qa/",
  "src/app-qa",
]) {
  assert(
    !consumerSource.includes(forbidden),
    `consumer route source contains ${forbidden}`,
  );
}

const qaRoute = readFileSync(
  join(projectRoot, "src", "app-qa", "qa-workbench.tsx"),
  "utf8",
);
const qaSurface = readFileSync(
  join(projectRoot, "src", "qa", "AdaptiveQaWorkbench.tsx"),
  "utf8",
);
assert(
  qaRoute.includes("AdaptiveQaWorkbench"),
  "QA route does not mount Workbench",
);
assert(
  qaSurface.includes("AUDIO QA WORKBENCH · DEVELOPMENT ONLY"),
  "development-only sentinel is missing",
);

console.log(
  `QA Workbench boundary: PASS (${consumerFiles.length} consumer route files clean; roots ${consumer.extra.router.root}/${qa.extra.router.root}; QA source excluded from EAS).`,
);
