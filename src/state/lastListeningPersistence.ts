import AsyncStorage from "@react-native-async-storage/async-storage";
import {
  getConsumerWork,
  isVisibleConsumerWork,
} from "@/content/consumerCatalog";
import type { ConsumerOutcomeId } from "@/content/productShell";
import { getSessionPolicy } from "@/content/sessionPolicies";
import type { SessionDurationMinutes } from "@/domain/sessions/types";
import {
  parseSavedSessionRequest,
  type SavedSessionRequest,
} from "./adaptiveSessionPersistence";
import type { StorageAdapter } from "./playerPersistence";

export type LastListening =
  | {
      kind: "single";
      workId: string;
      outcome: ConsumerOutcomeId;
      durationMinutes: SessionDurationMinutes;
    }
  | { kind: "adaptive"; request: SavedSessionRequest };

export const LAST_LISTENING_KEY = "@app-relax/last-listening";
const OUTCOMES: readonly ConsumerOutcomeId[] = [
  "meditation",
  "yoga",
  "massage",
  "relax",
  "sleep",
  "focus",
];

function validateListening(value: unknown): LastListening | null {
  if (!value || typeof value !== "object") return null;
  const candidate = value as Partial<LastListening>;
  if (candidate.kind === "adaptive") {
    const request = parseSavedSessionRequest(candidate.request);
    return request ? { kind: "adaptive", request } : null;
  }
  if (
    candidate.kind !== "single" ||
    typeof candidate.workId !== "string" ||
    !OUTCOMES.includes(candidate.outcome as ConsumerOutcomeId)
  )
    return null;
  const outcome = candidate.outcome as ConsumerOutcomeId;
  if (
    !getSessionPolicy(outcome).durations.includes(
      candidate.durationMinutes as SessionDurationMinutes,
    )
  )
    return null;
  const work = getConsumerWork(candidate.workId);
  if (
    !work ||
    !isVisibleConsumerWork(work) ||
    work.availability === "rejected-listening" ||
    work.listeningStatus === "REJECTED — REPLACEMENT REQUIRED"
  )
    return null;
  // The saved need is the user's context, not necessarily the work's primary need.
  return {
    kind: "single",
    workId: work.id,
    outcome,
    durationMinutes: candidate.durationMinutes as SessionDurationMinutes,
  };
}

export function parseLastListening(value: string): LastListening | null {
  try {
    const saved = JSON.parse(value) as {
      schemaVersion?: unknown;
      listening?: unknown;
    } | null;
    return saved?.schemaVersion === 1
      ? validateListening(saved.listening)
      : null;
  } catch {
    return null;
  }
}

const queues = new WeakMap<StorageAdapter, Promise<unknown>>();
export function createLastListeningStore(
  storage: StorageAdapter = AsyncStorage,
) {
  return {
    async load(): Promise<LastListening | null> {
      await queues.get(storage);
      const value = await storage.getItem(LAST_LISTENING_KEY);
      return value ? parseLastListening(value) : null;
    },
    save(value: LastListening): Promise<void> {
      const listening = validateListening(value);
      if (!listening)
        return Promise.reject(
          new Error("The last listening selection is invalid or unavailable."),
        );
      const operation = (queues.get(storage) ?? Promise.resolve()).then(() =>
        storage.setItem(
          LAST_LISTENING_KEY,
          JSON.stringify({ schemaVersion: 1, listening }),
        ),
      );
      queues.set(
        storage,
        operation.catch(() => undefined),
      );
      return operation;
    },
  };
}

const singleton = createLastListeningStore();
/** Call save only after the controller confirms that playback actually started. */
export const loadLastListening = () => singleton.load();
export const saveLastListening = (listening: LastListening) =>
  singleton.save(listening);
