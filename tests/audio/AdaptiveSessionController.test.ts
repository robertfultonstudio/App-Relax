import {
  AudioSessionController,
  type ControllerRuntime,
} from "@/audio/AudioSessionController";
import { createAdaptiveSessionProgram } from "@/domain/sessions/continuumPlanner";
import { createTransitionAudition } from "@/domain/sessions/workbench";
import type { PlayerPreferencesStore } from "@/state/playerPersistence";
import { FakeAudioDriver } from "../fakes/FakeAudioDriver";

const store: PlayerPreferencesStore = {
  load: async () => null,
  save: async () => {},
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
  advance(milliseconds: number): void {
    this.nowMs += milliseconds;
    this.callback?.();
  }
}

async function drain(): Promise<void> {
  for (let index = 0; index < 8; index += 1) await Promise.resolve();
}

describe("adaptive session controller", () => {
  it("loads and starts the adaptive path without a second consumer source or generic fade", async () => {
    const program = createAdaptiveSessionProgram({
      outcome: "meditation",
      durationMinutes: 20,
      mode: "sound-only",
      seed: "controller-adaptive",
      allowProvisionalMetadata: true,
    });
    const driver = new FakeAudioDriver();
    const runtime = new Runtime();
    const controller = new AudioSessionController(driver, store, runtime);

    await controller.loadAdaptiveSession(program);
    expect(controller.getSnapshot()).toMatchObject({
      mode: "consumer",
      status: "ready",
      workId: null,
      sessionPlanId: program.plan.id,
      selectedDurationMinutes: 20,
    });
    await controller.play();
    expect(driver.loadAdaptiveCalls).toBe(1);
    expect(driver.startAdaptiveCalls).toBe(1);
    expect(driver.startProgramCalls).toBe(0);
    expect(driver.startCalls).toBe(0);
    expect(driver.scheduledFades).toEqual([]);

    const audition = createTransitionAudition(program.plan, 0, 30, "both");
    await controller.configureAdaptiveAudition(audition);
    await controller.seekAdaptiveSession(audition.startSeconds);
    expect(driver.adaptiveAuditions).toEqual([audition]);
    expect(driver.adaptiveSeekCalls).toEqual([audition.startSeconds]);
    expect(controller.getSnapshot().remainingMs).toBe(
      (program.plan.totalDurationSeconds - audition.startSeconds) * 1000,
    );
  });

  it("pauses, resumes and ends once at the exact absolute deadline", async () => {
    const program = createAdaptiveSessionProgram({
      outcome: "relax",
      durationMinutes: 10,
      mode: "sound-only",
      seed: "controller-exact-end",
      allowProvisionalMetadata: true,
    });
    const driver = new FakeAudioDriver();
    const runtime = new Runtime();
    const controller = new AudioSessionController(driver, store, runtime);
    await controller.loadAdaptiveSession(program);
    const stopsBeforePlay = driver.stopCalls;
    await controller.play();
    runtime.advance(10_000);
    await controller.pause();
    expect(controller.getSnapshot().remainingMs).toBe(590_000);
    await controller.play();
    expect(driver.resumeCalls).toBe(1);
    runtime.advance(590_000);
    await drain();
    expect(driver.stopCalls).toBe(stopsBeforePlay + 1);
    expect(controller.getSnapshot()).toMatchObject({
      status: "ready",
      remainingMs: 600_000,
      deadlineMs: null,
    });
  });

  it("surfaces a future-source failure instead of stopping silently", async () => {
    const program = createAdaptiveSessionProgram({
      outcome: "meditation",
      durationMinutes: 20,
      mode: "sound-only",
      seed: "future-source-error",
      allowProvisionalMetadata: true,
    });
    const driver = new FakeAudioDriver();
    const controller = new AudioSessionController(driver, store, new Runtime());
    controller.activate();
    await controller.loadAdaptiveSession(program);
    await controller.play();
    driver.emitAdaptiveError(
      program.plan.id,
      new Error("Next sound unavailable"),
    );
    await drain();
    expect(controller.getSnapshot()).toMatchObject({
      status: "error",
      error: "Next sound unavailable",
      deadlineMs: null,
    });
  });
});
