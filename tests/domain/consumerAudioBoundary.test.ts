import { existsSync, readFileSync } from "node:fs";
import { join } from "node:path";
import { STEM_ASSETS } from "@/audio/reactNativeAudioApi/stemAssets";
import { getConsumerWork } from "@/content/consumerCatalog";

const root = join(__dirname, "../..");
const source = (path: string) => readFileSync(join(root, path), "utf8");

it("keeps every technical route exclusively in the QA Router root", () => {
  for (const path of [
    "audio-test.tsx",
    "category/[categoryId].tsx",
    "session/[sessionId].tsx",
  ]) {
    expect(existsSync(join(root, "src/app", path))).toBe(false);
    expect(existsSync(join(root, "src/app-qa", path))).toBe(true);
    expect(existsSync(join(root, "src/app-pwa", path))).toBe(false);
  }
  expect(source("src/app-qa/_layout.tsx")).toContain(
    "@/qa/createQaAudioDriver",
  );
  expect(source("src/app/_layout.tsx")).not.toContain("@/qa/");
});

it("keeps zero ATP01 consumer assets and all three original QA descriptors", () => {
  expect(
    existsSync(join(root, "src/audio/reactNativeAudioApi/consumerAssets.ts")),
  ).toBe(false);
  expect(Object.keys(STEM_ASSETS)).toHaveLength(3);
  for (const id of ["moon-drone", "deep-river", "soft-air"]) {
    expect(getConsumerWork(id)?.familyId).toBe("audio-test-pack-01");
  }
  const consumerGraph = [
    "src/audio/createAudioDriver.ts",
    "src/audio/createAudioDriver.web.ts",
    "src/audio/reactNativeAudioApi/ReactNativeAudioDriver.ts",
    "src/audio/web/MetroWebAudioSourceResolver.ts",
  ]
    .map(source)
    .join("\n");
  expect(consumerGraph).not.toMatch(/consumerAssets|test-pack-01|SLEEP_/);
});

it("injects the full technical registry only from QA factories and excludes it from EAS", () => {
  for (const path of [
    "src/audio/createAudioDriver.ts",
    "src/audio/createAudioDriver.web.ts",
    "src/audio/reactNativeAudioApi/ReactNativeAudioDriver.ts",
    "src/audio/web/MetroWebAudioSourceResolver.ts",
  ]) {
    expect(source(path)).not.toMatch(/from ["'][^"']*stemAssets/);
  }
  for (const suffix of ["ts", "web.ts"]) {
    expect(source(`src/qa/createQaAudioDriver.${suffix}`)).toContain(
      "STEM_ASSETS",
    );
  }
  const ignore = source(".easignore").split("\n");
  expect(ignore).toEqual(
    expect.arrayContaining([
      "/src/app-qa/",
      "/src/qa/",
      "/src/audio/reactNativeAudioApi/stemAssets.ts",
      "/assets/audio/test-pack-01/",
    ]),
  );
});

it("keeps the requested word out of visible consumer and review copy without rewriting technical comments", () => {
  for (const path of [
    "src/components/AdaptiveSessionSetup.tsx",
    "src/pwa-review/PwaPlayerReviewControls.tsx",
    "src/pwa-review/IndividualTrackReview.tsx",
  ]) {
    expect(source(path)).not.toMatch(/playlist/i);
  }
});
