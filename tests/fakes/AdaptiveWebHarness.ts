import { AdaptiveWebPlayback } from "@/audio/web/AdaptiveWebPlayback";

export class TechnicalMedia extends EventTarget {
  readyState = 4;
  seeking = false;
  src = "";
  error: { code: number; message: string } | null = null;
  paused = true;
  holdSeeks = 0;
  pendingPosition: number | null = null;
  private position = 0;
  get currentTime() {
    return this.position;
  }
  set currentTime(value: number) {
    if (this.holdSeeks > 0) {
      this.holdSeeks -= 1;
      this.seeking = true;
      this.pendingPosition = value;
      return;
    }
    this.position = value;
    this.dispatchEvent(new Event("seeked"));
  }
  completeSeek() {
    if (this.pendingPosition === null)
      throw new Error("No technical seek is pending");
    this.position = this.pendingPosition;
    this.pendingPosition = null;
    this.seeking = false;
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
function gainNode() {
  let intervals: { start: number; end: number }[] = [];
  return {
    connect: jest.fn(),
    disconnect: jest.fn(),
    gain: {
      value: 1,
      cancelScheduledValues: jest.fn((time: number) => {
        intervals = intervals.filter((i) => i.end < time);
      }),
      setValueAtTime: jest.fn(),
      linearRampToValueAtTime: jest.fn(),
      setValueCurveAtTime: jest.fn(
        (curve: Float32Array, when: number, duration: number) => {
          if (
            curve.length < 2 ||
            ![when, duration, ...curve].every(Number.isFinite) ||
            duration <= 0
          )
            throw new Error("Invalid technical AudioParam curve");
          if (
            intervals.some(
              (i) => when < i.end - 1e-9 && when + duration > i.start + 1e-9,
            )
          )
            throw new Error("Overlapping technical AudioParam curves");
          intervals.push({ start: when, end: when + duration });
        },
      ),
    },
  };
}
/** No network/decoder/device: records the real scheduler's Web Audio commands. */
export function adaptiveWebHarness() {
  const original = globalThis.Audio;
  const media: TechnicalMedia[] = [];
  Object.defineProperty(globalThis, "Audio", {
    configurable: true,
    writable: true,
    value: jest.fn(() => {
      const element = new TechnicalMedia();
      media.push(element);
      return element;
    }),
  });
  const gains: ReturnType<typeof gainNode>[] = [];
  const sources: {
    media: TechnicalMedia;
    connect: jest.Mock;
    disconnect: jest.Mock;
  }[] = [];
  const context = {
    get currentTime() {
      return Date.now() / 1000;
    },
    resume: jest.fn(async () => {}),
    createGain: () => {
      const gain = gainNode();
      gains.push(gain);
      return gain;
    },
    createMediaElementSource: (element: TechnicalMedia) => {
      const source = {
        media: element,
        connect: jest.fn(),
        disconnect: jest.fn(),
      };
      sources.push(source);
      return source;
    },
  };
  const releases: jest.Mock[] = [];
  const handlers = { ended: jest.fn(), error: jest.fn() };
  const resolver = jest.fn(async (work) => {
    const release = jest.fn();
    releases.push(release);
    return { uri: `fixture://${work.id}`, release };
  });
  const playback = new AdaptiveWebPlayback(
    context as unknown as AudioContext,
    {} as AudioNode,
    handlers,
    resolver,
  );
  const gainFor = (id: string) =>
    sources.find((source) => source.media.src === `fixture://${id}`)?.connect
      .mock.lastCall?.[0] as ReturnType<typeof gainNode> | undefined;
  return {
    playback,
    media,
    gains,
    sources,
    releases,
    handlers,
    resolver,
    gainFor,
    restore: () =>
      Object.defineProperty(globalThis, "Audio", {
        configurable: true,
        writable: true,
        value: original,
      }),
  };
}
