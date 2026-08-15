import { fireEvent, render } from "@testing-library/react-native";
import AudioTestScreen from "@/app/audio-test";
import SettingsScreen from "@/app/settings";

const mockBack = jest.fn();
const mockPush = jest.fn();

jest.mock("expo-router", () => ({
  useRouter: () => ({ back: mockBack, push: mockPush }),
}));

jest.mock("expo-linear-gradient", () => ({
  LinearGradient: "LinearGradient",
}));

describe("M3 Audio Test boundary", () => {
  beforeEach(() => mockPush.mockClear());

  it("links to Audio Test from Settings rather than consumer tabs", async () => {
    const screen = await render(<SettingsScreen />);
    fireEvent.press(screen.getByText("Audio Test — Test only"));
    expect(mockPush).toHaveBeenCalledWith("/audio-test");
  });

  it("labels the engine material as test-only before opening playback", async () => {
    const screen = await render(<AudioTestScreen />);
    expect(screen.getByText("TEST ONLY")).toBeTruthy();
    expect(screen.getByText("Engine room.")).toBeTruthy();
    expect(
      screen.getByText(/not part of the consumer catalogue/i),
    ).toBeTruthy();
    fireEvent.press(screen.getByTestId("open-audio-test-player"));
    expect(mockPush).toHaveBeenCalledWith("/session/deep-sleep-432");
  });
});
