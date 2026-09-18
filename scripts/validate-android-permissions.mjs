import assert from "node:assert/strict";
import { spawnSync } from "node:child_process";

// Config introspection evaluates plugins in memory. It is not prebuild/Gradle.
for (const profile of ["development-android", "preview-android"]) {
  const result = spawnSync(
    process.execPath,
    ["node_modules/expo/bin/cli", "config", "--type", "introspect", "--json"],
    {
      env: {
        ...process.env,
        APP_RELAX_SURFACE: "consumer",
        EAS_BUILD_PROFILE: profile,
      },
      encoding: "utf8",
      timeout: 30000,
      maxBuffer: 4 * 1024 * 1024,
    },
  );
  assert.equal(result.status, 0, result.stderr || result.error?.message);
  const manifest = JSON.parse(result.stdout)._internal.modResults.android
    .manifest.manifest;
  const permissions = manifest["uses-permission"].map((p) => p.$);
  const removed = (name) =>
    permissions.some(
      (p) =>
        p["android:name"] === `android.permission.${name}` &&
        p["tools:node"] === "remove",
    );
  for (const name of ["READ_EXTERNAL_STORAGE", "WRITE_EXTERNAL_STORAGE"])
    assert(removed(name), `${profile}: broad storage permission not removed`);
  assert.equal(
    removed("SYSTEM_ALERT_WINDOW"),
    profile === "preview-android",
    `${profile}: overlay scope incorrect`,
  );
  for (const name of [
    "INTERNET",
    "FOREGROUND_SERVICE",
    "FOREGROUND_SERVICE_MEDIA_PLAYBACK",
    "POST_NOTIFICATIONS",
  ])
    assert(
      permissions.some(
        (p) =>
          p["android:name"] === `android.permission.${name}` &&
          p["tools:node"] !== "remove",
      ),
      `${profile}: playback permission missing`,
    );
  assert(
    manifest.application[0].service.some(
      (service) =>
        service.$["android:foregroundServiceType"] === "mediaPlayback",
    ),
    `${profile}: media service missing`,
  );
  console.log(
    `PASS ${profile}: storage removals, scoped overlay policy, media service and permissions (introspected; final APK merge not tested).`,
  );
}
