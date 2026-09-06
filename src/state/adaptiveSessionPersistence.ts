import AsyncStorage from "@react-native-async-storage/async-storage";
import type { ConsumerOutcomeId } from "@/content/productShell";
import { getSessionPolicy } from "@/content/sessionPolicies";
import {
  getConsumerWork,
  isVisibleConsumerWork,
} from "@/content/consumerCatalog";
import type {
  AdaptiveSessionPlan,
  NatureAmbienceFamily,
  SessionDurationMinutes,
  SessionSoundKind,
} from "@/domain/sessions/types";
import type { StorageAdapter } from "./playerPersistence";

const STORAGE_KEY = "@app-relax/adaptive-session-history";

export interface SavedSessionRequest {
  outcome: ConsumerOutcomeId;
  durationMinutes: SessionDurationMinutes;
  mode: "sound-only";
  soundKind: SessionSoundKind;
  natureFamily: NatureAmbienceFamily;
}

export interface AdaptiveSessionHistory {
  schemaVersion: 3;
  lastRequest: SavedSessionRequest | null;
  recentSessions: readonly {
    outcome: ConsumerOutcomeId;
    soundKind: SessionSoundKind;
    natureFamily: NatureAmbienceFamily;
    workIds: readonly string[];
    planId?: string;
  }[];
}

export interface AdaptiveSessionHistoryStore {
  load(): Promise<AdaptiveSessionHistory>;
  recordStart(
    request: SavedSessionRequest,
    plan: AdaptiveSessionPlan,
  ): Promise<AdaptiveSessionHistory>;
  recordHeard(
    request: SavedSessionRequest,
    plan: AdaptiveSessionPlan,
    heardWorkIds: readonly string[],
  ): Promise<AdaptiveSessionHistory>;
}

const EMPTY_HISTORY: AdaptiveSessionHistory = {
  schemaVersion: 3,
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
    candidate.mode === "sound-only" &&
    (candidate.soundKind === "music" || candidate.soundKind === "nature") &&
    (candidate.natureFamily === "rain" || candidate.natureFamily === "sea")
  );
}

/** Whitelist fields: runtime state, seeds and plan contents never enter the saved request. */
export function parseSavedSessionRequest(
  value: unknown,
): SavedSessionRequest | null {
  if (!isSavedRequest(value)) return null;
  return {
    outcome: value.outcome,
    durationMinutes: value.durationMinutes,
    mode: "sound-only",
    soundKind: value.soundKind,
    natureFamily: value.natureFamily,
  };
}

function isCurrentConsumerWork(workId: string): boolean {
  const work = getConsumerWork(workId);
  return (
    !!work &&
    isVisibleConsumerWork(work) &&
    work.availability !== "rejected-listening" &&
    work.listeningStatus !== "REJECTED — REPLACEMENT REQUIRED"
  );
}

export function parseAdaptiveSessionHistory(
  value: string,
): AdaptiveSessionHistory {
  try {
    const candidate = JSON.parse(value) as Partial<AdaptiveSessionHistory>;
    if (
      candidate.schemaVersion !== 3 ||
      (candidate.lastRequest !== null &&
        !isSavedRequest(candidate.lastRequest)) ||
      !Array.isArray(candidate.recentSessions)
    ) {
      return EMPTY_HISTORY;
    }
    const recentSessions = candidate.recentSessions
      .filter((entry) => {
        if (!entry || typeof entry !== "object") return false;
        const session = entry as {
          outcome?: unknown;
          soundKind?: unknown;
          natureFamily?: unknown;
          workIds?: unknown;
          planId?: unknown;
        };
        return (
          OUTCOMES.includes(session.outcome as ConsumerOutcomeId) &&
          (session.soundKind === "music" || session.soundKind === "nature") &&
          (session.natureFamily === "rain" || session.natureFamily === "sea") &&
          Array.isArray(session.workIds) &&
          session.workIds.every((id) => typeof id === "string") &&
          (session.planId === undefined ||
            (typeof session.planId === "string" && session.planId.length > 0))
        );
      })
      .map((entry) => ({
        outcome: entry.outcome,
        soundKind: entry.soundKind,
        natureFamily: entry.natureFamily,
        workIds: [...new Set(entry.workIds.filter(isCurrentConsumerWork))],
        ...(entry.planId ? { planId: entry.planId } : {}),
      }))
      .filter((entry) => entry.workIds.length > 0)
      .slice(0, 3) as AdaptiveSessionHistory["recentSessions"];
    return {
      schemaVersion: 3,
      lastRequest: parseSavedSessionRequest(candidate.lastRequest),
      recentSessions,
    };
  } catch {
    return EMPTY_HISTORY;
  }
}

// Shared by all store instances using the same adapter: ticks cannot overwrite one another.
const mutationQueues = new WeakMap<StorageAdapter, Promise<unknown>>();

export function createAdaptiveSessionHistoryStore(
  storage: StorageAdapter = AsyncStorage,
): AdaptiveSessionHistoryStore {
  async function read(): Promise<AdaptiveSessionHistory> {
    const value = await storage.getItem(STORAGE_KEY);
    return value ? parseAdaptiveSessionHistory(value) : EMPTY_HISTORY;
  }
  function recordHeard(
    request: SavedSessionRequest,
    plan: AdaptiveSessionPlan,
    heardWorkIds: readonly string[],
  ) {
    const operation = (mutationQueues.get(storage) ?? Promise.resolve()).then(
      async () => {
        const previous = await read();
        const savedRequest = parseSavedSessionRequest(request);
        if (
          !savedRequest ||
          plan.outcome !== savedRequest.outcome ||
          plan.soundKind !== savedRequest.soundKind ||
          plan.requestedDurationMinutes !== savedRequest.durationMinutes ||
          plan.mode !== savedRequest.mode ||
          !plan.id ||
          (plan.natureMix &&
            plan.natureMix.selectedFamily !== savedRequest.natureFamily)
        )
          throw new Error(
            "The heard session does not match its saved request.",
          );
        const allowedWorkIds = plan.segments
          .filter(
            (segment) =>
              request.soundKind !== "music" ||
              (segment.lane ?? "primary") === "primary",
          )
          .map(({ workId }) => workId)
          .filter(isCurrentConsumerWork);
        const allowed = new Set(allowedWorkIds);
        const heard = [...new Set(heardWorkIds)].filter((id) =>
          allowed.has(id),
        );
        if (!heard.length) return previous;
        const existingIndex = previous.recentSessions.findIndex(
          (entry) => entry.planId === plan.id,
        );
        const existing = previous.recentSessions[existingIndex];
        if (existing && heard.every((id) => existing.workIds.includes(id))) {
          return previous;
        }
        const entry = {
          outcome: savedRequest.outcome,
          soundKind: savedRequest.soundKind,
          natureFamily: savedRequest.natureFamily,
          planId: plan.id,
          workIds: [...new Set([...(existing?.workIds ?? []), ...heard])],
        };
        const recentSessions = [...previous.recentSessions];
        if (existingIndex >= 0) recentSessions[existingIndex] = entry;
        else recentSessions.unshift(entry);
        const next: AdaptiveSessionHistory = {
          schemaVersion: 3,
          // A late tick from an older plan must not replace the latest successful choice.
          lastRequest: existingIndex > 0 ? previous.lastRequest : savedRequest,
          recentSessions: recentSessions.slice(0, 3),
        };
        await storage.setItem(STORAGE_KEY, JSON.stringify(next));
        return next;
      },
    );
    mutationQueues.set(
      storage,
      operation.catch(() => undefined),
    );
    return operation;
  }
  return {
    async load() {
      await mutationQueues.get(storage);
      return read();
    },
    recordHeard,
    recordStart(request, plan) {
      const initialIds = plan.segments
        .filter((segment) => segment.startFrame === 0 && segment.endFrame > 0)
        .map(({ workId }) => workId);
      return recordHeard(request, plan, initialIds);
    },
  };
}

export function recentWorkIdsForSession(
  history: AdaptiveSessionHistory,
  outcome: ConsumerOutcomeId,
  soundKind: SessionSoundKind,
): string[] {
  const recent = history.recentSessions
    .filter(
      (entry) => entry.outcome === outcome && entry.soundKind === soundKind,
    )
    .flatMap(({ workIds }) => [...workIds].reverse());
  return recent.slice(0, 12);
}

export function createConsumerSessionSeed(
  request: SavedSessionRequest,
  nonce = Date.now(),
): string {
  return `${request.outcome}-${request.soundKind}-${request.natureFamily}-${request.durationMinutes}-${nonce.toString(36)}`;
}

export {
  EMPTY_HISTORY as EMPTY_ADAPTIVE_SESSION_HISTORY,
  STORAGE_KEY as ADAPTIVE_SESSION_HISTORY_KEY,
};
