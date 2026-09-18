import assert from "node:assert/strict";
import { Buffer } from "node:buffer";
import { spawnSync } from "node:child_process";
import {
  closeSync,
  lstatSync,
  mkdirSync,
  mkdtempSync,
  openSync,
  readFileSync,
  readSync,
  rmSync,
  symlinkSync,
  writeFileSync,
} from "node:fs";
import { tmpdir } from "node:os";
import { dirname, join } from "node:path";
import { Writable } from "node:stream";
import { test } from "node:test";
import { fileURLToPath } from "node:url";
import {
  createPwaPreviewHandler,
  parseByteRange,
} from "../../scripts/pwa-preview-server.mjs";
import { createCurrentPwaPreview } from "../../scripts/current-pwa-preview.mjs";

const projectRoot = dirname(dirname(dirname(fileURLToPath(import.meta.url))));
const realCatalogRoot = join(projectRoot, "public", "audio-catalog");
const realCatalogManifestPath = join(
  projectRoot,
  "docs",
  "M4_LOCAL_LISTENING_MANIFEST.json",
);
const realCatalogManifest = JSON.parse(
  readFileSync(realCatalogManifestPath, "utf8"),
);
const realCatalogReview = JSON.parse(
  readFileSync(join(projectRoot, "src/content/hathaAudioFiles.json"), "utf8"),
);
const realCatalogFiles = [
  ...realCatalogManifest.files,
  ...realCatalogReview.files,
];
const realCatalogFilesPresent = realCatalogFiles.filter((file) =>
  lstatSync(join(realCatalogRoot, file.filename), { throwIfNoEntry: false }),
).length;

class CapturedResponse extends Writable {
  headers = new Map();
  chunks = [];
  headersSent = false;
  statusCode = 0;
  setHeader(name, value) {
    this.headers.set(name.toLowerCase(), String(value));
  }
  removeHeader(name) {
    this.headers.delete(name.toLowerCase());
  }
  writeHead(status, headers = {}) {
    this.statusCode = status;
    for (const [name, value] of Object.entries(headers))
      this.setHeader(name, value);
    this.headersSent = true;
  }
  _write(chunk, _encoding, callback) {
    this.chunks.push(Buffer.from(chunk));
    callback();
  }
  get body() {
    return Buffer.concat(this.chunks);
  }
}

function request(handler, url, { method = "GET", headers = {} } = {}) {
  return new Promise((resolve, reject) => {
    const response = new CapturedResponse();
    response.once("finish", () => resolve(response));
    response.once("error", reject);
    handler(
      { url, method, headers: { host: "localhost:8095", ...headers } },
      response,
    );
  });
}

function fixture(context) {
  const root = mkdtempSync(join(tmpdir(), "app-relax-pwa-transport-"));
  context.after(() => rmSync(root, { recursive: true }));
  const artifactRoot = join(root, "shell");
  const audioCatalogRoot = join(root, "audio");
  mkdirSync(join(artifactRoot, "outcome"), { recursive: true });
  mkdirSync(audioCatalogRoot);
  for (const name of [
    "index.html",
    "offline.html",
    "sw.js",
    "manifest.webmanifest",
    "outcome/meditation.html",
  ])
    writeFileSync(join(artifactRoot, name), name);
  const bytes = Buffer.from("0123456789abcdef");
  for (const name of ["SAMPLE.wav", "SAMPLE.flac", "UNAPPROVED.flac"])
    writeFileSync(join(audioCatalogRoot, name), bytes);
  const manifestPath = join(root, "manifest.json");
  writeFileSync(
    manifestPath,
    JSON.stringify({
      fileCount: 2,
      totalBytes: 32,
      files: ["SAMPLE.wav", "SAMPLE.flac"].map((filename) => ({
        filename,
        bytes: 16,
      })),
    }),
  );
  const config = { artifactRoot, audioCatalogRoot, manifestPath };
  return { ...config, config, bytes, ...createPwaPreviewHandler(config) };
}

test("root, clean deep links and missing routes are served without a blanket HTML fallback", async (t) => {
  const { handler } = fixture(t);
  for (const [url, body] of [
    ["/", "index.html"],
    ["/outcome/meditation?duration=20", "outcome/meditation.html"],
    ["/outcome/meditation/", "outcome/meditation.html"],
  ]) {
    const res = await request(handler, url);
    assert.equal(res.statusCode, 200);
    assert.equal(res.body.toString(), body);
  }
  assert.equal((await request(handler, "/qa-workbench")).statusCode, 404);
});

test("audio ranges bind to a stable revision and changed local files fail closed", async (t) => {
  const { handler, audioCatalogRoot } = fixture(t);
  const first = await request(handler, "/audio-catalog/SAMPLE.flac", {
    headers: { range: "bytes=0-3" },
  });
  const etag = first.headers.get("etag");
  assert.match(etag, /^"[^"]+"$/);
  const matched = await request(handler, "/audio-catalog/SAMPLE.flac", {
    headers: { range: "bytes=4-7", "if-range": etag },
  });
  assert.equal(matched.statusCode, 206);
  assert.equal(matched.body.toString(), "4567");
  const changed = await request(handler, "/audio-catalog/SAMPLE.flac", {
    headers: { range: "bytes=4-7", "if-range": '"old"' },
  });
  assert.equal(changed.statusCode, 200);
  writeFileSync(join(audioCatalogRoot, "SAMPLE.flac"), "changed");
  assert.equal(
    (await request(handler, "/audio-catalog/SAMPLE.flac")).statusCode,
    409,
  );
});

test("manifest, service worker and both audio formats have explicit MIME types", async (t) => {
  const f = fixture(t);
  mkdirSync(join(f.artifactRoot, "flac-source"));
  writeFileSync(
    join(f.artifactRoot, "flac-source/MANIFEST.sha256"),
    "source hashes",
  );
  const { handler } = createPwaPreviewHandler(f.config);
  for (const [url, type] of [
    ["/manifest.webmanifest", "application/manifest+json"],
    ["/sw.js", "text/javascript; charset=utf-8"],
    ["/audio-catalog/SAMPLE.wav", "audio/wav"],
    ["/audio-catalog/SAMPLE.flac", "audio/flac"],
    ["/flac-source/MANIFEST.sha256", "text/plain; charset=utf-8"],
  ]) {
    const res = await request(handler, url);
    assert.equal(res.statusCode, 200);
    assert.equal(res.headers.get("content-type"), type);
    assert.equal(res.headers.get("x-content-type-options"), "nosniff");
  }
  assert.equal(
    (await request(handler, "/sw.js")).headers.get("service-worker-allowed"),
    "/",
  );
});

test("HEAD reports complete audio size without bytes or Range semantics", async (t) => {
  const { handler } = fixture(t);
  const res = await request(handler, "/audio-catalog/SAMPLE.wav", {
    method: "HEAD",
    headers: { range: "bytes=0-1" },
  });
  assert.equal(res.statusCode, 200);
  assert.equal(res.headers.get("content-length"), "16");
  assert.equal(res.headers.get("accept-ranges"), "bytes");
  assert.equal(res.body.length, 0);
});

test("initial, suffix, open and end-clamped byte ranges preserve source bytes", async (t) => {
  const { handler, bytes } = fixture(t);
  for (const [range, start, end] of [
    ["bytes=0-1", 0, 1],
    ["bytes=4-8", 4, 8],
    ["bytes=10-", 10, 15],
    ["bytes=-4", 12, 15],
    ["bytes=14-100", 14, 15],
  ]) {
    const res = await request(handler, "/audio-catalog/SAMPLE.flac", {
      headers: { range },
    });
    assert.equal(res.statusCode, 206);
    assert.equal(res.headers.get("content-range"), `bytes ${start}-${end}/16`);
    assert.equal(res.headers.get("content-length"), String(end - start + 1));
    assert.deepEqual(res.body, bytes.subarray(start, end + 1));
  }
});

test("invalid and unsatisfiable byte ranges fail with 416", async (t) => {
  const { handler } = fixture(t);
  for (const range of [
    "bytes=16-",
    "bytes=9-3",
    "bytes=-0",
    "bytes=-",
    "bytes=0-1,8-9",
    "bytes=9007199254740993-",
    "nonsense",
  ]) {
    const res = await request(handler, "/audio-catalog/SAMPLE.wav", {
      headers: { range },
    });
    assert.equal(res.statusCode, 416);
    assert.equal(res.headers.get("content-range"), "bytes */16");
  }
  assert.equal(parseByteRange(undefined, 16), null);
});

test("unapproved audio, absent files and directories are never mapped to the shell", async (t) => {
  const { handler } = fixture(t);
  for (const url of [
    "/audio-catalog/UNAPPROVED.flac",
    "/audio-catalog/missing.wav",
    "/audio-catalog/",
    "/.git/config",
    "/outcome",
  ])
    assert.equal((await request(handler, url)).statusCode, 404);
});

test("unsafe paths, foreign hosts and writes are refused", async (t) => {
  const { handler } = fixture(t);
  for (const url of [
    "/../manifest.json",
    "/%2e%2e/manifest.json",
    "/audio-catalog/%00",
    "/audio-catalog/..%5cmanifest.json",
    "/%GG",
    "//elsewhere/",
  ])
    assert.equal((await request(handler, url)).statusCode, 400);
  assert.equal(
    (await request(handler, "/", { headers: { host: "outside.example:8095" } }))
      .statusCode,
    403,
  );
  assert.equal(
    (await request(handler, "/", { method: "POST" })).statusCode,
    405,
  );
});

test("manifest mismatch fails preflight", (t) => {
  const f = fixture(t);
  writeFileSync(join(f.audioCatalogRoot, "SAMPLE.wav"), "different bytes");
  assert.throws(() => createPwaPreviewHandler(f.config), /size mismatch/);
});

test("preflight rejects an unserved precache entry rather than leaving a stale shell installed", (t) => {
  const f = fixture(t);
  const manifest = join(f.artifactRoot, "precache-manifest.js");
  writeFileSync(
    manifest,
    'self.APP_RELAX_PRECACHE = {"urls":["/index.html","/missing.bin"]};',
  );
  assert.throws(
    () => createPwaPreviewHandler(f.config),
    /Unserved PWA precache resource/,
  );
  writeFileSync(
    manifest,
    'self.APP_RELAX_PRECACHE = {"urls":["/index.html"]};',
  );
  assert.doesNotThrow(() => createPwaPreviewHandler(f.config));
  writeFileSync(manifest, "runArbitraryCode()");
  assert.throws(
    () => createPwaPreviewHandler(f.config),
    /Invalid PWA precache manifest/,
  );
});

test("approved lossless additions stream from an explicit read-only root without copying", async (t) => {
  const f = fixture(t);
  const losslessRoot = join(f.audioCatalogRoot, "derivatives");
  mkdirSync(losslessRoot);
  writeFileSync(join(losslessRoot, "MUSIC.flac"), f.bytes);
  const preview = createPwaPreviewHandler({
    ...f.config,
    losslessRoot,
    additionalAudioFiles: [
      { filename: "MUSIC.flac", bytes: 16, sha256: "a".repeat(64) },
    ],
  });
  const res = await request(preview.handler, "/audio-catalog/MUSIC.flac", {
    headers: { range: "bytes=12-15" },
  });
  assert.equal(res.statusCode, 206);
  assert.deepEqual(res.body, f.bytes.subarray(12));
  assert.equal(res.headers.get("x-content-sha256"), "a".repeat(64));
  assert.throws(
    () => lstatSync(join(f.audioCatalogRoot, "MUSIC.flac")),
    /ENOENT/,
  );
  assert.equal(
    (await request(preview.handler, "/audio-catalog/derivatives/MUSIC.flac"))
      .statusCode,
    404,
  );
});

test("lossless fallback cannot hide broken catalog files or admit symlinks/WAV masters", (t) => {
  const f = fixture(t);
  const losslessRoot = join(f.audioCatalogRoot, "derivatives");
  mkdirSync(losslessRoot);
  writeFileSync(join(losslessRoot, "SAMPLE.flac"), f.bytes);
  writeFileSync(join(f.audioCatalogRoot, "SAMPLE.flac"), "corrupt");
  assert.throws(
    () => createPwaPreviewHandler({ ...f.config, losslessRoot }),
    /size mismatch/,
  );
  writeFileSync(join(f.audioCatalogRoot, "SAMPLE.flac"), f.bytes);
  symlinkSync(
    join(losslessRoot, "SAMPLE.flac"),
    join(losslessRoot, "LINK.flac"),
  );
  assert.throws(
    () =>
      createPwaPreviewHandler({
        ...f.config,
        losslessRoot,
        additionalAudioFiles: [{ filename: "LINK.flac", bytes: 16 }],
      }),
    /Unsafe preview resource/,
  );
  writeFileSync(join(losslessRoot, "MASTER.wav"), f.bytes);
  assert.throws(
    () =>
      createPwaPreviewHandler({
        ...f.config,
        losslessRoot,
        additionalAudioFiles: [{ filename: "MASTER.wav", bytes: 16 }],
      }),
    /ENOENT/,
  );
});

test("current preview merges identities but refuses conflicts instead of silently replacing audio", (t) => {
  const f = fixture(t);
  const root = join(f.audioCatalogRoot, "project");
  for (const dir of [
    "docs",
    "src/content",
    "src/pwa-review",
    "public/audio-catalog",
  ])
    mkdirSync(join(root, dir), { recursive: true });
  const file = { filename: "SAMPLE.flac", bytes: 16, sha256: "b".repeat(64) };
  const save = (path, value) =>
    writeFileSync(join(root, path), JSON.stringify(value));
  save("docs/M4_LOCAL_LISTENING_MANIFEST.json", {
    files: [file],
    fileCount: 1,
    totalBytes: 16,
  });
  save("src/content/hathaAudioFiles.json", { files: [] });
  save("src/content/localNaturalAudioFiles.json", { files: [] });
  const index = {
    filename: file.filename,
    bytes: 16,
    sourceSha256: file.sha256,
  };
  save("src/pwa-review/flacIndexManifest.json", { files: [index] });
  writeFileSync(join(root, "public/audio-catalog/SAMPLE.flac"), f.bytes);
  const config = { projectRoot: root, artifactRoot: f.artifactRoot };
  assert.equal(createCurrentPwaPreview(config).audioCount, 1);
  save("src/pwa-review/flacIndexManifest.json", {
    files: [{ ...index, sourceSha256: "c".repeat(64) }],
  });
  assert.throws(() => createCurrentPwaPreview(config), /Conflicting approved/);
});

test(
  "current 47 review URLs support HEAD and exact first/last ranges, including musical FLAC and two local textures",
  {
    skip:
      !process.env.APP_RELAX_TEST_LOSSLESS_ROOT &&
      "Set APP_RELAX_TEST_LOSSLESS_ROOT to verify the external read-only files",
  },
  async () => {
    const losslessRoot = process.env.APP_RELAX_TEST_LOSSLESS_ROOT;
    const preview = createCurrentPwaPreview({
      projectRoot,
      artifactRoot: join(projectRoot, "dist/pwa-d093"),
      losslessRoot,
    });
    const json = (path) =>
      JSON.parse(readFileSync(join(projectRoot, path), "utf8"));
    const files = [
      ...json("src/pwa-review/flacIndexManifest.json").files.map((f) => ({
        ...f,
        sha256: f.sourceSha256,
      })),
      ...json("src/content/localNaturalAudioFiles.json").files,
    ];
    assert.equal(preview.reviewAudioCount, 47);
    assert.equal(preview.reviewAudioBytes, 2_434_210_564);
    assert.equal(preview.audioCount, 68); // 21 existing WAV URLs retained, no copies.
    for (const file of files) {
      const url = `/audio-catalog/${file.filename}`;
      const head = await request(preview.handler, url, { method: "HEAD" });
      assert.equal(head.statusCode, 200, file.filename);
      assert.equal(head.headers.get("content-length"), String(file.bytes));
      assert.equal(head.headers.get("x-content-sha256"), file.sha256);
      let path = join(projectRoot, "public/audio-catalog", file.filename);
      if (!lstatSync(path, { throwIfNoEntry: false }))
        path = join(losslessRoot, file.filename);
      const descriptor = openSync(path, "r");
      try {
        for (const start of [0, file.bytes - 16]) {
          const expected = Buffer.alloc(16);
          readSync(descriptor, expected, 0, 16, start);
          const res = await request(preview.handler, url, {
            headers: { range: `bytes=${start}-${start + 15}` },
          });
          assert.equal(res.statusCode, 206, file.filename);
          assert.deepEqual(res.body, expected, file.filename);
        }
      } finally {
        closeSync(descriptor);
      }
    }
  },
);

test("explicit review additions preserve base validation and reject duplicates or unsafe paths", async (t) => {
  const f = fixture(t);
  const extra = { filename: "UNAPPROVED.flac", bytes: 16 };
  const review = createPwaPreviewHandler({
    ...f.config,
    additionalAudioFiles: [extra],
  });
  assert.equal(
    (await request(review.handler, "/audio-catalog/UNAPPROVED.flac"))
      .statusCode,
    200,
  );
  for (const entry of [
    { filename: "SAMPLE.wav", bytes: 16 },
    { filename: "../UNAPPROVED.flac", bytes: 16 },
    { ...extra, bytes: -1 },
  ]) {
    assert.throws(
      () =>
        createPwaPreviewHandler({ ...f.config, additionalAudioFiles: [entry] }),
      /Invalid or duplicate/,
    );
  }
  const base = JSON.parse(readFileSync(f.manifestPath, "utf8"));
  writeFileSync(f.manifestPath, JSON.stringify({ ...base, totalBytes: 1 }));
  assert.throws(
    () =>
      createPwaPreviewHandler({ ...f.config, additionalAudioFiles: [extra] }),
    /Invalid base audio manifest/,
  );
});

test("audio symlinks and shell symlinks fail preflight", (t) => {
  const f = fixture(t);
  rmSync(join(f.audioCatalogRoot, "SAMPLE.wav"));
  symlinkSync(
    join(f.audioCatalogRoot, "SAMPLE.flac"),
    join(f.audioCatalogRoot, "SAMPLE.wav"),
  );
  assert.throws(
    () => createPwaPreviewHandler(f.config),
    /Unsafe preview resource/,
  );
  symlinkSync(f.audioCatalogRoot, join(f.artifactRoot, "outside"));
  assert.throws(
    () => createPwaPreviewHandler(f.config),
    /must not contain symlinks/,
  );
});

test("a disappearing file returns 500 instead of hanging or leaking its path", async (t) => {
  const f = fixture(t);
  rmSync(join(f.audioCatalogRoot, "SAMPLE.wav"));
  const res = await request(f.handler, "/audio-catalog/SAMPLE.wav");
  assert.equal(res.statusCode, 500);
  assert.equal(res.body.toString(), "Resource could not be read.");
});

test(
  "all 45 real catalog files pass HEAD and byte-identical first/last Range responses without listening",
  {
    skip:
      realCatalogFilesPresent === 0 &&
      "Local catalog fixtures are not available in a clean CI checkout",
  },
  async () => {
    const preview = createPwaPreviewHandler({
      artifactRoot: join(projectRoot, "dist", "m5-pwa"),
      audioCatalogRoot: realCatalogRoot,
      manifestPath: realCatalogManifestPath,
      additionalAudioFiles: realCatalogReview.files,
    });
    assert.equal(preview.audioCount, 45);
    for (const file of realCatalogFiles) {
      const url = `/audio-catalog/${file.filename}`;
      const head = await request(preview.handler, url, { method: "HEAD" });
      assert.equal(head.statusCode, 200, file.filename);
      assert.equal(head.headers.get("content-length"), String(file.bytes));
      const descriptor = openSync(join(realCatalogRoot, file.filename), "r");
      try {
        for (const start of [0, file.bytes - 16]) {
          const expected = Buffer.alloc(16);
          readSync(descriptor, expected, 0, 16, start);
          const res = await request(preview.handler, url, {
            headers: { range: `bytes=${start}-${start + 15}` },
          });
          assert.equal(res.statusCode, 206, file.filename);
          assert.deepEqual(res.body, expected, file.filename);
        }
      } finally {
        closeSync(descriptor);
      }
    }
  },
);

test("launcher rejects unsupported exposure options and invalid ports before binding", () => {
  for (const args of [
    ["--host", "0.0.0.0"],
    ["--lan"],
    ["--tunnel"],
    ["--port", "0"],
    ["--port=NaN"],
    ["--lossless-root"],
    ["--artifact"],
  ]) {
    const result = spawnSync(
      process.execPath,
      [
        join(projectRoot, "scripts", "start-pwa-web-preview.mjs"),
        "--check",
        ...args,
      ],
      { encoding: "utf8" },
    );
    assert.equal(result.status, 1);
    assert.match(result.stderr, /PWA non avviata/);
    assert.doesNotMatch(result.stdout, /PWA pronta/);
  }
});
