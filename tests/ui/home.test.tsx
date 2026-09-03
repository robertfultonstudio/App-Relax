import { fireEvent, render, within } from "@testing-library/react-native";
import { StyleSheet } from "react-native";
import HomeScreen from "@/app/index";
import { CONSUMER_OUTCOMES } from "@/content/productShell";
import { OUTCOME_EDITORIAL_SURFACE } from "@/design/editorialTheme";

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

  it("renders six outcome-first actions with local files or generators", async () => {
    const screen = await render(<HomeScreen />);
    expect(screen.getByText("What do you need right now?")).toBeTruthy();
    expect(
      screen.getByText(
        "Choose your moment. Press start. Leave the phone behind.",
      ),
    ).toBeTruthy();
    expect(
      screen.getByText(
        "Lossless works and real-time noise colours are available locally. Available works remain provisional; rejected material stays technical-only.",
      ),
    ).toBeTruthy();
    expect(screen.getByText("Start your yoga session")).toBeTruthy();
    expect(screen.getByText("Set the room for massage")).toBeTruthy();
    expect(screen.getByText("Relax now")).toBeTruthy();
    expect(screen.getByText("Begin meditation")).toBeTruthy();
    expect(screen.getByText("Prepare for sleep")).toBeTruthy();
    expect(screen.getByText("Focus")).toBeTruthy();
    expect(screen.getByText("Green Noise")).toBeTruthy();
    expect(screen.getAllByText("White Noise")).toHaveLength(2);
    expect(screen.getByText("Deep River")).toBeTruthy();
    expect(screen.getByText("Eclipse Veil")).toBeTruthy();
    expect(screen.getByText("Moon Drone")).toBeTruthy();
    expect(screen.queryByText("Soft Air")).toBeNull();
    expect(screen.getByText("20 / 30 / 45 / 60 min")).toBeTruthy();
    expect(screen.getByText("Room format · duration planned")).toBeTruthy();
    expect(screen.getAllByText("START HERE")).toHaveLength(6);
    expect(screen.queryByText("DELIVERY REQUIRED")).toBeNull();
    expect(screen.getByTestId("outcome-grid")).toBeTruthy();
    expect(
      within(screen.getByTestId("outcome-meditation")).getByText("01"),
    ).toBeTruthy();
    expect(
      within(screen.getByTestId("outcome-yoga")).getByText("02"),
    ).toBeTruthy();
    const background = screen.getByTestId("rituals-home-background", {
      includeHiddenElements: true,
    });
    expect(background.props.accessible).toBe(false);
    expect(background.props.resizeMode).toBe("cover");
    expect(StyleSheet.flatten(background.props.style)).toMatchObject({
      height: "100%",
      width: "100%",
    });
    expect(
      StyleSheet.flatten(
        screen.getByText(/Function first\. Each consumer work/).props.style,
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
      const artwork = screen.getByTestId(`outcome-artwork-${id}`, {
        includeHiddenElements: true,
      });
      expect(artwork.props.accessible).toBe(false);
      expect(StyleSheet.flatten(artwork.props.style)).toMatchObject({
        height: "100%",
        width: "100%",
      });
    }
    expect(screen.queryByText("IN PRODUCTION")).toBeNull();
    expect(screen.getByTestId("outcome-yoga").props.accessibilityState).toEqual(
      { disabled: false },
    );
    expect(screen.getByTestId("outcome-yoga").props.accessibilityLabel).toBe(
      "YOGA. Start your yoga session. 20 / 30 / 45 / 60 min. Audio available locally.",
    );
    for (const outcome of CONSUMER_OUTCOMES) {
      const tile = screen.getByTestId(`outcome-${outcome.id}`);
      expect(StyleSheet.flatten(tile.props.style)).toMatchObject({
        width: "48%",
        minHeight: 348,
      });
      const functionLabel = within(tile).getByText(outcome.functionLabel);
      const metaRow = functionLabel.parent;
      const copy = within(tile).getByText(outcome.cta).parent;
      expect(StyleSheet.flatten(metaRow?.props.style)).toMatchObject({
        backgroundColor: outcome.accent,
        borderBottomColor: outcome.wash,
      });
      expect(StyleSheet.flatten(copy?.props.style)).toMatchObject({
        backgroundColor: OUTCOME_EDITORIAL_SURFACE[outcome.id],
      });
    }
    await fireEvent.press(screen.getByTestId("outcome-yoga"));
    await fireEvent.press(screen.getByTestId("outcome-massage"));
    await fireEvent.press(screen.getByTestId("outcome-relax"));
    expect(mockPush).toHaveBeenCalledWith("/outcome/relax");
    expect(mockPush).toHaveBeenCalledWith("/outcome/yoga");
    expect(mockPush).toHaveBeenCalledWith("/outcome/massage");
    expect(mockPush).not.toHaveBeenCalledWith("/session/deep-sleep-432");

    await fireEvent.press(screen.getByTestId("product-tab-yoga"));
    expect(mockReplace).toHaveBeenCalledWith("/yoga");
  });
});
