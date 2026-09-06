import { fireEvent, render, waitFor } from "@testing-library/react-native";
import AdaptiveSessionPlayerScreen from "@/app/adaptive-session/[outcomeId]";
import { createAdaptiveSessionProgram } from "@/domain/sessions/continuumPlanner";
import { createConsumerAudioMock } from "./helpers/consumerAudioMock";

let mockAudio = createConsumerAudioMock();
let mockParams: Record<string, string>;
const mockPush = jest.fn();
jest.mock("expo-router", () => ({
  useLocalSearchParams: () => mockParams,
  useRouter: () => ({ back: jest.fn(), push: mockPush }),
}));
jest.mock("expo-linear-gradient", () => ({ LinearGradient: "LinearGradient" }));
jest.mock("@/domain/sessions/playbackAvailability", () => ({
  isAdaptivePlaybackAvailable: () => true,
}));
jest.mock("@/audio/AudioProvider", () => ({
  useAudioSession: () => mockAudio,
}));

describe("adaptive consumer session route", () => {
  beforeEach(() => {
    mockAudio = createConsumerAudioMock();
    mockPush.mockClear();
    mockParams = {
      duration: "20",
      nature: "sea",
      outcomeId: "relax",
      sound: "nature",
      start: "1",
    };
  });

  it("prepares a route candidate silently and starts only from the direct Play gesture", async () => {
    const screen = await render(<AdaptiveSessionPlayerScreen />);
    await waitFor(() =>
      expect(screen.getByTestId("adaptive-play-pause")).toBeEnabled(),
    );
    const selection = mockAudio.controller.prepareSelection.mock.calls[0]![0];
    expect(selection.kind).toBe("adaptive");
    if (selection.kind !== "adaptive")
      throw new Error("Expected adaptive candidate");
    expect(selection.program.plan.soundKind).toBe("nature");
    expect(selection.program.plan.natureMix).toBeUndefined();
    expect(
      selection.program.plan.segments.every(
        (segment) => (segment.lane ?? "primary") === "primary",
      ),
    ).toBe(true);
    expect(screen.queryByTestId("nature-family-sea")).toBeNull();
    expect(screen.getByText("20:00")).toBeTruthy();
    expect(mockAudio.controller.loadAdaptiveSession).not.toHaveBeenCalled();
    expect(mockAudio.controller.play).not.toHaveBeenCalled();
    expect(
      mockAudio.controller.startSelectionFromUserGesture,
    ).not.toHaveBeenCalled();
    await fireEvent.press(screen.getByTestId("adaptive-play-pause"));
    expect(
      mockAudio.controller.startSelectionFromUserGesture,
    ).toHaveBeenCalledWith(selection);
    expect(
      mockAudio.controller.startSelectionFromUserGesture,
    ).toHaveBeenCalledTimes(1);
    expect(mockAudio.controller.playFromUserGesture).not.toHaveBeenCalled();
  });

  it("adopts the already started session without rebuilding, reloading or asking for another Start", async () => {
    const request = {
      outcome: "relax" as const,
      durationMinutes: 20 as const,
      mode: "sound-only" as const,
      soundKind: "nature" as const,
      natureFamily: "sea" as const,
    };
    const program = createAdaptiveSessionProgram({
      ...request,
      seed: "already-started",
      allowProvisionalMetadata: true,
    });
    mockAudio.setActive({ kind: "adaptive", request, program });
    mockAudio.publish({
      status: "playing",
      sessionPlanId: program.plan.id,
      remainingMs: 19 * 60_000,
    });
    const screen = await render(<AdaptiveSessionPlayerScreen />);
    expect(screen.getByRole("button", { name: "Pause" })).toBeEnabled();
    expect(screen.getByText("19:00")).toBeTruthy();
    expect(mockAudio.controller.prepareSelection).not.toHaveBeenCalled();
    expect(mockAudio.controller.loadAdaptiveSession).not.toHaveBeenCalled();
    expect(
      mockAudio.controller.startSelectionFromUserGesture,
    ).not.toHaveBeenCalled();
    await fireEvent.press(screen.getByRole("button", { name: "Pause" }));
    expect(mockAudio.controller.pause).toHaveBeenCalledTimes(1);
    mockAudio.publish({ status: "paused" });
    await screen.rerender(<AdaptiveSessionPlayerScreen />);
    await fireEvent.press(screen.getByRole("button", { name: "Play" }));
    expect(mockAudio.controller.playFromUserGesture).toHaveBeenCalledTimes(1);
    await fireEvent.press(screen.getByRole("button", { name: "Stop" }));
    expect(mockAudio.controller.stop).toHaveBeenCalledTimes(1);
  });

  it("fails closed for music while no pairing is approved and offers a useful way back", async () => {
    mockParams.sound = "music";
    const screen = await render(<AdaptiveSessionPlayerScreen />);
    await waitFor(() =>
      expect(screen.getByRole("alert")).toHaveTextContent(
        /No compatible session is available at this duration\./,
      ),
    );
    expect(screen.getByTestId("adaptive-play-pause")).toBeDisabled();
    expect(mockAudio.controller.prepareSelection).not.toHaveBeenCalled();
    expect(
      mockAudio.controller.startSelectionFromUserGesture,
    ).not.toHaveBeenCalled();
    await fireEvent.press(screen.getByText("Choose another sound or duration"));
    expect(mockPush).toHaveBeenCalledWith("/outcome/relax");
  });

  it.each<Record<string, string>>([
    { sound: "" },
    { nature: "storm" },
    { duration: "15" },
    { outcomeId: "unknown" },
  ])(
    "rejects invalid route parameters %j without loading anything",
    async (invalid) => {
      mockParams = { ...mockParams, ...invalid };
      const screen = await render(<AdaptiveSessionPlayerScreen />);
      await waitFor(() =>
        expect(screen.getByRole("alert")).toHaveTextContent(
          "This session is unavailable. Choose another duration or sound.",
        ),
      );
      expect(screen.getByTestId("adaptive-play-pause")).toBeDisabled();
      expect(mockAudio.controller.prepareSelection).not.toHaveBeenCalled();
      expect(mockAudio.controller.loadAdaptiveSession).not.toHaveBeenCalled();
      expect(mockAudio.controller.play).not.toHaveBeenCalled();
    },
  );
});
