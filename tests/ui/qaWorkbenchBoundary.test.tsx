import { readFileSync, readdirSync } from "node:fs";
import { join } from "node:path";
import { fireEvent, render, waitFor } from "@testing-library/react-native";
import AdaptiveQaWorkbench, { QA_SENTINEL } from "@/qa/AdaptiveQaWorkbench";

const projectRoot = join(__dirname, "..", "..");
let mockSnapshot = {
  status: "idle",
  workId: null as string | null,
  sessionPlanId: null as string | null,
  selectedDurationMinutes: 30,
  remainingMs: 0,
  volume: 0.8,
  error: null as string | null,
};
const mockController = {
  getSnapshot: jest.fn(() => mockSnapshot),
  loadAdaptiveSession: jest.fn(
    async (program: { plan: { id: string; totalDurationSeconds: number } }) => {
      mockSnapshot = {
        ...mockSnapshot,
        status: "ready",
        workId: null,
        sessionPlanId: program.plan.id,
        remainingMs: program.plan.totalDurationSeconds * 1000,
        error: null,
      };
    },
  ),
  loadProgram: jest.fn(
    async (program: {
      work: { id: string };
      durationOptionsMinutes: readonly number[];
    }) => {
      const minutes = program.durationOptionsMinutes[1] ?? 30;
      mockSnapshot = {
        ...mockSnapshot,
        status: "ready",
        workId: program.work.id,
        sessionPlanId: null,
        selectedDurationMinutes: minutes,
        remainingMs: minutes * 60_000,
        error: null,
      };
    },
  ),
  configureAdaptiveAudition: jest.fn(async () => {}),
  seekSingleTrack: jest.fn(async (_positionSeconds: number) => {}),
  seekAdaptiveSession: jest.fn(async (_positionSeconds: number) => {}),
  play: jest.fn(async () => {
    mockSnapshot = { ...mockSnapshot, status: "playing", error: null };
  }),
  pause: jest.fn(async () => {
    mockSnapshot = { ...mockSnapshot, status: "paused" };
  }),
  setTimer: jest.fn(async (minutes: number) => {
    mockSnapshot = {
      ...mockSnapshot,
      selectedDurationMinutes: minutes,
      remainingMs: minutes * 60_000,
    };
  }),
  setVolume: jest.fn(async (volume: number) => {
    mockSnapshot = { ...mockSnapshot, volume };
  }),
  stop: jest.fn(async () => {
    mockSnapshot = { ...mockSnapshot, status: "idle", remainingMs: 0 };
  }),
};

jest.mock("expo-router", () => ({
  useRouter: () => ({
    back: jest.fn(),
    canGoBack: () => false,
    replace: jest.fn(),
  }),
}));

jest.mock("expo-linear-gradient", () => ({
  LinearGradient: "LinearGradient",
}));

jest.mock("@/audio/AudioProvider", () => ({
  useAudioSession: () => ({
    controller: mockController,
    snapshot: mockSnapshot,
  }),
}));

describe("QA Workbench boundary", () => {
  it("uses a separate router root and is excluded from the EAS archive", () => {
    const config = readFileSync(join(projectRoot, "app.config.js"), "utf8");
    const ignore = readFileSync(join(projectRoot, ".easignore"), "utf8");
    expect(config).toContain('"src/app-qa"');
    expect(config).toContain('"src/app"');
    expect(ignore).toContain("/src/app-qa/");
    expect(ignore).toContain("/src/qa/");
    expect(readdirSync(join(projectRoot, "src", "app"))).not.toContain(
      "qa-workbench.tsx",
    );
    expect(
      readFileSync(join(projectRoot, "src", "app", "index.tsx"), "utf8"),
    ).not.toContain("qa-workbench");
  });

  beforeEach(() => {
    jest.clearAllMocks();
    mockSnapshot = {
      status: "idle",
      workId: null,
      sessionPlanId: null,
      selectedDurationMinutes: 30,
      remainingMs: 0,
      volume: 0.8,
      error: null,
    };
  });

  it("renders the shared consumer player, full catalog and QA controls", async () => {
    const screen = await render(<AdaptiveQaWorkbench localPlaybackAvailable />);
    expect(screen.getByText(QA_SENTINEL)).toBeTruthy();
    expect(screen.getByTestId("consumer-playback-surface")).toBeTruthy();
    expect(screen.getByText("EXACT CONSUMER VIEW")).toBeTruthy();
    expect(
      screen.getByText(
        "48 ITEMS · 47 PLAYABLE IN LOCAL REVIEW · 33 TRANSITION-READY",
      ),
    ).toBeTruthy();
    expect(screen.getByText("Soft Air")).toBeTruthy();
    expect(screen.getByLabelText("Full session scrubber")).toBeTruthy();
    expect(screen.getByText("VERSION A")).toBeTruthy();
    expect(screen.getByText("VERSION B")).toBeTruthy();
    expect(screen.getByText("OUTGOING LUFS")).toBeTruthy();
    expect(screen.getByText("POST-TRIM RISK")).toBeTruthy();
    await fireEvent.press(screen.getByText("RUN ACCELERATED PLAN QA"));
    expect(screen.getByText(/^PASS · exact end yes/)).toBeTruthy();
  });

  it("loads the visible plan and seeks when the timeline is used before Play", async () => {
    const screen = await render(<AdaptiveQaWorkbench localPlaybackAvailable />);
    const scrubber = screen.getByTestId("qa-session-scrubber");
    await fireEvent(scrubber, "layout", {
      nativeEvent: { layout: { height: 96, width: 100, x: 0, y: 0 } },
    });
    await fireEvent(scrubber, "responderGrant", {
      nativeEvent: { locationX: 50 },
    });
    await fireEvent(scrubber, "responderRelease", {
      nativeEvent: { locationX: 50 },
    });

    await waitFor(() =>
      expect(mockController.loadAdaptiveSession).toHaveBeenCalled(),
    );
    expect(mockController.configureAdaptiveAudition).toHaveBeenCalledWith(null);
    expect(mockController.seekAdaptiveSession).toHaveBeenCalledWith(600);
  });

  it("opens every file in the consumer player and seeks inside the source", async () => {
    const screen = await render(<AdaptiveQaWorkbench localPlaybackAvailable />);
    await fireEvent.press(screen.getByLabelText("Play Open Tide solo"));
    await waitFor(() =>
      expect(screen.getByTestId("qa-file-scrubber")).toBeTruthy(),
    );
    expect(screen.getByLabelText("15 minutes")).toBeTruthy();
    expect(screen.getByLabelText("30 minutes")).toBeTruthy();
    expect(screen.getByLabelText("60 minutes")).toBeTruthy();

    const scrubber = screen.getByTestId("qa-file-scrubber");
    await fireEvent(scrubber, "layout", {
      nativeEvent: { layout: { height: 76, width: 100, x: 0, y: 0 } },
    });
    await fireEvent(scrubber, "responderGrant", {
      nativeEvent: { locationX: 50 },
    });
    await fireEvent(scrubber, "responderRelease", {
      nativeEvent: { locationX: 50 },
    });

    await waitFor(() =>
      expect(mockController.seekSingleTrack).toHaveBeenCalled(),
    );
    expect(mockController.seekSingleTrack.mock.calls.at(-1)?.[0]).toBeCloseTo(
      74,
      1,
    );
  });

  it("resets the selected transition when moving from a full session to a direct pair", async () => {
    const screen = await render(<AdaptiveQaWorkbench localPlaybackAvailable />);
    await fireEvent.press(screen.getByText("NEXT CHANGE →"));
    await waitFor(() =>
      expect(mockController.seekAdaptiveSession).toHaveBeenCalled(),
    );
    await fireEvent.press(screen.getByLabelText("DIRECT TRANSITION"));
    await waitFor(() =>
      expect(screen.getByText("DIRECT A → B TRANSITION")).toBeTruthy(),
    );
    expect(screen.getByText("OPEN A FILE + SCRUB")).toBeTruthy();
    expect(screen.getByText("VERSION A")).toBeTruthy();
  });

  it("does not claim playback when a catalog file fails to load", async () => {
    mockController.loadProgram.mockImplementationOnce(async () => {
      mockSnapshot = {
        ...mockSnapshot,
        status: "error",
        error: "QA file could not be loaded.",
      };
    });
    const screen = await render(<AdaptiveQaWorkbench localPlaybackAvailable />);
    await fireEvent.press(screen.getByLabelText("Play Open Tide solo"));
    await waitFor(() =>
      expect(screen.getByText("QA file could not be loaded.")).toBeTruthy(),
    );
    expect(mockController.play).not.toHaveBeenCalled();
  });

  it("labels and disables complete-catalog playback outside local Review Web", async () => {
    const screen = await render(
      <AdaptiveQaWorkbench localPlaybackAvailable={false} />,
    );
    expect(
      screen.getByText(/LOCAL REVIEW WEB ONLY · the complete external catalog/),
    ).toBeTruthy();
    expect(
      screen.getByLabelText("Play Open Tide solo").props.accessibilityState,
    ).toMatchObject({ disabled: true });
  });

  it("fails closed by default when the runtime is not verified local Review Web", async () => {
    const screen = await render(<AdaptiveQaWorkbench />);
    expect(
      screen.getByText(/LOCAL REVIEW WEB ONLY · the complete external catalog/),
    ).toBeTruthy();
    expect(
      screen.getByLabelText("Play").props.accessibilityState,
    ).toMatchObject({ disabled: true });
  });

  it("rolls the session bar back when the controller rejects a seek", async () => {
    mockController.seekAdaptiveSession.mockRejectedValueOnce(
      new Error("Browser did not confirm the requested session position."),
    );
    const screen = await render(<AdaptiveQaWorkbench localPlaybackAvailable />);
    const scrubber = screen.getByTestId("qa-session-scrubber");
    await fireEvent(scrubber, "layout", {
      nativeEvent: { layout: { height: 96, width: 100, x: 0, y: 0 } },
    });
    await fireEvent(scrubber, "responderGrant", {
      nativeEvent: { locationX: 50 },
    });
    await fireEvent(scrubber, "responderRelease", {
      nativeEvent: { locationX: 50 },
    });

    await waitFor(() =>
      expect(
        screen.getByText(
          "Browser did not confirm the requested session position.",
        ),
      ).toBeTruthy(),
    );
    await waitFor(() =>
      expect(
        screen.getByLabelText("Full session scrubber").props.accessibilityValue,
      ).toMatchObject({ now: 0 }),
    );
  });

  it("does not let volume controls change a hidden previously loaded program", async () => {
    const screen = await render(<AdaptiveQaWorkbench localPlaybackAvailable />);
    expect(
      screen.getByLabelText("Lower volume").props.accessibilityState,
    ).toMatchObject({ disabled: true });
    await fireEvent.press(screen.getByLabelText("Lower volume"));
    expect(mockController.setVolume).not.toHaveBeenCalled();

    await fireEvent.press(screen.getByLabelText("Play"));
    await waitFor(() =>
      expect(
        screen.getByLabelText("Lower volume").props.accessibilityState,
      ).toMatchObject({ disabled: false }),
    );
  });
});
