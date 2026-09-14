import type { ConsumerSelection } from "@/domain/audio/consumerSelection";
import type { SessionListener, SessionSnapshot } from "@/domain/audio/types";

/** UI boundary double: preparation is silent; tests publish active state explicitly. */
export function createConsumerAudioMock() {
  let active: ConsumerSelection | null = null;
  let run = 0;
  const listeners = new Set<SessionListener>();
  const state = {
    snapshot: {
      mode: "consumer",
      status: "idle",
      presetId: null,
      workId: null,
      sessionPlanId: null,
      title: null,
      error: null,
      volume: 0.8,
      natureMixLevel: null,
      selectedDurationMinutes: 30,
      remainingMs: 30 * 60_000,
      deadlineMs: null,
      sources: {},
      capabilities: {
        backgroundPlayback: false,
        notificationControls: false,
        preciseSharedClock: false,
        realtimeSynthesis: false,
      },
      hydrated: true,
    } as SessionSnapshot,
    controller: {
      prepareSelection: jest.fn(
        async (_selection: ConsumerSelection): Promise<void> => undefined,
      ),
      cancelPreparedSelection: jest.fn(
        (_selection: ConsumerSelection) => undefined,
      ),
      startSelectionFromUserGesture: jest.fn(
        async (_selection: ConsumerSelection): Promise<void> => undefined,
      ),
      getConsumerSelection: jest.fn(() => active),
      getSnapshot: () => state.snapshot,
      getReviewReadMetrics: jest.fn(() => null),
      getListeningRun: () => run,
      subscribe: jest.fn((listener: SessionListener) => {
        listeners.add(listener);
        return () => listeners.delete(listener);
      }),
      // Legacy entry points prove navigation does not load or autoplay.
      loadProgram: jest.fn(async () => undefined),
      loadAdaptiveSession: jest.fn(async () => undefined),
      play: jest.fn(async () => undefined),
      playFromUserGesture: jest.fn(async () => undefined),
      pause: jest.fn(async () => undefined),
      prepareReviewSeek: jest.fn(
        async (_position: number, _signal: AbortSignal) => false,
      ),
      stop: jest.fn(async () => undefined),
      setTimer: jest.fn(async (_minutes: number) => undefined),
      setVolume: jest.fn(async (_volume: number) => undefined),
      setNatureMixLevel: jest.fn(async (_level: number) => undefined),
    },
    setActive(selection: ConsumerSelection | null, listeningRun = 1) {
      active = selection;
      run = listeningRun;
    },
    publish(patch: Partial<SessionSnapshot>) {
      state.snapshot = { ...state.snapshot, ...patch };
      listeners.forEach((listener) => listener(state.snapshot));
    },
  };
  return state;
}

export function deferred<T = void>() {
  let resolve!: (value: T | PromiseLike<T>) => void;
  let reject!: (reason: unknown) => void;
  const promise = new Promise<T>((yes, no) => {
    resolve = yes;
    reject = no;
  });
  return { promise, resolve, reject };
}
