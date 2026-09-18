import assert from "node:assert/strict";
import { spawnSync } from "node:child_process";
import { mkdirSync, mkdtempSync, rmSync, writeFileSync } from "node:fs";
import { tmpdir } from "node:os";
import { dirname, join } from "node:path";
import { fileURLToPath } from "node:url";
import { test } from "node:test";

const projectRoot = join(dirname(fileURLToPath(import.meta.url)), "../..");

function write(path, contents = "") {
  mkdirSync(dirname(path), { recursive: true });
  writeFileSync(path, contents);
}

function nativeExport(root, platform, withAudio = false) {
  const directory = join(root, platform);
  write(join(directory, "bundle.js"), "consumer bundle");
  const assets = [];
  if (withAudio) {
    write(join(directory, "assets/forbidden.wav"), "not real audio");
    assets.push({ ext: "wav", path: "assets/forbidden.wav" });
  }
  write(
    join(directory, "metadata.json"),
    JSON.stringify({
      fileMetadata: {
        [platform]: { bundle: "bundle.js", assets },
      },
    }),
  );
  return directory;
}

function easArchive(root, withAudio = false) {
  const directory = join(root, "archive");
  for (const path of [
    "app.config.js",
    "app.json",
    "eas.json",
    "metro.config.js",
    "package.json",
    "pnpm-lock.yaml",
    "pnpm-workspace.yaml",
    "tsconfig.json",
  ])
    write(join(directory, path), "{}");
  if (withAudio)
    write(
      join(directory, "assets/audio/test-pack-01/SLEEP_DRONE_001.wav"),
      "not real audio",
    );
  return directory;
}

function webExports(root, consumerAudio = false) {
  const consumer = join(root, "web-consumer");
  const qa = join(root, "web-qa");
  write(join(consumer, "index.js"), "consumer");
  write(
    join(qa, "index.js"),
    "AUDIO QA WORKBENCH · DEVELOPMENT ONLY Engine room. @app-relax/qa-workbench-draft",
  );
  for (const name of [
    "SLEEP_DRONE_001.wav",
    "SLEEP_AMBIENCE_001.wav",
    "SLEEP_TEXTURE_001.wav",
  ])
    write(join(qa, "assets", name), "qa fixture");
  if (consumerAudio)
    write(join(consumer, "assets/SLEEP_DRONE_001.wav"), "forbidden");
  return { consumer, qa };
}

test("consumer export validators accept zero audio and reject a single ATP01 WAV", () => {
  const root = mkdtempSync(join(tmpdir(), "app-relax-export-boundary-"));
  try {
    const ios = nativeExport(root, "ios");
    const android = nativeExport(root, "android");
    let result = spawnSync(
      process.execPath,
      ["scripts/validate-native-export-audio-scope.mjs", ios, android],
      { cwd: projectRoot, encoding: "utf8" },
    );
    assert.equal(result.status, 0, result.stderr);

    rmSync(ios, { recursive: true });
    nativeExport(root, "ios", true);
    result = spawnSync(
      process.execPath,
      ["scripts/validate-native-export-audio-scope.mjs", ios, android],
      { cwd: projectRoot, encoding: "utf8" },
    );
    assert.notEqual(result.status, 0);
    assert.match(result.stderr, /Audio|audio|WAV|wav/);

    const archive = easArchive(root);
    result = spawnSync(
      process.execPath,
      ["scripts/validate-eas-archive.mjs", archive],
      { cwd: projectRoot, encoding: "utf8" },
    );
    assert.equal(result.status, 0, result.stderr);
    write(
      join(archive, "assets/audio/test-pack-01/SLEEP_DRONE_001.wav"),
      "forbidden",
    );
    result = spawnSync(
      process.execPath,
      ["scripts/validate-eas-archive.mjs", archive],
      { cwd: projectRoot, encoding: "utf8" },
    );
    assert.notEqual(result.status, 0);
    assert.match(result.stderr, /audio scope|ATP01|test-pack|audio/i);

    let web = webExports(root);
    result = spawnSync(
      process.execPath,
      ["scripts/validate-workbench-exports.mjs", web.consumer, web.qa],
      { cwd: projectRoot, encoding: "utf8" },
    );
    assert.equal(result.status, 0, result.stderr);
    rmSync(web.consumer, { recursive: true });
    rmSync(web.qa, { recursive: true });
    web = webExports(root, true);
    result = spawnSync(
      process.execPath,
      ["scripts/validate-workbench-exports.mjs", web.consumer, web.qa],
      { cwd: projectRoot, encoding: "utf8" },
    );
    assert.notEqual(result.status, 0);
    assert.match(result.stderr, /audio|wav|ATP01/i);
  } finally {
    rmSync(root, { recursive: true });
  }
});
