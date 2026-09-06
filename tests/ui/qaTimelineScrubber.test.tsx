import { fireEvent, render, waitFor } from "@testing-library/react-native";
import { createAdaptiveSessionProgram } from "@/domain/sessions/continuumPlanner";
import {
  clampTimelinePosition,
  QaTimelineScrubber,
  resolveTimelineLocalX,
} from "@/qa/QaTimelineScrubber";

const program = createAdaptiveSessionProgram({
  outcome: "meditation",
  durationMinutes: 20,
  mode: "sound-only",
  soundKind: "nature",
  seed: "scrubber-test",
  allowProvisionalMetadata: true,
});

describe("QA timeline scrubber", () => {
  it("clamps invalid, early, middle and late coordinates", () => {
    expect(clampTimelinePosition(Number.NaN, 100, 1200)).toBe(0);
    expect(clampTimelinePosition(-20, 100, 1200)).toBe(0);
    expect(clampTimelinePosition(50, 100, 1200)).toBe(600);
    expect(clampTimelinePosition(120, 100, 1200)).toBeCloseTo(1199.999);
  });

  it("prefers responder-local coordinates and requires a valid fallback measurement", () => {
    expect(
      resolveTimelineLocalX(
        { clientX: 940, locationX: 75, pageX: 960 },
        900,
        920,
      ),
    ).toBe(75);
    expect(resolveTimelineLocalX({ pageX: 960 }, null, null)).toBeNull();
    expect(resolveTimelineLocalX({ pageX: 960 }, 900, null)).toBe(60);
    expect(resolveTimelineLocalX({ clientX: 940 }, null, 920)).toBe(20);
    expect(
      resolveTimelineLocalX({ clientX: 940 }, null, Number.NaN),
    ).toBeNull();
  });

  it("commits a click/drag position and offers accessible ten-second nudges", async () => {
    const onSeek = jest.fn();
    const screen = await render(
      <QaTimelineScrubber
        onSeek={onSeek}
        plan={program.plan}
        positionSeconds={0}
      />,
    );
    const scrubber = screen.getByTestId("qa-session-scrubber");
    await fireEvent(scrubber, "layout", {
      nativeEvent: { layout: { height: 96, width: 100, x: 0, y: 0 } },
    });
    await fireEvent(scrubber, "responderGrant", {
      nativeEvent: { locationX: 20, pageX: 999 },
    });
    await fireEvent(scrubber, "responderMove", {
      nativeEvent: { locationX: 75, pageX: 999 },
    });
    await fireEvent(scrubber, "responderRelease", {
      nativeEvent: { locationX: 75, pageX: 999 },
    });
    expect(onSeek).toHaveBeenLastCalledWith(900);

    await fireEvent.press(screen.getByLabelText("Forward ten seconds"));
    expect(onSeek).toHaveBeenLastCalledWith(910);
    await fireEvent.press(screen.getByLabelText("Back ten seconds"));
    expect(onSeek).toHaveBeenLastCalledWith(900);
  });

  it("restores both the visible and internal position when a drag is cancelled", async () => {
    const onSeek = jest.fn();
    const screen = await render(
      <QaTimelineScrubber
        onSeek={onSeek}
        plan={program.plan}
        positionSeconds={100}
      />,
    );
    const scrubber = screen.getByTestId("qa-session-scrubber");
    await fireEvent(scrubber, "layout", {
      nativeEvent: { layout: { height: 96, width: 100, x: 0, y: 0 } },
    });
    await fireEvent(scrubber, "responderGrant", {
      nativeEvent: { locationX: 75 },
    });
    await fireEvent(scrubber, "responderTerminate", {
      nativeEvent: {},
    });

    expect(screen.getByText("01:40 / 20:00")).toBeTruthy();
    await fireEvent.press(screen.getByLabelText("Forward ten seconds"));
    expect(onSeek).toHaveBeenLastCalledWith(110);
  });

  it("rolls the visible cursor back when the audio seek is rejected", async () => {
    const onSeek = jest.fn(async () => false);
    const screen = await render(
      <QaTimelineScrubber
        onSeek={onSeek}
        plan={program.plan}
        positionSeconds={100}
      />,
    );
    const scrubber = screen.getByTestId("qa-session-scrubber");
    await fireEvent(scrubber, "layout", {
      nativeEvent: { layout: { height: 96, width: 100, x: 0, y: 0 } },
    });
    await fireEvent(scrubber, "responderGrant", {
      nativeEvent: { locationX: 75 },
    });
    await fireEvent(scrubber, "responderRelease", {
      nativeEvent: { locationX: 75 },
    });

    await waitFor(() => expect(screen.getByText("01:40 / 20:00")).toBeTruthy());
    expect(onSeek).toHaveBeenCalledWith(900);
  });
});
