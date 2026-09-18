import {
  AudioManager,
  PlaybackNotificationManager,
} from "react-native-audio-api";
import { ReactNativeAudioDriver } from "@/audio/reactNativeAudioApi/ReactNativeAudioDriver";
import { DEEP_SLEEP_432 } from "@/presets/deepSleep432";
import { STEM_ASSETS } from "@/audio/reactNativeAudioApi/stemAssets";
import { getConsumerWork } from "@/content/consumerCatalog";
import { createSingleTrackProgram } from "@/domain/audio/consumerTypes";
import { createAdaptiveSessionProgram } from "@/domain/sessions/continuumPlanner";
import {
  createStreamingStemSource,
  stopStreamingStemSource,
} from "@/audio/reactNativeAudioApi/StreamingStemSource";

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
      currentTime: 0,
      disconnect: jest.fn(),
      pause: jest.fn(),
      seekToTime: jest.fn(),
      start: jest.fn(),
      stop: jest.fn(),
    },
    output: {
      connect: jest.fn(),
      disconnect: jest.fn(),
    },
  })),
  stopStreamingStemSource: jest.fn(),
  prepareStreamingFilePosition: jest.fn().mockResolvedValue(undefined),
}));

function createGainNode() {
  return {
    connect: jest.fn(),
    disconnect: jest.fn(),
    gain: {
      cancelScheduledValues: jest.fn(),
      cancelAndHoldAtTime: jest.fn(),
      linearRampToValueAtTime: jest.fn(),
      setValueAtTime: jest.fn(),
      setValueCurveAtTime: jest.fn(),
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
  it("rejects a technical preset on the consumer driver before touching current playback", async () => {
    const driver = new ReactNativeAudioDriver();
    const stop = jest.spyOn(driver, "stop");
    await expect(driver.loadPreset(DEEP_SLEEP_432)).rejects.toThrow(
      "Technical playback is unavailable",
    );
    expect(stop).not.toHaveBeenCalled();
  });

  it("accepts the same loaded technical preset when the QA registry is explicitly injected", async () => {
    const driver = new ReactNativeAudioDriver(undefined, {}, STEM_ASSETS);
    injectLoadedContext(driver);
    const stop = jest.spyOn(driver, "stop");
    await expect(driver.loadPreset(DEEP_SLEEP_432)).resolves.toBeUndefined();
    expect(stop).not.toHaveBeenCalled();
  });

  beforeEach(() => {
    jest.clearAllMocks();
  });

  it("loads an external single track only through a verified lease and releases it once on Stop", async () => {
    const release = jest.fn();
    const work = getConsumerWork("astral-thread")!;
    const acquire = jest.fn(async (workId: string) => ({
      workId,
      uri: "file:///private/music.flac",
      sha256: "a".repeat(64),
      byteSize: 120,
      release,
    }));
    const driver = new ReactNativeAudioDriver({ acquire });
    const context = injectLoadedContext(driver);
    Object.assign(driver, { masterGain: createGainNode() });
    const program = createSingleTrackProgram(work);
    await driver.loadSingleTrack(program);
    await driver.startSingleTrack(program, 0);
    expect(acquire).toHaveBeenCalledWith(work.id);
    expect(createStreamingStemSource).toHaveBeenCalledWith(
      context,
      "file:///private/music.flac",
    );
    expect(context.createGain.mock.results.at(-1)?.value.gain.value).toBe(0);
    await driver.stop();
    await driver.stop();
    expect(release).toHaveBeenCalledTimes(1);
  });

  it("releases a late catalog lease without resurrecting a stopped selection", async () => {
    const release = jest.fn();
    const work = getConsumerWork("astral-thread")!;
    let acquired!: (file: {
      workId: string;
      uri: string;
      sha256: string;
      byteSize: number;
      release: () => void;
    }) => void;
    const driver = new ReactNativeAudioDriver({
      acquire: () =>
        new Promise((resolve) => {
          acquired = resolve;
        }),
    });
    injectLoadedContext(driver);
    const rejected = expect(
      driver.loadSingleTrack(createSingleTrackProgram(work)),
    ).rejects.toThrow("cancelled");
    await flushMicrotasks();
    await driver.stop();
    acquired({
      workId: work.id,
      uri: "file:///private/music.flac",
      sha256: "a".repeat(64),
      byteSize: 120,
      release,
    });
    await rejected;
    expect(release).toHaveBeenCalledTimes(1);
    expect(createStreamingStemSource).not.toHaveBeenCalled();
  });

  it("rejects a wrong-work catalog lease and releases it", async () => {
    const release = jest.fn();
    const driver = new ReactNativeAudioDriver({
      acquire: async () => ({
        workId: "wrong",
        uri: "file:///private/music.flac",
        sha256: "a".repeat(64),
        byteSize: 120,
        release,
      }),
    });
    injectLoadedContext(driver);
    await expect(
      driver.loadSingleTrack(
        createSingleTrackProgram(getConsumerWork("astral-thread")!),
      ),
    ).rejects.toThrow("verified local file lease");
    expect(release).toHaveBeenCalledTimes(1);
  });

  it("does not restart a preset after Stop wins a pending focus request", async () => {
    let activated!: () => void;
    (AudioManager.setAudioSessionActivity as jest.Mock).mockImplementationOnce(
      () =>
        new Promise<void>((resolve) => {
          activated = resolve;
        }),
    );
    const driver = new ReactNativeAudioDriver();
    injectLoadedContext(driver);
    const rejected = expect(
      driver.start(DEEP_SLEEP_432, DEEP_SLEEP_432.defaultMix),
    ).rejects.toThrow("cancelled");
    await flushMicrotasks();
    await driver.stop();
    activated();
    await rejected;
    expect(AudioManager.setAudioSessionActivity).toHaveBeenLastCalledWith(
      false,
    );
    for (const result of (createStreamingStemSource as jest.Mock).mock.results)
      expect(result.value.source.start).not.toHaveBeenCalled();
  });

  it("does not resume after Stop wins a pending context resume", async () => {
    const driver = new ReactNativeAudioDriver();
    const context = injectActiveContext(driver);
    let resumed!: () => void;
    context.resume.mockReturnValueOnce(
      new Promise<void>((resolve) => {
        resumed = resolve;
      }),
    );
    const rejected = expect(driver.resume()).rejects.toThrow("cancelled");
    await driver.stop();
    resumed();
    await rejected;
    expect(AudioManager.setAudioSessionActivity).not.toHaveBeenCalledWith(true);
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

  it("continues Stop cleanup after gain and context failures", async () => {
    const driver = new ReactNativeAudioDriver();
    const context = injectLoadedContext(driver);
    context.suspend.mockRejectedValue(new Error("native context failure"));
    const master = createGainNode();
    master.gain.cancelScheduledValues.mockImplementation(() => {
      throw new Error("native parameter failure");
    });
    const gain = createGainNode();
    gain.disconnect.mockImplementation(() => {
      throw new Error("native disconnect failure");
    });
    Object.assign(driver, {
      masterGain: master,
      graphStarted: true,
      stemRuntime: new Map([
        ["drone", { source: {}, output: {}, gain }],
        ["ambience", { source: {}, output: {}, gain: createGainNode() }],
      ]),
    });
    await expect(driver.stop()).resolves.toBeUndefined();
    expect(stopStreamingStemSource).toHaveBeenCalledTimes(2);
    expect(PlaybackNotificationManager.hide).toHaveBeenCalledTimes(1);
    expect(AudioManager.setAudioSessionActivity).toHaveBeenLastCalledWith(
      false,
    );
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

  it("fails closed instead of pretending native adaptive delivery is ready", async () => {
    const driver = new ReactNativeAudioDriver();
    const program = createAdaptiveSessionProgram({
      outcome: "meditation",
      durationMinutes: 20,
      mode: "sound-only",
      soundKind: "nature",
      seed: "native-gate",
      allowProvisionalMetadata: true,
    });
    await expect(driver.loadAdaptiveSession(program)).rejects.toThrow(
      "verified downloaded packages",
    );
    await expect(driver.startAdaptiveSession(program, 0.8)).rejects.toThrow(
      "verified downloaded packages",
    );
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

  it("runs the native adaptive graph only with injected verified leases, and Stop remains immediate during its final fade", async () => {
    const release = jest.fn();
    const resolver = {
      acquire: jest.fn(async (workId: string) => ({
        uri: `file:///cache/${workId}.flac`,
        workId,
        sha256: "b".repeat(64),
        byteSize: 100,
        release,
      })),
    };
    const driver = new ReactNativeAudioDriver(resolver);
    injectLoadedContext(driver);
    Object.assign(driver, { masterGain: createGainNode() });
    const program = createAdaptiveSessionProgram({
      outcome: "meditation",
      durationMinutes: 20,
      mode: "sound-only",
      soundKind: "nature",
      seed: "native-driver-contract",
      allowProvisionalMetadata: true,
    });
    await driver.loadAdaptiveSession(program);
    await driver.startAdaptiveSession(program, 0.8);
    expect(createStreamingStemSource).toHaveBeenCalledTimes(2);
    await driver.scheduleFadeOut(5000, 5000);
    await driver.stop();
    expect(stopStreamingStemSource).toHaveBeenCalledTimes(2);
    expect(release).toHaveBeenCalledTimes(program.works.length);
    expect(AudioManager.setAudioSessionActivity).toHaveBeenLastCalledWith(
      false,
    );
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
