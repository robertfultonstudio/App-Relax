import {
  AudioSessionController,
  type ControllerRuntime,
} from "@/audio/AudioSessionController";
import { getConsumerWork } from "@/content/consumerCatalog";
import { createSingleTrackProgram } from "@/domain/audio/consumerTypes";
import type {
  ConsumerPlayerPreferences,
  ConsumerPlayerPreferencesStore,
} from "@/state/consumerPlayerPersistence";
import type { PlayerPreferencesStore } from "@/state/playerPersistence";
import { FakeAudioDriver } from "../fakes/FakeAudioDriver";

const technicalStore: PlayerPreferencesStore = {
  async load() {
    return null;
  },
  async save() {},
};

class Runtime implements ControllerRuntime {
  nowMs = 0;
  callback: (() => void) | null = null;
  now = () => this.nowMs;
  setInterval = (callback: () => void) => {
    this.callback = callback;
    return 1 as unknown as ReturnType<typeof setInterval>;
  };
  clearInterval = () => {
    this.callback = null;
  };
}

describe("consumer single-track session", () => {
  it("loads one program, starts one source path and persists timer and volume", async () => {
    const work = getConsumerWork("deep-river");
    expect(work).toBeDefined();
    const program = createSingleTrackProgram(work!);
    const saved: ConsumerPlayerPreferences[] = [];
    const store: ConsumerPlayerPreferencesStore = {
      async load() {
        return null;
      },
      async save(value) {
        saved.push(value);
      },
    };
    const driver = new FakeAudioDriver();
    const controller = new AudioSessionController(
      driver,
      technicalStore,
      new Runtime(),
      store,
    );
    await controller.loadProgram(program);
    expect(controller.getSnapshot()).toMatchObject({
      mode: "consumer",
      workId: "deep-river",
      status: "ready",
    });
    await controller.setTimer(60);
    await controller.setVolume(0.6);
    await controller.play();
    expect(driver.loadProgramCalls).toBe(1);
    expect(driver.startProgramCalls).toBe(1);
    expect(driver.startCalls).toBe(0);
    expect(driver.masterVolumeCalls.at(-1)).toEqual({
      volume: 0.6,
      fadeMs: 180,
    });
    expect(saved.at(-1)).toMatchObject({
      workId: "deep-river",
      durationMinutes: 60,
      volume: 0.6,
    });
  });

  it("restores consumer preferences without altering technical persistence", async () => {
    const work = getConsumerWork("deep-river")!;
    const store: ConsumerPlayerPreferencesStore = {
      async load() {
        return {
          schemaVersion: 1,
          workId: work.id,
          durationMinutes: 15,
          volume: 0.4,
        };
      },
      async save() {},
    };
    const controller = new AudioSessionController(
      new FakeAudioDriver(),
      technicalStore,
      new Runtime(),
      store,
    );
    await controller.loadProgram(createSingleTrackProgram(work));
    expect(controller.getSnapshot()).toMatchObject({
      selectedDurationMinutes: 15,
      volume: 0.4,
    });
  });

  it("seeks a loaded file work while rejecting positions outside its source", async () => {
    const work = getConsumerWork("deep-river")!;
    const driver = new FakeAudioDriver();
    const controller = new AudioSessionController(
      driver,
      technicalStore,
      new Runtime(),
    );
    await controller.loadProgram(createSingleTrackProgram(work));
    await controller.seekSingleTrack(42.5);
    expect(driver.singleTrackSeekCalls).toEqual([42.5]);
    await expect(
      controller.seekSingleTrack(work.durationSeconds),
    ).rejects.toThrow("File position is outside the source.");
  });

  it("stops playback and exposes an error when a file seek is not confirmed", async () => {
    const work = getConsumerWork("deep-river")!;
    const driver = new FakeAudioDriver();
    const runtime = new Runtime();
    const controller = new AudioSessionController(
      driver,
      technicalStore,
      runtime,
    );
    await controller.loadProgram(createSingleTrackProgram(work));
    await controller.play();
    const stopsBeforeSeek = driver.stopCalls;
    driver.singleTrackSeekError = new Error("Browser seek was not confirmed");

    await expect(controller.seekSingleTrack(42.5)).rejects.toThrow(
      "Browser seek was not confirmed",
    );
    expect(driver.stopCalls).toBe(stopsBeforeSeek + 1);
    expect(runtime.callback).toBeNull();
    expect(controller.getSnapshot()).toMatchObject({
      status: "error",
      error: "Browser seek was not confirmed",
      deadlineMs: null,
    });
  });
});
