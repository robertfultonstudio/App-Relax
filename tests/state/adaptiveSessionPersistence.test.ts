import {
  ADAPTIVE_SESSION_HISTORY_KEY,
  createAdaptiveSessionHistoryStore,
  createConsumerSessionSeed,
  EMPTY_ADAPTIVE_SESSION_HISTORY,
  parseAdaptiveSessionHistory,
  recentWorkIdsForSession,
} from "@/state/adaptiveSessionPersistence";
import { createAdaptiveSessionProgram } from "@/domain/sessions/continuumPlanner";
import { createQaPairProgram } from "@/qa/qaCatalog";
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
  it("records only the initial heard work and the three newest work histories", async () => {
    const storage = memoryStorage();
    const store = createAdaptiveSessionHistoryStore(storage);
    const request = {
      outcome: "meditation" as const,
      durationMinutes: 20 as const,
      mode: "sound-only" as const,
      soundKind: "nature" as const,
      natureFamily: "sea" as const,
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
    expect(
      recentWorkIdsForSession(loaded, "meditation", "nature"),
    ).toHaveLength(3);
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
      soundKind: "music" as const,
      natureFamily: "rain" as const,
    };
    expect(createConsumerSessionSeed(request, 1)).not.toBe(
      createConsumerSessionSeed(request, 2),
    );
    expect(createConsumerSessionSeed(request, 1)).not.toBe(
      createConsumerSessionSeed({ ...request, natureFamily: "sea" }, 1),
    );
  });

  it("persists the selected natural family and excludes the nature lane from music history", async () => {
    const storage = memoryStorage();
    const store = createAdaptiveSessionHistoryStore(storage);
    const request = {
      outcome: "relax" as const,
      durationMinutes: 20 as const,
      mode: "sound-only" as const,
      soundKind: "music" as const,
      natureFamily: "rain" as const,
    };
    const program = createQaPairProgram({
      outgoingWorkId: "distant-garden",
      incomingWorkId: "luminous-grain",
      outcome: request.outcome,
      durationMinutes: request.durationMinutes,
      crossfadeSeconds: 180,
      curve: "equal-power",
      natureFamily: request.natureFamily,
    });

    await store.recordStart(request, program.plan);

    const loaded = await store.load();
    const primaryWorkIds = program.plan.segments
      .filter(
        (segment) =>
          (segment.lane ?? "primary") === "primary" && segment.startFrame === 0,
      )
      .map(({ workId }) => workId);
    const natureWorkIds = program.plan.segments
      .filter((segment) => segment.lane === "nature")
      .map(({ workId }) => workId);
    expect(loaded.lastRequest).toEqual(request);
    expect(loaded.recentSessions[0]).toEqual({
      outcome: "relax",
      soundKind: "music",
      natureFamily: "rain",
      workIds: primaryWorkIds,
      planId: program.plan.id,
    });
    expect(recentWorkIdsForSession(loaded, "relax", "music")).toEqual(
      [...primaryWorkIds].reverse(),
    );
    expect(
      recentWorkIdsForSession(loaded, "relax", "music").some((workId) =>
        natureWorkIds.includes(workId),
      ),
    ).toBe(false);
  });

  it("rejects history without a valid selected natural family", () => {
    expect(
      parseAdaptiveSessionHistory(
        JSON.stringify({
          schemaVersion: 3,
          lastRequest: {
            outcome: "relax",
            durationMinutes: 20,
            mode: "sound-only",
            soundKind: "nature",
          },
          recentSessions: [],
        }),
      ),
    ).toEqual(EMPTY_ADAPTIVE_SESSION_HISTORY);
  });

  it("adds only heard works from the same plan without duplicate sessions", async () => {
    const storage = memoryStorage(),
      store = createAdaptiveSessionHistoryStore(storage);
    const request = {
      outcome: "meditation" as const,
      durationMinutes: 20 as const,
      mode: "sound-only" as const,
      soundKind: "nature" as const,
      natureFamily: "sea" as const,
    };
    const { plan } = createAdaptiveSessionProgram({
      ...request,
      seed: "heard-only",
      allowProvisionalMetadata: true,
    });
    const ids = plan.segments.map((segment) => segment.workId);
    await store.recordStart(request, plan);
    expect((await store.load()).recentSessions[0].workIds).toEqual([ids[0]]);
    await store.recordHeard(request, plan, [
      ids[1],
      ids[1],
      "soft-air",
      "not-in-plan",
    ]);
    await store.recordStart(request, plan); // repeated confirmation / resume must not erase heard works
    const saved = await store.load();
    expect(saved.recentSessions).toHaveLength(1);
    expect(saved.recentSessions[0].workIds).toEqual([ids[0], ids[1]]);
    expect(saved.recentSessions[0].workIds).not.toContain(ids[2]);
  });

  it("serializes concurrent heard ticks even across stores sharing an adapter", async () => {
    const storage = memoryStorage(),
      first = createAdaptiveSessionHistoryStore(storage),
      second = createAdaptiveSessionHistoryStore(storage);
    const request = {
      outcome: "meditation" as const,
      durationMinutes: 20 as const,
      mode: "sound-only" as const,
      soundKind: "nature" as const,
      natureFamily: "sea" as const,
    };
    const { plan } = createAdaptiveSessionProgram({
      ...request,
      seed: "concurrent-heard",
      allowProvisionalMetadata: true,
    });
    const ids = plan.segments.map((segment) => segment.workId);
    await first.recordStart(request, plan);
    await Promise.all([
      first.recordHeard(request, plan, [ids[1]]),
      second.recordHeard(request, plan, [ids[2]]),
    ]);
    expect((await second.load()).recentSessions[0].workIds).toEqual([
      ids[0],
      ids[1],
      ids[2],
    ]);
  });

  it("retains schema-3 histories without planId while stripping seed and rejected IDs", () => {
    const request = {
      outcome: "meditation",
      durationMinutes: 20,
      mode: "sound-only",
      soundKind: "nature",
      natureFamily: "sea",
    };
    const old = {
      schemaVersion: 3,
      lastRequest: { ...request, seed: "must-not-persist" },
      recentSessions: [
        {
          outcome: "meditation",
          soundKind: "nature",
          natureFamily: "sea",
          workIds: [
            "field-sea-003-open-tide",
            "soft-air",
            "eclipse-veil",
            "field-sea-003-open-tide",
          ],
        },
      ],
    };
    const parsed = parseAdaptiveSessionHistory(JSON.stringify(old));
    expect(parsed.lastRequest).toEqual(request);
    expect(parsed.recentSessions[0].workIds).toEqual([
      "field-sea-003-open-tide",
    ]);
    expect(parsed.recentSessions[0].planId).toBeUndefined();
    expect(JSON.stringify(parsed)).not.toContain("seed");
  });

  it("rejects a mismatched request without poisoning subsequent mutations", async () => {
    const storage = memoryStorage(),
      store = createAdaptiveSessionHistoryStore(storage);
    const request = {
      outcome: "meditation" as const,
      durationMinutes: 20 as const,
      mode: "sound-only" as const,
      soundKind: "nature" as const,
      natureFamily: "sea" as const,
    };
    const { plan } = createAdaptiveSessionProgram({
      ...request,
      seed: "validate-heard",
      allowProvisionalMetadata: true,
    });
    await expect(
      store.recordStart({ ...request, durationMinutes: 90 }, plan),
    ).rejects.toThrow();
    await store.recordStart(request, plan);
    expect((await store.load()).lastRequest).toEqual(request);
  });

  it("keeps the latest request when an older plan reports a late heard tick", async () => {
    const storage = memoryStorage();
    const store = createAdaptiveSessionHistoryStore(storage);
    const request = {
      outcome: "meditation" as const,
      durationMinutes: 20 as const,
      mode: "sound-only" as const,
      soundKind: "nature" as const,
      natureFamily: "sea" as const,
    };
    const newer = { ...request, durationMinutes: 45 as const };
    const { plan: oldPlan } = createAdaptiveSessionProgram({
      ...request,
      seed: "old-tick",
      allowProvisionalMetadata: true,
    });
    const { plan: newPlan } = createAdaptiveSessionProgram({
      ...newer,
      seed: "new-start",
      allowProvisionalMetadata: true,
    });
    await store.recordStart(request, oldPlan);
    await store.recordStart(newer, newPlan);
    await store.recordHeard(request, oldPlan, [oldPlan.segments[1].workId]);
    const history = await store.load();
    expect(history.lastRequest).toEqual(newer);
    expect(history.recentSessions.map((entry) => entry.planId)).toEqual([
      newPlan.id,
      oldPlan.id,
    ]);
    expect(history.recentSessions[1].workIds).toHaveLength(2);
  });

  it("does not persist a phantom session when no plan work was heard", async () => {
    const storage = memoryStorage();
    const store = createAdaptiveSessionHistoryStore(storage);
    const request = {
      outcome: "meditation" as const,
      durationMinutes: 20 as const,
      mode: "sound-only" as const,
      soundKind: "nature" as const,
      natureFamily: "sea" as const,
    };
    const { plan } = createAdaptiveSessionProgram({
      ...request,
      seed: "nothing-heard",
      allowProvisionalMetadata: true,
    });
    await store.recordHeard(request, plan, ["not-in-plan", "soft-air"]);
    expect(storage.values.size).toBe(0);
    expect(await store.load()).toEqual(EMPTY_ADAPTIVE_SESSION_HISTORY);
  });
});
