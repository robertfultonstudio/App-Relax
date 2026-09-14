import { HATHA_AUDIO_WORKS } from "@/content/hathaCatalog";
import {
  getConsumerWork,
  getWorksForOutcome,
  isPlayableWork,
} from "@/content/consumerCatalog";
import { getPwaWorkStaticParams } from "@/content/pwaStaticRoutes";
import { createSingleTrackProgram } from "@/domain/audio/consumerTypes";
import {
  getCyclePhaseCandidates,
  matchesCyclePhase,
} from "@/domain/sessions/cycleStructure";
import {
  createAdaptiveSessionProgram,
  evaluateTransition,
} from "@/domain/sessions/continuumPlanner";
import { SESSION_WORK_PROFILES } from "@/content/sessionWorkProfiles";
import { resolveLocalPreviewWork } from "@/audio/web/WebAudioSourceResolver";
import { SessionPlanningError } from "@/domain/sessions/types";

let mockPreview = true,
  mockPwa = false;
jest.mock("@/domain/sessions/playbackAvailability", () => ({
  isNativeCatalogPreview: () => false,
  isAdaptivePlaybackAvailable: () => mockPreview,
  isPwaWebSurface: () => mockPwa,
}));
const titles = [
  "Threshold of Breath",
  "Air Between Hands",
  "Wave and Ground",
  "Quiet Expanse",
  "Earth in Motion",
  "Long Exhale",
  "Lingering Space",
  "Space Unfolding",
];
describe("Respiro Hatha final loops", () => {
  beforeEach(() => {
    mockPreview = true;
    mockPwa = false;
  });
  it("registers exactly eight independent works with English presentation and stable structure", () => {
    expect(HATHA_AUDIO_WORKS.map((w) => w.title)).toEqual(titles);
    expect(HATHA_AUDIO_WORKS.map((w) => w.cycle!.structuralOrder)).toEqual([
      1, 2, 3, 4, 5, 6, 7, 8,
    ]);
    for (const work of HATHA_AUDIO_WORKS) {
      expect(getConsumerWork(work.id)).toBe(work);
      expect(work.title).not.toMatch(/[\d_]|LOOP|48K24/);
      expect(work.cycle!.id).toBe("respiro-hatha-1");
      expect(createSingleTrackProgram(work, "yoga")).toMatchObject({
        kind: "single-track",
        work,
        fadeInSeconds: 2,
      });
      expect(work.playbackGainDb).toBe(0);
      expect(work.measuredLufs).toBe(-18);
      expect(work.postGainTruePeakDbtp!).toBeLessThan(-1);
      expect(work.listeningStatus).toBe(
        "PROVISIONAL — LISTENING APPROVAL REQUIRED",
      );
      expect(work.durationSeconds * 48000).toBe(work.frameCount);
      expect(resolveLocalPreviewWork(work)).toBe(
        `/audio-catalog/${work.localPreviewFilename}`,
      );
      expect(isPlayableWork(work)).toBe(true);
    }
    expect(getWorksForOutcome("yoga").filter((w) => w.cycle)).toEqual(
      HATHA_AUDIO_WORKS,
    );
  });
  it("maps source functions to the four planner phases without titles or alphabetical sorting", () => {
    const retitled = [...HATHA_AUDIO_WORKS]
      .reverse()
      .map((w) => ({ ...w, title: "Unrelated title" }));
    for (const [phase, orders] of [
      ["arrival", [1, 2]],
      ["flow", [3, 4]],
      ["deepening", [5, 6, 7]],
      ["return", [8]],
    ] as const) {
      expect(
        getCyclePhaseCandidates(retitled, "respiro-hatha-1", phase).map(
          (w) => w.cycle!.structuralOrder,
        ),
      ).toEqual(orders);
    }
    expect(matchesCyclePhase(HATHA_AUDIO_WORKS[0], "return")).toBe(false);
    expect(matchesCyclePhase(HATHA_AUDIO_WORKS[7], "arrival")).toBe(false);
    expect(
      getCyclePhaseCandidates(retitled, "another-cycle", "arrival"),
    ).toEqual([]);
  });
  it.each(["qa-seed-1", "qa-seed-2"])(
    "fails closed consistently for %s without inventing musical transitions",
    (seed) => {
      const input = {
        cycleId: "respiro-hatha-1",
        outcome: "yoga",
        mode: "sound-only",
        soundKind: "music",
        durationMinutes: 30,
        seed,
        allowProvisionalMetadata: true,
      } as const;
      for (let i = 0; i < 2; i++) {
        expect(() => createAdaptiveSessionProgram(input)).toThrow(
          SessionPlanningError,
        );
        try {
          createAdaptiveSessionProgram(input);
        } catch (error) {
          expect(error).toMatchObject({ code: "CYCLE_TRANSITIONS_UNREVIEWED" });
        }
      }
      expect(SESSION_WORK_PROFILES.some((p) => p.work.cycle)).toBe(false);
      const base = SESSION_WORK_PROFILES[0];
      expect(
        evaluateTransition(
          { ...base, work: HATHA_AUDIO_WORKS[0] },
          { ...base, work: HATHA_AUDIO_WORKS[1] },
        ).compatible,
      ).toBe(false);
    },
  );
  it("permits the authorized private web review without enabling native playback", () => {
    expect(
      getPwaWorkStaticParams().some((w) =>
        w.workId.startsWith("respiro-hatha"),
      ),
    ).toBe(true);
    mockPwa = true;
    for (const work of HATHA_AUDIO_WORKS) {
      expect(isPlayableWork(work)).toBe(true);
      expect(resolveLocalPreviewWork(work)).toBe(
        `/audio-catalog/${work.localPreviewFilename}`,
      );
    }
    mockPwa = false;
    mockPreview = false;
    expect(getWorksForOutcome("yoga").some((w) => w.cycle)).toBe(false);
    expect(HATHA_AUDIO_WORKS.every((w) => !isPlayableWork(w))).toBe(true);
  });
});
