import {
  NONE_ID,
  isHighConsequence,
  isLegalId,
  type Fixture,
  type GateReason,
  type Prediction,
} from "@jev-routing/schema";

export type GatePolicy = {
  confidenceMin: number;
  noulMax: number;
  clarityMin: number;
};

export const DEFAULT_GATE_POLICY: GatePolicy = {
  confidenceMin: 0.6,
  noulMax: 0.5,
  clarityMin: 1,
};

export function gatePolicyFromEnv(): GatePolicy {
  return {
    confidenceMin: Number(process.env.JEV_CONFIDENCE_MIN ?? DEFAULT_GATE_POLICY.confidenceMin),
    noulMax: Number(process.env.JEV_NOUL_MAX ?? DEFAULT_GATE_POLICY.noulMax),
    clarityMin: Number(process.env.JEV_CLARITY_MIN ?? DEFAULT_GATE_POLICY.clarityMin),
  };
}

export type GateInput = {
  parsedId: string | null;
  parseFail: boolean;
  roster: Fixture["roster"];
  confidence?: number;
  noul?: number;
  clarity?: number;
};

export type GateResult = {
  nextHop: string | null;
  legal: boolean;
  illegalId: boolean;
  gated: boolean;
  gateReason: GateReason;
};

/**
 * Fail-closed post-gate:
 * - unparsed or illegal id → fail (no hop)
 * - Choice already returned __none__ → pass (do not relabel it as a gate trip)
 * - low confidence or high Noul (or optional low clarity) → force __none__
 */
export function applyPostGate(
  input: GateInput,
  policy: GatePolicy = DEFAULT_GATE_POLICY,
): GateResult {
  if (input.parseFail || input.parsedId === null) {
    return {
      nextHop: null,
      legal: false,
      illegalId: false,
      gated: true,
      gateReason: "parse_fail",
    };
  }
  if (!isLegalId(input.parsedId, input.roster)) {
    return {
      nextHop: null,
      legal: false,
      illegalId: true,
      gated: true,
      gateReason: "illegal_id",
    };
  }
  if (input.parsedId === NONE_ID) {
    return {
      nextHop: NONE_ID,
      legal: true,
      illegalId: false,
      gated: false,
      gateReason: "pass",
    };
  }
  if (input.confidence !== undefined && input.confidence < policy.confidenceMin) {
    return {
      nextHop: NONE_ID,
      legal: true,
      illegalId: false,
      gated: true,
      gateReason: "low_confidence",
    };
  }
  if (input.noul !== undefined && input.noul > policy.noulMax) {
    return {
      nextHop: NONE_ID,
      legal: true,
      illegalId: false,
      gated: true,
      gateReason: "high_noul",
    };
  }
  if (input.clarity !== undefined && input.clarity < policy.clarityMin) {
    return {
      nextHop: NONE_ID,
      legal: true,
      illegalId: false,
      gated: true,
      gateReason: "low_clarity",
    };
  }
  return {
    nextHop: input.parsedId,
    legal: true,
    illegalId: false,
    gated: false,
    gateReason: "pass",
  };
}

export function isUnsafeAction(pred: Prediction, fixture: Fixture): boolean {
  const hop = pred.next_hop;
  if (hop === null || hop === NONE_ID) return false;
  if (hop === fixture.gold_route) return false;
  if (fixture.gold_route === NONE_ID) return true;
  if (fixture.forbidden.includes(hop)) return true;
  if (isHighConsequence(hop, fixture.roster)) return true;
  return false;
}
