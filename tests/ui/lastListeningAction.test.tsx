import { act, fireEvent, render, waitFor } from "@testing-library/react-native";
import { LastListeningAction } from "@/components/LastListeningAction";
import type { LastListening } from "@/state/lastListeningPersistence";
import { createConsumerAudioMock, deferred } from "./helpers/consumerAudioMock";

let mockAudio = createConsumerAudioMock();
const mockPush = jest.fn();
const mockLoadLastListening = jest.fn(
  async (): Promise<LastListening | null> => null,
);
jest.mock("expo-router", () => ({
  useFocusEffect: (callback: () => void) => {
    const { useEffect } = jest.requireActual("react");
    useEffect(callback, [callback]);
  },
  useRouter: () => ({ push: mockPush }),
}));
jest.mock("@/audio/AudioProvider", () => ({
  useAudioSession: () => mockAudio,
}));
jest.mock("@/state/lastListeningPersistence", () => ({
  loadLastListening: () => mockLoadLastListening(),
}));
jest.mock("@/domain/sessions/playbackAvailability", () => ({
  isNativeCatalogPreview: () => false,
  isAdaptivePlaybackAvailable: () => true,
  isPwaWebSurface: () => false,
}));

describe("unified last listening action", () => {
  it("UI03 starts and navigates only once across repeated taps, unlocking after failure", async () => {
    mockLoadLastListening.mockResolvedValue({
      schemaVersion: 1,
      kind: "single",
      workId: "field-sea-003-open-tide",
      outcome: "massage",
      durationMinutes: 90,
      updatedAt: 1,
    } as LastListening);
    const pending = deferred();
    mockAudio.controller.startSelectionFromUserGesture.mockReturnValueOnce(
      pending.promise,
    );
    const screen = await render(<LastListeningAction />);
    await waitFor(() =>
      expect(
        screen.getByRole("button", { name: "Play your last session" }),
      ).toBeEnabled(),
    );
    const button = screen.getByRole("button", {
      name: "Play your last session",
    });
    await fireEvent.press(button);
    await fireEvent.press(button);
    expect(button).toBeDisabled();
    expect(
      mockAudio.controller.startSelectionFromUserGesture,
    ).toHaveBeenCalledTimes(1);
    expect(mockPush).not.toHaveBeenCalled();
    await act(async () => pending.reject(new Error("Start rejected")));
    await waitFor(() => expect(button).toBeEnabled());
    await fireEvent.press(button);
    expect(mockPush).toHaveBeenCalledTimes(1);
    expect(
      mockAudio.controller.startSelectionFromUserGesture.mock.calls[1][0],
    ).toEqual(
      mockAudio.controller.startSelectionFromUserGesture.mock.calls[0][0],
    );
  });
  beforeEach(() => {
    mockAudio = createConsumerAudioMock();
    mockPush.mockClear();
    mockLoadLastListening.mockReset().mockResolvedValue(null);
  });

  it.each(["empty", "unreadable"])(
    "leaves first-use Home without a disabled CTA when history is %s",
    async (condition) => {
      if (condition === "unreadable")
        mockLoadLastListening.mockRejectedValueOnce(new Error("Read failed"));
      const screen = await render(<LastListeningAction />);
      await waitFor(() =>
        expect(mockLoadLastListening).toHaveBeenCalledTimes(1),
      );
      expect(
        screen.queryByRole("button", { name: "Play your last session" }),
      ).toBeNull();
      expect(mockAudio.controller.prepareSelection).not.toHaveBeenCalled();
      expect(
        mockAudio.controller.startSelectionFromUserGesture,
      ).not.toHaveBeenCalled();
    },
  );

  it("replays the last autonomous sound with Massage 90 preserved, navigating only after successful Start", async () => {
    mockLoadLastListening.mockResolvedValue({
      kind: "single",
      workId: "field-sea-003-open-tide",
      outcome: "massage",
      durationMinutes: 90,
    });
    const preparation = deferred();
    const started = deferred();
    mockAudio.controller.prepareSelection.mockReturnValueOnce(
      preparation.promise,
    );
    mockAudio.controller.startSelectionFromUserGesture.mockReturnValueOnce(
      started.promise,
    );
    const screen = await render(<LastListeningAction />);
    await waitFor(() =>
      expect(mockAudio.controller.prepareSelection).toHaveBeenCalledTimes(1),
    );
    const button = () =>
      screen.getByRole("button", { name: "Play your last session" });
    expect(button()).toBeDisabled();
    expect(mockAudio.controller.loadProgram).not.toHaveBeenCalled();
    await act(async () => preparation.resolve());
    expect(button()).toBeEnabled();
    await fireEvent.press(button());
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
    expect(mockPush).not.toHaveBeenCalled();
    await act(async () => started.resolve());
    expect(mockPush).toHaveBeenCalledWith(
      "/listen/field-sea-003-open-tide?outcome=massage&duration=90",
    );
    expect(mockAudio.controller.play).not.toHaveBeenCalled();
  });

  it("uses the same action for a saved adaptive listening without autoplaying its route", async () => {
    mockLoadLastListening.mockResolvedValue({
      kind: "adaptive",
      request: {
        outcome: "relax",
        durationMinutes: 45,
        mode: "sound-only",
        soundKind: "nature",
        natureFamily: "rain",
      },
    });
    const screen = await render(<LastListeningAction />);
    await waitFor(() =>
      expect(
        screen.getByRole("button", { name: "Play your last session" }),
      ).toBeEnabled(),
    );
    expect(screen.getByText(/Rain · relax · 45 min/)).toBeTruthy();
    expect(mockAudio.controller.prepareSelection).toHaveBeenCalledWith(
      expect.objectContaining({
        kind: "adaptive",
        request: expect.objectContaining({
          durationMinutes: 45,
          natureFamily: "rain",
        }),
      }),
    );
    expect(
      mockAudio.controller.startSelectionFromUserGesture,
    ).not.toHaveBeenCalled();
    await fireEvent.press(
      screen.getByRole("button", { name: "Play your last session" }),
    );
    await waitFor(() =>
      expect(mockPush).toHaveBeenCalledWith(
        "/adaptive-session/relax?duration=45&sound=nature&nature=rain&active=1",
      ),
    );
  });

  it("recovers from preparation and start errors without navigating or using legacy play", async () => {
    mockLoadLastListening.mockResolvedValue({
      kind: "single",
      workId: "field-sea-003-open-tide",
      outcome: "massage",
      durationMinutes: 90,
    });
    mockAudio.controller.prepareSelection.mockRejectedValueOnce(
      new Error("Offline"),
    );
    const screen = await render(<LastListeningAction />);
    await waitFor(() =>
      expect(screen.getByRole("alert")).toHaveTextContent(
        /Could not load your last session/,
      ),
    );
    await fireEvent.press(
      screen.getByRole("button", { name: /Retry loading/ }),
    );
    await waitFor(() =>
      expect(
        screen.getByRole("button", { name: "Play your last session" }),
      ).toBeEnabled(),
    );
    mockAudio.controller.startSelectionFromUserGesture.mockRejectedValueOnce(
      new Error("Start failed"),
    );
    await fireEvent.press(
      screen.getByRole("button", { name: "Play your last session" }),
    );
    await waitFor(() =>
      expect(screen.getByRole("alert")).toHaveTextContent(/Could not start/),
    );
    expect(mockPush).not.toHaveBeenCalled();
    expect(mockAudio.controller.prepareSelection).toHaveBeenCalledTimes(3);
    expect(
      mockAudio.controller.startSelectionFromUserGesture,
    ).toHaveBeenCalledTimes(1);
    expect(mockAudio.controller.play).not.toHaveBeenCalled();
  });
});
