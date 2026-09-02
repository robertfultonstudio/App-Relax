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
    const work = getConsumerWork("eclipse-veil");
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
      workId: "eclipse-veil",
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
      workId: "eclipse-veil",
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
});
