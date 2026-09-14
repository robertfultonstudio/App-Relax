import { getPlayableWorksForOutcome } from "./consumerCatalog";
import { soundFamilyFor } from "./soundFamilies";
import type { ConsumerOutcomeId } from "./productShell";
import type { ConsumerAudioWork } from "@/domain/audio/consumerTypes";

/** Complete practice cycles are never dismantled by the everyday Start action. */
export function automaticListeningPool(outcome: ConsumerOutcomeId) {
  const files = getPlayableWorksForOutcome(outcome).filter(
    (work) => work.sourceKind === "file" && !work.cycle,
  );
  const music = files.filter((work) => soundFamilyFor(work) === "music");
  // Prefer the activity's music; do not turn every activity into ocean playback.
  return music.length ? music : files;
}

/** Pick once per visit, not at each render, timer change, pause or loop boundary. */
export function chooseAutomaticWork(
  outcome: ConsumerOutcomeId,
  sample: number,
  previousWorkId?: string,
): ConsumerAudioWork | null {
  const pool = automaticListeningPool(outcome);
  const fresh = pool.filter((work) => work.id !== previousWorkId);
  const candidates = fresh.length ? fresh : pool;
  if (!candidates.length) return null;
  const bounded = Number.isFinite(sample)
    ? Math.max(0, Math.min(1, sample))
    : 0;
  return candidates[
    Math.min(candidates.length - 1, Math.floor(bounded * candidates.length))
  ]!;
}
