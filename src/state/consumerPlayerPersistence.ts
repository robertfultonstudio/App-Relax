import AsyncStorage from "@react-native-async-storage/async-storage";
import type { StorageAdapter } from "./playerPersistence";

const CONSUMER_STORAGE_KEY = "@ritual-audio/consumer-player-preferences";

export interface ConsumerPlayerPreferences {
  schemaVersion: 1;
  workId: string;
  durationMinutes: number;
  volume: number;
}

export interface ConsumerPlayerPreferencesStore {
  load(): Promise<ConsumerPlayerPreferences | null>;
  save(preferences: ConsumerPlayerPreferences): Promise<void>;
}

function parseConsumerPreferences(
  value: string,
): ConsumerPlayerPreferences | null {
  try {
    const parsed: unknown = JSON.parse(value);
    if (typeof parsed !== "object" || parsed === null) return null;
    const candidate = parsed as Record<string, unknown>;
    if (
      candidate.schemaVersion !== 1 ||
      typeof candidate.workId !== "string" ||
      !Number.isInteger(candidate.durationMinutes) ||
      typeof candidate.volume !== "number" ||
      candidate.volume < 0 ||
      candidate.volume > 1
    ) {
      return null;
    }
    return candidate as unknown as ConsumerPlayerPreferences;
  } catch {
    return null;
  }
}

export function createConsumerPlayerPreferencesStore(
  storage: StorageAdapter = AsyncStorage,
): ConsumerPlayerPreferencesStore {
  return {
    async load() {
      const stored = await storage.getItem(CONSUMER_STORAGE_KEY);
      return stored ? parseConsumerPreferences(stored) : null;
    },
    async save(preferences) {
      await storage.setItem(CONSUMER_STORAGE_KEY, JSON.stringify(preferences));
    },
  };
}

export { CONSUMER_STORAGE_KEY, parseConsumerPreferences };
