import { createHash } from "node:crypto";
import {
  NativeCatalogStore,
  type NativeCatalogAsset,
  type PrivateCatalogPort,
  type PrivateFileStamp,
} from "@/offline/NativeCatalogStore";

function fixture() {
  const bytes = new Uint8Array([1, 2, 3, 4]);
  const asset: NativeCatalogAsset = {
    workId: "sound",
    filename: "sound.flac",
    bytes: bytes.length,
    frames: 1,
    sha256: createHash("sha256").update(bytes).digest("hex"),
  };
  const files = new Map<string, Uint8Array>();
  const receipts = new Map<string, PrivateFileStamp>();
  let clock = 1;
  const stamps = new Map<string, number>();
  const port: PrivateCatalogPort = {
    initialize: jest.fn(async () => {}),
    stat: jest.fn(async (key) =>
      files.has(key)
        ? { bytes: files.get(key)!.length, modified: stamps.get(key) ?? 1 }
        : null,
    ),
    receipt: jest.fn(async (key) => receipts.get(key) ?? null),
    saveReceipt: jest.fn(async (key, stamp) => {
      receipts.set(key, stamp);
    }),
    freeBytes: jest.fn(() => 1e10),
    copy: jest.fn(async (_uri, key) => {
      files.set(key, bytes.slice());
      stamps.set(key, ++clock);
    }),
    read: jest.fn(async (key, offset, n) =>
      files.get(key)!.slice(offset, offset + n),
    ),
    move: jest.fn(async (from, to) => {
      files.set(to, files.get(from)!);
      stamps.set(to, ++clock);
      files.delete(from);
    }),
    remove: jest.fn(async (key) => {
      files.delete(key);
    }),
    uri: (key) => `file:///private/${key}`,
    yield: jest.fn(async () => {}),
  };
  const availability = jest.fn();
  const store = new NativeCatalogStore([asset], port, availability);
  const sources = [{ filename: asset.filename, uri: "content://chosen/sound" }];
  return {
    asset,
    bytes,
    files,
    receipts,
    stamps,
    port,
    availability,
    store,
    sources,
    key: asset.sha256 + ".flac",
  };
}
describe("Android private catalogue", () => {
  it("does not treat manifest presence as audio availability", async () => {
    const h = fixture();
    await h.store.initialize();
    expect(h.store.getSnapshot().ready).toBe(0);
    expect(await h.store.acquire("sound")).toBeNull();
  });
  it("copies, hashes and attests once; warm playback and relaunch only stat immutable private files", async () => {
    const h = fixture();
    await h.store.importSources(h.sources);
    expect(h.store.getSnapshot().ready).toBe(1);
    expect(h.port.copy).toHaveBeenCalledTimes(1);
    expect(h.port.read).toHaveBeenCalledTimes(1);
    const first = await h.store.acquire("sound");
    expect(first?.sha256).toBe(h.asset.sha256);
    first?.release();
    first?.release();
    const next = new NativeCatalogStore([h.asset], h.port);
    await next.initialize();
    expect(next.getSnapshot().ready).toBe(1);
    const second = await next.acquire("sound");
    second?.release();
    expect(h.port.read).toHaveBeenCalledTimes(1);
    await next.importSources(h.sources);
    expect(h.port.copy).toHaveBeenCalledTimes(1);
  });
  it("rejects corruption without a receipt or ready flag and cleans only its staging", async () => {
    const h = fixture();
    h.port.read = jest.fn(async () => new Uint8Array([9, 9, 9, 9]));
    await h.store.importSources(h.sources);
    expect(h.store.getSnapshot().error).toContain("integrity");
    expect(h.store.getSnapshot().ready).toBe(0);
    expect(h.files.size).toBe(0);
    expect(h.receipts.size).toBe(0);
    expect(
      (h.port.remove as jest.Mock).mock.calls.every(([key]) =>
        key.endsWith(".part"),
      ),
    ).toBe(true);
  });
  it("rejects missing, duplicate, truncated and low-space sources", async () => {
    const h = fixture();
    await h.store.importSources([]);
    expect(h.port.copy).not.toHaveBeenCalled();
    await h.store.importSources([...h.sources, ...h.sources]);
    expect(h.port.copy).not.toHaveBeenCalled();
    h.port.freeBytes = () => 1;
    await h.store.importSources(h.sources);
    expect(h.store.getSnapshot().error).toContain("storage");
    expect(h.port.copy).not.toHaveBeenCalled();
    h.port.freeBytes = () => 1e10;
    h.port.read = async () => new Uint8Array(1);
    await h.store.importSources(h.sources);
    expect(h.store.getSnapshot().error).toContain("Incomplete");
    expect(h.store.getSnapshot().ready).toBe(0);
  });
  it("cancels between chunks and resumes idempotently", async () => {
    const h = fixture();
    h.port.copy = async (_uri, key) => {
      h.files.set(key, h.bytes);
      h.store.cancel();
    };
    await h.store.importSources(h.sources);
    expect(h.store.getSnapshot().ready).toBe(0);
    expect(h.files.size).toBe(0);
    h.port.copy = async (_uri, key) => {
      h.files.set(key, h.bytes);
    };
    await h.store.importSources(h.sources);
    expect(h.store.getSnapshot().ready).toBe(1);
  });
  it("revokes a stale receipt when private size/stamp changes, never leases source URI", async () => {
    const h = fixture();
    await h.store.importSources(h.sources);
    h.stamps.set(h.key, 999);
    expect(await h.store.acquire("sound")).toBeNull();
    expect(h.store.getSnapshot().ready).toBe(0);
  });
  it("fails closed on torn receipts and invalid trusted manifests", async () => {
    const h = fixture();
    h.files.set(h.key, h.bytes);
    await h.store.initialize();
    expect(h.store.getSnapshot().ready).toBe(0);
    expect(
      () =>
        new NativeCatalogStore(
          [{ ...h.asset, filename: "../sound.flac" }],
          h.port,
        ),
    ).toThrow("manifest");
    expect(() => new NativeCatalogStore([h.asset, h.asset], h.port)).toThrow(
      "manifest",
    );
  });
});
