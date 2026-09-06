import type { AudioGraphDriver } from "./AudioGraphDriver";
import { PwaWebAudioSourceResolver } from "./web/PwaWebAudioSourceResolver";
import { WebAudioDriver } from "./web/WebAudioDriver";

export function createPwaAudioGraphDriver(): AudioGraphDriver {
  return new WebAudioDriver(new PwaWebAudioSourceResolver());
}
