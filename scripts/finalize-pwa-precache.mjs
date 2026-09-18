import { createHash } from "node:crypto";
import { readdir, readFile, stat, writeFile } from "node:fs/promises";
import path from "node:path";
import {
  isPublishableShellFile,
  publishedShellUrl,
} from "./pwa-precache-policy.mjs";

const root = path.resolve(process.argv[2] ?? "dist/m5-pwa");
const indexes = JSON.parse(
  await readFile(
    new URL("../src/pwa-review/flacIndexManifest.json", import.meta.url),
    "utf8",
  ),
);
const onDemand = new Set(
  indexes.files
    .filter((f) => f.onDemand)
    .map((f) => `flac-index/${f.indexSha256}.json`),
);
async function files(directory) {
  const entries = await readdir(directory, { withFileTypes: true });
  return (
    await Promise.all(
      entries.map(async (entry) => {
        const location = path.join(directory, entry.name);
        if (entry.isSymbolicLink())
          throw new Error("Precache does not accept symlinks.");
        return entry.isDirectory() ? files(location) : [location];
      }),
    )
  ).flat();
}
const paths = (await files(root))
  .filter(
    (file) =>
      !["sw.js", "precache-manifest.js"].includes(path.relative(root, file)) &&
      !onDemand.has(path.relative(root, file).split(path.sep).join("/")) &&
      isPublishableShellFile(path.relative(root, file)),
  )
  .sort();
const digest = createHash("sha256");
const workerPath = path.join(root, "sw.js");
const worker = (await readFile(workerPath, "utf8")).replace(
  /^\/\/ precache-revision: [a-f0-9]+\n/,
  "",
);
digest.update(worker);
const urls = [];
let bytes = 0;
for (const file of paths) {
  const relative = path.relative(root, file).split(path.sep).join("/");
  if (/audio-catalog|\.(?:wav|flac|mp3|m4a|ogg)$/i.test(relative))
    throw new Error(`Audio cannot enter the shell cache: ${relative}`);
  bytes += (await stat(file)).size;
  if (bytes > 20 * 1024 * 1024)
    throw new Error("PWA shell precache exceeds the explicit 20 MiB budget.");
  digest.update(relative);
  digest.update("\0");
  digest.update(await readFile(file));
  urls.push(publishedShellUrl(relative));
}
for (const required of ["/", "/offline", "/offline-file-worker.js"])
  if (!urls.includes(required))
    throw new Error(`Missing essential PWA shell file ${required}.`);
const revision = digest.digest("hex");
await writeFile(
  path.join(root, "precache-manifest.js"),
  `self.APP_RELAX_PRECACHE = ${JSON.stringify({ revision, urls })};\n`,
);
await writeFile(workerPath, `// precache-revision: ${revision}\n${worker}`);
console.log(
  `PWA shell precache: ${urls.length} files, ${bytes} bytes, revision ${revision}. No audio.`,
);
