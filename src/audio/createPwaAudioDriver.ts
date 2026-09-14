import type { AudioGraphDriver } from "./AudioGraphDriver";
import { PwaWebAudioSourceResolver } from "./web/PwaWebAudioSourceResolver";
import { WebAudioDriver } from "./web/WebAudioDriver";
import { createPwaPcmReaderFactory } from "@/pwa-review/createPwaPcmReader";

export function createPwaAudioGraphDriver(): AudioGraphDriver {
  return new WebAudioDriver(
    new PwaWebAudioSourceResolver(),
    true,
    createPwaPcmReaderFactory(),
  );
}
