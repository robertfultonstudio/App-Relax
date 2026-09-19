import {
  createWelcomePersistence,
  parseWelcomeCompleted,
  WELCOME_COMPLETED_KEY,
} from "@/state/welcomePersistence";
import type { StorageAdapter } from "@/state/playerPersistence";

function memoryStorage(): StorageAdapter & { values: Map<string, string> } {
  const values = new Map<string, string>();
  return {
    values,
    getItem: async (key) => values.get(key) ?? null,
    setItem: async (key, value) => {
      values.set(key, value);
    },
  };
}

it("persists one versioned welcome completion flag", async () => {
  const storage = memoryStorage();
  const store = createWelcomePersistence(storage);
  expect(await store.load()).toBe(false);
  await store.complete();
  expect(await store.load()).toBe(true);
  expect(JSON.parse(storage.values.get(WELCOME_COMPLETED_KEY)!)).toEqual({
    schemaVersion: 1,
    welcomeCompleted: true,
  });
});

it.each([
  "not-json",
  "null",
  "{}",
  '{"schemaVersion":2,"welcomeCompleted":true}',
  '{"schemaVersion":1,"welcomeCompleted":false}',
])("fails closed for unsupported welcome state %s", (raw) => {
  expect(parseWelcomeCompleted(raw)).toBe(false);
});
