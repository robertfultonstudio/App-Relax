import { fireEvent, render } from "@testing-library/react-native";
import { StyleSheet } from "react-native";
import HomeScreen from "@/app/index";

const mockPush = jest.fn();
const mockReplace = jest.fn();

jest.mock("expo-router", () => ({
  useRouter: () => ({ push: mockPush, replace: mockReplace }),
}));

jest.mock("expo-linear-gradient", () => ({
  LinearGradient: "LinearGradient",
}));

describe("M3 Rituals shell", () => {
  beforeEach(() => {
    mockPush.mockClear();
    mockReplace.mockClear();
  });

  it("renders six outcome-first actions with no playable audio", async () => {
    const screen = await render(<HomeScreen />);
    expect(screen.getByText("What do you need right now?")).toBeTruthy();
    expect(
      screen.getByText(
        "Choose your moment. Press start. Leave the phone behind.",
      ),
    ).toBeTruthy();
    expect(
      screen.getByText(
        "Consumer sessions are still in production. No audio is available yet.",
      ),
    ).toBeTruthy();
    expect(screen.getByText("Start your yoga session")).toBeTruthy();
    expect(screen.getByText("Set the room for massage")).toBeTruthy();
    expect(screen.getByText("Relax now")).toBeTruthy();
    expect(screen.getByText("Begin meditation")).toBeTruthy();
    expect(screen.getByText("Prepare for sleep")).toBeTruthy();
    expect(screen.getByText("Focus")).toBeTruthy();
    expect(screen.getByText("Quiet Tide")).toBeTruthy();
    expect(screen.getByText("Cedar Light")).toBeTruthy();
    expect(screen.getByText("Aquarian Sky")).toBeTruthy();
    expect(screen.getByText("20 / 30 / 45 / 60 min")).toBeTruthy();
    expect(screen.getByText("Room format · duration planned")).toBeTruthy();
    expect(screen.getAllByText("IN PRODUCTION")).toHaveLength(6);
    expect(screen.getByTestId("outcome-grid")).toBeTruthy();
    const background = screen.getByTestId("rituals-home-background", {
      includeHiddenElements: true,
    });
    expect(background.props.accessible).toBe(false);
    expect(background.props.resizeMode).toBe("cover");
    expect(
      StyleSheet.flatten(
        screen.getByText(/Function first, sound later/).props.style,
      ).backgroundColor,
    ).toBe("rgba(248, 242, 232, 0.92)");
    for (const id of [
      "yoga",
      "massage",
      "relax",
      "meditation",
      "sleep",
      "focus",
    ]) {
      expect(
        screen.getByTestId(`outcome-artwork-${id}`, {
          includeHiddenElements: true,
        }).props.accessible,
      ).toBe(false);
    }
    expect(screen.queryByText("AVAILABLE")).toBeNull();
    expect(screen.getByTestId("outcome-yoga").props.accessibilityState).toEqual(
      { disabled: true },
    );
    expect(screen.getByTestId("outcome-yoga").props.accessibilityLabel).toBe(
      "YOGA. Start your yoga session. 20 / 30 / 45 / 60 min. Future title: Cedar Ascent. In production.",
    );
  });

  it("keeps consumer cards blocked and exposes tab navigation", async () => {
    const screen = await render(<HomeScreen />);
    fireEvent.press(screen.getByTestId("outcome-yoga"));
    fireEvent.press(screen.getByTestId("outcome-massage"));
    expect(mockPush).not.toHaveBeenCalledWith("/session/deep-sleep-432");

    fireEvent.press(screen.getByTestId("product-tab-yoga"));
    expect(mockReplace).toHaveBeenCalledWith("/yoga");
  });

  it("gives all six functions the same compact grid footprint", async () => {
    const screen = await render(<HomeScreen />);
    const tileStyles = [
      "yoga",
      "massage",
      "relax",
      "meditation",
      "sleep",
      "focus",
    ].map((id) =>
      StyleSheet.flatten(screen.getByTestId(`outcome-${id}`).props.style),
    );

    for (const style of tileStyles) {
      expect(style.width).toBe("48%");
      expect(style.minHeight).toBe(356);
    }
  });
});
