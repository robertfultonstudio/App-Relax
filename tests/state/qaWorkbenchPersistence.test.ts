import {
  createQaWorkbenchDraftStore,
  DEFAULT_QA_WORKBENCH_DRAFT,
  parseQaWorkbenchDraft,
} from "@/qa/qaWorkbenchPersistence";
import type { StorageAdapter } from "@/state/playerPersistence";

describe("QA workbench persistence", () => {
  it("round-trips a reproducible QA draft", async () => {
    let value: string | null = null;
    const storage: StorageAdapter = {
      getItem: async () => value,
      setItem: async (_key, next) => {
        value = next;
      },
    };
    const store = createQaWorkbenchDraftStore(storage);
    await store.save(DEFAULT_QA_WORKBENCH_DRAFT);
    await expect(store.load()).resolves.toEqual(DEFAULT_QA_WORKBENCH_DRAFT);
  });

  it("rejects corrupt or out-of-bounds drafts", () => {
    expect(parseQaWorkbenchDraft("not-json")).toBeNull();
    expect(
      parseQaWorkbenchDraft(
        JSON.stringify({
          ...DEFAULT_QA_WORKBENCH_DRAFT,
          aDurationSeconds: 99,
        }),
      ),
    ).toBeNull();
  });
});
