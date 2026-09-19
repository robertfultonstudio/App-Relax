import { fireEvent, render, within } from "@testing-library/react-native";
import { StyleSheet } from "react-native";
import HomeScreen from "@/app/moments";
import PwaHome from "@/app-pwa/moments";
import { CONSUMER_OUTCOMES, PRODUCT_TABS } from "@/content/productShell";
import {
  M6_HOME_PAINTING,
  RITUALS_HOME_BACKGROUND,
} from "@/design/shellArtwork";
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
  it("renders the private PWA as one full-bleed field with one vertical destination list", async () => {
    const screen = await render(<PwaHome />);
    expect(screen.queryByTestId("home-music-library")).toBeNull();
    expect(screen.queryByText(/music library|MUSIC-REVIEW/)).toBeNull();
    expect(screen.getByText("Scegli il tuo momento")).toBeTruthy();
    expect(screen.queryByText("What do you need right now?")).toBeNull();
    const list = screen.getByTestId("outcome-list");
    expect(within(list).getAllByRole("button")).toHaveLength(6);
    expect(StyleSheet.flatten(list.props.style).flexDirection).not.toBe("row");
    const labels = [
      "Meditazione",
      "Yoga",
      "Massaggio",
      "Relax",
      "Sonno",
      "Concentrazione",
    ];
    expect(
      within(list)
        .getAllByRole("button")
        .map((item) => item.props.accessibilityLabel),
    ).toEqual(labels);
    for (const label of labels) {
      const destination = within(list).getByRole("button", { name: label });
      const style = StyleSheet.flatten(destination.props.style);
      expect(style.minHeight).toBeGreaterThanOrEqual(48);
      expect(style.borderWidth ?? 0).toBe(0);
      expect(style.borderRadius ?? 0).toBe(0);
      expect(style.backgroundColor).toBeUndefined();
    }
    expect(
      screen.getByTestId("home-full-bleed-artwork", {
        includeHiddenElements: true,
      }).props.source,
    ).toBe(RITUALS_HOME_BACKGROUND);
    expect(
      mockAudio.controller.startSelectionFromUserGesture,
    ).not.toHaveBeenCalled();
  });
  beforeEach(() => {
    mockPush.mockClear();
    mockReplace.mockClear();
    mockAudio = createConsumerAudioMock();
  });

  it("keeps all six needs as live targets over the approved continuous painting", async () => {
    const screen = await render(<HomeScreen />);
    expect(screen.getByText("App Relax")).toBeTruthy();
    expect(screen.getByRole("button", { name: "Settings" })).toBeTruthy();
    expect(screen.getByText("What do you need right now?")).toBeTruthy();
    expect(
      screen.getByText(
        "Choose your moment. Press Play. Leave the phone behind.",
      ),
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
    ).toMatchObject({ flexDirection: "row", flexWrap: "wrap" });
    expect(
      within(screen.getByTestId("outcome-grid")).getAllByRole("button"),
    ).toHaveLength(6);
    for (const outcome of CONSUMER_OUTCOMES) {
      const tile = screen.getByTestId(`outcome-${outcome.id}`);
      expect(StyleSheet.flatten(tile.props.style)).toMatchObject({
        width: "50%",
      });
      expect(
        StyleSheet.flatten(tile.props.style).minHeight,
      ).toBeGreaterThanOrEqual(190);
      expect(tile.props.accessibilityLabel).toBe(
        `${outcome.functionLabel}. Open and press Play.`,
      );
      const label = within(tile).getByText(outcome.functionLabel.toLowerCase());
      expect(StyleSheet.flatten(label.props.style)).toMatchObject({
        fontSize: 19,
        lineHeight: 26,
      });
      await fireEvent.press(tile);
      expect(mockPush).toHaveBeenCalledWith(`/outcome/${outcome.id}`);
    }
    const background = screen.getByTestId("rituals-home-background", {
      includeHiddenElements: true,
    });
    expect(background.props.accessible).toBe(false);
    expect(background.props.source).toBe(M6_HOME_PAINTING);
    expect(StyleSheet.flatten(background.props.style)).toMatchObject({
      height: 844,
      width: "100%",
    });
  });

  it("keeps the catalogue out of main tabs and offers a distinct complete Yoga path", async () => {
    expect(PRODUCT_TABS).toEqual([
      { id: "rituals", label: "HOME", route: "/moments" },
      { id: "yoga", label: "HATHA", route: "/yoga" },
    ]);
    const screen = await render(<HomeScreen />);
    expect(screen.queryByTestId("product-tab-soundscapes")).toBeNull();
    await fireEvent.press(screen.getByTestId("product-tab-yoga"));
    expect(mockReplace).toHaveBeenCalledWith("/yoga");
    await fireEvent.press(screen.getByText("Settings"));
    expect(mockPush).toHaveBeenCalledWith("/settings");
  });
});
