import { Asset } from "expo-asset";
import { MetroWebAudioSourceResolver } from "@/audio/web/MetroWebAudioSourceResolver";
import { STEM_ASSETS } from "@/audio/reactNativeAudioApi/stemAssets";
import { getConsumerWork } from "@/content/consumerCatalog";

it("resolves no technical stems in the consumer resolver, but all three in the explicit QA resolver", () => {
  const asset = jest
    .spyOn(Asset, "fromModule")
    .mockReturnValue({ uri: "asset://canonical.wav" } as Asset);
  try {
    const consumer = new MetroWebAudioSourceResolver();
    const qa = new MetroWebAudioSourceResolver(STEM_ASSETS);
    for (const key of [
      "sleepDrone001",
      "sleepAmbience001",
      "sleepTexture001",
    ] as const) {
      expect(consumer.resolveStem(key)).toBeNull();
      expect(qa.resolveStem(key)).toBe("asset://canonical.wav");
    }
    for (const id of ["moon-drone", "deep-river"]) {
      expect(consumer.resolveWork(getConsumerWork(id)!)).toBeNull();
      expect(qa.resolveWork(getConsumerWork(id)!)).toBe(
        "asset://canonical.wav",
      );
    }
  } finally {
    asset.mockRestore();
  }
});
