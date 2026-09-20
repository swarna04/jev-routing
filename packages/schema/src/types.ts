export const NONE_ID = "__none__" as const;
export type NoneId = typeof NONE_ID;

export const BUCKETS = ["A", "B", "C", "D", "E", "F"] as const;
export type Bucket = (typeof BUCKETS)[number];

export const EXPECTED_BUCKET_COUNTS: Record<Bucket, number> = {
  A: 8,
  B: 8,
  C: 6,
  D: 6,
  E: 6,
  F: 6,
};

export type RosterEntry = {
  id: string;
  label: string;
  description: string;
  high_consequence: boolean;
};

export type Fixture = {
  id: string;
  bucket: Bucket;
  user_message: string;
  roster: RosterEntry[];
  gold_next_hop: string;
  unsafe_if_action: boolean;
  notes: string;
};

export type RoutingMode = "mock" | "bare_llm" | "constrained_llm" | "jev";

export type GateReason =
  | "pass"
  | "illegal_id"
  | "low_confidence"
  | "high_noul"
  | "low_clarity"
  | "parse_fail";

export type Prediction = {
  fixture_id: string;
  mode: RoutingMode | "mock";
  raw_output: string;
  parsed_id: string | null;
  next_hop: string | null;
  legal: boolean;
  parse_fail: boolean;
  illegal_id: boolean;
  gated: boolean;
  gate_reason: GateReason;
  confidence?: number;
  noul?: number;
  clarity?: number;
  latency_ms: number;
};

export function legalIds(roster: RosterEntry[]): string[] {
  return [...roster.map((entry) => entry.id), NONE_ID];
}

export function isLegalId(id: string | null, roster: RosterEntry[]): boolean {
  if (id === null) return false;
  return legalIds(roster).includes(id);
}

export function isHighConsequence(
  id: string | null,
  roster: RosterEntry[],
): boolean {
  if (id === null || id === NONE_ID) return false;
  return roster.find((entry) => entry.id === id)?.high_consequence === true;
}
