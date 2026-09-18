import assert from "node:assert/strict";
import { readFileSync, readdirSync } from "node:fs";
import { createHash } from "node:crypto";
import { resolve } from "node:path";

const root = resolve("assets/fonts/m6");
const manifest = JSON.parse(
  readFileSync(resolve(root, "manifest.json"), "utf8"),
);
assert.equal(manifest.schemaVersion, 1);
assert.equal(manifest.assets.length, 5);
assert.deepEqual(
  readdirSync(root)
    .filter((name) => name.endsWith(".ttf"))
    .sort(),
  manifest.assets.map((asset) => asset.file).sort(),
);
let total = 0;
for (const asset of manifest.assets) {
  assert.match(asset.file, /^[A-Za-z-]+\.ttf$/);
  const bytes = readFileSync(resolve(root, asset.file));
  assert.equal(bytes.readUInt32BE(0), 0x00010000);
  assert.equal(bytes.length, asset.bytes);
  assert.ok(bytes.length < 150000);
  assert.equal(createHash("sha256").update(bytes).digest("hex"), asset.sha256);
  assert.match(
    asset.sourceUrl,
    /^https:\/\/github.com\/google\/fonts\/blob\/[a-f0-9]{40}\//,
  );
  assert.match(
    readFileSync(resolve(root, asset.license), "utf8"),
    /SIL OPEN FONT LICENSE Version 1.1/,
  );
  total += bytes.length;
}
assert.ok(total < 350000);
console.log(
  `PASS: 5 static OFL font derivatives, SHA-256 verified, ${total} bytes total`,
);
