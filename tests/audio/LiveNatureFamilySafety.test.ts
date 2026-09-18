import { AdaptiveWebPlayback } from "@/audio/web/AdaptiveWebPlayback";
import { AudioSessionController } from "@/audio/AudioSessionController";
import { getConsumerWork } from "@/content/consumerCatalog";
import { createListeningNatureProgram } from "@/domain/sessions/createListeningNatureProgram";
import { createWholeFileReviewProgram } from "@/domain/sessions/createWholeFileReviewProgram";
import { replaceCoordinatedNatureBed } from "@/domain/sessions/continuumPlanner";
import type { AdaptiveSessionProgram } from "@/domain/sessions/types";
import { deferred } from "../ui/helpers/consumerAudioMock";
import { FakeAudioDriver } from "../fakes/FakeAudioDriver";

const gain = () => ({
  connect: jest.fn(),
  disconnect: jest.fn(),
  gain: {
    value: 1,
    cancelScheduledValues: jest.fn(),
    setValueAtTime: jest.fn(),
    setValueCurveAtTime: jest.fn(),
    linearRampToValueAtTime: jest.fn(),
  },
});
type Runtime = { gain: ReturnType<typeof gain>; element: Media };
type Inspect = {
  program: AdaptiveSessionProgram;
  runtimes: Map<number, Runtime>;
  preloaded: Map<number, unknown>;
  natureScheduleRevision: number;
  timers: { size?: number; length?: number };
};
let prepareSea: () => Promise<void>;
let readySea: () => Promise<void>;
class Media extends EventTarget {
  src = "";
  readyState = 4;
  seeking = false;
  position = 0;
  playing = false;
  get currentTime() {
    return this.position;
  }
  set currentTime(value: number) {
    this.position = value;
    this.dispatchEvent(new Event("seeked"));
  }
  pause = jest.fn(() => {
    this.playing = false;
  });
  play = jest.fn(async () => {
    this.playing = true;
  });
  load = jest.fn();
  removeAttribute() {
    this.src = "";
  }
  prepareAt = jest.fn(async (position: number) => {
    this.currentTime = position;
    if (this.src.includes("field-sea")) await prepareSea();
  });
  prepareForPlayback = jest.fn(async () => {
    if (this.src.includes("field-sea")) await readySea();
  });
}
async function drain() {
  for (let index = 0; index < 100; index++) await Promise.resolve();
}
const base = () =>
  createListeningNatureProgram(
    getConsumerWork("astral-thread")!,
    "focus",
    30,
    "rain",
  );

describe("live family safety follow-up", () => {
  const originalAudio = globalThis.Audio;
  let context: AudioContext;
  let elements: Media[];
  let playback: AdaptiveWebPlayback;
  beforeEach(() => {
    jest.useFakeTimers();
    elements = [];
    prepareSea = async () => {};
    readySea = async () => {};
    Object.defineProperty(globalThis, "Audio", {
      configurable: true,
      value: jest.fn(() => {
        const element = new Media();
        elements.push(element);
        return element;
      }),
    });
    context = {
      currentTime: 0,
      resume: async () => {},
      createGain: gain,
      createMediaElementSource: () => ({
        connect: jest.fn(),
        disconnect: jest.fn(),
      }),
    } as unknown as AudioContext;
    playback = new AdaptiveWebPlayback(
      context,
      {} as AudioNode,
      { ended: jest.fn(), error: jest.fn() },
      async (work) => ({ uri: `blob:${work.id}`, release: async () => {} }),
    );
  });
  afterEach(async () => {
    await playback.dispose();
    jest.useRealTimers();
    Object.defineProperty(globalThis, "Audio", {
      configurable: true,
      value: originalAudio,
    });
  });
  const advance = async (seconds: number) => {
    (context as unknown as { currentTime: number }).currentTime += seconds;
    await jest.advanceTimersByTimeAsync(seconds * 1000);
    await drain();
  };

  it("rolls back an incoming envelope failure before retiring the current ambience", async () => {
    const first = base();
    const next = replaceCoordinatedNatureBed(first, "sea");
    await playback.load(first);
    await playback.start(first, 0.8);
    await drain();
    const state = playback as unknown as Inspect;
    const old = first.plan.segments.find((s) => s.lane === "nature")!;
    const oldRuntime = state.runtimes.get(old.index)!;
    const change = playback
      .replaceNatureFamily(next, new AbortController().signal)
      .catch((error: unknown) => error);
    await drain();
    await advance(0);
    const temp =
      Math.max(
        ...first.plan.segments.map((s) => s.index),
        ...next.plan.segments.map((s) => s.index),
      ) + 1;
    const incoming = state.runtimes.get(temp)!;
    incoming.gain.gain.setValueCurveAtTime.mockImplementationOnce(() => {
      throw new Error("Injected AudioParam scheduling failure");
    });
    await advance(4);
    expect(await change).toEqual(
      new Error("Injected AudioParam scheduling failure"),
    );
    expect(state.program).toBe(first);
    expect(state.runtimes.get(old.index)).toBe(oldRuntime);
    expect(oldRuntime.element.playing).toBe(true);
    expect(elements.filter((element) => element.playing)).toHaveLength(2);
    expect(playback.positionSeconds()).toBe(4);
    // Recovery is a retry, never a new music start.
    const retry = playback.replaceNatureFamily(
      next,
      new AbortController().signal,
    );
    await drain();
    await advance(0);
    await advance(4);
    await retry;
    expect(state.program).toBe(next);
    expect(playback.positionSeconds()).toBe(8);
  });

  it("twenty consecutive changes preserve the music clock, two stable sources and a bounded pool", async () => {
    let current = base();
    const driver = Object.assign(new FakeAudioDriver(), {
      loadAdaptiveSession: (program: AdaptiveSessionProgram) =>
        playback.load(program),
      startAdaptiveSession: (program: AdaptiveSessionProgram, volume: number) =>
        playback.start(program, volume),
      replaceAdaptiveNatureFamily: (
        program: AdaptiveSessionProgram,
        signal: AbortSignal,
      ) => playback.replaceNatureFamily(program, signal),
      getAdaptiveSessionPosition: () => playback.positionSeconds(),
      seekAdaptiveSession: (seconds: number) => playback.seek(seconds),
      configureAdaptiveAudition: () => playback.configureAudition(null),
      pause: () => playback.pause(),
      resume: () => playback.resume(),
      stop: () => playback.stop(),
    });
    const controller = new AudioSessionController(
      driver,
      {
        load: async () => null,
        save: async () => {},
      },
      {
        now: () => context.currentTime * 1000,
        setInterval,
        clearInterval,
      },
    );
    await controller.loadAdaptiveSession(current);
    await controller.play();
    await drain();
    await controller.pause();
    await controller.play();
    await controller.seekAdaptiveSession(0);
    const deadline = controller.getSnapshot().deadlineMs;
    const music = elements.find(
      (element) => element.src === "blob:astral-thread",
    )!;
    music.play.mockClear();
    music.pause.mockClear();
    for (let index = 0; index < 20; index++) {
      const before = playback.positionSeconds();
      const next = replaceCoordinatedNatureBed(
        current,
        index % 2 ? "rain" : "sea",
      );
      const changing = controller.changeNatureFamily(
        index % 2 ? "rain" : "sea",
      );
      let settled = false;
      void changing.then(() => {
        settled = true;
      });
      // Advance both clocks incrementally across both asynchronous stages.
      // Jumping AudioContext ahead before JS timers run fabricates a late fade.
      for (let tick = 0; tick < 60 && !settled; tick++) {
        await advance(0.1);
        expect(
          elements.filter((element) => element.playing).length,
        ).toBeLessThanOrEqual(3);
      }
      expect(settled).toBe(true);
      await changing;
      expect(playback.positionSeconds() - before).toBeGreaterThanOrEqual(4.25);
      expect(playback.positionSeconds() - before).toBeLessThan(5);
      expect((playback as unknown as Inspect).program.plan).toEqual(next.plan);
      expect(controller.getSnapshot().deadlineMs).toBe(deadline);
      expect(
        Math.abs(
          controller.getSnapshot().remainingMs! -
            (1800 - playback.positionSeconds()) * 1000,
        ),
      ).toBeLessThanOrEqual(501); // Snapshot ticker is 500 ms; audio clock is continuous.
      expect(elements.filter((element) => element.playing)).toHaveLength(2);
      expect(elements).toHaveLength(4);
      const timers = (playback as unknown as Inspect).timers;
      expect(timers.size ?? timers.length).toBeLessThanOrEqual(
        current.plan.segments.length * 2,
      );
      current = next;
    }
    expect(music.play).not.toHaveBeenCalled();
    expect(music.pause).not.toHaveBeenCalled();
    const pausedAt = playback.positionSeconds();
    await controller.pause();
    expect(playback.positionSeconds()).toBe(pausedAt);
    await advance(3);
    expect(playback.positionSeconds()).toBe(pausedAt);
    await controller.play();
    await advance(2);
    expect(playback.positionSeconds()).toBeCloseTo(pausedAt + 2);
    await controller.seekAdaptiveSession(100);
    expect(playback.positionSeconds()).toBe(100);
    expect(controller.getSnapshot().remainingMs).toBe(1700000);
    const finalChange = controller.changeNatureFamily("sea");
    for (let tick = 0; tick < 50; tick++) await advance(0.1);
    await finalChange;
    expect(playback.positionSeconds()).toBeCloseTo(105);
    expect(
      Math.abs(controller.getSnapshot().remainingMs! - 1695000),
    ).toBeLessThanOrEqual(501);
    await controller.stop();
    expect(elements.filter((element) => element.playing)).toHaveLength(0);
    expect(controller.getSnapshot().status).toBe("ready");
    await controller.dispose();
  });

  it.each(["metadata", "runway"] as const)(
    "abort during pending %s never reintroduces a deck after a second successful change",
    async (stage) => {
      const first = base();
      const next = replaceCoordinatedNatureBed(first, "sea");
      await playback.load(first);
      await playback.start(first, 0.8);
      await drain();
      const late = deferred();
      if (stage === "metadata") prepareSea = () => late.promise;
      else readySea = () => late.promise;
      const cancel = new AbortController();
      const failed = playback
        .replaceNatureFamily(next, cancel.signal)
        .catch((error) => error);
      await drain();
      await advance(0);
      cancel.abort();
      expect(await failed).toBeInstanceOf(Error);
      expect((playback as unknown as Inspect).program).toBe(first);
      expect([...(playback as unknown as Inspect).runtimes.keys()]).toEqual(
        first.plan.segments
          .filter((s) => s.startSeconds === 0)
          .map((s) => s.index),
      );
      prepareSea = async () => {};
      readySea = async () => {};
      const success = playback.replaceNatureFamily(
        next,
        new AbortController().signal,
      );
      await drain();
      await advance(0);
      await advance(4);
      await success;
      const before = [...(playback as unknown as Inspect).runtimes.entries()];
      late.resolve();
      await drain();
      expect([...(playback as unknown as Inspect).runtimes.entries()]).toEqual(
        before,
      );
      expect((playback as unknown as Inspect).program).toBe(next);
      expect(elements).toHaveLength(4);
      expect(elements.filter((element) => element.playing)).toHaveLength(2);
      expect(playback.positionSeconds()).toBe(4);
    },
  );

  it.each(["pause", "seek"] as const)(
    "%s cancels an in-flight change without late source resurrection",
    async (operation) => {
      const first = base();
      await playback.load(first);
      await playback.start(first, 0.8);
      await drain();
      const late = deferred();
      prepareSea = () => late.promise;
      const failed = playback
        .replaceNatureFamily(
          replaceCoordinatedNatureBed(first, "sea"),
          new AbortController().signal,
        )
        .catch((error: unknown) => error);
      await drain();
      await advance(0);
      if (operation === "pause") await playback.pause();
      else await playback.seek(120);
      expect(await failed).toBeInstanceOf(Error);
      late.resolve();
      await drain();
      expect((playback as unknown as Inspect).program).toBe(first);
      expect(
        elements.some(
          (element) => element.playing && element.src.includes("field-sea"),
        ),
      ).toBe(false);
      if (operation === "pause") {
        expect(elements.filter((element) => element.playing)).toHaveLength(0);
        await playback.resume();
      }
      expect(elements.filter((element) => element.playing)).toHaveLength(2);
      expect(playback.positionSeconds()).toBe(operation === "pause" ? 0 : 120);
    },
  );

  it("Stop cancels a long transition-window wait immediately and leaves no delayed family commit", async () => {
    const first = base();
    const transition = first.plan.transitions[0];
    await playback.load(first);
    await playback.start(first, 0.8, transition.startSeconds + 1);
    await drain();
    const failed = playback
      .replaceNatureFamily(
        replaceCoordinatedNatureBed(first, "sea"),
        new AbortController().signal,
      )
      .catch((error) => error);
    await drain();
    expect(elements.some((element) => element.src.includes("field-sea"))).toBe(
      false,
    );
    await playback.stop();
    expect(await failed).toBeInstanceOf(Error);
    expect(playback.positionSeconds()).toBe(0);
    await advance(transition.durationSeconds + 30);
    expect((playback as unknown as Inspect).program).toBe(first);
    expect((playback as unknown as Inspect).natureScheduleRevision).toBe(0);
    expect(elements.filter((element) => element.playing)).toHaveLength(0);
  });

  it("the actual linear gain pair never exceeds its louder peak endpoint", async () => {
    const first = base();
    const next = replaceCoordinatedNatureBed(first, "sea");
    await playback.load(first);
    await playback.start(first, 1);
    await drain();
    const old = first.plan.segments.find(
      (segment) => segment.lane === "nature",
    )!;
    const oldRuntime = (playback as unknown as Inspect).runtimes.get(
      old.index,
    )!;
    const change = playback.replaceNatureFamily(
      next,
      new AbortController().signal,
    );
    await drain();
    await advance(0);
    const temp =
      Math.max(
        ...first.plan.segments.map((segment) => segment.index),
        ...next.plan.segments.map((segment) => segment.index),
      ) + 1;
    const incoming = (playback as unknown as Inspect).runtimes.get(temp)!;
    const oldGain = oldRuntime.gain.gain.setValueAtTime.mock.calls.at(
      -1,
    )![0] as number;
    const newGain = incoming.gain.gain.linearRampToValueAtTime.mock.calls.at(
      -1,
    )![0] as number;
    expect(
      oldRuntime.gain.gain.linearRampToValueAtTime,
    ).toHaveBeenLastCalledWith(0, 4);
    expect(incoming.gain.gain.setValueAtTime).toHaveBeenLastCalledWith(0, 0);
    const nextSegment = next.plan.segments.find(
      (segment) => segment.lane === "nature",
    )!;
    const peak = (p: AdaptiveSessionProgram, id: string) =>
      10 ** (p.works.find((work) => work.id === id)!.truePeakDbtp! / 20);
    const oldPeak = oldGain * peak(first, old.workId);
    const newPeak = newGain * peak(next, nextSegment.workId);
    for (let point = 0; point <= 64; point++)
      expect(
        oldPeak * (1 - point / 64) + (newPeak * point) / 64,
      ).toBeLessThanOrEqual(Math.max(oldPeak, newPeak) + 1e-10);
    await advance(4);
    await change;
  });

  it.each([30, 45, 60, 90] as const)(
    "retains master headroom and verified nature peak ceiling for Hatha %i",
    (durationMinutes) => {
      const first = createWholeFileReviewProgram({
        outcome: "yoga",
        durationMinutes,
        mode: "sound-only",
        soundKind: "music",
        seed: "headroom-followup",
        natureFamily: "rain",
        includeNatureBed: true,
        allowProvisionalMetadata: true,
      });
      const next = replaceCoordinatedNatureBed(first, "sea");
      expect(next.plan.compositeHeadroomTrimDb).toBe(
        first.plan.compositeHeadroomTrimDb,
      );
      expect(next.plan.natureMix!.headroomStrategy).toBe(
        first.plan.natureMix!.headroomStrategy,
      );
      for (const transition of next.plan.transitions.filter(
        (change) => change.lane === "nature",
      ))
        expect(transition.clippingRiskDbtp).toBeLessThanOrEqual(-1.099);
    },
  );

  it("synchronizes committed family metadata even when Stop aborts before the driver promise resolves", async () => {
    const cleanup = deferred();
    class Driver extends FakeAudioDriver {
      committed: AdaptiveSessionProgram | null = null;
      signal: AbortSignal | null = null;
      replaceAdaptiveNatureFamily = jest.fn(
        (program: AdaptiveSessionProgram, signal: AbortSignal) => {
          this.committed = program;
          this.signal = signal;
          if (program.plan.natureMix?.enabled === false)
            return Promise.resolve();
          return cleanup.promise;
        },
      );
    }
    const driver = new Driver();
    const controller = new AudioSessionController(
      new FakeAudioDriver(),
      { load: async () => null, save: async () => {} },
      {
        now: () => 10000,
        setInterval: () => 1 as unknown as ReturnType<typeof setInterval>,
        clearInterval: () => {},
      },
      undefined,
      () => driver,
    );
    const first = base();
    const selection = {
      kind: "adaptive" as const,
      program: first,
      request: {
        outcome: "focus" as const,
        durationMinutes: 30 as const,
        mode: "sound-only" as const,
        soundKind: "music" as const,
        natureFamily: "rain" as const,
      },
    };
    await controller.prepareSelection(selection);
    await controller.startSelectionFromUserGesture(selection);
    const run = controller.getListeningRun();
    const changed = controller.changeNatureFamily("sea");
    await drain();
    expect(driver.committed?.plan.natureMix?.selectedFamily).toBe("sea");
    await controller.stop();
    expect(driver.signal?.aborted).toBe(true);
    expect(controller.getSnapshot().status).toBe("ready");
    cleanup.resolve();
    const next = await changed;
    expect(next).toBe(driver.committed);
    expect(controller.getConsumerSelection()).toMatchObject({
      program: next,
      request: { natureFamily: "sea" },
    });
    expect(controller.getSnapshot().status).toBe("ready");
    expect(controller.getListeningRun()).toBe(run);
    expect(driver.startAdaptiveCalls).toBe(1);
    await controller.dispose();
  });
});
