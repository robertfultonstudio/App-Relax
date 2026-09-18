import { act, fireEvent, render, waitFor } from "@testing-library/react-native";
import {
  PwaPlayerReviewControls,
  clampReviewPosition,
} from "@/pwa-review/PwaPlayerReviewControls";
import { HATHA_AUDIO_WORKS } from "@/content/hathaCatalog";
import { createAdaptiveSessionProgram } from "@/domain/sessions/continuumPlanner";
import { createWholeFileReviewProgram } from "@/pwa-review/createWholeFileReviewProgram";
import { createConsumerAudioMock, deferred } from "./helpers/consumerAudioMock";

let mockPwa = true;
const mockPush = jest.fn();
jest.mock("expo-router", () => ({ useRouter: () => ({ push: mockPush }) }));
const makeAudio = () => {
  const audio = createConsumerAudioMock();
  return {
    ...audio,
    controller: {
      ...audio.controller,
      seekSingleTrack: jest.fn(async (_n: number) => {}),
      seekAdaptiveSession: jest.fn(async (_n: number) => {}),
      configureAdaptiveAudition: jest.fn(
        async (_v: unknown, _options?: unknown) => {},
      ),
    },
  };
};
let mockAudio = makeAudio();
jest.mock("@/audio/AudioProvider", () => ({
  useAudioSession: () => mockAudio,
}));
jest.mock("@/domain/sessions/playbackAvailability", () => ({
  isNativeCatalogPreview: () => false,
  isPwaWebSurface: () => mockPwa,
  isAdaptivePlaybackAvailable: () => true,
}));
const single = () => ({
  kind: "single" as const,
  work: HATHA_AUDIO_WORKS[0],
  matching: true,
  elapsedSeconds: 0,
});
const program = () =>
  createAdaptiveSessionProgram({
    outcome: "relax",
    durationMinutes: 30,
    mode: "sound-only",
    soundKind: "nature",
    natureFamily: "sea",
    seed: "private-review-controls",
    allowProvisionalMetadata: true,
  });
beforeEach(() => {
  mockPwa = true;
  mockAudio = makeAudio();
  mockAudio.snapshot.status = "playing";
});
it("prepares only the next isolated loop while paused; resume cancels without blocking controls", async () => {
  const screen = await render(
    <PwaPlayerReviewControls initiallyOpen target={single()} />,
  );
  expect(mockAudio.controller.prepareReviewSeek).not.toHaveBeenCalled();
  const pending = deferred<boolean>();
  mockAudio.controller.prepareReviewSeek.mockReturnValueOnce(pending.promise);
  mockAudio.snapshot.status = "paused";
  await screen.rerender(
    <PwaPlayerReviewControls initiallyOpen target={single()} />,
  );
  await waitFor(() =>
    expect(mockAudio.controller.prepareReviewSeek).toHaveBeenCalledWith(
      single().work.durationSeconds - 5,
      expect.any(AbortSignal),
    ),
  );
  const signal = mockAudio.controller.prepareReviewSeek.mock.calls[0]![1];
  expect(
    screen.getByRole("button", { name: "Last 5 seconds · loop test" }),
  ).toBeEnabled();
  mockAudio.snapshot.status = "playing";
  await screen.rerender(
    <PwaPlayerReviewControls initiallyOpen target={single()} />,
  );
  expect(signal.aborted).toBe(true);
  await act(async () => pending.resolve(true));
  expect(screen.queryByText(/network windows prepared/)).toBeNull();
});
it("opens an explicit 90-minute review with eight works, loop markers and all joins before Play", async () => {
  const p = createWholeFileReviewProgram({
    outcome: "yoga",
    durationMinutes: 90,
    mode: "sound-only",
    soundKind: "music",
    seed: "visible-90",
  });
  const screen = await render(
    <PwaPlayerReviewControls
      initiallyOpen
      target={{
        kind: "adaptive",
        program: p,
        matching: false,
        onVariant: jest.fn(),
      }}
    />,
  );
  expect(screen.getByText(/90-minute review · eight music works/)).toBeTruthy();
  expect(
    screen.getByText("Session position · 00:00.00 / 90:00.00"),
  ).toBeTruthy();
  expect(screen.getAllByTestId(/^review-segment-/)).toHaveLength(8);
  expect(screen.getAllByRole("button", { name: /^Loop [0-9]/ })).toHaveLength(
    2,
  );
  expect(
    screen.getAllByRole("button", { name: /^Audition join/ }),
  ).toHaveLength(7);
  expect(screen.queryByText("A / B · CHANGE DURATION & CURVE")).toBeNull();
  expect(
    mockAudio.controller.startSelectionFromUserGesture,
  ).not.toHaveBeenCalled();
});
it("shows every Hatha source and both ends of all music and nature joins", async () => {
  const p = createWholeFileReviewProgram({
    outcome: "yoga",
    durationMinutes: 30,
    mode: "sound-only",
    soundKind: "music",
    seed: "all-joins",
    natureFamily: "rain",
    includeNatureBed: true,
  });
  const screen = await render(
    <PwaPlayerReviewControls
      target={{
        kind: "adaptive",
        program: p,
        matching: true,
        onVariant: jest.fn(),
      }}
    />,
  );
  await fireEvent.press(
    screen.getByRole("button", { name: "Development review controls" }),
  );
  for (const segment of p.plan.segments)
    expect(screen.getByTestId(`review-segment-${segment.index}`)).toBeTruthy();
  expect(
    screen.getAllByRole("button", { name: /^Join [0-9]+ start/ }),
  ).toHaveLength(p.plan.transitions.length);
  expect(
    screen.getAllByRole("button", { name: /^Join [0-9]+ end/ }),
  ).toHaveLength(p.plan.transitions.length);
  await fireEvent.press(
    screen.getAllByRole("button", { name: /^Join [0-9]+ end/ })[1],
  );
  await waitFor(() =>
    expect(mockAudio.controller.seekAdaptiveSession).toHaveBeenLastCalledWith(
      p.plan.transitions[1].endSeconds,
      true,
    ),
  );
});

it("is absent outside the explicitly selected PWA surface", async () => {
  mockPwa = false;
  const screen = await render(<PwaPlayerReviewControls target={single()} />);
  if (mockPwa) {
    expect(screen.queryByTestId("review-source-file")).toBeNull();
    await fireEvent.press(
      screen.getByRole("button", { name: "Development review controls" }),
    );
  }
  expect(screen.queryByTestId("private-player-review")).toBeNull();
});
it("identifies the actual musical file in review without claiming an inactive selection is playing", async () => {
  const screen = await render(<PwaPlayerReviewControls target={single()} />);
  if (mockPwa) {
    expect(screen.queryByTestId("review-source-file")).toBeNull();
    await fireEvent.press(
      screen.getByRole("button", { name: "Development review controls" }),
    );
  }
  expect(screen.getByTestId("review-source-file")).toHaveTextContent(
    /Active track: Threshold of Breath/,
  );
  expect(screen.getByTestId("review-source-file")).toHaveTextContent(
    /01_soglia_del_respiro_LOOP_48K24\.wav/,
  );
  await screen.rerender(
    <PwaPlayerReviewControls target={{ ...single(), matching: false }} />,
  );
  expect(screen.getByTestId("review-source-file")).toHaveTextContent(
    /Selected track:/,
  );
});
it("never loads a different sound or starts playback from a review control", async () => {
  const screen = await render(
    <PwaPlayerReviewControls target={{ ...single(), matching: false }} />,
  );
  if (mockPwa) {
    expect(screen.queryByTestId("review-source-file")).toBeNull();
    await fireEvent.press(
      screen.getByRole("button", { name: "Development review controls" }),
    );
  }
  expect(
    screen.getByRole("button", { name: "Forward 30 seconds" }),
  ).toBeDisabled();
  expect(
    mockAudio.controller.startSelectionFromUserGesture,
  ).not.toHaveBeenCalled();
  expect(mockAudio.controller.loadProgram).not.toHaveBeenCalled();
});
it("seeks Hatha through the controller and exposes its circular-loop test without invented transitions", async () => {
  const screen = await render(<PwaPlayerReviewControls target={single()} />);
  if (mockPwa) {
    expect(screen.queryByTestId("review-source-file")).toBeNull();
    await fireEvent.press(
      screen.getByRole("button", { name: "Development review controls" }),
    );
  }
  await fireEvent.press(
    screen.getByRole("button", { name: "Last 15 seconds · loop test" }),
  );
  expect(mockAudio.controller.seekSingleTrack).toHaveBeenCalledWith(450.75);
  expect(screen.queryByRole("button", { name: "Next change" })).toBeNull();
  expect(
    screen.getByText(/Hatha loop test: this file repeats alone/),
  ).toBeTruthy();
});
it("offers an isolated-file catalogue and a five-second seam test, without starting audio", async () => {
  const screen = await render(
    <PwaPlayerReviewControls initiallyOpen target={single()} />,
  );
  await fireEvent.press(
    screen.getByRole("link", { name: "Individual tracks · loop tests →" }),
  );
  expect(mockPush).toHaveBeenCalledWith("/loop-review");
  await fireEvent.press(
    screen.getByRole("button", { name: "Last 5 seconds · loop test" }),
  );
  expect(mockAudio.controller.seekSingleTrack).toHaveBeenCalledWith(460.75);
  expect(mockAudio.controller.playFromUserGesture).not.toHaveBeenCalled();
  expect(screen.getByTestId("review-source-file")).toHaveTextContent(
    /Online lossless file: .*\.flac/,
  );
});
it("does not add seek preparation time to the displayed file position", async () => {
  const pending = deferred();
  mockAudio.controller.seekSingleTrack.mockReturnValueOnce(pending.promise);
  const screen = await render(
    <PwaPlayerReviewControls initiallyOpen target={single()} />,
  );
  await fireEvent.press(
    screen.getByRole("button", { name: "Last 5 seconds · loop test" }),
  );
  mockAudio.publish({ remainingMs: 30 * 60_000 - 2000 });
  await act(async () => pending.resolve());
  await screen.rerender(
    <PwaPlayerReviewControls
      initiallyOpen
      target={{ ...single(), elapsedSeconds: 2 }}
    />,
  );
  expect(screen.getByText("File position · 07:40.75 / 07:45.75")).toBeTruthy();
  await screen.rerender(
    <PwaPlayerReviewControls
      initiallyOpen
      target={{ ...single(), elapsedSeconds: 8 }}
    />,
  );
  expect(screen.getByText("File position · 00:01.00 / 07:45.75")).toBeTruthy();
});
it("range interaction previews while dragging then commits one actual seek", async () => {
  const screen = await render(<PwaPlayerReviewControls target={single()} />);
  if (mockPwa) {
    expect(screen.queryByTestId("review-source-file")).toBeNull();
    await fireEvent.press(
      screen.getByRole("button", { name: "Development review controls" }),
    );
  }
  const slider = screen.getByLabelText("Review position");
  await fireEvent(slider, "pointerDown", {
    currentTarget: { value: "0", setPointerCapture: jest.fn() },
    pointerId: 1,
  });
  await fireEvent(slider, "change", { currentTarget: { value: "120" } });
  expect(mockAudio.controller.seekSingleTrack).not.toHaveBeenCalled();
  await fireEvent(slider, "pointerUp", { currentTarget: { value: "120" } });
  expect(mockAudio.controller.seekSingleTrack).toHaveBeenCalledTimes(1);
  expect(mockAudio.controller.seekSingleTrack).toHaveBeenCalledWith(120);
});
it("commits keyboard and accessibility range changes without waiting for a pointer release", async () => {
  const screen = await render(<PwaPlayerReviewControls target={single()} />);
  await fireEvent.press(
    screen.getByRole("button", { name: "Development review controls" }),
  );
  const slider = screen.getByLabelText("Review position");
  await fireEvent(slider, "change", { currentTarget: { value: "120" } });
  expect(mockAudio.controller.seekSingleTrack).toHaveBeenCalledTimes(1);
  expect(mockAudio.controller.seekSingleTrack).toHaveBeenCalledWith(120);
  await fireEvent(slider, "keyUp", { currentTarget: { value: "120" } });
  expect(mockAudio.controller.seekSingleTrack).toHaveBeenCalledTimes(1);
});
it("clamps an out-of-bounds request without seeking exactly past the file", () => {
  expect(clampReviewPosition(999, 50)).toBe(49.999);
  expect(clampReviewPosition(-1, 50)).toBe(0);
  expect(clampReviewPosition(NaN, 50)).toBe(0);
});
it("serializes rapid seeks and surfaces a failed seek instead of claiming success", async () => {
  const pending = deferred();
  mockAudio.controller.seekSingleTrack.mockReturnValueOnce(pending.promise);
  const screen = await render(<PwaPlayerReviewControls target={single()} />);
  if (mockPwa) {
    expect(screen.queryByTestId("review-source-file")).toBeNull();
    await fireEvent.press(
      screen.getByRole("button", { name: "Development review controls" }),
    );
  }
  await fireEvent.press(
    screen.getByRole("button", { name: "Forward 30 seconds" }),
  );
  await fireEvent.press(
    screen.getByRole("button", { name: "Forward 30 seconds" }),
  );
  expect(mockAudio.controller.seekSingleTrack).toHaveBeenCalledTimes(1);
  await act(async () => pending.reject(new Error("Decoder seek failed")));
  expect(screen.getByText("Decoder seek failed")).toBeTruthy();
});
it("jumps to actual transition markers and loops incoming/outgoing using the existing audition API", async () => {
  const p = program();
  const screen = await render(
    <PwaPlayerReviewControls
      target={{
        kind: "adaptive",
        program: p,
        matching: true,
        onVariant: jest.fn(),
      }}
    />,
  );
  if (mockPwa) {
    expect(screen.queryByTestId("review-source-file")).toBeNull();
    await fireEvent.press(
      screen.getByRole("button", { name: "Development review controls" }),
    );
  }
  await fireEvent.press(screen.getByRole("button", { name: "Jump to change" }));
  expect(mockAudio.controller.seekAdaptiveSession).toHaveBeenLastCalledWith(
    p.plan.transitions[0].startSeconds,
    true,
  );
  expect(mockAudio.controller.configureAdaptiveAudition).not.toHaveBeenCalled();
  await fireEvent.press(
    screen.getByRole("button", { name: "Loop ±60 seconds" }),
  );
  await fireEvent.press(screen.getByRole("button", { name: "Hear incoming" }));
  expect(mockAudio.controller.seekAdaptiveSession).toHaveBeenCalledTimes(1);
  expect(
    mockAudio.controller.configureAdaptiveAudition,
  ).toHaveBeenLastCalledWith(
    expect.objectContaining({
      mode: "incoming",
      loopWindowSeconds: 60,
      transitionIndex: 0,
    }),
    { preservePosition: true, loop: true },
  );
  await fireEvent.press(screen.getByRole("button", { name: "Exit loop" }));
  expect(
    mockAudio.controller.configureAdaptiveAudition,
  ).toHaveBeenLastCalledWith(null);
});
it("prepares a validated B variant only after stopping, never autoplaying it", async () => {
  const p = program(),
    onVariant = jest.fn();
  const screen = await render(
    <PwaPlayerReviewControls
      target={{ kind: "adaptive", program: p, matching: true, onVariant }}
    />,
  );
  if (mockPwa) {
    expect(screen.queryByTestId("review-source-file")).toBeNull();
    await fireEvent.press(
      screen.getByRole("button", { name: "Development review controls" }),
    );
  }
  await fireEvent.press(screen.getByRole("button", { name: "Prepare B" }));
  await waitFor(() => expect(onVariant).toHaveBeenCalledTimes(1));
  expect(onVariant.mock.calls[0][0].plan.transitions[0].durationSeconds).toBe(
    240,
  );
  expect(mockAudio.controller.stop).toHaveBeenCalledTimes(1);
  expect(mockAudio.controller.play).not.toHaveBeenCalled();
  expect(
    mockAudio.controller.startSelectionFromUserGesture,
  ).not.toHaveBeenCalled();
  await fireEvent.press(screen.getByRole("button", { name: "Restore A" }));
  expect(onVariant).toHaveBeenLastCalledWith(p);
});

it("keeps the final seek intention while the decoder is busy, without an obsolete seek backlog", async () => {
  const pending = deferred();
  mockAudio.controller.seekSingleTrack.mockReturnValueOnce(pending.promise);
  const screen = await render(
    <PwaPlayerReviewControls initiallyOpen target={single()} />,
  );
  await fireEvent.press(
    screen.getByRole("button", { name: "Forward 30 seconds" }),
  );
  expect(screen.getByText("Loading the point 00:30.00…")).toBeTruthy();
  expect(
    screen.getByRole("button", { name: "Last 5 seconds · loop test" }),
  ).toBeEnabled();
  await fireEvent.press(
    screen.getByRole("button", { name: "Last 15 seconds · loop test" }),
  );
  await fireEvent.press(
    screen.getByRole("button", { name: "Last 5 seconds · loop test" }),
  );
  expect(mockAudio.controller.seekSingleTrack).toHaveBeenCalledTimes(1);
  await act(async () => pending.resolve());
  expect(mockAudio.controller.seekSingleTrack.mock.calls).toEqual([
    [30],
    [460.75],
  ]);
  expect(screen.getByText(/Ready at 07:40.75/)).toBeTruthy();
});

it("accumulates rapid next/previous intention but confirms selected joins only after success", async () => {
  const pending = deferred();
  mockAudio.controller.seekAdaptiveSession.mockReturnValueOnce(pending.promise);
  const p = program();
  const screen = await render(
    <PwaPlayerReviewControls
      initiallyOpen
      target={{
        kind: "adaptive",
        program: p,
        matching: true,
        onVariant: jest.fn(),
      }}
    />,
  );
  await fireEvent.press(screen.getByRole("button", { name: "Next change" }));
  expect(screen.getByText(/^SELECTED CHANGE 1 \//)).toBeTruthy();
  await fireEvent.press(screen.getByRole("button", { name: "Next change" }));
  await act(async () => pending.resolve());
  expect(mockAudio.controller.seekAdaptiveSession.mock.calls).toEqual([
    [p.plan.transitions[1].startSeconds, true],
    [p.plan.transitions[2].startSeconds, true],
  ]);
  expect(screen.getByText(/^SELECTED CHANGE 3 \//)).toBeTruthy();
});

it("separates the exact join point, preview lead-in and loop window", async () => {
  const p = program();
  const screen = await render(
    <PwaPlayerReviewControls
      initiallyOpen
      target={{
        kind: "adaptive",
        program: p,
        matching: true,
        onVariant: jest.fn(),
      }}
    />,
  );
  await fireEvent.press(screen.getByRole("button", { name: "Jump to change" }));
  expect(mockAudio.controller.seekAdaptiveSession).toHaveBeenLastCalledWith(
    p.plan.transitions[0].startSeconds,
    true,
  );
  await fireEvent.press(
    screen.getByRole("button", { name: "Preview change · 30 seconds before" }),
  );
  expect(mockAudio.controller.seekAdaptiveSession).toHaveBeenLastCalledWith(
    Math.max(0, p.plan.transitions[0].startSeconds - 30),
    true,
  );
  await fireEvent.press(
    screen.getByRole("button", { name: "Jump to change end" }),
  );
  expect(mockAudio.controller.seekAdaptiveSession).toHaveBeenLastCalledWith(
    p.plan.transitions[0].endSeconds,
    true,
  );
  expect(mockAudio.controller.configureAdaptiveAudition).not.toHaveBeenCalled();
});

it("changes outgoing/incoming in place without inventing a loop; Exit restores both without seeking", async () => {
  const p = program();
  const screen = await render(
    <PwaPlayerReviewControls
      initiallyOpen
      target={{
        kind: "adaptive",
        program: p,
        matching: true,
        onVariant: jest.fn(),
      }}
    />,
  );
  await fireEvent.press(screen.getByRole("button", { name: "Hear outgoing" }));
  expect(
    mockAudio.controller.configureAdaptiveAudition,
  ).toHaveBeenLastCalledWith(expect.objectContaining({ mode: "outgoing" }), {
    preservePosition: true,
    loop: false,
  });
  await fireEvent.press(screen.getByRole("button", { name: "Hear incoming" }));
  expect(
    mockAudio.controller.configureAdaptiveAudition,
  ).toHaveBeenLastCalledWith(expect.objectContaining({ mode: "incoming" }), {
    preservePosition: true,
    loop: false,
  });
  await fireEvent.press(screen.getByRole("button", { name: "Exit loop" }));
  expect(
    mockAudio.controller.configureAdaptiveAudition,
  ).toHaveBeenLastCalledWith(null);
  expect(
    screen.getByRole("button", { name: "Hear both", selected: true }),
  ).toBeTruthy();
  expect(mockAudio.controller.seekAdaptiveSession).not.toHaveBeenCalled();
});

it("clears audition isolation on an exact join seek", async () => {
  const p = program();
  const screen = await render(
    <PwaPlayerReviewControls
      initiallyOpen
      target={{
        kind: "adaptive",
        program: p,
        matching: true,
        onVariant: jest.fn(),
      }}
    />,
  );
  await fireEvent.press(
    screen.getByRole("button", { name: "Loop ±60 seconds" }),
  );
  await fireEvent.press(screen.getByRole("button", { name: "Hear incoming" }));
  await fireEvent.press(screen.getByRole("button", { name: "Next change" }));
  expect(mockAudio.controller.seekAdaptiveSession).toHaveBeenLastCalledWith(
    p.plan.transitions[1].startSeconds,
    true,
  );
  expect(
    screen.getByRole("button", { name: "Hear both", selected: true }),
  ).toBeTruthy();
  expect(screen.getByRole("button", { name: "Exit loop" })).toBeDisabled();
});

it("discards pending old-plan commands and resets review state on replacement", async () => {
  const pending = deferred();
  mockAudio.controller.seekAdaptiveSession.mockReturnValueOnce(pending.promise);
  const p = program();
  const screen = await render(
    <PwaPlayerReviewControls
      initiallyOpen
      target={{
        kind: "adaptive",
        program: p,
        matching: true,
        onVariant: jest.fn(),
      }}
    />,
  );
  await fireEvent.press(screen.getByRole("button", { name: "Next change" }));
  await fireEvent.press(screen.getByRole("button", { name: "Next change" }));
  mockAudio.setActive(null, 2);
  const replacement = {
    ...p,
    plan: { ...p.plan, id: `${p.plan.id}-replacement` },
  };
  await screen.rerender(
    <PwaPlayerReviewControls
      initiallyOpen
      target={{
        kind: "adaptive",
        program: replacement,
        matching: true,
        onVariant: jest.fn(),
      }}
    />,
  );
  await act(async () => pending.resolve());
  expect(mockAudio.controller.seekAdaptiveSession).toHaveBeenCalledTimes(1);
  expect(mockAudio.controller.configureAdaptiveAudition).not.toHaveBeenCalled();
  expect(screen.getByText(/^SELECTED CHANGE 1 \//)).toBeTruthy();
  expect(
    screen.getByRole("button", { name: "Hear both", selected: true }),
  ).toBeTruthy();
});

it("does not roll back an incoming selection when a queued loop is applied", async () => {
  const pending = deferred();
  mockAudio.controller.configureAdaptiveAudition.mockReturnValueOnce(
    pending.promise,
  );
  const p = program();
  const screen = await render(
    <PwaPlayerReviewControls
      initiallyOpen
      target={{
        kind: "adaptive",
        program: p,
        matching: true,
        onVariant: jest.fn(),
      }}
    />,
  );
  await fireEvent.press(screen.getByRole("button", { name: "Hear incoming" }));
  await fireEvent.press(
    screen.getByRole("button", { name: "Loop ±60 seconds" }),
  );
  await act(async () => pending.resolve());
  expect(
    mockAudio.controller.configureAdaptiveAudition,
  ).toHaveBeenLastCalledWith(
    expect.objectContaining({ mode: "incoming", loopWindowSeconds: 60 }),
  );
  expect(
    screen.getByRole("button", { name: "Hear incoming", selected: true }),
  ).toBeTruthy();
  expect(
    screen.getByRole("button", { name: "Loop ±60 seconds", selected: true }),
  ).toBeTruthy();
});

it("preserves variant A when the plan identity changes for a prepared B", async () => {
  const p = program();
  const onVariant = jest.fn();
  const screen = await render(
    <PwaPlayerReviewControls
      initiallyOpen
      target={{ kind: "adaptive", program: p, matching: true, onVariant }}
    />,
  );
  await fireEvent.press(screen.getByRole("button", { name: "Prepare B" }));
  await waitFor(() => expect(onVariant).toHaveBeenCalledTimes(1));
  const b = onVariant.mock.calls[0][0];
  expect(b.plan.id).not.toBe(p.plan.id);
  await screen.rerender(
    <PwaPlayerReviewControls
      initiallyOpen
      target={{ kind: "adaptive", program: b, matching: true, onVariant }}
    />,
  );
  await fireEvent.press(screen.getByRole("button", { name: "Restore A" }));
  await waitFor(() => expect(onVariant).toHaveBeenLastCalledWith(p));
});

it("seeks source loop markers exactly and exposes a separate fifteen-second preview", async () => {
  const p = createWholeFileReviewProgram({
    outcome: "yoga",
    durationMinutes: 90,
    mode: "sound-only",
    soundKind: "music",
    seed: "exact-loop",
  });
  const screen = await render(
    <PwaPlayerReviewControls
      initiallyOpen
      target={{
        kind: "adaptive",
        program: p,
        matching: true,
        onVariant: jest.fn(),
      }}
    />,
  );
  const segment = p.plan.segments.find((s) => {
    const work = p.works.find((w) => w.id === s.workId)!;
    return s.endFrame - s.startFrame > work.frameCount;
  })!;
  const work = p.works.find((w) => w.id === segment.workId)!;
  const seam =
    (segment.startFrame +
      work.frameCount -
      (segment.sourceEntryFrame % work.frameCount)) /
    p.plan.sampleRateHz;
  await fireEvent.press(
    screen.getAllByRole("button", { name: /^Loop [0-9]/ })[0],
  );
  expect(mockAudio.controller.seekAdaptiveSession).toHaveBeenLastCalledWith(
    seam,
    true,
  );
  await fireEvent.press(
    screen.getAllByRole("button", { name: /^Preview loop [0-9]/ })[0],
  );
  expect(mockAudio.controller.seekAdaptiveSession).toHaveBeenLastCalledWith(
    Math.max(segment.startSeconds, seam - 15),
    true,
  );
});

it("does not claim a new selected transition when its seek fails", async () => {
  mockAudio.controller.seekAdaptiveSession.mockRejectedValueOnce(
    new Error("Point unavailable"),
  );
  const p = program();
  const screen = await render(
    <PwaPlayerReviewControls
      initiallyOpen
      target={{
        kind: "adaptive",
        program: p,
        matching: true,
        onVariant: jest.fn(),
      }}
    />,
  );
  await fireEvent.press(screen.getByRole("button", { name: "Next change" }));
  expect(screen.getByText("Point unavailable")).toBeTruthy();
  expect(screen.getByText(/^SELECTED CHANGE 1 \//)).toBeTruthy();
  expect(screen.queryByText(/Ready at/)).toBeNull();
});

it("resets loop/mode and stale pending commands when the same plan starts a new run", async () => {
  const p = program();
  const target = {
    kind: "adaptive" as const,
    program: p,
    matching: true,
    onVariant: jest.fn(),
  };
  const screen = await render(
    <PwaPlayerReviewControls initiallyOpen target={target} />,
  );
  await fireEvent.press(
    screen.getByRole("button", { name: "Loop ±60 seconds" }),
  );
  await fireEvent.press(screen.getByRole("button", { name: "Hear incoming" }));
  const callsBefore =
    mockAudio.controller.configureAdaptiveAudition.mock.calls.length;
  mockAudio.setActive(null, 3);
  await screen.rerender(
    <PwaPlayerReviewControls initiallyOpen target={target} />,
  );
  expect(mockAudio.controller.configureAdaptiveAudition).toHaveBeenCalledTimes(
    callsBefore,
  );
  expect(
    screen.getByRole("button", { name: "Hear both", selected: true }),
  ).toBeTruthy();
  expect(screen.getByRole("button", { name: "Exit loop" })).toBeDisabled();
});

it("releases an optimistic slider target when a button supersedes its in-flight seek", async () => {
  const pending = deferred();
  mockAudio.controller.seekSingleTrack.mockReturnValueOnce(pending.promise);
  const screen = await render(
    <PwaPlayerReviewControls initiallyOpen target={single()} />,
  );
  const slider = screen.getByLabelText("Review position");
  await fireEvent(slider, "change", { currentTarget: { value: "120" } });
  expect(slider.props.value).toBe(120);
  expect(slider.props["aria-busy"]).toBe(true);
  await fireEvent.press(
    screen.getByRole("button", { name: "Last 5 seconds · loop test" }),
  );
  expect(screen.getByLabelText("Review position").props.value).toBe(0);
  await act(async () => pending.resolve());
  expect(mockAudio.controller.seekSingleTrack.mock.calls).toEqual([
    [120],
    [460.75],
  ]);
  expect(screen.getByLabelText("Review position").props.value).toBe(460.75);
  expect(screen.getByLabelText("Review position").props["aria-busy"]).toBe(
    false,
  );
});
