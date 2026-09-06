import {
  fireEvent,
  render,
  waitFor,
  within,
} from "@testing-library/react-native";
import OutcomeCatalogScreen from "@/app/outcome/[outcomeId]";
import SoundscapesScreen from "@/app/soundscapes";
import YogaScreen from "@/app/yoga";
import {
  getVisibleConsumerWorks,
  getWorksForOutcome,
  isPlayableWork,
} from "@/content/consumerCatalog";
import { CONSUMER_OUTCOMES } from "@/content/productShell";
import { createConsumerAudioMock } from "./helpers/consumerAudioMock";

const mockPush = jest.fn();
const mockReplace = jest.fn();
let mockParams: Record<string, string> = {};
let mockAudio = createConsumerAudioMock();

jest.mock("expo-router", () => ({
  useLocalSearchParams: () => mockParams,
  useRouter: () => ({ push: mockPush, replace: mockReplace }),
}));

jest.mock("expo-linear-gradient", () => ({
  LinearGradient: "LinearGradient",
}));
jest.mock("@/audio/AudioProvider", () => ({
  useAudioSession: () => mockAudio,
}));
jest.mock("@/domain/sessions/playbackAvailability", () => ({
  isAdaptivePlaybackAvailable: () => true,
  isPwaWebSurface: () => false,
}));

describe("consumer product tabs", () => {
  beforeEach(() => {
    mockPush.mockClear();
    mockReplace.mockClear();
    mockParams = {};
    mockAudio = createConsumerAudioMock();
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
    expect(screen.getByText("HOW LONG DO YOU HAVE?")).toBeTruthy();
    for (const duration of [20, 30, 45, 60, 90]) {
      expect(screen.getByTestId(`duration-${duration}`)).toBeTruthy();
    }
    await waitFor(() =>
      expect(screen.getByTestId("start-adaptive-session")).toBeEnabled(),
    );
    expect(screen.queryByText(/IN PRODUCTION/)).toBeNull();
    expect(screen.getAllByRole("radio", { checked: true })).toHaveLength(1);
    expect(screen.queryByTestId("product-tab-yoga")).toBeNull();
    await fireEvent.press(screen.getByTestId("product-tab-soundscapes"));
    expect(mockReplace).toHaveBeenCalledWith("/soundscapes");
  });

  it("keeps duration first and exposes every matching individual sound", async () => {
    mockParams = { outcomeId: "relax" };
    const screen = await render(<OutcomeCatalogScreen />);
    expect(screen.getByText("HOW LONG DO YOU HAVE?")).toBeTruthy();
    expect(screen.getByTestId("duration-20")).toBeTruthy();
    expect(screen.getByTestId("outcome-sound-library")).toBeTruthy();
    expect(screen.getAllByTestId(/^consumer-work-/)).toHaveLength(2);
    await fireEvent.press(screen.getByTestId("duration-45"));
    await fireEvent.press(screen.getByText(/^View all \d+ sounds$/));
    expect(screen.queryByTestId("consumer-work-deep-river")).toBeNull();
    expect(screen.getByTestId("consumer-work-pink-noise")).toBeEnabled();
    expect(
      screen.getByTestId("consumer-work-pink-noise").props.accessibilityLabel,
    ).toBe("Open Pink Noise, 45 minutes for relax");
    await fireEvent.press(screen.getByTestId("consumer-work-pink-noise"));
    expect(mockPush).toHaveBeenCalledWith(
      "/listen/pink-noise?outcome=relax&duration=45",
    );
    expect(
      mockAudio.controller.startSelectionFromUserGesture,
    ).not.toHaveBeenCalled();
  });

  it.each([
    "meditation",
    "yoga",
    "massage",
    "relax",
    "sleep",
    "focus",
  ] as const)(
    "discloses the full playable %s library below the initial two choices",
    async (outcomeId) => {
      mockParams = { outcomeId };
      const screen = await render(<OutcomeCatalogScreen />);
      const library = within(screen.getByTestId("outcome-sound-library"));
      const works = getWorksForOutcome(outcomeId).filter(isPlayableWork);
      expect(library.getAllByTestId(/^consumer-work-/)).toHaveLength(
        Math.min(2, works.length),
      );
      if (works.length > 2) {
        await fireEvent.press(
          library.getByText(`View all ${works.length} sounds`),
        );
        expect(
          library.getByRole("button", { name: "Show fewer sounds" }).props
            .accessibilityState,
        ).toMatchObject({ expanded: true });
      }
      expect(
        library
          .getAllByTestId(/^consumer-work-/)
          .map((row) => row.props.testID),
      ).toEqual(works.map((work) => `consumer-work-${work.id}`));
    },
  );

  it("starts with a compact family index and exposes every non-rejected work on demand", async () => {
    const screen = await render(<SoundscapesScreen />);
    expect(screen.getByText("Find your sound.")).toBeTruthy();
    expect(screen.queryAllByTestId(/^consumer-work-/)).toHaveLength(0);
    const seen = new Set<string>();
    for (const family of ["sea", "rain", "stream", "music", "noise", "air"]) {
      const toggle = screen.getByTestId(`sound-family-toggle-${family}`);
      expect(toggle.props.accessibilityState.expanded).toBe(false);
      await fireEvent.press(toggle);
      expect(
        screen.getByTestId(`sound-family-toggle-${family}`).props
          .accessibilityState.expanded,
      ).toBe(true);
      expect(screen.getAllByTestId(/^soundscape-collection-/)).toHaveLength(1);
      for (const row of screen.getAllByTestId(/^consumer-work-/))
        seen.add(row.props.testID.replace("consumer-work-", ""));
    }
    expect([...seen].sort()).toEqual(
      getVisibleConsumerWorks()
        .filter(
          (work) => work.listeningStatus !== "REJECTED — REPLACEMENT REQUIRED",
        )
        .map(({ id }) => id)
        .sort(),
    );
    expect(seen.has("soft-air")).toBe(false);
    expect(seen.has("eclipse-veil")).toBe(false);
    expect(seen.has("stillwater-halo")).toBe(false);
    expect(
      screen.queryByText(/IMAGE STUDY|READY TO LISTEN|LISTENING REVIEW/),
    ).toBeNull();
    await fireEvent.press(screen.getByTestId("sound-family-toggle-air"));
    expect(screen.queryAllByTestId(/^consumer-work-/)).toHaveLength(0);
    await fireEvent.press(screen.getByTestId("sound-family-toggle-noise"));
    await fireEvent.press(screen.getByTestId("consumer-work-pink-noise"));
    expect(mockPush).toHaveBeenCalledWith("/listen/pink-noise");
  });
});
