import type { ConsumerOutcomeId } from "./productShell";
import type { SessionDurationMinutes } from "@/domain/sessions/types";

export interface SessionPolicy {
  outcome: ConsumerOutcomeId;
  durations: readonly SessionDurationMinutes[];
  defaultDuration: SessionDurationMinutes;
  startLabel: string;
  preparationLabel: string;
}

export const SESSION_POLICIES: Readonly<
  Record<ConsumerOutcomeId, SessionPolicy>
> = {
  meditation: {
    outcome: "meditation",
    durations: [10, 20, 30, 45, 60, 90],
    defaultDuration: 20,
    startLabel: "Begin meditation",
    preparationLabel: "Choose how long you have, then begin.",
  },
  yoga: {
    outcome: "yoga",
    durations: [20, 30, 45, 60, 90],
    defaultDuration: 30,
    startLabel: "Start your yoga session",
    preparationLabel: "Choose your class length, then start.",
  },
  massage: {
    outcome: "massage",
    durations: [30, 45, 60, 90],
    defaultDuration: 60,
    startLabel: "Start your massage session",
    preparationLabel: "Choose the room time, then start.",
  },
  relax: {
    outcome: "relax",
    durations: [10, 20, 30, 45, 60, 90],
    defaultDuration: 20,
    startLabel: "Relax now",
    preparationLabel: "Choose a moment, then leave the phone behind.",
  },
  sleep: {
    outcome: "sleep",
    durations: [30, 45, 60, 90],
    defaultDuration: 60,
    startLabel: "Prepare for sleep",
    preparationLabel: "Choose your wind-down time, then begin.",
  },
  focus: {
    outcome: "focus",
    durations: [20, 30, 45, 60, 90],
    defaultDuration: 30,
    startLabel: "Start focusing",
    preparationLabel: "Choose a work block, then start.",
  },
} as const;

export function getSessionPolicy(outcome: ConsumerOutcomeId): SessionPolicy {
  return SESSION_POLICIES[outcome];
}
