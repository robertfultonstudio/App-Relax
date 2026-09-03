import type { OfflineCatalogManifest } from "@/domain/offline/types";

const assets = [
  asset(
    "field-rain-002-soft-weather",
    "FIELD_RAIN_002_SOFT_WEATHER_48K24_LOOP.flac",
    6_932_884,
    "9cb07fd79e1e3070749071c3faea0c6465b2d7f883d3d0c0e0cbc1e990f82a3b",
  ),
  asset(
    "field-rain-005-misted-garden",
    "FIELD_RAIN_005_MISTED_GARDEN_48K24_LOOP.flac",
    10_802_865,
    "0c53ea7b070a029033c07a7a51aa76029f35afb88857f17fbe941c398bb915a1",
  ),
  asset(
    "field-rain-006-quiet-weather",
    "FIELD_RAIN_006_QUIET_WEATHER_48K24_LOOP.flac",
    4_665_546,
    "964648f934d65079b3b1334de6b17b615c27a4eb816a8b501361499e2cb7c347",
  ),
  asset(
    "field-rain-008-sheltered-rain",
    "FIELD_RAIN_008_SHELTERED_RAIN_48K24_LOOP.flac",
    5_024_158,
    "1c4c65f60bac8bf052bc01b4f52742553777038ae67240e4a1f8100b577c735b",
  ),
  asset(
    "field-stream-001-stone-current",
    "FIELD_STREAM_001_STONE_CURRENT_48K24_LOOP.flac",
    11_362_869,
    "37305d91b0e6991ebebc69b19f8f912ad55d504bef99e750f85d764b7c05b6aa",
  ),
  asset(
    "field-stream-002-moss-current",
    "FIELD_STREAM_002_MOSS_CURRENT_48K24_LOOP.flac",
    10_924_056,
    "7b05acaf1e40aa9a3e4bf87c57881b9512c8019b8dcadbdd333ed1f66eee05e9",
  ),
  asset(
    "field-stream-003-hidden-water",
    "FIELD_STREAM_003_HIDDEN_WATER_48K24_LOOP.flac",
    12_944_975,
    "5b97b6e4d9d2c614338296ac6e3410790ea1d055cefdb12798638129bade8d6b",
  ),
  asset(
    "field-stream-004-clear-stream",
    "FIELD_STREAM_004_CLEAR_STREAM_48K24_LOOP.flac",
    15_086_307,
    "bd5e15f87c5b5522aa1504ff2660305eac441e072cad4739d69f9315b8db655e",
  ),
  asset(
    "field-sea-001-tidal-breath",
    "FIELD_SEA_001_TIDAL_BREATH_48K24_LOOP.flac",
    25_690_927,
    "ff21967bb9bd7271522a69b3ca94ee03da958129f562cb94628f126489b9282b",
  ),
  asset(
    "field-sea-003-open-tide",
    "FIELD_SEA_003_OPEN_TIDE_48K24_LOOP.flac",
    26_805_900,
    "3e1474bbf664a80b0f5e298a3673ceb77d2d56fff9365ba822796df2ce95a5bb",
  ),
  asset(
    "field-sea-005-pearl-tide",
    "FIELD_SEA_005_PEARL_TIDE_48K24_LOOP.flac",
    30_675_903,
    "3ffa4826edb449a78225282f1a2e64430aeadaa38ca014c08b2083cca554d288",
  ),
  asset(
    "field-sea-007-blue-interval",
    "FIELD_SEA_007_BLUE_INTERVAL_48K24_LOOP.flac",
    16_728_723,
    "5336b26544a60a7917303b841e24f29f1e7867d771114a6fc9f7d3fc408b58f9",
  ),
] as const;

function asset(
  workId: string,
  objectKey: string,
  bytes: number,
  sha256: string,
) {
  return {
    assetId: `audio.${workId}`,
    workId,
    objectKey,
    bytes,
    sha256,
    mediaType: "audio/flac" as const,
  };
}

export const OFFLINE_CATALOG_MANIFEST: OfflineCatalogManifest = {
  schemaVersion: 1,
  catalogRevision: "adaptive-sessions-qa-1",
  assets,
  packages: [
    {
      packageId: "elemental-water-sessions-v1",
      revision: "1",
      title: "Elemental Water sessions",
      assetIds: assets.map(({ assetId }) => assetId),
      totalBytes: 177_645_113,
    },
  ],
};
