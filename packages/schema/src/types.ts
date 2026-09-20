export const NONE_ID = "__none__" as const;
export type NoneId = typeof NONE_ID;

export const BUCKETS = [
  "A_clear_route",
  "B_clear_tool",
  "C_near_miss",
  "D_inventable",
  "E_ambiguous",
  "F_high_consequence",
] as const;
export type Bucket = (typeof BUCKETS)[number];

export const EXPECTED_FIXTURE_COUNT = 180;

export const EXPECTED_BUCKET_COUNTS: Record<Bucket, number> = {
  A_clear_route: 30,
  B_clear_tool: 30,
  C_near_miss: 30,
  D_inventable: 30,
  E_ambiguous: 30,
  F_high_consequence: 30,
};

export type RosterMember = {
  id: string;
  description: string;
};

export type Roster = {
  agents: RosterMember[];
  tools: RosterMember[];
};

export type GoldKind = "agent" | "tool" | "none";

export type Fixture = {
  id: string;
  bucket: Bucket;
  utterance: string;
  context: Record<string, unknown>;
  roster: Roster;
  gold_route: string;
  gold_kind: GoldKind;
  forbidden: string[];
  tags: string[];
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

export function flatRoster(roster: Roster): RosterMember[] {
  return [...roster.agents, ...roster.tools];
}

export function legalIds(roster: Roster): string[] {
  return [...flatRoster(roster).map((entry) => entry.id), NONE_ID];
}

export function isLegalId(id: string | null, roster: Roster): boolean {
  if (id === null) return false;
  return legalIds(roster).includes(id);
}

export function isHighConsequence(id: string | null, roster: Roster): boolean {
  if (id === null || id === NONE_ID) return false;
  const entry = flatRoster(roster).find((member) => member.id === id);
  if (!entry) return false;
  const description = entry.description.toLowerCase();
  return description.includes("destructive") || description.includes("high consequence");
}
