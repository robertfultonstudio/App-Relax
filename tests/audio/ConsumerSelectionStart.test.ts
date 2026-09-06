import {
  AudioSessionController,
  type ControllerRuntime,
} from "@/audio/AudioSessionController";
import { createSingleTrackProgram } from "@/domain/audio/consumerTypes";
import type { ConsumerSelection } from "@/domain/audio/consumerSelection";
import { createAdaptiveSessionProgram } from "@/domain/sessions/continuumPlanner";
import { getConsumerWork } from "@/content/consumerCatalog";
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

function deferred<T = void>() {
  let resolve!: (value: T | PromiseLike<T>) => void;
  let reject!: (error: Error) => void;
  const promise = new Promise<T>((done, fail) => {
    resolve = done;
    reject = fail;
  });
  return { promise, resolve, reject };
}

async function drain() {
  for (let index = 0; index < 60; index += 1) await Promise.resolve();
}

function singleSelection(): ConsumerSelection & { kind: "single" } {
  return {
    kind: "single",
    outcome: "massage",
    durationMinutes: 90,
    program: createSingleTrackProgram(
      getConsumerWork("moonlit-keys")!,
      "massage",
    ),
  };
}

async function harness(...candidates: FakeAudioDriver[]) {
  const primary = new FakeAudioDriver();
  const runtime = new Runtime();
  let next = 0;
  const factory = jest.fn(() => {
    const candidate = candidates[next++];
    if (!candidate) throw new Error("Unexpected candidate allocation.");
    return candidate;
  });
  const controller = new AudioSessionController(
    primary,
    { load: async () => null, save: async () => {} },
    runtime,
    { load: async () => null, save: async () => {} },
    factory,
  );
  await controller.loadProgram(
    createSingleTrackProgram(getConsumerWork("deep-river")!),
  );
  await controller.play();
  return { primary, controller, runtime, factory };
}

describe("consumer selection preparation and explicit Start", () => {
  beforeEach(() => jest.useFakeTimers());
  afterEach(() => {
    jest.clearAllTimers();
    jest.useRealTimers();
  });

  it("loads a separate silent candidate while the active work and timer continue", async () => {
    const candidate = new FakeAudioDriver();
    const load = deferred();
    const loaded = jest
      .spyOn(candidate, "loadSingleTrack")
      .mockReturnValue(load.promise);
    const h = await harness(candidate);
    const stops = h.primary.stopCalls;
    const remaining = h.controller.getSnapshot().remainingMs;
    const selection = singleSelection();
    const preparing = h.controller.prepareSelection(selection);
    expect(loaded).toHaveBeenCalledWith(selection.program);
    h.runtime.advance(2000);
    expect(h.controller.getSnapshot()).toMatchObject({
      status: "playing",
      workId: "deep-river",
      remainingMs: remaining - 2000,
    });
    expect(h.primary.stopCalls).toBe(stops);
    expect(h.primary.disposeCalls).toBe(0);
    expect(candidate.startProgramCalls).toBe(0);
    expect(candidate.userGestureActivations).toBe(0);
    load.resolve();
    await preparing;
  });

  it("activates the already prepared candidate synchronously inside the original gesture", async () => {
    const candidate = new FakeAudioDriver();
    const h = await harness(candidate);
    const selection = singleSelection();
    await h.controller.prepareSelection(selection);
    const started = h.controller.startSelectionFromUserGesture(selection);
    expect(candidate.userGestureActivations).toBe(1);
    expect(h.primary.userGestureActivations).toBe(0);
    expect(h.primary.disposeCalls).toBe(0);
    expect(candidate.startProgramCalls).toBe(0);
    await started;
    expect(h.primary.disposeCalls).toBe(1);
    expect(candidate.startProgramCalls).toBe(1);
    expect(h.controller.getConsumerSelection()).toBe(selection);
  });

  it("deduplicates a rapid double Start into one activation and one graph", async () => {
    const candidate = new FakeAudioDriver();
    const h = await harness(candidate);
    const selection = singleSelection();
    await h.controller.prepareSelection(selection);
    await Promise.all([
      h.controller.startSelectionFromUserGesture(selection),
      h.controller.startSelectionFromUserGesture(selection),
    ]);
    expect(h.factory).toHaveBeenCalledTimes(1);
    expect(candidate.userGestureActivations).toBe(1);
    expect(candidate.startProgramCalls).toBe(1);
    expect(h.primary.disposeCalls).toBe(1);
  });

  it("cleans a failed candidate load without stopping or replacing the active work", async () => {
    const candidate = new FakeAudioDriver();
    jest
      .spyOn(candidate, "loadSingleTrack")
      .mockRejectedValue(new Error("File unavailable"));
    const h = await harness(candidate);
    const stops = h.primary.stopCalls;
    await expect(
      h.controller.prepareSelection(singleSelection()),
    ).rejects.toThrow("File unavailable");
    expect(candidate.disposeCalls).toBe(1);
    expect(h.primary.stopCalls).toBe(stops);
    expect(h.primary.disposeCalls).toBe(0);
    expect(h.controller.getSnapshot()).toMatchObject({
      status: "playing",
      workId: "deep-river",
      error: null,
    });
  });

  it("cancels a pending preparation, disposes it and rejects its late load result", async () => {
    const candidate = new FakeAudioDriver();
    const load = deferred();
    jest.spyOn(candidate, "loadSingleTrack").mockReturnValue(load.promise);
    const h = await harness(candidate);
    const selection = singleSelection();
    const preparing = h.controller.prepareSelection(selection);
    const rejected = expect(preparing).rejects.toThrow("Selection changed");
    h.controller.cancelPreparedSelection(selection);
    expect(candidate.disposeCalls).toBeGreaterThanOrEqual(1);
    load.resolve();
    await rejected;
    await expect(
      h.controller.startSelectionFromUserGesture(selection),
    ).rejects.toThrow("ready");
    expect(h.controller.getSnapshot()).toMatchObject({
      status: "playing",
      workId: "deep-river",
    });
    expect(jest.getTimerCount()).toBe(0);
  });

  it("disposes a ready candidate when browsing is abandoned, preserving current audio", async () => {
    const candidate = new FakeAudioDriver();
    const h = await harness(candidate);
    const selection = singleSelection();
    await h.controller.prepareSelection(selection);
    h.controller.cancelPreparedSelection(selection);
    await drain();
    expect(candidate.disposeCalls).toBe(1);
    expect(h.primary.disposeCalls).toBe(0);
    expect(h.controller.getSnapshot()).toMatchObject({
      status: "playing",
      workId: "deep-river",
    });
  });

  it("uses the adaptive candidate path with its request duration and no single-track start", async () => {
    const candidate = new FakeAudioDriver();
    const h = await harness(candidate);
    const request = {
      outcome: "relax" as const,
      durationMinutes: 10 as const,
      mode: "sound-only" as const,
      soundKind: "nature" as const,
      natureFamily: "sea" as const,
    };
    const program = createAdaptiveSessionProgram({
      ...request,
      seed: "candidate-start",
      allowProvisionalMetadata: true,
    });
    const selection: ConsumerSelection = { kind: "adaptive", program, request };
    await h.controller.prepareSelection(selection);
    await h.controller.startSelectionFromUserGesture(selection);
    expect(candidate.loadAdaptiveCalls).toBe(1);
    expect(candidate.startAdaptiveCalls).toBe(1);
    expect(candidate.startProgramCalls).toBe(0);
    expect(h.controller.getSnapshot()).toMatchObject({
      status: "playing",
      selectedDurationMinutes: 10,
      remainingMs: 600_000,
      sessionPlanId: program.plan.id,
    });
  });

  it("retries a failed Start with a fresh candidate and records only a successful listening run", async () => {
    const failed = new FakeAudioDriver();
    failed.startError = new Error("Decoder refused playback");
    const retried = new FakeAudioDriver();
    const h = await harness(failed, retried);
    const selection = singleSelection();
    const before = h.controller.getListeningRun();
    await h.controller.prepareSelection(selection);
    await expect(
      h.controller.startSelectionFromUserGesture(selection),
    ).rejects.toThrow("Decoder refused playback");
    expect(failed.stopCalls).toBe(1);
    expect(h.controller.getListeningRun()).toBe(before);
    expect(h.controller.getSnapshot()).toMatchObject({
      status: "error",
      selectedDurationMinutes: 90,
      remainingMs: 5_400_000,
    });
    await h.controller.prepareSelection(selection);
    await h.controller.startSelectionFromUserGesture(selection);
    expect(failed.disposeCalls).toBe(1);
    expect(retried.startProgramCalls).toBe(1);
    expect(h.controller.getListeningRun()).toBe(before + 1);
    expect(h.controller.getSnapshot()).toMatchObject({
      status: "playing",
      selectedDurationMinutes: 90,
      remainingMs: 5_400_000,
    });
  });

  it("stops once during pending Play, waits for silence and ignores late confirmation", async () => {
    const candidate = new FakeAudioDriver();
    const play = deferred();
    const silence = deferred();
    jest.spyOn(candidate, "startSingleTrack").mockReturnValue(play.promise);
    jest.spyOn(candidate, "stop").mockImplementation(async () => {
      candidate.stopCalls += 1;
      await silence.promise;
    });
    const h = await harness(candidate);
    const selection = singleSelection();
    await h.controller.prepareSelection(selection);
    const started = h.controller.startSelectionFromUserGesture(selection);
    const rejected = expect(started).rejects.toThrow("cancelled");
    await drain();
    expect(h.controller.getSnapshot().status).toBe("preparing");
    let stopSettled = false;
    const stopped = h.controller.stop().then(() => {
      stopSettled = true;
    });
    await drain();
    expect(stopSettled).toBe(false);
    expect(candidate.stopCalls).toBe(1);
    expect(h.controller.getSnapshot()).toMatchObject({
      status: "preparing",
      error: null,
      deadlineMs: null,
    });
    silence.resolve();
    await stopped;
    await rejected;
    expect(candidate.stopCalls).toBe(1);
    expect(h.controller.getSnapshot()).toMatchObject({
      status: "ready",
      remainingMs: 5_400_000,
      deadlineMs: null,
      error: null,
    });
    play.resolve();
    await drain();
    expect(h.controller.getSnapshot().status).toBe("ready");
    expect(jest.getTimerCount()).toBe(0);
  });

  it("cancels a pending selection Start on dispose without an error or premature idle", async () => {
    const candidate = new FakeAudioDriver();
    const play = deferred();
    const disposed = deferred();
    jest.spyOn(candidate, "startSingleTrack").mockReturnValue(play.promise);
    jest.spyOn(candidate, "dispose").mockImplementation(async () => {
      candidate.disposeCalls += 1;
      await disposed.promise;
    });
    const h = await harness(candidate);
    const selection = singleSelection();
    await h.controller.prepareSelection(selection);
    const started = h.controller.startSelectionFromUserGesture(selection);
    const rejected = expect(started).rejects.toThrow("cancelled");
    await drain();
    let settled = false;
    const disposing = h.controller.dispose().then(() => {
      settled = true;
    });
    await drain();
    expect(settled).toBe(false);
    expect(candidate.disposeCalls).toBe(1);
    expect(candidate.stopCalls).toBe(0);
    expect(h.controller.getSnapshot()).toMatchObject({
      status: "preparing",
      error: null,
    });
    disposed.resolve();
    await disposing;
    await rejected;
    expect(h.controller.getSnapshot().status).toBe("idle");
    play.resolve();
    await drain();
    expect(h.controller.getSnapshot().status).toBe("idle");
    expect(jest.getTimerCount()).toBe(0);
  });

  it("preserves the main volume and the 90-minute selection through candidate replacement", async () => {
    const candidate = new FakeAudioDriver();
    const start = jest.spyOn(candidate, "startSingleTrack");
    const h = await harness(candidate);
    await h.controller.setVolume(0.35);
    const selection = singleSelection();
    expect(selection.program.durationOptionsMinutes).toContain(90);
    await h.controller.prepareSelection(selection);
    await h.controller.startSelectionFromUserGesture(selection);
    expect(start).toHaveBeenCalledWith(selection.program, 0.35);
    expect(h.controller.getSnapshot()).toMatchObject({
      status: "playing",
      volume: 0.35,
      selectedDurationMinutes: 90,
      remainingMs: 5_400_000,
    });
    expect(candidate.scheduledFades).toEqual([
      { remainingMs: 5_400_000, fadeMs: 12_000 },
    ]);
  });

  it("disposes an unadopted candidate if replacing the old graph fails", async () => {
    const candidate = new FakeAudioDriver();
    const h = await harness(candidate);
    jest
      .spyOn(h.primary, "dispose")
      .mockRejectedValue(new Error("Old graph disposal failed"));
    const selection = singleSelection();
    await h.controller.prepareSelection(selection);
    await expect(
      h.controller.startSelectionFromUserGesture(selection),
    ).rejects.toThrow("Old graph disposal failed");
    expect(candidate.disposeCalls).toBe(1);
    expect(candidate.startProgramCalls).toBe(0);
  });

  it("returns the same failure to both callers of a deduplicated Start", async () => {
    const candidate = new FakeAudioDriver();
    candidate.startError = new Error("Start rejected");
    const h = await harness(candidate);
    const selection = singleSelection();
    await h.controller.prepareSelection(selection);
    const first = h.controller.startSelectionFromUserGesture(selection);
    const second = h.controller.startSelectionFromUserGesture(selection);
    const results = await Promise.allSettled([first, second]);
    expect(candidate.startProgramCalls).toBe(1);
    expect(results.map((result) => result.status)).toEqual([
      "rejected",
      "rejected",
    ]);
  });
});
