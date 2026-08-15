import { fireEvent, render } from "@testing-library/react-native";
import SoundscapesScreen from "@/app/soundscapes";
import YogaScreen from "@/app/yoga";
import { CONSUMER_OUTCOMES } from "@/content/productShell";

const mockPush = jest.fn();
const mockReplace = jest.fn();

jest.mock("expo-router", () => ({
  useRouter: () => ({ push: mockPush, replace: mockReplace }),
}));

jest.mock("expo-linear-gradient", () => ({
  LinearGradient: "LinearGradient",
}));

describe("M3 product tabs", () => {
  beforeEach(() => {
    mockPush.mockClear();
    mockReplace.mockClear();
  });

  it("puts the six consumer functions before evocative naming", () => {
    expect(CONSUMER_OUTCOMES.map((outcome) => outcome.id)).toEqual([
      "yoga",
      "massage",
      "relax",
      "meditation",
      "sleep",
      "focus",
    ]);
    expect(CONSUMER_OUTCOMES.map((outcome) => outcome.cta)).toEqual([
      "Start your yoga session",
      "Set the room for massage",
      "Relax now",
      "Begin meditation",
      "Prepare for sleep",
      "Focus",
    ]);
    for (const outcome of CONSUMER_OUTCOMES) {
      expect(outcome.homeFormat).toBeTruthy();
      expect(outcome.plannedFormat).toMatch(/Future|future/);
      expect(outcome.evocativeTitle).toBeTruthy();
      expect(outcome).not.toHaveProperty("audioPresetId");
    }
  });

  it("presents four planned Yoga durations without audio", async () => {
    const screen = await render(<YogaScreen />);
    expect(screen.getByText("Begin your practice.")).toBeTruthy();
    expect(
      screen.getByText("Choose a journey shaped to move with you."),
    ).toBeTruthy();
    expect(screen.getByText("Start your yoga session")).toBeTruthy();
    expect(screen.getByText("CHOOSE A FUTURE DURATION")).toBeTruthy();
    expect(screen.getAllByText("IN PRODUCTION")).toHaveLength(5);
    expect(
      screen.getByTestId("product-tab-yoga").props.accessibilityState,
    ).toEqual({ selected: true });
    for (const id of ["arrive-20", "move-30", "deepen-45", "unfold-60"]) {
      expect(
        screen.getByTestId(`production-card-${id}`).props.accessibilityState,
      ).toEqual({ disabled: true });
    }
    fireEvent.press(screen.getByTestId("product-tab-soundscapes"));
    expect(mockReplace).toHaveBeenCalledWith("/soundscapes");
  });

  it("presents curated soundscape families with a visible cosmic branch", async () => {
    const screen = await render(<SoundscapesScreen />);
    expect(screen.getByText("Where would you like to go?")).toBeTruthy();
    expect(screen.getByText("Standalone works")).toBeTruthy();
    expect(screen.getByText("Elemental Worlds")).toBeTruthy();
    expect(screen.getByText("Field recordings")).toBeTruthy();
    expect(screen.getByText("Cosmic / Zen ambient")).toBeTruthy();
    expect(screen.getByText("Esoteric Series")).toBeTruthy();
    expect(screen.getAllByText("IN PRODUCTION")).toHaveLength(5);
    expect(
      screen.getByTestId("production-card-cosmic-zen-ambient").props
        .accessibilityState,
    ).toEqual({ disabled: true });
    expect(
      screen.getByTestId("soundscapes-editorial-artwork", {
        includeHiddenElements: true,
      }).props.accessible,
    ).toBe(false);
    expect(screen.queryByTestId(/production-artwork-/)).toBeNull();
  });
});
