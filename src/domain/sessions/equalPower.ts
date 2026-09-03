import type { ConsumerAudioWork } from "@/domain/audio/consumerTypes";
import type { TransitionCurve } from "./types";

export interface TransitionGains {
  outgoing: number;
  incoming: number;
}

export function transitionGains(
  progress: number,
  curve: TransitionCurve,
): TransitionGains {
  const position = Math.min(1, Math.max(0, progress));
  if (curve === "linear") {
    return { outgoing: 1 - position, incoming: position };
  }
  return {
    outgoing: Math.cos((position * Math.PI) / 2),
    incoming: Math.sin((position * Math.PI) / 2),
  };
}

function dbToLinear(db: number): number {
  return 10 ** (db / 20);
}

function linearToDb(value: number): number {
  return value <= 0 ? Number.NEGATIVE_INFINITY : 20 * Math.log10(value);
}

export function estimateOverlapPeakDbtp(
  outgoing: ConsumerAudioWork,
  incoming: ConsumerAudioWork,
  curve: TransitionCurve = "equal-power",
): number | null {
  if (
    outgoing.postGainTruePeakDbtp === null ||
    incoming.postGainTruePeakDbtp === null
  ) {
    return null;
  }
  const outgoingPeak = dbToLinear(outgoing.postGainTruePeakDbtp);
  const incomingPeak = dbToLinear(incoming.postGainTruePeakDbtp);
  // Maximum coherent-sum bound over the complete curve, rather than a
  // midpoint sample. Equal-power reaches sqrt(a^2 + b^2); a linear blend is
  // bounded by the louder endpoint. Rendered true peak remains a listening/
  // NRT verification gate.
  const maximum =
    curve === "equal-power"
      ? Math.hypot(outgoingPeak, incomingPeak)
      : Math.max(outgoingPeak, incomingPeak);
  return Number(linearToDb(maximum).toFixed(3));
}

export function buildGainCurve(
  direction: "in" | "out",
  curve: TransitionCurve,
  points = 65,
): Float32Array {
  if (!Number.isInteger(points) || points < 2) {
    throw new Error("A gain curve needs at least two points.");
  }
  const values = new Float32Array(points);
  for (let index = 0; index < points; index += 1) {
    const progress = index / (points - 1);
    const gains = transitionGains(progress, curve);
    values[index] = direction === "in" ? gains.incoming : gains.outgoing;
  }
  return values;
}
