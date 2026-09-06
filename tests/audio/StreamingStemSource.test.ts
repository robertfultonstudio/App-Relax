import type { AudioContext } from "react-native-audio-api";
import {
  createStreamingStemSource,
  prepareStreamingFilePosition,
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
  it.each([
    "https://example.test/stem.wav",
    "/cache/stem.wav",
    "file://host/stem.wav",
    "file:////server/stem.wav",
  ])("rejects non-local or ambiguous URI %s", (uri) => {
    const harness = createHarness();
    expect(() => createStreamingStemSource(harness.context, uri)).toThrow(
      "absolute local file URI",
    );
    expect(harness.createFileSource).not.toHaveBeenCalled();
  });
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

  it("stops the raw source if graph binding fails", () => {
    const harness = createHarness();
    harness.createMediaElementSource.mockImplementation(() => {
      throw new Error("binding failed");
    });
    expect(() =>
      createStreamingStemSource(harness.context, "file:///cache/stem.wav"),
    ).toThrow("binding failed");
    expect(harness.source.pause).toHaveBeenCalledTimes(1);
    expect(harness.source.stop).toHaveBeenCalledWith(0);
    expect(harness.source.disconnect).toHaveBeenCalledTimes(1);
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
    expect(harness.source.pause.mock.invocationCallOrder[0]).toBeLessThan(
      harness.output.disconnect.mock.invocationCallOrder[0],
    );
  });

  it("waits for decoded progress after seeking and pauses behind the silent barrier", async () => {
    jest.useFakeTimers();
    try {
      const harness = createHarness();
      const source = Object.assign(harness.source, {
        duration: 180,
        currentTime: 0,
      });
      const runtime = createStreamingStemSource(
        harness.context,
        "file:///cache/stem.wav",
      );
      const prepared = prepareStreamingFilePosition(
        harness.context,
        runtime,
        60,
        180,
        new AbortController().signal,
      );
      expect(source.start).toHaveBeenCalledWith(12);
      expect(source.seekToTime).toHaveBeenCalledWith(60);
      source.currentTime = 60.005;
      await jest.advanceTimersByTimeAsync(10);
      await prepared;
      expect(source.pause).toHaveBeenCalledTimes(1);
      expect(jest.getTimerCount()).toBe(0);
    } finally {
      jest.useRealTimers();
    }
  });

  it("times out an unconfirmed native seek without claiming success", async () => {
    jest.useFakeTimers();
    try {
      const harness = createHarness();
      Object.assign(harness.source, { duration: 180, currentTime: 0 });
      const runtime = createStreamingStemSource(
        harness.context,
        "file:///cache/stem.wav",
      );
      const prepared = expect(
        prepareStreamingFilePosition(
          harness.context,
          runtime,
          60,
          180,
          new AbortController().signal,
        ),
      ).rejects.toThrow("did not confirm");
      await jest.advanceTimersByTimeAsync(5000);
      await prepared;
      expect(harness.source.pause).toHaveBeenCalledTimes(1);
      expect(jest.getTimerCount()).toBe(0);
    } finally {
      jest.useRealTimers();
    }
  });

  it("aborts a pending native seek promptly", async () => {
    const harness = createHarness();
    Object.assign(harness.source, { duration: 180, currentTime: 0 });
    const runtime = createStreamingStemSource(
      harness.context,
      "file:///cache/stem.wav",
    );
    const abort = new AbortController();
    const prepared = prepareStreamingFilePosition(
      harness.context,
      runtime,
      60,
      180,
      abort.signal,
    );
    abort.abort();
    await expect(prepared).rejects.toThrow("cancelled");
    expect(harness.source.pause).toHaveBeenCalledTimes(1);
  });
});
