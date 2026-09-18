#!/usr/bin/env node

import { spawnSync } from "node:child_process";
import { writeFileSync } from "node:fs";
import { dirname, join } from "node:path";
import { fileURLToPath } from "node:url";
import { EasJsonAccessor, EasJsonUtils, Platform } from "@expo/eas-json";

const [platformName, profileName, outputPath] = process.argv.slice(2);
const platforms = {
  android: Platform.ANDROID,
  ios: Platform.IOS,
};
const platform = platforms[platformName];
if (!platform || !profileName || !outputPath) {
  throw new Error(
    "Usage: resolve-eas-config-offline.mjs <android|ios> PROFILE OUTPUT_JSON",
  );
}

const root = dirname(dirname(fileURLToPath(import.meta.url)));
const accessor = EasJsonAccessor.fromProjectPath(root);
const buildProfile = await EasJsonUtils.getBuildProfileAsync(
  accessor,
  platform,
  profileName,
);
const expoBinary = join(root, "node_modules", ".bin", "expo");
const result = spawnSync(expoBinary, ["config", "--type", "public", "--json"], {
  cwd: root,
  encoding: "utf8",
  env: {
    ...process.env,
    ...buildProfile.env,
    EAS_BUILD_PROFILE: profileName,
  },
});
if (result.status !== 0) {
  throw new Error(
    `Expo config failed for ${platformName}: ${result.stderr || result.stdout}`,
  );
}
const appConfig = JSON.parse(result.stdout);
writeFileSync(
  outputPath,
  `${JSON.stringify({ buildProfile, appConfig }, null, 2)}\n`,
);
console.log(
  `Offline EAS config: PASS (${platformName}, ${profileName}; no account or remote environment lookup).`,
);
