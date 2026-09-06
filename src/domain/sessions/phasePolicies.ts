import type { ConsumerOutcomeId } from "@/content/productShell";
import type { SessionIntentPhasePolicy } from "./types";
import { SessionPlanningError } from "./types";

export const SESSION_PHASE_IDS = [
  "arrival",
  "flow",
  "deepening",
  "return",
] as const;
export const LEGACY_PHASE_WEIGHTS = [0.16, 0.38, 0.3, 0.16] as const;

export function validateIntentPhasePolicy(
  policy: SessionIntentPhasePolicy,
  outcome: ConsumerOutcomeId,
): void {
  const valid =
    policy.reviewStatus === "editorially-reviewed" &&
    policy.outcome === outcome &&
    policy.phases.length === SESSION_PHASE_IDS.length &&
    Math.abs(policy.phases.reduce((sum, phase) => sum + phase.weight, 0) - 1) <
      1e-9 &&
    policy.phases.every(
      (phase, index) =>
        phase.id === SESSION_PHASE_IDS[index] &&
        Number.isFinite(phase.weight) &&
        phase.weight > 0 &&
        [phase.energyStart, phase.energyEnd, phase.density].every(
          ([minimum, maximum]) =>
            Number.isInteger(minimum) &&
            Number.isInteger(maximum) &&
            minimum >= 1 &&
            maximum <= 5 &&
            minimum <= maximum,
        ) &&
        phase.melodicPresence.length > 0 &&
        phase.melodicPresence.every((value) =>
          ["none", "light", "present"].includes(value),
        ),
    );
  if (!valid) {
    throw new SessionPlanningError(
      "NO_SAFE_SEQUENCE",
      "The intent phase policy must be complete, valid and editorially reviewed.",
    );
  }
}
