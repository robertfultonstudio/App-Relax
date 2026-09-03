import {
  AudioManager,
  PlaybackNotificationManager,
} from "react-native-audio-api";
import { ReactNativeAudioDriver } from "@/audio/reactNativeAudioApi/ReactNativeAudioDriver";
import { DEEP_SLEEP_432 } from "@/presets/deepSleep432";
import { getConsumerWork } from "@/content/consumerCatalog";
import { createSingleTrackProgram } from "@/domain/audio/consumerTypes";

jest.mock("react-native-audio-api", () => ({
  AudioContext: jest.fn(),
  AudioManager: {
    addSystemEventListener: jest.fn(),
    checkNotificationPermissions: jest.fn(),
    observeAudioInterruptions: jest.fn(),
    requestNotificationPermissions: jest.fn(),
    setAudioSessionActivity: jest.fn().mockResolvedValue(undefined),
    setAudioSessionOptions: jest.fn(),
  },
  PlaybackNotificationManager: {
    addEventListener: jest.fn(() => ({ remove: jest.fn() })),
    enableControl: jest.fn().mockResolvedValue(undefined),
    hide: jest.fn().mockResolvedValue(undefined),
    show: jest.fn().mockResolvedValue(undefined),
  },
}));

jest.mock("@/audio/reactNativeAudioApi/StreamingStemSource", () => ({
  createStreamingStemSource: jest.fn(() => ({
    source: {
      disconnect: jest.fn(),
      start: jest.fn(),
      stop: jest.fn(),
    },
    output: {
      connect: jest.fn(),
      disconnect: jest.fn(),
    },
  })),
  stopStreamingStemSource: jest.fn(),
}));

function createGainNode() {
  return {
    connect: jest.fn(),
    disconnect: jest.fn(),
    gain: {
      cancelScheduledValues: jest.fn(),
      linearRampToValueAtTime: jest.fn(),
      setValueAtTime: jest.fn(),
      value: 1,
    },
  };
}

function injectActiveContext(driver: ReactNativeAudioDriver) {
  const context = {
    currentTime: 0,
    resume: jest.fn().mockResolvedValue(undefined),
    state: "suspended",
    suspend: jest.fn().mockResolvedValue(undefined),
  };
  Object.assign(driver, { context, graphStarted: true });
  return context;
}

function injectLoadedContext(driver: ReactNativeAudioDriver) {
  const context = {
    createGain: jest.fn(createGainNode),
    currentTime: 1,
    destination: {},
    resume: jest.fn().mockResolvedValue(undefined),
    state: "running",
    suspend: jest.fn().mockResolvedValue(undefined),
  };
  Object.assign(driver, {
    brownNoiseBuffer: {},
    context,
    createBinauralGraph: jest.fn(),
    createBrownNoiseGraph: jest.fn(),
    loadedPresetId: DEEP_SLEEP_432.id,
    stemLocalUris: new Map(
      DEEP_SLEEP_432.stems.map((stem) => [stem.id, `file:///${stem.id}.wav`]),
    ),
  });
  return context;
}

async function flushMicrotasks(count = 12) {
  for (let index = 0; index < count; index += 1) {
    await Promise.resolve();
  }
}

describe("ReactNativeAudioDriver lifecycle", () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  it("releases audio focus for a manual pause", async () => {
    const driver = new ReactNativeAudioDriver();
    const context = injectActiveContext(driver);

    await driver.pause(true);

    expect(context.suspend).toHaveBeenCalledTimes(1);
    expect(AudioManager.observeAudioInterruptions).toHaveBeenCalledWith(false);
    expect(AudioManager.setAudioSessionActivity).toHaveBeenCalledWith(false);
  });

  it("keeps interruption observation during an interruption pause", async () => {
    const driver = new ReactNativeAudioDriver();
    const context = injectActiveContext(driver);

    await driver.pause(false);

    expect(context.suspend).toHaveBeenCalledTimes(1);
    expect(AudioManager.observeAudioInterruptions).not.toHaveBeenCalled();
    expect(AudioManager.setAudioSessionActivity).not.toHaveBeenCalled();
  });

  it("reacquires observation and session activity on resume", async () => {
    const driver = new ReactNativeAudioDriver();
    const context = injectActiveContext(driver);

    await driver.resume();

    expect(context.resume).toHaveBeenCalledTimes(1);
    expect(AudioManager.observeAudioInterruptions).toHaveBeenCalledWith(true);
    expect(AudioManager.setAudioSessionActivity).toHaveBeenCalledWith(true);
  });

  it("always hides playback controls during stop", async () => {
    const driver = new ReactNativeAudioDriver();

    await driver.stop();

    expect(PlaybackNotificationManager.hide).toHaveBeenCalledTimes(1);
  });

  it("creates and starts one looping buffer for a consumer noise colour", async () => {
    const source = {
      connect: jest.fn(),
      disconnect: jest.fn(),
      loop: false,
      start: jest.fn(),
      stop: jest.fn(),
    };
    const copyToChannel = jest.fn();
    const context = {
      createBuffer: jest.fn(() => ({ copyToChannel })),
      createBufferSource: jest.fn(() => source),
      createGain: jest.fn(createGainNode),
      currentTime: 1,
      destination: {},
      resume: jest.fn().mockResolvedValue(undefined),
      sampleRate: 48000,
      state: "suspended",
      suspend: jest.fn().mockResolvedValue(undefined),
    };
    const driver = new ReactNativeAudioDriver();
    Object.assign(driver, { context, masterGain: createGainNode() });
    const work = getConsumerWork("pink-noise")!;
    const program = createSingleTrackProgram(work);

    await driver.loadSingleTrack(program);
    await driver.startSingleTrack(program, 0.8);

    expect(context.createBuffer).toHaveBeenCalledWith(2, 384000, 48000);
    expect(copyToChannel).toHaveBeenCalledTimes(2);
    expect(context.createBufferSource).toHaveBeenCalledTimes(1);
    expect(source.loop).toBe(true);
    expect(source.start).toHaveBeenCalledWith(1.1);
  });

  it("does not block audible start while Android notification setup is pending", async () => {
    (AudioManager.checkNotificationPermissions as jest.Mock).mockReturnValue(
      new Promise(() => undefined),
    );
    const driver = new ReactNativeAudioDriver();
    injectLoadedContext(driver);

    const result = await Promise.race([
      driver
        .start(DEEP_SLEEP_432, DEEP_SLEEP_432.defaultMix)
        .then(() => "started"),
      new Promise<string>((resolve) =>
        setTimeout(() => resolve("notification-timeout"), 100),
      ),
    ]);

    expect(result).toBe("started");
    expect(AudioManager.checkNotificationPermissions).toHaveBeenCalledTimes(1);
  });

  it.each(["stop", "pause"] as const)(
    "does not show stale playing controls when permission resolves after %s",
    async (action) => {
      let resolvePermission: (permission: string) => void = () => undefined;
      const permission = new Promise<string>((resolve) => {
        resolvePermission = resolve;
      });
      (
        AudioManager.checkNotificationPermissions as jest.Mock
      ).mockResolvedValue("Undetermined");
      (
        AudioManager.requestNotificationPermissions as jest.Mock
      ).mockReturnValue(permission);
      const driver = new ReactNativeAudioDriver();
      injectLoadedContext(driver);

      await driver.start(DEEP_SLEEP_432, DEEP_SLEEP_432.defaultMix);
      await Promise.resolve();
      expect(AudioManager.requestNotificationPermissions).toHaveBeenCalledTimes(
        1,
      );

      if (action === "stop") {
        await driver.stop();
      } else {
        await driver.pause(true);
      }
      resolvePermission("Granted");
      await Promise.resolve();
      await Promise.resolve();

      expect(PlaybackNotificationManager.show).not.toHaveBeenCalledWith(
        expect.objectContaining({ state: "playing" }),
      );
    },
  );

  it("restores paused controls when an earlier playing update resolves late", async () => {
    let resolvePlayingUpdate: () => void = () => undefined;
    const playingUpdate = new Promise<void>((resolve) => {
      resolvePlayingUpdate = resolve;
    });
    (AudioManager.checkNotificationPermissions as jest.Mock).mockResolvedValue(
      "Granted",
    );
    (PlaybackNotificationManager.show as jest.Mock)
      .mockImplementationOnce(() => playingUpdate)
      .mockResolvedValue(undefined);
    const driver = new ReactNativeAudioDriver();
    injectLoadedContext(driver);

    await driver.start(DEEP_SLEEP_432, DEEP_SLEEP_432.defaultMix);
    await flushMicrotasks();
    expect(PlaybackNotificationManager.show).toHaveBeenCalledWith(
      expect.objectContaining({ state: "playing" }),
    );

    await driver.pause(true);
    resolvePlayingUpdate();
    await flushMicrotasks();

    expect(PlaybackNotificationManager.show).toHaveBeenLastCalledWith(
      expect.objectContaining({ state: "paused", speed: 0 }),
    );
  });
});
