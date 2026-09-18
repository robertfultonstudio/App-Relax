import { act, fireEvent, render, waitFor } from "@testing-library/react-native";
import ConsumerPlayerScreen from "@/app/listen/[workId]";
import { CurrentSessionBar } from "@/components/CurrentSessionBar";
import { getConsumerWork } from "@/content/consumerCatalog";
import { createSingleTrackProgram } from "@/domain/audio/consumerTypes";
import { createConsumerAudioMock, deferred } from "./helpers/consumerAudioMock";
import { HATHA_AUDIO_WORKS } from "@/content/hathaCatalog";
import { createListeningNatureProgram } from "@/pwa-review/createListeningNatureProgram";
import { replaceCoordinatedNatureBed } from "@/domain/sessions/continuumPlanner";
import type { AdaptiveSessionProgram } from "@/domain/sessions/types";

let mockAudio = createConsumerAudioMock();
let mockParams: Record<string, string>;
jest.mock("expo-router", () => ({
  useFocusEffect: (callback: () => void) => {
    const { useEffect } = jest.requireActual("react");
    useEffect(callback, [callback]);
  },
  useLocalSearchParams: () => mockParams,
  useGlobalSearchParams: () => mockParams,
  usePathname: () => `/listen/${mockParams.workId}`,
  useRouter: () => ({ back: jest.fn(), setParams: jest.fn(), push: jest.fn() }),
}));
jest.mock("expo-linear-gradient", () => ({ LinearGradient: "LinearGradient" }));
jest.mock("@/audio/AudioProvider", () => ({
  useAudioSession: () => mockAudio,
}));
jest.mock("@/domain/sessions/playbackAvailability", () => ({
  isNativeCatalogPreview: () => false,
  isAdaptivePlaybackAvailable: () => true,
  isPwaWebSurface: () => false,
}));

describe("autonomous consumer player", () => {
  it("changes family live with explicit pending feedback and no reload or Start", async () => {
    mockParams = {
      workId: "astral-thread",
      outcome: "focus",
      duration: "30",
      nature: "rain",
    };
    const first = createListeningNatureProgram(
      getConsumerWork("astral-thread")!,
      "focus",
      30,
      "rain",
    );
    const selected = {
      kind: "adaptive" as const,
      program: first,
      request: {
        outcome: "focus" as const,
        durationMinutes: 30 as const,
        mode: "sound-only" as const,
        soundKind: "music" as const,
        natureFamily: "rain" as const,
      },
    };
    mockAudio.setActive(selected);
    mockAudio.publish({
      status: "playing",
      sessionPlanId: first.plan.id,
      natureMixLevel: 0.3,
      remainingMs: 29 * 60000,
    });
    const pending = deferred<AdaptiveSessionProgram>();
    const change = jest.fn(() => pending.promise);
    const cancel = jest.fn();
    Object.assign(mockAudio.controller, {
      canChangeNatureFamily: () => true,
      changeNatureFamily: change,
      cancelNatureFamilyChange: cancel,
    });
    const screen = await render(
      <ConsumerPlayerScreen
        createNatureProgram={createListeningNatureProgram}
      />,
    );
    expect(
      screen.getByRole("radio", { name: "Ambience Ocean waves" }),
    ).toBeEnabled();
    expect(screen.getByRole("radio", { name: "Ambience Off" })).toBeEnabled();
    await fireEvent.press(
      screen.getByRole("radio", { name: "Ambience Ocean waves" }),
    );
    expect(change).toHaveBeenCalledWith("sea");
    expect(screen.getByText(/Music keeps playing/)).toBeTruthy();
    expect(screen.getByRole("button", { name: "Stop" })).toBeEnabled();
    expect(
      screen.getByRole("button", { name: "Cancel ambience change" }),
    ).toBeEnabled();
    await fireEvent.press(
      screen.getByRole("button", { name: "Cancel ambience change" }),
    );
    expect(cancel).toHaveBeenCalledTimes(1);
    const next = replaceCoordinatedNatureBed(first, "sea");
    await act(async () => {
      mockAudio.setActive({
        ...selected,
        program: next,
        request: { ...selected.request, natureFamily: "sea" },
      });
      pending.resolve(next);
    });
    mockParams = { ...mockParams, nature: "sea" };
    await screen.rerender(
      <ConsumerPlayerScreen
        createNatureProgram={createListeningNatureProgram}
      />,
    );
    expect(
      screen.getByRole("radio", {
        name: "Ambience Ocean waves",
        checked: true,
      }),
    ).toBeTruthy();
    expect(screen.getByText("29:00")).toBeTruthy();
    expect(mockAudio.controller.prepareSelection).not.toHaveBeenCalled();
    expect(
      mockAudio.controller.startSelectionFromUserGesture,
    ).not.toHaveBeenCalled();
    expect(mockAudio.controller.stop).not.toHaveBeenCalled();
  });
  it("prepares real music plus chosen rain, keeps levels separate and allows Off", async () => {
    mockParams = { workId: "astral-thread", outcome: "focus", duration: "30" };
    const screen = await render(
      <ConsumerPlayerScreen
        createNatureProgram={createListeningNatureProgram}
      />,
    );
    await fireEvent.press(screen.getByRole("radio", { name: "Ambience Rain" }));
    await waitFor(() =>
      expect(screen.getByTestId("consumer-play-pause")).toBeEnabled(),
    );
    await fireEvent.press(screen.getByTestId("consumer-play-pause"));
    const selected =
      mockAudio.controller.startSelectionFromUserGesture.mock.calls.at(-1)![0];
    expect(selected.kind).toBe("adaptive");
    if (selected.kind !== "adaptive") throw Error("Expected composed program");
    expect(selected.program.plan.natureMix?.selectedFamily).toBe("rain");
    expect(selected.program.works).toHaveLength(4); // one music + three rain recordings over 30 min
    mockAudio.setActive(selected);
    mockAudio.snapshot.status = "playing";
    mockAudio.snapshot.sessionPlanId = selected.program.plan.id;
    mockAudio.snapshot.natureMixLevel = 0.5;
    await screen.rerender(
      <ConsumerPlayerScreen
        createNatureProgram={createListeningNatureProgram}
      />,
    );
    expect(
      screen.getByRole("radio", { name: "Ambience Ocean waves" }),
    ).toBeDisabled();
    await fireEvent.press(
      screen.getByRole("button", { name: "Mute natural ambience" }),
    );
    expect(mockAudio.controller.setNatureMixLevel).toHaveBeenCalledWith(0);
    expect(mockAudio.controller.setVolume).not.toHaveBeenCalled();
    mockAudio.snapshot.status = "ready";
    await screen.rerender(
      <ConsumerPlayerScreen
        createNatureProgram={createListeningNatureProgram}
      />,
    );
    await fireEvent.press(screen.getByRole("radio", { name: "Ambience Off" }));
    await waitFor(() =>
      expect(mockAudio.controller.prepareSelection).toHaveBeenLastCalledWith(
        expect.objectContaining({
          kind: "adaptive",
          program: expect.objectContaining({
            plan: expect.objectContaining({
              natureMix: expect.objectContaining({ enabled: false }),
            }),
          }),
        }),
      ),
    );
  });
  it.each(HATHA_AUDIO_WORKS)(
    "opens and starts $title through the controller without a technical title",
    async (work) => {
      mockParams = { workId: work.id, outcome: "yoga", duration: "30" };
      const screen = await render(<ConsumerPlayerScreen />);
      expect(screen.getByRole("header", { name: "Yoga" })).toBeTruthy();
      expect(screen.queryByText(work.title)).toBeNull();
      expect(screen.queryByText(work.sourceFilename!)).toBeNull();
      await waitFor(() =>
        expect(screen.getByTestId("consumer-play-pause")).toBeEnabled(),
      );
      await fireEvent.press(screen.getByTestId("consumer-play-pause"));
      expect(
        mockAudio.controller.startSelectionFromUserGesture,
      ).toHaveBeenCalledWith(
        expect.objectContaining({
          kind: "single",
          durationMinutes: 30,
          program: expect.objectContaining({ work }),
        }),
      );
    },
  );
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
    expect(screen.queryByRole("radio", { name: "90 minutes" })).toBeNull();
    await fireEvent.press(screen.getByText("Timer · 90 min +"));
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
    await fireEvent.press(screen.getByText("Timer · 90 min +"));
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
    await fireEvent.press(screen.getByText("Timer · 90 min +"));
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

  it("separates the new 45-minute session from the paused 20-minute session and its Resume", async () => {
    mockParams = {
      workId: "aquarian-drift",
      outcome: "meditation",
      duration: "20",
    };
    const current = {
      kind: "single" as const,
      program: createSingleTrackProgram(
        getConsumerWork(mockParams.workId)!,
        "meditation",
      ),
      outcome: "meditation" as const,
      durationMinutes: 20 as const,
    };
    mockAudio.setActive(current);
    mockAudio.publish({ status: "paused", remainingMs: 19 * 60000 + 27000 });
    const screen = await render(
      <>
        <ConsumerPlayerScreen />
        <CurrentSessionBar />
      </>,
    );
    await fireEvent.press(
      screen.getByRole("button", { name: "Timer · 20 min +" }),
    );
    await fireEvent.press(screen.getByRole("radio", { name: "45 minutes" }));
    mockParams = { ...mockParams, duration: "45" };
    await screen.rerender(
      <>
        <ConsumerPlayerScreen />
        <CurrentSessionBar />
      </>,
    );
    await waitFor(() =>
      expect(
        screen.getByRole("button", { name: "Start new session" }),
      ).toBeEnabled(),
    );
    expect(screen.getByText("New session ready")).toBeTruthy();
    expect(screen.getByText("45:00")).toBeTruthy();
    expect(
      screen.getByText(
        "The session below is unchanged. Start new to replace it.",
      ),
    ).toBeTruthy();
    expect(screen.getByText("Paused · 19:27 left · Return →")).toBeTruthy();
    expect(screen.getByText("Resume")).toBeTruthy();
    expect(mockAudio.controller.setTimer).not.toHaveBeenCalled();
    expect(
      mockAudio.controller.startSelectionFromUserGesture,
    ).not.toHaveBeenCalled();
    await fireEvent.press(
      screen.getByRole("button", { name: "Resume current session" }),
    );
    expect(mockAudio.controller.playFromUserGesture).toHaveBeenCalledTimes(1);
    expect(mockAudio.controller.getConsumerSelection()).toBe(current);
    expect(mockAudio.snapshot.remainingMs).toBe(19 * 60000 + 27000);
    await fireEvent.press(
      screen.getByRole("button", { name: "Start new session" }),
    );
    expect(
      mockAudio.controller.startSelectionFromUserGesture,
    ).toHaveBeenCalledWith(
      expect.objectContaining({
        kind: "single",
        outcome: "meditation",
        durationMinutes: 45,
      }),
    );
    expect(mockAudio.controller.setTimer).not.toHaveBeenCalled();
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
        screen.getByRole("button", { name: "Start new session" }),
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
      expect(screen.getByRole("alert")).toHaveTextContent(
        "This session could not be prepared. Retry, or choose another activity.",
      ),
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
