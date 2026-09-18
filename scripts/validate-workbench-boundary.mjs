import { existsSync, readFileSync, readdirSync } from "node:fs";
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
const pwa = expoConfig("pwa");
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
assert(
  pwa.extra?.router?.root === "src/app-pwa",
  "PWA root is not src/app-pwa",
);
assert(pwa.extra?.buildSurface === "pwa", "PWA surface marker is missing");

const easIgnore = readFileSync(join(projectRoot, ".easignore"), "utf8").split(
  "\n",
);
assert(
  easIgnore.includes("/src/app-qa/"),
  "src/app-qa is not excluded from EAS",
);
assert(easIgnore.includes("/src/qa/"), "src/qa is not excluded from EAS");
assert(
  easIgnore.includes("/src/pwa-review/"),
  "private player review is not excluded from EAS",
);
assert(
  easIgnore.includes("/src/app-pwa/"),
  "src/app-pwa is not excluded from EAS",
);

const consumerFiles = filesBelow(join(projectRoot, "src", "app"));
const consumerSource = consumerFiles
  .map(
    (path) => `${relative(projectRoot, path)}\n${readFileSync(path, "utf8")}`,
  )
  .join("\n");
for (const forbidden of [
  "audio-test",
  "/session/",
  "/category/",
  "AUDIO QA WORKBENCH",
  "qa-workbench",
  "@/qa/",
  "@/pwa-review/",
  "src/app-qa",
]) {
  assert(
    !consumerSource.includes(forbidden),
    `consumer route source contains ${forbidden}`,
  );
}

for (const path of [
  "src/audio/createAudioDriver.ts",
  "src/audio/createAudioDriver.web.ts",
  "src/audio/reactNativeAudioApi/ReactNativeAudioDriver.ts",
  "src/audio/web/MetroWebAudioSourceResolver.ts",
]) {
  const contents = readFileSync(join(projectRoot, path), "utf8");
  assert(
    !contents.includes('from "./stemAssets"') &&
      !contents.includes("reactNativeAudioApi/stemAssets"),
    `consumer audio dependency imports the technical registry: ${path}`,
  );
  assert(
    !/consumerAssets|test-pack-01|SLEEP_(?:DRONE|AMBIENCE|TEXTURE)_001/.test(
      contents,
    ),
    `consumer audio dependency contains an ATP01 reference: ${path}`,
  );
}
assert(
  !existsSync(
    join(
      projectRoot,
      "src",
      "audio",
      "reactNativeAudioApi",
      "consumerAssets.ts",
    ),
  ),
  "legacy consumer ATP01 asset map still exists",
);
for (const entry of [
  "/src/audio/reactNativeAudioApi/stemAssets.ts",
  "/assets/audio/test-pack-01/",
]) {
  assert(
    easIgnore.includes(entry),
    `technical-only file not excluded from EAS: ${entry}`,
  );
}

const pwaFiles = filesBelow(join(projectRoot, "src", "app-pwa"));
const pwaRoutes = pwaFiles.map((path) => relative(projectRoot, path));
for (const forbiddenRoute of [
  "src/app-pwa/audio-test.tsx",
  "src/app-pwa/qa-workbench.tsx",
  "src/app-pwa/category",
  "src/app-pwa/session",
]) {
  assert(
    !pwaRoutes.some((path) => path.startsWith(forbiddenRoute)),
    `PWA route source contains ${forbiddenRoute}`,
  );
}
const pwaSource = pwaFiles
  .map(
    (path) => `${relative(projectRoot, path)}\n${readFileSync(path, "utf8")}`,
  )
  .join("\n");
for (const forbidden of ["AUDIO QA WORKBENCH", "qa-workbench", "@/qa/"]) {
  assert(!pwaSource.includes(forbidden), `PWA source contains ${forbidden}`);
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
  `QA/PWA boundary: PASS (${consumerFiles.length} consumer and ${pwaFiles.length} PWA route files clean; roots ${consumer.extra.router.root}/${qa.extra.router.root}/${pwa.extra.router.root}; QA/PWA source excluded from EAS).`,
);
