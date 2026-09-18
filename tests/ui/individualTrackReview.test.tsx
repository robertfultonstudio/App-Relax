import { act, fireEvent, render, waitFor } from "@testing-library/react-native";
import {
  IndividualTrackReview,
  LOOP_REVIEW_WORKS,
} from "@/pwa-review/IndividualTrackReview";
import PwaPlayer from "@/app-pwa/listen/[workId]";
import { createListeningNatureProgram } from "@/pwa-review/createListeningNatureProgram";
import { createConsumerAudioMock, deferred } from "./helpers/consumerAudioMock";
import { PwaViewProvider } from "@/pwa-view/PwaViewProvider";
import { getConsumerWork } from "@/content/consumerCatalog";
import { replaceCoordinatedNatureBed } from "@/domain/sessions/continuumPlanner";
import { createSingleTrackProgram } from "@/domain/audio/consumerTypes";

const makeAudio = () => {
  const audio = createConsumerAudioMock();
  const controller = Object.assign(audio.controller, {
    configureAdaptiveAudition: jest.fn(async () => undefined),
    seekAdaptiveSession: jest.fn(async () => undefined),
    getAdaptiveReviewPosition: jest.fn(() => null),
  });
  return Object.assign(audio, { controller });
};
let mockAudio = makeAudio();
let mockPwa = true;
let mockParams: Record<string, string> = {};
const mockPush = jest.fn();
jest.mock("expo-router", () => ({
  useRouter: () => ({
    push: mockPush,
    back: jest.fn(),
    setParams: jest.fn(),
  }),
  useLocalSearchParams: () => mockParams,
  useGlobalSearchParams: () => mockParams,
  useFocusEffect: (callback: () => void) => {
    const { useEffect } = jest.requireActual("react");
    useEffect(callback, [callback]);
  },
}));

const player = () =>
  render(
    <PwaViewProvider>
      <PwaPlayer />
    </PwaViewProvider>,
  );
jest.mock("expo-linear-gradient", () => ({ LinearGradient: "LinearGradient" }));
jest.mock("@/audio/AudioProvider", () => ({
  useAudioSession: () => mockAudio,
}));
jest.mock("@/domain/sessions/playbackAvailability", () => ({
  isNativeCatalogPreview: () => false,
  isPwaWebSurface: () => mockPwa,
  isAdaptivePlaybackAvailable: () => true,
}));
beforeEach(() => {
  mockAudio = makeAudio();
  mockParams = {};
  mockPwa = true;
  mockPush.mockClear();
});
it("lists exactly all 45 delivered files once, with eight Hatha, thirteen other music and 24 nature", async () => {
  const screen = await render(<IndividualTrackReview />);
  expect(LOOP_REVIEW_WORKS).toHaveLength(45);
  expect(new Set(LOOP_REVIEW_WORKS.map((w) => w.assetKey)).size).toBe(45);
  expect(screen.getByText("Respiro Hatha 1 · 8")).toBeTruthy();
  expect(screen.getByText("Music · 13")).toBeTruthy();
  expect(screen.getByText("Natural sounds · 24")).toBeTruthy();
  expect(screen.getAllByRole("button", { name: /^Test loop:/ })).toHaveLength(
    45,
  );
  expect(
    LOOP_REVIEW_WORKS.every(
      (w) => w.sourceKind === "file" && w.deliveryScope !== "local-only",
    ),
  ).toBe(true);
  for (const id of [
    "eclipse-veil",
    "stillwater-halo",
    "soft-air",
    "deep-river",
    "moon-drone",
  ])
    expect(LOOP_REVIEW_WORKS.some((w) => w.id === id)).toBe(false);
});
it("stops the previous session before navigating to an isolated test, never auto-playing", async () => {
  const pending = deferred<undefined>();
  mockAudio.controller.stop.mockReturnValueOnce(pending.promise);
  const screen = await render(<IndividualTrackReview />);
  await fireEvent.press(
    screen.getByRole("button", { name: "Test loop: Threshold of Breath" }),
  );
  expect(mockPush).not.toHaveBeenCalled();
  await act(async () => pending.resolve(undefined));
  expect(mockPush).toHaveBeenCalledWith(
    "/listen/respiro-hatha-1-01?review=1&isolated=1",
  );
  expect(
    mockAudio.controller.startSelectionFromUserGesture,
  ).not.toHaveBeenCalled();
});
it("keeps the catalogue in place if stopping fails", async () => {
  mockAudio.controller.stop.mockRejectedValueOnce(new Error("Stop failed"));
  const screen = await render(<IndividualTrackReview />);
  await fireEvent.press(
    screen.getByRole("button", { name: "Test loop: Threshold of Breath" }),
  );
  expect(screen.getByRole("alert")).toHaveTextContent("Stop failed");
  expect(mockPush).not.toHaveBeenCalled();
});
it("cannot render the review catalogue outside PWA", async () => {
  mockPwa = false;
  const screen = await render(<IndividualTrackReview />);
  expect(screen.queryByText("Individual loop tests")).toBeNull();
});
it("opens review on the same consumer player but cannot inherit or add a natural overlay", async () => {
  mockParams = {
    workId: "respiro-hatha-1-01",
    review: "1",
    isolated: "1",
    nature: "rain",
  };
  const work = LOOP_REVIEW_WORKS.find((w) => w.id === mockParams.workId)!;
  const program = createListeningNatureProgram(work, "yoga", 30, "rain");
  mockAudio.setActive({
    kind: "adaptive",
    program,
    request: {
      listeningWorkId: work.id,
      includeNatureBed: true,
      outcome: "yoga",
      durationMinutes: 30,
      mode: "sound-only",
      soundKind: "music",
      natureFamily: "rain",
    },
  });
  const screen = await player();
  expect(screen.getByTestId("review-source-file")).toHaveTextContent(
    /Selected track: Threshold of Breath/,
  );
  expect(screen.queryByRole("radio", { name: "Ambience Rain" })).toBeNull();
  await waitFor(() =>
    expect(mockAudio.controller.prepareSelection).toHaveBeenCalledWith(
      expect.objectContaining({ kind: "single" }),
    ),
  );
  expect(
    mockAudio.controller.startSelectionFromUserGesture,
  ).not.toHaveBeenCalled();
});

it.each([undefined, "1"])(
  "opens the nature-mixed player timeline without hiding review (review=%s)",
  async (review) => {
    mockParams = {
      workId: "respiro-hatha-1-01",
      nature: "rain",
      outcome: "yoga",
      duration: "30",
    };
    if (review) mockParams.review = review;
    const work = LOOP_REVIEW_WORKS.find((w) => w.id === mockParams.workId)!;
    const program = createListeningNatureProgram(work, "yoga", 30, "rain");
    mockAudio.setActive({
      kind: "adaptive",
      program,
      request: {
        listeningWorkId: work.id,
        includeNatureBed: true,
        outcome: "yoga",
        durationMinutes: 30,
        mode: "sound-only",
        soundKind: "music",
        natureFamily: "rain",
      },
    });
    const screen = await player();
    expect(
      screen.getByRole("button", {
        name: "Workbench review controls",
        expanded: true,
      }),
    ).toBeTruthy();
    expect(screen.getByTestId("review-full-timeline")).toBeTruthy();
    expect(
      mockAudio.controller.startSelectionFromUserGesture,
    ).not.toHaveBeenCalled();
  },
);

it("opens the ordinary listening timeline without a query and never auto-plays", async () => {
  mockParams = { workId: "respiro-hatha-1-01" };
  const screen = await player();
  expect(
    screen.getByRole("button", {
      name: "Workbench review controls",
      expanded: true,
    }),
  ).toBeTruthy();
  expect(screen.getByTestId("review-segment-0")).toBeTruthy();
  expect(
    mockAudio.controller.startSelectionFromUserGesture,
  ).not.toHaveBeenCalled();
});

it("honors an explicit closed preview and query changes on the same player", async () => {
  mockParams = { workId: "respiro-hatha-1-01", review: "0" };
  const screen = await player();
  expect(screen.queryByTestId("review-segment-0")).toBeNull();
  mockParams = { workId: "respiro-hatha-1-01" };
  await screen.rerender(
    <PwaViewProvider>
      <PwaPlayer />
    </PwaViewProvider>,
  );
  expect(screen.getByTestId("review-segment-0")).toBeTruthy();
  mockParams = { ...mockParams, review: "0" };
  await screen.rerender(
    <PwaViewProvider>
      <PwaPlayer />
    </PwaViewProvider>,
  );
  expect(screen.queryByTestId("review-segment-0")).toBeNull();
  expect(
    mockAudio.controller.startSelectionFromUserGesture,
  ).not.toHaveBeenCalled();
});

it("keeps the Error state on the same route while consumer copy hides the Workbench diagnostic", async () => {
  mockParams = {
    workId: "respiro-hatha-1-01",
    outcome: "yoga",
    duration: "30",
    review: "0",
    isolated: "1",
  };
  const work = LOOP_REVIEW_WORKS.find((item) => item.id === mockParams.workId)!;
  mockAudio.setActive({
    kind: "single",
    program: createSingleTrackProgram(work, "yoga"),
    outcome: "yoga",
    durationMinutes: 30,
  });
  mockAudio.publish({
    status: "error",
    workId: work.id,
    error: "Decoder 451 integrity mismatch",
  });
  const screen = await player();
  expect(screen.getByRole("alert")).toHaveTextContent(
    "This saved sound needs an update. Reconnect and retry loading.",
  );
  expect(screen.queryByText(/Technical detail:/)).toBeNull();
  expect(screen.queryByTestId("private-player-review")).toBeNull();

  mockParams = { ...mockParams, review: "1" };
  await screen.rerender(
    <PwaViewProvider>
      <PwaPlayer />
    </PwaViewProvider>,
  );
  await waitFor(() =>
    expect(screen.getByTestId("private-player-review")).toBeTruthy(),
  );
  expect(screen.getByText(/Technical detail:/)).toHaveTextContent(
    /Decoder 451 integrity mismatch/,
  );
  expect(
    mockAudio.controller.startSelectionFromUserGesture,
  ).not.toHaveBeenCalled();
});

it("keeps one PWA route and listening run through 20 live ambience changes, Retry, Pause, seek and Stop", async () => {
  mockParams = {
    workId: "astral-thread",
    outcome: "focus",
    duration: "30",
    nature: "rain",
    review: "0",
  };
  const work = getConsumerWork("astral-thread")!;
  let current = createListeningNatureProgram(work, "focus", 30, "rain");
  const request = {
    listeningWorkId: work.id,
    includeNatureBed: true,
    outcome: "focus" as const,
    durationMinutes: 30 as const,
    mode: "sound-only" as const,
    soundKind: "music" as const,
    natureFamily: "rain" as const,
  };
  mockAudio.setActive({ kind: "adaptive", program: current, request }, 7);
  mockAudio.publish({
    status: "playing",
    sessionPlanId: current.plan.id,
    remainingMs: 29 * 60_000,
    deadlineMs: 30 * 60_000,
    natureMixLevel: 0.4,
  });
  let failNext = false;
  const change = jest.fn(
    async (family: "rain" | "sea"): Promise<typeof current> => {
      if (failNext) {
        failNext = false;
        throw new Error("Injected ambience change failure");
      }
      current = replaceCoordinatedNatureBed(current, family);
      mockAudio.setActive(
        {
          kind: "adaptive",
          program: current,
          request: {
            ...request,
            includeNatureBed: true,
            natureFamily: family,
          },
        },
        7,
      );
      return current;
    },
  );
  Object.assign(mockAudio.controller, {
    canChangeNatureFamily: () => true,
    changeNatureFamily: change,
    cancelNatureFamilyChange: jest.fn(),
  });
  const screen = await player();
  expect(screen.getByRole("button", { name: "Pause" })).toBeEnabled();
  expect(
    screen.getByRole("radio", { name: "Ambience Rain", checked: true }),
  ).toBeEnabled();
  const programId = current.plan.id;
  const remainingMs = mockAudio.snapshot.remainingMs;
  const deadlineMs = mockAudio.snapshot.deadlineMs;

  for (let index = 0; index < 20; index += 1) {
    const family = index % 2 === 0 ? "sea" : "rain";
    const name = family === "sea" ? "Ambience Ocean waves" : "Ambience Rain";
    await fireEvent.press(screen.getByRole("radio", { name }));
    await waitFor(() => expect(change).toHaveBeenCalledTimes(index + 1));
    await waitFor(() =>
      expect(screen.getByRole("radio", { name, checked: true })).toBeTruthy(),
    );
    expect(current.plan.id).toBe(programId);
    expect(mockAudio.controller.getListeningRun()).toBe(7);
    expect(mockAudio.snapshot.remainingMs).toBe(remainingMs);
    expect(mockAudio.snapshot.deadlineMs).toBe(deadlineMs);
    expect(current.plan.natureMix?.selectedFamily).toBe(family);
  }

  failNext = true;
  await fireEvent.press(
    screen.getByRole("radio", { name: "Ambience Ocean waves" }),
  );
  await waitFor(() =>
    expect(screen.getByText("Injected ambience change failure")).toBeTruthy(),
  );
  expect(
    screen.getByRole("radio", { name: "Ambience Rain", checked: true }),
  ).toBeTruthy();
  expect(
    mockAudio.controller.startSelectionFromUserGesture,
  ).not.toHaveBeenCalled();
  expect(mockAudio.controller.prepareSelection).not.toHaveBeenCalled();

  await fireEvent.press(
    screen.getByRole("button", { name: "Retry ambience change" }),
  );
  await waitFor(() =>
    expect(
      screen.getByRole("radio", {
        name: "Ambience Ocean waves",
        checked: true,
      }),
    ).toBeTruthy(),
  );
  expect(change).toHaveBeenCalledTimes(22);
  expect(current.plan.id).toBe(programId);

  await fireEvent.press(screen.getByRole("button", { name: "Pause" }));
  expect(mockAudio.controller.pause).toHaveBeenCalledTimes(1);
  mockAudio.publish({ status: "paused" });
  mockParams = { ...mockParams, review: "1" };
  await screen.rerender(
    <PwaViewProvider>
      <PwaPlayer />
    </PwaViewProvider>,
  );
  await waitFor(() =>
    expect(screen.getByTestId("review-full-timeline")).toBeTruthy(),
  );
  await fireEvent.press(
    screen.getByRole("button", { name: "Next timeline point" }),
  );
  await waitFor(() =>
    expect(mockAudio.controller.seekAdaptiveSession).toHaveBeenCalledTimes(1),
  );
  await fireEvent.press(screen.getByRole("button", { name: "Stop review" }));
  expect(mockAudio.controller.stop).toHaveBeenCalledTimes(1);
  expect(
    mockAudio.controller.startSelectionFromUserGesture,
  ).not.toHaveBeenCalled();
  console.log(
    "PWA_ROUTE_20_CHANGE_RECEIPT",
    JSON.stringify({
      route: "/listen/astral-thread",
      reviewSwitch: "0→1",
      listeningRun: 7,
      successfulAlternatingChanges: 20,
      injectedFailure: true,
      retrySucceeded: true,
      totalChangeCalls: change.mock.calls.length,
      samePlanId: current.plan.id === programId,
      remainingMsUnchanged: mockAudio.snapshot.remainingMs === remainingMs,
      deadlineMsUnchanged: mockAudio.snapshot.deadlineMs === deadlineMs,
      pauseCalls: mockAudio.controller.pause.mock.calls.length,
      seekCalls: mockAudio.controller.seekAdaptiveSession.mock.calls.length,
      stopCalls: mockAudio.controller.stop.mock.calls.length,
      automaticStartCalls:
        mockAudio.controller.startSelectionFromUserGesture.mock.calls.length,
    }),
  );
});
