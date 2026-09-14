import { WebAudioDriver } from "@/audio/web/WebAudioDriver";
import { positionMediaElement } from "@/audio/web/positionMediaElement";
import { CONSUMER_AUDIO_WORKS } from "@/content/consumerCatalog";
import { createSingleTrackProgram } from "@/domain/audio/consumerTypes";
import { DEEP_SLEEP_432 } from "@/presets/deepSleep432";
import { createQaPairProgram } from "@/qa/qaCatalog";

class DriverMediaElement {
  readonly listeners = new Map<string, Set<EventListener>>();
  currentTime = 0;
  error: MediaError | null = null;
  loop = false;
  preload = "";
  readyState = 1;
  seeking = false;
  prepareAt?: (position: number) => Promise<void>;
  src: string;
  readonly pause = jest.fn();
  readonly play = jest.fn(async () => {});
  readonly load = jest.fn();
  readonly addEventListener = jest.fn(
    (type: string, listener: EventListener) => {
      const listeners = this.listeners.get(type) ?? new Set<EventListener>();
      listeners.add(listener);
      this.listeners.set(type, listeners);
    },
  );
  readonly removeEventListener = jest.fn(
    (type: string, listener: EventListener) => {
      this.listeners.get(type)?.delete(listener);
    },
  );

  constructor(src = "") {
    this.src = src;
  }

  removeAttribute(name: string): void {
    if (name === "src") this.src = "";
  }
}

function driverAudioParam() {
  return {
    value: 1,
    cancelAndHoldAtTime: jest.fn(),
    cancelScheduledValues: jest.fn(),
    linearRampToValueAtTime: jest.fn(),
    setValueAtTime: jest.fn(),
  };
}

function createDriverContext() {
  let state: AudioContextState = "suspended";
  const connect = jest.fn((destination: AudioNode) => destination);
  const context = {
    currentTime: 0,
    destination: {} as AudioDestinationNode,
    sampleRate: 48000,
    get state() {
      return state;
    },
    resume: jest.fn(async () => {
      state = "running";
    }),
    suspend: jest.fn(async () => {
      state = "suspended";
    }),
    close: jest.fn(async () => {
      state = "closed";
    }),
    createGain: jest.fn(() => ({
      connect,
      disconnect: jest.fn(),
      gain: driverAudioParam(),
    })),
    createMediaElementSource: jest.fn(() => ({
      connect,
      disconnect: jest.fn(),
    })),
    createBuffer: jest.fn(() => ({ copyToChannel: jest.fn() })),
    createBufferSource: jest.fn(() => ({
      buffer: null,
      connect,
      disconnect: jest.fn(),
      loop: false,
      start: jest.fn(),
      stop: jest.fn(),
    })),
    createOscillator: jest.fn(() => ({
      connect,
      disconnect: jest.fn(),
      frequency: { value: 0 },
      start: jest.fn(),
      stop: jest.fn(),
    })),
    createStereoPanner: jest.fn(() => ({
      connect,
      pan: { value: 0 },
    })),
  } as unknown as AudioContext;
  return context;
}

function installDriverBrowser(
  elements: DriverMediaElement[],
  configure?: (element: DriverMediaElement, index: number) => void,
) {
  const context = createDriverContext();
  Object.defineProperty(globalThis, "Audio", {
    configurable: true,
    value: jest.fn((src?: string) => {
      const element = new DriverMediaElement(src);
      configure?.(element, elements.length);
      elements.push(element);
      return element;
    }),
    writable: true,
  });
  Object.defineProperty(window, "AudioContext", {
    configurable: true,
    value: jest.fn(() => context),
    writable: true,
  });
  return context;
}

async function waitForDriverState(ready: () => boolean) {
  for (let attempt = 0; attempt < 200 && !ready(); attempt++)
    await Promise.resolve();
  expect(ready()).toBe(true);
}

function fileProgram(id = "field-sea-003-open-tide") {
  const work = CONSUMER_AUDIO_WORKS.find((candidate) => candidate.id === id);
  if (!work) throw new Error("Missing catalog test fixture.");
  return createSingleTrackProgram(work);
}

describe("WebAudioDriver file seeking", () => {
  it("requests the media audio session in the direct gesture before resuming Web Audio", async () => {
    const context = installDriverBrowser([]);
    const original = Object.getOwnPropertyDescriptor(navigator, "audioSession");
    const set = jest.fn();
    Object.defineProperty(navigator, "audioSession", {
      configurable: true,
      value: {
        get type() {
          return "auto";
        },
        set type(value: string) {
          set(value);
        },
      },
    });
    const driver = new WebAudioDriver({
      resolveStem: () => null,
      resolveWork: () => null,
    });
    try {
      driver.activateUserGesture();
      expect(set).toHaveBeenCalledWith("playback");
      expect(set.mock.invocationCallOrder[0]).toBeLessThan(
        jest.mocked(context.resume).mock.invocationCallOrder[0],
      );
    } finally {
      await driver.dispose();
      if (original) Object.defineProperty(navigator, "audioSession", original);
      else Reflect.deleteProperty(navigator, "audioSession");
    }
  });
  it("resumes PCM scheduling after a playing seek but keeps paused seeks silent", async () => {
    const elements: DriverMediaElement[] = [];
    installDriverBrowser(elements, (element) => {
      element.prepareAt = jest.fn(async (at) => {
        element.pause();
        element.currentTime = at;
      });
    });
    const driver = new WebAudioDriver({
      resolveStem: () => null,
      resolveWork: () => "/sound.flac",
    });
    const program = fileProgram();
    await driver.loadSingleTrack(program);
    await driver.startSingleTrack(program, 0.8);
    const element = elements[0];
    element.play.mockClear();
    await driver.seekSingleTrack(42);
    expect(element.prepareAt).toHaveBeenLastCalledWith(42);
    expect(element.play).toHaveBeenCalledTimes(1);
    await driver.pause(true);
    element.play.mockClear();
    await driver.seekSingleTrack(50);
    expect(element.play).not.toHaveBeenCalled();
    await driver.dispose();
  });
  it("rejects a late PCM seek after Stop without resurrecting playback", async () => {
    const elements: DriverMediaElement[] = [];
    installDriverBrowser(elements);
    const driver = new WebAudioDriver({
      resolveStem: () => null,
      resolveWork: () => "/sound.flac",
    });
    const program = fileProgram();
    await driver.loadSingleTrack(program);
    await driver.startSingleTrack(program, 0.8);
    let complete!: () => void;
    elements[0].prepareAt = () =>
      new Promise<void>((resolve) => {
        complete = resolve;
      });
    const seeking = driver.seekSingleTrack(40);
    const rejected = expect(seeking).rejects.toThrow();
    await driver.stop();
    elements[0].play.mockClear();
    complete();
    await rejected;
    expect(elements[0].play).not.toHaveBeenCalled();
    await driver.dispose();
  });
  it("waits for the browser seeked event before confirming a new position", async () => {
    const listeners = new Map<string, EventListener>();
    let currentTime = 0;
    let seeking = false;
    const element = {
      readyState: 1,
      get currentTime() {
        return currentTime;
      },
      set currentTime(value: number) {
        currentTime = value;
        seeking = true;
      },
      get seeking() {
        return seeking;
      },
      addEventListener: jest.fn(
        (type: string, listener: EventListenerOrEventListenerObject) => {
          if (typeof listener === "function") listeners.set(type, listener);
        },
      ),
      removeEventListener: jest.fn((type: string) => {
        listeners.delete(type);
      }),
    } as unknown as HTMLAudioElement;
    let completed = false;
    const seek = positionMediaElement(element, 74).then(() => {
      completed = true;
    });
    await Promise.resolve();
    expect(currentTime).toBe(74);
    expect(completed).toBe(false);

    seeking = false;
    listeners.get("seeked")?.(new Event("seeked"));
    await seek;
    expect(completed).toBe(true);
    expect(element.removeEventListener).toHaveBeenCalledWith(
      "seeked",
      expect.any(Function),
    );
  });

  it("rejects a seeked event when the browser landed at another position", async () => {
    const listeners = new Map<string, EventListener>();
    let currentTime = 0;
    let seeking = false;
    const element = {
      readyState: 1,
      get currentTime() {
        return currentTime;
      },
      set currentTime(value: number) {
        currentTime = value;
        seeking = true;
      },
      get seeking() {
        return seeking;
      },
      addEventListener: jest.fn(
        (type: string, listener: EventListenerOrEventListenerObject) => {
          if (typeof listener === "function") listeners.set(type, listener);
        },
      ),
      removeEventListener: jest.fn((type: string) => {
        listeners.delete(type);
      }),
    } as unknown as HTMLAudioElement;

    const seek = positionMediaElement(element, 74);
    await Promise.resolve();
    currentTime = 61;
    seeking = false;
    listeners.get("seeked")?.(new Event("seeked"));

    await expect(seek).rejects.toThrow("instead of 74.000s");
  });

  it("cancels a pending seek and removes every listener", async () => {
    const listeners = new Map<string, EventListener>();
    let currentTime = 0;
    let seeking = false;
    const element = {
      readyState: 1,
      get seeking() {
        return seeking;
      },
      get currentTime() {
        return currentTime;
      },
      set currentTime(value: number) {
        currentTime = value;
        seeking = true;
      },
      addEventListener: jest.fn(
        (type: string, listener: EventListenerOrEventListenerObject) => {
          if (typeof listener === "function") listeners.set(type, listener);
        },
      ),
      removeEventListener: jest.fn((type: string) => {
        listeners.delete(type);
      }),
    } as unknown as HTMLAudioElement;
    const controller = new AbortController();

    const seek = positionMediaElement(element, 74, controller.signal);
    await Promise.resolve();
    controller.abort();

    await expect(seek).rejects.toMatchObject({ name: "AbortError" });
    expect(listeners.size).toBe(0);
  });
});

describe("WebAudioDriver browser gesture lifecycle", () => {
  it("requests the source 48 kHz clock for the PWA before any audio is prepared", async () => {
    installDriverBrowser([]);
    const driver = new WebAudioDriver(
      { resolveStem: () => null, resolveWork: () => null },
      true,
    );
    driver.activateUserGesture();
    expect(window.AudioContext).toHaveBeenCalledWith({ sampleRate: 48000 });
    await driver.dispose();
  });
  const originalAudio = globalThis.Audio;
  const originalAudioContext = window.AudioContext;

  afterEach(() => {
    Object.defineProperty(globalThis, "Audio", {
      configurable: true,
      value: originalAudio,
      writable: true,
    });
    Object.defineProperty(window, "AudioContext", {
      configurable: true,
      value: originalAudioContext,
      writable: true,
    });
  });

  it("unlocks preset stems synchronously and reuses them across pause and Stop", async () => {
    const elements: DriverMediaElement[] = [];
    installDriverBrowser(elements);
    const driver = new WebAudioDriver({
      resolveStem: (assetKey) => `/audio/${assetKey}.wav`,
      resolveWork: () => null,
    });

    await driver.loadPreset(DEEP_SLEEP_432);
    driver.activateUserGesture();
    expect(elements).toHaveLength(3);
    expect(elements.every(({ play }) => play.mock.calls.length === 1)).toBe(
      true,
    );
    await driver.start(DEEP_SLEEP_432, DEEP_SLEEP_432.defaultMix);
    expect(elements.every(({ play }) => play.mock.calls.length === 1)).toBe(
      true,
    );

    await driver.pause(true);
    driver.activateUserGesture();
    const pauseGestureCalls = elements.map(
      ({ play }) => play.mock.calls.length,
    );
    await driver.resume();
    expect(elements.map(({ play }) => play.mock.calls.length)).toEqual(
      pauseGestureCalls,
    );

    await driver.stop();
    driver.activateUserGesture();
    expect(elements).toHaveLength(6);
    const stopGestureCalls = elements.map(({ play }) => play.mock.calls.length);
    await driver.start(DEEP_SLEEP_432, DEEP_SLEEP_432.defaultMix);
    expect(elements.map(({ play }) => play.mock.calls.length)).toEqual(
      stopGestureCalls,
    );
    await driver.dispose();
  });

  it("keeps the previous single-track selection intact when the next load fails", async () => {
    const elements: DriverMediaElement[] = [];
    installDriverBrowser(elements);
    const first = CONSUMER_AUDIO_WORKS.find(
      ({ id }) => id === "field-sea-003-open-tide",
    );
    const second = CONSUMER_AUDIO_WORKS.find(
      ({ id }) => id === "field-sea-001-tidal-breath",
    );
    if (!first || !second) throw new Error("Expected catalog fixtures.");
    const driver = new WebAudioDriver({
      resolveStem: () => null,
      resolveWork: (work) =>
        work.id === first.id ? `/audio/${work.id}.wav` : null,
    });

    await driver.loadSingleTrack(createSingleTrackProgram(first));
    await expect(
      driver.loadSingleTrack(createSingleTrackProgram(second)),
    ).rejects.toThrow("not available in this listening surface");
    await driver.loadSingleTrack(createSingleTrackProgram(first));
    driver.activateUserGesture();

    expect(elements).toHaveLength(1);
    expect(elements[0].src).toContain(first.id);
    expect(elements[0].play).toHaveBeenCalledTimes(1);
    await driver.dispose();
  });

  it("keeps the previous adaptive playback when a replacement cannot resolve", async () => {
    const elements: DriverMediaElement[] = [];
    installDriverBrowser(elements);
    const first = createQaPairProgram({
      outgoingWorkId: "distant-garden",
      incomingWorkId: "luminous-grain",
      outcome: "meditation",
      durationMinutes: 20,
      crossfadeSeconds: 180,
      curve: "equal-power",
      natureFamily: "sea",
    });
    const second = {
      ...first,
      plan: { ...first.plan, id: `${first.plan.id}-replacement` },
    };
    let rejectSecond = false;
    const driver = new WebAudioDriver({
      resolveStem: () => null,
      resolveWork: (work) =>
        rejectSecond && work.id === "distant-garden"
          ? null
          : `/audio/${work.id}.wav`,
    });

    await driver.loadAdaptiveSession(first);
    const firstDecks = [...elements];
    rejectSecond = true;
    await expect(driver.loadAdaptiveSession(second)).rejects.toThrow(
      "needs a verified local or downloaded file",
    );
    await driver.loadAdaptiveSession(first);
    driver.activateUserGesture();

    expect(firstDecks).toHaveLength(4);
    expect(firstDecks.every(({ play }) => play.mock.calls.length === 1)).toBe(
      true,
    );
    await driver.dispose();
  });

  it("cancels pending single metadata preparation and releases its lease on dispose", async () => {
    const elements: DriverMediaElement[] = [];
    const context = installDriverBrowser(elements, (element) => {
      element.readyState = 0;
    });
    const release = jest.fn();
    const driver = new WebAudioDriver({
      resolveStem: () => null,
      resolveWork: () => null,
      acquireWork: async () => ({ uri: "blob:local-a", release }),
    });
    const loading = driver.loadSingleTrack(fileProgram());
    const rejected = expect(loading).rejects.toMatchObject({
      name: "AbortError",
    });
    await waitForDriverState(
      () => elements.length === 1 && elements[0].listeners.size > 0,
    );
    await driver.dispose();
    await rejected;
    expect(elements[0].src).toBe("");
    expect(
      [...elements[0].listeners.values()].every((set) => set.size === 0),
    ).toBe(true);
    expect(release).toHaveBeenCalledTimes(1);
    expect(context.close).toHaveBeenCalledTimes(1);
  });

  it("supersedes a pending load without letting it replace the newer ready candidate", async () => {
    const elements: DriverMediaElement[] = [];
    installDriverBrowser(elements, (element, index) => {
      if (index === 0) element.readyState = 0;
    });
    const releases = [jest.fn(), jest.fn()];
    let call = 0;
    const driver = new WebAudioDriver({
      resolveStem: () => null,
      resolveWork: () => null,
      acquireWork: async (work) => ({
        uri: `blob:${work.id}`,
        release: releases[call++],
      }),
    });
    const loading = driver.loadSingleTrack(fileProgram());
    const rejected = expect(loading).rejects.toMatchObject({
      name: "AbortError",
    });
    await waitForDriverState(
      () => elements.length === 1 && elements[0].listeners.size > 0,
    );
    const second = fileProgram("field-sea-001-tidal-breath");
    await driver.loadSingleTrack(second);
    await rejected;
    driver.activateUserGesture();
    await driver.startSingleTrack(second, 0.8);
    expect(elements[0].src).toBe("");
    expect(elements[1].src).toBe(`blob:${second.work.id}`);
    expect(releases[0]).toHaveBeenCalledTimes(1);
    expect(releases[1]).not.toHaveBeenCalled();
    await driver.dispose();
    expect(releases[1]).toHaveBeenCalledTimes(1);
  });

  it("settles a cancelled unresolved acquisition and releases the late lease", async () => {
    const elements: DriverMediaElement[] = [];
    installDriverBrowser(elements);
    const release = jest.fn();
    let finish: (lease: {
      uri: string;
      release: () => void;
    }) => void = () => {};
    const acquireWork = jest.fn(
      () =>
        new Promise<{ uri: string; release: () => void }>((resolve) => {
          finish = resolve;
        }),
    );
    const driver = new WebAudioDriver({
      resolveStem: () => null,
      resolveWork: () => null,
      acquireWork,
    });
    const loading = driver.loadSingleTrack(fileProgram());
    const rejected = expect(loading).rejects.toMatchObject({
      name: "AbortError",
    });
    await waitForDriverState(() => acquireWork.mock.calls.length === 1);
    await driver.dispose();
    await rejected;
    finish({ uri: "blob:late", release });
    await waitForDriverState(() => release.mock.calls.length === 1);
    expect(elements).toHaveLength(0);
  });

  it("retains a verified file through Stop/replay and releases it on replacement", async () => {
    const elements: DriverMediaElement[] = [];
    installDriverBrowser(elements);
    const firstRelease = jest.fn(),
      secondRelease = jest.fn();
    let calls = 0;
    const acquireWork = jest.fn(async (work) => ({
      uri: `blob:${work.id}`,
      release: calls++ === 0 ? firstRelease : secondRelease,
    }));
    const driver = new WebAudioDriver({
      resolveStem: () => null,
      resolveWork: () => null,
      acquireWork,
    });
    const first = fileProgram();
    await driver.loadSingleTrack(first);
    driver.activateUserGesture();
    await driver.startSingleTrack(first, 0.8);
    await driver.stop();
    driver.activateUserGesture();
    await driver.startSingleTrack(first, 0.8);
    expect(acquireWork).toHaveBeenCalledTimes(1);
    expect(firstRelease).not.toHaveBeenCalled();
    await driver.loadSingleTrack(fileProgram("field-sea-001-tidal-breath"));
    expect(firstRelease).toHaveBeenCalledTimes(1);
    await driver.dispose();
    expect(secondRelease).toHaveBeenCalledTimes(1);
  });

  it("disposes a not-yet-committed adaptive candidate and releases all acquired files", async () => {
    const elements: DriverMediaElement[] = [];
    const context = installDriverBrowser(elements, (element) => {
      element.readyState = 0;
    });
    const releases: jest.Mock[] = [];
    const driver = new WebAudioDriver({
      resolveStem: () => null,
      resolveWork: () => null,
      acquireWork: async (work) => {
        const release = jest.fn();
        releases.push(release);
        return { uri: `blob:${work.id}`, release };
      },
    });
    const program = createQaPairProgram({
      outgoingWorkId: "distant-garden",
      incomingWorkId: "luminous-grain",
      outcome: "meditation",
      durationMinutes: 20,
      crossfadeSeconds: 180,
      curve: "equal-power",
      natureFamily: "sea",
    });
    const loading = driver.loadAdaptiveSession(program);
    const cancelled = expect(loading).rejects.toThrow(/cancelled|superseded/);
    await waitForDriverState(() => elements.length === 4);
    await driver.dispose();
    await cancelled;
    expect(releases.length).toBeGreaterThan(1);
    expect(releases.every((release) => release.mock.calls.length === 1)).toBe(
      true,
    );
    expect(
      elements.every(
        ({ listeners, src, play }) =>
          !src &&
          !play.mock.calls.length &&
          [...listeners.values()].every((value) => value.size === 0),
      ),
    ).toBe(true);
    expect(context.close).toHaveBeenCalledTimes(1);
  });

  it("does not seek or reload after the explicit gesture has started a prepared element", async () => {
    const elements: DriverMediaElement[] = [];
    installDriverBrowser(elements);
    const driver = new WebAudioDriver({
      resolveStem: () => null,
      resolveWork: () => "online.flac",
    });
    const program = fileProgram();
    await driver.loadSingleTrack(program);
    const seek = jest.fn();
    let currentTime = 0;
    Object.defineProperty(elements[0], "currentTime", {
      get: () => currentTime,
      set: (value) => {
        seek(value);
        currentTime = value;
      },
      configurable: true,
    });
    elements[0].play.mockImplementation(async () => {
      currentTime = 0.1;
    });
    const loads = elements[0].load.mock.calls.length;
    driver.activateUserGesture();
    await driver.startSingleTrack(program, 0.8);
    expect(seek).not.toHaveBeenCalled();
    expect(elements[0].load).toHaveBeenCalledTimes(loads);
    await driver.dispose();
  });

  it("releases a failed playback lease and reacquires a fresh file on Retry", async () => {
    const elements: DriverMediaElement[] = [];
    installDriverBrowser(elements);
    const release = jest.fn(),
      acquireWork = jest.fn(async () => ({ uri: "blob:verified", release }));
    const driver = new WebAudioDriver({
      resolveStem: () => null,
      resolveWork: () => null,
      acquireWork,
    });
    const program = fileProgram();
    await driver.loadSingleTrack(program);
    elements[0].play.mockRejectedValue(new Error("decoder failed"));
    driver.activateUserGesture();
    await expect(driver.startSingleTrack(program, 0.8)).rejects.toThrow(
      "decoder failed",
    );
    expect(release).toHaveBeenCalledTimes(1);
    await driver.loadSingleTrack(program);
    expect(acquireWork).toHaveBeenCalledTimes(2);
    driver.activateUserGesture();
    await driver.startSingleTrack(program, 0.8);
    await driver.dispose();
    expect(release).toHaveBeenCalledTimes(2);
  });
});
