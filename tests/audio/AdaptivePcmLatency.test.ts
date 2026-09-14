import { AdaptiveWebPlayback } from "@/audio/web/AdaptiveWebPlayback";
import { crossfadeProgram } from "../fixtures/crossfadeProgram";
import type { ConsumerAudioWork } from "@/domain/audio/consumerTypes";
import type {
  PcmWindowReader,
  PcmReviewTarget,
} from "@/audio/web/ClockedWavSource";

it("prepares only currently audible PCM sources, directly at the target, and keeps source affinity", async () => {
  const program = crossfadeProgram();
  const gain = () => ({
    connect: jest.fn(),
    disconnect: jest.fn(),
    gain: {
      value: 0,
      cancelScheduledValues: jest.fn(),
      setValueAtTime: jest.fn(),
      linearRampToValueAtTime: jest.fn(),
      setValueCurveAtTime: jest.fn(),
    },
  });
  const context = {
    sampleRate: 48000,
    currentTime: 0,
    createGain: gain,
    resume: async () => {},
    createBufferSource: () => ({
      connect: jest.fn(),
      disconnect: jest.fn(),
      start: jest.fn(),
      stop: jest.fn(),
    }),
    createBuffer: (_: number, length: number) => ({
      length,
      copyToChannel: jest.fn(),
    }),
  } as unknown as AudioContext;
  const opens: string[] = [],
    reads: { id: string; start: number; frames: number }[] = [];
  let holdRefill = false;
  let holdFuture = false;
  const errors = jest.fn();
  const releases: (() => void)[] = [];
  const liveReaders = new Set<string>();
  const review = jest.fn(
    async (_targets: readonly PcmReviewTarget[], _signal: AbortSignal) => true,
  );
  const playback = new AdaptiveWebPlayback(
    context,
    {} as AudioNode,
    { ended: jest.fn(), error: errors },
    (work) => ({ uri: `fixture://${work.id}.flac`, release: () => {} }),
    true,
    Object.assign(
      (_url: string, work: ConsumerAudioWork): PcmWindowReader => ({
        open: async () => {
          opens.push(work.id);
          liveReaders.add(work.id);
          return { frames: work.frameCount! };
        },
        read: async (start, frames, signal) => {
          reads.push({ id: work.id, start, frames });
          if (holdRefill && start >= 112 * 48000)
            await new Promise<void>((resolve) => releases.push(resolve));
          if (holdFuture && work.id === program.works[1].id)
            await new Promise<void>((_resolve, reject) => {
              signal.addEventListener(
                "abort",
                () => reject(new Error("FLAC window cancelled")),
                { once: true },
              );
            });
          return [new Float32Array(frames), new Float32Array(frames)];
        },
        close: () => {
          liveReaders.delete(work.id);
        },
      }),
      { prepareReview: review },
    ),
  );
  await playback.load(program);
  expect(opens.sort()).toEqual(
    [program.works[0].id, program.works[2].id].sort(),
  );
  expect(reads).toHaveLength(2);
  expect(
    await playback.prepareReviewSeek(305, new AbortController().signal),
  ).toBe(true);
  const targets = review.mock.calls[0]![0];
  expect(targets.map((t) => [t.work.id, t.positionSeconds]).sort()).toEqual(
    [
      [program.works[0].id, 305 % 137],
      [program.works[1].id, 0],
      [program.works[2].id, 305 % 137],
    ].sort(),
  );
  // Range planning is silent and does not reposition or prime any decoder.
  expect(reads).toHaveLength(2);
  // Separately exercise preparation and seek at the SAME point. The factory
  // here is a boundary double; real Range cache consumption has its own tests.
  expect(
    await playback.prepareReviewSeek(100, new AbortController().signal),
  ).toBe(true);
  expect(
    review.mock.calls[1]![0].map((target) => target.positionSeconds),
  ).toEqual([100, 100]);
  reads.length = 0;
  await playback.seek(100);
  expect(opens).toHaveLength(2);
  expect(reads).toHaveLength(2);
  expect(
    reads.every(
      ({ start, frames }) => start === 100 * 48000 && frames === 8 * 48000,
    ),
  ).toBe(true);
  const count = opens.length;
  reads.length = 0;
  await playback.seek(100, true);
  expect(reads).toHaveLength(0);
  expect(opens).toHaveLength(count);
  // Both audible lanes need their runway first. Distant future source
  // transfers may not compete while those two refills are deliberately held.
  holdRefill = true;
  await playback.start(program, 0.8, 100);
  for (let i = 0; i < 100; i++) await Promise.resolve();
  expect(releases).toHaveLength(2);
  expect(
    await playback.prepareReviewSeek(305, new AbortController().signal),
  ).toBe(false);
  expect(review).toHaveBeenCalledTimes(2);
  expect(opens).not.toContain(program.works[1].id);
  expect(opens).not.toContain(program.works[3].id);
  holdRefill = false;
  holdFuture = true;
  for (const release of releases) release();
  for (let i = 0; i < 300; i++) await Promise.resolve();
  expect(opens).toContain(program.works[1].id);
  expect(opens).not.toContain(program.works[3].id);
  holdFuture = false;
  await playback.pause();
  for (let i = 0; i < 100; i++) await Promise.resolve();
  expect(errors).not.toHaveBeenCalled();
  await playback.resume();
  for (let i = 0; i < 300; i++) await Promise.resolve();
  expect(opens).toContain(program.works[3].id);
  expect(errors).not.toHaveBeenCalled();
  expect(liveReaders.size).toBeGreaterThan(0);
  await playback.stop();
  expect(liveReaders.size).toBe(0);
  await playback.dispose();
});
