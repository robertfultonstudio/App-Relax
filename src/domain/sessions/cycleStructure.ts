import type { ConsumerAudioWork } from "@/domain/audio/consumerTypes";
import type { SessionPhaseId } from "./types";

/** An inventory by documented function, NOT an executable musical sequence. */
export function getCyclePhaseCandidates(
  works: readonly ConsumerAudioWork[],
  cycleId: string,
  phase: SessionPhaseId,
): readonly ConsumerAudioWork[] {
  return works
    .filter(
      (work) =>
        work.cycle?.id === cycleId && work.cycle.phaseRoles.includes(phase),
    )
    .sort((a, b) => a.cycle!.structuralOrder - b.cycle!.structuralOrder);
}

export function matchesCyclePhase(
  work: ConsumerAudioWork,
  phase: SessionPhaseId,
) {
  return !work.cycle || work.cycle.phaseRoles.includes(phase);
}
