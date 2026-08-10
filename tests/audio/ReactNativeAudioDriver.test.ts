import {
  AudioManager,
  PlaybackNotificationManager,
} from "react-native-audio-api";
import { ReactNativeAudioDriver } from "@/audio/reactNativeAudioApi/ReactNativeAudioDriver";

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
});
