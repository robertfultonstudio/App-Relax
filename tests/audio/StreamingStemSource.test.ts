import type { AudioContext } from "react-native-audio-api";
import {
  createStreamingStemSource,
  stopStreamingStemSource,
} from "@/audio/reactNativeAudioApi/StreamingStemSource";

function createHarness(sourceAvailable = true) {
  const source = {
    disconnect: jest.fn(),
    pause: jest.fn(),
    playbackRate: 1,
    preservesPitch: true,
    seekToTime: jest.fn(),
    start: jest.fn(),
    stop: jest.fn(),
    volume: 1,
  };
  const output = {
    disconnect: jest.fn(),
  };
  const createFileSource = jest.fn(() => (sourceAvailable ? source : null));
  const createMediaElementSource = jest.fn((handle) => {
    expect(handle.getFileSourceNode()).toBe(source);
    return output;
  });
  const context = {
    context: { createFileSource },
    createMediaElementSource,
    currentTime: 12,
  } as unknown as AudioContext;

  return {
    context,
    createFileSource,
    createMediaElementSource,
    output,
    source,
  };
}

describe("streaming stem source", () => {
  it("routes a decoded file path through a media element before playback", () => {
    const harness = createHarness();

    const runtime = createStreamingStemSource(
      harness.context,
      "file:///cache/Moon%20drone.wav",
    );

    expect(harness.createFileSource).toHaveBeenCalledWith({
      source: "/cache/Moon drone.wav",
      loop: true,
      volume: 1,
      playbackRate: 1,
      preservesPitch: true,
    });
    expect(harness.createMediaElementSource).toHaveBeenCalledTimes(1);
    expect(harness.source.start).not.toHaveBeenCalled();
    expect(runtime.source).toBe(harness.source);
    expect(runtime.output).toBe(harness.output);
  });

  it("fails clearly when the native file source is unavailable", () => {
    const harness = createHarness(false);

    expect(() =>
      createStreamingStemSource(harness.context, "file:///cache/stem.wav"),
    ).toThrow("The native audio file source is unavailable.");
    expect(harness.createMediaElementSource).not.toHaveBeenCalled();
  });

  it("stops and disconnects both sides of the routed source", () => {
    const harness = createHarness();
    const runtime = createStreamingStemSource(
      harness.context,
      "file:///cache/stem.wav",
    );

    stopStreamingStemSource(runtime);

    expect(harness.source.stop).toHaveBeenCalledWith(0);
    expect(harness.output.disconnect).toHaveBeenCalledTimes(1);
    expect(harness.source.disconnect).toHaveBeenCalledTimes(1);
  });
});
