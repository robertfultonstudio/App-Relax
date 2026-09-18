import { transitionGains } from "@/domain/sessions/equalPower";
import {
  auditPlanAccelerated,
  createTransitionAudition,
} from "@/domain/sessions/workbench";
import { crossfadeProgram } from "../fixtures/crossfadeProgram";
import { adaptiveWebHarness } from "../fakes/AdaptiveWebHarness";
import { createWholeFileReviewProgram } from "@/domain/sessions/createWholeFileReviewProgram";
import { replaceCoordinatedNatureBed } from "@/domain/sessions/continuumPlanner";

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

  it.each([60, 90] as const)(
    "runs the actual %i-minute Hatha plan after a live family change through every source boundary and one end",
    async (durationMinutes) => {
      const original = createWholeFileReviewProgram({
        outcome: "yoga",
        durationMinutes,
        mode: "sound-only",
        soundKind: "music",
        seed: `PWA-DUAL-VIEW-${durationMinutes}`,
        includeNatureBed: true,
        natureFamily: "rain",
        allowProvisionalMetadata: true,
      });
      const next = replaceCoordinatedNatureBed(original, "sea");
      expect(auditPlanAccelerated(next)).toMatchObject({
        pass: true,
        noGap: true,
        maxConcurrentSources: 3,
      });
      expect(next.plan.totalDurationSeconds).toBe(durationMinutes * 60);
      await h.playback.load(original);
      await h.playback.start(original, 0.8);
      const change = h.playback.replaceNatureFamily(
        next,
        new AbortController().signal,
      );
      await jest.advanceTimersByTimeAsync(4001);
      await change;
      const checkpoints = [
        ...new Set(
          next.plan.segments.flatMap((s) => [s.startSeconds, s.endSeconds]),
        ),
      ]
        .filter((seconds) => seconds > h.playback.positionSeconds())
        .sort((a, b) => a - b);
      let previousClockMs = Date.now();
      let maxActiveSources = 0;
      for (const seconds of checkpoints) {
        await jest.advanceTimersByTimeAsync(
          Math.max(0, Math.ceil(seconds * 1000) - Date.now()),
        );
        const actualSeconds = Date.now() / 1000;
        const expected = next.plan.segments
          .filter(
            (s) =>
              actualSeconds >= s.startSeconds && actualSeconds < s.endSeconds,
          )
          .map((s) => `fixture://${s.workId}`)
          .sort();
        const activeSources = h.media.filter((m) => !m.paused);
        expect(activeSources.map((m) => m.src).sort()).toEqual(expected);
        maxActiveSources = Math.max(maxActiveSources, activeSources.length);
        expect(activeSources.length).toBeLessThanOrEqual(3);
        expect(Date.now()).toBeGreaterThanOrEqual(previousClockMs);
        previousClockMs = Date.now();
        expect(h.handlers.error).not.toHaveBeenCalled();
      }
      expect(maxActiveSources).toBe(3);
      expect(h.handlers.ended).toHaveBeenCalledTimes(1);
      expect(jest.getTimerCount()).toBe(0);
      await h.playback.dispose();
      const releasesOnce = h.releases.every(
        (release) => release.mock.calls.length === 1,
      );
      expect(releasesOnce).toBe(true);
      console.log(
        "PWA_ACCELERATED_PROGRAM_RECEIPT",
        JSON.stringify({
          durationMinutes,
          planId: next.plan.id,
          totalDurationSeconds: next.plan.totalDurationSeconds,
          segments: next.plan.segments.length,
          transitions: next.plan.transitions.length,
          checkpoints: checkpoints.length,
          maxActiveSources,
          endedCalls: h.handlers.ended.mock.calls.length,
          pendingTimers: jest.getTimerCount(),
          releasesOnce,
          acceleratedAudit: auditPlanAccelerated(next),
        }),
      );
    },
  );

  it("clears a QA loop and seeks atomically, without rebuilding at the old position", async () => {
    const program = crossfadeProgram();
    await h.playback.load(program);
    await h.playback.start(program, 0.8);
    await h.playback.configureAudition(
      createTransitionAudition(program.plan, 0, 30, "both"),
    );
    const rebuild = jest.spyOn(h.playback, "prepareForUserGesture");
    await h.playback.seek(100, true);
    expect(rebuild).toHaveBeenCalledTimes(1);
    expect(rebuild).toHaveBeenCalledWith(100);
    await h.playback.configureAudition(null);
    expect(rebuild).toHaveBeenCalledTimes(1);
    expect(h.handlers.error).not.toHaveBeenCalled();
  });

  it("changes audition sides and exits without a seek, source reload or timer reset", async () => {
    const program = crossfadeProgram();
    const transition = program.plan.transitions[0];
    await h.playback.load(program);
    await h.playback.start(program, 0.8, transition.startSeconds + 45);
    const position = h.playback.positionSeconds();
    const prepare = jest.spyOn(h.playback, "prepareForUserGesture");
    const plays = h.media.map((m) => m.play.mock.calls.length);
    const musicalAutomation = h.gainFor(program.works[0].id)!.gain
      .setValueCurveAtTime.mock.calls.length;
    for (const mode of ["outgoing", "incoming", "both"] as const) {
      await h.playback.configureAudition(
        createTransitionAudition(program.plan, 0, 30, mode),
        { preservePosition: true, loop: false },
      );
      expect(h.playback.positionSeconds()).toBe(position);
      expect(
        h.auditionGainFor(program.works[0].id)!.gain.linearRampToValueAtTime,
      ).toHaveBeenLastCalledWith(
        mode === "incoming" ? 0 : 1,
        Date.now() / 1000 + 0.02,
      );
    }
    await h.playback.configureAudition(null);
    expect(prepare).not.toHaveBeenCalled();
    expect(h.media.map((m) => m.play.mock.calls.length)).toEqual(plays);
    expect(
      h.gainFor(program.works[0].id)!.gain.setValueCurveAtTime,
    ).toHaveBeenCalledTimes(musicalAutomation);
    await jest.advanceTimersByTimeAsync(
      (program.plan.totalDurationSeconds - position) * 1000,
    );
    expect(h.handlers.ended).toHaveBeenCalledTimes(1);
    expect(h.handlers.error).not.toHaveBeenCalled();
  });

  it("Exit loop cancels the repeat boundary without restarting the audible decks", async () => {
    const program = crossfadeProgram();
    const audition = createTransitionAudition(program.plan, 0, 30, "both");
    await h.playback.load(program);
    await h.playback.start(program, 0.8, audition.startSeconds);
    await h.playback.configureAudition(audition, {
      preservePosition: true,
      loop: true,
    });
    await jest.advanceTimersByTimeAsync(10_000);
    const prepare = jest.spyOn(h.playback, "prepareForUserGesture");
    const position = h.playback.positionSeconds();
    await h.playback.configureAudition(null);
    expect(h.playback.positionSeconds()).toBe(position);
    expect(prepare).not.toHaveBeenCalled();
    await jest.advanceTimersByTimeAsync(
      (audition.endSeconds - position + 1) * 1000,
    );
    expect(h.playback.positionSeconds()).toBeCloseTo(
      audition.endSeconds + 1,
      6,
    );
    expect(h.handlers.error).not.toHaveBeenCalled();
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

  it.each([220.5913333333334, 20000.33333333333, 1000000.1234567])(
    "keeps point and adjoining curves ordered on a fractional context clock %f",
    async (clock) => {
      await h.playback.dispose();
      h.restore();
      h = adaptiveWebHarness(clock);
      const program = crossfadeProgram(60),
        incoming = program.plan.segments[1],
        transition = program.plan.transitions[0];
      incoming.finalEnvelopeSeconds =
        program.plan.totalDurationSeconds - transition.startSeconds;
      // Actual remote failure: a mathematically zero offset rounded below now.
      if (clock === 220.5913333333334)
        expect(
          clock + transition.startSeconds - transition.startSeconds,
        ).toBeLessThan(clock);
      await h.playback.load(program);
      await h.playback.start(program, 0.8, transition.startSeconds);
      const gain = h.gainFor(incoming.workId)!.gain;
      const curves = gain.setValueCurveAtTime.mock.calls;
      expect(curves.length).toBeGreaterThanOrEqual(2);
      expect(curves[0][1]).toBe(gain.setValueAtTime.mock.lastCall![1]);
      for (let index = 1; index < curves.length; index++)
        expect(curves[index][1]).toBeGreaterThanOrEqual(
          curves[index - 1][1] + curves[index - 1][2],
        );
      expect(h.handlers.error).not.toHaveBeenCalled();
    },
  );

  it.each(["outgoing", "incoming", "both"] as const)(
    "actually repeats the audition window twice in %s mode and cancels on Stop",
    async (mode) => {
      const program = crossfadeProgram();
      const window = createTransitionAudition(program.plan, 0, 30, mode);
      const spanMs = (window.endSeconds - window.startSeconds) * 1000;
      const midpointMs =
        (program.plan.transitions[0].startSeconds + 90 - window.startSeconds) *
        1000;
      await h.playback.load(program);
      await h.playback.configureAudition(window);
      await h.playback.start(program, 0.8, window.startSeconds);
      for (let iteration = 0; iteration < 2; iteration++) {
        await jest.advanceTimersByTimeAsync(midpointMs);
        for (const [index, direction] of (
          ["outgoing", "incoming"] as const
        ).entries()) {
          const gain = h.gainFor(program.works[index].id)!.gain;
          const value =
            gain.setValueAtTime.mock.lastCall![0] *
            h.auditionGainFor(program.works[index].id)!.gain.value;
          if (mode !== "both" && direction !== mode) expect(value).toBe(0);
          else expect(value).toBeGreaterThan(0);
        }
        await jest.advanceTimersByTimeAsync(spanMs - midpointMs);
        expect(h.playback.positionSeconds()).toBeCloseTo(
          window.startSeconds,
          6,
        );
        expect(h.handlers.error).not.toHaveBeenCalled();
      }
      await h.playback.stop(false);
      const plays = h.media.reduce(
        (count, m) => count + m.play.mock.calls.length,
        0,
      );
      expect(jest.getTimerCount()).toBe(0);
      await jest.advanceTimersByTimeAsync(2 * spanMs);
      expect(h.media.every((m) => m.paused)).toBe(true);
      expect(
        h.media.reduce((count, m) => count + m.play.mock.calls.length, 0),
      ).toBe(plays);
      expect(h.handlers.ended).not.toHaveBeenCalled();
      expect(h.handlers.error).not.toHaveBeenCalled();
    },
  );

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
