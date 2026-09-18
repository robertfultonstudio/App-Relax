import { AdaptiveWebPlayback } from "@/audio/web/AdaptiveWebPlayback";
import { createQaPairProgram } from "@/qa/qaCatalog";
import { createWholeFileReviewProgram } from "@/pwa-review/createWholeFileReviewProgram";
import type { WebAudioSourceLease } from "@/audio/web/WebAudioSourceResolver";

class FakeMediaElement {
  error: { code: number; message: string } | null = null;
  readonly listeners = new Map<string, Set<EventListener>>();
  readonly pause = jest.fn();
  readonly play = jest.fn(async () => {});
  readonly load = jest.fn();
  readyState = 1;
  seeking = false;
  src = "";
  private position = 0;

  get currentTime(): number {
    return this.position;
  }

  set currentTime(value: number) {
    this.position = value;
    this.seeking = true;
  }

  addEventListener(type: string, listener: EventListener): void {
    const listeners = this.listeners.get(type) ?? new Set<EventListener>();
    listeners.add(listener);
    this.listeners.set(type, listeners);
  }

  removeEventListener(type: string, listener: EventListener): void {
    this.listeners.get(type)?.delete(listener);
  }

  removeAttribute(name: string): void {
    if (name === "src") this.src = "";
  }

  emit(type: string): void {
    if (type === "seeked") this.seeking = false;
    for (const listener of [...(this.listeners.get(type) ?? [])]) {
      listener(new Event(type));
    }
  }
}

function audioParam() {
  return {
    value: 1,
    cancelScheduledValues: jest.fn(),
    linearRampToValueAtTime: jest.fn(),
    setValueAtTime: jest.fn(),
    setValueCurveAtTime: jest.fn(),
  };
}

async function until(predicate: () => boolean) {
  for (let attempt = 0; attempt < 200 && !predicate(); attempt += 1)
    await Promise.resolve();
  expect(predicate()).toBe(true);
}

describe("AdaptiveWebPlayback verified source leases", () => {
  const originalAudio = globalThis.Audio;
  const elements: FakeMediaElement[] = [];
  const program = () =>
    createQaPairProgram({
      outgoingWorkId: "distant-garden",
      incomingWorkId: "luminous-grain",
      outcome: "meditation",
      durationMinutes: 20,
      crossfadeSeconds: 180,
      curve: "equal-power",
      natureFamily: "sea",
    });
  const create = (
    resolver: ConstructorParameters<typeof AdaptiveWebPlayback>[3],
  ) => {
    const context = {
      currentTime: 0,
      resume: jest.fn(async () => {}),
      createGain: () => ({
        connect: jest.fn(),
        disconnect: jest.fn(),
        gain: audioParam(),
      }),
      createMediaElementSource: () => ({
        connect: jest.fn(),
        disconnect: jest.fn(),
      }),
    } as unknown as AudioContext;
    return new AdaptiveWebPlayback(
      context,
      {} as AudioNode,
      { ended: jest.fn(), error: jest.fn() },
      resolver,
    );
  };

  beforeEach(() => {
    elements.length = 0;
    Object.defineProperty(globalThis, "Audio", {
      configurable: true,
      writable: true,
      value: jest.fn(() => {
        const element = new FakeMediaElement();
        elements.push(element);
        return element;
      }),
    });
  });
  afterEach(() => {
    Object.defineProperty(globalThis, "Audio", {
      configurable: true,
      writable: true,
      value: originalAudio,
    });
  });

  it("acquires each unique work once, retains leases on Stop and releases once on dispose", async () => {
    const releases: jest.Mock[] = [];
    const acquire = jest.fn(async (work) => {
      const release = jest.fn();
      releases.push(release);
      return { uri: `blob:${work.id}`, release };
    });
    const playback = create(acquire);
    const selected = program();
    await playback.load(selected);
    expect(acquire).toHaveBeenCalledTimes(
      new Set(selected.plan.segments.map(({ workId }) => workId)).size,
    );
    await playback.stop(true);
    expect(releases.every((release) => release.mock.calls.length === 0)).toBe(
      true,
    );
    await playback.dispose();
    await playback.dispose();
    expect(releases.every((release) => release.mock.calls.length === 1)).toBe(
      true,
    );
  });
  it("prepares Hatha 60 plus six nature recordings with fourteen leases but only four decks", async () => {
    const acquire = jest.fn(async (work) => ({
      uri: `blob:${work.id}`,
      release: jest.fn(),
    }));
    const playback = create(acquire);
    const selected = createWholeFileReviewProgram({
      outcome: "yoga",
      durationMinutes: 60,
      mode: "sound-only",
      soundKind: "music",
      seed: "all-eight",
      natureFamily: "rain",
      includeNatureBed: true,
    });
    expect(selected.works).toHaveLength(14);
    await playback.load(selected);
    expect(acquire).toHaveBeenCalledTimes(14);
    expect(elements.length).toBeLessThanOrEqual(4);
    await playback.dispose();
  });

  it("honours Stop even before the first source acquisition microtask", async () => {
    const acquire = jest.fn(async () => ({
      uri: "blob:unexpected",
      release: jest.fn(),
    }));
    const playback = create(acquire);
    const loading = playback.load(program());
    const cancelled = expect(loading).rejects.toThrow(/superseded/);
    await playback.stop();
    await cancelled;
    expect(acquire).not.toHaveBeenCalled();
    expect(elements).toHaveLength(0);
    await playback.dispose();
  });

  it("cancels a pending acquire promptly and releases its late lease without constructing decks", async () => {
    let complete: (lease: WebAudioSourceLease) => void = () => {};
    const pending = new Promise<WebAudioSourceLease>((resolve) => {
      complete = resolve;
    });
    const acquire = jest.fn(() => pending);
    const playback = create(acquire);
    const loading = playback.load(program());
    const rejected = expect(loading).rejects.toThrow(/cancelled|superseded/);
    await until(() => acquire.mock.calls.length === 1);
    await playback.dispose();
    await rejected;
    expect(elements).toHaveLength(0);
    const release = jest.fn();
    complete({ uri: "blob:late", release });
    await until(() => release.mock.calls.length === 1);
  });

  it("releases a partially acquired plan after failure and reacquires on Retry", async () => {
    const firstRelease = jest.fn();
    const acquire = jest
      .fn(async (work) => ({ uri: `blob:${work.id}`, release: jest.fn() }))
      .mockResolvedValueOnce({ uri: "blob:first", release: firstRelease })
      .mockRejectedValueOnce(new Error("Integrity mismatch"));
    const playback = create(acquire);
    const selected = program();
    await expect(playback.load(selected)).rejects.toThrow("Integrity mismatch");
    expect(firstRelease).toHaveBeenCalledTimes(1);
    expect(elements).toHaveLength(0);
    await playback.load(selected);
    expect(elements).toHaveLength(4);
    await playback.dispose();
  });

  it("cancels pending metadata on a superseded plan without disposing the replacement", async () => {
    const releases: jest.Mock[] = [];
    const acquire = jest.fn(async (work) => {
      const release = jest.fn();
      releases.push(release);
      return { uri: `blob:${work.id}`, release };
    });
    const playback = create(acquire);
    const selected = program();
    (globalThis.Audio as jest.Mock).mockImplementationOnce(() => {
      const element = new FakeMediaElement();
      element.readyState = 0;
      elements.push(element);
      return element;
    });
    const first = playback.load(selected);
    const cancelled = expect(first).rejects.toThrow(/superseded/);
    await until(() => elements.length === 4);
    const second = playback.load({
      ...selected,
      plan: { ...selected.plan, id: `${selected.plan.id}-replacement` },
    });
    await cancelled;
    await second;
    expect(elements).toHaveLength(8);
    expect(
      [...elements[0]!.listeners.values()].every(
        (listeners) => listeners.size === 0,
      ),
    ).toBe(true);
    const uniqueCount = new Set(
      selected.plan.segments.map(({ workId }) => workId),
    ).size;
    expect(
      releases
        .slice(0, uniqueCount)
        .every((release) => release.mock.calls.length === 1),
    ).toBe(true);
    expect(
      releases
        .slice(uniqueCount)
        .every((release) => release.mock.calls.length === 0),
    ).toBe(true);
    await playback.dispose();
  });

  it("Stop interrupts a never-confirmed gesture immediately and retains replay leases", async () => {
    const releases: jest.Mock[] = [];
    const playback = create(async (work) => {
      const release = jest.fn();
      releases.push(release);
      return { uri: `blob:${work.id}`, release };
    });
    const selected = program();
    await playback.load(selected);
    elements.forEach(({ play }) =>
      play.mockImplementation(() => new Promise(() => {})),
    );
    playback.activateUserGesture();
    const starting = playback.start(selected, 0.8);
    const cancelled = expect(starting).rejects.toThrow(/superseded/);
    await Promise.resolve();
    await Promise.resolve();
    await playback.stop(true);
    await cancelled;
    expect(releases.every((release) => release.mock.calls.length === 0)).toBe(
      true,
    );
    await playback.dispose();
  });
});

describe("AdaptiveWebPlayback seeking", () => {
  const originalAudio = globalThis.Audio;

  afterEach(() => {
    Object.defineProperty(globalThis, "Audio", {
      configurable: true,
      value: originalAudio,
      writable: true,
    });
  });

  it("creates four reusable decks and unlocks them synchronously", async () => {
    const elements: FakeMediaElement[] = [];
    Object.defineProperty(globalThis, "Audio", {
      configurable: true,
      value: jest.fn(() => {
        const element = new FakeMediaElement();
        elements.push(element);
        return element;
      }),
      writable: true,
    });
    const context = {
      currentTime: 0,
      resume: jest.fn(async () => {}),
      createGain: jest.fn(() => ({
        connect: jest.fn(),
        disconnect: jest.fn(),
        gain: audioParam(),
      })),
      createMediaElementSource: jest.fn(() => ({
        connect: jest.fn(),
        disconnect: jest.fn(),
      })),
    } as unknown as AudioContext;
    const program = createQaPairProgram({
      outgoingWorkId: "distant-garden",
      incomingWorkId: "luminous-grain",
      outcome: "meditation",
      durationMinutes: 20,
      crossfadeSeconds: 180,
      curve: "equal-power",
      natureFamily: "sea",
    });
    const playback = new AdaptiveWebPlayback(context, {} as AudioNode, {
      ended: jest.fn(),
      error: jest.fn(),
    });

    await playback.load(program);
    expect(elements).toHaveLength(4);
    expect(context.createMediaElementSource).toHaveBeenCalledTimes(4);

    playback.activateUserGesture();
    expect(
      elements.every((element) => element.play.mock.calls.length === 1),
    ).toBe(true);

    await playback.start(program, 0.8, 0);
    await Promise.resolve();
    expect(elements).toHaveLength(4);
    expect(elements.length).toBeLessThanOrEqual(program.plan.segments.length);
    const loads = elements.map(({ load }) => load.mock.calls.length);
    const pauses = elements.map(({ pause }) => pause.mock.calls.length);
    const plays = elements.map(({ play }) => play.mock.calls.length);
    await playback.configureAudition(null);
    expect(elements.map(({ load }) => load.mock.calls.length)).toEqual(loads);
    expect(elements.map(({ pause }) => pause.mock.calls.length)).toEqual(
      pauses,
    );
    expect(elements.map(({ play }) => play.mock.calls.length)).toEqual(plays);
    await playback.stop();
  });

  it("confirms the direct-gesture Play before pausing future decks", async () => {
    const elements: FakeMediaElement[] = [];
    let confirmPlayback: () => void = () => undefined;
    const confirmed = new Promise<void>((resolve) => {
      confirmPlayback = resolve;
    });
    Object.defineProperty(globalThis, "Audio", {
      configurable: true,
      value: jest.fn(() => {
        const element = new FakeMediaElement();
        element.play.mockImplementation(() => confirmed);
        elements.push(element);
        return element;
      }),
      writable: true,
    });
    const context = {
      currentTime: 0,
      resume: jest.fn(async () => {}),
      createGain: jest.fn(() => ({
        connect: jest.fn(),
        disconnect: jest.fn(),
        gain: audioParam(),
      })),
      createMediaElementSource: jest.fn(() => ({
        connect: jest.fn(),
        disconnect: jest.fn(),
      })),
    } as unknown as AudioContext;
    const program = createQaPairProgram({
      outgoingWorkId: "distant-garden",
      incomingWorkId: "luminous-grain",
      outcome: "meditation",
      durationMinutes: 20,
      crossfadeSeconds: 180,
      curve: "equal-power",
      natureFamily: "sea",
    });
    const playback = new AdaptiveWebPlayback(context, {} as AudioNode, {
      ended: jest.fn(),
      error: jest.fn(),
    });

    await playback.load(program);
    const pausesBeforeGesture = elements.map(
      ({ pause }) => pause.mock.calls.length,
    );
    playback.activateUserGesture();
    const starting = playback.start(program, 0.8, 0);
    await Promise.resolve();
    await Promise.resolve();

    expect(elements.every(({ play }) => play.mock.calls.length === 1)).toBe(
      true,
    );
    expect(elements.map(({ pause }) => pause.mock.calls.length)).toEqual(
      pausesBeforeGesture,
    );

    confirmPlayback();
    await starting;
    expect(
      elements.some(
        ({ pause }, index) =>
          pause.mock.calls.length > pausesBeforeGesture[index],
      ),
    ).toBe(true);
    await playback.stop();
  });

  it("fails closed when browser gesture confirmation never settles", async () => {
    jest.useFakeTimers();
    try {
      const elements: FakeMediaElement[] = [];
      const neverConfirms = new Promise<void>(() => undefined);
      Object.defineProperty(globalThis, "Audio", {
        configurable: true,
        value: jest.fn(() => {
          const element = new FakeMediaElement();
          if (elements.length === 3) {
            element.play.mockImplementation(() => neverConfirms);
          }
          elements.push(element);
          return element;
        }),
        writable: true,
      });
      const context = {
        currentTime: 0,
        resume: jest.fn(async () => {}),
        createGain: jest.fn(() => ({
          connect: jest.fn(),
          disconnect: jest.fn(),
          gain: audioParam(),
        })),
        createMediaElementSource: jest.fn(() => ({
          connect: jest.fn(),
          disconnect: jest.fn(),
        })),
      } as unknown as AudioContext;
      const program = createQaPairProgram({
        outgoingWorkId: "distant-garden",
        incomingWorkId: "luminous-grain",
        outcome: "meditation",
        durationMinutes: 20,
        crossfadeSeconds: 180,
        curve: "equal-power",
        natureFamily: "sea",
      });
      const playback = new AdaptiveWebPlayback(context, {} as AudioNode, {
        ended: jest.fn(),
        error: jest.fn(),
      });

      await playback.load(program);
      playback.activateUserGesture();
      const starting = playback.start(program, 0.8, 0);
      const rejected = expect(starting).rejects.toThrow(
        "The browser did not confirm session audio within 10 seconds.",
      );
      await jest.advanceTimersByTimeAsync(10_000);

      await rejected;
      expect(elements.every(({ pause }) => pause.mock.calls.length > 0)).toBe(
        true,
      );
      expect(jest.getTimerCount()).toBe(0);
    } finally {
      jest.useRealTimers();
    }
  });

  it("reports the exact work, lane and browser media error code", async () => {
    const elements: FakeMediaElement[] = [];
    Object.defineProperty(globalThis, "Audio", {
      configurable: true,
      value: jest.fn(() => {
        const element = new FakeMediaElement();
        if (elements.length === 0) element.readyState = 0;
        elements.push(element);
        return element;
      }),
      writable: true,
    });
    const context = {
      currentTime: 0,
      resume: jest.fn(async () => {}),
      createGain: jest.fn(() => ({
        connect: jest.fn(),
        disconnect: jest.fn(),
        gain: audioParam(),
      })),
      createMediaElementSource: jest.fn(() => ({
        connect: jest.fn(),
        disconnect: jest.fn(),
      })),
    } as unknown as AudioContext;
    const program = createQaPairProgram({
      outgoingWorkId: "distant-garden",
      incomingWorkId: "luminous-grain",
      outcome: "meditation",
      durationMinutes: 20,
      crossfadeSeconds: 180,
      curve: "equal-power",
      natureFamily: "sea",
    });
    const playback = new AdaptiveWebPlayback(context, {} as AudioNode, {
      ended: jest.fn(),
      error: jest.fn(),
    });

    const loading = playback.load(program);
    for (let index = 0; index < 200 && elements.length < 4; index += 1)
      await Promise.resolve();
    expect(elements).toHaveLength(4);
    elements[0].error = { code: 4, message: "format rejected" };
    elements[0].emit("error");

    await expect(loading).rejects.toThrow(
      "Distant Garden failed to load (primary source 0; source not supported 4; format rejected).",
    );
    expect(elements.every(({ pause }) => pause.mock.calls.length > 0)).toBe(
      true,
    );
    await playback.stop();
  });

  it("cancels pending metadata work without leaving listeners or timeouts", async () => {
    const elements: FakeMediaElement[] = [];
    Object.defineProperty(globalThis, "Audio", {
      configurable: true,
      value: jest.fn(() => {
        const element = new FakeMediaElement();
        element.readyState = 0;
        elements.push(element);
        return element;
      }),
      writable: true,
    });
    const context = {
      currentTime: 0,
      resume: jest.fn(async () => {}),
      createGain: jest.fn(() => ({
        connect: jest.fn(),
        disconnect: jest.fn(),
        gain: audioParam(),
      })),
      createMediaElementSource: jest.fn(() => ({
        connect: jest.fn(),
        disconnect: jest.fn(),
      })),
    } as unknown as AudioContext;
    const program = createQaPairProgram({
      outgoingWorkId: "distant-garden",
      incomingWorkId: "luminous-grain",
      outcome: "meditation",
      durationMinutes: 20,
      crossfadeSeconds: 180,
      curve: "equal-power",
      natureFamily: "sea",
    });
    const playback = new AdaptiveWebPlayback(context, {} as AudioNode, {
      ended: jest.fn(),
      error: jest.fn(),
    });

    const loading = playback.load(program);
    const rejected = expect(loading).rejects.toThrow(
      "Adaptive media preparation was superseded.",
    );
    for (let index = 0; index < 200 && elements.length < 4; index += 1)
      await Promise.resolve();
    expect(elements).toHaveLength(4);
    await playback.stop();
    await rejected;
    expect(
      elements.every((element) =>
        [...element.listeners.values()].every(
          (listeners) => listeners.size === 0,
        ),
      ),
    ).toBe(true);
  });

  it("waits for every active file to confirm seeked before starting sound", async () => {
    const elements: FakeMediaElement[] = [];
    Object.defineProperty(globalThis, "Audio", {
      configurable: true,
      value: jest.fn(() => {
        const element = new FakeMediaElement();
        elements.push(element);
        return element;
      }),
      writable: true,
    });
    const context = {
      currentTime: 0,
      resume: jest.fn(async () => {}),
      createGain: jest.fn(() => ({
        connect: jest.fn(),
        disconnect: jest.fn(),
        gain: audioParam(),
      })),
      createMediaElementSource: jest.fn(() => ({
        connect: jest.fn(),
        disconnect: jest.fn(),
      })),
    } as unknown as AudioContext;
    const program = createQaPairProgram({
      outgoingWorkId: "field-sea-003-open-tide",
      incomingWorkId: "field-sea-001-tidal-breath",
      outcome: "meditation",
      durationMinutes: 20,
      crossfadeSeconds: 12,
      curve: "equal-power",
    });
    const transition = program.plan.transitions[0];
    const target = transition.startSeconds + 5;
    const playback = new AdaptiveWebPlayback(context, {} as AudioNode, {
      ended: jest.fn(),
      error: jest.fn(),
    });

    await playback.load(program);
    const deckCount = elements.length;
    const start = playback.start(program, 0.8, target);
    for (let index = 0; index < 12; index += 1) await Promise.resolve();

    const seeking = elements.slice(-4).filter((element) => element.seeking);
    try {
      expect(seeking).toHaveLength(2);
      expect(
        seeking.every((element) => element.play.mock.calls.length === 0),
      ).toBe(true);

      seeking[0].emit("seeked");
      for (let index = 0; index < 4; index += 1) await Promise.resolve();
      expect(
        seeking.every((element) => element.play.mock.calls.length === 0),
      ).toBe(true);

      seeking[1].emit("seeked");
      await start;
      expect(elements).toHaveLength(deckCount);
      expect(
        seeking.every((element) => element.play.mock.calls.length === 1),
      ).toBe(true);
    } finally {
      for (const element of elements.filter((element) => element.seeking)) {
        element.emit("seeked");
      }
      await start.catch(() => undefined);
      await playback.stop();
    }
  });

  it("keeps every prepared file silent and cleans up when one seek fails", async () => {
    const elements: FakeMediaElement[] = [];
    Object.defineProperty(globalThis, "Audio", {
      configurable: true,
      value: jest.fn(() => {
        const element = new FakeMediaElement();
        elements.push(element);
        return element;
      }),
      writable: true,
    });
    const context = {
      currentTime: 0,
      resume: jest.fn(async () => {}),
      createGain: jest.fn(() => ({
        connect: jest.fn(),
        disconnect: jest.fn(),
        gain: audioParam(),
      })),
      createMediaElementSource: jest.fn(() => ({
        connect: jest.fn(),
        disconnect: jest.fn(),
      })),
    } as unknown as AudioContext;
    const program = createQaPairProgram({
      outgoingWorkId: "field-sea-003-open-tide",
      incomingWorkId: "field-sea-001-tidal-breath",
      outcome: "meditation",
      durationMinutes: 20,
      crossfadeSeconds: 12,
      curve: "equal-power",
    });
    const transition = program.plan.transitions[0];
    const playback = new AdaptiveWebPlayback(context, {} as AudioNode, {
      ended: jest.fn(),
      error: jest.fn(),
    });

    await playback.load(program);
    const start = playback.start(program, 0.8, transition.startSeconds + 5);
    for (let index = 0; index < 12; index += 1) await Promise.resolve();

    const seeking = elements.slice(-4).filter((element) => element.seeking);
    try {
      expect(seeking).toHaveLength(2);
      seeking[1].emit("error");
      for (let index = 0; index < 4; index += 1) await Promise.resolve();
      expect(elements.every(({ play }) => play.mock.calls.length === 0)).toBe(
        true,
      );
      seeking[0].emit("seeked");
      await expect(start).rejects.toThrow(
        "Audio could not reach the requested file position.",
      );
      expect(elements.every(({ play }) => play.mock.calls.length === 0)).toBe(
        true,
      );
      expect(seeking.every(({ pause }) => pause.mock.calls.length > 0)).toBe(
        true,
      );
    } finally {
      for (const element of elements.filter((element) => element.seeking)) {
        element.emit("seeked");
      }
      await start.catch(() => undefined);
      await playback.stop();
    }
  });

  it("routes music and nature through separate buses and changes ambience volume", async () => {
    const elements: FakeMediaElement[] = [];
    const gainNodes: {
      connect: jest.Mock;
      disconnect: jest.Mock;
      gain: ReturnType<typeof audioParam>;
    }[] = [];
    Object.defineProperty(globalThis, "Audio", {
      configurable: true,
      value: jest.fn(() => {
        const element = new FakeMediaElement();
        elements.push(element);
        return element;
      }),
      writable: true,
    });
    const context = {
      currentTime: 0,
      resume: jest.fn(async () => {}),
      createGain: jest.fn(() => {
        const node = {
          connect: jest.fn(),
          disconnect: jest.fn(),
          gain: audioParam(),
        };
        gainNodes.push(node);
        return node;
      }),
      createMediaElementSource: jest.fn(() => ({
        connect: jest.fn(),
        disconnect: jest.fn(),
      })),
    } as unknown as AudioContext;
    const program = createQaPairProgram({
      outgoingWorkId: "distant-garden",
      incomingWorkId: "luminous-grain",
      outcome: "meditation",
      durationMinutes: 20,
      crossfadeSeconds: 180,
      curve: "equal-power",
      natureFamily: "sea",
    });
    const playback = new AdaptiveWebPlayback(context, {} as AudioNode, {
      ended: jest.fn(),
      error: jest.fn(),
    });

    await playback.load(program);
    await playback.start(program, 0.8, 0);

    const primaryBus = gainNodes[1];
    const natureBus = gainNodes[2];
    playback.setNatureLevel(0.7, 1800);
    expect(primaryBus.gain.linearRampToValueAtTime).not.toHaveBeenCalled();
    expect(natureBus.gain.linearRampToValueAtTime).toHaveBeenCalledWith(
      0.35,
      1.8,
    );
    playback.setNatureLevel(0, 1800);
    expect(natureBus.gain.linearRampToValueAtTime).toHaveBeenLastCalledWith(
      0,
      1.8,
    );
    await playback.stop();
  });

  it("pauses without network preparation and reuses the same media elements", async () => {
    const elements: FakeMediaElement[] = [];
    Object.defineProperty(globalThis, "Audio", {
      configurable: true,
      value: jest.fn(() => {
        const element = new FakeMediaElement();
        elements.push(element);
        return element;
      }),
      writable: true,
    });
    const context = {
      currentTime: 0,
      resume: jest.fn(async () => {}),
      createGain: jest.fn(() => ({
        connect: jest.fn(),
        disconnect: jest.fn(),
        gain: audioParam(),
      })),
      createMediaElementSource: jest.fn(() => ({
        connect: jest.fn(),
        disconnect: jest.fn(),
      })),
    } as unknown as AudioContext;
    const program = createQaPairProgram({
      outgoingWorkId: "distant-garden",
      incomingWorkId: "luminous-grain",
      outcome: "meditation",
      durationMinutes: 20,
      crossfadeSeconds: 180,
      curve: "equal-power",
      natureFamily: "sea",
    });
    const playback = new AdaptiveWebPlayback(context, {} as AudioNode, {
      ended: jest.fn(),
      error: jest.fn(),
    });

    await playback.load(program);
    await playback.start(program, 0.8, 0);
    const loadsBeforePause = elements.reduce(
      (count, element) => count + element.load.mock.calls.length,
      0,
    );
    await playback.pause();
    expect(elements).toHaveLength(4);
    expect(
      elements.reduce(
        (count, element) => count + element.load.mock.calls.length,
        0,
      ),
    ).toBe(loadsBeforePause);

    playback.activateUserGesture();
    await playback.resume();
    expect(elements).toHaveLength(4);
    await playback.stop();
  });

  it("prepares Stop to replay from the next direct user gesture", async () => {
    const elements: FakeMediaElement[] = [];
    Object.defineProperty(globalThis, "Audio", {
      configurable: true,
      value: jest.fn(() => {
        const element = new FakeMediaElement();
        elements.push(element);
        return element;
      }),
      writable: true,
    });
    const context = {
      currentTime: 0,
      resume: jest.fn(async () => {}),
      createGain: jest.fn(() => ({
        connect: jest.fn(),
        disconnect: jest.fn(),
        gain: audioParam(),
      })),
      createMediaElementSource: jest.fn(() => ({
        connect: jest.fn(),
        disconnect: jest.fn(),
      })),
    } as unknown as AudioContext;
    const program = createQaPairProgram({
      outgoingWorkId: "distant-garden",
      incomingWorkId: "luminous-grain",
      outcome: "meditation",
      durationMinutes: 20,
      crossfadeSeconds: 180,
      curve: "equal-power",
      natureFamily: "sea",
    });
    const playback = new AdaptiveWebPlayback(context, {} as AudioNode, {
      ended: jest.fn(),
      error: jest.fn(),
    });

    await playback.load(program);
    playback.activateUserGesture();
    await playback.start(program, 0.8, 0);
    const loadsBeforeStop = elements.reduce(
      (count, element) => count + element.load.mock.calls.length,
      0,
    );
    await playback.stop(true);
    expect(
      elements.reduce(
        (count, element) => count + element.load.mock.calls.length,
        0,
      ),
    ).toBe(loadsBeforeStop);

    playback.activateUserGesture();
    const callsInsideGesture = elements.map(
      ({ play }) => play.mock.calls.length,
    );
    await playback.start(program, 0.8, 0);
    expect(elements.map(({ play }) => play.mock.calls.length)).toEqual(
      callsInsideGesture,
    );
    await playback.stop();
  });

  it("repositions a running session when seeking back to its original point", async () => {
    const elements: FakeMediaElement[] = [];
    const context = {
      currentTime: 0,
      resume: jest.fn(async () => {}),
      createGain: jest.fn(() => ({
        connect: jest.fn(),
        disconnect: jest.fn(),
        gain: audioParam(),
      })),
      createMediaElementSource: jest.fn(() => ({
        connect: jest.fn(),
        disconnect: jest.fn(),
      })),
    } as unknown as AudioContext;
    Object.defineProperty(globalThis, "Audio", {
      configurable: true,
      value: jest.fn(() => {
        const element = new FakeMediaElement();
        elements.push(element);
        return element;
      }),
      writable: true,
    });
    const program = createQaPairProgram({
      outgoingWorkId: "field-sea-003-open-tide",
      incomingWorkId: "field-sea-001-tidal-breath",
      outcome: "meditation",
      durationMinutes: 20,
      crossfadeSeconds: 12,
      curve: "equal-power",
    });
    const playback = new AdaptiveWebPlayback(context, {} as AudioNode, {
      ended: jest.fn(),
      error: jest.fn(),
    });

    await playback.load(program);
    await playback.start(program, 0.8, 0);
    (context as unknown as { currentTime: number }).currentTime = 10;
    for (const element of elements) {
      element.currentTime = 10;
      element.seeking = false;
    }

    const seek = playback.seek(0);
    for (let index = 0; index < 12; index += 1) await Promise.resolve();
    const repositioned = elements.filter((element) => element.seeking);
    expect(repositioned.length).toBeGreaterThan(0);
    for (const element of repositioned) element.emit("seeked");
    await seek;
    expect(repositioned.every(({ currentTime }) => currentTime === 0)).toBe(
      true,
    );
    await playback.stop();
  });
});
