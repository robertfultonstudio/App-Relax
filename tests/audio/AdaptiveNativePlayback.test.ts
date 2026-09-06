import type { AudioContext, GainNode } from "react-native-audio-api";
import { AdaptiveNativePlayback } from "@/audio/reactNativeAudioApi/AdaptiveNativePlayback";
import { createAdaptiveSessionProgram } from "@/domain/sessions/continuumPlanner";
import type { AdaptiveSessionProgram } from "@/domain/sessions/types";
import type { VerifiedNativeAudioFile } from "@/audio/reactNativeAudioApi/NativeAudioSourceResolver";

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
  return {
    connect: jest.fn(),
    disconnect: jest.fn(),
    gain: {
      value: 1,
      cancelAndHoldAtTime: jest.fn(),
      cancelScheduledValues: jest.fn(),
      setValueAtTime: jest.fn(),
      linearRampToValueAtTime: jest.fn(),
      setValueCurveAtTime: jest.fn(),
    },
  };
}

function harness(program = programFixture()) {
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
});
