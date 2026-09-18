import assert from "node:assert/strict";
import { test } from "node:test";
import {
  candidatePathViolation,
  validateAdmissionPaths,
} from "../../scripts/lib/repository-admission-policy.mjs";

test("rejects credential, environment, service and private Codex paths", () => {
  for (const path of [
    ".env",
    ".env.production",
    ".npmrc",
    ".codex/config.toml",
    "android/debug.keystore",
    "secrets/service.json",
    "credentials.json",
    "google-services.json",
    "ios/GoogleService-Info.plist",
    "signing/app.mobileprovision",
  ]) {
    assert.match(candidatePathViolation(path) ?? "", /credential|reserved/);
  }
});

test("rejects every non-allowlisted local catalog asset regardless of extension", () => {
  for (const path of [
    "public/audio-catalog/UNAPPROVED.wav",
    "public/audio-catalog/UNAPPROVED.flac",
    "public/audio-catalog/UNAPPROVED.mp3",
    "public/audio-catalog/UNAPPROVED.m4a",
    "public/audio-catalog/metadata.json",
    "public/audio-catalog/nested/metadata.json",
  ]) {
    assert.equal(
      candidatePathViolation(path),
      "local audio catalog path is not explicitly allowlisted",
    );
  }
  assert.equal(candidatePathViolation("public/audio-catalog/README.md"), null);
});

test("fails a candidate atomically when one forbidden path is present", () => {
  assert.throws(
    () =>
      validateAdmissionPaths([
        "src/app/index.tsx",
        "public/audio-catalog/README.md",
        "public/audio-catalog/future.opus",
      ]),
    /future\.opus/,
  );
  assert.doesNotThrow(() =>
    validateAdmissionPaths([
      "src/app/index.tsx",
      "public/audio-catalog/README.md",
    ]),
  );
});
