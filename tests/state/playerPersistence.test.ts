import {
  createPlayerPreferencesStore,
  parsePreferences,
  STORAGE_KEY,
  type PlayerPreferences,
} from "@/state/playerPersistence";

const preferences: PlayerPreferences = {
  schemaVersion: 1,
  presetId: "deep-sleep-432",
  durationMinutes: 30,
  gains: {
    drone: 0.25,
    ambience: 0.2,
    texture: 0.12,
    binaural: 0.07,
    brownNoise: 0.11,
  },
  muted: {
    drone: false,
    ambience: false,
    texture: true,
    binaural: false,
    brownNoise: false,
  },
};

describe("player preference persistence", () => {
  it("round-trips a versioned preference record", async () => {
    const values = new Map<string, string>();
    const store = createPlayerPreferencesStore({
      async getItem(key) {
        return values.get(key) ?? null;
      },
      async setItem(key, value) {
        values.set(key, value);
      },
    });

    await store.save(preferences);
    expect(values.has(STORAGE_KEY)).toBe(true);
    await expect(store.load()).resolves.toEqual(preferences);
  });

  it("ignores corrupt, unknown-version and out-of-range data", () => {
    expect(parsePreferences("{not-json")).toBeNull();
    expect(
      parsePreferences(JSON.stringify({ ...preferences, schemaVersion: 2 })),
    ).toBeNull();
    expect(
      parsePreferences(
        JSON.stringify({
          ...preferences,
          gains: { ...preferences.gains, drone: 2 },
        }),
      ),
    ).toBeNull();
  });
});
