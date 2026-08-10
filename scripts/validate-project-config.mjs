import { readFileSync } from "node:fs";
import { dirname, join } from "node:path";
import { fileURLToPath } from "node:url";
import { EasJsonAccessor, EasJsonUtils, Platform } from "@expo/eas-json";

const projectRoot = dirname(dirname(fileURLToPath(import.meta.url)));
const appConfig = JSON.parse(
  readFileSync(join(projectRoot, "app.json"), "utf8"),
).expo;
const packageJson = JSON.parse(
  readFileSync(join(projectRoot, "package.json"), "utf8"),
);
const easIgnore = readFileSync(join(projectRoot, ".easignore"), "utf8");

function assert(condition, message) {
  if (!condition) {
    throw new Error(`Project configuration validation failed: ${message}`);
  }
}

assert(
  packageJson.dependencies.expo === "~57.0.12",
  "Expo SDK 57 must remain pinned",
);
assert(
  packageJson.dependencies["react-native"] === "0.86.2",
  "React Native 0.86.2 must remain pinned",
);
assert(
  packageJson.engines.node === ">=22.13.0",
  "Node engine floor must match SDK 57",
);

for (const requiredIgnore of [
  "/.git/",
  "node_modules/",
  "/ios/",
  "/android/",
  "*.p8",
  "*.p12",
  "*.pem",
  ".env.*",
  "/output/",
  "/tmp/",
]) {
  assert(
    easIgnore.split("\n").includes(requiredIgnore),
    `.easignore must contain ${requiredIgnore}`,
  );
}

const appleIdentifier = appConfig.ios?.bundleIdentifier;
const androidIdentifier = appConfig.android?.package;
const identifierPattern = /^[a-z][a-z0-9]*(\.[a-z][a-z0-9]*){2,}$/;
assert(
  identifierPattern.test(appleIdentifier),
  "invalid iOS bundle identifier syntax",
);
assert(
  identifierPattern.test(androidIdentifier),
  "invalid Android package syntax",
);
assert(
  appleIdentifier === androidIdentifier,
  "platform identifiers must share one canonical value",
);

const audioPlugin = appConfig.plugins.find(
  (plugin) => Array.isArray(plugin) && plugin[0] === "react-native-audio-api",
);
assert(audioPlugin, "React Native Audio API config plugin is missing");
assert(
  audioPlugin[1].iosBackgroundMode === true,
  "iOS audio background mode is not configured",
);
assert(
  audioPlugin[1].androidForegroundService === true,
  "Android foreground service is not configured",
);
assert(
  audioPlugin[1].androidFSTypes?.includes("mediaPlayback"),
  "Android mediaPlayback foreground-service type is missing",
);

const accessor = EasJsonAccessor.fromProjectPath(projectRoot);
await accessor.readAsync();
const profileNames = (
  await EasJsonUtils.getBuildProfileNamesAsync(accessor)
).sort();
assert(
  JSON.stringify(profileNames) ===
    JSON.stringify(["development-android", "development-ios"]),
  "expected exactly two separated development profiles",
);

const android = await EasJsonUtils.getBuildProfileAsync(
  accessor,
  Platform.ANDROID,
  "development-android",
);
const ios = await EasJsonUtils.getBuildProfileAsync(
  accessor,
  Platform.IOS,
  "development-ios",
);
assert(
  android.developmentClient && ios.developmentClient,
  "both profiles must build a dev client",
);
assert(
  android.distribution === "internal" && ios.distribution === "internal",
  "distribution must be internal",
);
assert(
  android.node === "22.23.1" && ios.node === "22.23.1",
  "EAS Node version must be pinned",
);
assert(
  android.image === "ubuntu-26.04-jdk-17-ndk-r27b-sdk-57",
  "unexpected Android build image",
);
assert(
  android.buildType === "apk",
  "Android development artifact must be an APK",
);
assert(
  ios.image === "macos-tahoe-26.5-xcode-26.6",
  "unexpected iOS build image",
);

const projectId = appConfig.extra?.eas?.projectId;
assert(
  projectId === "e1d77255-66f4-45c1-b1fa-c503a088b30f",
  "unexpected EAS projectId",
);
assert(
  appConfig.owner === "robert-fulton-studio",
  "unexpected EAS project owner",
);
assert(appConfig.slug === "app-relax", "unexpected EAS project slug");
console.log(
  `Project config: PASS (SDK 57, ${appleIdentifier}, RNAA plugin, separate EAS profiles).`,
);
console.log(
  `EAS project: @${appConfig.owner}/${appConfig.slug} (${projectId}).`,
);
