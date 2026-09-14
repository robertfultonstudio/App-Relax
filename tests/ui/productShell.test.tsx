import { fireEvent, render, waitFor } from "@testing-library/react-native";
import OutcomeCatalogScreen from "@/app/outcome/[outcomeId]";
import SoundscapesScreen from "@/app/soundscapes";
import QaSoundscapesScreen from "@/app-qa/soundscapes";
import MusicLibrary from "@/app-pwa/music";
import PwaOutcome from "@/app-pwa/outcome/[outcomeId]";
import { soundFamilyFor } from "@/content/soundFamilies";
import { REVIEW_REVISION } from "@/content/reviewRevision";
import { createWholeFileReviewProgram } from "@/pwa-review/createWholeFileReviewProgram";
import {
  getVisibleConsumerWorks,
  isPlayableWork,
} from "@/content/consumerCatalog";
import { CONSUMER_OUTCOMES } from "@/content/productShell";
import { createConsumerAudioMock } from "./helpers/consumerAudioMock";

const mockPush = jest.fn();
const mockReplace = jest.fn();
let mockParams: Record<string, string> = {};
let mockAudio = createConsumerAudioMock();

jest.mock("expo-router", () => ({
  useFocusEffect: (callback: () => void) => {
    const { useEffect } = jest.requireActual("react");
    useEffect(callback, [callback]);
  },
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
  isNativeCatalogPreview: () => false,
  isAdaptivePlaybackAvailable: () => true,
  isPwaWebSurface: () => false,
}));

describe("consumer product tabs", () => {
  it("opens every musical work directly without any sea, rain or noise selection", async () => {
    const screen = await render(<MusicLibrary />);
    expect(screen.getByText("Your music.")).toBeTruthy();
    expect(screen.getByTestId("music-review-version")).toHaveTextContent(
      REVIEW_REVISION,
    );
    expect(screen.queryByTestId("sound-family-index")).toBeNull();
    const expected = getVisibleConsumerWorks().filter(
      (work) => isPlayableWork(work) && soundFamilyFor(work) === "music",
    );
    const rows = screen.getAllByTestId(/^consumer-work-/);
    expect(rows).toHaveLength(expected.length);
    expect(rows.map((row) => row.props.testID).sort()).toEqual(
      expected.map((work) => `consumer-work-${work.id}`).sort(),
    );
    for (const work of expected) {
      await fireEvent.press(screen.getByTestId(`consumer-work-${work.id}`));
      expect(mockPush).toHaveBeenLastCalledWith(`/listen/${work.id}`);
    }
    expect(
      mockAudio.controller.startSelectionFromUserGesture,
    ).not.toHaveBeenCalled();
  });
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

  it.each(CONSUMER_OUTCOMES)(
    "keeps $id free of catalogue titles and starts one suitable file",
    async (outcome) => {
      mockParams = { outcomeId: outcome.id };
      const screen = await render(<OutcomeCatalogScreen />);
      expect(screen.getByRole("header", { name: outcome.cta })).toBeTruthy();
      expect(screen.queryByTestId("outcome-sound-library")).toBeNull();
      expect(screen.queryAllByTestId(/^consumer-work-/)).toHaveLength(0);
      expect(screen.queryByText("CHOOSE YOUR SOUND")).toBeNull();
      expect(screen.queryByText(/IN PRODUCTION/)).toBeNull();
      await waitFor(() =>
        expect(screen.getByTestId("start-immediate-session")).toBeEnabled(),
      );
      const selected =
        mockAudio.controller.prepareSelection.mock.calls.at(-1)![0];
      expect(selected.kind).toBe("single");
      if (selected.kind !== "single") throw new Error("Expected one file");
      expect(selected.program.work.cycle).toBeUndefined();
      expect(selected.program.work.loop).toBe(true);
      expect(screen.queryByText(selected.program.work.title)).toBeNull();
      await fireEvent.press(screen.getByTestId("start-immediate-session"));
      expect(
        mockAudio.controller.startSelectionFromUserGesture,
      ).toHaveBeenCalledWith(selected);
    },
  );

  it.each(CONSUMER_OUTCOMES)(
    "wires optional nature into the actual PWA $id entry route before Play",
    async (outcome) => {
      mockParams = { outcomeId: outcome.id };
      const screen = await render(<PwaOutcome />);
      await waitFor(() =>
        expect(screen.getByTestId("start-immediate-session")).toBeEnabled(),
      );
      expect(
        screen.getByRole("radio", { name: "Ambience Off" }).props
          .accessibilityState.checked,
      ).toBe(true);
      const original =
        mockAudio.controller.prepareSelection.mock.calls.at(-1)![0];
      if (original.kind !== "single")
        throw new Error("Expected music alone by default");
      await fireEvent.press(
        screen.getByRole("radio", { name: "Ambience Rain" }),
      );
      await waitFor(() =>
        expect(screen.getByTestId("start-immediate-session")).toBeEnabled(),
      );
      const selected =
        mockAudio.controller.prepareSelection.mock.calls.at(-1)![0];
      expect(selected).toMatchObject({
        kind: "adaptive",
        request: {
          outcome: outcome.id,
          natureFamily: "rain",
          listeningWorkId: original.program.work.id,
          includeNatureBed: true,
        },
      });
      if (selected.kind !== "adaptive")
        throw new Error("Expected music with nature");
      expect(
        selected.program.plan.segments.filter(
          (segment) => segment.lane === "primary",
        ),
      ).toHaveLength(1);
      const nature = selected.program.plan.segments.filter(
        (segment) => segment.lane === "nature",
      );
      expect(nature).toHaveLength(
        Math.max(2, Math.ceil(original.durationMinutes / 10)),
      );
      for (const segment of nature)
        expect(
          soundFamilyFor(
            selected.program.works.find((work) => work.id === segment.workId)!,
          ),
        ).toBe("rain");
      expect(screen.queryByText(original.program.work.title)).toBeNull();
      await fireEvent.press(screen.getByTestId("start-immediate-session"));
      expect(
        mockAudio.controller.startSelectionFromUserGesture,
      ).toHaveBeenCalledWith(selected);
      expect(mockPush).toHaveBeenCalledWith(
        `/listen/${original.program.work.id}?outcome=${outcome.id}&duration=${original.durationMinutes}&nature=rain`,
      );
    },
  );

  it("offers complete Hatha separately and preserves an actual multi-file practice", async () => {
    mockParams = { outcomeId: "yoga" };
    const screen = await render(
      <OutcomeCatalogScreen
        reviewProgramFactory={createWholeFileReviewProgram}
      />,
    );
    await fireEvent.press(screen.getByText("Complete Hatha practice →"));
    expect(mockPush).toHaveBeenCalledWith("/outcome/yoga?practice=complete");
    mockParams = { outcomeId: "yoga", practice: "complete" };
    await screen.rerender(
      <OutcomeCatalogScreen
        reviewProgramFactory={createWholeFileReviewProgram}
      />,
    );
    expect(screen.queryByTestId("immediate-session-setup")).toBeNull();
    expect(screen.getByText("Your complete Hatha practice")).toBeTruthy();
    expect(screen.queryByText("CHOOSE YOUR SOUND")).toBeNull();
    expect(screen.queryByText(/IN PRODUCTION/)).toBeNull();
    for (const minutes of [30, 45, 60, 90])
      expect(screen.getByTestId("duration-" + minutes)).toBeTruthy();
    for (const minutes of [20])
      expect(screen.queryByTestId("duration-" + minutes)).toBeNull();
    await waitFor(() =>
      expect(screen.getByTestId("start-adaptive-session")).toBeEnabled(),
    );
    const selection =
      mockAudio.controller.prepareSelection.mock.calls.at(-1)![0];
    expect(selection.kind).toBe("adaptive");
    if (selection.kind !== "adaptive")
      throw new Error("Expected complete practice");
    expect(selection.program.works.length).toBeGreaterThanOrEqual(4);
    for (const work of selection.program.works)
      expect(screen.queryByText(work.title)).toBeNull();
    await fireEvent.press(screen.getByTestId("start-adaptive-session"));
    expect(
      mockAudio.controller.startSelectionFromUserGesture,
    ).toHaveBeenCalledWith(selection);
  });

  it("does not pretend a complete practice is a looping single when its adapter is unavailable", async () => {
    mockParams = { outcomeId: "yoga", practice: "complete" };
    const screen = await render(<OutcomeCatalogScreen />);
    await waitFor(() =>
      expect(
        screen.getByText("No session is available for this selection."),
      ).toBeTruthy(),
    );
    expect(screen.getByTestId("start-adaptive-session")).toBeDisabled();
    expect(mockAudio.controller.prepareSelection).not.toHaveBeenCalled();
  });

  it("puts Music first in Sounds and shows Hatha first with its cycle name", async () => {
    const screen = await render(<SoundscapesScreen />);
    expect(screen.getAllByTestId(/^sound-family-toggle-/)[0].props.testID).toBe(
      "sound-family-toggle-music",
    );
    await fireEvent.press(screen.getByTestId("sound-family-toggle-music"));
    expect(screen.getByText("Respiro Hatha 1 · 8 music tracks")).toBeTruthy();
    expect(
      screen
        .getAllByTestId(/^consumer-work-/)
        .slice(0, 8)
        .map((row) => row.props.testID),
    ).toEqual(
      Array.from(
        { length: 8 },
        (_, index) =>
          `consumer-work-respiro-hatha-1-${String(index + 1).padStart(2, "0")}`,
      ),
    );
  });

  it("starts with a compact family index and exposes every non-rejected work on demand", async () => {
    const screen = await render(<QaSoundscapesScreen />);
    expect(screen.getByText("Find your sound.")).toBeTruthy();
    expect(screen.queryAllByTestId(/^consumer-work-/)).toHaveLength(0);
    const seen = new Set<string>();
    for (const family of [
      "sea",
      "rain",
      "stream",
      "music",
      "noise",
      "unclassified-nature",
      "air",
    ]) {
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

  it("routes unclassified local nature only to the single-work QA player", async () => {
    const screen = await render(<QaSoundscapesScreen />);
    await fireEvent.press(
      screen.getByTestId("sound-family-toggle-unclassified-nature"),
    );
    await fireEvent.press(
      screen.getByTestId("consumer-work-field-recording-01"),
    );
    expect(mockPush).toHaveBeenLastCalledWith(
      "/qa-workbench?workId=field-recording-01",
    );
    expect(
      mockAudio.controller.startSelectionFromUserGesture,
    ).not.toHaveBeenCalled();
  });
});
