import assert from "node:assert/strict";
import { readFileSync } from "node:fs";
import test from "node:test";
const catalog = JSON.parse(
  readFileSync(new URL("../../catalog.json", import.meta.url), "utf8"),
);
const { createWorker } = await import("../../worker.mjs");
const file = catalog.files[0];
const authenticated = { "oai-authenticated-user-id": "owner" };

function environment({ valid = true } = {}) {
  const meta = {
    size: valid ? file.bytes : file.bytes - 1,
    httpEtag: '"approved-etag"',
    customMetadata: { sha256: file.sha256 },
  };
  const AUDIO = {
    head: async (key) => (key === `approved/${file.sha256}` ? meta : null),
    get: async (key, options) => {
      if (key !== `approved/${file.sha256}`) return null;
      const length = options?.range?.length ?? file.bytes;
      return { ...meta, body: new Uint8Array(length) };
    },
  };
  return {
    AUDIO,
    ASSETS: { fetch: async () => new Response("shell") },
  };
}

test("hosting worker requires the existing Sites owner identity", async () => {
  const response = await createWorker().fetch(
    new Request(`https://app.test/audio-catalog/${file.filename}`),
    environment(),
  );
  assert.equal(response.status, 401);
});

test("hosting worker keeps the catalog allowlist closed", async () => {
  const response = await createWorker().fetch(
    new Request("https://app.test/audio-catalog/not-approved.flac", {
      headers: authenticated,
    }),
    environment(),
  );
  assert.equal(response.status, 404);
});

test("hosting worker serves verified HEAD metadata without a body", async () => {
  const response = await createWorker().fetch(
    new Request(`https://app.test/audio-catalog/${file.filename}`, {
      method: "HEAD",
      headers: authenticated,
    }),
    environment(),
  );
  assert.equal(response.status, 200);
  assert.equal(response.headers.get("content-length"), String(file.bytes));
  assert.equal(response.headers.get("accept-ranges"), "bytes");
  assert.equal(response.headers.get("x-content-sha256"), file.sha256);
  assert.equal(await response.text(), "");
});

test("hosting worker forwards an exact bounded Range response", async () => {
  const response = await createWorker().fetch(
    new Request(`https://app.test/audio-catalog/${file.filename}`, {
      headers: { ...authenticated, Range: "bytes=0-8287" },
    }),
    environment(),
  );
  assert.equal(response.status, 206);
  assert.equal(
    response.headers.get("content-range"),
    `bytes 0-8287/${file.bytes}`,
  );
  assert.equal(response.headers.get("content-length"), "8288");
  assert.equal(response.headers.get("content-type"), "audio/flac");
  assert.equal((await response.arrayBuffer()).byteLength, 8288);
});

test("hosting worker rejects unsatisfiable ranges and invalid objects", async () => {
  const range = await createWorker().fetch(
    new Request(`https://app.test/audio-catalog/${file.filename}`, {
      headers: { ...authenticated, Range: `bytes=${file.bytes}-` },
    }),
    environment(),
  );
  assert.equal(range.status, 416);
  assert.equal(range.headers.get("content-range"), `bytes */${file.bytes}`);

  const invalid = await createWorker().fetch(
    new Request(`https://app.test/audio-catalog/${file.filename}`, {
      method: "HEAD",
      headers: authenticated,
    }),
    environment({ valid: false }),
  );
  assert.equal(invalid.status, 503);
});

test("active catalog keeps import closed", async () => {
  const response = await createWorker().fetch(
    new Request("https://app.test/_review/import?action=publish", {
      method: "POST",
      headers: authenticated,
    }),
    environment(),
  );
  assert.equal(catalog.phase, "activate");
  assert.equal(response.status, 403);
});
