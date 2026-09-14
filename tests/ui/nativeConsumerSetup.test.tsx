import { fireEvent, render, waitFor } from "@testing-library/react-native";
import OutcomeScreen from "@/app/outcome/[outcomeId]";
import { createConsumerAudioMock } from "./helpers/consumerAudioMock";
import manifest from "@/content/nativeAudioManifest.json";
import { setVerifiedNativeWorkIds } from "@/offline/nativeCatalogAvailability";
const mockAudio = createConsumerAudioMock();
const mockPush = jest.fn();
jest.mock("expo-router", () => ({
  useLocalSearchParams: () => ({ outcomeId: "yoga", practice: "complete" }),
  useRouter: () => ({
    push: mockPush,
    back: jest.fn(),
    canGoBack: () => false,
  }),
  useFocusEffect: (fn: () => void) => {
    const { useEffect } = jest.requireActual("react");
    useEffect(fn, [fn]);
  },
}));
jest.mock("expo-linear-gradient", () => ({ LinearGradient: "LinearGradient" }));
jest.mock("@/audio/AudioProvider", () => ({
  useAudioSession: () => mockAudio,
}));
jest.mock("@/domain/sessions/playbackAvailability", () => ({
  isNativeCatalogPreview: () => true,
  isAdaptivePlaybackAvailable: () => true,
  isPwaWebSurface: () => false,
}));
beforeEach(() => setVerifiedNativeWorkIds(manifest.files.map((f) => f.workId)));
afterEach(() => setVerifiedNativeWorkIds([]));
it("Android consumer offers real Hatha90 plus rain through the shared controller, without developer controls", async () => {
  const screen = await render(<OutcomeScreen />);
  await fireEvent.press(screen.getByTestId("duration-90"));
  await fireEvent.press(screen.getByRole("radio", { name: "Ambience Rain" }));
  await waitFor(() =>
    expect(screen.getByTestId("start-adaptive-session")).toBeEnabled(),
  );
  const selected = mockAudio.controller.prepareSelection.mock.calls.at(-1)![0];
  expect(selected).toMatchObject({
    kind: "adaptive",
    request: { durationMinutes: 90, natureFamily: "rain" },
    program: {
      plan: {
        totalDurationSeconds: 5400,
        natureMix: { selectedFamily: "rain" },
      },
    },
  });
  expect(screen.queryByTestId("open-complete-practice-review")).toBeNull();
  expect(screen.queryByText(/Playlist & development/)).toBeNull();
  await fireEvent.press(screen.getByTestId("start-adaptive-session"));
  expect(
    mockAudio.controller.startSelectionFromUserGesture,
  ).toHaveBeenCalledWith(selected);
});
