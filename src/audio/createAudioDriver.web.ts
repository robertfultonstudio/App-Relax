import type { AudioGraphDriver } from "./AudioGraphDriver";
import { MetroWebAudioSourceResolver } from "./web/MetroWebAudioSourceResolver";
import { WebAudioDriver } from "./web/WebAudioDriver";

export function createAudioGraphDriver(): AudioGraphDriver {
  return new WebAudioDriver(new MetroWebAudioSourceResolver());
}
