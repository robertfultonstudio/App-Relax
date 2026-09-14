// Build the pinned public decoder without upstream property mangling.
import assert from "node:assert/strict";
import { createRequire } from "node:module";
import { createHash } from "node:crypto";
import { mkdirSync, readFileSync, writeFileSync, readdirSync } from "node:fs";
import { dirname, join, resolve } from "node:path";
import { fileURLToPath } from "node:url";
import { build, version } from "esbuild";
const root = dirname(dirname(fileURLToPath(import.meta.url)));
const require = createRequire(import.meta.url);
assert.equal(version, "0.28.2");
assert.equal(
  JSON.parse(
    readFileSync(
      join(
        dirname(require.resolve("@wasm-audio-decoders/flac")),
        "package.json",
      ),
    ),
  ).version,
  "0.2.11",
);
const out = resolve(process.argv[2] ?? join(root, "public-pwa"));
mkdirSync(out, { recursive: true });
// Ship the worker integration source so recipients can inspect/relink it;
// .txt makes browser delivery explicit and avoids treating it as executable.
for (const relative of [
  "src/pwa-review/flac/create-flac-frame-decoder.ts",
  "src/pwa-review/flac/flac-decoder-protocol.ts",
  "src/pwa-review/flac/flac-decoder.worker.ts",
  "scripts/build-pwa-flac-worker.mjs",
]) {
  const target = join(out, "flac-source/application", `${relative}.txt`);
  mkdirSync(dirname(target), { recursive: true });
  writeFileSync(target, readFileSync(join(root, relative)));
}
const result = await build({
  absWorkingDir: root,
  entryPoints: ["src/pwa-review/flac/flac-decoder.worker.ts"],
  outfile: join(out, "flac-decoder.worker.min.js"),
  bundle: true,
  platform: "browser",
  format: "iife",
  target: "es2022",
  charset: "utf8",
  minify: true,
  metafile: true,
  sourcemap: false,
  legalComments: "eof",
});
const bytes = readFileSync(join(out, "flac-decoder.worker.min.js"));
assert(bytes.length < 128 * 1024, "Review an unexpectedly enlarged worker");
mkdirSync(join(root, "dist/flac-worker"), { recursive: true });
await build({
  absWorkingDir: root,
  entryPoints: ["src/pwa-review/flac/create-flac-frame-decoder.ts"],
  outfile: join(root, "dist/flac-worker/client.mjs"),
  bundle: true,
  platform: "browser",
  format: "esm",
  target: "es2022",
});
const sourceRoot = join(out, "flac-source");
function sourceFiles(directory, prefix = "") {
  return readdirSync(directory, { withFileTypes: true }).flatMap((entry) => {
    assert(!entry.isSymbolicLink(), "No symlinks in decoder source delivery");
    const relative = prefix + entry.name;
    return entry.isDirectory()
      ? sourceFiles(join(directory, entry.name), relative + "/")
      : relative === "MANIFEST.sha256"
        ? []
        : [relative];
  });
}
assert.equal(
  createHash("sha256")
    .update(readFileSync(join(sourceRoot, "source/codec-parser-2.5.0.tgz")))
    .digest("hex"),
  "37cfcc258a77800d370b841e33cf19a18a3be6a990c0d1332ea3e01cb4ac4272",
);
const noticeManifest =
  sourceFiles(sourceRoot)
    .sort()
    .map((relative) => {
      assert(
        !/\.(wav|flac|mp3|m4a|ogg)$/i.test(relative),
        "No audio in source delivery",
      );
      return `${createHash("sha256")
        .update(readFileSync(join(sourceRoot, relative)))
        .digest("hex")}  ./${relative}`;
    })
    .join("\n") + "\n";
writeFileSync(join(sourceRoot, "MANIFEST.sha256"), noticeManifest);
const metadata = {
  bytes: bytes.length,
  sha256: createHash("sha256").update(bytes).digest("hex"),
  metafile: result.metafile,
  propertyMangling: false,
  noticeManifestSha256: createHash("sha256")
    .update(noticeManifest)
    .digest("hex"),
  scope: "PWA only; codec-parser LGPL retained",
};
writeFileSync(
  join(root, "dist/flac-worker/build.json"),
  JSON.stringify(metadata, null, 2) + "\n",
);
console.log(JSON.stringify({ ...metadata, metafile: undefined }));
