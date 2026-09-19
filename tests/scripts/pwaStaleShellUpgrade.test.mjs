import assert from "node:assert/strict";
import { spawn } from "node:child_process";
import {
  existsSync,
  mkdirSync,
  mkdtempSync,
  readFileSync,
  rmSync,
  statSync,
  writeFileSync,
} from "node:fs";
import { createServer } from "node:http";
import { tmpdir } from "node:os";
import { extname, join, normalize, relative, resolve } from "node:path";
import { test } from "node:test";
import WebSocket from "ws";

const required = process.env.APP_RELAX_STALE_UPGRADE_REQUIRED === "1";
const artifactRoot = resolve(
  process.env.APP_RELAX_VISUAL_ARTIFACT ?? "dist/m5-pwa",
);
const evidenceRoot = resolve(
  process.env.APP_RELAX_VISUAL_SCREENSHOT_DIR ?? "dist/pwa-visual-gate",
);
const chromeCandidates = [
  process.env.APP_RELAX_CHROME_BINARY,
  "/Applications/Google Chrome.app/Contents/MacOS/Google Chrome",
  "/usr/bin/google-chrome",
  "/usr/bin/chromium",
  "/usr/bin/chromium-browser",
].filter(Boolean);
const chromeBinary =
  chromeCandidates.find((candidate) => existsSync(candidate)) ?? "";
const forbidden = [
  "A little space for you",
  "Make room for quiet",
  "Sound for the moment you need",
];
const legacyRevision = "1".repeat(64);

const legacyHtml = `<!doctype html>
<html><head><meta charset="utf-8"><title>App Relax</title>
<script>
if ("serviceWorker" in navigator) {
  addEventListener("load", () => navigator.serviceWorker.register("/sw.js", { scope: "/" }));
}
</script></head><body>
<main><p>App Relax</p><p>A little space for you</p>
<h1>Make room for quiet.</h1>
<p>Sound for the moment you need. Nothing to keep up with.</p>
<button>Scegli il tuo momento</button></main>
</body></html>`;

const legacyWorker = `
const CACHE = "ritual-audio-shell-${legacyRevision}";
self.addEventListener("install", event => event.waitUntil((async () => {
  const cache = await caches.open(CACHE);
  await cache.addAll(["/", "/legacy.js"]);
  await self.skipWaiting();
})()));
self.addEventListener("activate", event => event.waitUntil(Promise.resolve()));
self.addEventListener("fetch", event => {
  const url = new URL(event.request.url);
  if (event.request.method !== "GET" || url.origin !== self.location.origin) return;
  event.respondWith((async () => {
    const cache = await caches.open(CACHE);
    if (event.request.mode === "navigate") return (await cache.match("/")) || fetch(event.request);
    return (await cache.match(url.pathname)) || fetch(event.request);
  })());
});
`;

const delay = (milliseconds) =>
  new Promise((resolveDelay) => setTimeout(resolveDelay, milliseconds));

function contentType(path) {
  return (
    {
      ".css": "text/css; charset=utf-8",
      ".html": "text/html; charset=utf-8",
      ".js": "text/javascript; charset=utf-8",
      ".json": "application/json; charset=utf-8",
      ".png": "image/png",
      ".webmanifest": "application/manifest+json",
      ".woff2": "font/woff2",
    }[extname(path).toLowerCase()] ?? "application/octet-stream"
  );
}

function resolveArtifact(pathname) {
  const requested = pathname === "/" ? "/index.html" : pathname;
  const relativePath = normalize(decodeURIComponent(requested)).replace(
    /^[/\\]+/,
    "",
  );
  if (!relativePath || relativePath.split(/[\\/]/).includes("..")) return null;
  const candidates = [join(artifactRoot, relativePath)];
  if (!extname(relativePath)) candidates.push(`${candidates[0]}.html`);
  for (const candidate of candidates) {
    const resolved = resolve(candidate);
    if (
      relative(artifactRoot, resolved).startsWith("..") ||
      !existsSync(resolved) ||
      !statSync(resolved).isFile()
    )
      continue;
    return resolved;
  }
  return null;
}

async function openProtocol(url) {
  const socket = new WebSocket(url);
  await new Promise((resolveOpen, reject) => {
    socket.addEventListener("open", resolveOpen, { once: true });
    socket.addEventListener("error", reject, { once: true });
  });
  let nextId = 1;
  const pending = new Map();
  socket.addEventListener("message", (event) => {
    const message = JSON.parse(String(event.data));
    if (!message.id) return;
    const request = pending.get(message.id);
    if (!request) return;
    pending.delete(message.id);
    if (message.error) request.reject(new Error(message.error.message));
    else request.resolve(message.result);
  });
  return {
    close: () => socket.close(),
    send(method, params = {}) {
      const id = nextId++;
      return new Promise((resolveSend, reject) => {
        pending.set(id, { resolve: resolveSend, reject });
        socket.send(JSON.stringify({ id, method, params }));
      });
    },
  };
}

async function evaluate(protocol, expression) {
  const result = await protocol.send("Runtime.evaluate", {
    awaitPromise: true,
    expression,
    returnByValue: true,
  });
  if (result.exceptionDetails)
    throw new Error(result.exceptionDetails.text ?? "Evaluation failed");
  return result.result.value;
}

async function waitFor(protocol, predicate, message) {
  for (let attempt = 0; attempt < 240; attempt += 1) {
    const value = await evaluate(protocol, predicate);
    if (value) return value;
    await delay(50);
  }
  throw new Error(message);
}

async function navigate(protocol, url) {
  await protocol.send("Page.navigate", { url });
  await waitFor(
    protocol,
    "document.readyState === 'complete'",
    `Navigation did not complete: ${url}`,
  );
}

test(
  "a controlled legacy root is replaced on the first upgraded activation",
  { skip: !required },
  async (context) => {
    assert.ok(existsSync(join(artifactRoot, "index.html")));
    assert.ok(chromeBinary, "Chrome/Chromium is required");
    let phase = "legacy";
    const server = createServer((request, response) => {
      const pathname = new URL(request.url ?? "/", "http://gate").pathname;
      if (phase === "legacy") {
        const body =
          pathname === "/" || pathname === "/index.html"
            ? legacyHtml
            : pathname === "/sw.js"
              ? legacyWorker
              : pathname === "/legacy.js"
                ? "self.LEGACY_APP_RELAX = true;"
                : null;
        if (body === null) {
          response.writeHead(404).end();
          return;
        }
        response.writeHead(200, {
          "Cache-Control": "no-store",
          "Content-Type": pathname.endsWith(".js")
            ? "text/javascript; charset=utf-8"
            : "text/html; charset=utf-8",
          "Service-Worker-Allowed": "/",
        });
        response.end(body);
        return;
      }
      const path = resolveArtifact(pathname);
      if (!path) {
        response.writeHead(404).end();
        return;
      }
      response.writeHead(200, {
        "Cache-Control": "no-store",
        "Content-Type": contentType(path),
        "Service-Worker-Allowed": "/",
      });
      response.end(readFileSync(path));
    });
    await new Promise((resolveListen, reject) => {
      server.once("error", reject);
      server.listen(0, "127.0.0.1", resolveListen);
    });
    context.after(
      () => new Promise((resolveClose) => server.close(resolveClose)),
    );
    const address = server.address();
    assert.ok(address && typeof address !== "string");
    const origin = `http://127.0.0.1:${address.port}`;

    const profile = mkdtempSync(join(tmpdir(), "app-relax-stale-upgrade-"));
    const chrome = spawn(
      chromeBinary,
      [
        "--headless=new",
        "--disable-background-networking",
        "--disable-default-apps",
        "--disable-extensions",
        "--disable-sync",
        "--no-first-run",
        "--remote-debugging-port=0",
        `--user-data-dir=${profile}`,
        "about:blank",
      ],
      { stdio: "ignore" },
    );
    context.after(async () => {
      if (chrome.exitCode === null) chrome.kill("SIGTERM");
      for (
        let attempt = 0;
        attempt < 40 && chrome.exitCode === null;
        attempt += 1
      )
        await delay(25);
      rmSync(profile, { recursive: true, force: true });
    });
    const portFile = join(profile, "DevToolsActivePort");
    for (let attempt = 0; attempt < 120 && !existsSync(portFile); attempt += 1)
      await delay(50);
    assert.ok(existsSync(portFile), "Chrome DevTools did not start");
    const [debugPort] = readFileSync(portFile, "utf8").trim().split("\n");
    const targetResponse = await fetch(
      `http://127.0.0.1:${debugPort}/json/new?about:blank`,
      { method: "PUT" },
    );
    assert.equal(targetResponse.status, 200);
    const target = await targetResponse.json();
    const protocol = await openProtocol(target.webSocketDebuggerUrl);
    context.after(() => protocol.close());
    await protocol.send("Page.enable");
    await protocol.send("Runtime.enable");

    await navigate(protocol, `${origin}/`);
    await waitFor(
      protocol,
      `navigator.serviceWorker?.ready.then(() => true)`,
      "Legacy worker was not ready",
    );
    await protocol.send("Page.reload");
    const legacy = await waitFor(
      protocol,
      `document.body.innerText.includes("Make room") &&
        navigator.serviceWorker.controller !== null &&
        caches.keys().then(keys => keys.includes("ritual-audio-shell-${legacyRevision}"))`,
      "Legacy root was not controlled",
    );
    assert.equal(legacy, true);

    phase = "candidate";
    await protocol.send("Page.reload");
    await waitFor(
      protocol,
      `location.pathname === "/moments" &&
        !document.body.innerText.includes("Make room") &&
        document.body.innerText.includes("Scegli il tuo momento")`,
      "The first upgraded activation left the rejected root visible",
    );
    const upgraded = await evaluate(
      protocol,
      `(async () => ({
        path: location.pathname,
        body: document.body.innerText,
        caches: await caches.keys(),
        controlled: navigator.serviceWorker.controller !== null
      }))()`,
    );
    assert.equal(upgraded.path, "/moments");
    assert.equal(upgraded.controlled, true);
    assert.ok(forbidden.every((copy) => !upgraded.body.includes(copy)));
    assert.equal(upgraded.caches.length, 1);
    assert.notEqual(upgraded.caches[0], `ritual-audio-shell-${legacyRevision}`);

    await navigate(protocol, `${origin}/`);
    await waitFor(
      protocol,
      `location.pathname === "/moments" &&
        document.body.innerText.includes("Scegli il tuo momento")`,
      "Fresh root did not replace itself with Home",
    );
    await protocol.send("Page.reload");
    await waitFor(
      protocol,
      `location.pathname === "/moments" &&
        !document.body.innerText.includes("Make room")`,
      "Refresh restored the rejected root",
    );
    await navigate(protocol, `${origin}/outcome/yoga`);
    await waitFor(
      protocol,
      `location.pathname === "/outcome/yoga"`,
      "Yoga route did not open",
    );
    const history = await protocol.send("Page.getNavigationHistory");
    const appEntries = history.entries.filter((entry) =>
      entry.url.startsWith(origin),
    );
    assert.ok(
      appEntries.every((entry) => new URL(entry.url).pathname !== "/"),
      "Rejected root remained reachable in navigation history",
    );
    const moments = [...appEntries]
      .reverse()
      .find((entry) => new URL(entry.url).pathname === "/moments");
    assert.ok(moments, "Home history entry missing");
    await protocol.send("Page.navigateToHistoryEntry", { entryId: moments.id });
    await waitFor(
      protocol,
      `location.pathname === "/moments" &&
        !document.body.innerText.includes("Make room")`,
      "Back navigation restored the rejected root",
    );
    const refreshedHistory = await protocol.send("Page.getNavigationHistory");
    const yoga = refreshedHistory.entries.find(
      (entry) => new URL(entry.url).pathname === "/outcome/yoga",
    );
    assert.ok(yoga, "Yoga forward entry missing");
    await protocol.send("Page.navigateToHistoryEntry", { entryId: yoga.id });
    await waitFor(
      protocol,
      `location.pathname === "/outcome/yoga" &&
        !document.body.innerText.includes("Make room")`,
      "Forward navigation restored the rejected root",
    );

    const precache = readFileSync(
      join(artifactRoot, "precache-manifest.js"),
      "utf8",
    );
    mkdirSync(evidenceRoot, { recursive: true });
    writeFileSync(
      join(evidenceRoot, "stale-shell-upgrade.json"),
      JSON.stringify(
        {
          result: "PASS",
          fromRevision: legacyRevision,
          toRevision: (precache.match(/[a-f0-9]{64}/) ?? [null])[0],
          firstActivationPath: upgraded.path,
          oldCopyReachable: false,
          refresh: "PASS",
          backForward: "PASS",
          controlled: upgraded.controlled,
        },
        null,
        2,
      ) + "\n",
    );
  },
);
