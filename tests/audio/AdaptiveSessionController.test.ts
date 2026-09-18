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
  it("exposes a read-only precise clock without ticking or changing transport", async () => {
    const program = createAdaptiveSessionProgram({
      outcome: "meditation",
      durationMinutes: 20,
      mode: "sound-only",
      soundKind: "nature",
      seed: "precise-review-clock",
      allowProvisionalMetadata: true,
    });
    let actual = 10.125;
    const driver = Object.assign(new FakeAudioDriver(), {
      getAdaptiveSessionPosition: () => actual,
    });
    const controller = new AudioSessionController(driver, store, new Runtime());
    expect(controller.getAdaptiveReviewPosition()).toBeNull();
    await controller.loadAdaptiveSession(program);
    expect(controller.getAdaptiveReviewPosition()).toBeNull();
    await controller.play();
    const before = controller.getSnapshot();
    expect(controller.getAdaptiveReviewPosition()).toBe(10.125);
    actual = 10.375;
    expect(controller.getAdaptiveReviewPosition()).toBe(10.375);
    expect(controller.getSnapshot()).toBe(before);
    expect(driver.adaptiveSeekCalls).toEqual([]);
    actual = Number.NaN;
    expect(controller.getAdaptiveReviewPosition()).toBeNull();
    await controller.stop();
    expect(controller.getAdaptiveReviewPosition()).toBeNull();
  });
  it("ignores stale review cleanup when no adaptive program is current", async () => {
    const driver = new FakeAudioDriver();
    const controller = new AudioSessionController(driver, store, new Runtime());
    await controller.configureAdaptiveAudition(null);
    expect(driver.adaptiveAuditions).toEqual([]);
    expect(controller.getSnapshot().error).toBeNull();
  });
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
    expect(controller.getSnapshot().remainingMs).toBe(
      (program.plan.totalDurationSeconds - audition.startSeconds) * 1000,
    );
    expect(driver.adaptiveSeekCalls).toEqual([]);
    await controller.seekAdaptiveSession(audition.startSeconds);
    expect(driver.adaptiveAuditions).toEqual([audition]);
    expect(driver.adaptiveSeekCalls).toEqual([audition.startSeconds]);
    expect(controller.getSnapshot().remainingMs).toBe(
      (program.plan.totalDurationSeconds - audition.startSeconds) * 1000,
    );
  });

  it("keeps the session deadline when auditioning sides at the current position", async () => {
    const program = createAdaptiveSessionProgram({
      outcome: "meditation",
      durationMinutes: 20,
      mode: "sound-only",
      soundKind: "nature",
      seed: "audition-clock",
      allowProvisionalMetadata: true,
    });
    const driver = new FakeAudioDriver();
    const runtime = new Runtime();
    const controller = new AudioSessionController(driver, store, runtime);
    await controller.loadAdaptiveSession(program);
    await controller.play();
    runtime.advance(27_000);
    const before = controller.getSnapshot();
    const configure = jest.spyOn(driver, "configureAdaptiveAudition");
    const audition = createTransitionAudition(program.plan, 0, 30, "incoming");
    await controller.configureAdaptiveAudition(audition, {
      preservePosition: true,
      loop: false,
    });
    expect(configure).toHaveBeenCalledWith(audition, {
      preservePosition: true,
      loop: false,
    });
    expect(controller.getSnapshot().remainingMs).toBe(before.remainingMs);
    expect(controller.getSnapshot().deadlineMs).toBe(before.deadlineMs);
    expect(driver.adaptiveSeekCalls).toEqual([]);
  });

  it("tracks the actual repeating review window instead of drifting past its join", async () => {
    const program = createAdaptiveSessionProgram({
      outcome: "meditation",
      durationMinutes: 20,
      mode: "sound-only",
      soundKind: "nature",
      seed: "repeat-clock",
      allowProvisionalMetadata: true,
    });
    let actualPosition = 0;
    const driver = Object.assign(new FakeAudioDriver(), {
      getAdaptiveSessionPosition: () => actualPosition,
    });
    const runtime = new Runtime();
    const controller = new AudioSessionController(driver, store, runtime);
    await controller.loadAdaptiveSession(program);
    await controller.play();
    const audition = createTransitionAudition(program.plan, 0, 30, "both");
    actualPosition = audition.startSeconds;
    await controller.configureAdaptiveAudition(audition);
    // Even after more than a complete consumer duration, the engine is still
    // in the explicit QA repeat window. No accidental completion is allowed.
    actualPosition = audition.startSeconds + 3;
    runtime.advance(1_300_000);
    expect(controller.getSnapshot().status).toBe("playing");
    expect(controller.getSnapshot().remainingMs).toBeCloseTo(
      (1200 - actualPosition) * 1000,
      6,
    );
    actualPosition = audition.startSeconds + 0.5;
    runtime.advance(500);
    expect(controller.getSnapshot().remainingMs).toBeCloseTo(
      (1200 - actualPosition) * 1000,
      6,
    );
    await controller.configureAdaptiveAudition(null);
    const remaining = controller.getSnapshot().remainingMs;
    runtime.advance(500);
    expect(controller.getSnapshot().remainingMs).toBeCloseTo(
      remaining - 500,
      6,
    );
    await controller.stop();
  });

  it("Stop cancels an unresolved review seek without waiting for its decoder", async () => {
    const program = createAdaptiveSessionProgram({
      outcome: "meditation",
      durationMinutes: 20,
      mode: "sound-only",
      soundKind: "nature",
      seed: "stop-seek",
      allowProvisionalMetadata: true,
    });
    const driver = new FakeAudioDriver();
    const controller = new AudioSessionController(driver, store, new Runtime());
    await controller.loadAdaptiveSession(program);
    await controller.play();
    let resolveSeek!: () => void;
    jest.spyOn(driver, "seekAdaptiveSession").mockImplementation(
      () =>
        new Promise<void>((resolve) => {
          resolveSeek = resolve;
        }),
    );
    const seek = controller.seekAdaptiveSession(300);
    const rejected = expect(seek).rejects.toThrow("Playback cancelled.");
    await drain();
    await controller.stop();
    await rejected;
    expect(controller.getSnapshot().status).toBe("ready");
    expect(controller.getSnapshot().remainingMs).toBe(1_200_000);
    resolveSeek();
    await drain();
    expect(controller.getSnapshot().remainingMs).toBe(1_200_000);
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
