import {
  AudioSessionController,
  type ControllerRuntime,
} from "@/audio/AudioSessionController";
import { createAdaptiveSessionProgram } from "@/domain/sessions/continuumPlanner";
import { createTransitionAudition } from "@/domain/sessions/workbench";
import { createQaPairProgram } from "@/qa/qaCatalog";
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
      soundKind: "nature",
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

  it("activates browser media synchronously before queuing adaptive playback", async () => {
    const program = createAdaptiveSessionProgram({
      outcome: "meditation",
      durationMinutes: 20,
      mode: "sound-only",
      soundKind: "nature",
      seed: "controller-user-gesture",
      allowProvisionalMetadata: true,
    });
    const driver = new FakeAudioDriver();
    const controller = new AudioSessionController(driver, store, new Runtime());
    await controller.loadAdaptiveSession(program);

    const playback = controller.playFromUserGesture();
    expect(driver.userGestureActivations).toBe(1);
    expect(driver.startAdaptiveCalls).toBe(0);
    await playback;
    expect(driver.startAdaptiveCalls).toBe(1);
  });

  it("pauses, resumes and ends once at the exact absolute deadline", async () => {
    const program = createAdaptiveSessionProgram({
      outcome: "relax",
      durationMinutes: 10,
      mode: "sound-only",
      soundKind: "nature",
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
      status: "completed",
      remainingMs: 0,
      deadlineMs: null,
    });
  });

  it("surfaces a future-source failure instead of stopping silently", async () => {
    const program = createAdaptiveSessionProgram({
      outcome: "meditation",
      durationMinutes: 20,
      mode: "sound-only",
      soundKind: "nature",
      seed: "future-source-error",
      allowProvisionalMetadata: true,
    });
    const driver = new FakeAudioDriver();
    const runtime = new Runtime();
    const controller = new AudioSessionController(driver, store, runtime);
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

  it("ignores a stale adaptive error after the user has stopped", async () => {
    const program = createAdaptiveSessionProgram({
      outcome: "meditation",
      durationMinutes: 20,
      mode: "sound-only",
      soundKind: "nature",
      seed: "stale-error-after-stop",
      allowProvisionalMetadata: true,
    });
    const driver = new FakeAudioDriver();
    const controller = new AudioSessionController(driver, store, new Runtime());
    controller.activate();
    await controller.loadAdaptiveSession(program);
    await controller.play();
    await controller.stop();

    driver.emitAdaptiveError(program.plan.id, new Error("Stale decoder error"));
    await drain();

    expect(controller.getSnapshot()).toMatchObject({
      status: "ready",
      error: null,
      deadlineMs: null,
    });
  });

  it("fails closed when pausing the audio graph fails", async () => {
    const program = createAdaptiveSessionProgram({
      outcome: "relax",
      durationMinutes: 10,
      mode: "sound-only",
      soundKind: "nature",
      seed: "pause-failure",
      allowProvisionalMetadata: true,
    });
    const driver = new FakeAudioDriver();
    const runtime = new Runtime();
    const controller = new AudioSessionController(driver, store, runtime);
    await controller.loadAdaptiveSession(program);
    await controller.play();
    driver.pauseError = new Error("Audio context refused to pause");

    await expect(controller.pause()).rejects.toThrow(
      "Audio context refused to pause",
    );
    expect(controller.getSnapshot()).toMatchObject({
      status: "error",
      deadlineMs: null,
      error: "Playback could not pause: Audio context refused to pause",
    });
    expect(runtime.callback).toBeNull();
  });

  it("fails closed when stopping the audio graph fails", async () => {
    const program = createAdaptiveSessionProgram({
      outcome: "relax",
      durationMinutes: 10,
      mode: "sound-only",
      soundKind: "nature",
      seed: "stop-failure",
      allowProvisionalMetadata: true,
    });
    const driver = new FakeAudioDriver();
    const runtime = new Runtime();
    const controller = new AudioSessionController(driver, store, runtime);
    await controller.loadAdaptiveSession(program);
    await controller.play();
    driver.stopError = new Error("Audio context refused to stop");

    await expect(controller.stop()).rejects.toThrow(
      "Audio context refused to stop",
    );
    expect(controller.getSnapshot()).toMatchObject({
      status: "error",
      deadlineMs: null,
      error: "Playback could not stop: Audio context refused to stop",
    });
    expect(runtime.callback).toBeNull();
  });

  it("initializes and changes the coordinated natural ambience as one control", async () => {
    const program = createQaPairProgram({
      outgoingWorkId: "distant-garden",
      incomingWorkId: "luminous-grain",
      outcome: "relax",
      durationMinutes: 20,
      crossfadeSeconds: 180,
      curve: "equal-power",
      natureFamily: "rain",
    });
    const driver = new FakeAudioDriver();
    const controller = new AudioSessionController(driver, store, new Runtime());

    await controller.loadAdaptiveSession(program);
    expect(controller.getSnapshot().natureMixLevel).toBe(0.5);
    await controller.setNatureMixLevel(0.7, 1800);
    expect(driver.adaptiveNatureCalls).toEqual([{ level: 0.7, fadeMs: 1800 }]);
    expect(controller.getSnapshot().natureMixLevel).toBe(0.7);
  });

  it("fails closed when the browser cannot confirm an adaptive seek", async () => {
    const program = createAdaptiveSessionProgram({
      outcome: "meditation",
      durationMinutes: 20,
      mode: "sound-only",
      soundKind: "nature",
      seed: "adaptive-seek-error",
      allowProvisionalMetadata: true,
    });
    const driver = new FakeAudioDriver();
    const runtime = new Runtime();
    const controller = new AudioSessionController(driver, store, runtime);
    await controller.loadAdaptiveSession(program);
    await controller.play();
    const stopsBeforeSeek = driver.stopCalls;
    driver.adaptiveSeekError = new Error("Browser seek was not confirmed");

    await expect(controller.seekAdaptiveSession(600)).rejects.toThrow(
      "Browser seek was not confirmed",
    );
    expect(controller.getSnapshot()).toMatchObject({
      status: "error",
      error: "Browser seek was not confirmed",
      deadlineMs: null,
    });
    expect(driver.stopCalls).toBe(stopsBeforeSeek + 1);
    expect(runtime.callback).toBeNull();
  });
});
