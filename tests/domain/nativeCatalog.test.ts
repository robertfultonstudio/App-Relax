import manifest from "@/content/nativeAudioManifest.json";
import { CONSUMER_AUDIO_WORKS } from "@/content/consumerCatalog";
import flac from "@/pwa-review/flacIndexManifest.json";
import local from "@/content/localNaturalAudioFiles.json";
import { isAdaptivePlaybackAvailable } from "@/domain/sessions/playbackAvailability";

it("maps every admitted external recording to exactly one trusted native file", () => {
  const works = CONSUMER_AUDIO_WORKS.filter(
    (w) => w.availability === "local-preview-file",
  );
  expect(works).toHaveLength(47);
  expect(manifest.files).toHaveLength(47);
  expect(new Set(manifest.files.map((f) => f.filename)).size).toBe(47);
  for (const work of works) {
    const asset = manifest.files.find((f) => f.workId === work.id)!;
    expect(asset.frames).toBe(work.frameCount);
    const source = flac.files.find((f) => f.filename === asset.filename);
    const wav = local.files.find((f) => f.filename === asset.filename);
    expect(asset.sha256).toBe(source?.sourceSha256 ?? wav?.sha256);
    expect(asset.bytes).toBe(source?.bytes ?? wav?.bytes);
  }
  expect(manifest.files.reduce((s, f) => s + f.bytes, 0)).toBe(2434210564);
  expect(
    manifest.files.some((f) =>
      /eclypsis|nirvana|sleep_texture/i.test(f.filename),
    ),
  ).toBe(false);
});
it("opts in Android internal build only, independently from verified file availability", () => {
  const base = {
    platform: "android",
    nodeEnv: "production",
    hostname: undefined,
  };
  expect(isAdaptivePlaybackAvailable(base)).toBe(false);
  expect(isAdaptivePlaybackAvailable({ ...base, nativePreview: "1" })).toBe(
    true,
  );
  expect(
    isAdaptivePlaybackAvailable({
      ...base,
      platform: "ios",
      nativePreview: "1",
    }),
  ).toBe(false);
});
