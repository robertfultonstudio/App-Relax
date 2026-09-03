import type { AudioGraphDriver } from "./AudioGraphDriver";
import { WebAudioDriver } from "./web/WebAudioDriver";

export function createAudioGraphDriver(): AudioGraphDriver {
  return new WebAudioDriver();
}
