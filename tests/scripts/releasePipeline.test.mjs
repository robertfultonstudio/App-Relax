import assert from "node:assert/strict";
import { execFileSync, spawnSync } from "node:child_process";
import { createHash, randomUUID } from "node:crypto";
import { mkdirSync, readFileSync, rmSync, writeFileSync } from "node:fs";
import { dirname, join } from "node:path";
import { fileURLToPath } from "node:url";
import test from "node:test";

const root = join(dirname(fileURLToPath(import.meta.url)), "../..");
const currentVersion = JSON.parse(
  readFileSync(join(root, "package.json"), "utf8"),
).version;
const runNode = (script, args = []) =>
  execFileSync(process.execPath, [join(root, script), ...args], {
    cwd: root,
    encoding: "utf8",
  });

test("release check and changelog notes agree with the current version", () => {
  assert.match(
    runNode("scripts/release/version.mjs"),
    new RegExp(`PASS: ${currentVersion.replaceAll(".", "\\.")}`),
  );
  const notes = runNode("scripts/release/version.mjs", [
    "notes",
    currentVersion,
  ]);
  assert.match(notes, /^### /);
});

test("EAS metadata validation creates a public receipt without its signed URL", () => {
  const directory = join(root, "dist", `release-test-${randomUUID()}`);
  mkdirSync(directory, { recursive: true });
  try {
    const rawPath = join(directory, "raw.json");
    const metadataPath = join(directory, "metadata.json");
    const receiptPath = join(directory, "receipt.json");
    writeFileSync(
      rawPath,
      JSON.stringify([
        {
          id: "12345678-1234-1234-1234-123456789abc",
          platform: "ANDROID",
          status: "FINISHED",
          artifacts: { buildUrl: "https://example.invalid/app.aab" },
          appVersion: "1.0.4",
          appBuildVersion: "5",
          gitCommitHash: "abc123",
          fingerprint: { hash: "fingerprint" },
        },
      ]),
    );
    runNode("scripts/release/eas-build-metadata.mjs", [
      rawPath,
      "android",
      metadataPath,
    ]);
    runNode("scripts/release/eas-build-receipt.mjs", [
      metadataPath,
      receiptPath,
    ]);
    const metadata = JSON.parse(readFileSync(metadataPath, "utf8"));
    const receipt = JSON.parse(readFileSync(receiptPath, "utf8"));
    assert.equal(metadata.artifactUrl, "https://example.invalid/app.aab");
    assert.equal(receipt.artifactUrl, undefined);
    assert.equal(receipt.id, "12345678-1234-1234-1234-123456789abc");
    assert.equal(receipt.fingerprintHash, "fingerprint");
  } finally {
    rmSync(directory, { recursive: true, force: true });
  }
});

test("EAS metadata validation rejects an unfinished build", () => {
  const directory = join(root, "dist", `release-test-${randomUUID()}`);
  mkdirSync(directory, { recursive: true });
  try {
    const rawPath = join(directory, "raw.json");
    writeFileSync(
      rawPath,
      JSON.stringify({
        id: "12345678-1234-1234-1234-123456789abc",
        platform: "IOS",
        status: "ERRORED",
        artifacts: { buildUrl: "https://example.invalid/app.ipa" },
      }),
    );
    const result = spawnSync(
      process.execPath,
      [
        join(root, "scripts/release/eas-build-metadata.mjs"),
        rawPath,
        "ios",
        join(directory, "metadata.json"),
      ],
      { cwd: root, encoding: "utf8" },
    );
    assert.notEqual(result.status, 0);
    assert.match(result.stderr, /did not finish successfully/);
  } finally {
    rmSync(directory, { recursive: true, force: true });
  }
});

test("artifact manifest hashes payload and release configuration", () => {
  const directory = join(root, "dist", `release-test-${randomUUID()}`);
  mkdirSync(directory, { recursive: true });
  try {
    const artifactPath = join(directory, "artifact.bin");
    const manifestPath = join(directory, "manifest.json");
    writeFileSync(artifactPath, "reproducible-payload");
    runNode("scripts/release/artifact-manifest.mjs", [
      "--output",
      manifestPath,
      artifactPath,
    ]);
    const manifest = JSON.parse(readFileSync(manifestPath, "utf8"));
    assert.equal(manifest.schema, 1);
    assert.equal(manifest.version, currentVersion);
    assert.equal(
      manifest.files[0].sha256,
      createHash("sha256").update("reproducible-payload").digest("hex"),
    );
    assert.match(
      manifest.configurationSha256["pnpm-lock.yaml"],
      /^[a-f0-9]{64}$/,
    );
  } finally {
    rmSync(directory, { recursive: true, force: true });
  }
});
