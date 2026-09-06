import { act, render } from "@testing-library/react-native";
import { ConsumerListeningObserver } from "@/audio/ConsumerListeningObserver";
import { getConsumerWork } from "@/content/consumerCatalog";
import { createSingleTrackProgram } from "@/domain/audio/consumerTypes";
import { createAdaptiveSessionProgram } from "@/domain/sessions/continuumPlanner";
import type { PlaybackStatus } from "@/domain/audio/types";
import { createConsumerAudioMock } from "./helpers/consumerAudioMock";

let mockAudio = createConsumerAudioMock();
const mockSaveLast = jest.fn(async (..._args: unknown[]) => undefined);
const mockRecordHeard = jest.fn(async (..._args: unknown[]) => undefined);
jest.mock("@/audio/AudioProvider", () => ({
  useAudioSession: () => mockAudio,
}));
jest.mock("@/state/lastListeningPersistence", () => ({
  saveLastListening: (...args: unknown[]) => mockSaveLast(...args),
}));
jest.mock("@/state/adaptiveSessionPersistence", () => ({
  createAdaptiveSessionHistoryStore: () => ({
    recordHeard: (...args: unknown[]) => mockRecordHeard(...args),
  }),
}));

describe("route-independent consumer listening observer", () => {
  beforeEach(() => {
    mockAudio = createConsumerAudioMock();
    mockSaveLast.mockClear();
    mockRecordHeard.mockClear();
  });

  it("saves a single listening only after playing, once per run, preserving the actual duration", async () => {
    const selection = {
      kind: "single" as const,
      program: createSingleTrackProgram(
        getConsumerWork("field-sea-003-open-tide")!,
        "massage",
      ),
      outcome: "massage" as const,
      durationMinutes: 90 as const,
    };
    mockAudio.setActive(selection);
    const screen = await render(<ConsumerListeningObserver />);
    for (const status of [
      "idle",
      "loading",
      "ready",
      "preparing",
      "paused",
      "error",
    ] as PlaybackStatus[]) {
      await act(async () =>
        mockAudio.publish({ status, selectedDurationMinutes: 90 }),
      );
    }
    expect(mockSaveLast).not.toHaveBeenCalled();
    await act(async () => mockAudio.publish({ status: "playing" }));
    expect(mockSaveLast).toHaveBeenCalledWith({
      kind: "single",
      workId: selection.program.work.id,
      outcome: "massage",
      durationMinutes: 90,
    });
    for (const status of [
      "playing",
      "paused",
      "playing",
      "fadingOut",
    ] as PlaybackStatus[]) {
      await act(async () => mockAudio.publish({ status }));
    }
    expect(mockSaveLast).toHaveBeenCalledTimes(1);
    expect(mockRecordHeard).not.toHaveBeenCalled();
    mockAudio.setActive(selection, 2);
    await act(async () => mockAudio.publish({ status: "playing" }));
    expect(mockSaveLast).toHaveBeenCalledTimes(2);
    await screen.unmount();
    mockAudio.setActive(selection, 3);
    await act(async () => mockAudio.publish({ status: "playing" }));
    expect(mockSaveLast).toHaveBeenCalledTimes(2);
  });

  it("records only heard primary works, includes crossfade entries, ignores future/ambience and resets on restart", async () => {
    const request = {
      outcome: "relax" as const,
      durationMinutes: 20 as const,
      mode: "sound-only" as const,
      soundKind: "nature" as const,
      natureFamily: "sea" as const,
    };
    const original = createAdaptiveSessionProgram({
      ...request,
      seed: "observer-fixture",
      allowProvisionalMetadata: true,
    });
    // Technical fixture only: an extra ambience lane must never enter primary history.
    const program = {
      ...original,
      plan: {
        ...original.plan,
        segments: [
          ...original.plan.segments,
          {
            ...original.plan.segments[0]!,
            workId: "fixture-unheard-ambience",
            lane: "nature" as const,
          },
        ],
      },
    };
    const selection = { kind: "adaptive" as const, request, program };
    const [first, second] = original.plan.segments;
    mockAudio.setActive(selection);
    await render(<ConsumerListeningObserver />);
    await act(async () =>
      mockAudio.publish({ status: "preparing", remainingMs: 20 * 60_000 }),
    );
    expect(mockRecordHeard).not.toHaveBeenCalled();
    await act(async () => mockAudio.publish({ status: "playing" }));
    expect(mockSaveLast).toHaveBeenCalledWith({ kind: "adaptive", request });
    expect(mockRecordHeard).toHaveBeenLastCalledWith(request, program.plan, [
      first!.workId,
    ]);
    const overlapRemaining =
      (program.plan.totalDurationSeconds - second!.startSeconds - 0.1) * 1000;
    await act(async () => mockAudio.publish({ remainingMs: overlapRemaining }));
    expect(mockRecordHeard).toHaveBeenLastCalledWith(request, program.plan, [
      first!.workId,
      second!.workId,
    ]);
    for (const status of ["playing", "paused", "playing"] as PlaybackStatus[]) {
      await act(async () => mockAudio.publish({ status }));
    }
    expect(mockRecordHeard).toHaveBeenCalledTimes(2);
    expect(mockSaveLast).toHaveBeenCalledTimes(1);
    mockAudio.setActive(selection, 2);
    await act(async () => mockAudio.publish({ remainingMs: 20 * 60_000 }));
    expect(mockRecordHeard).toHaveBeenLastCalledWith(request, program.plan, [
      first!.workId,
    ]);
    expect(mockSaveLast).toHaveBeenCalledTimes(2);
  });
});
