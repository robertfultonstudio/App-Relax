import {
  AudioSessionController,
  type ControllerRuntime,
} from "@/audio/AudioSessionController";
import { DEEP_SLEEP_432 } from "@/presets/deepSleep432";
import type {
  PlayerPreferences,
  PlayerPreferencesStore,
} from "@/state/playerPersistence";
import { FakeAudioDriver } from "../fakes/FakeAudioDriver";

class FakeRuntime implements ControllerRuntime {
  private nowMs = 1_000;
  private nextHandle = 1;
  private readonly intervals = new Map<number, () => void>();

  now = (): number => this.nowMs;

  setInterval = (callback: () => void): ReturnType<typeof setInterval> => {
    const handle = this.nextHandle;
    this.nextHandle += 1;
    this.intervals.set(handle, callback);
    return handle as unknown as ReturnType<typeof setInterval>;
  };

  clearInterval = (handle: ReturnType<typeof setInterval>): void => {
    this.intervals.delete(handle as unknown as number);
  };

  advance(milliseconds: number): void {
    this.nowMs += milliseconds;
    for (const callback of this.intervals.values()) {
      callback();
    }
  }
}

function createStore(initial: PlayerPreferences | null = null) {
  const saved: PlayerPreferences[] = [];
  const store: PlayerPreferencesStore = {
    async load() {
      return initial;
    },
    async save(preferences) {
      saved.push(preferences);
    },
  };
  return { store, saved };
}

async function drainCommands(): Promise<void> {
  for (let index = 0; index < 8; index += 1) {
    await Promise.resolve();
  }
}

async function createReadyController() {
  const driver = new FakeAudioDriver();
  const runtime = new FakeRuntime();
  const { store, saved } = createStore();
  const controller = new AudioSessionController(driver, store, runtime);
  await controller.loadPreset(DEEP_SLEEP_432);
  return { controller, driver, runtime, saved };
}

describe("AudioSessionController", () => {
  it("hydrates before loading so cold-start preferences cannot lose a race", async () => {
    const restored: PlayerPreferences = {
      schemaVersion: 1,
      presetId: DEEP_SLEEP_432.id,
      durationMinutes: 60,
      gains: { ...DEEP_SLEEP_432.defaultMix, drone: 0.4 },
      muted: {
        drone: true,
        ambience: false,
        texture: false,
        binaural: false,
        brownNoise: false,
      },
    };
    let releaseLoad: ((value: PlayerPreferences) => void) | undefined;
    const store: PlayerPreferencesStore = {
      load: () =>
        new Promise((resolve) => {
          releaseLoad = resolve;
        }),
      async save() {},
    };
    const driver = new FakeAudioDriver();
    const controller = new AudioSessionController(
      driver,
      store,
      new FakeRuntime(),
    );
    const load = controller.loadPreset(DEEP_SLEEP_432);
    await drainCommands();
    expect(driver.loadCalls).toBe(0);

    releaseLoad?.(restored);
    await load;
    expect(controller.getSnapshot().selectedDurationMinutes).toBe(60);
    expect(controller.getSnapshot().sources.drone).toMatchObject({
      gain: 0.4,
      muted: true,
    });
  });

  it("serializes rapid play calls and starts only one graph", async () => {
    const { controller, driver } = await createReadyController();
    await Promise.all([
      controller.play(),
      controller.play(),
      controller.play(),
    ]);
    expect(driver.startCalls).toBe(1);
    expect(driver.scheduledFades).toHaveLength(1);
    expect(controller.getSnapshot().status).toBe("playing");
  });

  it("pauses and resumes without starting a duplicate graph", async () => {
    const { controller, driver, runtime } = await createReadyController();
    await controller.play();
    runtime.advance(5_000);
    await controller.pause();
    expect(controller.getSnapshot()).toMatchObject({
      status: "paused",
      deadlineMs: null,
    });
    expect(controller.getSnapshot().remainingMs).toBe(30 * 60_000 - 5_000);
    expect(driver.pauseFocusReleases).toEqual([true]);

    await controller.play();
    expect(driver.startCalls).toBe(1);
    expect(driver.resumeCalls).toBe(1);
  });

  it("rejects timer changes during active playback", async () => {
    const { controller } = await createReadyController();
    await controller.play();
    await expect(controller.setTimer(60)).rejects.toThrow("Pause or stop");
    expect(controller.getSnapshot().deadlineMs).not.toBeNull();
  });

  it("uses an absolute deadline and performs one terminal stop after the fade window", async () => {
    const { controller, driver, runtime } = await createReadyController();
    await controller.play();
    const stopCallsBeforeExpiry = driver.stopCalls;

    runtime.advance(30 * 60_000 - 12_000);
    expect(controller.getSnapshot().status).toBe("fadingOut");
    expect(
      Object.values(controller.getSnapshot().sources).every(
        (source) => source.fadeState === "fadingOut",
      ),
    ).toBe(true);

    runtime.advance(12_000);
    await drainCommands();
    expect(driver.stopCalls).toBe(stopCallsBeforeExpiry + 1);
    expect(controller.getSnapshot()).toMatchObject({
      status: "ready",
      deadlineMs: null,
      remainingMs: 30 * 60_000,
    });
  });

  it("does not resume a manual pause when an unrelated interruption ends", async () => {
    const { controller, driver } = await createReadyController();
    await controller.play();
    await controller.pause();
    driver.emitInterruption(false, true);
    await drainCommands();
    expect(controller.getSnapshot().status).toBe("paused");
    expect(driver.resumeCalls).toBe(0);
  });

  it("resumes only a pause caused by an interruption", async () => {
    const { controller, driver } = await createReadyController();
    await controller.play();
    driver.emitInterruption(true);
    await drainCommands();
    expect(controller.getSnapshot().status).toBe("paused");
    expect(driver.pauseFocusReleases).toEqual([false]);

    driver.emitInterruption(false, true);
    await drainCommands();
    expect(controller.getSnapshot().status).toBe("playing");
    expect(driver.resumeCalls).toBe(1);
  });

  it("serializes a rapid interruption end after its asynchronous pause", async () => {
    const { controller, driver } = await createReadyController();
    await controller.play();
    driver.emitInterruption(true);
    driver.emitInterruption(false, true);
    await drainCommands();
    expect(controller.getSnapshot().status).toBe("playing");
    expect(driver.pauseFocusReleases).toEqual([false]);
    expect(driver.resumeCalls).toBe(1);
  });

  it("preserves a manual pause requested between interruption events", async () => {
    const { controller, driver } = await createReadyController();
    await controller.play();
    driver.emitInterruption(true);
    const manualPause = controller.pause();
    driver.emitInterruption(false, true);
    await manualPause;
    await drainCommands();
    expect(controller.getSnapshot().status).toBe("paused");
    expect(driver.pauseFocusReleases).toEqual([false, true]);
    expect(driver.resumeCalls).toBe(0);
  });

  it("cleans up and exposes a recoverable error when start fails", async () => {
    const { controller, driver } = await createReadyController();
    const stopsBeforePlay = driver.stopCalls;
    driver.startError = new Error("Injected start failure");
    await controller.play();
    expect(driver.stopCalls).toBe(stopsBeforePlay + 1);
    expect(controller.getSnapshot()).toMatchObject({
      status: "error",
      deadlineMs: null,
      error: "Playback could not start: Injected start failure",
    });
  });

  it("contains a source gain failure without orphaning the session", async () => {
    const { controller, driver } = await createReadyController();
    driver.failingGainSource = "texture";
    await controller.setSourceGain("texture", 0.3);
    expect(controller.getSnapshot().sources.texture).toMatchObject({
      fadeState: "idle",
      error: "Injected gain failure",
    });
    expect(controller.getSnapshot().status).toBe("ready");
  });

  it("reattaches remote handlers after a development Strict Mode remount", async () => {
    const { controller, driver } = await createReadyController();
    controller.activate();
    const disposal = controller.dispose();
    controller.activate();
    await disposal;
    expect(driver.handlers).not.toBeNull();
  });
});
