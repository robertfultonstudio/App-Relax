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

describe("consumer and technical Audio Test boundary", () => {
  beforeEach(() => mockPush.mockClear());

  it("keeps technical entry points out of consumer Settings while preserving useful listening information", async () => {
    const screen = await render(<SettingsScreen />);
    expect(
      screen.queryByText(/Audio Test|Moon Current|ATP01|Workbench/i),
    ).toBeNull();
    expect(screen.getByText("Autoplay")).toBeTruthy();
    expect(screen.getByText("Off")).toBeTruthy();
    expect(screen.getAllByRole("link")).toHaveLength(1);
    await fireEvent.press(screen.getByText("About listening"));
    expect(mockPush).toHaveBeenCalledTimes(1);
    expect(mockPush).toHaveBeenCalledWith("/legal");
    expect(mockPush).not.toHaveBeenCalledWith("/audio-test");
    expect(mockPush).not.toHaveBeenCalledWith("/qa-workbench");
  });

  it("labels the engine material as test-only before opening playback", async () => {
    const screen = await render(<AudioTestScreen />);
    expect(screen.getByText("TEST ONLY")).toBeTruthy();
    expect(screen.getByText("Engine room.")).toBeTruthy();
    expect(
      screen.getByText(/not part of the consumer catalogue/i),
    ).toBeTruthy();
    await fireEvent.press(screen.getByTestId("open-audio-test-player"));
    expect(mockPush).toHaveBeenCalledWith("/session/deep-sleep-432");
  });
});
