import {
  AudioSessionController,
  type ControllerRuntime,
} from "@/audio/AudioSessionController";
import { createAdaptiveSessionProgram } from "@/domain/sessions/continuumPlanner";
import { createSingleTrackProgram } from "@/domain/audio/consumerTypes";
import { getConsumerWork } from "@/content/consumerCatalog";
import { DEEP_SLEEP_432 } from "@/presets/deepSleep432";
import { FakeAudioDriver } from "../fakes/FakeAudioDriver";

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
  advance(milliseconds: number) {
    this.nowMs += milliseconds;
    this.callback?.();
  }
}

function harness() {
  const runtime = new Runtime();
  const driver = new FakeAudioDriver();
  const controller = new AudioSessionController(
    driver,
    { load: async () => null, save: async () => {} },
    runtime,
  );
  return { controller, driver, runtime };
}

function adaptiveProgram() {
  return createAdaptiveSessionProgram({
    outcome: "relax",
    durationMinutes: 10,
    mode: "sound-only",
    soundKind: "nature",
    seed: "a14-completion-contract",
    allowProvisionalMetadata: true,
  });
}

async function drain() {
  for (let index = 0; index < 48; index += 1) await Promise.resolve();
}

async function holdVolumeCommand(
  controller: AudioSessionController,
  driver: FakeAudioDriver,
) {
  let release!: () => void;
  jest.spyOn(driver, "setMasterVolume").mockImplementationOnce(
    () =>
      new Promise<void>((resolve) => {
        release = resolve;
      }),
  );
  const command = controller.setVolume(0.7);
  await drain();
  return { release, command };
}

describe("A14 consumer completion and stale terminal work", () => {
  it("keeps adaptive completion visible at zero and performs only one terminal stop", async () => {
    const { controller, driver, runtime } = harness();
    const program = adaptiveProgram();
    await controller.loadAdaptiveSession(program);
    await controller.play();
    const stops = driver.stopCalls;
    runtime.advance(program.plan.totalDurationSeconds * 1000);
    await drain();
    driver.adaptiveHandlers?.ended(program.plan.id);
    await drain();
    runtime.advance(30_000);
    expect(controller.getSnapshot()).toMatchObject({
      status: "completed",
      remainingMs: 0,
      deadlineMs: null,
      sessionPlanId: program.plan.id,
    });
    expect(driver.stopCalls).toBe(stops + 1);
    expect(runtime.callback).toBeNull();
  });

  it("uses the same visible completion for the driver ended event", async () => {
    const { controller, driver } = harness();
    const program = adaptiveProgram();
    await controller.loadAdaptiveSession(program);
    await controller.play();
    driver.adaptiveHandlers?.ended(program.plan.id);
    await drain();
    expect(controller.getSnapshot()).toMatchObject({
      status: "completed",
      remainingMs: 0,
      deadlineMs: null,
    });
  });

  it("keeps a completed single work at zero while preserving its identity", async () => {
    const { controller, runtime } = harness();
    await controller.loadProgram(
      createSingleTrackProgram(getConsumerWork("deep-river")!),
    );
    await controller.setTimer(15);
    await controller.play();
    runtime.advance(15 * 60_000);
    await drain();
    expect(controller.getSnapshot()).toMatchObject({
      status: "completed",
      remainingMs: 0,
      deadlineMs: null,
      workId: "deep-river",
      selectedDurationMinutes: 15,
    });
  });

  it("restarts a completed adaptive program from zero for the full duration and unlocks the user gesture", async () => {
    const { controller, driver } = harness();
    const program = adaptiveProgram();
    const start = jest.spyOn(driver, "startAdaptiveSession");
    await controller.loadAdaptiveSession(program);
    await controller.play();
    driver.adaptiveHandlers?.ended(program.plan.id);
    await drain();
    expect(controller.getSnapshot().status).toBe("completed");
    const play = controller.playFromUserGesture();
    expect(driver.userGestureActivations).toBe(1);
    await play;
    expect(start).toHaveBeenLastCalledWith(program, 0.8, 0);
    expect(driver.resumeCalls).toBe(0);
    expect(controller.getSnapshot()).toMatchObject({
      status: "playing",
      remainingMs: program.plan.totalDurationSeconds * 1000,
    });
  });

  it("keeps explicit Stop effective during the adaptive fade and resets the selected duration", async () => {
    const { controller, driver, runtime } = harness();
    const program = adaptiveProgram();
    await controller.loadAdaptiveSession(program);
    await controller.play();
    runtime.advance(program.plan.totalDurationSeconds * 1000 - 1000);
    expect(controller.getSnapshot().status).toBe("fadingOut");
    const stops = driver.stopCalls;
    await controller.stop();
    expect(driver.stopCalls).toBe(stops + 1);
    expect(controller.getSnapshot()).toMatchObject({
      status: "ready",
      remainingMs: program.plan.totalDurationSeconds * 1000,
      deadlineMs: null,
    });
    expect(runtime.callback).toBeNull();
  });

  it("does not let an already queued expiry stop a newly started work", async () => {
    const { controller, driver, runtime } = harness();
    const program = adaptiveProgram();
    await controller.loadAdaptiveSession(program);
    await controller.play();
    const held = await holdVolumeCommand(controller, driver);
    const stops = driver.stopCalls;
    const loaded = controller.loadProgram(
      createSingleTrackProgram(getConsumerWork("deep-river")!),
    );
    const started = controller.play();
    runtime.advance(program.plan.totalDurationSeconds * 1000);
    held.release();
    await Promise.all([held.command, loaded, started]);
    await drain();
    expect(driver.stopCalls).toBe(stops + 1);
    expect(controller.getSnapshot()).toMatchObject({
      status: "playing",
      workId: "deep-river",
      sessionPlanId: null,
    });
  });

  it("ignores an ended event queued before Stop and replay of the same plan", async () => {
    const { controller, driver } = harness();
    const program = adaptiveProgram();
    await controller.loadAdaptiveSession(program);
    await controller.play();
    const held = await holdVolumeCommand(controller, driver);
    const stops = driver.stopCalls;
    const stopped = controller.stop();
    const started = controller.play();
    driver.adaptiveHandlers?.ended(program.plan.id);
    held.release();
    await Promise.all([held.command, stopped, started]);
    await drain();
    expect(driver.stopCalls).toBe(stops + 1);
    expect(controller.getSnapshot()).toMatchObject({
      status: "playing",
      sessionPlanId: program.plan.id,
    });
  });

  it("preserves the technical preset's existing automatic reset", async () => {
    const { controller, runtime } = harness();
    await controller.loadPreset(DEEP_SLEEP_432);
    await controller.play();
    runtime.advance(30 * 60_000);
    await drain();
    expect(controller.getSnapshot()).toMatchObject({
      mode: "technical",
      status: "ready",
      remainingMs: 30 * 60_000,
      deadlineMs: null,
    });
  });
});
