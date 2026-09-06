import { transitionGains } from "@/domain/sessions/equalPower";
import { auditPlanAccelerated } from "@/domain/sessions/workbench";
import { crossfadeProgram } from "../fixtures/crossfadeProgram";
import { adaptiveWebHarness } from "../fakes/AdaptiveWebHarness";

describe("track-independent crossfade scheduler", () => {
  let h: ReturnType<typeof adaptiveWebHarness>;
  beforeEach(() => {
    jest.useFakeTimers();
    jest.setSystemTime(0);
    h = adaptiveWebHarness();
  });
  afterEach(async () => {
    await h.playback.dispose();
    h.restore();
    jest.useRealTimers();
  });

  it.each([10, 20, 30, 45, 60, 90] as const)(
    "executes %i minutes in virtual time: staggered lanes, bounded decks and one exact end",
    async (minutes) => {
      const program = crossfadeProgram(minutes, minutes === 10 ? 60 : 180);
      expect(auditPlanAccelerated(program)).toMatchObject({
        pass: true,
        noGap: true,
        maxConcurrentSources: 3,
      });
      await h.playback.load(program);
      await h.playback.start(program, 0.8);
      const events = [
        ...new Set(
          program.plan.segments
            .flatMap((s) => [s.startSeconds, s.endSeconds])
            .filter((t) => t > 0),
        ),
      ].sort((a, b) => a - b);
      for (const event of events) {
        await jest.advanceTimersByTimeAsync(event * 1000 - Date.now());
        const expected = program.plan.segments
          .filter((s) => event >= s.startSeconds && event < s.endSeconds)
          .map((s) => `fixture://${s.workId}`)
          .sort();
        expect(
          h.media
            .filter((m) => !m.paused)
            .map((m) => m.src)
            .sort(),
        ).toEqual(expected);
        expect(h.media.length).toBe(4);
        expect(h.handlers.error).not.toHaveBeenCalled();
      }
      expect(h.handlers.ended).toHaveBeenCalledTimes(1);
      expect(jest.getTimerCount()).toBe(0);
      await h.playback.dispose();
      expect(
        h.releases.every((release) => release.mock.calls.length === 1),
      ).toBe(true);
    },
  );

  it.each(["equal-power", "linear"] as const)(
    "seeks from the exact fractional gain inside a %s transition, not a rounded sample",
    async (curve) => {
      const program = crossfadeProgram(20, 180, curve),
        transition = program.plan.transitions[0];
      const progress = 0.413,
        position =
          transition.startSeconds + progress * transition.durationSeconds;
      await h.playback.load(program);
      await h.playback.start(program, 0.8, position);
      for (const [index, direction] of (
        ["outgoing", "incoming"] as const
      ).entries()) {
        const automation = h.gainFor(program.works[index].id)!.gain
          .setValueCurveAtTime.mock.calls[0];
        expect(automation[0][0]).toBeCloseTo(
          transitionGains(progress, curve)[direction],
          6,
        );
        expect(automation[2]).toBeCloseTo(180 * (1 - progress), 6);
      }
    },
  );

  it("cancels old envelope automation before scheduling the remainder after Pause/Resume", async () => {
    const program = crossfadeProgram(),
      transition = program.plan.transitions[0];
    await h.playback.load(program);
    await h.playback.start(program, 0.8, transition.startSeconds + 73);
    const gain = h.gainFor(program.works[0].id)!.gain;
    gain.cancelScheduledValues.mockClear();
    gain.setValueAtTime.mockClear();
    gain.setValueCurveAtTime.mockClear();
    await h.playback.pause();
    await h.playback.resume();
    expect(gain.cancelScheduledValues).toHaveBeenCalledWith(0);
    expect(gain.cancelScheduledValues.mock.invocationCallOrder[0]).toBeLessThan(
      gain.setValueCurveAtTime.mock.invocationCallOrder[0],
    );
    expect(gain.setValueAtTime).toHaveBeenCalled();
  });

  it("resumes a final envelope at its remaining gain, not full volume", async () => {
    const program = crossfadeProgram(),
      position = program.plan.totalDurationSeconds - 2;
    await h.playback.load(program);
    await h.playback.start(program, 0.8, position);
    await h.playback.pause();
    await jest.advanceTimersByTimeAsync(9000);
    await h.playback.resume();
    for (const index of [1, 3]) {
      const gain = h.gainFor(program.works[index].id)!.gain;
      expect(gain.setValueAtTime.mock.lastCall).toEqual([
        expect.closeTo(Math.SQRT1_2, 6),
        9,
      ]);
      expect(gain.setValueCurveAtTime.mock.lastCall![0][0]).toBeCloseTo(
        Math.SQRT1_2,
        6,
      );
      expect(gain.setValueCurveAtTime.mock.lastCall![2]).toBe(2);
    }
    await jest.advanceTimersByTimeAsync(2000);
    expect(h.handlers.ended).toHaveBeenCalledTimes(1);
  });

  it("composes an incoming crossfade and final envelope without overlapping AudioParam curves", async () => {
    const program = crossfadeProgram(),
      segment = program.plan.segments[1],
      transition = program.plan.transitions[0];
    segment.finalEnvelopeSeconds =
      program.plan.totalDurationSeconds - transition.startSeconds;
    const position =
      transition.startSeconds + 0.371 * transition.durationSeconds;
    await h.playback.load(program);
    await h.playback.start(program, 0.8, position);
    const gain = h.gainFor(segment.workId)!.gain,
      calls = gain.setValueCurveAtTime.mock.calls;
    const expected =
      transitionGains(0.371, transition.curve).incoming *
      transitionGains(
        (position - transition.startSeconds) / segment.finalEnvelopeSeconds,
        "equal-power",
      ).outgoing;
    expect(calls[0][0][0]).toBeCloseTo(expected, 6);
    for (let i = 1; i < calls.length; i++)
      expect(calls[i][1]).toBeGreaterThanOrEqual(
        calls[i - 1][1] + calls[i - 1][2],
      );
  });

  it("realigns a delayed incoming seek to the live session clock before Play", async () => {
    const program = crossfadeProgram(),
      incoming = program.plan.segments[1];
    incoming.sourceEntrySeconds = 11;
    incoming.sourceEntryFrame = 11 * 48000;
    await h.playback.load(program);
    await h.playback.start(program, 0.8);
    const media = h.media.find(
      (m) => m.src === `fixture://${incoming.workId}`,
    )!;
    media.holdSeeks = 1;
    await jest.advanceTimersByTimeAsync(incoming.startSeconds * 1000);
    expect(media.seeking).toBe(true);
    expect(media.paused).toBe(true);
    await jest.advanceTimersByTimeAsync(5000);
    media.completeSeek();
    await jest.advanceTimersByTimeAsync(0);
    expect(media.currentTime).toBeCloseTo(16, 6);
    expect(media.paused).toBe(false);
    expect(h.handlers.error).not.toHaveBeenCalled();
  });

  it("Stop cancels pending transition positioning; a late seek cannot resurrect audio", async () => {
    const program = crossfadeProgram(),
      incoming = program.plan.segments[1];
    incoming.sourceEntrySeconds = 11;
    incoming.sourceEntryFrame = 11 * 48000;
    await h.playback.load(program);
    await h.playback.start(program, 0.8);
    const media = h.media.find(
      (m) => m.src === `fixture://${incoming.workId}`,
    )!;
    media.holdSeeks = 1;
    media.play.mockClear();
    await jest.advanceTimersByTimeAsync(incoming.startSeconds * 1000);
    await h.playback.stop(false);
    media.completeSeek();
    await jest.advanceTimersByTimeAsync(
      program.plan.totalDurationSeconds * 1000,
    );
    expect(media.play).not.toHaveBeenCalled();
    expect(h.media.every((m) => m.paused)).toBe(true);
    expect(jest.getTimerCount()).toBe(0);
    expect(h.handlers.error).not.toHaveBeenCalled();
    expect(h.handlers.ended).not.toHaveBeenCalled();
  });

  it("fails closed after two clock realignment attempts instead of chasing a moving target forever", async () => {
    const program = crossfadeProgram(),
      incoming = program.plan.segments[1];
    incoming.sourceEntrySeconds = 11;
    incoming.sourceEntryFrame = 11 * 48000;
    await h.playback.load(program);
    await h.playback.start(program, 0.8);
    const media = h.media.find(
      (m) => m.src === `fixture://${incoming.workId}`,
    )!;
    media.holdSeeks = 3;
    media.play.mockClear();
    await jest.advanceTimersByTimeAsync(incoming.startSeconds * 1000);
    for (let attempt = 0; attempt < 3; attempt++) {
      await jest.advanceTimersByTimeAsync(1000);
      media.completeSeek();
      await jest.advanceTimersByTimeAsync(0);
    }
    expect(h.handlers.error).toHaveBeenCalledTimes(1);
    expect(h.handlers.error.mock.calls[0][0].message).toMatch(
      /align with the session clock/,
    );
    expect(media.play).not.toHaveBeenCalled();
    expect(h.media.every((m) => m.paused)).toBe(true);
    expect(jest.getTimerCount()).toBe(0);
  });

  it("cancels a clock realignment in progress when Stop is pressed", async () => {
    const program = crossfadeProgram(),
      incoming = program.plan.segments[1];
    incoming.sourceEntrySeconds = 11;
    incoming.sourceEntryFrame = 11 * 48000;
    await h.playback.load(program);
    await h.playback.start(program, 0.8);
    const media = h.media.find(
      (m) => m.src === `fixture://${incoming.workId}`,
    )!;
    media.holdSeeks = 2;
    media.play.mockClear();
    await jest.advanceTimersByTimeAsync(incoming.startSeconds * 1000 + 1000);
    media.completeSeek();
    await jest.advanceTimersByTimeAsync(0);
    expect(media.seeking).toBe(true);
    await h.playback.stop(false);
    media.completeSeek();
    await jest.advanceTimersByTimeAsync(0);
    expect(media.play).not.toHaveBeenCalled();
    expect(jest.getTimerCount()).toBe(0);
    expect(h.handlers.error).not.toHaveBeenCalled();
  });

  it("repeated seeks and Pause/Resume keep a fixed four-deck pool and no timers after Stop", async () => {
    const program = crossfadeProgram();
    await h.playback.load(program);
    await h.playback.start(program, 0.8);
    for (let iteration = 0; iteration < 12; iteration++) {
      const transition = program.plan.transitions[iteration % 2];
      const position = transition.startSeconds + (iteration + 0.371) * 5;
      await h.playback.seek(position);
      await h.playback.pause();
      await jest.advanceTimersByTimeAsync(7000);
      await h.playback.resume();
      expect(h.playback.positionSeconds()).toBeCloseTo(position, 6);
      expect(h.media.length).toBe(4);
      expect(h.media.filter((m) => !m.paused).length).toBe(3);
    }
    await h.playback.stop(false);
    await jest.advanceTimersByTimeAsync(90000);
    expect(h.media.every((m) => m.paused)).toBe(true);
    expect(jest.getTimerCount()).toBe(0);
    expect(h.handlers.error).not.toHaveBeenCalled();
  });

  it("a future deck Play rejection stops both lanes once and releases every lease", async () => {
    const program = crossfadeProgram(),
      incoming = program.plan.segments[1];
    await h.playback.load(program);
    await h.playback.start(program, 0.8);
    h.media
      .find((m) => m.src === `fixture://${incoming.workId}`)!
      .play.mockRejectedValueOnce(new Error("technical incoming Play failure"));
    await jest.advanceTimersByTimeAsync(
      program.plan.totalDurationSeconds * 1000,
    );
    expect(h.handlers.error).toHaveBeenCalledTimes(1);
    expect(h.handlers.error.mock.calls[0][0].message).toBe(
      "technical incoming Play failure",
    );
    expect(h.handlers.ended).not.toHaveBeenCalled();
    expect(h.media.every((m) => m.paused)).toBe(true);
    expect(jest.getTimerCount()).toBe(0);
    expect(h.releases.every((release) => release.mock.calls.length === 1)).toBe(
      true,
    );
  });
});
