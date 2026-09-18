import oracle from "../fixtures/c3-hatha-review.json";
import manifest from "@/content/hathaAudioFiles.json";
import delivery from "@/content/nativeAudioManifest.json";
import indexes from "@/pwa-review/flacIndexManifest.json";
import { CONSUMER_AUDIO_WORKS } from "@/content/consumerCatalog";
import { soundFamilyFor } from "@/content/soundFamilies";
import { createWholeFileReviewProgram } from "@/domain/sessions/createWholeFileReviewProgram";
import { reviewMarkers } from "@/pwa-review/reviewTimeline";
import type { SessionDurationMinutes } from "@/domain/sessions/types";

// Frozen frame oracle for repeatable device auditions, not musical approval.
it.each(oracle.cases)(
  "preserves the C3 $durationMinutes-minute audition and its source identities",
  (expected) => {
    const input = {
      outcome: "yoga" as const,
      mode: "sound-only" as const,
      soundKind: "music" as const,
      seed: oracle.seed,
      durationMinutes: expected.durationMinutes as SessionDurationMinutes,
    };
    const program = createWholeFileReviewProgram(input);
    expect(createWholeFileReviewProgram(input)).toEqual(program);
    expect(program.plan.sampleRateHz).toBe(oracle.sampleRateHz);
    expect(program.works.map((work) => work.id)).toEqual(expected.ids);
    expect(
      program.plan.segments.map((s) => [s.startFrame, s.endFrame]),
    ).toEqual(expected.segments);
    expect(
      program.plan.transitions.map((t) => ({
        fromId: program.plan.segments[t.outgoingSegmentIndex].workId,
        toId: program.plan.segments[t.incomingSegmentIndex].workId,
        startFrame: t.startFrame,
        endFrame: t.endFrame,
      })),
    ).toEqual(expected.joins);
    expect(
      reviewMarkers(program)
        .filter((m) => m.kind === "loop")
        .map((m) => Math.round(m.seconds * oracle.sampleRateHz)),
    ).toEqual(expected.loopFrames);
    expect(
      reviewMarkers(program)
        .filter((m) => m.kind === "loop")
        .map((m) => ({
          workId: program.plan.segments[m.segmentIndex].workId,
          segmentIndex: m.segmentIndex,
          frame: Math.round(m.seconds * oracle.sampleRateHz),
        })),
    ).toEqual(expected.loops);
    for (const [index, work] of program.works.entries()) {
      const source = oracle.sources.find((s) => s.id === work.id)!;
      expect(work).toMatchObject({
        title: source.title,
        sourceFilename: source.sourceWavFilename,
        frameCount: source.frameCount,
      });
      expect(manifest.files.find((file) => file.id === work.id)).toMatchObject({
        filename: source.sourceWavFilename,
        displayTitle: source.title,
        sha256: source.sourceWavSha256,
      });
      expect(delivery.files.find((f) => f.workId === work.id)).toEqual(
        source.delivery,
      );
      expect(
        indexes.files.find((f) => f.filename === source.delivery.filename),
      ).toMatchObject({
        sourceSha256: source.delivery.sha256,
        bytes: source.delivery.bytes,
        totalFrames: source.frameCount,
      });
      expect(program.plan.segments[index]).toMatchObject({
        sourceEntryFrame: 0,
        sourceExitFrame: source.frameCount,
        finalEnvelopeSeconds: index === program.works.length - 1 ? 3 : 0,
      });
    }
    expect(program.fadeInSeconds).toBe(3);
    expect(program.fadeOutSeconds).toBe(3);
    expect(
      program.plan.transitions.every((t) => t.curve === "equal-power"),
    ).toBe(true);
    expect(program.plan.targetFrames).toBe(
      expected.durationMinutes * 60 * 48000,
    );
    expect(program.plan.segments.at(-1)!.endFrame).toBe(
      program.plan.targetFrames,
    );
    expect(program.plan.transitionReviewStatus).toBe(
      "PROVISIONAL — LISTENING REVIEW REQUIRED",
    );
    expect(program.plan.endingStrategy).toBe(
      expected.durationMinutes === 90
        ? "extended-loop-boundary-review-only"
        : "source-file-boundary-review-only",
    );
  },
);

it("fixes the short-natural-file audition inventory without inferring perceived repetition", () => {
  const works = CONSUMER_AUDIO_WORKS.filter(
    (w) =>
      w.sourceKind === "file" &&
      w.durationSeconds <= 45 &&
      ["rain", "sea", "stream", "unclassified-nature"].includes(
        soundFamilyFor(w),
      ),
  );
  for (const expected of oracle.shortNatural) {
    const work = works.find((w) => w.id === expected.delivery.workId)!;
    expect(work.frameCount).toBe(expected.delivery.frames);
    expect(work.localPreviewFilename).toBe(expected.delivery.filename);
    expect(work.provenance.manifestReference).toBe(expected.provenanceManifest);
    expect(delivery.files.find((f) => f.workId === work.id)).toEqual(
      expected.delivery,
    );
    if (expected.delivery.filename.endsWith(".flac")) {
      expect(
        indexes.files.find((f) => f.filename === expected.delivery.filename),
      ).toMatchObject({
        sourceSha256: expected.delivery.sha256,
        bytes: expected.delivery.bytes,
        totalFrames: expected.delivery.frames,
      });
    }
  }
  expect(
    works.map((w) => [
      w.id,
      soundFamilyFor(w),
      Math.floor((20 * 60 * 48000 - 1) / w.frameCount),
      Math.floor((90 * 60 * 48000 - 1) / w.frameCount),
    ]),
  ).toEqual([
    ["field-rain-002-soft-weather", "rain", 39, 177],
    ["field-rain-003-deep-rain", "rain", 59, 269],
    ["field-rain-004-fine-rain", "rain", 27, 122],
    ["field-rain-005-misted-garden", "rain", 26, 119],
    ["field-rain-006-quiet-weather", "rain", 58, 263],
    ["field-rain-007-rain-veil", "rain", 27, 122],
    ["field-rain-008-sheltered-rain", "rain", 54, 245],
    ["field-rain-009-distant-shower", "rain", 27, 125],
    ["field-rain-010-low-rain", "rain", 79, 359],
    ["field-rain-011-rain-receding", "rain", 49, 224],
    ["night-birds-b1", "unclassified-nature", 35, 160],
  ]);
});
