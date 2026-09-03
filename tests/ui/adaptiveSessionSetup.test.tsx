import { fireEvent, render, waitFor } from "@testing-library/react-native";
import { AdaptiveSessionSetup } from "@/components/AdaptiveSessionSetup";

const mockPush = jest.fn();

jest.mock("expo-router", () => ({
  useRouter: () => ({ push: mockPush }),
}));

describe("AdaptiveSessionSetup", () => {
  beforeEach(() => mockPush.mockClear());

  it("keeps the primary flow to duration then Start", async () => {
    const screen = await render(
      <AdaptiveSessionSetup outcome="yoga" qaAvailable />,
    );
    expect(screen.getByText("01 / CHOOSE A DURATION")).toBeTruthy();
    expect(screen.queryByTestId("session-customize-panel")).toBeNull();
    expect(screen.getByTestId("duration-30").props.accessibilityState).toEqual({
      selected: true,
    });

    await waitFor(() =>
      expect(
        screen.getByTestId("start-adaptive-session").props.accessibilityState,
      ).toEqual({ disabled: false }),
    );
    await fireEvent.press(screen.getByTestId("duration-45"));
    await fireEvent.press(screen.getByTestId("start-adaptive-session"));
    expect(mockPush).toHaveBeenCalledWith(
      expect.stringMatching(/^\/adaptive-session\/yoga\?duration=45&start=1$/),
    );
  });

  it("shows voice choice only after Guided is selected and blocks false content", async () => {
    const screen = await render(
      <AdaptiveSessionSetup outcome="massage" qaAvailable />,
    );
    await fireEvent.press(screen.getByText("CUSTOMIZE"));
    expect(screen.queryByText("VOICE")).toBeNull();
    await fireEvent.press(screen.getByLabelText("Guided"));
    expect(screen.getByText("VOICE")).toBeTruthy();
    expect(screen.getByText("RECORDED VOICES · IN PRODUCTION")).toBeTruthy();
    expect(
      screen.getByTestId("start-adaptive-session").props.accessibilityState,
    ).toEqual({
      disabled: true,
    });
    await fireEvent.press(screen.getByLabelText("Sound only"));
    expect(screen.queryByText("VOICE")).toBeNull();
    await waitFor(() =>
      expect(
        screen.getByTestId("start-adaptive-session").props.accessibilityState,
      ).toEqual({ disabled: false }),
    );
  });

  it("marks phone playback unavailable rather than pretending native support", async () => {
    const screen = await render(
      <AdaptiveSessionSetup outcome="relax" qaAvailable={false} />,
    );
    expect(
      screen.getByText("PHONE SESSION PLAYBACK · IN PRODUCTION"),
    ).toBeTruthy();
    expect(
      screen.getByTestId("start-adaptive-session").props.accessibilityState,
    ).toEqual({
      disabled: true,
    });
  });
});
