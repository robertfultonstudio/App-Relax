import { act, fireEvent, render, waitFor } from "@testing-library/react-native";
import {
  IndividualTrackReview,
  LOOP_REVIEW_WORKS,
} from "@/pwa-review/IndividualTrackReview";
import PwaPlayer from "@/app-pwa/listen/[workId]";
import { createListeningNatureProgram } from "@/pwa-review/createListeningNatureProgram";
import { createConsumerAudioMock, deferred } from "./helpers/consumerAudioMock";

const makeAudio = () => {
  const audio = createConsumerAudioMock();
  return {
    ...audio,
    controller: {
      ...audio.controller,
      configureAdaptiveAudition: jest.fn(async () => undefined),
    },
  };
};
let mockAudio = makeAudio();
let mockPwa = true;
let mockParams: Record<string, string> = {};
const mockPush = jest.fn();
jest.mock("expo-router", () => ({
  useRouter: () => ({ push: mockPush, back: jest.fn() }),
  useLocalSearchParams: () => mockParams,
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
  const screen = await render(<PwaPlayer />);
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
    const screen = await render(<PwaPlayer />);
    expect(
      screen.getByRole("button", {
        name: "Development review controls",
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
  const screen = await render(<PwaPlayer />);
  expect(
    screen.getByRole("button", {
      name: "Development review controls",
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
  const screen = await render(<PwaPlayer />);
  expect(screen.queryByTestId("review-segment-0")).toBeNull();
  mockParams = { workId: "respiro-hatha-1-01" };
  await screen.rerender(<PwaPlayer />);
  expect(screen.getByTestId("review-segment-0")).toBeTruthy();
  mockParams = { ...mockParams, review: "0" };
  await screen.rerender(<PwaPlayer />);
  expect(screen.queryByTestId("review-segment-0")).toBeNull();
  expect(
    mockAudio.controller.startSelectionFromUserGesture,
  ).not.toHaveBeenCalled();
});
