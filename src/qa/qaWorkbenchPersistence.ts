import AsyncStorage from "@react-native-async-storage/async-storage";
import type { ConsumerOutcomeId } from "@/content/productShell";
import type {
  SessionDurationMinutes,
  TransitionCurve,
} from "@/domain/sessions/types";
import type { AuditionMode } from "@/domain/sessions/workbench";
import type { StorageAdapter } from "@/state/playerPersistence";

const STORAGE_KEY = "@app-relax/qa-workbench-draft";
const OUTCOMES: readonly ConsumerOutcomeId[] = [
  "meditation",
  "yoga",
  "massage",
  "relax",
  "sleep",
  "focus",
];
const DURATIONS: readonly SessionDurationMinutes[] = [10, 20, 30, 45, 60, 90];

export interface QaWorkbenchDraft {
  schemaVersion: 1;
  outcome: ConsumerOutcomeId;
  durationMinutes: SessionDurationMinutes;
  seed: string;
  transitionIndex: number;
  loopWindowSeconds: 30 | 60;
  auditionMode: AuditionMode;
  aDurationSeconds: number;
  aCurve: TransitionCurve;
  bDurationSeconds: number;
  bCurve: TransitionCurve;
}

export const DEFAULT_QA_WORKBENCH_DRAFT: QaWorkbenchDraft = {
  schemaVersion: 1,
  outcome: "meditation",
  durationMinutes: 20,
  seed: "meditation-review-001",
  transitionIndex: 0,
  loopWindowSeconds: 30,
  auditionMode: "both",
  aDurationSeconds: 12,
  aCurve: "equal-power",
  bDurationSeconds: 20,
  bCurve: "linear",
};

function validDuration(value: unknown): value is number {
  return typeof value === "number" && value >= 4 && value <= 30;
}

function validCurve(value: unknown): value is TransitionCurve {
  return value === "equal-power" || value === "linear";
}

export function parseQaWorkbenchDraft(value: string): QaWorkbenchDraft | null {
  try {
    const item = JSON.parse(value) as Partial<QaWorkbenchDraft>;
    if (
      item.schemaVersion !== 1 ||
      !OUTCOMES.includes(item.outcome as ConsumerOutcomeId) ||
      !DURATIONS.includes(item.durationMinutes as SessionDurationMinutes) ||
      typeof item.seed !== "string" ||
      !item.seed.trim() ||
      !Number.isInteger(item.transitionIndex) ||
      (item.loopWindowSeconds !== 30 && item.loopWindowSeconds !== 60) ||
      !["outgoing", "incoming", "both"].includes(item.auditionMode ?? "") ||
      !validDuration(item.aDurationSeconds) ||
      !validDuration(item.bDurationSeconds) ||
      !validCurve(item.aCurve) ||
      !validCurve(item.bCurve)
    ) {
      return null;
    }
    return item as QaWorkbenchDraft;
  } catch {
    return null;
  }
}

export function createQaWorkbenchDraftStore(
  storage: StorageAdapter = AsyncStorage,
) {
  return {
    async load(): Promise<QaWorkbenchDraft | null> {
      const value = await storage.getItem(STORAGE_KEY);
      return value ? parseQaWorkbenchDraft(value) : null;
    },
    async save(draft: QaWorkbenchDraft): Promise<void> {
      await storage.setItem(STORAGE_KEY, JSON.stringify(draft));
    },
  };
}

export { STORAGE_KEY as QA_WORKBENCH_DRAFT_KEY };
