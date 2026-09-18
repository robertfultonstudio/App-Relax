#!/usr/bin/env node
import { readFileSync, writeFileSync } from "node:fs";

const [input, platform, output] = process.argv.slice(2);
if (!input || !["android", "ios"].includes(platform) || !output) {
  throw new Error("Usage: eas-build-metadata.mjs INPUT android|ios OUTPUT");
}
const raw = JSON.parse(readFileSync(input, "utf8"));
const build = Array.isArray(raw) ? raw[0] : raw;
if (!build || typeof build !== "object")
  throw new Error("EAS build JSON is empty");
const id = build.id;
const buildPlatform = String(build.platform ?? "").toLowerCase();
const artifactUrl =
  build.artifacts?.buildUrl ??
  build.artifacts?.applicationArchiveUrl ??
  build.applicationArchiveUrl ??
  build.artifactUrl;
if (!/^[0-9a-f-]{36}$/i.test(id ?? ""))
  throw new Error("EAS build id is invalid");
if (buildPlatform && buildPlatform !== platform) {
  throw new Error(`EAS platform ${buildPlatform} != ${platform}`);
}
if (!/^https:\/\//.test(artifactUrl ?? "")) {
  throw new Error("EAS build artifact URL is missing or not HTTPS");
}
const metadata = {
  schema: 1,
  id,
  platform,
  status: build.status,
  artifactUrl,
  appVersion: build.appVersion,
  buildNumber: build.appBuildVersion,
  gitCommitHash: build.gitCommitHash,
  fingerprintHash: build.fingerprint?.hash ?? build.fingerprintHash,
};
if (metadata.status && metadata.status !== "FINISHED") {
  throw new Error(`EAS build did not finish successfully: ${metadata.status}`);
}
writeFileSync(output, `${JSON.stringify(metadata, null, 2)}\n`);
console.log(`EAS build metadata PASS: ${platform} ${id}`);
