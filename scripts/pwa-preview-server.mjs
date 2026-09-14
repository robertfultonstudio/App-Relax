import {
  createReadStream,
  lstatSync,
  readFileSync,
  readdirSync,
  realpathSync,
} from "node:fs";
import { extname, join, relative, sep } from "node:path";

const CONTENT_TYPES = {
  ".html": "text/html; charset=utf-8",
  ".js": "text/javascript; charset=utf-8",
  ".css": "text/css; charset=utf-8",
  ".json": "application/json; charset=utf-8",
  ".webmanifest": "application/manifest+json",
  ".png": "image/png",
  ".jpg": "image/jpeg",
  ".jpeg": "image/jpeg",
  ".svg": "image/svg+xml",
  ".ico": "image/x-icon",
  ".ttf": "font/ttf",
  ".woff": "font/woff",
  ".woff2": "font/woff2",
  ".txt": "text/plain; charset=utf-8",
  ".sha256": "text/plain; charset=utf-8",
  ".md": "text/plain; charset=utf-8",
  ".tgz": "application/gzip",
  ".wav": "audio/wav",
  ".flac": "audio/flac",
};

export function parseByteRange(header, size) {
  if (header === undefined) return null;
  const match = /^bytes=(\d*)-(\d*)$/i.exec(String(header).trim());
  if (!match || (!match[1] && !match[2]) || size === 0) return false;
  const first = match[1] ? Number(match[1]) : null;
  const last = match[2] ? Number(match[2]) : null;
  if (
    [first, last].some(
      (value) => value !== null && !Number.isSafeInteger(value),
    )
  )
    return false;
  if (first === null) {
    if (last === 0) return false;
    return { start: Math.max(0, size - last), end: size - 1 };
  }
  if (first >= size || (last !== null && last < first)) return false;
  return { start: first, end: Math.min(last ?? size - 1, size - 1) };
}

function plainResponse(response, status, text, method) {
  response.writeHead(status, { "Content-Type": "text/plain; charset=utf-8" });
  response.end(method === "HEAD" ? undefined : text);
}

// Audio is streamed from its existing location; opening the application never
// reads the whole catalog. Startup checks the approved file list and byte sizes.
export function createPwaPreviewHandler({
  artifactRoot,
  audioCatalogRoot,
  manifestPath,
  additionalAudioFiles = [],
  losslessRoot,
  port = 8095,
}) {
  const shellRoot = realpathSync(artifactRoot);
  const audioRoot = realpathSync(audioCatalogRoot);
  const derivativeRoot = losslessRoot ? realpathSync(losslessRoot) : null;
  const manifest = JSON.parse(readFileSync(manifestPath, "utf8"));
  if (additionalAudioFiles.length) {
    if (
      manifest.fileCount !== manifest.files?.length ||
      manifest.totalBytes !== manifest.files.reduce((n, f) => n + f.bytes, 0)
    ) {
      throw new Error("Invalid base audio manifest.");
    }
    manifest.files.push(...additionalAudioFiles);
    manifest.fileCount = manifest.files.length;
    manifest.totalBytes = manifest.files.reduce((n, f) => n + f.bytes, 0);
  }
  const resources = new Map();

  function addResource(url, path, expectedBytes, sourceSha256) {
    const info = lstatSync(path);
    if (!info.isFile() || info.isSymbolicLink())
      throw new Error(`Unsafe preview resource: ${url}`);
    if (expectedBytes !== undefined && info.size !== expectedBytes)
      throw new Error(`Audio size mismatch: ${url}`);
    resources.set(url, {
      path,
      bytes: info.size,
      mtimeMs: info.mtimeMs,
      etag: `"${info.size}-${info.mtimeMs}-${info.ino}"`,
      sourceSha256,
      type: CONTENT_TYPES[extname(path).toLowerCase()],
    });
  }

  function walkShell(directory) {
    for (const entry of readdirSync(directory, { withFileTypes: true })) {
      const path = join(directory, entry.name);
      if (entry.isSymbolicLink())
        throw new Error("The static PWA must not contain symlinks.");
      if (entry.isDirectory()) walkShell(path);
      else if (entry.isFile() && CONTENT_TYPES[extname(path).toLowerCase()]) {
        if (/\.(wav|flac)$/i.test(path))
          throw new Error("Audio must remain outside the PWA shell.");
        addResource(`/${relative(shellRoot, path).split(sep).join("/")}`, path);
      }
    }
  }
  walkShell(shellRoot);
  for (const required of [
    "/index.html",
    "/sw.js",
    "/manifest.webmanifest",
    "/offline.html",
  ]) {
    if (!resources.has(required))
      throw new Error(
        `Missing PWA export: ${required}. Run export:web:pwa first.`,
      );
  }
  // A valid export is not enough if this server omits a precached extension:
  // one 404 rejects the whole installation and leaves the previous shell active.
  const precache = resources.get("/precache-manifest.js");
  if (precache) {
    const assignment =
      /^self\.APP_RELAX_PRECACHE\s*=\s*(\{[\s\S]*\});?\s*$/.exec(
        readFileSync(precache.path, "utf8"),
      );
    if (!assignment) throw new Error("Invalid PWA precache manifest.");
    const { urls } = JSON.parse(assignment[1]);
    if (!Array.isArray(urls) || urls.length === 0)
      throw new Error("Invalid PWA precache URL list.");
    for (const url of urls) {
      if (
        typeof url !== "string" ||
        !resources.has(url === "/" ? "/index.html" : url)
      )
        throw new Error(`Unserved PWA precache resource: ${url}`);
    }
  }
  if (
    !Array.isArray(manifest.files) ||
    manifest.fileCount !== manifest.files.length ||
    manifest.fileCount === 0
  )
    throw new Error("Invalid local audio manifest.");
  let audioBytes = 0;
  const names = new Set();
  for (const item of manifest.files) {
    if (
      !/^[A-Za-z0-9_-]+\.(wav|flac)$/i.test(item.filename) ||
      names.has(item.filename) ||
      !Number.isSafeInteger(item.bytes) ||
      item.bytes <= 0
    )
      throw new Error("Invalid or duplicate audio manifest entry.");
    names.add(item.filename);
    audioBytes += item.bytes;
    let audioPath = join(audioRoot, item.filename);
    // Only an explicitly approved FLAC absent from the existing catalog may
    // come from the selected derivatives directory. Never mask a corrupt or
    // symlinked catalog entry with a fallback, or expose a directory listing.
    if (
      derivativeRoot &&
      item.filename.endsWith(".flac") &&
      !lstatSync(audioPath, { throwIfNoEntry: false })
    ) {
      audioPath = join(derivativeRoot, item.filename);
    }
    addResource(
      `/audio-catalog/${item.filename}`,
      audioPath,
      item.bytes,
      item.sha256,
    );
  }
  if (audioBytes !== manifest.totalBytes)
    throw new Error("Audio manifest total does not match its files.");

  const allowedHosts = new Set([`localhost:${port}`, `127.0.0.1:${port}`]);
  function handler(request, response) {
    response.setHeader("X-Content-Type-Options", "nosniff");
    response.setHeader("Cache-Control", "no-store");
    response.setHeader("Referrer-Policy", "same-origin");
    const method = request.method;
    if (!allowedHosts.has(request.headers.host?.toLowerCase()))
      return plainResponse(response, 403, "Loopback host required.", method);
    if (method !== "GET" && method !== "HEAD") {
      response.setHeader("Allow", "GET, HEAD");
      return plainResponse(response, 405, "Method not allowed.", method);
    }
    let pathname;
    try {
      pathname = decodeURIComponent((request.url ?? "").split("?")[0]);
    } catch {
      return plainResponse(response, 400, "Invalid request path.", method);
    }
    if (
      !pathname.startsWith("/") ||
      pathname.startsWith("//") ||
      /[\\\u0000-\u001f]/.test(pathname) ||
      pathname.split("/").some((part) => part === "." || part === "..")
    )
      return plainResponse(response, 400, "Invalid request path.", method);
    const isAudio = pathname.startsWith("/audio-catalog/");
    let resource = resources.get(pathname === "/" ? "/index.html" : pathname);
    if (!resource && !isAudio && !extname(pathname))
      resource = resources.get(`${pathname.replace(/\/$/, "")}.html`);
    if (!resource)
      return plainResponse(response, 404, "Resource not found.", method);
    if (isAudio) {
      let current;
      try {
        current = lstatSync(resource.path);
      } catch {
        return plainResponse(
          response,
          500,
          "Resource could not be read.",
          method,
        );
      }
      if (
        !current.isFile() ||
        current.isSymbolicLink() ||
        current.size !== resource.bytes ||
        current.mtimeMs !== resource.mtimeMs
      )
        return plainResponse(
          response,
          409,
          "Audio changed since preview startup.",
          method,
        );
      response.setHeader("Accept-Ranges", "bytes");
      response.setHeader("ETag", resource.etag);
      if (resource.sourceSha256)
        response.setHeader("X-Content-SHA256", resource.sourceSha256);
    }
    const range =
      method === "GET" &&
      (!request.headers["if-range"] ||
        request.headers["if-range"] === resource.etag)
        ? parseByteRange(request.headers.range, resource.bytes)
        : null;
    if (range === false) {
      response.setHeader("Content-Range", `bytes */${resource.bytes}`);
      return plainResponse(
        response,
        416,
        "Requested range is not satisfiable.",
        method,
      );
    }
    const start = range?.start ?? 0;
    const end = range?.end ?? resource.bytes - 1;
    response.setHeader("Content-Type", resource.type);
    response.setHeader("Content-Length", Math.max(0, end - start + 1));
    if (range)
      response.setHeader(
        "Content-Range",
        `bytes ${start}-${end}/${resource.bytes}`,
      );
    if (pathname === "/sw.js")
      response.setHeader("Service-Worker-Allowed", "/");
    if (method === "HEAD" || resource.bytes === 0) {
      response.writeHead(range ? 206 : 200);
      return response.end();
    }
    const stream = createReadStream(resource.path, {
      start,
      end,
      highWaterMark: 64 * 1024,
    });
    stream.once("error", () => {
      if (response.headersSent) response.destroy();
      else {
        response.removeHeader("Content-Length");
        response.removeHeader("Content-Range");
        plainResponse(response, 500, "Resource could not be read.", method);
      }
    });
    response.once("close", () => stream.destroy());
    stream.once("open", () => {
      response.writeHead(range ? 206 : 200);
      stream.pipe(response);
    });
  }
  return {
    handler,
    audioCount: names.size,
    audioBytes,
    resourceCount: resources.size,
  };
}
