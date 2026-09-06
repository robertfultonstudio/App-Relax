import type { ConsumerOutcomeId } from "@/content/productShell";
import type { SavedSessionRequest } from "@/state/adaptiveSessionPersistence";
import type { SingleTrackProgram } from "./consumerTypes";
import type {
  AdaptiveSessionProgram,
  SessionDurationMinutes,
} from "../sessions/types";

export type ConsumerSelection =
  | {
      kind: "single";
      program: SingleTrackProgram;
      outcome: ConsumerOutcomeId;
      durationMinutes: SessionDurationMinutes;
    }
  | {
      kind: "adaptive";
      program: AdaptiveSessionProgram;
      request: SavedSessionRequest;
    };

export function consumerSelectionKey(selection: ConsumerSelection): string {
  return selection.kind === "single"
    ? `single:${selection.program.work.id}:${selection.outcome}:${selection.durationMinutes}`
    : `adaptive:${selection.program.plan.id}`;
}

export function consumerSelectionUrl(selection: ConsumerSelection): string {
  return selection.kind === "single"
    ? `/listen/${selection.program.work.id}?outcome=${selection.outcome}&duration=${selection.durationMinutes}`
    : `/adaptive-session/${selection.request.outcome}?duration=${selection.request.durationMinutes}&sound=${selection.request.soundKind}&nature=${selection.request.natureFamily}&active=1`;
}
