import { CONSUMER_AUDIO_WORKS } from "./consumerCatalog";
import type { ConsumerOutcomeId } from "./productShell";
import type {
  SessionSoundKind,
  SessionPhaseId,
  SessionWorkProfile,
} from "@/domain/sessions/types";

const ALL_PHASES: readonly SessionPhaseId[] = [
  "arrival",
  "flow",
  "deepening",
  "return",
];

const ALL_OUTCOMES: readonly ConsumerOutcomeId[] = [
  "meditation",
  "yoga",
  "massage",
  "relax",
  "sleep",
  "focus",
];

export const PROVISIONAL_MUSIC_SESSION_WORK_IDS = new Set([
  "astral-thread",
  "celestial-current",
  "quiet-field",
  "cedar-current",
]);

export const PROVISIONAL_MUSIC_SESSION_PAIRINGS: readonly (readonly [
  string,
  string,
])[] = [];

const EXTRA_INTENTS: Readonly<Record<string, readonly ConsumerOutcomeId[]>> = {
  "field-rain-002-soft-weather": ["massage", "yoga"],
  "field-rain-005-misted-garden": ["massage", "yoga"],
  "field-stream-001-stone-current": ["yoga", "massage"],
  "field-stream-002-moss-current": ["yoga", "massage"],
  "field-stream-003-hidden-water": ["yoga"],
  "field-stream-004-clear-stream": ["yoga"],
  "field-stream-005-cedar-stream": ["yoga"],
  "field-sea-001-tidal-breath": ["massage", "yoga"],
  "field-sea-003-open-tide": ["yoga", "massage"],
  "field-sea-005-pearl-tide": ["massage", "yoga"],
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
  if (!work.primaryOutcome)
    throw new Error("Unclassified material has no session profile.");
  const aestheticFamily = work.id.startsWith("field-rain")
    ? "rain"
    : work.id.startsWith("field-sea")
      ? "sea"
      : "stream";
  const energy = energyFor(work.id);
  return {
    work,
    materialKind: "nature",
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
  if (!work.primaryOutcome)
    throw new Error("Unclassified material has no session profile.");
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
  const materialKind: SessionSoundKind | "unclassified" =
    work.id === "esoteric-air-001-second-element" ? "unclassified" : "music";
  return {
    work,
    materialKind,
    intents: distinct([
      work.primaryOutcome,
      ...work.secondaryOutcomes,
      ...(PROVISIONAL_MUSIC_SESSION_WORK_IDS.has(work.id) ? ALL_OUTCOMES : []),
    ]),
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
      work.primaryOutcome !== null &&
      work.availability !== "rejected-listening" &&
      work.listeningStatus === "APPROVED — LISTENING PASSED",
  ).map((work) =>
    work.id.startsWith("field-") || work.id === "deep-river"
      ? createNaturalWaterProfile(work)
      : createTonalProfile(work),
  );
