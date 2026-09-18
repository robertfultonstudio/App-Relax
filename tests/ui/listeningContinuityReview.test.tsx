import { fireEvent, render, waitFor } from "@testing-library/react-native";
import { ImmediateSessionSetup } from "@/components/ImmediateSessionSetup";
import { AdaptiveSessionSetup } from "@/components/AdaptiveSessionSetup";
import ConsumerPlayer from "@/app/listen/[workId]";
import { CurrentSessionBar } from "@/components/CurrentSessionBar";
import { getConsumerWork } from "@/content/consumerCatalog";
import { createSingleTrackProgram } from "@/domain/audio/consumerTypes";
import {
  consumerSelectionUrl,
  type ConsumerSelection,
} from "@/domain/audio/consumerSelection";
import { createWholeFileReviewProgram } from "@/pwa-review/createWholeFileReviewProgram";
import { createListeningNatureProgram } from "@/pwa-review/createListeningNatureProgram";
import { createConsumerAudioMock } from "./helpers/consumerAudioMock";
import { createAdaptiveSessionProgram } from "@/domain/sessions/continuumPlanner";

let mockAudio = createConsumerAudioMock();
let mockParams: Record<string, string> = {};
let mockPath = "/";
const mockPush = jest.fn();
const mockSetParams = jest.fn((params) => {
  mockParams = { ...mockParams, ...params };
});
jest.mock("expo-router", () => ({
  useRouter: () => ({
    push: mockPush,
    setParams: mockSetParams,
    back: jest.fn(),
  }),
  useLocalSearchParams: () => mockParams,
  useGlobalSearchParams: () => mockParams,
  usePathname: () => mockPath,
  useFocusEffect: (callback: () => void) => {
    const { useEffect } = jest.requireActual("react");
    useEffect(callback, [callback]);
  },
}));
jest.mock("expo-linear-gradient", () => ({ LinearGradient: "LinearGradient" }));
jest.mock("@/audio/AudioProvider", () => ({
  useAudioSession: () => mockAudio,
}));
jest.mock("@/domain/sessions/playbackAvailability", () => ({
  isNativeCatalogPreview: () => false,
  isPwaWebSurface: () => true,
  isAdaptivePlaybackAvailable: () => true,
}));
beforeEach(() => {
  mockAudio = createConsumerAudioMock();
  mockParams = {};
  mockPath = "/";
  mockPush.mockClear();
  mockSetParams.mockClear();
});
function active(kind: "single" | "nature" | "hatha"): ConsumerSelection {
  const work = getConsumerWork("celestial-current")!;
  if (kind === "single")
    return {
      kind: "single",
      program: createSingleTrackProgram(work, "meditation"),
      outcome: "meditation",
      durationMinutes: 20,
    };
  if (kind === "nature")
    return {
      kind: "adaptive",
      program: createListeningNatureProgram(work, "meditation", 20, "rain"),
      request: {
        outcome: "meditation",
        durationMinutes: 20,
        mode: "sound-only",
        soundKind: "music",
        natureFamily: "rain",
        includeNatureBed: true,
        listeningWorkId: work.id,
      },
    };
  const request = {
    outcome: "yoga" as const,
    durationMinutes: 60 as const,
    mode: "sound-only" as const,
    soundKind: "music" as const,
    includeNatureBed: false,
    natureFamily: "sea" as const,
  };
  return {
    kind: "adaptive",
    request,
    program: createWholeFileReviewProgram({ ...request, seed: "return-hatha" }),
  };
}
it.each(["single", "nature", "hatha"] as const)(
  "UI01 returns/resumes the same %s session without preparation or reset",
  async (kind) => {
    const selection = active(kind);
    mockAudio.setActive(selection);
    mockAudio.publish({
      status: "playing",
      remainingMs: 1166000,
      volume: 0.6,
      natureMixLevel: 0.3,
    });
    const content = () =>
      kind === "hatha" ? (
        <AdaptiveSessionSetup
          outcome="yoga"
          completePractice
          reviewProgramFactory={createWholeFileReviewProgram}
        />
      ) : (
        <ImmediateSessionSetup
          outcome="meditation"
          createNatureProgram={createListeningNatureProgram}
        />
      );
    const screen = await render(content());
    await fireEvent.press(
      screen.getByRole("button", { name: "Return to your session" }),
    );
    expect(mockPush).toHaveBeenLastCalledWith(consumerSelectionUrl(selection));
    expect(mockAudio.controller.prepareSelection).not.toHaveBeenCalled();
    expect(
      mockAudio.controller.startSelectionFromUserGesture,
    ).not.toHaveBeenCalled();
    mockAudio.publish({ status: "paused" });
    await screen.rerender(content());
    await fireEvent.press(
      screen.getByRole("button", { name: "Resume your session" }),
    );
    expect(mockAudio.controller.playFromUserGesture).toHaveBeenCalledTimes(1);
    expect(mockAudio.controller.getConsumerSelection()).toBe(selection);
    expect(mockAudio.snapshot).toMatchObject({
      remainingMs: 1166000,
      volume: 0.6,
      natureMixLevel: 0.3,
    });
    await fireEvent.press(screen.getByText("Prepare a new session →"));
    await waitFor(() =>
      expect(mockAudio.controller.prepareSelection).toHaveBeenCalled(),
    );
    expect(
      mockAudio.controller.startSelectionFromUserGesture,
    ).not.toHaveBeenCalled();
  },
);
it.each(["daily-to-hatha", "hatha-to-daily", "adaptive-nature"] as const)(
  "UI01 protects the same outcome across session forms: %s",
  async (direction) => {
    const request = {
      outcome: "relax" as const,
      durationMinutes: 20 as const,
      mode: "sound-only" as const,
      soundKind: "nature" as const,
      natureFamily: "sea" as const,
    };
    const selection: ConsumerSelection =
      direction === "hatha-to-daily"
        ? active("hatha")
        : direction === "daily-to-hatha"
          ? {
              kind: "single",
              program: createSingleTrackProgram(
                getConsumerWork("quiet-field")!,
                "yoga",
              ),
              outcome: "yoga",
              durationMinutes: 30,
            }
          : {
              kind: "adaptive",
              request,
              program: createAdaptiveSessionProgram({
                ...request,
                seed: "return-nature",
                allowProvisionalMetadata: true,
              }),
            };
    mockAudio.setActive(selection);
    mockAudio.publish({ status: "paused", remainingMs: 1000000 });
    const screen = await render(
      direction === "daily-to-hatha" ? (
        <AdaptiveSessionSetup
          outcome="yoga"
          completePractice
          reviewProgramFactory={createWholeFileReviewProgram}
        />
      ) : (
        <ImmediateSessionSetup
          outcome={direction === "adaptive-nature" ? "relax" : "yoga"}
        />
      ),
    );
    await fireEvent.press(
      screen.getByRole("button", { name: "Resume your session" }),
    );
    expect(mockPush).toHaveBeenLastCalledWith(consumerSelectionUrl(selection));
    expect(mockAudio.controller.prepareSelection).not.toHaveBeenCalled();
    expect(
      mockAudio.controller.startSelectionFromUserGesture,
    ).not.toHaveBeenCalled();
    expect(mockAudio.snapshot.remainingMs).toBe(1000000);
  },
);
it("UI02 missing route metadata uses the active non-primary outcome without duplicate controls", async () => {
  const work = getConsumerWork("pink-noise")!;
  const selection: ConsumerSelection = {
    kind: "single",
    program: createSingleTrackProgram(work, "massage"),
    outcome: "massage",
    durationMinutes: 90,
  };
  mockAudio.setActive(selection);
  mockAudio.publish({ status: "paused", remainingMs: 5300000 });
  mockPath = "/listen/pink-noise";
  mockParams = { workId: "pink-noise" };
  const screen = await render(
    <>
      <ConsumerPlayer />
      <CurrentSessionBar />
    </>,
  );
  expect(screen.getByText("Timer · 90 min +")).toBeTruthy();
  expect(screen.getByTestId("fixed-player-controls")).toBeTruthy();
  expect(screen.queryByTestId("current-session-bar")).toBeNull();
  expect(mockAudio.controller.prepareSelection).not.toHaveBeenCalled();
});
it.each(["single", "nature"] as const)(
  "UI02 keeps Resume and Stop for the old20 when a paused %s prepares45",
  async (kind) => {
    const selection = active(kind);
    mockAudio.setActive(selection);
    mockAudio.publish({ status: "paused", remainingMs: 1192000 });
    mockPath = "/listen/celestial-current";
    mockParams = {
      workId: "celestial-current",
      outcome: "meditation",
      duration: "20",
      ...(kind === "nature" ? { nature: "rain" } : {}),
    };
    const content = () => (
      <>
        <ConsumerPlayer createNatureProgram={createListeningNatureProgram} />
        <CurrentSessionBar />
      </>
    );
    const screen = await render(content());
    expect(screen.queryByTestId("current-session-bar")).toBeNull();
    await fireEvent.press(screen.getByText("Timer · 20 min +"));
    await fireEvent.press(screen.getByRole("radio", { name: "45 minutes" }));
    await screen.rerender(content());
    await waitFor(() =>
      expect(
        screen.getByRole("button", { name: "Start new session" }),
      ).toBeEnabled(),
    );
    expect(mockParams.duration).toBe("45");
    expect(screen.getByText("New session ready")).toBeTruthy();
    expect(screen.getByText("Paused · 19:52 left · Return →")).toBeTruthy();
    expect(
      screen.getByRole("button", { name: "Resume current session" }),
    ).toBeEnabled();
    expect(
      screen.getByRole("button", { name: "Stop current session" }),
    ).toBeEnabled();
    expect(screen.queryByTestId("fixed-player-controls")).toBeNull();
    expect(mockAudio.snapshot.remainingMs).toBe(1192000);
    expect(
      mockAudio.controller.startSelectionFromUserGesture,
    ).not.toHaveBeenCalled();
    await fireEvent.press(
      screen.getByRole("button", { name: "Return to current session" }),
    );
    expect(mockPush).toHaveBeenLastCalledWith(consumerSelectionUrl(selection));
  },
);
it("UI02 handles missing route details and explicit Off without inheriting old rain", async () => {
  const selection = active("nature");
  mockAudio.setActive(selection);
  mockAudio.publish({ status: "paused", remainingMs: 1192000 });
  mockPath = "/listen/celestial-current";
  mockParams = { workId: "celestial-current" };
  const content = () => (
    <>
      <ConsumerPlayer createNatureProgram={createListeningNatureProgram} />
      <CurrentSessionBar />
    </>
  );
  const screen = await render(content());
  expect(screen.getByText("Timer · 20 min +")).toBeTruthy();
  expect(screen.queryByTestId("current-session-bar")).toBeNull();
  expect(mockAudio.controller.prepareSelection).not.toHaveBeenCalled();
  mockParams = { ...mockParams, nature: "off" };
  await screen.rerender(content());
  expect(screen.getByTestId("current-session-bar")).toBeTruthy();
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
it("UI06 catches a failing nature factory, preserves choice and retries without blanking the player", async () => {
  mockParams = {
    workId: "celestial-current",
    nature: "rain",
    duration: "20",
    outcome: "meditation",
  };
  const factory = jest
    .fn(createListeningNatureProgram)
    .mockImplementationOnce(() => {
      throw new Error("Invalid PCM timeline entry");
    });
  const screen = await render(<ConsumerPlayer createNatureProgram={factory} />);
  expect(screen.getByRole("alert")).toHaveTextContent(
    /This sound could not play/,
  );
  expect(screen.queryByText("Invalid PCM timeline entry")).toBeNull();
  expect(screen.getByTestId("consumer-play-pause")).toBeDisabled();
  await fireEvent.press(screen.getByText("Retry loading"));
  await waitFor(() =>
    expect(screen.getByTestId("consumer-play-pause")).toBeEnabled(),
  );
  expect(factory.mock.calls.at(-1)?.[3]).toBe("rain");
  expect(
    mockAudio.controller.startSelectionFromUserGesture,
  ).not.toHaveBeenCalled();
});
