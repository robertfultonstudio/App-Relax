#!/usr/bin/env node
import { execFileSync } from "node:child_process";
import { readFileSync, writeFileSync } from "node:fs";
import { dirname, join } from "node:path";
import { fileURLToPath } from "node:url";

const root = join(dirname(fileURLToPath(import.meta.url)), "../..");
const packagePath = join(root, "package.json");
const appPath = join(root, "app.json");
const changelogPath = join(root, "CHANGELOG.md");
const easPath = join(root, "eas.json");
const semverPattern = /^(0|[1-9]\d*)\.(0|[1-9]\d*)\.(0|[1-9]\d*)$/;
const readJson = (path) => JSON.parse(readFileSync(path, "utf8"));
const writeJson = (path, value) =>
  writeFileSync(path, `${JSON.stringify(value, null, 2)}\n`);

function parseVersion(version) {
  const match = semverPattern.exec(version);
  if (!match)
    throw new Error(`Release version must be stable SemVer: ${version}`);
  return match.slice(1).map(Number);
}

function compareVersions(left, right) {
  const a = parseVersion(left);
  const b = parseVersion(right);
  for (let index = 0; index < 3; index++) {
    if (a[index] !== b[index]) return Math.sign(a[index] - b[index]);
  }
  return 0;
}

function state() {
  const pkg = readJson(packagePath);
  const app = readJson(appPath);
  const eas = readJson(easPath);
  const version = pkg.version;
  parseVersion(version);
  if (app.expo.version !== version) {
    throw new Error(`package.json ${version} != app.json ${app.expo.version}`);
  }
  if (
    !Number.isSafeInteger(app.expo.android?.versionCode) ||
    app.expo.android.versionCode < 1
  ) {
    throw new Error("android.versionCode must be a positive integer");
  }
  if (!/^\d+$/.test(app.expo.ios?.buildNumber ?? "")) {
    throw new Error("ios.buildNumber must be a positive integer string");
  }
  if (Number(app.expo.ios.buildNumber) < 1)
    throw new Error("ios.buildNumber must be positive");
  if (eas.cli?.appVersionSource !== "local") {
    throw new Error('eas.json must retain appVersionSource: "local"');
  }
  for (const profile of ["production-android", "production-ios"]) {
    if (!eas.build?.[profile])
      throw new Error(`Missing EAS build profile: ${profile}`);
  }
  return { pkg, app, eas, version };
}

function assertTag(version, tag) {
  if (tag !== `v${version}`)
    throw new Error(`Tag ${tag} does not match v${version}`);
  const type = execFileSync("git", ["cat-file", "-t", `refs/tags/${tag}`], {
    cwd: root,
    encoding: "utf8",
  }).trim();
  if (type !== "tag")
    throw new Error("Release tags must be annotated, not lightweight");
}

function prepare(target) {
  const { pkg, app, version } = state();
  if (compareVersions(target, version) <= 0) {
    throw new Error(`Target ${target} must be greater than ${version}`);
  }
  const changelog = readFileSync(changelogPath, "utf8");
  const marker = "## [Unreleased]\n";
  const start = changelog.indexOf(marker);
  const next = changelog.indexOf("\n## [", start + marker.length);
  if (start < 0 || next < 0)
    throw new Error("Changelog requires Unreleased and a prior release");
  const body = changelog.slice(start + marker.length, next).trim();
  if (!/^### /m.test(body) || !/^- /m.test(body)) {
    throw new Error(
      "Unreleased changelog must contain a heading and at least one entry",
    );
  }
  const date = new Date().toISOString().slice(0, 10);
  const replacement = `## [Unreleased]\n\n### Added\n\n## [${target}] - ${date}\n\n${body}\n`;
  pkg.version = target;
  app.expo.version = target;
  app.expo.android.versionCode += 1;
  app.expo.ios.buildNumber = String(Number(app.expo.ios.buildNumber) + 1);
  writeJson(packagePath, pkg);
  writeJson(appPath, app);
  writeFileSync(
    changelogPath,
    changelog.slice(0, start) + replacement + changelog.slice(next),
  );
  console.log(
    `Prepared ${target}: Android ${app.expo.android.versionCode}, iOS ${app.expo.ios.buildNumber}.`,
  );
}

function notes(version) {
  const changelog = readFileSync(changelogPath, "utf8");
  const heading = new RegExp(
    `^## \\[${version.replaceAll(".", "\\.")}\\] - `,
    "m",
  );
  const match = heading.exec(changelog);
  if (!match) throw new Error(`No changelog section for ${version}`);
  const bodyStart = changelog.indexOf("\n", match.index) + 1;
  const next = changelog.indexOf("\n## [", bodyStart);
  const body = changelog.slice(bodyStart, next < 0 ? undefined : next).trim();
  if (!body) throw new Error(`Changelog section ${version} is empty`);
  process.stdout.write(body + "\n");
}

const [command = "check", argument] = process.argv.slice(2);
if (command === "check") {
  const { version, app } = state();
  if (argument) assertTag(version, argument);
  console.log(
    `Release version PASS: ${version} (Android ${app.expo.android.versionCode}, iOS ${app.expo.ios.buildNumber}).`,
  );
} else if (command === "prepare") {
  if (!argument) throw new Error("Usage: version.mjs prepare <x.y.z>");
  prepare(argument);
} else if (command === "notes") {
  if (!argument) throw new Error("Usage: version.mjs notes <x.y.z>");
  notes(argument);
} else {
  throw new Error(`Unknown release command: ${command}`);
}
