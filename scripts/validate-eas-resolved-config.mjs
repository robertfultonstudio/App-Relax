import { readFileSync } from "node:fs";
import { dirname, join } from "node:path";
import { fileURLToPath } from "node:url";

const [androidPath, iosPath] = process.argv.slice(2);
if (!androidPath || !iosPath) {
  throw new Error(
    "Usage: validate-eas-resolved-config.mjs ANDROID_JSON IOS_JSON",
  );
}
const root = dirname(dirname(fileURLToPath(import.meta.url)));
const packageJson = JSON.parse(
  readFileSync(join(root, "package.json"), "utf8"),
);
const appJson = JSON.parse(readFileSync(join(root, "app.json"), "utf8")).expo;
const expected = {
  android: {
    path: androidPath,
    buildNumber: appJson.android.versionCode,
    image: "ubuntu-26.04-jdk-17-ndk-r27b-sdk-57",
  },
  ios: {
    path: iosPath,
    buildNumber: appJson.ios.buildNumber,
    image: "macos-tahoe-26.5-xcode-26.6",
  },
};
for (const [platform, expectation] of Object.entries(expected)) {
  const resolved = JSON.parse(readFileSync(expectation.path, "utf8"));
  const profile = resolved.buildProfile;
  const config = resolved.appConfig;
  if (
    config?.version !== packageJson.version ||
    (platform === "android"
      ? config?.android?.versionCode !== expectation.buildNumber
      : config?.ios?.buildNumber !== expectation.buildNumber) ||
    profile?.distribution !== "store" ||
    profile?.environment !== "production" ||
    profile?.developmentClient !== false ||
    profile?.autoIncrement !== false ||
    profile?.node !== "22.23.1" ||
    profile?.image !== expectation.image ||
    profile?.env?.EXPO_PUBLIC_FOLDER !== "public-mobile"
  ) {
    throw new Error(`Resolved EAS ${platform} production config changed`);
  }
  if (platform === "android" && profile?.buildType !== "app-bundle") {
    throw new Error("Resolved EAS Android build must produce an app bundle");
  }
}
console.log(
  `Resolved EAS config: PASS (${packageJson.version}, Android ${appJson.android.versionCode}, iOS ${appJson.ios.buildNumber}, pinned production builders).`,
);
