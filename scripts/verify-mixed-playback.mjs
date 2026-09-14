// Local-only HTTP evidence for the actual exported PWA. No audio copies/output,
// remote writes, new credentials or decoder instrumentation in the app bundle.
import { createServer } from "node:http";
import { readFileSync, mkdirSync, writeFileSync } from "node:fs";
import { resolve, join } from "node:path";
import { createPwaPreviewHandler } from "./pwa-preview-server.mjs";

const root = resolve(import.meta.dirname, "..");
const port = 8251;
const hatha = JSON.parse(
  readFileSync(join(root, "src/content/hathaAudioFiles.json"), "utf8"),
);
const preview = createPwaPreviewHandler({
  artifactRoot: join(root, "dist/m5-pwa"),
  audioCatalogRoot: join(root, "public/audio-catalog"),
  manifestPath: join(root, "docs/M4_LOCAL_LISTENING_MANIFEST.json"),
  additionalAudioFiles: hatha.files,
  port,
});
let musicPreview;
const musicPaths = new Set();
if (process.argv[2]) {
  const music = JSON.parse(
    readFileSync(
      join(root, "docs/SESSION_REVIEW_5_LOSSLESS_REPORT.json"),
      "utf8",
    ),
  ).files.map((f) => ({
    filename: f.filename,
    bytes: f.flacBytes,
    sha256: f.sha256,
  }));
  const directory = join(root, "dist/audio-continuity-audit");
  mkdirSync(directory, { recursive: true });
  const manifestPath = join(directory, "music-flac-transport.json");
  writeFileSync(
    manifestPath,
    JSON.stringify({
      fileCount: music.length,
      totalBytes: music.reduce((n, f) => n + f.bytes, 0),
      files: music,
    }),
  );
  musicPreview = createPwaPreviewHandler({
    artifactRoot: join(root, "dist/m5-pwa"),
    audioCatalogRoot: resolve(process.argv[2]),
    manifestPath,
    port,
  });
  for (const f of music) musicPaths.add(`/audio-catalog/${f.filename}`);
}
const requests = [];
let overflow = false;
const server = createServer((request, response) => {
  if (request.url?.startsWith("/audio-catalog/") && request.method === "GET") {
    const entry = {
      file: decodeURIComponent(
        request.url.split("?")[0].slice("/audio-catalog/".length),
      ),
      range: request.headers.range ?? null,
      status: null,
      contentLength: null,
      finished: false,
    };
    if (requests.length < 2000) requests.push(entry);
    else overflow = true;
    response.once("finish", () => {
      entry.status = response.statusCode;
      entry.contentLength = Number(response.getHeader("content-length"));
      entry.finished = true;
    });
  }
  const target = musicPaths.has(request.url?.split("?")[0])
    ? musicPreview
    : preview;
  target.handler(request, response);
});
let closing = false;
function close() {
  if (closing) return;
  closing = true;
  server.close(() => {
    mkdirSync(join(root, "dist/audio-continuity-audit"), { recursive: true });
    const wav = requests.filter((entry) => /\.wav$/i.test(entry.file));
    const report = {
      kind: "Actual exported PWA mixed music and nature HTTP requests; not listening approval",
      overflow,
      wavRequests: wav.length,
      allWavRequestsBounded:
        wav.length > 0 &&
        wav.every(
          (entry) =>
            /^bytes=\d+-\d+$/.test(entry.range ?? "") &&
            entry.finished &&
            entry.status === 206 &&
            entry.contentLength <= 8 * 48000 * 6,
        ),
      flacRequests: requests.filter((entry) => /\.flac$/i.test(entry.file))
        .length,
      requests,
    };
    const destination = join(
      root,
      "dist/audio-continuity-audit/mixed-format-requests.json",
    );
    writeFileSync(destination, JSON.stringify(report, null, 2) + "\n");
    console.log(
      JSON.stringify({
        wavRequests: report.wavRequests,
        allWavRequestsBounded: report.allWavRequestsBounded,
        flacRequests: report.flacRequests,
        overflow,
      }),
    );
  });
  server.closeAllConnections();
}
server.on("error", (error) => {
  console.error(error.message);
  process.exitCode = 1;
});
for (const signal of ["SIGINT", "SIGTERM"]) process.on(signal, close);
server.listen(port, "127.0.0.1", () =>
  console.log(
    `Mixed-format review: http://localhost:${port}/ · report saved on shutdown`,
  ),
);
