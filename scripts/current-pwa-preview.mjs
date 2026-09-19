import { readFileSync } from "node:fs";
import { join } from "node:path";
import { createPwaPreviewHandler } from "./pwa-preview-server.mjs";

/** Read-only local delivery. Old approved URLs remain available for existing
 * offline packages; the current player uses the lossless registry, not WAV aliases. */
export function createCurrentPwaPreview({
  projectRoot,
  artifactRoot,
  audioCatalogRoot,
  losslessRoot,
  port,
}) {
  const json = (path) =>
    JSON.parse(readFileSync(join(projectRoot, path), "utf8"));
  const base = json("docs/M4_LOCAL_LISTENING_MANIFEST.json");
  const hatha = json("src/content/hathaAudioFiles.json");
  const flac = json("src/pwa-review/flacIndexManifest.json");
  const natural = json("src/content/localNaturalAudioFiles.json");
  const current = [
    ...flac.files.map((file) => ({
      filename: file.filename,
      bytes: file.bytes,
      sha256: file.sourceSha256,
    })),
    ...natural.files,
  ];
  const admitted = new Map(base.files.map((file) => [file.filename, file]));
  const additions = [];
  for (const file of [...hatha.files, ...current]) {
    if (!/^[a-f0-9]{64}$/.test(file.sha256 ?? "")) {
      throw new Error("Missing approved audio identity.");
    }
    const previous = admitted.get(file.filename);
    if (previous) {
      if (previous.bytes !== file.bytes || previous.sha256 !== file.sha256) {
        throw new Error("Conflicting approved audio identities.");
      }
    } else {
      additions.push(file);
      admitted.set(file.filename, file);
    }
  }
  return {
    ...createPwaPreviewHandler({
      artifactRoot,
      audioCatalogRoot:
        audioCatalogRoot ?? join(projectRoot, "public/audio-catalog"),
      manifestPath: join(projectRoot, "docs/M4_LOCAL_LISTENING_MANIFEST.json"),
      additionalAudioFiles: additions,
      losslessRoot,
      port,
    }),
    reviewAudioCount: current.length,
    reviewAudioBytes: current.reduce((sum, file) => sum + file.bytes, 0),
  };
}
