/** @jest-environment jsdom */

import { requestPlaybackAudioSession } from "@/audio/web/requestPlaybackAudioSession";

const original = Object.getOwnPropertyDescriptor(navigator, "audioSession");
afterEach(() => {
  if (original) Object.defineProperty(navigator, "audioSession", original);
  else Reflect.deleteProperty(navigator, "audioSession");
});

it("requests playback instead of ambient and is idempotent", () => {
  let type = "auto";
  const set = jest.fn((next: string) => {
    type = next;
  });
  Object.defineProperty(navigator, "audioSession", {
    configurable: true,
    value: {
      get type() {
        return type;
      },
      set type(next: string) {
        set(next);
      },
    },
  });
  requestPlaybackAudioSession();
  requestPlaybackAudioSession();
  expect(set).toHaveBeenCalledTimes(1);
  expect(set).toHaveBeenCalledWith("playback");
});

it("does not break browsers without AudioSession", () => {
  Object.defineProperty(navigator, "audioSession", {
    configurable: true,
    value: undefined,
  });
  expect(requestPlaybackAudioSession).not.toThrow();
});

it("does not break Play if the optional API rejects a setting", () => {
  Object.defineProperty(navigator, "audioSession", {
    configurable: true,
    value: {
      get type() {
        return "auto";
      },
      set type(_value: string) {
        throw new Error("Not supported");
      },
    },
  });
  expect(requestPlaybackAudioSession).not.toThrow();
});
