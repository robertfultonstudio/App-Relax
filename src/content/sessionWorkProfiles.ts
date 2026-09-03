import { CONSUMER_AUDIO_WORKS } from "./consumerCatalog";
import type { ConsumerOutcomeId } from "./productShell";
import type {
  SessionPhaseId,
  SessionWorkProfile,
} from "@/domain/sessions/types";

const ALL_PHASES: readonly SessionPhaseId[] = [
  "arrival",
  "flow",
  "deepening",
  "return",
];

const EXTRA_INTENTS: Readonly<Record<string, readonly ConsumerOutcomeId[]>> = {
  "field-rain-002-soft-weather": ["massage", "yoga"],
  "field-rain-005-misted-garden": ["massage", "yoga"],
  "field-stream-001-stone-current": ["yoga", "massage"],
  "field-stream-002-moss-current": ["yoga", "massage"],
  "field-stream-003-hidden-water": ["yoga"],
  "field-stream-004-clear-stream": ["yoga"],
  "field-stream-005-cedar-stream": ["yoga"],
  "field-sea-001-tidal-breath": ["massage", "yoga"],
  "field-sea-003-open-tide": ["yoga"],
  "field-sea-005-pearl-tide": ["massage"],
  "field-sea-007-blue-interval": ["yoga", "massage"],
};

function distinct<T>(values: readonly T[]): T[] {
  return [...new Set(values)];
}

function energyFor(id: string): 1 | 2 | 3 {
  const number = Number(id.match(/-(\d{3})-/)?.[1] ?? 1);
  return ((number % 3) + 1) as 1 | 2 | 3;
}

function createNaturalWaterProfile(
  work: (typeof CONSUMER_AUDIO_WORKS)[number],
): SessionWorkProfile {
  const aestheticFamily = work.id.startsWith("field-rain")
    ? "rain"
    : work.id.startsWith("field-sea")
      ? "sea"
      : "stream";
  const energy = energyFor(work.id);
  return {
    work,
    intents: distinct([
      work.primaryOutcome,
      ...work.secondaryOutcomes,
      ...(EXTRA_INTENTS[work.id] ?? []),
    ]),
    aestheticFamily,
    compatibilityGroup: "elemental-water-provisional",
    harmonicFamily: "non-tonal-water",
    energyStart: energy,
    energyEnd: energy === 3 ? 2 : energy,
    density: aestheticFamily === "rain" ? 3 : aestheticFamily === "sea" ? 2 : 1,
    melodicPresence: "none",
    voiceCompatibility: "preferred",
    phaseRoles: ALL_PHASES,
    safeEntryPointsSeconds: [0],
    safeExitPointsSeconds: [work.durationSeconds],
    transitionClass: "natural-water",
    offlineState: "local-development-only",
    endingPolicy: "continuous-loop",
    editorialStatus: "PROVISIONAL — TRANSITION REVIEW REQUIRED",
    metadataBasis: "PROVISIONAL — CATALOG AND FILENAME INFERENCE",
    continuumReadiness: "provisional-qa",
  };
}

function createTonalProfile(
  work: (typeof CONSUMER_AUDIO_WORKS)[number],
): SessionWorkProfile {
  const filename = work.sourceFilename ?? "";
  const harmonicFamily = filename.includes("EMINOR")
    ? "e-minor"
    : filename.includes("CMAJ")
      ? "c-major"
      : "catalog-untagged";
  const melodicPresence = /PIANO|KEYS|STEPS|BLOOM|ECHO/.test(
    `${filename} ${work.title.toUpperCase()}`,
  )
    ? "present"
    : "light";
  return {
    work,
    intents: distinct([work.primaryOutcome, ...work.secondaryOutcomes]),
    aestheticFamily: melodicPresence === "present" ? "soft-tonal" : "cosmic",
    compatibilityGroup: `tonal-${harmonicFamily}`,
    harmonicFamily,
    energyStart: melodicPresence === "present" ? 3 : 2,
    energyEnd: 2,
    density: melodicPresence === "present" ? 3 : 2,
    melodicPresence,
    voiceCompatibility:
      melodicPresence === "present" ? "duckable" : "preferred",
    phaseRoles: ALL_PHASES,
    safeEntryPointsSeconds: [0],
    safeExitPointsSeconds: [work.durationSeconds],
    transitionClass:
      melodicPresence === "present" ? "soft-tonal" : "harmonic-ambient",
    offlineState:
      work.availability === "embedded-flac" ||
      work.availability === "embedded-wav"
        ? "embedded"
        : "local-development-only",
    endingPolicy: "continuous-loop",
    editorialStatus: "PROVISIONAL — TRANSITION REVIEW REQUIRED",
    metadataBasis: "PROVISIONAL — CATALOG AND FILENAME INFERENCE",
    continuumReadiness: "provisional-qa",
  };
}

export const SESSION_WORK_PROFILES: readonly SessionWorkProfile[] =
  CONSUMER_AUDIO_WORKS.filter(
    (work) =>
      work.sourceKind === "file" &&
      work.availability !== "rejected-listening" &&
      work.listeningStatus === "APPROVED — LISTENING PASSED",
  ).map((work) =>
    work.id.startsWith("field-") || work.id === "deep-river"
      ? createNaturalWaterProfile(work)
      : createTonalProfile(work),
  );
