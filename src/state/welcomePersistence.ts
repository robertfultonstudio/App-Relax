import AsyncStorage from "@react-native-async-storage/async-storage";
import type { StorageAdapter } from "./playerPersistence";

export const WELCOME_COMPLETED_KEY = "@app-relax/welcome-completed";

export function parseWelcomeCompleted(value: string): boolean {
  try {
    const saved = JSON.parse(value) as {
      schemaVersion?: unknown;
      welcomeCompleted?: unknown;
    } | null;
    return saved?.schemaVersion === 1 && saved.welcomeCompleted === true;
  } catch {
    return false;
  }
}

export function createWelcomePersistence(
  storage: StorageAdapter = AsyncStorage,
) {
  return {
    async load(): Promise<boolean> {
      const value = await storage.getItem(WELCOME_COMPLETED_KEY);
      return value ? parseWelcomeCompleted(value) : false;
    },
    async complete(): Promise<void> {
      await storage.setItem(
        WELCOME_COMPLETED_KEY,
        JSON.stringify({ schemaVersion: 1, welcomeCompleted: true }),
      );
    },
  };
}

const singleton = createWelcomePersistence();
export const loadWelcomeCompleted = () => singleton.load();
export const completeWelcome = () => singleton.complete();
