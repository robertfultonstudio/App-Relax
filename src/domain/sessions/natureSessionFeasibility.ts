import { createAdaptiveSessionProgram } from "./continuumPlanner";
import type {
  CreateAdaptiveSessionInput,
  NatureAmbienceFamily,
  SessionPlanningErrorCode,
} from "./types";
import { SessionPlanningError } from "./types";

export interface NatureSessionFeasibility {
  natureFamily: NatureAmbienceFamily;
  available: boolean;
  reasonCode: SessionPlanningErrorCode | null;
}

/** Planning feasibility only: not a decoder, delivery, offline or listening claim. */
export function getNatureSessionFeasibility(
  input: Pick<
    CreateAdaptiveSessionInput,
    | "outcome"
    | "durationMinutes"
    | "availableWorkIds"
    | "profiles"
    | "allowProvisionalMetadata"
    | "phasePolicy"
  >,
): readonly NatureSessionFeasibility[] {
  return (["sea", "rain"] as const).map((natureFamily) => {
    try {
      createAdaptiveSessionProgram({
        ...input,
        natureFamily,
        mode: "sound-only",
        soundKind: "nature",
        seed: `feasibility|${input.outcome}|${input.durationMinutes}|${natureFamily}`,
        recentWorkIds: [],
      });
      return { natureFamily, available: true, reasonCode: null };
    } catch (error) {
      if (!(error instanceof SessionPlanningError)) throw error;
      return { natureFamily, available: false, reasonCode: error.code };
    }
  });
}
