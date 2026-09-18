import { AdaptiveWebPlayback } from "@/audio/web/AdaptiveWebPlayback";
import { getConsumerWork } from "@/content/consumerCatalog";
import { createListeningNatureProgram } from "@/domain/sessions/createListeningNatureProgram";
import {
  replaceCoordinatedNatureBed,
  setCoordinatedNatureChoice,
} from "@/domain/sessions/continuumPlanner";
import {
  AudioSessionController,
  PlaybackCancelledError,
} from "@/audio/AudioSessionController";
import { FakeAudioDriver } from "../fakes/FakeAudioDriver";
import { deferred } from "../ui/helpers/consumerAudioMock";
import type { AdaptiveSessionProgram } from "@/domain/sessions/types";
import { createWholeFileReviewProgram } from "@/domain/sessions/createWholeFileReviewProgram";

const program = () =>
  createListeningNatureProgram(
    getConsumerWork("astral-thread")!,
    "focus",
    30,
    "rain",
  );
class Media {
  src = "";
  readyState = 4;
  seeking = false;
  listeners = new Map<string, Set<EventListener>>();
  position = 0;
  playing = false;
  get currentTime() {
    return this.position;
  }
  set currentTime(value: number) {
    this.position = value;
    this.emit("seeked");
  }
  pause = jest.fn(() => {
    this.playing = false;
  });
  play = jest.fn(async () => {
    this.playing = true;
  });
  load = jest.fn();
  removeAttribute(name: string) {
    if (name === "src") this.src = "";
  }
  addEventListener(name: string, listener: EventListener) {
    const listeners = this.listeners.get(name) ?? new Set();
    listeners.add(listener);
    this.listeners.set(name, listeners);
  }
  removeEventListener(name: string, listener: EventListener) {
    this.listeners.get(name)?.delete(listener);
  }
  emit(name: string) {
    for (const listener of [...(this.listeners.get(name) ?? [])])
      listener(new Event(name));
  }
}
const gainNode = () => ({
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
async function drain() {
  for (let i = 0; i < 100; i++) await Promise.resolve();
}

describe("live natural family playback", () => {
  const originalAudio = globalThis.Audio;
  let elements: Media[];
  let context: AudioContext;
  let nodes: ReturnType<typeof gainNode>[];
  beforeEach(() => {
    jest.useFakeTimers();
    elements = [];
    nodes = [];
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
      resume: jest.fn(async () => {}),
      createGain: () => {
        const node = gainNode();
        nodes.push(node);
        return node;
      },
      createMediaElementSource: () => ({
        connect: jest.fn(),
        disconnect: jest.fn(),
      }),
    } as unknown as AudioContext;
  });
  afterEach(() => {
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
  const create = (
    resolve = async (work: { id: string }) => ({
      uri: `blob:${work.id}`,
      release: async () => {},
    }),
  ) =>
    new AdaptiveWebPlayback(
      context,
      {} as AudioNode,
      { ended: jest.fn(), error: jest.fn() },
      resolve,
    );

  it("starts Off without acquiring nature, enables Rain and turns Off without restarting music", async () => {
    const resolve = jest.fn(async (work: { id: string }) => ({
      uri: `blob:${work.id}`,
      release: jest.fn(async () => {}),
    }));
    const playback = create(resolve);
    const off = setCoordinatedNatureChoice(program(), null);
    await playback.load(off);
    expect(resolve.mock.calls.map(([w]) => w.id)).toEqual(["astral-thread"]);
    await playback.start(off, 0.7);
    await drain();
    const music = elements.find((e) => e.src === "blob:astral-thread")!;
    music.play.mockClear();
    music.pause.mockClear();
    const rain = setCoordinatedNatureChoice(off, "rain");
    const enable = playback.replaceNatureFamily(
      rain,
      new AbortController().signal,
    );
    await drain();
    await advance(0);
    await advance(4);
    await enable;
    expect(elements.filter((e) => e.playing).length).toBe(2);
    const disable = playback.replaceNatureFamily(
      setCoordinatedNatureChoice(rain, null),
      new AbortController().signal,
    );
    await drain();
    await advance(0.25);
    await disable;
    expect(elements.filter((e) => e.playing)).toEqual([music]);
    expect(music.play).not.toHaveBeenCalled();
    expect(music.pause).not.toHaveBeenCalled();
    expect(playback.positionSeconds()).toBe(4.25);
    await playback.stop();
  });

  it("enables ambience inside a long natural overlap without waiting for its exit", async () => {
    const off = setCoordinatedNatureChoice(program(), null);
    const rain = setCoordinatedNatureChoice(off, "rain");
    const join = rain.plan.transitions.find((t) => t.lane === "nature")!;
    expect(join.durationSeconds).toBeGreaterThan(20);
    const position = join.startSeconds + 1;
    const playback = create();
    await playback.load(off);
    await playback.start(off, 0.7);
    await playback.seek(position);
    await drain();
    const music = elements.find((e) => e.src === "blob:astral-thread")!;
    music.play.mockClear();
    music.pause.mockClear();
    const enable = playback.replaceNatureFamily(
      rain,
      new AbortController().signal,
    );
    await drain();
    await advance(4);
    await enable;
    const incoming = rain.plan.segments.find(
      (s) => s.index === join.incomingSegmentIndex,
    )!;
    expect(
      elements
        .filter((e) => e.playing)
        .map((e) => e.src)
        .sort(),
    ).toEqual(["blob:astral-thread", `blob:${incoming.workId}`].sort());
    expect(playback.positionSeconds()).toBe(position + 4);
    expect(music.play).not.toHaveBeenCalled();
    expect(music.pause).not.toHaveBeenCalled();
    await playback.stop();
  });

  it("changes Rain to Ocean without touching the music element or master/lane volume", async () => {
    const playback = create();
    const first = program();
    await playback.load(first);
    await playback.start(first, 0.7);
    await drain();
    playback.setNatureLevel(0.3, 0);
    const music = elements.find((e) => e.src === "blob:astral-thread")!;
    const musicGain = nodes[3];
    music.pause.mockClear();
    music.play.mockClear();
    const envelopeCalls =
      musicGain.gain.cancelScheduledValues.mock.calls.length;
    const volumeCalls = nodes
      .slice(0, 3)
      .map((n) => n.gain.linearRampToValueAtTime.mock.calls.length);
    const change = playback.replaceNatureFamily(
      replaceCoordinatedNatureBed(first, "sea"),
      new AbortController().signal,
    );
    await drain();
    await advance(0);
    await advance(4);
    await change;
    expect(playback.positionSeconds()).toBe(4);
    expect(music.pause).not.toHaveBeenCalled();
    expect(music.play).not.toHaveBeenCalled();
    expect(musicGain.gain.cancelScheduledValues.mock.calls.length).toBe(
      envelopeCalls,
    );
    expect(
      nodes
        .slice(0, 3)
        .map((n) => n.gain.linearRampToValueAtTime.mock.calls.length),
    ).toEqual(volumeCalls);
    expect(elements).toHaveLength(4);
    expect(
      elements.some(
        (e) => e.src.startsWith("blob:field-sea") && e.play.mock.calls.length,
      ),
    ).toBe(true);
    // Future natural transitions use the replacement family, on the old clock.
    await advance(first.plan.transitions[0].startSeconds - 4);
    expect(
      elements.filter((e) => e.src.startsWith("blob:field-rain") && e.playing),
    ).toHaveLength(0);
    await playback.dispose();
  });

  it("keeps Hatha 90 music and clock while replacing the nature calendar and invalidating old releases", async () => {
    const playback = create();
    const first = createWholeFileReviewProgram({
      outcome: "yoga",
      durationMinutes: 90,
      mode: "sound-only",
      soundKind: "music",
      seed: "live-nature",
      natureFamily: "rain",
      includeNatureBed: true,
      allowProvisionalMetadata: true,
    });
    const next = replaceCoordinatedNatureBed(first, "sea");
    await playback.load(first);
    await playback.start(first, 0.7);
    await drain();
    const music = elements.find(
      (e) => e.src === `blob:${first.plan.segments[0].workId}`,
    )!;
    music.pause.mockClear();
    music.play.mockClear();
    const changing = playback.replaceNatureFamily(
      next,
      new AbortController().signal,
    );
    await drain();
    await advance(0);
    await advance(4);
    await changing;
    expect(music.pause).not.toHaveBeenCalled();
    expect(music.play).not.toHaveBeenCalled();
    const state = playback as unknown as {
      program: AdaptiveSessionProgram;
      runtimes: Map<number, unknown>;
    };
    expect(state.program).toBe(next);
    const checkpoints = [
      ...new Set(
        [...first.plan.segments, ...next.plan.segments]
          .flatMap((s) => [s.startSeconds, s.endSeconds])
          .filter((second) => second > 4 && second < 2400),
      ),
    ].sort((a, b) => a - b);
    for (const position of checkpoints) {
      await advance(position - playback.positionSeconds());
      expect(playback.positionSeconds()).toBeCloseTo(position);
      expect(
        elements.filter(
          (e) => e.playing && e.src.startsWith("blob:field-rain"),
        ),
      ).toHaveLength(0);
      const activeNature = next.plan.segments.filter(
        (s) =>
          s.lane === "nature" &&
          s.startSeconds <= position &&
          s.endSeconds > position,
      );
      for (const segment of activeNature)
        expect(state.runtimes.has(segment.index)).toBe(true);
      expect(elements.filter((e) => e.playing).length).toBeLessThanOrEqual(3);
      expect(elements).toHaveLength(4);
    }
    await playback.dispose();
  });

  it("preserves playing music and old nature if new source acquisition fails", async () => {
    const playback = create(async (work) => {
      if (work.id.startsWith("field-sea")) throw new Error("offline");
      return { uri: `blob:${work.id}`, release: async () => {} };
    });
    const first = program();
    await playback.load(first);
    await playback.start(first, 0.8);
    await drain();
    const music = elements.find((e) => e.src === "blob:astral-thread")!;
    music.pause.mockClear();
    await expect(
      playback.replaceNatureFamily(
        replaceCoordinatedNatureBed(first, "sea"),
        new AbortController().signal,
      ),
    ).rejects.toThrow("offline");
    expect(music.pause).not.toHaveBeenCalled();
    await advance(2);
    expect(playback.positionSeconds()).toBe(2);
    await playback.dispose();
  });

  it("Stop cancels a pending family lease without waiting for its source", async () => {
    const pending = deferred<{ uri: string; release: () => Promise<void> }>();
    const playback = create(async (work) =>
      work.id.startsWith("field-sea")
        ? pending.promise
        : { uri: `blob:${work.id}`, release: async () => {} },
    );
    const first = program();
    await playback.load(first);
    await playback.start(first, 0.8);
    await drain();
    const cancelled = playback
      .replaceNatureFamily(
        replaceCoordinatedNatureBed(first, "sea"),
        new AbortController().signal,
      )
      .catch((error) => error);
    await drain();
    await playback.stop();
    expect(playback.positionSeconds()).toBe(0);
    expect(await cancelled).toBeInstanceOf(Error);
    const release = jest.fn(async () => {});
    pending.resolve({ uri: "blob:late", release });
    await drain();
    expect(release).toHaveBeenCalledTimes(1);
    await playback.dispose();
  });

  it("aborting the crossfade restores the old nature envelope without stopping music", async () => {
    const playback = create();
    const first = program();
    await playback.load(first);
    await playback.start(first, 0.8);
    await drain();
    const music = elements.find((e) => e.src === "blob:astral-thread")!;
    music.pause.mockClear();
    const abort = new AbortController();
    const change = playback
      .replaceNatureFamily(
        replaceCoordinatedNatureBed(first, "sea"),
        abort.signal,
      )
      .catch((error) => error);
    await drain();
    await advance(0);
    await advance(1);
    abort.abort();
    await change;
    expect(music.pause).not.toHaveBeenCalled();
    expect(playback.positionSeconds()).toBe(1);
    expect(elements).toHaveLength(4);
    await playback.dispose();
  });
});

describe("controller live family transaction", () => {
  class Driver extends FakeAudioDriver {
    replaceAdaptiveNatureFamily = jest.fn(
      async (_program: AdaptiveSessionProgram, _signal: AbortSignal) => {},
    );
  }
  it("preserves deadline, volume, seed and listening run while updating active selection", async () => {
    const driver = new Driver();
    const first = program();
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
    await controller.setNatureMixLevel(0.3);
    const before = controller.getSnapshot();
    const run = controller.getListeningRun();
    const stops = driver.stopCalls;
    const next = await controller.changeNatureFamily("sea");
    expect(next.plan.seed).toBe(first.plan.seed);
    expect(controller.getListeningRun()).toBe(run);
    expect(controller.getSnapshot()).toEqual(before);
    expect(driver.stopCalls).toBe(stops);
    expect(driver.startAdaptiveCalls).toBe(1);
    expect(controller.getConsumerSelection()).toMatchObject({
      program: { plan: { natureMix: { selectedFamily: "sea" } } },
      request: { natureFamily: "sea" },
    });
    await controller.dispose();
  });
  it("does not queue Stop or volume behind a pending family prepare", async () => {
    const driver = new Driver();
    const controller = new AudioSessionController(driver, {
      load: async () => null,
      save: async () => {},
    });
    await controller.loadAdaptiveSession(program());
    await controller.play();
    driver.replaceAdaptiveNatureFamily.mockImplementation(
      (_program, signal) =>
        new Promise((_resolve, reject) =>
          signal.addEventListener(
            "abort",
            () => reject(new Error("cancelled")),
            { once: true },
          ),
        ),
    );
    const change = controller.changeNatureFamily("sea").catch((error) => error);
    await controller.setVolume(0.4);
    expect(controller.getSnapshot().volume).toBe(0.4);
    await controller.stop();
    expect(controller.getSnapshot().status).toBe("ready");
    expect(await change).toBeInstanceOf(PlaybackCancelledError);
    await controller.dispose();
  });

  it("keeps truthful Off metadata and music running if the new family cannot load", async () => {
    const driver = new Driver();
    const controller = new AudioSessionController(
      driver,
      {
        load: async () => null,
        save: async () => {},
      },
      undefined,
      undefined,
      () => driver,
    );
    const first = program();
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
    const stops = driver.stopCalls;
    driver.replaceAdaptiveNatureFamily.mockImplementation(async (next) => {
      if (next.plan.natureMix?.enabled !== false)
        throw new Error("Download unavailable");
    });
    await expect(controller.changeNatureFamily("sea")).rejects.toThrow(
      "Download unavailable",
    );
    expect(controller.getConsumerSelection()).toMatchObject({
      program: { plan: { natureMix: { enabled: false } } },
      request: { includeNatureBed: false },
    });
    expect(controller.getSnapshot().status).toBe("playing");
    expect(driver.startAdaptiveCalls).toBe(1);
    expect(driver.stopCalls).toBe(stops);
    await controller.dispose();
  });
});
