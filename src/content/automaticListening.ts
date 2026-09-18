import {
  getConsumerWork,
  isPlayableWork,
  isVisibleConsumerWork,
} from "./consumerCatalog";
import { soundFamilyFor } from "./soundFamilies";
import type { ConsumerOutcomeId } from "./productShell";
import type { ConsumerAudioWork } from "@/domain/audio/consumerTypes";
import type { ConsumerSelection } from "@/domain/audio/consumerSelection";
import type { LastListening } from "@/state/lastListeningPersistence";

/** Editorial proposal, not listening approval. Independent works, never cycle fragments. */
export const ACTIVITY_MUSIC_POOLS: Readonly<
  Record<ConsumerOutcomeId, readonly string[]>
> = {
  meditation: ["distant-garden", "aquarian-drift"],
  yoga: ["quiet-field", "cedar-current"],
  massage: ["mineral-drift", "moonlit-keys", "luminous-steps", "aquarian-echo"],
  relax: ["distant-bloom", "moonlit-veil"],
  sleep: ["moonlit-veil", "aquarian-drift"],
  focus: ["astral-thread", "luminous-grain"],
};

/** Complete practice cycles are never dismantled by the everyday Start action. */
export function automaticListeningPool(outcome: ConsumerOutcomeId) {
  return ACTIVITY_MUSIC_POOLS[outcome]
    .map(getConsumerWork)
    .filter((work): work is ConsumerAudioWork =>
      Boolean(
        work &&
        isVisibleConsumerWork(work) &&
        isPlayableWork(work) &&
        work.sourceKind === "file" &&
        !work.cycle &&
        soundFamilyFor(work) === "music",
      ),
    );
}

/** A nature lane does not make the previous musical recording a different work. */
export function previousListeningWorkId(
  active: ConsumerSelection | null,
  saved: LastListening | null = null,
): string | undefined {
  if (active?.kind === "single") return active.program.work.id;
  if (active?.kind === "adaptive")
    return (
      active.request.listeningWorkId ?? active.program.plan.listeningWorkId
    );
  return saved?.kind === "single"
    ? saved.workId
    : saved?.request.listeningWorkId;
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
