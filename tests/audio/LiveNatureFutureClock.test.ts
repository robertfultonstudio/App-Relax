import { AdaptiveWebPlayback } from "@/audio/web/AdaptiveWebPlayback";
import { ClockedWavSource } from "@/audio/web/ClockedWavSource";
import { getConsumerWork } from "@/content/consumerCatalog";
import { createListeningNatureProgram } from "@/domain/sessions/createListeningNatureProgram";
import { replaceCoordinatedNatureBed } from "@/domain/sessions/continuumPlanner";

jest.mock("@/audio/web/ClockedWavSource", () => ({
  ...jest.requireActual("@/audio/web/ClockedWavSource"),
  ClockedWavSource: jest.fn(),
}));
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
let seekMs: number;
let runwayMs: number;
class SlowClocked extends EventTarget {
  src = "";
  output = gain();
  readyState = 4;
  seeking = false;
  offset = 0;
  started: number | null = null;
  constructor(private readonly context: AudioContext) {
    super();
  }
  get currentTime() {
    return (
      this.offset +
      (this.started === null
        ? 0
        : Math.max(0, this.context.currentTime - this.started))
    );
  }
  set currentTime(value: number) {
    this.offset = value;
  }
  prepareAt = jest.fn(async (position: number) => {
    if (this.src.includes("field-sea"))
      await new Promise<void>((resolve) => setTimeout(resolve, seekMs));
    this.offset = position;
  });
  prepareForPlayback = jest.fn(async () => {
    if (this.src.includes("field-sea"))
      await new Promise<void>((resolve) => setTimeout(resolve, runwayMs));
  });
  playAt = jest.fn(async (time: number) => {
    this.started = time;
  });
  play = jest.fn(async () => {});
  pause = jest.fn(() => {
    this.offset = this.currentTime;
    this.started = null;
  });
  prepareLookahead = async () => {};
  releasePcmReader = jest.fn();
  load = jest.fn();
  removeAttribute() {
    this.src = "";
  }
}
async function drain() {
  for (let i = 0; i < 100; i++) await Promise.resolve();
}

describe("live nature future PCM clock", () => {
  let context: AudioContext;
  let playback: AdaptiveWebPlayback;
  let ports: SlowClocked[];
  beforeEach(() => {
    jest.useFakeTimers();
    seekMs = 200;
    runwayMs = 200;
    ports = [];
    const origin = Date.now();
    context = {
      get currentTime() {
        return (Date.now() - origin) / 1000;
      },
      resume: async () => {},
      createGain: gain,
    } as unknown as AudioContext;
    jest.mocked(ClockedWavSource).mockImplementation(() => {
      const port = new SlowClocked(context);
      ports.push(port);
      return port as unknown as ClockedWavSource;
    });
    playback = new AdaptiveWebPlayback(
      context,
      {} as AudioNode,
      { ended: jest.fn(), error: jest.fn() },
      async (work) => ({
        uri: `fixture://${work.id}.flac`,
        release: async () => {},
      }),
      true,
      () => null,
    );
  });
  afterEach(async () => {
    await playback.dispose();
    jest.useRealTimers();
  });
  const first = () =>
    createListeningNatureProgram(
      getConsumerWork("astral-thread")!,
      "focus",
      30,
      "rain",
    );

  it("anchors 200ms seek plus 200ms runway to one future source offset and delayed gain start", async () => {
    const original = first();
    const next = replaceCoordinatedNatureBed(original, "sea");
    await playback.load(original);
    await playback.start(original, 0.8);
    await drain();
    const music = ports.find((port) => port.src.includes("astral-thread"))!;
    const musicStart = music.playAt.mock.calls.at(-1)![0];
    music.pause.mockClear();
    music.playAt.mockClear();
    const state = playback as unknown as {
      program: typeof original;
      runtimes: Map<number, { gain: ReturnType<typeof gain> }>;
    };
    const old = original.plan.segments.find(
      (segment) => segment.lane === "nature",
    )!;
    const oldGain = state.runtimes.get(old.index)!.gain.gain;
    const changed = playback.replaceNatureFamily(
      next,
      new AbortController().signal,
    );
    await jest.advanceTimersByTimeAsync(1000);
    await drain();
    const sea = ports.find(
      (port) => port.src.includes("field-sea") && port.playAt.mock.calls.length,
    )!;
    expect(sea).toBeDefined();
    const anchor = sea.playAt.mock.calls.at(-1)![0];
    expect(anchor).toBeCloseTo(2.6);
    expect(anchor).toBeGreaterThan(context.currentTime);
    const target = next.plan.segments.find(
      (segment) => segment.lane === "nature",
    )!;
    const duration = next.works.find(
      (work) => work.id === target.workId,
    )!.durationSeconds;
    expect(sea.prepareAt.mock.calls.at(-1)![0]).toBeCloseTo(
      (target.sourceEntrySeconds + anchor - musicStart - target.startSeconds) %
        duration,
    );
    expect(oldGain.linearRampToValueAtTime).toHaveBeenLastCalledWith(
      0,
      anchor + 4,
    );
    expect(oldGain.setValueAtTime.mock.calls.at(-1)![1]).toBe(anchor);
    const temp =
      Math.max(
        ...original.plan.segments.map((segment) => segment.index),
        ...next.plan.segments.map((segment) => segment.index),
      ) + 1;
    const newGain = state.runtimes.get(temp)!.gain.gain;
    expect(newGain.setValueAtTime).toHaveBeenLastCalledWith(0, anchor);
    expect(newGain.linearRampToValueAtTime.mock.calls.at(-1)![1]).toBe(
      anchor + 4,
    );
    await jest.advanceTimersByTimeAsync(
      (anchor + 4 - context.currentTime) * 1000 - 1,
    );
    expect(state.program).toBe(original);
    await jest.advanceTimersByTimeAsync(1);
    await changed;
    expect(state.program).toBe(next);
    expect(playback.positionSeconds()).toBeCloseTo(anchor + 4 - musicStart);
    expect(music.pause).not.toHaveBeenCalled();
    expect(music.playAt).not.toHaveBeenCalled();
    expect(ports).toHaveLength(4);
  });

  it("a missed future deadline preserves old nature gain and music instead of accepting drift", async () => {
    const original = first();
    const next = replaceCoordinatedNatureBed(original, "sea");
    await playback.load(original);
    await playback.start(original, 0.8);
    await drain();
    const state = playback as unknown as {
      program: typeof original;
      runtimes: Map<number, { gain: ReturnType<typeof gain> }>;
    };
    const old = original.plan.segments.find(
      (segment) => segment.lane === "nature",
    )!;
    const oldGain = state.runtimes.get(old.index)!.gain.gain;
    const priorRamps = [...oldGain.linearRampToValueAtTime.mock.calls];
    const priorCancels = [...oldGain.cancelScheduledValues.mock.calls];
    const music = ports.find((port) => port.src.includes("astral-thread"))!;
    music.pause.mockClear();
    music.playAt.mockClear();
    runwayMs = 2200;
    const failed = playback
      .replaceNatureFamily(next, new AbortController().signal)
      .catch((error) => error);
    await jest.advanceTimersByTimeAsync(6000);
    await drain();
    expect(await failed).toBeInstanceOf(Error);
    expect(state.program).toBe(original);
    expect(oldGain.linearRampToValueAtTime.mock.calls).toEqual(priorRamps);
    expect(oldGain.cancelScheduledValues.mock.calls).toEqual(priorCancels);
    expect(
      ports.filter(
        (port) => port.src.includes("field-sea") && port.started !== null,
      ),
    ).toHaveLength(0);
    expect(music.pause).not.toHaveBeenCalled();
    expect(music.playAt).not.toHaveBeenCalled();
  });
});
