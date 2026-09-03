import type { AudioGraphDriver } from "./AudioGraphDriver";
import { ReactNativeAudioDriver } from "./reactNativeAudioApi/ReactNativeAudioDriver";

export function createAudioGraphDriver(): AudioGraphDriver {
  return new ReactNativeAudioDriver();
}
