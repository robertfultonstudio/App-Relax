import {
  act,
  fireEvent,
  render,
  waitFor,
  within,
} from "@testing-library/react-native";
import { AdaptiveSessionSetup } from "@/components/AdaptiveSessionSetup";
import { PlaybackCancelledError } from "@/audio/AudioSessionController";
import { createConsumerAudioMock, deferred } from "./helpers/consumerAudioMock";

const mockPush = jest.fn();
let mockAudio = createConsumerAudioMock();
jest.mock("expo-router", () => ({ useRouter: () => ({ push: mockPush }) }));
jest.mock("@/audio/AudioProvider", () => ({
  useAudioSession: () => mockAudio,
}));

describe("prepared consumer session setup", () => {
  beforeEach(() => {
    mockPush.mockClear();
    mockAudio = createConsumerAudioMock();
  });

  it("keeps Start disabled until ready, then starts in the direct gesture before navigating", async () => {
    const preparation = deferred();
    const starting = deferred();
    mockAudio.controller.prepareSelection.mockReturnValueOnce(
      preparation.promise,
    );
    mockAudio.controller.startSelectionFromUserGesture.mockReturnValueOnce(
      starting.promise,
    );
    const screen = await render(
      <AdaptiveSessionSetup outcome="yoga" qaAvailable />,
    );
    expect(screen.getByText("HOW LONG DO YOU HAVE?")).toBeTruthy();
    expect(screen.queryByText(/IN PRODUCTION/)).toBeNull();
    expect(screen.queryByLabelText("Natural sound")).toBeNull();
    await waitFor(() =>
      expect(mockAudio.controller.prepareSelection).toHaveBeenCalledTimes(1),
    );
    expect(screen.getByTestId("start-adaptive-session")).toBeDisabled();
    expect(mockAudio.controller.loadAdaptiveSession).not.toHaveBeenCalled();
    expect(mockAudio.controller.play).not.toHaveBeenCalled();
    await act(async () => preparation.resolve());
    expect(screen.getByText("30 min · Ready")).toBeTruthy();
    const selection = mockAudio.controller.prepareSelection.mock.calls[0]![0];
    await fireEvent.press(screen.getByTestId("start-adaptive-session"));
    expect(
      mockAudio.controller.startSelectionFromUserGesture,
    ).toHaveBeenCalledWith(selection);
    expect(screen.getByTestId("start-adaptive-session")).toBeDisabled();
    expect(mockPush).not.toHaveBeenCalled();
    await act(async () => starting.resolve());
    expect(mockPush).toHaveBeenCalledWith(
      "/adaptive-session/yoga?duration=30&sound=nature&nature=sea&active=1",
    );
    expect(
      mockAudio.controller.startSelectionFromUserGesture,
    ).toHaveBeenCalledTimes(1);
  });

  it("makes personalization visible, preserves duration and shows the actual evolving journey", async () => {
    const screen = await render(
      <AdaptiveSessionSetup outcome="relax" qaAvailable />,
    );
    await waitFor(() =>
      expect(screen.getByTestId("start-adaptive-session")).toBeEnabled(),
    );
    await fireEvent.press(screen.getByTestId("duration-45"));
    expect(
      screen.getByLabelText("Choose session duration").props.accessibilityRole,
    ).toBe("radiogroup");
    const durations = within(screen.getByLabelText("Choose session duration"));
    expect(durations.getAllByRole("radio", { checked: true })).toHaveLength(1);
    expect(
      screen.getByTestId("duration-45").props.accessibilityState,
    ).toMatchObject({ checked: true });
    expect(screen.getByText(/An evolving nature session/)).toBeTruthy();
    await fireEvent.press(
      screen.getByRole("button", { name: /Personalize your session/ }),
    );
    expect(screen.getByText("Guided · IN PRODUCTION")).toBeTruthy();
    expect(screen.getByLabelText("Natural sound").props.accessibilityRole).toBe(
      "radiogroup",
    );
    const nature = within(screen.getByLabelText("Natural sound"));
    await fireEvent.press(nature.getByRole("radio", { name: "Rain" }));
    expect(nature.getAllByRole("radio", { checked: true })).toHaveLength(1);
    expect(
      nature.getByRole("radio", { name: "Rain" }).props.accessibilityState,
    ).toMatchObject({ checked: true });
    const selection =
      mockAudio.controller.prepareSelection.mock.calls.at(-1)![0];
    expect(selection.kind).toBe("adaptive");
    if (selection.kind !== "adaptive")
      throw new Error("Expected a nature session");
    const journey = within(screen.getByTestId("session-journey-preview"));
    expect(journey.getByText("YOUR SESSION · 45 MIN")).toBeTruthy();
    for (const segment of selection.program.plan.segments) {
      const title = selection.program.works.find(
        ({ id }) => id === segment.workId,
      )!.title;
      expect(journey.getByText(new RegExp(title))).toBeTruthy();
    }
    await waitFor(() =>
      expect(screen.getByTestId("start-adaptive-session")).toBeEnabled(),
    );
    await fireEvent.press(screen.getByTestId("start-adaptive-session"));
    await waitFor(() =>
      expect(mockPush).toHaveBeenCalledWith(
        "/adaptive-session/relax?duration=45&sound=nature&nature=rain&active=1",
      ),
    );
  });

  it("does not show a playback failure or navigate when Stop cancels Start", async () => {
    mockAudio.controller.startSelectionFromUserGesture.mockRejectedValueOnce(
      new PlaybackCancelledError(),
    );
    const screen = await render(
      <AdaptiveSessionSetup outcome="relax" qaAvailable />,
    );
    await waitFor(() =>
      expect(screen.getByTestId("start-adaptive-session")).toBeEnabled(),
    );
    await fireEvent.press(screen.getByTestId("start-adaptive-session"));
    await waitFor(() =>
      expect(mockAudio.controller.prepareSelection).toHaveBeenCalledTimes(2),
    );
    expect(screen.queryByRole("alert")).toBeNull();
    expect(mockPush).not.toHaveBeenCalled();
  });

  it("offers a real complete sound when adaptive playback is unavailable", async () => {
    const screen = await render(
      <AdaptiveSessionSetup outcome="massage" qaAvailable={false} />,
    );
    await fireEvent.press(screen.getByTestId("duration-90"));
    await waitFor(() =>
      expect(screen.getByTestId("start-adaptive-session")).toBeEnabled(),
    );
    expect(
      screen.getByText("One complete sound, for your chosen time."),
    ).toBeTruthy();
    expect(screen.queryByText(/IN PRODUCTION/)).toBeNull();
    await fireEvent.press(screen.getByTestId("start-adaptive-session"));
    expect(
      mockAudio.controller.startSelectionFromUserGesture.mock.calls[0]![0],
    ).toMatchObject({
      kind: "single",
      outcome: "massage",
      durationMinutes: 90,
    });
    await waitFor(() =>
      expect(mockPush).toHaveBeenCalledWith(
        expect.stringMatching(/^\/listen\/.+\?outcome=massage&duration=90$/),
      ),
    );
  });

  it("fails visibly during preparation and retries without starting or navigating", async () => {
    mockAudio.controller.prepareSelection.mockRejectedValueOnce(
      new Error("Connection unavailable"),
    );
    const screen = await render(
      <AdaptiveSessionSetup outcome="relax" qaAvailable />,
    );
    await waitFor(() =>
      expect(screen.getByRole("alert")).toHaveTextContent(
        "Connection unavailable",
      ),
    );
    expect(screen.getByTestId("start-adaptive-session")).toBeDisabled();
    await fireEvent.press(screen.getByText("Retry loading"));
    await waitFor(() =>
      expect(screen.getByTestId("start-adaptive-session")).toBeEnabled(),
    );
    expect(mockAudio.controller.prepareSelection).toHaveBeenCalledTimes(2);
    expect(
      mockAudio.controller.startSelectionFromUserGesture,
    ).not.toHaveBeenCalled();
    expect(mockPush).not.toHaveBeenCalled();
  });

  it("cannot start a changed duration using stale candidate readiness", async () => {
    const first = deferred();
    const changed = deferred();
    mockAudio.controller.prepareSelection
      .mockReturnValueOnce(first.promise)
      .mockReturnValueOnce(changed.promise);
    const screen = await render(
      <AdaptiveSessionSetup outcome="yoga" qaAvailable />,
    );
    await waitFor(() =>
      expect(mockAudio.controller.prepareSelection).toHaveBeenCalledTimes(1),
    );
    await fireEvent.press(screen.getByTestId("duration-45"));
    await waitFor(() =>
      expect(mockAudio.controller.prepareSelection).toHaveBeenCalledTimes(2),
    );
    expect(mockAudio.controller.cancelPreparedSelection).toHaveBeenCalledWith(
      mockAudio.controller.prepareSelection.mock.calls[0]![0],
    );
    await act(async () => first.resolve());
    expect(screen.getByTestId("start-adaptive-session")).toBeDisabled();
    await act(async () => changed.resolve());
    expect(screen.getByText("45 min · Ready")).toBeTruthy();
    await fireEvent.press(screen.getByTestId("start-adaptive-session"));
    expect(
      mockAudio.controller.startSelectionFromUserGesture,
    ).toHaveBeenCalledWith(
      mockAudio.controller.prepareSelection.mock.calls[1]![0],
    );
  });
});
