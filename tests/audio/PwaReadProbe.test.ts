import { PwaReadProbe, reviewReadSummary } from "@/pwa-review/PwaReadProbe";

it("measures completed and failed operations without changing their result", async () => {
  let now = 100;
  const probe = new PwaReadProbe(() => now);
  const before = probe.snapshot({ networkReads: 0, cacheReads: 0 });
  await expect(
    probe.measure("open", async () => {
      now += 20;
      return "metadata";
    }),
  ).resolves.toBe("metadata");
  await probe.measure("read", async () => {
    now += 5;
    await probe.measure("decode", async () => {
      now += 30;
    });
  });
  const error = new Error("Decode failed");
  await expect(
    probe.measure("decode", async () => {
      now += 10;
      throw error;
    }),
  ).rejects.toBe(error);
  const after = probe.snapshot({ networkReads: 1, cacheReads: 3 });
  expect(after).toEqual({
    scope: before.scope,
    opens: 1,
    openMs: 20,
    reads: 1,
    readMs: 35,
    decodes: 2,
    decodeMs: 40,
    networkReads: 1,
    cacheReads: 3,
  });
  expect(before.opens).toBe(0);
  after.opens = 999;
  expect(probe.snapshot({ networkReads: 0, cacheReads: 0 }).opens).toBe(1);
  const copy = reviewReadSummary(
    before,
    probe.snapshot({ networkReads: 1, cacheReads: 3 }),
  );
  expect(copy).toContain("1 HTTP attempts, 3 memory hits");
  expect(copy).toContain("Timings overlap across sources");
  expect(copy).toContain("Range counts exclude offline Blob");
  expect(copy).toContain("Offline WAV is not measured");
  expect(copy).toContain("2 worker decodes / 40 ms");
});

it("does not compare different driver lifetimes or unavailable native metrics", () => {
  const counts = { networkReads: 0, cacheReads: 0 };
  const first = new PwaReadProbe().snapshot(counts);
  const second = new PwaReadProbe().snapshot(counts);
  expect(reviewReadSummary(first, second)).toBe("");
  expect(reviewReadSummary(null, second)).toBe("");
  expect(reviewReadSummary(first, null)).toBe("");
});

it("never reports a negative duration on clock regression", async () => {
  let now = 50;
  const probe = new PwaReadProbe(() => now);
  await probe.measure("read", async () => {
    now = 40;
  });
  expect(probe.snapshot({ networkReads: 0, cacheReads: 0 }).readMs).toBe(0);
});
