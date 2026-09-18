import { readFileSync } from "node:fs";
import path from "node:path";
import { runInNewContext } from "node:vm";

function setup() {
  const listeners: Record<string, (event: unknown) => void> = {};
  const entries = new Map<string, unknown>(),
    deleted: string[] = [];
  const self = {
    location: { origin: "https://app.test" },
    addEventListener: (name: string, handler: (event: unknown) => void) => {
      listeners[name] = handler;
    },
    APP_RELAX_PRECACHE: {
      revision: "a".repeat(64),
      urls: ["/", "/offline", "/listen/a", "/app.js", "/font.woff2"],
    },
    skipWaiting: jest.fn(),
    clients: { claim: jest.fn() },
  };
  const fetcher = jest.fn(async () => ({ ok: true, type: "basic" }));
  const cache = {
    put: async (key: string, value: unknown) => {
      entries.set(key, value);
    },
    match: async (key: string) => entries.get(key),
  };
  const source = readFileSync(
    path.resolve(__dirname, "../../public-pwa/sw.js"),
    "utf8",
  );
  runInNewContext(source, {
    self,
    importScripts: () => {},
    URL,
    Request: class {
      constructor(readonly url: string) {}
    },
    fetch: fetcher,
    Response: { error: () => "error" },
    caches: {
      open: async () => cache,
      keys: async () => ["ritual-audio-shell-old", "other-app-cache"],
      delete: async (key: string) => {
        deleted.push(key);
      },
    },
  });
  async function event(type: string, values = {}) {
    let promise: Promise<unknown> | null = null;
    listeners[type]({
      ...values,
      waitUntil: (task: Promise<unknown>) => {
        promise = task;
      },
      respondWith: (task: Promise<unknown>) => {
        promise = task;
      },
    });
    return promise;
  }
  return { event, self, fetcher, entries, deleted };
}

describe("PWA offline shell and non-interrupting updates", () => {
  it("preloads the whole declared shell without claiming clients or activating early", async () => {
    const t = setup();
    await t.event("install");
    expect([...t.entries.keys()]).toEqual(t.self.APP_RELAX_PRECACHE.urls);
    await t.event("activate");
    expect(t.self.skipWaiting).not.toHaveBeenCalled();
    expect(t.self.clients.claim).not.toHaveBeenCalled();
    expect(t.deleted).toEqual(["ritual-audio-shell-old"]);
  });
  it("reopens clean routes and query-bearing navigation from cache while offline", async () => {
    const t = setup();
    await t.event("install");
    t.fetcher.mockRejectedValue(new Error("offline"));
    const response = await t.event("fetch", {
      request: {
        url: "https://app.test/listen/a?duration=90",
        method: "GET",
        mode: "navigate",
        destination: "document",
        headers: new Map(),
      },
    });
    expect(response).toBe(t.entries.get("/listen/a"));
  });
  it("never routes audio and Range requests into shell cache", async () => {
    const t = setup();
    await t.event("install");
    const calls = t.fetcher.mock.calls.length;
    for (const [url, headers] of [
      ["https://app.test/audio-catalog/A.flac", new Map()],
      ["https://app.test/anything", new Map([["range", "bytes=0-1"]])],
    ] as const) {
      expect(
        await t.event("fetch", {
          request: {
            url,
            method: "GET",
            mode: "cors",
            destination: "",
            headers,
          },
        }),
      ).toBeNull();
    }
    expect(t.fetcher).toHaveBeenCalledTimes(calls);
  });
  it("does not install a partial shell after an unavailable asset", async () => {
    const t = setup();
    t.fetcher.mockResolvedValue({ ok: false, type: "basic" });
    await expect(t.event("install")).rejects.toThrow();
    expect(t.deleted).toEqual([`ritual-audio-shell-${"a".repeat(64)}`]);
  });
  it("confirms every cached shell entry and fails closed after one is lost", async () => {
    const t = setup();
    await t.event("install");
    const postMessage = jest.fn();
    const request = {
      origin: "https://app.test",
      data: { type: "APP_RELAX_CHECK_SHELL" },
      ports: [{ postMessage }],
    };
    await t.event("message", request);
    expect(postMessage).toHaveBeenLastCalledWith({
      type: "APP_RELAX_SHELL_STATUS",
      revision: "a".repeat(64),
      complete: true,
    });
    t.entries.delete("/app.js");
    await t.event("message", request);
    expect(postMessage).toHaveBeenLastCalledWith({
      type: "APP_RELAX_SHELL_STATUS",
      revision: "a".repeat(64),
      complete: false,
    });
  });
});
