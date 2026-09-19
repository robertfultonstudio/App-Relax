import assert from "node:assert/strict";
import { execFileSync } from "node:child_process";
import { test } from "node:test";
import { resolve } from "node:path";

const projectRoot = resolve(import.meta.dirname, "../..");

test("C3 full-bleed derivation preserves every retained source pixel without resampling", () => {
  const output = execFileSync(
    "node",
    ["scripts/derive-full-bleed-artwork.mjs", "--check"],
    { cwd: projectRoot, encoding: "utf8" },
  );
  const report = JSON.parse(output);
  assert.deepEqual(
    report.map(({ key }) => key),
    ["home-full-bleed", "player-full-bleed"],
  );
  assert.deepEqual(
    report.map(({ sourceArtifact }) => sourceArtifact),
    [
      "repository:assets/images/backgrounds/rituals-home-v1.jpg",
      "repository:assets/images/backgrounds/player-presence-minima-source.png",
    ],
  );
  assert.deepEqual(report[0].sourceCrop, {
    bottom: 0,
    left: 2,
    right: 2,
    top: 0,
  });
  assert.deepEqual(
    report.map(({ targetWidth, targetHeight }) => [targetWidth, targetHeight]),
    [
      [860, 1864],
      [860, 1536],
    ],
  );
});

test("the repository validator proves C3 center pixels and every reflected border pixel", () => {
  const output = execFileSync("node", ["scripts/validate-ritual-assets.mjs"], {
    cwd: projectRoot,
    encoding: "utf8",
  });
  assert.match(output, /2 C3 lossless full-bleed PNG/);
});
