import { AdaptiveWebPlayback } from "@/audio/web/AdaptiveWebPlayback";
import { ClockedWavSource } from "@/audio/web/ClockedWavSource";
import { createListeningNatureProgram } from "@/pwa-review/createListeningNatureProgram";
import { createWholeFileReviewProgram } from "@/pwa-review/createWholeFileReviewProgram";
import { getConsumerWork } from "@/content/consumerCatalog";
import { reviewMarkers } from "@/pwa-review/reviewTimeline";

const mockPcmElements: MockPcmElement[] = [];
const mockMediaElements: MockElement[] = [];
function mockNode() {
  return {
    connect: jest.fn(),
    disconnect: jest.fn(),
    gain: {
      value: 1,
      cancelScheduledValues: jest.fn(),
      linearRampToValueAtTime: jest.fn(),
      setValueAtTime: jest.fn(),
      setValueCurveAtTime: jest.fn(),
    },
  };
}
class MockElement extends EventTarget {
  src = "";
  loop = true;
  preload = "metadata";
  readyState = 3;
  seeking = false;
  error = null;
  paused = true;
  private position = 0;
  get currentTime() {
    return this.position;
  }
  set currentTime(value: number) {
    this.position = value;
    this.dispatchEvent(new Event("seeked"));
  }
  play = jest.fn(async () => {
    this.paused = false;
  });
  pause = jest.fn(() => {
    this.paused = true;
  });
  load = jest.fn();
  removeAttribute(name: string) {
    if (name === "src") this.src = "";
  }
}
class MockPcmElement extends MockElement {
  output = mockNode();
}
jest.mock("@/audio/web/ClockedWavSource", () => ({
  ClockedWavSource: jest.fn(() => {
    const element = new MockPcmElement();
    mockPcmElements.push(element);
    return element;
  }),
}));

const originalAudio = globalThis.Audio;
beforeEach(() => {
  jest.useFakeTimers();
  mockPcmElements.length = 0;
  mockMediaElements.length = 0;
  (ClockedWavSource as unknown as jest.Mock).mockClear();
  Object.defineProperty(globalThis, "Audio", {
    configurable: true,
    writable: true,
    value: jest.fn(() => {
      const element = new MockElement();
      mockMediaElements.push(element);
      return element;
    }),
  });
});
afterEach(() => {
  jest.useRealTimers();
  Object.defineProperty(globalThis, "Audio", {
    configurable: true,
    writable: true,
    value: originalAudio,
  });
});
function setup(enableFlac = false) {
  const context = {
    sampleRate: 48000,
    currentTime: 0,
    resume: jest.fn(async () => {}),
    createGain: jest.fn(mockNode),
    createMediaElementSource: jest.fn(mockNode),
  };
  const handlers = { ended: jest.fn(), error: jest.fn() };
  const player = new AdaptiveWebPlayback(
    context as unknown as AudioContext,
    {} as AudioNode,
    handlers,
    (work) => `https://review.test/${work.localPreviewFilename}`,
    true,
    enableFlac ? jest.fn(() => null) : undefined,
  );
  return { player, context, handlers };
}
async function settle() {
  for (let i = 0; i < 100; i++) await Promise.resolve();
}
function verifyFormats() {
  expect(
    mockPcmElements.every(
      (element) => !element.src || /\.wav$/i.test(element.src),
    ),
  ).toBe(true);
  expect(
    mockMediaElements.every(
      (element) => !element.src || /\.flac$/i.test(element.src),
    ),
  ).toBe(true);
}

function installClockedPcmMocks(context: { currentTime: number }) {
  return mockPcmElements.map((element) => {
    let offset = element.currentTime;
    let anchor: number | null = null;
    Object.defineProperty(element, "currentTime", {
      configurable: true,
      get: () =>
        offset +
        (element.paused || anchor === null
          ? 0
          : Math.max(0, context.currentTime - anchor)),
      set: (value: number) => {
        offset = value;
        anchor = null;
        element.dispatchEvent(new Event("seeked"));
      },
    });
    element.pause.mockImplementation(() => {
      offset = element.currentTime;
      anchor = null;
      element.paused = true;
    });
    const playAt = jest.fn(async (time: number) => {
      anchor = time;
      element.paused = false;
    });
    const prepareForPlayback = jest.fn(async () => undefined);
    Object.assign(element, { playAt, prepareForPlayback });
    return {
      element,
      playAt,
      prepareForPlayback,
      anchor: () => anchor,
    };
  });
}

function createClockedTransitionProgram() {
  const program = createListeningNatureProgram(
    getConsumerWork("distant-garden")!,
    "meditation",
    20,
    "rain",
  );
  const template = program.plan.segments.find((segment) => {
    const work = program.works.find(({ id }) => id === segment.workId);
    return (
      (segment.lane ?? "primary") === "primary" &&
      /\.wav$/i.test(work?.localPreviewFilename ?? "")
    );
  })!;
  const future = {
    ...template,
    index: Math.max(...program.plan.segments.map(({ index }) => index)) + 1,
    startFrame: 5 * 48_000,
    endFrame: 15 * 48_000,
    startSeconds: 5,
    endSeconds: 15,
    sourceEntrySeconds: 3,
    finalEnvelopeSeconds: 0,
  };
  return {
    future,
    program: {
      ...program,
      plan: {
        ...program.plan,
        segments: [...program.plan.segments, future],
      },
    },
  };
}

it("starts a future PCM source on the exact shared session anchor without preroll or drift", async () => {
  const { player, context, handlers } = setup();
  const { program, future } = createClockedTransitionProgram();
  await player.load(program);
  const clocks = installClockedPcmMocks(context);
  const work = program.works.find(({ id }) => id === future.workId)!;

  player.activateUserGesture();
  await player.start(program, 0.8);
  const futureClock = clocks.find(
    ({ element, playAt }) =>
      element.src.endsWith(work.localPreviewFilename!) &&
      playAt.mock.calls.length === 0,
  )!;
  const initialAnchors = clocks.flatMap(({ playAt }) =>
    playAt.mock.calls.map(([time]) => time as number),
  );
  expect(initialAnchors).toHaveLength(1);
  const sessionAnchor = initialAnchors[0]!;
  const expectedStart = sessionAnchor + future.startSeconds;
  expect(futureClock.playAt).not.toHaveBeenCalled();

  context.currentTime = expectedStart - 0.25;
  jest.advanceTimersByTime(future.startSeconds * 1000);
  await settle();

  expect(futureClock.playAt).toHaveBeenCalledTimes(1);
  expect(futureClock.playAt).toHaveBeenCalledWith(expectedStart);
  expect(futureClock.element.play).not.toHaveBeenCalled();
  expect(futureClock.anchor()).toBe(expectedStart);
  expect(futureClock.element.currentTime).toBeCloseTo(
    future.sourceEntrySeconds,
    9,
  );

  context.currentTime = expectedStart + 0.4;
  expect(
    futureClock.element.currentTime - future.sourceEntrySeconds,
  ).toBeCloseTo(player.positionSeconds() - future.startSeconds, 9);
  expect(handlers.error).not.toHaveBeenCalled();
  await player.dispose();
});

it("cannot revive an ahead-of-time PCM activation after pause invalidates its revision", async () => {
  const { player, context, handlers } = setup();
  const { program, future } = createClockedTransitionProgram();
  await player.load(program);
  const clocks = installClockedPcmMocks(context);
  const work = program.works.find(({ id }) => id === future.workId)!;

  player.activateUserGesture();
  await player.start(program, 0.8);
  const futureClock = clocks.find(
    ({ element, playAt }) =>
      element.src.endsWith(work.localPreviewFilename!) &&
      playAt.mock.calls.length === 0,
  )!;
  let releasePreparation!: () => void;
  Object.assign(futureClock.element, {
    prepareForPlayback: jest.fn(
      () =>
        new Promise<void>((resolve) => {
          releasePreparation = resolve;
        }),
    ),
  });
  const initialAnchors = clocks.flatMap(({ playAt }) =>
    playAt.mock.calls.map(([time]) => time as number),
  );
  expect(initialAnchors).toHaveLength(1);
  const sessionAnchor = initialAnchors[0]!;
  context.currentTime = sessionAnchor + future.startSeconds - 0.25;
  jest.advanceTimersByTime(future.startSeconds * 1000);
  await settle();
  expect(releasePreparation).toBeDefined();

  await player.pause();
  releasePreparation();
  await settle();
  expect(futureClock.playAt).not.toHaveBeenCalled();
  expect(futureClock.element.paused).toBe(true);
  expect(handlers.error).not.toHaveBeenCalled();

  Object.assign(futureClock.element, {
    prepareForPlayback: jest.fn(async () => undefined),
  });
  await player.resume();
  expect(futureClock.playAt).not.toHaveBeenCalled();
  expect(handlers.error).not.toHaveBeenCalled();
  await player.dispose();
});

it("does not put a future PCM deck into the resume snapshot after playAt was scheduled", async () => {
  const { player, context, handlers } = setup();
  const { program, future } = createClockedTransitionProgram();
  await player.load(program);
  const clocks = installClockedPcmMocks(context);
  const work = program.works.find(({ id }) => id === future.workId)!;

  player.activateUserGesture();
  await player.start(program, 0.8);
  const futureClock = clocks.find(
    ({ element, playAt }) =>
      element.src.endsWith(work.localPreviewFilename!) &&
      playAt.mock.calls.length === 0,
  )!;
  const initialAnchor = clocks.flatMap(({ playAt }) =>
    playAt.mock.calls.map(([time]) => time as number),
  )[0]!;
  const firstFutureAnchor = initialAnchor + future.startSeconds;
  context.currentTime = firstFutureAnchor - 0.25;
  jest.advanceTimersByTime(future.startSeconds * 1000);
  await settle();
  expect(futureClock.playAt).toHaveBeenLastCalledWith(firstFutureAnchor);
  expect(futureClock.playAt).toHaveBeenCalledTimes(1);

  await player.pause();
  const pausedPosition = player.positionSeconds();
  await player.resume();
  // Resume starts only sources active at pausedPosition. Merely having a
  // future AudioBufferSourceNode scheduled must not make this deck active.
  expect(futureClock.playAt).toHaveBeenCalledTimes(1);

  const resumedAnchor = context.currentTime + 0.06;
  jest.advanceTimersByTime(0);
  await settle();
  expect(futureClock.playAt).toHaveBeenCalledTimes(2);
  expect(futureClock.playAt).toHaveBeenLastCalledWith(
    resumedAnchor + future.startSeconds - pausedPosition,
  );
  expect(futureClock.element.currentTime).toBeCloseTo(
    future.sourceEntrySeconds,
    9,
  );
  expect(handlers.error).not.toHaveBeenCalled();
  await player.dispose();
});

it("uses one shared PCM/session anchor through repeated pause and resume, after preparation latency", async () => {
  const { player, context } = setup();
  const program = createListeningNatureProgram(
    getConsumerWork("distant-garden")!,
    "meditation",
    20,
    "rain",
  );
  await player.load(program);
  const pcm = mockPcmElements[0]!;
  for (const media of mockMediaElements) {
    let mediaOffset = media.currentTime,
      mediaAnchor = context.currentTime;
    Object.defineProperty(media, "currentTime", {
      get: () =>
        mediaOffset +
        (media.paused ? 0 : Math.max(0, context.currentTime - mediaAnchor)),
      set: (value: number) => {
        mediaOffset = value;
        mediaAnchor = context.currentTime;
        media.dispatchEvent(new Event("seeked"));
      },
    });
    media.pause.mockImplementation(() => {
      mediaOffset = media.currentTime;
      media.paused = true;
    });
    media.play.mockImplementation(async () => {
      if (media.paused) mediaAnchor = context.currentTime;
      media.paused = false;
    });
  }
  let anchor = 0,
    offset = 0;
  Object.defineProperty(pcm, "currentTime", {
    get: () =>
      offset + (pcm.paused ? 0 : Math.max(0, context.currentTime - anchor)),
    set: (value: number) => {
      offset = value;
      pcm.dispatchEvent(new Event("seeked"));
    },
  });
  pcm.pause.mockImplementation(() => {
    offset = pcm.currentTime;
    pcm.paused = true;
  });
  const playAt = jest.fn(async (time: number) => {
    anchor = time;
    pcm.paused = false;
  });
  Object.assign(pcm, {
    playAt,
    prepareForPlayback: async () => {
      expect(context.createGain.mock.results[0].value.gain.value).toBe(0);
      context.currentTime += 0.2;
    },
  });
  player.activateUserGesture();
  await player.start(program, 0.8);
  expect(playAt).toHaveBeenLastCalledWith(0.26);
  expect(pcm.play).not.toHaveBeenCalled();
  expect(player.positionSeconds()).toBe(0);
  expect(mockMediaElements[0].currentTime).toBe(0); // No 200ms preroll retained.
  for (let iteration = 0; iteration < 3; iteration++) {
    context.currentTime = anchor + 2;
    expect(player.positionSeconds()).toBeCloseTo(pcm.currentTime, 9);
    // The legacy HTML path cannot share the sample clock, but its preparation
    // delay must not accumulate. FLAC clocked adoption remains a separate gate.
    expect(
      Math.abs(mockMediaElements[0].currentTime - player.positionSeconds()),
    ).toBeLessThan(0.061);
    await player.pause();
    const saved = pcm.currentTime;
    await player.resume();
    expect(pcm.currentTime).toBe(saved);
    expect(player.positionSeconds()).toBe(saved);
  }
  await player.dispose();
});

it("pause cancels a start still waiting for PCM preparation and never opens the bus afterwards", async () => {
  const { player } = setup();
  const program = createListeningNatureProgram(
    getConsumerWork("distant-garden")!,
    "meditation",
    20,
    "rain",
  );
  await player.load(program);
  const pcm = mockPcmElements[0]!;
  let release!: () => void;
  const playAt = jest.fn(async () => {
    pcm.paused = false;
  });
  Object.assign(pcm, {
    playAt,
    prepareForPlayback: () =>
      new Promise<void>((resolve) => {
        release = resolve;
      }),
  });
  player.activateUserGesture();
  const starting = player.start(program, 0.8),
    rejected = expect(starting).rejects.toThrow(/superseded/);
  await settle();
  expect(release).toBeDefined();
  await player.pause();
  release();
  await rejected;
  expect(playAt).not.toHaveBeenCalled();
  expect(
    [...mockPcmElements, ...mockMediaElements].every(
      (element) => element.paused,
    ),
  ).toBe(true);
  expect(player.positionSeconds()).toBe(0);
  await player.dispose();
});

it.each(["rain", "sea"] as const)(
  "keeps single WAV music clocked when adding %s FLAC ambience",
  async (family) => {
    const { player, context } = setup();
    const program = createListeningNatureProgram(
      getConsumerWork("distant-garden")!,
      "meditation",
      20,
      family,
    );
    await player.load(program);
    expect(mockPcmElements).toHaveLength(1);
    expect(mockMediaElements).toHaveLength(2);
    expect(context.createMediaElementSource).toHaveBeenCalledTimes(2);
    verifyFormats();
    player.activateUserGesture();
    await player.start(program, 0.8);
    expect(
      [...mockPcmElements, ...mockMediaElements].every(
        (element) => element.play.mock.calls.length > 0,
      ),
    ).toBe(true);
    await player.pause();
    await player.seek(program.plan.transitions[0].startSeconds + 30);
    player.activateUserGesture();
    await player.resume();
    expect(mockPcmElements.some((element) => !element.paused)).toBe(true);
    expect(mockMediaElements.some((element) => !element.paused)).toBe(true);
    verifyFormats();
    expect(mockPcmElements).toHaveLength(1);
    expect(mockMediaElements).toHaveLength(2);
    await player.dispose();
  },
);

it.each([
  ["rain", 60],
  ["sea", 60],
  ["rain", 90],
  ["sea", 90],
] as const)(
  "uses only four PCM decks through every Hatha+%s join at %i minutes when the PWA FLAC factory is enabled",
  async (family, durationMinutes) => {
    const { player, context, handlers } = setup(true);
    const program = createWholeFileReviewProgram({
      outcome: "yoga",
      durationMinutes,
      mode: "sound-only",
      soundKind: "music",
      seed: "all-clocked-hatha",
      natureFamily: family,
      includeNatureBed: true,
    });
    await player.load(program);
    expect(mockPcmElements).toHaveLength(4);
    expect(mockMediaElements).toHaveLength(0);
    expect(context.createMediaElementSource).not.toHaveBeenCalled();
    const clocks = installClockedPcmMocks(context);
    player.activateUserGesture();
    await player.start(program, 0.8);
    await player.pause();
    for (const transition of program.plan.transitions) {
      await player.seek(transition.startSeconds + 1);
      player.activateUserGesture();
      await player.resume();
      const active = clocks.filter(({ element }) => !element.paused);
      expect(active.some(({ element }) => element.src.endsWith(".wav"))).toBe(
        true,
      );
      expect(active.some(({ element }) => element.src.endsWith(".flac"))).toBe(
        true,
      );
      expect(new Set(active.map(({ anchor }) => anchor())).size).toBe(1);
      await player.pause();
    }
    for (const point of reviewMarkers(program).filter(
      (m) => m.kind === "loop" && m.lane === "primary",
    )) {
      for (const position of [point.seconds - 0.01, point.seconds + 0.01]) {
        await player.seek(position);
        player.activateUserGesture();
        await player.resume();
        expect(player.positionSeconds()).toBeCloseTo(position, 3);
        await player.pause();
      }
    }
    await player.stop(true);
    player.activateUserGesture();
    await player.start(program, 0.8);
    expect(player.positionSeconds()).toBe(0);
    expect(mockPcmElements).toHaveLength(4);
    expect(handlers.error).not.toHaveBeenCalled();
    await player.dispose();
  },
);

it("uses two reusable PCM and two media decks through every Hatha+rain join and replay", async () => {
  const { player, context, handlers } = setup();
  const program = createWholeFileReviewProgram({
    outcome: "yoga",
    durationMinutes: 60,
    mode: "sound-only",
    soundKind: "music",
    seed: "mixed-all-eight",
    natureFamily: "rain",
    includeNatureBed: true,
  });
  await player.load(program);
  expect(mockPcmElements).toHaveLength(2);
  expect(mockMediaElements).toHaveLength(2);
  verifyFormats();
  player.activateUserGesture();
  await player.start(program, 0.8);
  await player.pause();
  for (const transition of program.plan.transitions) {
    await player.seek(transition.startSeconds + 1);
    player.activateUserGesture();
    await player.resume();
    expect(mockPcmElements.some((element) => !element.paused)).toBe(true);
    expect(mockMediaElements.some((element) => !element.paused)).toBe(true);
    await player.pause();
    verifyFormats();
  }
  await player.stop(true);
  player.activateUserGesture();
  await player.start(program, 0.8);
  expect(mockPcmElements).toHaveLength(2);
  expect(mockMediaElements).toHaveLength(2);
  expect(context.createMediaElementSource).toHaveBeenCalledTimes(2);
  expect(handlers.error).not.toHaveBeenCalled();
  await player.dispose();
});

it("rejects a stale gesture instead of reporting playing on freshly paused mixed decks", async () => {
  const { player } = setup();
  const program = createListeningNatureProgram(
    getConsumerWork("distant-garden")!,
    "meditation",
    20,
    "rain",
  );
  await player.load(program);
  player.activateUserGesture();
  await settle();
  await expect(player.start(program, 0.8, 120)).rejects.toThrow(
    "The session position changed after Play",
  );
  expect(
    [...mockPcmElements, ...mockMediaElements].every(
      (element) => element.paused,
    ),
  ).toBe(true);
  await player.dispose();
});

it("starts at a nonzero position when seek is prepared before the gesture", async () => {
  const { player, context } = setup();
  const program = createListeningNatureProgram(
    getConsumerWork("distant-garden")!,
    "meditation",
    20,
    "rain",
  );
  await player.load(program);
  await player.seek(120);
  player.activateUserGesture();
  await player.start(program, 0.8, 120);
  context.currentTime = 1;
  expect(player.positionSeconds()).toBe(121);
  expect(mockPcmElements.some((element) => !element.paused)).toBe(true);
  expect(mockMediaElements.some((element) => !element.paused)).toBe(true);
  await player.dispose();
});

it("preloads the next Hatha WAV even while a later nature FLAC is already reserved", async () => {
  const { player, context, handlers } = setup();
  const program = createWholeFileReviewProgram({
    outcome: "yoga",
    durationMinutes: 60,
    mode: "sound-only",
    soundKind: "music",
    seed: "mixed-next-source",
    natureFamily: "rain",
    includeNatureBed: true,
  });
  const music = program.plan.segments.filter(
    (segment) => segment.lane === "primary",
  );
  await player.load(program);
  player.activateUserGesture();
  await player.start(program, 0.8);
  const firstEnd = music[0].endSeconds;
  const boundaries = [
    ...new Set(
      program.plan.segments.flatMap((segment) => [
        segment.startSeconds,
        segment.endSeconds,
      ]),
    ),
  ]
    .filter((time) => time > 0 && time <= firstEnd)
    .sort((a, b) => a - b);
  let previous = 0;
  for (const time of boundaries) {
    context.currentTime = time;
    jest.advanceTimersByTime((time - previous) * 1000);
    await settle();
    previous = time;
  }
  const third = program.works.find((work) => work.id === music[2].workId)!;
  expect(
    mockPcmElements.some((element) =>
      element.src.endsWith(third.localPreviewFilename!),
    ),
  ).toBe(true);
  expect(mockMediaElements.filter((element) => element.src)).toHaveLength(2);
  expect(handlers.error).not.toHaveBeenCalled();
  verifyFormats();
  await player.dispose();
});
