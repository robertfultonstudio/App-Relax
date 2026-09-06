import assert from "node:assert/strict";
import { Buffer } from "node:buffer";
import { spawnSync } from "node:child_process";
import {
  closeSync,
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

const projectRoot = dirname(dirname(dirname(fileURLToPath(import.meta.url))));

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

test("manifest, service worker and both audio formats have explicit MIME types", async (t) => {
  const { handler } = fixture(t);
  for (const [url, type] of [
    ["/manifest.webmanifest", "application/manifest+json"],
    ["/sw.js", "text/javascript; charset=utf-8"],
    ["/audio-catalog/SAMPLE.wav", "audio/wav"],
    ["/audio-catalog/SAMPLE.flac", "audio/flac"],
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

test("all 37 real catalog files pass HEAD and byte-identical first/last Range responses without listening", async () => {
  const audioCatalogRoot = join(projectRoot, "public", "audio-catalog");
  const manifestPath = join(
    projectRoot,
    "docs",
    "M4_LOCAL_LISTENING_MANIFEST.json",
  );
  const manifest = JSON.parse(readFileSync(manifestPath, "utf8"));
  const preview = createPwaPreviewHandler({
    artifactRoot: join(projectRoot, "dist", "m5-pwa"),
    audioCatalogRoot,
    manifestPath,
  });
  assert.equal(preview.audioCount, 37);
  for (const file of manifest.files) {
    const url = `/audio-catalog/${file.filename}`;
    const head = await request(preview.handler, url, { method: "HEAD" });
    assert.equal(head.statusCode, 200, file.filename);
    assert.equal(head.headers.get("content-length"), String(file.bytes));
    const descriptor = openSync(join(audioCatalogRoot, file.filename), "r");
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
});

test("launcher rejects unsupported exposure options and invalid ports before binding", () => {
  for (const args of [
    ["--host", "0.0.0.0"],
    ["--lan"],
    ["--tunnel"],
    ["--port", "0"],
    ["--port=NaN"],
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
