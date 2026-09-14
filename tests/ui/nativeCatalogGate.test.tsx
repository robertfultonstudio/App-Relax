import { render, fireEvent, waitFor } from "@testing-library/react-native";
import { Text } from "react-native";
import { NativeCatalogGate } from "@/components/NativeCatalogGate.native";
import {
  NativeCatalogStore,
  type PrivateCatalogPort,
} from "@/offline/NativeCatalogStore";
import { createHash } from "node:crypto";
const mockBytes = new Uint8Array([1]);
const mockFiles = new Map<string, Uint8Array>();
const mockPort: PrivateCatalogPort = {
  initialize: async () => {},
  stat: async (key) => (mockFiles.has(key) ? { bytes: 1, modified: 1 } : null),
  receipt: async () => null,
  saveReceipt: async () => {},
  freeBytes: () => 1e10,
  copy: async (_uri, key) => {
    mockFiles.set(key, mockBytes);
  },
  read: async () => mockBytes,
  move: async (from, to) => {
    mockFiles.set(to, mockBytes);
    mockFiles.delete(from);
  },
  remove: async (key) => {
    mockFiles.delete(key);
  },
  uri: (key) => "file:///private/" + key,
  yield: async () => {},
};
const mockStore = new NativeCatalogStore(
  [
    {
      workId: "sound",
      filename: "sound.flac",
      bytes: 1,
      frames: 1,
      sha256: createHash("sha256").update(mockBytes).digest("hex"),
    },
  ],
  mockPort,
);
const mockPick = jest.fn();
jest.mock("expo-file-system", () => {
  class File {
    name = "sound.flac";
    uri = "content://selected/sound";
  }
  return {
    File,
    Directory: {
      pickDirectoryAsync: () =>
        mockPick().then(() => ({ list: () => [new File()] })),
    },
  };
});
jest.mock("@/offline/nativeCatalogRuntime", () => ({
  getNativeCatalog: () => mockStore,
}));
jest.mock("@/domain/sessions/playbackAvailability", () => ({
  isNativeCatalogPreview: () => true,
}));
jest.mock("expo-linear-gradient", () => ({ LinearGradient: "LinearGradient" }));
it("keeps consumer unmounted until an actual verified import, and treats picker cancellation honestly", async () => {
  mockPick.mockRejectedValueOnce(
    new Error("The file picker was cancelled by the user"),
  );
  const screen = await render(
    <NativeCatalogGate>
      <Text>Consumer home</Text>
    </NativeCatalogGate>,
  );
  expect(screen.queryByText("Consumer home")).toBeNull();
  await fireEvent.press(screen.getByLabelText("Import audio folder"));
  await waitFor(() =>
    expect(screen.getByRole("alert")).toHaveTextContent(/No folder selected/),
  );
  expect(screen.queryByText("Consumer home")).toBeNull();
  mockPick.mockResolvedValueOnce(undefined);
  await fireEvent.press(screen.getByLabelText("Import audio folder"));
  await waitFor(() => expect(screen.getByText("Consumer home")).toBeTruthy());
});
