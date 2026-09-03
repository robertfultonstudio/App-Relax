import {
  buildGainCurve,
  estimateOverlapPeakDbtp,
  transitionGains,
} from "@/domain/sessions/equalPower";
import { sampleTransitionEnergy } from "@/domain/sessions/workbench";
import { SESSION_WORK_PROFILES } from "@/content/sessionWorkProfiles";

describe("transition curves", () => {
  it("has exact equal-power endpoints", () => {
    expect(transitionGains(0, "equal-power")).toEqual({
      outgoing: 1,
      incoming: 0,
    });
    expect(transitionGains(1, "equal-power").outgoing).toBeCloseTo(0, 10);
    expect(transitionGains(1, "equal-power").incoming).toBeCloseTo(1, 10);
  });

  it("maintains unit energy throughout an equal-power handoff", () => {
    const energy = sampleTransitionEnergy("equal-power", 1001);
    expect(energy.minimum).toBeCloseTo(1, 10);
    expect(energy.maximum).toBeCloseTo(1, 10);
    expect(buildGainCurve("in", "equal-power")).toHaveLength(65);
  });

  it("bounds asymmetric source peaks across the complete curve", () => {
    const work = SESSION_WORK_PROFILES[0].work;
    const loud = { ...work, postGainTruePeakDbtp: -1 };
    const quiet = { ...work, postGainTruePeakDbtp: -20 };
    expect(estimateOverlapPeakDbtp(loud, quiet, "equal-power")).toBeCloseTo(
      -0.946,
      3,
    );
    expect(estimateOverlapPeakDbtp(loud, quiet, "linear")).toBe(-1);
  });
});
