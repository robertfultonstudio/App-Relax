import { fireEvent, render } from "@testing-library/react-native";
import { CurrentSessionBar } from "@/components/CurrentSessionBar";
import { getConsumerWork } from "@/content/consumerCatalog";
import { createSingleTrackProgram } from "@/domain/audio/consumerTypes";
import { createAdaptiveSessionProgram } from "@/domain/sessions/continuumPlanner";
import { createListeningNatureProgram } from "@/pwa-review/createListeningNatureProgram";
import { createWholeFileReviewProgram } from "@/pwa-review/createWholeFileReviewProgram";
import type { PlaybackStatus } from "@/domain/audio/types";
import { createConsumerAudioMock } from "./helpers/consumerAudioMock";

let mockAudio = createConsumerAudioMock();
let mockPath = "/";
let mockParams: Record<string, string> = {};
let mockPwa = false;
jest.mock("@/domain/sessions/playbackAvailability", () => ({
  isNativeCatalogPreview: () => false,
  isPwaWebSurface: () => mockPwa,
}));
const mockPush = jest.fn();
jest.mock("expo-router", () => ({
  usePathname: () => mockPath,
  useGlobalSearchParams: () => mockParams,
  useRouter: () => ({ push: mockPush }),
}));
jest.mock("@/audio/AudioProvider", () => ({
  useAudioSession: () => mockAudio,
}));

describe("persistent current listening bar", () => {
  it("opens the actual running PWA duration and its review, not a different setup selection", async () => {
    mockPwa = true;
    const request = {
      outcome: "yoga" as const,
      durationMinutes: 30 as const,
      mode: "sound-only" as const,
      soundKind: "music" as const,
      natureFamily: "sea" as const,
      includeNatureBed: false,
    };
    mockAudio.setActive({
      kind: "adaptive",
      request,
      program: createWholeFileReviewProgram({ ...request, seed: "current-30" }),
    });
    mockAudio.publish({ status: "playing", remainingMs: 29 * 60000 });
    mockPath = "/outcome/yoga";
    mockParams = { duration: "90" };
    const screen = await render(<CurrentSessionBar />);
    expect(screen.getByText("29:00 · 30 min · Player & review →")).toBeTruthy();
    await fireEvent.press(
      screen.getByRole("button", { name: "Return to current session" }),
    );
    expect(mockPush).toHaveBeenCalledWith(
      "/adaptive-session/yoga?duration=30&sound=music&nature=off&active=1&review=1",
    );
    expect(
      mockAudio.controller.startSelectionFromUserGesture,
    ).not.toHaveBeenCalled();
  });
  it("does not duplicate transport when nature is added to the current single-recording player", async () => {
    const program = createListeningNatureProgram(
      getConsumerWork("astral-thread")!,
      "focus",
      30,
      "rain",
    );
    mockAudio.setActive({
      kind: "adaptive",
      program,
      request: {
        outcome: "focus",
        durationMinutes: 30,
        mode: "sound-only",
        soundKind: "music",
        natureFamily: "rain",
      },
    });
    mockAudio.publish({ status: "playing" });
    mockPath = "/listen/astral-thread";
    mockParams = { outcome: "focus", duration: "30" };
    const screen = await render(<CurrentSessionBar />);
    expect(screen.queryByTestId("current-session-bar")).toBeNull();
  });
  beforeEach(() => {
    mockPwa = false;
    mockAudio = createConsumerAudioMock();
    mockAudio.setActive({
      kind: "single",
      program: createSingleTrackProgram(
        getConsumerWork("pink-noise")!,
        "massage",
      ),
      outcome: "massage",
      durationMinutes: 90,
    });
    mockPath = "/";
    mockParams = {};
    mockPush.mockClear();
  });

  it.each(["playing", "paused", "fadingOut", "preparing"] as PlaybackStatus[])(
    "keeps Return and Stop available while browsing in %s",
    async (status) => {
      mockAudio.publish({ status, remainingMs: 89 * 60_000 });
      const screen = await render(<CurrentSessionBar />);
      expect(screen.getByTestId("current-session-bar")).toBeTruthy();
      expect(screen.queryByText("Pink Noise")).toBeNull();
      expect(screen.getByText("Massage")).toBeTruthy();
      expect(screen.getByText("89:00 · Return →")).toBeTruthy();
      await fireEvent.press(
        screen.getByRole("button", { name: "Return to current session" }),
      );
      expect(mockPush).toHaveBeenCalledWith(
        "/listen/pink-noise?outcome=massage&duration=90",
      );
      await fireEvent.press(
        screen.getByRole("button", { name: "Stop current session" }),
      );
      expect(mockAudio.controller.stop).toHaveBeenCalledTimes(1);
      const transport = screen.getByRole("button", {
        name: /Pause current session|Resume current session/,
      });
      if (status === "preparing") {
        expect(transport).toBeDisabled();
      } else {
        await fireEvent.press(transport);
        expect(
          status === "paused"
            ? mockAudio.controller.playFromUserGesture
            : mockAudio.controller.pause,
        ).toHaveBeenCalledTimes(1);
      }
      expect(
        mockAudio.controller.startSelectionFromUserGesture,
      ).not.toHaveBeenCalled();
      expect(mockAudio.controller.prepareSelection).not.toHaveBeenCalled();
    },
  );

  it.each(["idle", "ready", "completed"] as PlaybackStatus[])(
    "does not leave stale transport after %s",
    async (status) => {
      mockAudio.publish({ status });
      const screen = await render(<CurrentSessionBar />);
      expect(screen.queryByTestId("current-session-bar")).toBeNull();
    },
  );

  it("keeps a visible recovery route after transport errors without re-starting blindly", async () => {
    mockAudio.publish({ status: "playing" });
    mockAudio.controller.pause.mockRejectedValueOnce(new Error("Pause failed"));
    mockAudio.controller.stop.mockRejectedValueOnce(new Error("Stop failed"));
    const screen = await render(<CurrentSessionBar />);
    await fireEvent.press(
      screen.getByRole("button", { name: "Pause current session" }),
    );
    await fireEvent.press(
      screen.getByRole("button", { name: "Stop current session" }),
    );
    mockAudio.publish({ status: "error", error: "Playback failed" });
    await screen.rerender(<CurrentSessionBar />);
    expect(screen.getByTestId("current-session-bar")).toBeTruthy();
    expect(screen.getByText(/Playback needs attention/)).toBeTruthy();
    await fireEvent.press(
      screen.getByRole("button", { name: "Review playback error" }),
    );
    expect(mockPush).toHaveBeenCalledWith(
      "/listen/pink-noise?outcome=massage&duration=90",
    );
    expect(mockAudio.controller.playFromUserGesture).not.toHaveBeenCalled();
    expect(
      mockAudio.controller.startSelectionFromUserGesture,
    ).not.toHaveBeenCalled();
  });

  it("hides on the actual single player but not on the same work with a different need or duration", async () => {
    mockAudio.publish({ status: "playing" });
    mockPath = "/listen/pink-noise";
    mockParams = { outcome: "massage", duration: "90" };
    const screen = await render(<CurrentSessionBar />);
    expect(screen.queryByTestId("current-session-bar")).toBeNull();
    mockParams = { outcome: "massage", duration: "45" };
    await screen.rerender(<CurrentSessionBar />);
    expect(screen.getByTestId("current-session-bar")).toBeTruthy();
    mockParams = { outcome: "focus", duration: "90" };
    await screen.rerender(<CurrentSessionBar />);
    expect(screen.getByTestId("current-session-bar")).toBeTruthy();
  });

  it("compares all adaptive details before hiding controls for the running session", async () => {
    const request = {
      outcome: "relax" as const,
      durationMinutes: 20 as const,
      mode: "sound-only" as const,
      soundKind: "nature" as const,
      natureFamily: "sea" as const,
    };
    const program = createAdaptiveSessionProgram({
      ...request,
      seed: "mini-bar",
      allowProvisionalMetadata: true,
    });
    mockAudio.setActive({ kind: "adaptive", request, program });
    mockAudio.publish({ status: "playing" });
    mockPath = "/adaptive-session/relax";
    mockParams = { duration: "20", sound: "nature", nature: "sea" };
    const screen = await render(<CurrentSessionBar />);
    expect(screen.queryByTestId("current-session-bar")).toBeNull();
    for (const difference of [
      { duration: "45" },
      { nature: "rain" },
      { sound: "music" },
    ]) {
      mockParams = {
        duration: "20",
        sound: "nature",
        nature: "sea",
        ...difference,
      };
      await screen.rerender(<CurrentSessionBar />);
      expect(screen.getByTestId("current-session-bar")).toBeTruthy();
    }
    await fireEvent.press(
      screen.getByRole("button", { name: "Return to current session" }),
    );
    expect(mockPush).toHaveBeenCalledWith(
      "/adaptive-session/relax?duration=20&sound=nature&nature=sea&active=1",
    );
  });
});
