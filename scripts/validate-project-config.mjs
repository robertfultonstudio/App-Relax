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
const easJson = JSON.parse(readFileSync(join(projectRoot, "eas.json"), "utf8"));
const easIgnore = readFileSync(join(projectRoot, ".easignore"), "utf8");
const iphonePreviewLauncher = readFileSync(
  join(projectRoot, "scripts", "start-iphone-web-preview.mjs"),
  "utf8",
);
const pwaPreviewLauncher = readFileSync(
  join(projectRoot, "scripts", "start-pwa-web-preview.mjs"),
  "utf8",
);
const pwaPreviewCatalog = readFileSync(
  join(projectRoot, "scripts/current-pwa-preview.mjs"),
  "utf8",
);
const metroConfig = readFileSync(join(projectRoot, "metro.config.js"), "utf8");

function assert(condition, message) {
  if (!condition) {
    throw new Error(`Project configuration validation failed: ${message}`);
  }
}

assert(
  packageJson.dependencies.expo === "~57.0.22",
  "Expo SDK 57 must remain pinned",
);
assert(
  packageJson.dependencies["react-native"] === "0.86.3",
  "React Native 0.86.3 must remain pinned",
);
assert(
  packageJson.engines.node === ">=22.13.0",
  "Node engine floor must match SDK 57",
);

for (const requiredIgnore of [
  "/.git/",
  "/.pnpm-store/",
  "node_modules/",
  "/ios/",
  "/android/",
  "*.p8",
  "*.p12",
  "*.pem",
  ".env.*",
  "/output/",
  "/tmp/",
  "/.vscode/",
  "/AGENTS.md",
  "/README.md",
  "/STATO.md",
  "/scripts/",
  "/public/audio-catalog/",
  "/public-pwa/",
  "/src/app-qa/",
  "/src/app-pwa/",
  "/src/qa/",
  "/eslint.config.js",
  "/jest.config.js",
]) {
  assert(
    easIgnore.split("\n").includes(requiredIgnore),
    `.easignore must contain ${requiredIgnore}`,
  );
}

assert(
  easJson.cli?.requireCommit === false,
  "requireCommit must stay false for the validated EAS_NO_VCS build path",
);

assert(
  packageJson.scripts["qa:validate-boundary"] ===
    "node scripts/validate-workbench-boundary.mjs",
  "QA boundary validator script is missing",
);
assert(
  packageJson.scripts["qa:validate-exports"] ===
    "node scripts/validate-workbench-exports.mjs",
  "QA export boundary validator script is missing",
);
for (const scriptName of ["web", "web:qa"]) {
  assert(
    packageJson.scripts[scriptName]?.includes("--localhost"),
    `${scriptName} must bind the local audio preview to loopback`,
  );
}
assert(
  packageJson.scripts["web:iphone"] ===
    "node scripts/start-iphone-web-preview.mjs",
  "iPhone LAN preview must use the guarded local launcher",
);
assert(
  packageJson.scripts["web:iphone:review"] ===
    "node scripts/start-iphone-web-preview.mjs --review",
  "iPhone LAN Review must use the guarded local launcher",
);
assert(
  packageJson.scripts["web:pwa"] === "node scripts/start-pwa-web-preview.mjs",
  "PWA localhost preview must use the guarded launcher",
);
assert(
  pwaPreviewLauncher.includes("createServer(preview.handler)") &&
    pwaPreviewLauncher.includes('server.listen(port, "127.0.0.1"') &&
    pwaPreviewLauncher.includes('join(projectRoot, "dist", "m5-pwa")') &&
    pwaPreviewLauncher.includes("createCurrentPwaPreview({") &&
    pwaPreviewCatalog.includes('"docs/M4_LOCAL_LISTENING_MANIFEST.json"') &&
    pwaPreviewCatalog.includes('"src/pwa-review/flacIndexManifest.json"') &&
    pwaPreviewCatalog.includes('"src/content/localNaturalAudioFiles.json"') &&
    pwaPreviewCatalog.includes('join(projectRoot, "public/audio-catalog")') &&
    !pwaPreviewLauncher.includes("spawn("),
  "PWA preview must serve the static export and approved local audio on loopback without Metro",
);
assert(
  !pwaPreviewLauncher.includes("--lan") &&
    !pwaPreviewLauncher.includes("--tunnel"),
  "PWA preview must not expose the audio catalog beyond loopback",
);
assert(
  iphonePreviewLauncher.includes("EXPO_PUBLIC_APP_RELAX_LAN_PREVIEW_HOST") &&
    iphonePreviewLauncher.includes('BROWSER: "none"') &&
    iphonePreviewLauncher.includes('EXPO_PUBLIC_FOLDER: "public"') &&
    iphonePreviewLauncher.includes('argumentsSet.delete("--review")') &&
    iphonePreviewLauncher.includes('reviewMode ? "qa" : "consumer"') &&
    iphonePreviewLauncher.includes('"--lan"'),
  "iPhone launcher must explicitly select consumer or Review and opt in to the exact LAN host",
);
assert(
  packageJson.scripts["export:web:pwa"]?.includes("APP_RELAX_SURFACE=pwa") &&
    packageJson.scripts["export:web:pwa"]?.includes(
      "EXPO_PUBLIC_FOLDER=public-pwa",
    ) &&
    packageJson.scripts["export:web:pwa"]?.includes("dist/m5-pwa") &&
    packageJson.scripts["export:web:pwa"]?.includes(
      "EXPO_PUBLIC_APP_RELAX_PWA_AUDIO=same-origin",
    ),
  "PWA export must use its dedicated route and public roots",
);
assert(
  !iphonePreviewLauncher.includes("--tunnel"),
  "iPhone preview launcher must never expose a tunnel",
);
assert(
  metroConfig.includes('"audio/flac"') &&
    metroConfig.includes("isFlacRequest") &&
    metroConfig.includes("enhanceMiddleware"),
  "Metro must serve FLAC with the registered audio/flac media type",
);
assert(
  packageJson.scripts["export:web:consumer"]?.includes(
    "dist/m5-web-consumer",
  ) && packageJson.scripts["export:web:qa"]?.includes("dist/m5-web-qa"),
  "consumer and QA web exports must use separate output directories",
);
for (const scriptName of [
  "export:web:consumer",
  "export:web:qa",
  "export:ios:consumer",
  "export:android:consumer",
]) {
  assert(
    packageJson.scripts[scriptName]?.includes(
      "EXPO_PUBLIC_FOLDER=public-mobile",
    ),
    `${scriptName} must exclude the localhost audio catalog via public-mobile`,
  );
  assert(
    packageJson.scripts[scriptName]?.includes("--clear"),
    `${scriptName} must clear transforms when switching consumer/QA/PWA environments`,
  );
}
assert(
  packageJson.scripts["export:web:pwa"]?.includes("--clear"),
  "PWA export must clear transforms from other surfaces before packaging",
);
assert(
  packageJson.scripts["export:validate-native"] ===
    "node scripts/validate-native-export-audio-scope.mjs",
  "native export audio-scope validator script is missing",
);
for (const [profileName, profile] of Object.entries(easJson.build ?? {})) {
  assert(
    profile.env?.EXPO_PUBLIC_APP_RELAX_NATIVE_PREVIEW ===
      (profileName === "preview-android" ? "1" : undefined),
    `EAS profile ${profileName} must keep native catalogue preview scoped to the authorized Android APK`,
  );
  assert(
    profile.env?.APP_RELAX_SURFACE !== "qa",
    `EAS profile ${profileName} must not select the QA router surface`,
  );
  assert(
    profile.env?.APP_RELAX_SURFACE !== "pwa",
    `EAS profile ${profileName} must not select the PWA router surface`,
  );
  assert(
    profile.env?.EXPO_PUBLIC_FOLDER === "public-mobile",
    `EAS profile ${profileName} must exclude the localhost catalog via public-mobile`,
  );
  assert(
    profile.env?.EXPO_PUBLIC_APP_RELAX_LAN_PREVIEW_HOST === undefined,
    `EAS profile ${profileName} must not enable the LAN preview`,
  );
  assert(
    profile.env?.EXPO_PUBLIC_APP_RELAX_PWA === undefined &&
      profile.env?.EXPO_PUBLIC_APP_RELAX_PWA_AUDIO === undefined,
    `EAS profile ${profileName} must not enable the PWA delivery contract`,
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
    JSON.stringify([
      "development-android",
      "development-ios",
      "preview-android",
    ]),
  "expected the two development profiles and one Android preview profile",
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
const previewAndroid = await EasJsonUtils.getBuildProfileAsync(
  accessor,
  Platform.ANDROID,
  "preview-android",
);
assert(
  android.developmentClient && ios.developmentClient,
  "both profiles must build a dev client",
);
assert(
  previewAndroid.developmentClient === false,
  "Android preview must embed the app instead of requiring Metro",
);
assert(
  android.distribution === "internal" &&
    ios.distribution === "internal" &&
    previewAndroid.distribution === "internal",
  "distribution must be internal",
);
assert(
  android.node === "22.23.1" &&
    ios.node === "22.23.1" &&
    previewAndroid.node === "22.23.1",
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
  previewAndroid.image === "ubuntu-26.04-jdk-17-ndk-r27b-sdk-57",
  "unexpected Android preview build image",
);
assert(
  previewAndroid.buildType === "apk",
  "Android preview artifact must be an APK",
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
  `Project config: PASS (SDK 57, ${appleIdentifier}, RNAA plugin, safe public-mobile exports, dev-client and standalone preview profiles).`,
);
console.log(
  `EAS project: @${appConfig.owner}/${appConfig.slug} (${projectId}).`,
);
