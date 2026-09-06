import { PwaWebAudioSourceResolver } from "@/audio/web/PwaWebAudioSourceResolver";
import { getConsumerWork } from "@/content/consumerCatalog";
const mockAcquire = jest.fn();
jest.mock("@/offline/PwaOfflineDownloads", () => ({
  getPwaOfflineDownloads: () => ({ acquire: mockAcquire }),
}));
const work = getConsumerWork("field-sea-003-open-tide")!;
beforeEach(() => mockAcquire.mockReset());

describe("PWA offline-first source leases", () => {
  it("prefers the verified local file and forwards its lease", async () => {
    const lease = { uri: "blob:verified", release: jest.fn() };
    mockAcquire.mockResolvedValue(lease);
    const result = await new PwaWebAudioSourceResolver().acquireWork(work);
    expect(result).toBe(lease);
    expect(mockAcquire).toHaveBeenCalledWith(work.id);
    await result!.release();
    expect(lease.release).toHaveBeenCalledTimes(1);
  });
  it("uses same-origin online audio only when no verified local file exists", async () => {
    mockAcquire.mockResolvedValue(null);
    const result = await new PwaWebAudioSourceResolver().acquireWork(work);
    expect(result?.uri).toBe(
      `/audio-catalog/${encodeURIComponent(work.localPreviewFilename!)}`,
    );
    await result!.release();
  });
  it("does not resolve or fall back after cancellation", async () => {
    const controller = new AbortController();
    controller.abort();
    await expect(
      new PwaWebAudioSourceResolver().acquireWork(work, controller.signal),
    ).rejects.toMatchObject({ name: "AbortError" });
    expect(mockAcquire).not.toHaveBeenCalled();
  });
});
