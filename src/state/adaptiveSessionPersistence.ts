import AsyncStorage from "@react-native-async-storage/async-storage";
import type { ConsumerOutcomeId } from "@/content/productShell";
import { getSessionPolicy } from "@/content/sessionPolicies";
import type {
  AdaptiveSessionPlan,
  SessionDurationMinutes,
} from "@/domain/sessions/types";
import type { StorageAdapter } from "./playerPersistence";

const STORAGE_KEY = "@app-relax/adaptive-session-history";

export interface SavedSessionRequest {
  outcome: ConsumerOutcomeId;
  durationMinutes: SessionDurationMinutes;
  mode: "sound-only";
}

export interface AdaptiveSessionHistory {
  schemaVersion: 1;
  lastRequest: SavedSessionRequest | null;
  recentSessions: readonly {
    outcome: ConsumerOutcomeId;
    workIds: readonly string[];
  }[];
}

export interface AdaptiveSessionHistoryStore {
  load(): Promise<AdaptiveSessionHistory>;
  recordStart(
    request: SavedSessionRequest,
    plan: AdaptiveSessionPlan,
  ): Promise<AdaptiveSessionHistory>;
}

const EMPTY_HISTORY: AdaptiveSessionHistory = {
  schemaVersion: 1,
  lastRequest: null,
  recentSessions: [],
};

const OUTCOMES: readonly ConsumerOutcomeId[] = [
  "meditation",
  "yoga",
  "massage",
  "relax",
  "sleep",
  "focus",
];
const DURATIONS = [10, 20, 30, 45, 60, 90] as const;

function isSavedRequest(value: unknown): value is SavedSessionRequest {
  if (!value || typeof value !== "object") return false;
  const candidate = value as Partial<SavedSessionRequest>;
  return (
    OUTCOMES.includes(candidate.outcome as ConsumerOutcomeId) &&
    DURATIONS.includes(candidate.durationMinutes as SessionDurationMinutes) &&
    getSessionPolicy(candidate.outcome as ConsumerOutcomeId).durations.includes(
      candidate.durationMinutes as SessionDurationMinutes,
    ) &&
    candidate.mode === "sound-only"
  );
}

export function parseAdaptiveSessionHistory(
  value: string,
): AdaptiveSessionHistory {
  try {
    const candidate = JSON.parse(value) as Partial<AdaptiveSessionHistory>;
    if (
      candidate.schemaVersion !== 1 ||
      (candidate.lastRequest !== null &&
        !isSavedRequest(candidate.lastRequest)) ||
      !Array.isArray(candidate.recentSessions)
    ) {
      return EMPTY_HISTORY;
    }
    const recentSessions = candidate.recentSessions
      .filter((entry) => {
        if (!entry || typeof entry !== "object") return false;
        const session = entry as { outcome?: unknown; workIds?: unknown };
        return (
          OUTCOMES.includes(session.outcome as ConsumerOutcomeId) &&
          Array.isArray(session.workIds) &&
          session.workIds.every((id) => typeof id === "string")
        );
      })
      .slice(0, 3) as AdaptiveSessionHistory["recentSessions"];
    return {
      schemaVersion: 1,
      lastRequest: candidate.lastRequest ?? null,
      recentSessions,
    };
  } catch {
    return EMPTY_HISTORY;
  }
}

export function createAdaptiveSessionHistoryStore(
  storage: StorageAdapter = AsyncStorage,
): AdaptiveSessionHistoryStore {
  async function load(): Promise<AdaptiveSessionHistory> {
    const value = await storage.getItem(STORAGE_KEY);
    return value ? parseAdaptiveSessionHistory(value) : EMPTY_HISTORY;
  }
  return {
    load,
    async recordStart(request, plan) {
      const previous = await load();
      const next: AdaptiveSessionHistory = {
        schemaVersion: 1,
        lastRequest: request,
        recentSessions: [
          {
            outcome: request.outcome,
            workIds: plan.segments.map(({ workId }) => workId),
          },
          ...previous.recentSessions,
        ].slice(0, 3),
      };
      await storage.setItem(STORAGE_KEY, JSON.stringify(next));
      return next;
    },
  };
}

export function recentWorkIdsForOutcome(
  history: AdaptiveSessionHistory,
  outcome: ConsumerOutcomeId,
): string[] {
  return history.recentSessions
    .filter((entry) => entry.outcome === outcome)
    .flatMap(({ workIds }) => workIds);
}

export function createConsumerSessionSeed(
  request: SavedSessionRequest,
  nonce = Date.now(),
): string {
  return `${request.outcome}-${request.durationMinutes}-${nonce.toString(36)}`;
}

export {
  EMPTY_HISTORY as EMPTY_ADAPTIVE_SESSION_HISTORY,
  STORAGE_KEY as ADAPTIVE_SESSION_HISTORY_KEY,
};
