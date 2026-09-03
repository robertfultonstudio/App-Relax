import { fireEvent, render, within } from "@testing-library/react-native";
import OutcomeCatalogScreen from "@/app/outcome/[outcomeId]";
import SoundscapesScreen from "@/app/soundscapes";
import YogaScreen from "@/app/yoga";
import { CONSUMER_OUTCOMES } from "@/content/productShell";

const mockPush = jest.fn();
const mockReplace = jest.fn();
let mockParams: Record<string, string> = {};

jest.mock("expo-router", () => ({
  useLocalSearchParams: () => mockParams,
  useRouter: () => ({ push: mockPush, replace: mockReplace }),
}));

jest.mock("expo-linear-gradient", () => ({
  LinearGradient: "LinearGradient",
}));

describe("consumer product tabs", () => {
  beforeEach(() => {
    mockPush.mockClear();
    mockReplace.mockClear();
    mockParams = {};
  });

  it("puts the six consumer functions before evocative naming", () => {
    expect(CONSUMER_OUTCOMES.map((outcome) => outcome.id)).toEqual([
      "meditation",
      "yoga",
      "massage",
      "relax",
      "sleep",
      "focus",
    ]);
    expect(CONSUMER_OUTCOMES.map((outcome) => outcome.cta)).toEqual([
      "Begin meditation",
      "Start your yoga session",
      "Start your massage session",
      "Relax now",
      "Prepare for sleep",
      "Focus",
    ]);
    for (const outcome of CONSUMER_OUTCOMES) {
      expect(outcome.homeFormat).toBeTruthy();
      expect(outcome.plannedFormat).toMatch(/\d/);
      expect(outcome.evocativeTitle).toBeTruthy();
      expect(outcome).not.toHaveProperty("audioPresetId");
    }
  });

  it("presents the Yoga duration-first session setup", async () => {
    const screen = await render(<YogaScreen />);
    expect(screen.getByText("Begin your practice.")).toBeTruthy();
    expect(
      screen.getByText("Choose a journey shaped to move with you."),
    ).toBeTruthy();
    expect(screen.getByText("Start your yoga session")).toBeTruthy();
    expect(screen.getByText("01 / CHOOSE A DURATION")).toBeTruthy();
    for (const duration of [20, 30, 45, 60, 90]) {
      expect(screen.getByTestId(`duration-${duration}`)).toBeTruthy();
    }
    expect(
      screen.getByText("PHONE SESSION PLAYBACK · IN PRODUCTION"),
    ).toBeTruthy();
    expect(
      screen.getByTestId("product-tab-yoga").props.accessibilityState,
    ).toEqual({ selected: true });
    await fireEvent.press(screen.getByTestId("product-tab-soundscapes"));
    expect(mockReplace).toHaveBeenCalledWith("/soundscapes");
  });

  it("opens duration choice instead of a single featured work", async () => {
    mockParams = { outcomeId: "relax" };
    const screen = await render(<OutcomeCatalogScreen />);
    expect(screen.getByText("01 / CHOOSE A DURATION")).toBeTruthy();
    expect(screen.getByTestId("duration-20")).toBeTruthy();
    expect(screen.queryByTestId("consumer-work-deep-river")).toBeNull();
  });

  it("presents autonomous works grouped in open soundscape collections", async () => {
    const screen = await render(<SoundscapesScreen />);
    expect(screen.getByText("Where would you like to go?")).toBeTruthy();
    expect(screen.getByText("STANDALONE WORKS")).toBeTruthy();
    expect(screen.getByText("ELEMENTAL WORLDS · RAIN")).toBeTruthy();
    expect(screen.getByText("ELEMENTAL WORLDS · STREAM")).toBeTruthy();
    expect(screen.getByText("ELEMENTAL WORLDS · SEA")).toBeTruthy();
    expect(screen.getByText("ELEMENTAL WORLDS · AIR")).toBeTruthy();
    expect(screen.getByText("NOISE COLOURS")).toBeTruthy();
    expect(screen.getByText("COSMIC / ZEN AMBIENT")).toBeTruthy();
    expect(screen.getByText("ESOTERIC SERIES · AIR")).toBeTruthy();
    expect(screen.getByText("Eclipse Veil")).toBeTruthy();
    expect(screen.getByText("Deep River")).toBeTruthy();
    expect(screen.getByText("Silver Canopy")).toBeTruthy();
    expect(screen.getByText("Second Element: Air")).toBeTruthy();
    expect(screen.getAllByText("AVAILABLE")).toHaveLength(11);
    expect(screen.getAllByText("IN PRODUCTION")).toHaveLength(39);
    expect(screen.getAllByText("READY TO LISTEN")).toHaveLength(39);
    expect(screen.getByText("A new version is being prepared")).toBeTruthy();
    expect(screen.getByText("REJECTED AFTER LISTENING")).toBeTruthy();
    expect(
      screen.getByTestId("consumer-work-soft-air").props.accessibilityState,
    ).toEqual({ disabled: true });
    expect(
      screen.getByTestId("consumer-work-eclipse-veil").props.accessibilityState,
    ).toEqual({ disabled: false });
    const cosmicCollection = screen.getByTestId(
      "soundscape-collection-cosmic-zen-ambient",
    );
    const cosmicWorks = within(cosmicCollection).getAllByRole("button");
    expect(cosmicWorks[cosmicWorks.length - 1]?.props.testID).toBe(
      "consumer-work-stillwater-halo",
    );
    expect(
      screen.getByTestId("soundscapes-editorial-artwork", {
        includeHiddenElements: true,
      }).props.accessible,
    ).toBe(false);
    expect(screen.queryByTestId(/production-artwork-/)).toBeNull();
  });
});
