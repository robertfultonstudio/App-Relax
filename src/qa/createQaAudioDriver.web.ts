import type { AudioGraphDriver } from "@/audio/AudioGraphDriver";
import { STEM_ASSETS } from "@/audio/reactNativeAudioApi/stemAssets";
import { MetroWebAudioSourceResolver } from "@/audio/web/MetroWebAudioSourceResolver";
import { WebAudioDriver } from "@/audio/web/WebAudioDriver";

export function createAudioGraphDriver(): AudioGraphDriver {
  return new WebAudioDriver(new MetroWebAudioSourceResolver(STEM_ASSETS));
}
