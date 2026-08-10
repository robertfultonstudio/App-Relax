export interface BinauralFrequencies {
  leftHz: number;
  rightHz: number;
  carrierHz: number;
  beatHz: number;
}

export function getBinauralFrequencies(
  carrierHz: number,
  beatHz: number,
): BinauralFrequencies {
  if (!Number.isFinite(carrierHz) || carrierHz <= 0) {
    throw new Error("Carrier frequency must be positive.");
  }
  if (!Number.isFinite(beatHz) || beatHz <= 0 || beatHz >= carrierHz) {
    throw new Error("Beat frequency must be positive and below the carrier.");
  }

  const halfBeat = beatHz / 2;
  return {
    leftHz: carrierHz - halfBeat,
    rightHz: carrierHz + halfBeat,
    carrierHz,
    beatHz,
  };
}
