import { act, fireEvent, render, waitFor } from "@testing-library/react-native";
import { ImmediateSessionSetup } from "@/components/ImmediateSessionSetup";
import { ListeningPreferences } from "@/components/ListeningPreferences";
import { createListeningNatureProgram } from "@/pwa-review/createListeningNatureProgram";
import { createConsumerAudioMock, deferred } from "./helpers/consumerAudioMock";
const mockPush = jest.fn();
let mockAudio = createConsumerAudioMock();
jest.mock("expo-router", () => ({
  useRouter: () => ({ push: mockPush }),
  useFocusEffect: (callback: () => void) => {
    const { useEffect } = jest.requireActual("react");
    useEffect(callback, [callback]);
  },
}));
jest.mock("@/audio/AudioProvider", () => ({
  useAudioSession: () => mockAudio,
}));
jest.mock("@/domain/sessions/playbackAvailability", () => ({
  isNativeCatalogPreview: () => false,
  isAdaptivePlaybackAvailable: () => true,
  isPwaWebSurface: () => true,
}));
beforeEach(() => {
  mockAudio = createConsumerAudioMock();
  mockPush.mockClear();
});

it("prepares silently, keeps one selected file across timer changes and starts it only on the direct gesture", async () => {
  const screen = await render(<ImmediateSessionSetup outcome="meditation" />);
  await waitFor(() =>
    expect(screen.getByTestId("start-immediate-session")).toBeEnabled(),
  );
  const original = mockAudio.controller.prepareSelection.mock.calls.at(-1)![0];
  expect(original.kind).toBe("single");
  if (original.kind !== "single") throw new Error("Expected single");
  expect(screen.queryByText(original.program.work.title)).toBeNull();
  expect(screen.queryByTestId("duration-45")).toBeNull();
  await fireEvent.press(screen.getByText("Timer · 20 min +"));
  await fireEvent.press(screen.getByTestId("duration-45"));
  await waitFor(() =>
    expect(screen.getByTestId("start-immediate-session")).toBeEnabled(),
  );
  const changed = mockAudio.controller.prepareSelection.mock.calls.at(-1)![0];
  expect(changed).toMatchObject({
    kind: "single",
    durationMinutes: 45,
    program: { work: original.program.work },
  });
  expect(
    mockAudio.controller.startSelectionFromUserGesture,
  ).not.toHaveBeenCalled();
  const pending = deferred();
  mockAudio.controller.startSelectionFromUserGesture.mockReturnValueOnce(
    pending.promise,
  );
  await fireEvent.press(screen.getByTestId("start-immediate-session"));
  expect(
    mockAudio.controller.startSelectionFromUserGesture,
  ).toHaveBeenCalledWith(changed);
  expect(screen.getByTestId("start-immediate-session")).toBeDisabled();
  expect(mockPush).not.toHaveBeenCalled();
  await act(async () => pending.resolve());
  expect(mockPush).toHaveBeenCalledWith(
    `/listen/${original.program.work.id}?outcome=meditation&duration=45`,
  );
});

it("surfaces preparation failures and retries the same file without autoplay", async () => {
  mockAudio.controller.prepareSelection.mockRejectedValueOnce(
    new Error("Network unavailable"),
  );
  const screen = await render(<ImmediateSessionSetup outcome="relax" />);
  await waitFor(() =>
    expect(screen.getByRole("alert")).toHaveTextContent(
      "The sound could not load. Check your connection, then retry.",
    ),
  );
  expect(screen.getByTestId("start-immediate-session")).toBeDisabled();
  const selected = mockAudio.controller.prepareSelection.mock.calls[0][0];
  await fireEvent.press(screen.getByText("Retry loading"));
  await waitFor(() =>
    expect(screen.getByTestId("start-immediate-session")).toBeEnabled(),
  );
  expect(mockAudio.controller.prepareSelection).toHaveBeenLastCalledWith(
    selected,
  );
  expect(
    mockAudio.controller.startSelectionFromUserGesture,
  ).not.toHaveBeenCalled();
});

it("keeps the same music through rain, waves, timer and Off without autoplay", async () => {
  const screen = await render(
    <ImmediateSessionSetup
      outcome="meditation"
      createNatureProgram={createListeningNatureProgram}
    />,
  );
  await waitFor(() =>
    expect(screen.getByTestId("start-immediate-session")).toBeEnabled(),
  );
  const original = mockAudio.controller.prepareSelection.mock.calls.at(-1)![0];
  if (original.kind !== "single") throw new Error("Expected single by default");
  expect(
    screen.getByRole("radio", { name: "Ambience Off" }).props.accessibilityState
      .checked,
  ).toBe(true);
  for (const [label, family] of [
    ["Rain", "rain"],
    ["Ocean waves", "sea"],
  ] as const) {
    await fireEvent.press(
      screen.getByRole("radio", { name: `Ambience ${label}` }),
    );
    await waitFor(() =>
      expect(screen.getByTestId("start-immediate-session")).toBeEnabled(),
    );
    const selected =
      mockAudio.controller.prepareSelection.mock.calls.at(-1)![0];
    expect(selected).toMatchObject({
      kind: "adaptive",
      request: {
        listeningWorkId: original.program.work.id,
        includeNatureBed: true,
        natureFamily: family,
      },
      program: {
        plan: {
          listeningWorkId: original.program.work.id,
          natureMix: { selectedFamily: family },
        },
      },
    });
    expect(screen.queryByText(original.program.work.title)).toBeNull();
  }
  await fireEvent.press(screen.getByText("Timer · 20 min +"));
  await fireEvent.press(screen.getByTestId("duration-45"));
  await waitFor(() =>
    expect(screen.getByTestId("start-immediate-session")).toBeEnabled(),
  );
  expect(
    mockAudio.controller.prepareSelection.mock.calls.at(-1)![0],
  ).toMatchObject({
    kind: "adaptive",
    request: {
      durationMinutes: 45,
      natureFamily: "sea",
      listeningWorkId: original.program.work.id,
    },
  });
  await fireEvent.press(screen.getByRole("radio", { name: "Ambience Off" }));
  await waitFor(() =>
    expect(screen.getByTestId("start-immediate-session")).toBeEnabled(),
  );
  expect(
    mockAudio.controller.prepareSelection.mock.calls.at(-1)![0],
  ).toMatchObject({
    kind: "single",
    durationMinutes: 45,
    program: { work: original.program.work },
  });
  expect(
    mockAudio.controller.startSelectionFromUserGesture,
  ).not.toHaveBeenCalled();
});

it("cancels obsolete preparation and cannot start rain after switching to waves", async () => {
  const screen = await render(
    <ImmediateSessionSetup
      outcome="relax"
      createNatureProgram={createListeningNatureProgram}
    />,
  );
  await waitFor(() =>
    expect(screen.getByTestId("start-immediate-session")).toBeEnabled(),
  );
  const rain = deferred();
  const waves = deferred();
  mockAudio.controller.prepareSelection
    .mockReturnValueOnce(rain.promise)
    .mockReturnValueOnce(waves.promise);
  await fireEvent.press(screen.getByRole("radio", { name: "Ambience Rain" }));
  const obsolete = mockAudio.controller.prepareSelection.mock.calls.at(-1)![0];
  await fireEvent.press(
    screen.getByRole("radio", { name: "Ambience Ocean waves" }),
  );
  const current = mockAudio.controller.prepareSelection.mock.calls.at(-1)![0];
  expect(mockAudio.controller.cancelPreparedSelection).toHaveBeenCalledWith(
    obsolete,
  );
  await act(async () => rain.resolve());
  expect(screen.getByTestId("start-immediate-session")).toBeDisabled();
  await act(async () => waves.resolve());
  await fireEvent.press(screen.getByTestId("start-immediate-session"));
  expect(
    mockAudio.controller.startSelectionFromUserGesture,
  ).toHaveBeenCalledTimes(1);
  expect(
    mockAudio.controller.startSelectionFromUserGesture,
  ).toHaveBeenCalledWith(current);
});

it("fails closed when nature cannot be planned, then retries the same recording", async () => {
  const factory = jest
    .fn(createListeningNatureProgram)
    .mockImplementationOnce(() => {
      throw new Error("Ambience unavailable. Please retry.");
    });
  const screen = await render(
    <ImmediateSessionSetup outcome="relax" createNatureProgram={factory} />,
  );
  await waitFor(() =>
    expect(screen.getByTestId("start-immediate-session")).toBeEnabled(),
  );
  await fireEvent.press(screen.getByRole("radio", { name: "Ambience Rain" }));
  expect(screen.getByRole("alert")).toHaveTextContent(
    "This session could not be prepared. Retry, or choose another activity.",
  );
  expect(screen.getByTestId("start-immediate-session")).toBeDisabled();
  await fireEvent.press(screen.getByText("Retry loading"));
  await waitFor(() =>
    expect(screen.getByTestId("start-immediate-session")).toBeEnabled(),
  );
  expect(factory.mock.calls[1]).toEqual(factory.mock.calls[0]);
  expect(
    mockAudio.controller.prepareSelection.mock.calls.at(-1)![0],
  ).toMatchObject({ kind: "adaptive", request: { natureFamily: "rain" } });
  expect(
    mockAudio.controller.startSelectionFromUserGesture,
  ).not.toHaveBeenCalled();
});

it("locks both ambience and timer while the direct Play request is starting", async () => {
  const screen = await render(
    <ImmediateSessionSetup
      outcome="meditation"
      createNatureProgram={createListeningNatureProgram}
    />,
  );
  await fireEvent.press(screen.getByRole("radio", { name: "Ambience Rain" }));
  await fireEvent.press(screen.getByText("Timer · 20 min +"));
  await waitFor(() =>
    expect(screen.getByTestId("start-immediate-session")).toBeEnabled(),
  );
  const selected = mockAudio.controller.prepareSelection.mock.calls.at(-1)![0];
  const pending = deferred();
  mockAudio.controller.startSelectionFromUserGesture.mockReturnValueOnce(
    pending.promise,
  );
  await fireEvent.press(screen.getByTestId("start-immediate-session"));
  expect(
    screen.getByRole("radio", { name: "Ambience Ocean waves" }),
  ).toBeDisabled();
  expect(screen.getByTestId("duration-45")).toBeDisabled();
  await fireEvent.press(
    screen.getByRole("radio", { name: "Ambience Ocean waves" }),
  );
  await fireEvent.press(screen.getByTestId("duration-45"));
  expect(mockAudio.controller.prepareSelection).toHaveBeenLastCalledWith(
    selected,
  );
  await act(async () => pending.resolve());
  expect(mockPush.mock.calls.at(-1)![0]).toMatch(/duration=20&nature=rain$/);
});

it("does not expose unsupported nature playback without the PWA factory", async () => {
  const screen = await render(<ImmediateSessionSetup outcome="meditation" />);
  expect(
    screen.queryByRole("radiogroup", { name: "Natural ambience" }),
  ).toBeNull();
});

it("requires a settings disclosure before exposing manual recording selection", async () => {
  const screen = await render(<ListeningPreferences />);
  expect(screen.queryByRole("link")).toBeNull();
  await fireEvent.press(screen.getByText("Listening preferences +"));
  await fireEvent.press(screen.getByText("Choose a recording manually →"));
  expect(mockPush).toHaveBeenCalledWith("/soundscapes");
});
