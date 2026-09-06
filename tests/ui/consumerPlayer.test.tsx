import { act, fireEvent, render, waitFor } from "@testing-library/react-native";
import ConsumerPlayerScreen from "@/app/listen/[workId]";
import { getConsumerWork } from "@/content/consumerCatalog";
import { createSingleTrackProgram } from "@/domain/audio/consumerTypes";
import { createConsumerAudioMock, deferred } from "./helpers/consumerAudioMock";

let mockAudio = createConsumerAudioMock();
let mockParams: Record<string, string>;
jest.mock("expo-router", () => ({
  useLocalSearchParams: () => mockParams,
  useRouter: () => ({ back: jest.fn() }),
}));
jest.mock("expo-linear-gradient", () => ({ LinearGradient: "LinearGradient" }));
jest.mock("@/audio/AudioProvider", () => ({
  useAudioSession: () => mockAudio,
}));
jest.mock("@/domain/sessions/playbackAvailability", () => ({
  isAdaptivePlaybackAvailable: () => true,
  isPwaWebSurface: () => false,
}));

describe("autonomous consumer player", () => {
  beforeEach(() => {
    mockAudio = createConsumerAudioMock();
    mockParams = {
      workId: "field-sea-003-open-tide",
      outcome: "massage",
      duration: "90",
      start: "1",
    };
  });

  it("prepares silently despite legacy start=1 and preserves Massage 90 until one direct Play", async () => {
    const pending = deferred();
    mockAudio.controller.prepareSelection.mockReturnValueOnce(pending.promise);
    const screen = await render(<ConsumerPlayerScreen />);
    expect(screen.getByTestId("fixed-player-controls")).toBeTruthy();
    expect(screen.getAllByTestId("playback-transport")).toHaveLength(1);
    expect(screen.getByTestId("consumer-play-pause")).toBeDisabled();
    expect(screen.getByText("90:00")).toBeTruthy();
    expect(
      screen.getByRole("radio", { name: "90 minutes", checked: true }),
    ).toBeTruthy();
    expect(screen.queryByRole("radio", { name: "15 minutes" })).toBeNull();
    expect(mockAudio.controller.loadProgram).not.toHaveBeenCalled();
    expect(mockAudio.controller.play).not.toHaveBeenCalled();
    expect(
      mockAudio.controller.startSelectionFromUserGesture,
    ).not.toHaveBeenCalled();
    await act(async () => pending.resolve());
    expect(screen.getByText("Ready")).toBeTruthy();
    await fireEvent.press(screen.getByTestId("consumer-play-pause"));
    expect(
      mockAudio.controller.startSelectionFromUserGesture,
    ).toHaveBeenCalledTimes(1);
    expect(
      mockAudio.controller.startSelectionFromUserGesture,
    ).toHaveBeenCalledWith(
      expect.objectContaining({
        kind: "single",
        outcome: "massage",
        durationMinutes: 90,
      }),
    );
    expect(mockAudio.controller.playFromUserGesture).not.toHaveBeenCalled();
    expect(mockAudio.controller.setTimer).not.toHaveBeenCalled();
  });

  it("returns to an already playing selection without reload or a second Start", async () => {
    const work = getConsumerWork(mockParams.workId)!;
    mockAudio.setActive({
      kind: "single",
      program: createSingleTrackProgram(work, "massage"),
      outcome: "massage",
      durationMinutes: 90,
    });
    mockAudio.publish({
      status: "playing",
      workId: work.id,
      remainingMs: 89 * 60_000,
    });
    const screen = await render(<ConsumerPlayerScreen />);
    expect(screen.getByRole("button", { name: "Pause" })).toBeEnabled();
    expect(screen.getByText("89:00")).toBeTruthy();
    expect(mockAudio.controller.prepareSelection).not.toHaveBeenCalled();
    expect(
      mockAudio.controller.startSelectionFromUserGesture,
    ).not.toHaveBeenCalled();
    expect(screen.getByRole("radio", { name: "90 minutes" })).toBeDisabled();
    await fireEvent.press(screen.getByRole("button", { name: "Pause" }));
    expect(mockAudio.controller.pause).toHaveBeenCalledTimes(1);
    mockAudio.publish({ status: "paused" });
    await screen.rerender(<ConsumerPlayerScreen />);
    await fireEvent.press(screen.getByRole("button", { name: "Play" }));
    expect(mockAudio.controller.playFromUserGesture).toHaveBeenCalledTimes(1);
    await fireEvent.press(screen.getByRole("button", { name: "Stop" }));
    expect(mockAudio.controller.stop).toHaveBeenCalledTimes(1);
  });

  it("re-prepares a changed duration without mutating the current timer or starting audio", async () => {
    const screen = await render(<ConsumerPlayerScreen />);
    await waitFor(() =>
      expect(screen.getByTestId("consumer-play-pause")).toBeEnabled(),
    );
    await fireEvent.press(screen.getByRole("radio", { name: "45 minutes" }));
    await waitFor(() =>
      expect(mockAudio.controller.prepareSelection).toHaveBeenLastCalledWith(
        expect.objectContaining({ durationMinutes: 45, outcome: "massage" }),
      ),
    );
    expect(screen.getAllByRole("radio", { checked: true })).toHaveLength(1);
    expect(
      screen.getByRole("radio", { name: "45 minutes", checked: true }),
    ).toBeTruthy();
    expect(screen.getByText("45:00")).toBeTruthy();
    expect(mockAudio.controller.setTimer).not.toHaveBeenCalled();
    expect(
      mockAudio.controller.startSelectionFromUserGesture,
    ).not.toHaveBeenCalled();
  });

  it("leaves the fixed transport to the current session while browsing a different sound", async () => {
    const work = getConsumerWork("deep-river")!;
    mockAudio.setActive({
      kind: "single",
      program: createSingleTrackProgram(work),
      outcome: "relax",
      durationMinutes: 20,
    });
    mockAudio.publish({ status: "playing", workId: work.id });
    const screen = await render(<ConsumerPlayerScreen />);
    expect(screen.queryByTestId("fixed-player-controls")).toBeNull();
    expect(screen.queryByRole("button", { name: "Stop" })).toBeNull();
    await waitFor(() =>
      expect(
        screen.getByRole("button", { name: "Play this sound" }),
      ).toBeEnabled(),
    );
    expect(mockAudio.controller.stop).not.toHaveBeenCalled();
  });

  it("shows a loading error and retries preparation without an automatic play", async () => {
    mockAudio.controller.prepareSelection.mockRejectedValueOnce(
      new Error("File unavailable"),
    );
    const screen = await render(<ConsumerPlayerScreen />);
    await waitFor(() =>
      expect(screen.getByRole("alert")).toHaveTextContent("File unavailable"),
    );
    expect(screen.getByTestId("consumer-play-pause")).toBeDisabled();
    await fireEvent.press(screen.getByText("Retry loading"));
    await waitFor(() =>
      expect(screen.getByTestId("consumer-play-pause")).toBeEnabled(),
    );
    expect(mockAudio.controller.prepareSelection).toHaveBeenCalledTimes(2);
    expect(
      mockAudio.controller.startSelectionFromUserGesture,
    ).not.toHaveBeenCalled();
  });
});
