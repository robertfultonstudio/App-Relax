import {
  createLastListeningStore,
  LAST_LISTENING_KEY,
  parseLastListening,
  type LastListening,
} from "@/state/lastListeningPersistence";
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
const single: LastListening = {
  kind: "single",
  workId: "moonlit-keys",
  outcome: "massage",
  durationMinutes: 90,
};
const adaptive: LastListening = {
  kind: "adaptive",
  request: {
    outcome: "meditation",
    durationMinutes: 20,
    mode: "sound-only",
    soundKind: "nature",
    natureFamily: "sea",
  },
};

describe("last confirmed listening", () => {
  it("retains a single work and the chosen 90-minute duration across reload", async () => {
    const storage = memoryStorage();
    await createLastListeningStore(storage).save(single);
    expect(await createLastListeningStore(storage).load()).toEqual(single);
    expect(
      JSON.parse(storage.values.get(LAST_LISTENING_KEY)!).schemaVersion,
    ).toBe(1);
  });
  it("preserves the actual successful listening kind and serializes saves", async () => {
    const storage = memoryStorage(),
      first = createLastListeningStore(storage),
      second = createLastListeningStore(storage);
    await Promise.all([first.save(adaptive), second.save(single)]);
    expect(await first.load()).toEqual(single);
    await first.save(adaptive);
    expect(await second.load()).toEqual(adaptive);
  });
  it("whitelists only reusable selection fields, never seeds or runtime state", async () => {
    const storage = memoryStorage(),
      store = createLastListeningStore(storage);
    await store.save({
      ...adaptive,
      request: { ...adaptive.request, seed: "private-seed", playing: true },
    } as LastListening);
    expect(await store.load()).toEqual(adaptive);
    expect(storage.values.get(LAST_LISTENING_KEY)).not.toMatch(/seed|playing/);
    await store.save({
      ...single,
      seed: "private-seed",
      timer: 17,
    } as LastListening);
    expect(await store.load()).toEqual(single);
    expect(storage.values.get(LAST_LISTENING_KEY)).not.toMatch(/seed|timer/);
  });
  it.each([
    { ...single, workId: "soft-air" },
    { ...single, workId: "moon-drone" },
    { ...single, workId: "deep-river" },
    { ...single, workId: "eclipse-veil" },
    { ...single, workId: "stillwater-halo" },
    { ...single, workId: "does-not-exist" },
    { ...single, outcome: "unknown" },
    { ...single, durationMinutes: 10 },
    { ...single, durationMinutes: 15 },
    { ...single, durationMinutes: 90.5 },
    { kind: "adaptive", request: { ...adaptive.request, durationMinutes: 15 } },
  ])("rejects unavailable or policy-invalid selection %j", async (value) => {
    const storage = memoryStorage(),
      store = createLastListeningStore(storage);
    await store.save(single);
    await expect(store.save(value as LastListening)).rejects.toThrow();
    expect(await store.load()).toEqual(single);
  });
  it.each([
    "not-json",
    "null",
    "[]",
    '{"schemaVersion":2}',
    '{"schemaVersion":1,"listening":{"kind":"single"}}',
  ])("fails closed on corrupt or unsupported serialized data %s", (raw) =>
    expect(parseLastListening(raw)).toBeNull(),
  );
});
