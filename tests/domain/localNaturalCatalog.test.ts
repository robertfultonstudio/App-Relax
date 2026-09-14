import { getConsumerWork, getWorksForOutcome } from "@/content/consumerCatalog";
import { CONSUMER_OUTCOMES } from "@/content/productShell";
import { soundFamilyFor } from "@/content/soundFamilies";
import { SESSION_WORK_PROFILES } from "@/content/sessionWorkProfiles";
import { QA_CATALOG } from "@/qa/qaCatalog";
import { getPwaWorkStaticParams } from "@/content/pwaStaticRoutes";
import { createSingleTrackProgram } from "@/domain/audio/consumerTypes";

it.each([
  ["field-recording-01", "Field Ambience", 8784000, -4.2],
  ["night-birds-b1", "Night Birds", 1616645, -6.4],
] as const)(
  "keeps %s single, local and unassigned, never music or automatic ambience",
  (id, title, frames, peak) => {
    const work = getConsumerWork(id)!;
    expect(work).toMatchObject({
      title,
      primaryOutcome: null,
      secondaryOutcomes: [],
      collectionIds: [],
      deliveryScope: "local-only",
      listeningStatus: "PROVISIONAL — LISTENING APPROVAL REQUIRED",
      durationSeconds: frames / 48000,
      frameCount: frames,
      playbackGainDb: 0,
      postGainTruePeakDbtp: peak,
    });
    expect(soundFamilyFor(work)).toBe("unclassified-nature");
    for (const outcome of CONSUMER_OUTCOMES)
      expect(getWorksForOutcome(outcome.id)).not.toContain(work);
    expect(SESSION_WORK_PROFILES.some((p) => p.work.id === work.id)).toBe(
      false,
    );
    expect(QA_CATALOG.find((p) => p.work.id === work.id)).toMatchObject({
      readiness: "single-only",
      transitionProfile: null,
    });
    expect(getPwaWorkStaticParams().some((p) => p.workId === work.id)).toBe(
      false,
    );
    expect(createSingleTrackProgram(work)).toMatchObject({
      kind: "single-track",
      fadeInSeconds: 2,
      work: { loop: true },
    });
  },
);
