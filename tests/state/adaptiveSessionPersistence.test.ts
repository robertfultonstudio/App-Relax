import {
  ADAPTIVE_SESSION_HISTORY_KEY,
  createAdaptiveSessionHistoryStore,
  createConsumerSessionSeed,
  EMPTY_ADAPTIVE_SESSION_HISTORY,
  parseAdaptiveSessionHistory,
  recentWorkIdsForOutcome,
} from "@/state/adaptiveSessionPersistence";
import { createAdaptiveSessionProgram } from "@/domain/sessions/continuumPlanner";
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

describe("adaptive session history", () => {
  it("records only the reusable request and the three newest work histories", async () => {
    const storage = memoryStorage();
    const store = createAdaptiveSessionHistoryStore(storage);
    const request = {
      outcome: "meditation" as const,
      durationMinutes: 20 as const,
      mode: "sound-only" as const,
    };
    for (let index = 0; index < 4; index += 1) {
      const program = createAdaptiveSessionProgram({
        ...request,
        seed: `history-${index}`,
        allowProvisionalMetadata: true,
      });
      await store.recordStart(request, program.plan);
    }
    const loaded = await store.load();
    expect(loaded.lastRequest).toEqual(request);
    expect(loaded.recentSessions).toHaveLength(3);
    expect(recentWorkIdsForOutcome(loaded, "meditation")).toHaveLength(12);
    expect(storage.values.get(ADAPTIVE_SESSION_HISTORY_KEY)).not.toContain(
      '"seed"',
    );
  });

  it("fails closed to empty history when persisted data is corrupt", () => {
    expect(parseAdaptiveSessionHistory("not json")).toEqual(
      EMPTY_ADAPTIVE_SESSION_HISTORY,
    );
    expect(parseAdaptiveSessionHistory('{"schemaVersion":2}')).toEqual(
      EMPTY_ADAPTIVE_SESSION_HISTORY,
    );
    expect(
      parseAdaptiveSessionHistory(
        '{"schemaVersion":1,"lastRequest":{"outcome":"yoga","durationMinutes":10,"mode":"sound-only"},"recentSessions":[]}',
      ),
    ).toEqual(EMPTY_ADAPTIVE_SESSION_HISTORY);
  });

  it("generates a fresh consumer seed from the saved request", () => {
    const request = {
      outcome: "yoga" as const,
      durationMinutes: 30 as const,
      mode: "sound-only" as const,
    };
    expect(createConsumerSessionSeed(request, 1)).not.toBe(
      createConsumerSessionSeed(request, 2),
    );
  });
});
