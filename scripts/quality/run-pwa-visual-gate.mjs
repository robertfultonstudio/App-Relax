#!/usr/bin/env node
import { spawn } from "node:child_process";
import { createServer } from "node:http";
import { existsSync, readFileSync, rmSync, statSync } from "node:fs";
import {
  dirname,
  extname,
  join,
  normalize,
  relative,
  resolve,
} from "node:path";
import { fileURLToPath } from "node:url";
import { createCurrentPwaPreview } from "../current-pwa-preview.mjs";

const projectRoot = dirname(dirname(dirname(fileURLToPath(import.meta.url))));
const artifactRoot = resolve(
  projectRoot,
  process.env.APP_RELAX_VISUAL_ARTIFACT ?? "dist/m5-pwa",
);
const evidenceRoot = resolve(
  projectRoot,
  process.env.APP_RELAX_VISUAL_SCREENSHOT_DIR ?? "dist/pwa-visual-gate",
);
const chromeCandidates = [
  process.env.APP_RELAX_CHROME_BINARY,
  "/Applications/Google Chrome.app/Contents/MacOS/Google Chrome",
  "/usr/bin/google-chrome",
  "/usr/bin/chromium",
  "/usr/bin/chromium-browser",
].filter(Boolean);
const chromeBinary = chromeCandidates.find((candidate) =>
  existsSync(candidate),
);
const audioCatalogRoot = process.env.APP_RELAX_AUDIO_CATALOG_ROOT;
const losslessRoot = process.env.APP_RELAX_LOSSLESS_ROOT;
const playbackAvailable = Boolean(
  audioCatalogRoot &&
  losslessRoot &&
  existsSync(audioCatalogRoot) &&
  existsSync(losslessRoot),
);
const requirePlayback = process.env.APP_RELAX_VISUAL_REQUIRE_PLAYBACK === "1";

function fail(message) {
  console.error(`PWA visual delivery gate: FAIL — ${message}`);
  process.exitCode = 1;
}

function contentType(path) {
  return (
    {
      ".css": "text/css; charset=utf-8",
      ".html": "text/html; charset=utf-8",
      ".ico": "image/x-icon",
      ".jpeg": "image/jpeg",
      ".jpg": "image/jpeg",
      ".js": "text/javascript; charset=utf-8",
      ".json": "application/json; charset=utf-8",
      ".png": "image/png",
      ".svg": "image/svg+xml",
      ".ttf": "font/ttf",
      ".webmanifest": "application/manifest+json",
      ".woff": "font/woff",
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

async function run() {
  if (!existsSync(join(artifactRoot, "index.html"))) {
    fail(`missing exported PWA at ${relative(projectRoot, artifactRoot)}`);
    return;
  }
  if (!chromeBinary) {
    fail("Chrome/Chromium is required; the gate is not allowed to skip");
    return;
  }
  if (requirePlayback && !playbackAvailable) {
    fail(
      "active-player evidence requires APP_RELAX_AUDIO_CATALOG_ROOT and APP_RELAX_LOSSLESS_ROOT",
    );
    return;
  }

  rmSync(evidenceRoot, { recursive: true, force: true });
  let requestHandler = (request, response) => {
    let path;
    try {
      path = resolveArtifact(
        new URL(request.url ?? "/", "http://gate").pathname,
      );
    } catch {
      path = null;
    }
    if (!path) {
      response.writeHead(404, { "Content-Type": "text/plain; charset=utf-8" });
      response.end("Not found");
      return;
    }
    response.writeHead(200, {
      "Cache-Control": "no-store",
      "Content-Type": contentType(path),
    });
    response.end(readFileSync(path));
  };
  const server = createServer((request, response) =>
    requestHandler(request, response),
  );

  await new Promise((resolveListen, reject) => {
    server.once("error", reject);
    server.listen(0, "127.0.0.1", resolveListen);
  });
  const address = server.address();
  if (!address || typeof address === "string") {
    server.close();
    fail("could not allocate the isolated preview server");
    return;
  }
  if (playbackAvailable) {
    requestHandler = createCurrentPwaPreview({
      projectRoot,
      artifactRoot,
      audioCatalogRoot,
      losslessRoot,
      port: address.port,
    }).handler;
  }

  const child = spawn(
    process.execPath,
    ["--test", "tests/scripts/uiVisualRepairRuntime.test.mjs"],
    {
      cwd: projectRoot,
      env: {
        ...process.env,
        APP_RELAX_CHROME_BINARY: chromeBinary,
        APP_RELAX_VISUAL_BASE_URL: `http://127.0.0.1:${address.port}`,
        APP_RELAX_VISUAL_CONTRACT_ONLY: "1",
        APP_RELAX_VISUAL_REQUIRED: "1",
        APP_RELAX_VISUAL_PLAYBACK_AVAILABLE: playbackAvailable ? "1" : "0",
        APP_RELAX_VISUAL_REQUIRE_PLAYBACK: requirePlayback ? "1" : "0",
        APP_RELAX_VISUAL_SCREENSHOT_DIR: evidenceRoot,
      },
      stdio: "inherit",
    },
  );
  const exitCode = await new Promise((resolveExit) => {
    child.once("error", () => resolveExit(1));
    child.once("exit", (code) => resolveExit(code ?? 1));
  });
  await new Promise((resolveClose) => server.close(resolveClose));
  if (exitCode !== 0) {
    fail("runtime candidate violates the approved visual contract");
    return;
  }
  const staleUpgrade = spawn(
    process.execPath,
    ["--test", "tests/scripts/pwaStaleShellUpgrade.test.mjs"],
    {
      cwd: projectRoot,
      env: {
        ...process.env,
        APP_RELAX_CHROME_BINARY: chromeBinary,
        APP_RELAX_STALE_UPGRADE_REQUIRED: "1",
        APP_RELAX_VISUAL_ARTIFACT: artifactRoot,
        APP_RELAX_VISUAL_SCREENSHOT_DIR: evidenceRoot,
      },
      stdio: "inherit",
    },
  );
  const staleExitCode = await new Promise((resolveExit) => {
    staleUpgrade.once("error", () => resolveExit(1));
    staleUpgrade.once("exit", (code) => resolveExit(code ?? 1));
  });
  if (staleExitCode !== 0) {
    fail("controlled stale-shell upgrade still exposes the rejected root");
    return;
  }
  for (const required of [
    "390x844/home.png",
    "390x844/yoga.png",
    "390x844/player.png",
    "430x932/home.png",
    "430x932/yoga.png",
    "430x932/player.png",
    "measurements.json",
    "stale-shell-upgrade.json",
  ]) {
    if (!existsSync(join(evidenceRoot, required))) {
      fail(`runtime evidence is incomplete (${required})`);
      return;
    }
  }
  console.log(
    `PWA visual delivery gate: PASS — real runtime checked at 390x844 and 430x932; evidence ${relative(projectRoot, evidenceRoot)}.`,
  );
}

await run();
