import { fireEvent, render, within } from "@testing-library/react-native";
import { StyleSheet } from "react-native";
import HomeScreen from "@/app/index";
import { CONSUMER_OUTCOMES, PRODUCT_TABS } from "@/content/productShell";
import { OUTCOME_EDITORIAL_SURFACE } from "@/design/editorialTheme";
import { OUTCOME_ARTWORK } from "@/design/outcomeArtwork";
import { createConsumerAudioMock } from "./helpers/consumerAudioMock";

const mockPush = jest.fn();
const mockReplace = jest.fn();
let mockAudio = createConsumerAudioMock();

jest.mock("expo-router", () => ({
  useFocusEffect: (callback: () => void) => {
    const { useEffect } = jest.requireActual("react");
    useEffect(callback, [callback]);
  },
  useRouter: () => ({ push: mockPush, replace: mockReplace }),
}));
jest.mock("expo-linear-gradient", () => ({ LinearGradient: "LinearGradient" }));
jest.mock("@/audio/AudioProvider", () => ({
  useAudioSession: () => mockAudio,
}));
jest.mock("@/state/lastListeningPersistence", () => ({
  loadLastListening: jest.fn(async () => null),
}));

describe("compact outcome-first Home", () => {
  beforeEach(() => {
    mockPush.mockClear();
    mockReplace.mockClear();
    mockAudio = createConsumerAudioMock();
  });

  it("keeps all six needs and existing artworks in a compact two-column grid", async () => {
    const screen = await render(<HomeScreen />);
    expect(screen.getByText("APP RELAX")).toBeTruthy();
    expect(screen.getByText("What do you need right now?")).toBeTruthy();
    expect(
      screen.getByText("Choose your moment and how long you have."),
    ).toBeTruthy();
    expect(
      screen.queryByRole("button", { name: "Play your last session" }),
    ).toBeNull();
    expect(mockAudio.controller.prepareSelection).not.toHaveBeenCalled();
    expect(
      mockAudio.controller.startSelectionFromUserGesture,
    ).not.toHaveBeenCalled();
    expect(screen.queryByText("FEATURED")).toBeNull();
    expect(screen.queryByText("CHOOSE A DURATION")).toBeNull();
    expect(screen.queryByText(/Personalisation stays/)).toBeNull();
    expect(screen.queryByText("IN PRODUCTION")).toBeNull();
    expect(
      StyleSheet.flatten(screen.getByTestId("outcome-grid").props.style),
    ).toMatchObject({ flexDirection: "row", flexWrap: "wrap", rowGap: 10 });
    expect(
      within(screen.getByTestId("outcome-grid")).getAllByRole("button"),
    ).toHaveLength(6);
    for (const outcome of CONSUMER_OUTCOMES) {
      const tile = screen.getByTestId(`outcome-${outcome.id}`);
      expect(StyleSheet.flatten(tile.props.style)).toMatchObject({
        width: "48%",
        minHeight: 148,
      });
      expect(tile.props.accessibilityLabel).toBe(
        `${outcome.functionLabel}. Choose your listening time.`,
      );
      const label = within(tile).getByText(outcome.functionLabel);
      expect(StyleSheet.flatten(label.props.style)).toMatchObject({
        fontSize: 14,
        lineHeight: 20,
      });
      expect(StyleSheet.flatten(label.parent?.props.style)).toMatchObject({
        backgroundColor: OUTCOME_EDITORIAL_SURFACE[outcome.id],
      });
      const artwork = screen.getByTestId(`outcome-artwork-${outcome.id}`, {
        includeHiddenElements: true,
      });
      expect(artwork.props.accessible).toBe(false);
      expect(artwork.props.source).toBe(OUTCOME_ARTWORK[outcome.id]);
      expect(StyleSheet.flatten(artwork.parent?.props.style)).toMatchObject({
        height: 102,
      });
      await fireEvent.press(tile);
      expect(mockPush).toHaveBeenCalledWith(`/outcome/${outcome.id}`);
    }
    const background = screen.getByTestId("rituals-home-background", {
      includeHiddenElements: true,
    });
    expect(background.props.accessible).toBe(false);
    expect(StyleSheet.flatten(background.props.style)).toMatchObject({
      height: "100%",
      width: "100%",
    });
  });

  it("offers Home and Sounds once, with Yoga remaining a need rather than a duplicate tab", async () => {
    expect(PRODUCT_TABS).toEqual([
      { id: "rituals", label: "HOME", route: "/" },
      { id: "soundscapes", label: "SOUNDS", route: "/soundscapes" },
    ]);
    const screen = await render(<HomeScreen />);
    expect(screen.queryByTestId("product-tab-yoga")).toBeNull();
    await fireEvent.press(screen.getByTestId("product-tab-soundscapes"));
    expect(mockReplace).toHaveBeenCalledWith("/soundscapes");
    await fireEvent.press(screen.getByText("Settings"));
    expect(mockPush).toHaveBeenCalledWith("/settings");
  });
});
