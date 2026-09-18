import { fireEvent, render } from "@testing-library/react-native";
import { DownloadControl } from "@/components/DownloadControl";
import { STARTER_PACKAGE_ID } from "@/offline/approvedDownloads";
import type { DownloadSnapshot } from "@/offline/PwaOfflineDownloads";

let mockSnapshot: DownloadSnapshot;
let mockShellState = "unavailable";
const mockShellCheck = jest.fn(async () => {});
jest.mock("@/offline/PwaShellReadiness", () => ({
  getPwaShellReadiness: () => ({
    subscribe: () => () => {},
    getSnapshot: () => mockShellState,
    getServerSnapshot: () => mockShellState,
    check: mockShellCheck,
  }),
}));
const mockDownloads = {
  subscribe: () => () => {},
  getSnapshot: () => mockSnapshot,
  getServerSnapshot: () => mockSnapshot,
  hydrate: jest.fn(async () => {}),
  download: jest.fn(async () => {}),
  cancel: jest.fn(),
  remove: jest.fn(async () => {}),
  undoRemoval: jest.fn(async () => {}),
  purgeRemoval: jest.fn(async () => {}),
};
jest.mock("@/offline/PwaOfflineDownloads", () => ({
  getPwaOfflineDownloads: () => mockDownloads,
}));

beforeEach(() => {
  jest.clearAllMocks();
  mockShellState = "unavailable";
  mockSnapshot = {
    supported: true,
    busy: false,
    removed: false,
    freeBytes: 100_000_000,
    persistent: false,
    error: null,
    record: {
      schemaVersion: 2,
      packageId: STARTER_PACKAGE_ID,
      catalogRevision: "test",
      revision: "1",
      status: "not-downloaded",
      bytesDownloaded: 0,
      totalBytes: 16_622_588,
      verifiedAssetIds: [],
      attempt: 0,
      failureCode: null,
    },
  };
});

describe("explicit offline download control", () => {
  it("keeps verified saved audio on private review without impossible offline retries", async () => {
    mockShellState = "online-only";
    mockSnapshot.record.status = "available";
    const screen = await render(
      <DownloadControl workId="field-rain-006-quiet-weather" />,
    );
    expect(screen.getByText("SAVE AUDIO ON THIS DEVICE")).toBeTruthy();
    expect(screen.getByText(/Downloaded and verified/)).toBeTruthy();
    expect(
      screen.getByText(/private review needs an internet connection to open/),
    ).toBeTruthy();
    expect(
      screen.queryByText(
        /Offline reopening is not ready|close all App Relax|Check downloads before going offline/,
      ),
    ).toBeNull();
    expect(
      screen.queryByRole("button", { name: "Check offline readiness" }),
    ).toBeNull();
    expect(mockShellCheck).not.toHaveBeenCalled();
    expect(mockDownloads.hydrate).toHaveBeenCalledWith(
      "field-rain-006-quiet-weather",
    );
    for (const action of [
      mockDownloads.download,
      mockDownloads.remove,
      mockDownloads.purgeRemoval,
      mockDownloads.undoRemoval,
    ]) {
      expect(action).not.toHaveBeenCalled();
    }
  });
  it("keeps review-only audio playable without querying an unapproved download", async () => {
    const screen = await render(
      <DownloadControl workId="respiro-hatha-1-01" />,
    );
    expect(
      screen.getByText("Review audio · online listening only."),
    ).toBeTruthy();
    expect(mockDownloads.hydrate).not.toHaveBeenCalled();
    expect(mockDownloads.download).not.toHaveBeenCalled();
    expect(mockShellCheck).not.toHaveBeenCalled();
  });
  it("never presents a verified audio download as proof of app reopening", async () => {
    mockSnapshot.record.status = "available";
    const screen = await render(<DownloadControl />);
    expect(screen.getByText(/Downloaded and verified/)).toBeTruthy();
    expect(screen.getByText(/Offline reopening is not ready/)).toBeTruthy();
    await fireEvent.press(
      screen.getByRole("button", { name: "Check offline readiness" }),
    );
    expect(mockShellCheck).toHaveBeenCalled();
  });
  it("checks storage without downloading until the user presses Download", async () => {
    const screen = await render(<DownloadControl />);
    expect(mockDownloads.hydrate).toHaveBeenCalledWith(STARTER_PACKAGE_ID);
    expect(mockDownloads.download).not.toHaveBeenCalled();
    expect(
      screen.getByText("Quiet Weather · Sheltered Rain · Soft Weather"),
    ).toBeTruthy();
    await fireEvent.press(
      screen.getByRole("button", { name: "Download · 16.6 MB" }),
    );
    expect(mockDownloads.download).toHaveBeenCalledWith([STARTER_PACKAGE_ID]);
  });
  it("exposes progress and an enabled Cancel during a download", async () => {
    mockSnapshot = {
      ...mockSnapshot,
      busy: true,
      record: {
        ...mockSnapshot.record,
        status: "downloading",
        bytesDownloaded: 1_000_000,
      },
    };
    const screen = await render(<DownloadControl />);
    expect(screen.getByText("Downloading 1.0 MB of 16.6 MB")).toBeTruthy();
    await fireEvent.press(
      screen.getByRole("button", { name: "Cancel download" }),
    );
    expect(mockDownloads.cancel).toHaveBeenCalledTimes(1);
  });
  it("keeps removal reversible until a separate permanent space release", async () => {
    mockSnapshot = { ...mockSnapshot, removed: true };
    const screen = await render(
      <DownloadControl workId="field-rain-006-quiet-weather" />,
    );
    await fireEvent.press(screen.getByRole("button", { name: "Undo removal" }));
    expect(mockDownloads.undoRemoval).toHaveBeenCalledWith(
      "field-rain-006-quiet-weather",
    );
    expect(mockDownloads.purgeRemoval).not.toHaveBeenCalled();
    await fireEvent.press(
      screen.getByRole("button", { name: "Free space permanently" }),
    );
    expect(mockDownloads.purgeRemoval).toHaveBeenCalledWith(
      "field-rain-006-quiet-weather",
    );
  });
  it("offers an actionable recovery for a missing or corrupt copy", async () => {
    mockSnapshot = {
      ...mockSnapshot,
      record: {
        ...mockSnapshot.record,
        status: "failed",
        failureCode: "integrity-mismatch",
      },
    };
    const screen = await render(
      <DownloadControl workId="field-rain-006-quiet-weather" />,
    );
    expect(screen.getByRole("alert")).toBeTruthy();
    await fireEvent.press(
      screen.getByRole("button", { name: "Retry download" }),
    );
    expect(mockDownloads.download).toHaveBeenCalledWith([
      "field-rain-006-quiet-weather",
    ]);
  });
});
