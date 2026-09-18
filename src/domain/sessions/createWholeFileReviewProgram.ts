import { HATHA_AUDIO_WORKS } from "@/content/hathaCatalog";
import { getConsumerWork } from "@/content/consumerCatalog";
import { createListeningNatureProgram } from "./createListeningNatureProgram";
import {
  createAdaptiveSessionProgram,
  attachCoordinatedNatureBed,
} from "@/domain/sessions/continuumPlanner";
import { estimateOverlapPeakDbtp } from "@/domain/sessions/equalPower";
import { auditPlanAccelerated } from "@/domain/sessions/workbench";
import type {
  AdaptiveSessionProgram,
  CreateAdaptiveSessionInput,
  SessionPhaseId,
} from "@/domain/sessions/types";

const RATE = 48000;
const PHASES: SessionPhaseId[] = ["arrival", "flow", "deepening", "return"];
function hash(text: string) {
  let value = 2166136261;
  for (const character of text)
    value = Math.imul(value ^ character.charCodeAt(0), 16777619);
  return value >>> 0;
}

/** Private review ONLY. Preserves documented cycle order and whole source files.
 * It does not infer harmony or grant musical approval to these transitions.
 * Production planner remains fail-closed until final-WAV pairings are reviewed. */
export function createWholeFileReviewProgram(
  input: CreateAdaptiveSessionInput,
  musicGuardSeconds = 0,
): AdaptiveSessionProgram {
  if (input.listeningWorkId) {
    const work = getConsumerWork(input.listeningWorkId);
    if (!work || input.mode !== "sound-only" || input.soundKind !== "music")
      throw new Error(
        "This saved music and ambience selection is unavailable.",
      );
    return createListeningNatureProgram(
      work,
      input.outcome,
      input.durationMinutes,
      input.includeNatureBed ? (input.natureFamily ?? "sea") : null,
      musicGuardSeconds,
    );
  }
  if (input.outcome !== "yoga" || input.soundKind !== "music") {
    if (musicGuardSeconds === 0 && !input.prepareNatureControls)
      return createAdaptiveSessionProgram(input);
    const base = createAdaptiveSessionProgram({
      ...input,
      includeNatureBed: false,
    });
    if (
      input.soundKind !== "music" ||
      (input.includeNatureBed === false && !input.prepareNatureControls)
    )
      return base;
    const ready = attachCoordinatedNatureBed(
      base,
      input.seed,
      input.natureFamily,
      undefined,
      musicGuardSeconds,
    );
    ready.plan.natureMix!.enabled = input.includeNatureBed !== false;
    if (ready.plan.natureMix!.enabled === false) ready.plan.id += ":off";
    return ready;
  }
  if (input.mode !== "sound-only")
    throw new Error("Guided recordings are unavailable.");
  const targetFrames = input.durationMinutes * 60 * RATE;
  const candidates: {
    works: typeof HATHA_AUDIO_WORKS;
    repeatIds: string[];
    overlaps: number[];
    rank: number;
    key: number;
  }[] = [];
  // A 90-minute review keeps all eight works in order and extends one Flow
  // and one Deepening passage by one complete source iteration each. No new
  // material, partial phrase, time stretch or duplicated playlist entry.
  const variants =
    input.durationMinutes === 90
      ? HATHA_AUDIO_WORKS.filter(
          (w) => w.cycle!.phaseRoles[0] === "flow",
        ).flatMap((flow) =>
          HATHA_AUDIO_WORKS.filter(
            (w) => w.cycle!.phaseRoles[0] === "deepening",
          ).map((deepening) => ({
            mask: (1 << HATHA_AUDIO_WORKS.length) - 1,
            repeatIds: [flow.id, deepening.id],
          })),
        )
      : Array.from(
          { length: (1 << HATHA_AUDIO_WORKS.length) - 1 },
          (_, index) => ({
            mask: index + 1,
            repeatIds: [] as string[],
          }),
        );
  for (const { mask, repeatIds } of variants) {
    const works = HATHA_AUDIO_WORKS.filter((_, index) => mask & (1 << index));
    if (
      works.length < 4 ||
      !PHASES.every((phase) =>
        works.some((work) => work.cycle!.phaseRoles.includes(phase)),
      )
    )
      continue;
    if (
      input.availableWorkIds &&
      works.some((work) => !input.availableWorkIds!.includes(work.id))
    )
      continue;
    const overlapFrames =
      works.reduce(
        (sum, work) =>
          sum + work.frameCount * (repeatIds.includes(work.id) ? 2 : 1),
        0,
      ) - targetFrames;
    const base = Math.floor(overlapFrames / (works.length - 1));
    const remainder = overlapFrames - base * (works.length - 1);
    const overlaps = works
      .slice(1)
      .map((_, index) => base + Number(index < remainder));
    if (overlaps.some((frames) => frames < 60 * RATE || frames > 300 * RATE))
      continue;
    if (
      works.some(
        (work, index) =>
          work.frameCount <=
          (overlaps[index - 1] ?? 0) + (overlaps[index] ?? 0),
      )
    )
      continue;
    if (
      works.slice(1).some((work, index) => {
        const peak = estimateOverlapPeakDbtp(works[index], work);
        return peak === null || peak >= -1;
      })
    )
      continue;
    const repeated = works.filter((work) =>
      input.recentWorkIds?.includes(work.id),
    ).length;
    candidates.push({
      works,
      repeatIds,
      overlaps,
      rank: repeated * 10000 + Math.abs(base / RATE - 180),
      key: hash(
        `${input.seed}:${mask}${repeatIds.length ? `:${repeatIds.join("+")}` : ""}`,
      ),
    });
  }
  candidates.sort((a, b) => a.rank - b.rank || a.key - b.key);
  const selected = candidates[0];
  if (!selected)
    throw new Error(
      "Complete music review is available at 30, 45, 60 or 90 minutes when its source files are available. Only the 90-minute review extends two complete source loops.",
    );
  const { works, overlaps, repeatIds } = selected;
  let startFrame = 0;
  const segments = works.map((work, index) => {
    const loopCount = repeatIds.includes(work.id) ? 1 : 0;
    const endFrame = startFrame + work.frameCount * (1 + loopCount);
    const segment = {
      index,
      phase: work.cycle!.phaseRoles[0],
      workId: work.id,
      title: work.title,
      startFrame,
      endFrame,
      startSeconds: startFrame / RATE,
      endSeconds: endFrame / RATE,
      sourceEntryFrame: 0,
      sourceExitFrame: work.frameCount,
      sourceEntrySeconds: 0,
      sourceExitSeconds: work.durationSeconds,
      loopCount,
      playbackTrimDb: 0,
      finalEnvelopeSeconds: index === works.length - 1 ? 3 : 0,
      phaseRuleAudit: [
        "Source-document cycle order preserved.",
        loopCount
          ? "90-minute private review: two complete source iterations; loop listening approval pending."
          : "Whole file; no repeat or internal edit.",
        "PROVISIONAL QA: harmony, entry/exit and transition listening NOT approved.",
      ],
    };
    startFrame = endFrame - (overlaps[index] ?? 0);
    return segment;
  });
  const transitions = segments.slice(1).map((segment, index) => {
    const outgoing = segments[index];
    const peak = estimateOverlapPeakDbtp(works[index], works[index + 1])!;
    return {
      index,
      outgoingSegmentIndex: index,
      incomingSegmentIndex: index + 1,
      startFrame: segment.startFrame,
      endFrame: outgoing.endFrame,
      startSeconds: segment.startSeconds,
      endSeconds: outgoing.endSeconds,
      durationSeconds: overlaps[index] / RATE,
      curve: "equal-power" as const,
      transitionClass: "soft-tonal" as const,
      untrimmedPeakDbtp: peak,
      transitionTrimDb: 0,
      clippingRiskDbtp: peak,
      ruleAudit: [
        "Private whole-file cycle audition; not production compatibility approval.",
        repeatIds.length
          ? "Documented phase order; unique works with two disclosed source-loop extensions, overlap 60–300s, maximum two music sources."
          : "Documented phase order, no repetition, overlap 60–300s, maximum two sources.",
        `Whole-source frame accounting; conservative peak bound ${peak} dBTP.`,
      ],
      reviewStatus: "PROVISIONAL — LISTENING REVIEW REQUIRED" as const,
    };
  });
  const boundaries = [
    0,
    ...PHASES.slice(1).map((phase) => {
      const index = segments.findIndex((segment) => segment.phase === phase);
      return Math.round(
        (segments[index].startFrame + segments[index - 1].endFrame) / 2,
      );
    }),
    targetFrames,
  ];
  const program: AdaptiveSessionProgram = {
    kind: "adaptive-session",
    works,
    fadeInSeconds: 3,
    fadeOutSeconds: 3,
    plan: {
      schemaVersion: 1,
      kind: "adaptive-session-plan",
      id: `whole-file-review:${input.durationMinutes}:${hash(input.seed)}:${works.map((w) => w.id).join("+")}`,
      seed: input.seed,
      outcome: "yoga",
      mode: "sound-only",
      soundKind: "music",
      requestedDurationMinutes: input.durationMinutes,
      sampleRateHz: RATE,
      targetFrames,
      totalDurationSeconds: targetFrames / RATE,
      exactDuration: true,
      phases: PHASES.map((id, index) => ({
        id,
        startFrame: boundaries[index],
        endFrame: boundaries[index + 1],
        startSeconds: boundaries[index] / RATE,
        endSeconds: boundaries[index + 1] / RATE,
      })),
      segments,
      transitions,
      endingStrategy: repeatIds.length
        ? "extended-loop-boundary-review-only"
        : "source-file-boundary-review-only",
      offlineReady: false,
      transitionReviewStatus: "PROVISIONAL — LISTENING REVIEW REQUIRED",
      metadataReviewStatus: "PROVISIONAL — QA ONLY",
    },
  };
  if (!input.includeNatureBed && !input.prepareNatureControls) return program;
  const result = attachCoordinatedNatureBed(
    program,
    input.seed,
    input.natureFamily,
    undefined,
    musicGuardSeconds,
  );
  result.plan.natureMix!.enabled = Boolean(input.includeNatureBed);
  if (!result.plan.natureMix!.enabled) result.plan.id += ":off";
  if (!auditPlanAccelerated(result).pass)
    throw new Error("Whole-track review failed timeline safety.");
  return result;
}
