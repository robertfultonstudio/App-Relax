import AsyncStorage from "@react-native-async-storage/async-storage";
import { AUDIO_SOURCE_IDS, type AudioSourceId } from "@/domain/audio/types";

const STORAGE_KEY = "@ritual-audio/player-preferences";

export interface PlayerPreferences {
  schemaVersion: 1;
  presetId: string;
  durationMinutes: number;
  gains: Record<AudioSourceId, number>;
  muted: Record<AudioSourceId, boolean>;
}

export interface StorageAdapter {
  getItem(key: string): Promise<string | null>;
  setItem(key: string, value: string): Promise<void>;
}

export interface PlayerPreferencesStore {
  load(): Promise<PlayerPreferences | null>;
  save(preferences: PlayerPreferences): Promise<void>;
}

function isRecord(value: unknown): value is Record<string, unknown> {
  return typeof value === "object" && value !== null;
}

function parsePreferences(value: string): PlayerPreferences | null {
  try {
    const parsed: unknown = JSON.parse(value);
    if (!isRecord(parsed) || parsed.schemaVersion !== 1) {
      return null;
    }
    if (
      typeof parsed.presetId !== "string" ||
      !Number.isInteger(parsed.durationMinutes)
    ) {
      return null;
    }
    if (!isRecord(parsed.gains) || !isRecord(parsed.muted)) {
      return null;
    }

    const gains = {} as Record<AudioSourceId, number>;
    const muted = {} as Record<AudioSourceId, boolean>;
    for (const sourceId of AUDIO_SOURCE_IDS) {
      const gain = parsed.gains[sourceId];
      const isMuted = parsed.muted[sourceId];
      if (
        typeof gain !== "number" ||
        gain < 0 ||
        gain > 1 ||
        typeof isMuted !== "boolean"
      ) {
        return null;
      }
      gains[sourceId] = gain;
      muted[sourceId] = isMuted;
    }

    return {
      schemaVersion: 1,
      presetId: parsed.presetId,
      durationMinutes: parsed.durationMinutes as number,
      gains,
      muted,
    };
  } catch {
    return null;
  }
}

export function createPlayerPreferencesStore(
  storage: StorageAdapter = AsyncStorage,
): PlayerPreferencesStore {
  return {
    async load() {
      const stored = await storage.getItem(STORAGE_KEY);
      return stored ? parsePreferences(stored) : null;
    },
    async save(preferences) {
      await storage.setItem(STORAGE_KEY, JSON.stringify(preferences));
    },
  };
}

export { STORAGE_KEY, parsePreferences };
