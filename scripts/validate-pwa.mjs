import { createHash } from "node:crypto";
import { existsSync, readFileSync, readdirSync, statSync } from "node:fs";
import { dirname, join, relative, resolve } from "node:path";
import { fileURLToPath } from "node:url";
import {
  isPublishableShellFile,
  publishedShellUrl,
} from "./pwa-precache-policy.mjs";

const projectRoot = dirname(dirname(fileURLToPath(import.meta.url)));
const publicRoot = join(projectRoot, "public-pwa");
const artifactRoot = resolve(
  projectRoot,
  process.argv[2] ?? join("dist", "m5-pwa"),
);
const outcomeIds = ["meditation", "yoga", "massage", "relax", "sleep", "focus"];

function assert(condition, message) {
  if (!condition) throw new Error(`PWA validation failed: ${message}`);
}

function filesBelow(directory) {
  return readdirSync(directory, { withFileTypes: true }).flatMap((entry) => {
    const path = join(directory, entry.name);
    return entry.isDirectory() ? filesBelow(path) : [path];
  });
}

function sha256(path) {
  return createHash("sha256").update(readFileSync(path)).digest("hex");
}

function readPngDimensions(path) {
  const bytes = readFileSync(path);
  assert(
    bytes.length >= 26 && bytes.subarray(1, 4).toString("ascii") === "PNG",
    `${relative(projectRoot, path)} is not a PNG`,
  );
  return {
    width: bytes.readUInt32BE(16),
    height: bytes.readUInt32BE(20),
    colorType: bytes[25],
  };
}

assert(existsSync(publicRoot), "public-pwa is missing");
assert(
  existsSync(artifactRoot),
  `${relative(projectRoot, artifactRoot)} is missing`,
);

const manifestPath = join(publicRoot, "manifest.webmanifest");
const manifest = JSON.parse(readFileSync(manifestPath, "utf8"));
assert(manifest.name === "App Relax", "unexpected manifest name");
assert(
  manifest.start_url === "/" && manifest.scope === "/",
  "manifest must use root scope",
);
assert(
  manifest.display === "standalone",
  "manifest must be installable as standalone",
);
assert(manifest.background_color === "#f3e9d8", "unexpected background colour");
assert(manifest.theme_color === "#f3e9d8", "unexpected theme colour");
assert(
  manifest.icons?.some(
    ({ sizes, purpose }) => sizes === "192x192" && purpose === "any",
  ),
  "192px icon is missing",
);
assert(
  manifest.icons?.some(
    ({ sizes, purpose }) => sizes === "512x512" && purpose === "any",
  ),
  "512px icon is missing",
);
assert(
  manifest.icons?.some(
    ({ sizes, purpose }) => sizes === "512x512" && purpose === "maskable",
  ),
  "maskable icon is missing",
);

const iconManifest = JSON.parse(
  readFileSync(join(publicRoot, "icons", "manifest.json"), "utf8"),
);
assert(
  iconManifest.source.sha256 ===
    sha256(join(projectRoot, iconManifest.source.path)),
  "PWA icon source hash changed",
);
for (const icon of iconManifest.files) {
  const path = join(publicRoot, "icons", icon.filename);
  assert(existsSync(path), `${icon.filename} is missing`);
  const dimensions = readPngDimensions(path);
  assert(
    dimensions.width === icon.width && dimensions.height === icon.height,
    `${icon.filename} dimensions changed`,
  );
  assert(
    dimensions.colorType !== 4 && dimensions.colorType !== 6,
    `${icon.filename} must not rely on transparency`,
  );
  assert(
    statSync(path).size === icon.bytes,
    `${icon.filename} byte size changed`,
  );
  assert(sha256(path) === icon.sha256, `${icon.filename} hash changed`);
}

const serviceWorker = readFileSync(join(publicRoot, "sw.js"), "utf8");
for (const required of [
  'request.headers.has("range")',
  'request.destination === "audio"',
  'url.pathname.startsWith("/audio-catalog/")',
  "/\\.(?:flac|wav)$/i",
]) {
  assert(serviceWorker.includes(required), `service worker lacks ${required}`);
}
const fetchHandlerStart = serviceWorker.indexOf(
  'self.addEventListener("fetch"',
);
const audioBypass = serviceWorker.indexOf(
  "isAudioRequest(request, url)",
  fetchHandlerStart,
);
const firstRespondWith = serviceWorker.indexOf(
  "event.respondWith",
  fetchHandlerStart,
);
assert(
  fetchHandlerStart >= 0 && audioBypass >= 0 && audioBypass < firstRespondWith,
  "audio and Range requests must bypass Cache Storage before respondWith",
);

const artifactFiles = filesBelow(artifactRoot);
const artifactPaths = artifactFiles.map((path) =>
  relative(artifactRoot, path).replaceAll("\\", "/"),
);
// The approved index bytes and the built worker are part of this exact shell,
// never trusted merely because a same-named URL exists on the server.
const flacRegistry = JSON.parse(
  readFileSync(
    join(projectRoot, "src/pwa-review/flacIndexManifest.json"),
    "utf8",
  ),
);
const approvedAudio = JSON.parse(
  readFileSync(
    join(projectRoot, "docs/M4_LOCAL_LISTENING_MANIFEST.json"),
    "utf8",
  ),
).files.filter(({ filename }) => filename.endsWith(".flac"));
const musicDelivery = JSON.parse(
  readFileSync(
    join(projectRoot, "docs/SESSION_REVIEW_5_LOSSLESS_REPORT.json"),
    "utf8",
  ),
).files;
assert(
  musicDelivery.length === 21 &&
    musicDelivery.every((f) => f.pcmIdentity === true),
  "music lossless provenance changed",
);
approvedAudio.push(
  ...musicDelivery.map((f) => ({
    filename: f.filename,
    bytes: f.flacBytes,
    sha256: f.sha256,
  })),
);
assert(
  flacRegistry.version === 1 &&
    flacRegistry.files.length === 45 &&
    approvedAudio.length === 45,
  "changed FLAC scope requires revalidation",
);
assert(
  new Set(flacRegistry.files.map(({ filename }) => filename)).size === 45,
  "duplicate FLAC index identity",
);
assert(
  artifactPaths.filter((path) => path.startsWith("flac-index/")).length === 45,
  "unexpected or missing FLAC indexes",
);
for (const entry of flacRegistry.files) {
  const music = musicDelivery.find((f) => f.filename === entry.filename);
  assert(
    music
      ? entry.onDemand === true &&
          entry.sourceFilename === music.sourceFilename &&
          entry.sourceWavSha256 === music.sourceSha256 &&
          entry.totalFrames === music.frames
      : !entry.onDemand && !entry.sourceFilename,
    "online-only music indexes and offline nature scope differ",
  );
  const approved = approvedAudio.find(
    ({ filename }) => filename === entry.filename,
  );
  assert(
    approved &&
      approved.sha256 === entry.sourceSha256 &&
      approved.bytes === entry.bytes,
    "FLAC source is not approved",
  );
  const path = join(artifactRoot, "flac-index", `${entry.indexSha256}.json`);
  assert(
    existsSync(path) &&
      statSync(path).size === entry.indexBytes &&
      sha256(path) === entry.indexSha256,
    "FLAC index byte/hash mismatch",
  );
  const index = JSON.parse(readFileSync(path, "utf8"));
  assert(
    index.file === entry.filename &&
      index.bytes === entry.bytes &&
      index.totalFrames === entry.totalFrames &&
      index.sampleRate === 48000 &&
      index.channels === 2 &&
      index.bitDepth === 24,
    "FLAC index source/format mismatch",
  );
}
const decoderBuild = JSON.parse(
  readFileSync(join(projectRoot, "dist/flac-worker/build.json"), "utf8"),
);
const decoderPath = join(artifactRoot, "flac-decoder.worker.min.js");
assert(
  existsSync(decoderPath) &&
    statSync(decoderPath).size === decoderBuild.bytes &&
    sha256(decoderPath) === decoderBuild.sha256 &&
    decoderBuild.propertyMangling === false,
  "FLAC worker differs from the tested build",
);
assert(
  decoderBuild.bytes < 128 * 1024,
  "FLAC worker exceeds its bounded budget",
);
const noticeManifestPath = join(artifactRoot, "flac-source/MANIFEST.sha256");
assert(
  existsSync(noticeManifestPath) &&
    sha256(noticeManifestPath) === decoderBuild.noticeManifestSha256,
  "decoder source/notice manifest mismatch",
);
for (const line of readFileSync(noticeManifestPath, "utf8")
  .trim()
  .split("\n")) {
  const match = /^([a-f0-9]{64})  \.\/([A-Za-z0-9_./-]+)$/.exec(line);
  assert(
    match && !match[2].split("/").includes(".."),
    "unsafe source/notice entry",
  );
  const file = join(artifactRoot, "flac-source", match[2]);
  assert(
    existsSync(file) && sha256(file) === match[1],
    "decoder source/notice hash mismatch",
  );
}
for (const required of [
  "index.html",
  "manifest.webmanifest",
  "sw.js",
  "offline.html",
  "icons/icon-192.png",
  "icons/icon-512.png",
  "icons/icon-maskable-512.png",
  "icons/apple-touch-icon.png",
  "icons/favicon.png",
]) {
  assert(
    artifactPaths.includes(required),
    `${required} is missing from the artifact`,
  );
}
assert(
  readFileSync(join(artifactRoot, "manifest.webmanifest"), "utf8") ===
    readFileSync(manifestPath, "utf8"),
  "exported manifest differs from its source",
);
assert(
  readFileSync(join(artifactRoot, "sw.js"), "utf8").replace(
    /^\/\/ precache-revision: [a-f0-9]{64}\n/,
    "",
  ) === serviceWorker,
  "exported service worker differs from its source",
);
const precacheText = readFileSync(
  join(artifactRoot, "precache-manifest.js"),
  "utf8",
);
const precacheMatch = /^self\.APP_RELAX_PRECACHE = (\{.*\});\n$/.exec(
  precacheText,
);
assert(precacheMatch, "invalid finalized precache manifest");
const precache = JSON.parse(precacheMatch[1]);
const onDemandIndexes = new Set(
  flacRegistry.files
    .filter((f) => f.onDemand)
    .map((f) => `flac-index/${f.indexSha256}.json`),
);
const shellPaths = artifactFiles
  .filter(
    (path) =>
      !["sw.js", "precache-manifest.js"].includes(
        relative(artifactRoot, path),
      ) &&
      !onDemandIndexes.has(
        relative(artifactRoot, path).replaceAll("\\", "/"),
      ) &&
      isPublishableShellFile(relative(artifactRoot, path)),
  )
  .sort();
const shellDigest = createHash("sha256").update(serviceWorker);
const expectedUrls = [];
let precacheBytes = 0;
for (const path of shellPaths) {
  const name = relative(artifactRoot, path).replaceAll("\\", "/");
  shellDigest.update(name).update("\0").update(readFileSync(path));
  expectedUrls.push(publishedShellUrl(name));
  precacheBytes += statSync(path).size;
}
assert(
  precache.revision === shellDigest.digest("hex"),
  "precache revision does not match all shell bytes",
);
assert(
  JSON.stringify(precache.urls) === JSON.stringify(expectedUrls),
  "precache must contain the complete exact published shell",
);
assert(precacheBytes <= 20 * 1024 * 1024, "offline shell exceeds 20 MiB");
assert(
  readFileSync(join(artifactRoot, "sw.js"), "utf8").startsWith(
    `// precache-revision: ${precache.revision}\n`,
  ),
  "worker revision mismatch",
);
assert(
  !/clients\.claim\s*\(/.test(serviceWorker) &&
    (serviceWorker.match(/skipWaiting\s*\(/g) ?? []).length === 2 &&
    serviceWorker.includes('event.data?.type === "APP_RELAX_APPLY_UPDATE"') &&
    serviceWorker.includes('sender.pathname !== "/update.html"') &&
    serviceWorker.includes("includeUncontrolled: true") &&
    serviceWorker.includes("if (!hasActiveListeningClient(clients))") &&
    /if \(otherApp\) \{[\s\S]*?APP_RELAX_UPDATE_BLOCKED[\s\S]*?return;\s*\}\s*await self\.skipWaiting\(\)/.test(
      serviceWorker,
    ),
  "updates must not take over an active session",
);

for (const path of artifactPaths) {
  assert(
    !/\.(?:wav|flac)$/i.test(path),
    `audio byte entered the shell: ${path}`,
  );
  assert(
    !path.startsWith("audio-catalog/"),
    `audio catalog entered the shell: ${path}`,
  );
  assert(!path.startsWith("audio-test"), `Audio Test entered the PWA: ${path}`);
  assert(
    !path.startsWith("qa-workbench"),
    `QA Workbench entered the PWA: ${path}`,
  );
  assert(
    !path.startsWith("session/"),
    `technical session route entered the PWA: ${path}`,
  );
  assert(
    !path.startsWith("category/"),
    `legacy category route entered the PWA: ${path}`,
  );
}

assert(
  artifactPaths.includes("loop-review.html"),
  "individual-file loop review route missing from the private PWA",
);

for (const outcomeId of outcomeIds) {
  assert(
    artifactPaths.includes(`outcome/${outcomeId}.html`),
    `missing static outcome route ${outcomeId}`,
  );
  assert(
    artifactPaths.includes(`adaptive-session/${outcomeId}.html`),
    `missing static adaptive route ${outcomeId}`,
  );
}
const staticWorkRoutes = artifactPaths.filter(
  (path) =>
    path.startsWith("listen/") && path.endsWith(".html") && !path.includes("["),
);
assert(
  staticWorkRoutes.length === 53,
  `expected 53 PWA work routes, found ${staticWorkRoutes.length}`,
);
for (const forbidden of [
  "listen/soft-air.html",
  "listen/moon-drone.html",
  "listen/deep-river.html",
  "listen/eclipse-veil.html",
  "listen/stillwater-halo.html",
]) {
  assert(
    !artifactPaths.includes(forbidden),
    `${forbidden} must stay outside the PWA`,
  );
}

const representativePlayerHtml = readFileSync(
  join(artifactRoot, staticWorkRoutes[0]),
  "utf8",
);
assert(
  representativePlayerHtml.includes('aria-label="Inizia"') &&
    representativePlayerHtml.includes("Caricamento"),
  "static player must expose an Italian start action and an honest non-playing loading state",
);
assert(
  !representativePlayerHtml.includes("IPHONE PREVIEW"),
  "PWA copy must not be labelled as the temporary iPhone preview",
);

const indexHtml = readFileSync(join(artifactRoot, "index.html"), "utf8");
assert(
  indexHtml.includes("/manifest.webmanifest"),
  "root HTML lacks the manifest link",
);
assert(
  indexHtml.includes("/sw.js"),
  "root HTML lacks service worker registration",
);
assert(
  indexHtml.includes("apple-mobile-web-app-capable"),
  "iOS install metadata is missing",
);
assert(
  /<title(?:\s[^>]*)?>App Relax<\/title>/.test(indexHtml),
  "root HTML lacks a non-empty document title",
);
assert(
  (indexHtml.match(/<title(?:\s[^>]*)?>/g) ?? []).length === 1,
  "root HTML must contain exactly one document title",
);

const textual = artifactFiles
  .filter((path) => /\.(?:html|js|json|webmanifest|txt|md|css)$/i.test(path))
  .map((path) => readFileSync(path, "utf8"))
  .join("\n");
for (const forbidden of [
  "AUDIO QA WORKBENCH · DEVELOPMENT ONLY",
  "app-relax-m5-qa-workbench",
  "deep-sleep-432",
  "Moon Drone",
  "Deep River",
  "Soft Air",
  "sleepDrone001",
  "sleepAmbience001",
  "sleepTexture001",
  "SLEEP_DRONE_001.wav",
  "SLEEP_AMBIENCE_001.wav",
  "SLEEP_TEXTURE_001.wav",
]) {
  assert(!textual.includes(forbidden), `artifact contains ${forbidden}`);
}

const totalBytes = artifactFiles.reduce(
  (sum, path) => sum + statSync(path).size,
  0,
);
const largestFile = Math.max(
  ...artifactFiles.map((path) => statSync(path).size),
);
assert(
  totalBytes <= 32 * 1024 * 1024,
  `shell is too large: ${totalBytes} bytes`,
);
assert(
  largestFile <= 16 * 1024 * 1024,
  `one shell file is too large: ${largestFile} bytes`,
);

console.log(
  `PWA: PASS (${artifactFiles.length} files, ${totalBytes} bytes, 53 prepared player routes, no audio bytes, Audio Test, or QA Workbench).`,
);
console.log(
  "Audio delivery: authenticated same-origin streaming or explicitly downloaded, hash-verified local files. Shell has no audio bytes.",
);
