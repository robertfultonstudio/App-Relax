import type { AudioContext, GainNode } from "react-native-audio-api";
import { AdaptiveNativePlayback } from "@/audio/reactNativeAudioApi/AdaptiveNativePlayback";
import {
  createAdaptiveSessionProgram,
  setCoordinatedNatureChoice,
} from "@/domain/sessions/continuumPlanner";
import type { AdaptiveSessionProgram } from "@/domain/sessions/types";
import type { VerifiedNativeAudioFile } from "@/audio/reactNativeAudioApi/NativeAudioSourceResolver";
import { createWholeFileReviewProgram } from "@/domain/sessions/createWholeFileReviewProgram";
import { createNativePreviewProgram } from "@/domain/sessions/createNativePreviewProgram";
import { createListeningNatureProgram } from "@/domain/sessions/createListeningNatureProgram";
import { getConsumerWork } from "@/content/consumerCatalog";
import {
  prepareStreamingFilePosition,
  type StreamingStemSource,
} from "@/audio/reactNativeAudioApi/StreamingStemSource";

function programFixture(): AdaptiveSessionProgram {
  const program = createAdaptiveSessionProgram({
    outcome: "meditation",
    durationMinutes: 20,
    mode: "sound-only",
    soundKind: "nature",
    seed: "native-software-contract",
    allowProvisionalMetadata: true,
  });
  return {
    ...program,
    plan: {
      ...program.plan,
      totalDurationSeconds: 40,
      segments: program.plan.segments.map((segment, index) => ({
        ...segment,
        startSeconds: index === 0 ? 0 : index * 10 - 2,
        endSeconds: (index + 1) * 10,
        sourceEntrySeconds: 0,
        finalEnvelopeSeconds: index === 3 ? 2 : 0,
      })),
      transitions: program.plan.transitions.map((transition, index) => ({
        ...transition,
        startSeconds: (index + 1) * 10 - 2,
        endSeconds: (index + 1) * 10,
        durationSeconds: 2,
      })),
    },
  };
}

function gain() {
  let curveEnd = -Infinity;
  return {
    connect: jest.fn(),
    disconnect: jest.fn(),
    gain: {
      value: 1,
      cancelAndHoldAtTime: jest.fn(),
      cancelScheduledValues: jest.fn(),
      setValueAtTime: jest.fn(),
      linearRampToValueAtTime: jest.fn(),
      setValueCurveAtTime: jest.fn(
        (_values: Float32Array, start: number, duration: number) => {
          // RNAA ParamControlQueue rejects even sub-sample curve overlaps.
          if (start < curveEnd)
            throw new Error(`Native curve overlap: ${start} < ${curveEnd}`);
          curveEnd = start + duration;
        },
      ),
    },
  };
}

function harness(program = programFixture(), allowHathaPreview = false) {
  const files = new Map<string, VerifiedNativeAudioFile>(
    program.works.map((work) => [
      work.id,
      {
        workId: work.id,
        uri: `file:///cache/${work.id}.flac`,
        sha256: "a".repeat(64),
        byteSize: 100,
        release: jest.fn(),
      },
    ]),
  );
  const sources: {
    source: ReturnType<typeof fileSource>;
    output: ReturnType<typeof gain>;
  }[] = [];
  const gains: ReturnType<typeof gain>[] = [];
  const context = {
    currentTime: 1,
    state: "running",
    resume: jest.fn().mockResolvedValue(undefined),
    suspend: jest.fn().mockResolvedValue(undefined),
    createGain: jest.fn(() => {
      const value = gain();
      gains.push(value);
      return value;
    }),
    context: {
      createFileSource: jest.fn(({ source: path }: { source: string }) => {
        const work = program.works.find((candidate) =>
          path.endsWith(`${candidate.id}.flac`),
        )!;
        const source = fileSource(
          work.durationSeconds,
          () => context.currentTime,
        );
        sources.push({ source, output: gain() });
        return source;
      }),
    },
    createMediaElementSource: jest.fn(() => sources[sources.length - 1].output),
  };
  const resolver = {
    acquire: jest.fn(async (id: string) => files.get(id) ?? null),
  };
  const handlers = { ended: jest.fn(), error: jest.fn() };
  const playback = new AdaptiveNativePlayback(
    context as unknown as AudioContext,
    gain() as unknown as GainNode,
    resolver,
    handlers,
    { allowHathaPreview },
  );
  return {
    playback,
    context,
    sources,
    gains,
    files,
    resolver,
    handlers,
    program,
  };
}

function fileSource(duration: number, clock: () => number) {
  let position = 0;
  let startedAt = 0;
  let playing = false;
  const source = {
    duration,
    get currentTime() {
      return (
        (position + (playing ? Math.max(0, clock() - startedAt) : 0)) % duration
      );
    },
    start: jest.fn((when: number) => {
      startedAt = when;
      playing = true;
    }),
    seekToTime: jest.fn((target: number) => {
      position = target + 0.005;
      startedAt = clock();
    }),
    pause: jest.fn(() => {
      position = source.currentTime;
      playing = false;
    }),
    stop: jest.fn(),
    disconnect: jest.fn(),
  };
  return source;
}

async function flush() {
  for (let index = 0; index < 40; index += 1) await Promise.resolve();
}

describe("native adaptive software contract", () => {
  beforeEach(() => jest.useFakeTimers());
  afterEach(() => jest.useRealTimers());

  it("enables and disables nature independently while the native music source keeps running", async () => {
    const off = createListeningNatureProgram(
      getConsumerWork("astral-thread")!,
      "focus",
      30,
      null,
    );
    const h = harness(off);
    await h.playback.load(off);
    expect(h.resolver.acquire).toHaveBeenCalledTimes(1);
    await h.playback.start(0.7);
    const music = h.sources[0].source;
    const startCalls = music.start.mock.calls.length;
    const musicAutomation =
      h.gains[2].gain.linearRampToValueAtTime.mock.calls.length;
    const rain = setCoordinatedNatureChoice(off, "rain");
    const enable = h.playback.replaceNatureFamily(
      rain,
      new AbortController().signal,
    );
    await jest.advanceTimersByTimeAsync(300);
    await enable;
    expect(music.start).toHaveBeenCalledTimes(startCalls);
    expect(music.disconnect).not.toHaveBeenCalled();
    expect(h.gains[2].gain.linearRampToValueAtTime).toHaveBeenCalledTimes(
      musicAutomation,
    );
    const disable = h.playback.replaceNatureFamily(
      setCoordinatedNatureChoice(rain, null),
      new AbortController().signal,
    );
    await jest.advanceTimersByTimeAsync(300);
    await disable;
    expect(
      h.sources.filter((s) => s.source.disconnect.mock.calls.length === 0),
    ).toHaveLength(1);
    expect(music.disconnect).not.toHaveBeenCalled();
    await h.playback.stop();
  });

  it("joins an incoming natural recording during its overlap without restarting native music", async () => {
    const off = createListeningNatureProgram(
      getConsumerWork("astral-thread")!,
      "focus",
      30,
      null,
    );
    const rain = setCoordinatedNatureChoice(off, "rain");
    const join = rain.plan.transitions.find((t) => t.lane === "nature")!;
    const h = harness(off);
    await h.playback.load(off);
    await h.playback.start(0.7, join.startSeconds + 1);
    const music = h.sources[0].source;
    const starts = music.start.mock.calls.length;
    const enable = h.playback.replaceNatureFamily(
      rain,
      new AbortController().signal,
    );
    await jest.advanceTimersByTimeAsync(300);
    await enable;
    await jest.advanceTimersByTimeAsync(500);
    expect(music.start).toHaveBeenCalledTimes(starts);
    expect(music.disconnect).not.toHaveBeenCalled();
    expect(h.handlers.error).not.toHaveBeenCalled();
    expect(
      h.sources.filter((s) => !s.source.disconnect.mock.calls.length),
    ).toHaveLength(3); // Music, incoming ambience, one future preload.
    expect(
      (
        h.playback as unknown as { skippedNatureIndexes: Set<number> }
      ).skippedNatureIndexes.has(join.outgoingSegmentIndex),
    ).toBe(true);
    await h.playback.stop();
  });

  it("keeps adjacent native gain curves disjoint on non-round sample clocks", async () => {
    const program = createNativePreviewProgram({
      outcome: "yoga",
      durationMinutes: 90,
      mode: "sound-only",
      soundKind: "music",
      seed: "native-d097",
      allowProvisionalMetadata: true,
      includeNatureBed: true,
      natureFamily: "sea",
    });
    for (const frame of [128, 256, 4096, 48001, 123456, 876543]) {
      const h = harness(program, true);
      h.context.currentTime = frame / 48000;
      await h.playback.load(program);
      await h.playback.start(0.8);
      for (const transition of program.plan.transitions)
        await h.playback.seek(transition.startSeconds);
      // The mock enforces RNAA's strict exclusion, not an epsilon comparison.
      for (const node of h.gains) {
        const curves = node.gain.setValueCurveAtTime.mock.calls;
        for (let index = 1; index < curves.length; index += 1)
          expect(curves[index][1]).toBeGreaterThanOrEqual(
            curves[index - 1][1] + curves[index - 1][2],
          );
      }
      expect(h.handlers.error).not.toHaveBeenCalled();
      await h.playback.stop();
    }
  });

  it.each([30, 45, 60, 90] as const)(
    "loads, starts and seeks the real Hatha %i-minute plan with both nature families",
    async (durationMinutes) => {
      for (const natureFamily of [undefined, "rain", "sea"] as const) {
        const program = createNativePreviewProgram({
          outcome: "yoga",
          durationMinutes,
          mode: "sound-only",
          soundKind: "music",
          seed: "native-d097",
          allowProvisionalMetadata: true,
          includeNatureBed: !!natureFamily,
          natureFamily,
        });
        const h = harness(program, true);
        await h.playback.load(program);
        await h.playback.start(0.8);
        for (const transition of program.plan.transitions) {
          await h.playback.seek(
            transition.startSeconds + transition.durationSeconds / 2,
          );
          expect(
            h.sources.filter((s) => s.source.disconnect.mock.calls.length === 0)
              .length,
          ).toBeLessThanOrEqual(natureFamily ? 3 : 2);
        }
        await h.playback.stop();
        expect(h.handlers.error).not.toHaveBeenCalled();
        expect(jest.getTimerCount()).toBe(0);
      }
    },
  );
  it.each(["rain", "sea"] as const)(
    "rolls the full 90-minute %s plan without seeks or a missed decoder deadline",
    async (natureFamily) => {
      const program = createNativePreviewProgram({
        outcome: "yoga",
        durationMinutes: 90,
        mode: "sound-only",
        soundKind: "music",
        seed: "native-d097",
        allowProvisionalMetadata: true,
        includeNatureBed: true,
        natureFamily,
      });
      const h = harness(program, true);
      await h.playback.load(program);
      await h.playback.start(0.8);
      await flush();
      for (let time = 4; time < 5400; time += 4) {
        h.context.currentTime = 1.1 + time;
        await jest.advanceTimersByTimeAsync(100);
        expect(h.handlers.error).not.toHaveBeenCalled();
        expect(
          h.sources.filter((s) => s.source.disconnect.mock.calls.length === 0)
            .length,
        ).toBeLessThanOrEqual(3);
      }
      h.context.currentTime = 5401.2;
      await jest.advanceTimersByTimeAsync(100);
      expect(h.handlers.ended).toHaveBeenCalledTimes(1);
      expect(jest.getTimerCount()).toBe(0);
    },
    15000,
  );
  it("keeps Hatha gated without internal authorization, without marking it approved", async () => {
    const program = createWholeFileReviewProgram({
      outcome: "yoga",
      durationMinutes: 90,
      mode: "sound-only",
      soundKind: "music",
      seed: "gate",
      allowProvisionalMetadata: true,
    });
    const h = harness(program);
    await expect(h.playback.load(program)).rejects.toThrow("approved file");
    expect(
      program.works
        .filter((w) =>
          program.plan.segments.some(
            (s) => s.lane !== "nature" && s.workId === w.id,
          ),
        )
        .every((w) => w.listeningStatus.startsWith("PROVISIONAL")),
    ).toBe(true);
  });
  it("plays standalone music plus changing rain or sea without a two-recording-only restriction", async () => {
    for (const family of ["rain", "sea"] as const) {
      const program = createListeningNatureProgram(
        getConsumerWork("astral-thread")!,
        "focus",
        90,
        family,
      );
      const h = harness(program);
      await h.playback.load(program);
      await h.playback.start(0.8);
      await h.playback.seek(500);
      await h.playback.stop();
      expect(h.handlers.error).not.toHaveBeenCalled();
    }
  });

  it("verifies leases before playback and preloads only one future natural source", async () => {
    const h = harness();
    await h.playback.load(h.program);
    expect(h.sources).toHaveLength(0);
    await h.playback.start(0.8);
    expect(h.sources).toHaveLength(2);
    expect(h.sources[0].source.start).toHaveBeenLastCalledWith(1.1);
    expect(h.sources[1].source.start).toHaveBeenLastCalledWith(9.1);
    expect(h.sources[0].source.stop).toHaveBeenCalledWith(11.1);
    expect(
      h.gains.some(
        (node) => node.gain.setValueCurveAtTime.mock.calls.length > 0,
      ),
    ).toBe(true);
    await h.playback.stop();
    expect(
      [...h.files.values()].every(
        (file) => (file.release as jest.Mock).mock.calls.length === 1,
      ),
    ).toBe(true);
    expect(jest.getTimerCount()).toBe(0);
  });

  it("rolls the decoder pool and ends once, with clock scheduled final stop", async () => {
    const h = harness();
    await h.playback.load(h.program);
    await h.playback.start(0.8);
    await flush();
    h.context.currentTime = 11.2;
    await jest.advanceTimersByTimeAsync(100);
    expect(h.sources).toHaveLength(3);
    expect(h.sources[0].source.pause).toHaveBeenCalled();
    h.context.currentTime = 21.2;
    await jest.advanceTimersByTimeAsync(100);
    expect(h.sources).toHaveLength(4);
    expect(h.sources[3].source.stop).toHaveBeenCalledWith(41.1);
    h.context.currentTime = 41.2;
    await jest.advanceTimersByTimeAsync(100);
    expect(h.handlers.ended).toHaveBeenCalledTimes(1);
    expect(h.handlers.error).not.toHaveBeenCalled();
    expect(jest.getTimerCount()).toBe(0);
  });

  it("pauses/resumes without rebasing the shared native clock", async () => {
    const h = harness();
    await h.playback.load(h.program);
    await h.playback.start(0.8);
    h.context.currentTime = 5;
    h.playback.pause();
    expect(h.playback.positionSeconds()).toBeCloseTo(3.9);
    h.playback.resume();
    expect(h.sources).toHaveLength(2);
    expect(h.sources[0].source.start).toHaveBeenCalledTimes(2);
    await h.playback.stop();
  });

  it("seeks inside an overlap behind a common silent barrier", async () => {
    const h = harness();
    await h.playback.load(h.program);
    await h.playback.start(0.8, 9);
    expect(h.sources).toHaveLength(2);
    for (const { source } of h.sources)
      expect(source.start.mock.lastCall?.[0]).toBeCloseTo(1.1);
    await h.playback.seek(29);
    expect(h.sources).toHaveLength(4);
    expect(
      h.sources
        .slice(0, 2)
        .every(({ source }) => source.disconnect.mock.calls.length > 0),
    ).toBe(true);
    await h.playback.stop();
  });

  it("cleans every deck when a decoder cannot initialize, with no audible scheduled start", async () => {
    const h = harness();
    const create = h.context.context.createFileSource.getMockImplementation()!;
    h.context.context.createFileSource.mockImplementation((options) => {
      const source = create(options);
      if (h.sources.length === 2) source.duration = 0;
      return source;
    });
    await h.playback.load(h.program);
    await expect(h.playback.start(0.8)).rejects.toThrow("duration");
    expect(
      h.sources.every(({ source }) => source.disconnect.mock.calls.length > 0),
    ).toBe(true);
    expect(h.sources[0].source.start).toHaveBeenCalledTimes(1);
    expect(jest.getTimerCount()).toBe(0);
  });

  it("rejects unverified/network leases and releases every acquired lease", async () => {
    const h = harness();
    const second = [...h.files.values()][1];
    Object.assign(second, { uri: "https://invalid.example/audio.flac" });
    await expect(h.playback.load(h.program)).rejects.toThrow(
      "verified local file lease",
    );
    expect(second.release).toHaveBeenCalledTimes(1);
    expect([...h.files.values()][0].release).toHaveBeenCalledTimes(1);
    expect(h.sources).toHaveLength(0);
  });

  it("Stop cancels an in-flight acquisition and releases its late lease", async () => {
    const h = harness();
    let resolve!: (file: VerifiedNativeAudioFile) => void;
    h.resolver.acquire.mockImplementationOnce(
      () =>
        new Promise((done) => {
          resolve = done;
        }),
    );
    const loaded = h.playback.load(h.program);
    const rejected = expect(loaded).rejects.toThrow("cancelled");
    await flush();
    await h.playback.stop();
    const file = [...h.files.values()][0];
    resolve(file);
    await rejected;
    expect(file.release).toHaveBeenCalledTimes(1);
    expect(h.sources).toHaveLength(0);
  });

  it("fails closed on a missed rolling preload deadline", async () => {
    const h = harness();
    await h.playback.load(h.program);
    await h.playback.start(0.8);
    await flush();
    h.context.currentTime = 26;
    await jest.advanceTimersByTimeAsync(100);
    expect(h.handlers.error).toHaveBeenCalledWith(
      expect.objectContaining({ message: expect.stringContaining("deadline") }),
    );
    expect(jest.getTimerCount()).toBe(0);
  });

  it("rejects a fourth simultaneous source without opening decoders", async () => {
    const h = harness();
    const program = {
      ...h.program,
      plan: {
        ...h.program.plan,
        transitions: [],
        segments: h.program.plan.segments.map((segment) => ({
          ...segment,
          startSeconds: 0,
          endSeconds: 40,
        })),
      },
    };
    await expect(h.playback.load(program)).rejects.toThrow("source limit");
    expect(h.sources).toHaveLength(0);
  });

  it("coordinates two lanes with at most three allocated sources and independent nature mute", async () => {
    const base = programFixture();
    const natureSegments = [
      {
        ...base.plan.segments[0],
        index: 10,
        lane: "nature" as const,
        startSeconds: 0,
        endSeconds: 24,
        finalEnvelopeSeconds: 0,
      },
      {
        ...base.plan.segments[1],
        index: 11,
        lane: "nature" as const,
        startSeconds: 22,
        endSeconds: 40,
        finalEnvelopeSeconds: 2,
      },
    ];
    const program: AdaptiveSessionProgram = {
      ...base,
      plan: {
        ...base.plan,
        natureMix: {
          initialLevel: 0.3,
          minimumLevel: 0,
          maximumLevel: 1,
          levelStep: 0.1,
          selectedFamily: "sea",
          availableFamilies: ["sea"],
          headroomStrategy: "fixed-music-equal-ceiling",
          musicWorkIds: base.works.map((work) => work.id),
          natureWorkIds: natureSegments.map((segment) => segment.workId),
        },
        segments: [...base.plan.segments, ...natureSegments],
        transitions: [
          ...base.plan.transitions,
          {
            ...base.plan.transitions[0],
            index: 10,
            lane: "nature",
            outgoingSegmentIndex: 10,
            incomingSegmentIndex: 11,
            startSeconds: 22,
            endSeconds: 24,
            durationSeconds: 2,
          },
        ],
      },
    };
    const h = harness(program);
    await h.playback.load(program);
    await h.playback.start(0.8);
    expect(h.sources).toHaveLength(3);
    expect(h.gains[1].gain.value).toBe(
      program.plan.natureMix!.initialLevel * 0.5,
    );
    expect(h.gains[2].gain.value).toBe(0.5);
    h.playback.setNatureLevel(1, 100);
    expect(h.gains[1].gain.linearRampToValueAtTime).toHaveBeenLastCalledWith(
      0.5,
      1.1,
    );
    h.playback.setNatureLevel(0, 100);
    expect(h.gains[1].gain.linearRampToValueAtTime).toHaveBeenLastCalledWith(
      0,
      1.1,
    );
    expect(h.gains[0].gain.linearRampToValueAtTime).toHaveBeenLastCalledWith(
      0.8,
      expect.any(Number),
    );
    await flush();
    h.context.currentTime = 11.2;
    await jest.advanceTimersByTimeAsync(100);
    expect(h.sources).toHaveLength(4);
    expect(
      h.sources.filter(
        ({ source }) => source.disconnect.mock.calls.length === 0,
      ),
    ).toHaveLength(3);
    await h.playback.stop();
    expect(
      h.sources.every(
        ({ source }) =>
          source.pause.mock.calls.length > 0 &&
          source.disconnect.mock.calls.length > 0,
      ),
    ).toBe(true);
  });

  it("Stop cancels decoder preparation and does not resurrect a late source", async () => {
    const h = harness();
    const create = h.context.context.createFileSource.getMockImplementation()!;
    h.context.context.createFileSource.mockImplementation((options) => {
      const source = create(options);
      source.seekToTime.mockImplementation(() => undefined);
      return source;
    });
    await h.playback.load(h.program);
    const rejected = expect(h.playback.start(0.8)).rejects.toThrow("cancelled");
    await flush();
    await h.playback.stop();
    await rejected;
    expect(jest.getTimerCount()).toBe(0);
    expect(
      h.sources.every(({ source }) => source.disconnect.mock.calls.length > 0),
    ).toBe(true);
  });

  it("starts seek confirmation only after synchronous initial decoder construction", async () => {
    const h = harness();
    const create = h.context.context.createFileSource.getMockImplementation()!;
    let allocations = 0;
    h.context.context.createFileSource.mockImplementation((options) => {
      const source = create(options);
      allocations += 1;
      if (allocations === 1) {
        let target = 0;
        let seekStartedAt = Date.now();
        source.seekToTime.mockImplementation((position: number) => {
          target = position;
          seekStartedAt = Date.now();
        });
        Object.defineProperty(source, "currentTime", {
          configurable: true,
          get: () => target + (Date.now() - seekStartedAt) / 1000,
        });
      } else if (allocations === 2) {
        // A synchronous JSI constructor can occupy the JS thread without
        // allowing the first source's 10 ms confirmation poll to run.
        jest.setSystemTime(Date.now() + 200);
      }
      return source;
    });
    await h.playback.load(h.program);
    const started = h.playback.start(0.8);
    const completed = expect(started).resolves.toBeUndefined();
    await flush();
    await jest.advanceTimersByTimeAsync(5000);
    await completed;
    expect(allocations).toBe(2);
    await h.playback.stop();
    expect(jest.getTimerCount()).toBe(0);
  });

  it("lets Stop win between initial decoder construction and the start microtask", async () => {
    const h = harness();
    const create = h.context.context.createFileSource.getMockImplementation()!;
    let allocations = 0;
    let stopping: Promise<void> | undefined;
    h.context.context.createFileSource.mockImplementation((options) => {
      const source = create(options);
      allocations += 1;
      if (allocations === 2) stopping = h.playback.stop();
      return source;
    });
    await h.playback.load(h.program);
    const started = h.playback.start(0.8);
    const rejected = expect(started).rejects.toThrow("cancelled");
    await flush();
    expect(stopping).toBeDefined();
    await stopping!;
    await rejected;
    expect(h.sources).toHaveLength(2);
    expect(
      h.sources.every(
        ({ source }) =>
          source.start.mock.calls.length === 0 &&
          source.disconnect.mock.calls.length > 0,
      ),
    ).toBe(true);
    expect(
      [...h.files.values()].every(
        (file) => (file.release as jest.Mock).mock.calls.length === 1,
      ),
    ).toBe(true);
    expect(jest.getTimerCount()).toBe(0);
  });

  it("does not allocate decoders when Stop wins a pending context resume", async () => {
    const h = harness();
    await h.playback.load(h.program);
    let resumed!: () => void;
    h.context.resume.mockReturnValueOnce(
      new Promise<void>((resolve) => {
        resumed = resolve;
      }),
    );
    const rejected = expect(h.playback.start(0.8)).rejects.toThrow("cancelled");
    await flush();
    await h.playback.stop();
    resumed();
    await rejected;
    expect(h.sources).toHaveLength(0);
    expect(jest.getTimerCount()).toBe(0);
  });

  it("can seek while paused and resume the newly prepared sources", async () => {
    const h = harness();
    await h.playback.load(h.program);
    await h.playback.start(0.8);
    h.playback.pause();
    await h.playback.seek(29);
    expect(h.context.suspend).toHaveBeenCalledTimes(1);
    h.playback.resume();
    expect(
      h.sources
        .slice(2)
        .every(({ source }) => source.start.mock.calls.length === 2),
    ).toBe(true);
    await h.playback.stop();
  });

  it("does not mistake untouched zero for a seek inside the final 100 ms", async () => {
    const source = {
      duration: 10,
      currentTime: 0,
      start: jest.fn(),
      seekToTime: jest.fn(),
      pause: jest.fn(),
    };
    const preparing = prepareStreamingFilePosition(
      { currentTime: 1 } as unknown as AudioContext,
      { source, output: gain() } as unknown as StreamingStemSource,
      9.95,
      10,
      new AbortController().signal,
    );
    const rejected = expect(preparing).rejects.toThrow(
      "did not confirm the requested position",
    );
    await jest.advanceTimersByTimeAsync(5000);
    await rejected;
    expect(source.seekToTime).toHaveBeenCalledTimes(1);
    expect(source.seekToTime).toHaveBeenCalledWith(9.75);
    expect(source.pause).toHaveBeenCalledTimes(1);
  });

  it("recovers once when a finite position overshoots the confirmation window", async () => {
    let currentTime = 0;
    const source = {
      duration: 10,
      get currentTime() {
        return currentTime;
      },
      start: jest.fn(),
      seekToTime: jest.fn((position: number) => {
        currentTime =
          source.seekToTime.mock.calls.length === 1
            ? position + 0.2
            : position + 0.005;
      }),
      pause: jest.fn(),
    };
    const preparing = prepareStreamingFilePosition(
      { currentTime: 1 } as unknown as AudioContext,
      { source, output: gain() } as unknown as StreamingStemSource,
      0,
      10,
      new AbortController().signal,
    );
    const completed = expect(preparing).resolves.toBeUndefined();
    await jest.advanceTimersByTimeAsync(5000);
    await completed;
    expect(source.seekToTime.mock.calls).toEqual([[0], [0]]);
    expect(source.pause).toHaveBeenCalledTimes(1);
  });

  it("fails at the original deadline after one recovery without a seek storm", async () => {
    const startedAt = Date.now();
    const source = {
      duration: 10,
      get currentTime() {
        return Date.now() - startedAt >= 4900 ? 0.2 : 0;
      },
      start: jest.fn(),
      seekToTime: jest.fn(),
      pause: jest.fn(),
    };
    const preparing = prepareStreamingFilePosition(
      { currentTime: 1 } as unknown as AudioContext,
      { source, output: gain() } as unknown as StreamingStemSource,
      0,
      10,
      new AbortController().signal,
    );
    const rejected = expect(preparing).rejects.toThrow(
      "did not confirm the requested position",
    );
    await jest.advanceTimersByTimeAsync(4900);
    expect(source.seekToTime.mock.calls).toEqual([[0], [0]]);
    await jest.advanceTimersByTimeAsync(100);
    await rejected;
    expect(source.seekToTime.mock.calls).toEqual([[0], [0]]);
    expect(source.pause).toHaveBeenCalledTimes(1);
  });

  it("cancels after the one recovery without issuing another seek", async () => {
    let currentTime = 0;
    const controller = new AbortController();
    const source = {
      duration: 10,
      get currentTime() {
        return currentTime;
      },
      start: jest.fn(),
      seekToTime: jest.fn((position: number) => {
        currentTime = position + 0.2;
      }),
      pause: jest.fn(),
    };
    const preparing = prepareStreamingFilePosition(
      { currentTime: 1 } as unknown as AudioContext,
      { source, output: gain() } as unknown as StreamingStemSource,
      0,
      10,
      controller.signal,
    );
    const rejected = expect(preparing).rejects.toThrow("cancelled");
    controller.abort();
    await rejected;
    expect(source.seekToTime.mock.calls).toEqual([[0], [0]]);
    expect(source.pause).toHaveBeenCalledTimes(1);
    expect(jest.getTimerCount()).toBe(0);
  });

  it("shares one recovery across the near-end probe and wrapped target", async () => {
    let currentTime = 0;
    const source = {
      duration: 10,
      get currentTime() {
        return currentTime;
      },
      start: jest.fn(),
      seekToTime: jest.fn((position: number) => {
        const call = source.seekToTime.mock.calls.length;
        if (call === 1) currentTime = position + 0.2;
        else if (call === 2) currentTime = position + 0.005;
        else currentTime = 0.2;
      }),
      pause: jest.fn(),
    };
    const preparing = prepareStreamingFilePosition(
      { currentTime: 1 } as unknown as AudioContext,
      { source, output: gain() } as unknown as StreamingStemSource,
      9.95,
      10,
      new AbortController().signal,
    );
    const rejected = expect(preparing).rejects.toThrow(
      "did not confirm the requested position",
    );
    await jest.advanceTimersByTimeAsync(5000);
    await rejected;
    expect(source.seekToTime.mock.calls).toEqual([[9.75], [9.75], [9.95]]);
    expect(source.pause).toHaveBeenCalledTimes(1);
  });

  it("serializes an end-of-loop probe before accepting a wrapped seek", async () => {
    let currentTime = 0;
    const source = {
      duration: 10,
      get currentTime() {
        return currentTime;
      },
      start: jest.fn(),
      seekToTime: jest.fn((position: number) => {
        currentTime = position === 9.95 ? 0.005 : position + 0.005;
      }),
      pause: jest.fn(),
    };
    await prepareStreamingFilePosition(
      { currentTime: 1 } as unknown as AudioContext,
      { source, output: gain() } as unknown as StreamingStemSource,
      9.95,
      10,
      new AbortController().signal,
    );
    expect(source.seekToTime.mock.calls).toEqual([[9.75], [9.95]]);
    expect(source.pause).toHaveBeenCalledTimes(1);
  });

  it("tears down every deck while the context is suspended after native cleanup errors", async () => {
    const h = harness();
    await h.playback.load(h.program);
    await h.playback.start(0.8);
    h.context.state = "suspended";
    h.playback.pause();
    for (const { source } of h.sources) {
      source.pause.mockImplementation(() => {
        throw new Error("native pause failed");
      });
      source.stop.mockImplementation(() => {
        throw new Error("native stop failed");
      });
      source.disconnect.mockImplementation(() => {
        throw new Error("native disconnect failed");
      });
    }
    for (const node of h.gains) {
      node.disconnect.mockImplementation(() => {
        throw new Error("native gain disconnect failed");
      });
      node.gain.setValueAtTime.mockImplementation(() => {
        throw new Error("native gain silence failed");
      });
    }
    await expect(h.playback.stop()).resolves.toBeUndefined();
    expect(
      [...h.files.values()].every(
        (file) => (file.release as jest.Mock).mock.calls.length === 1,
      ),
    ).toBe(true);
    expect(jest.getTimerCount()).toBe(0);
  });
});
