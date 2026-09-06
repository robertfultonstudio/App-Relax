import localManifest from "@/content/approvedAudioFiles.json";
import { CONSUMER_AUDIO_WORKS } from "@/content/consumerCatalog";
import type { OfflineCatalogManifest } from "@/domain/offline/types";

const assets = CONSUMER_AUDIO_WORKS.filter(
  (work) =>
    work.listeningStatus === "APPROVED — LISTENING PASSED" &&
    work.localPreviewFilename !== null,
).map((work) => {
  const file = localManifest.files.find(
    (entry) => entry.filename === work.localPreviewFilename,
  );
  if (!file)
    throw new Error(`Approved download manifest missing for ${work.id}.`);
  return {
    assetId: `audio.${work.id}`,
    workId: work.id,
    objectKey: file.filename,
    bytes: file.bytes,
    sha256: file.sha256,
    mediaType: file.filename.endsWith(".flac")
      ? ("audio/flac" as const)
      : ("audio/wav" as const),
  };
});

// Three existing approved recordings, not generated noise or newly edited audio.
export const STARTER_WORK_IDS = [
  "field-rain-006-quiet-weather",
  "field-rain-008-sheltered-rain",
  "field-rain-002-soft-weather",
] as const;
export const STARTER_PACKAGE_ID = "approved-rain-starter-v1";
export const APPROVED_DOWNLOAD_MANIFEST: OfflineCatalogManifest = {
  schemaVersion: 1,
  catalogRevision: "approved-private-delivery-2026-09-05",
  assets,
  packages: [
    ...assets.map((asset) => ({
      packageId: asset.workId,
      revision: asset.sha256,
      title: CONSUMER_AUDIO_WORKS.find((work) => work.id === asset.workId)!
        .title,
      assetIds: [asset.assetId],
      totalBytes: asset.bytes,
    })),
    {
      packageId: STARTER_PACKAGE_ID,
      revision: "1",
      title: "Rain starter · 3 sounds",
      assetIds: STARTER_WORK_IDS.map((id) => `audio.${id}`),
      totalBytes: assets
        .filter((asset) =>
          (STARTER_WORK_IDS as readonly string[]).includes(asset.workId),
        )
        .reduce((sum, asset) => sum + asset.bytes, 0),
    },
  ],
};
