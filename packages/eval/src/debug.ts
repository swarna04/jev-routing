import {
  BUCKETS,
  NONE_ID,
  type Bucket,
  type Fixture,
  type GateReason,
} from "@jev-routing/schema";
import type { ScoreCard, ScoredRow } from "./score.ts";

export const OUTCOME_CLASSES = [
  "exact",
  "choice_none",
  "gate_forced_none",
  "wrong_hop",
  "parse_fail",
  "illegal_id",
  "other",
] as const;
export type OutcomeClass = (typeof OUTCOME_CLASSES)[number];

export type TraceRow = {
  mode: string;
  fixture_id: string;
  bucket: Bucket;
  utterance: string;
  gold_route: string;
  gold_kind: string;
  parsed_id: string | null;
  next_hop: string | null;
  gated: boolean;
  gate_reason: GateReason;
  confidence?: number;
  noul?: number;
  clarity?: number;
  exact: boolean;
  false_escalate: boolean;
  false_auto: boolean;
  unsafe_action: boolean;
  pre_gate_exact: boolean;
  outcome: OutcomeClass;
};

export type DebugSummary = {
  n: number;
  pre_gate_exact_accuracy: number;
  outcomes: Record<OutcomeClass, number>;
  false_escalate_split: {
    choice_none: number;
    gate_forced_none: number;
    other: number;
  };
  gate_reason: Record<string, number>;
};

export function preGateExact(row: ScoredRow): boolean {
  return row.prediction.parsed_id === row.fixture.gold_route && !row.prediction.parse_fail;
}

/**
 * Split a miss into Choice-selected `__none__` vs post-gate override vs other.
 * `parsed_id` is the model hop before `applyPostGate`; `next_hop` is after.
 */
export function classifyOutcome(row: ScoredRow): OutcomeClass {
  const pred = row.prediction;
  if (pred.parse_fail) return "parse_fail";
  if (pred.illegal_id) return "illegal_id";
  if (row.exact) return "exact";
  const parsed = pred.parsed_id;
  const hop = pred.next_hop;
  if (parsed !== null && parsed !== NONE_ID && hop === NONE_ID && pred.gated) {
    return "gate_forced_none";
  }
  if (parsed === NONE_ID && hop === NONE_ID) return "choice_none";
  if (hop !== null && hop !== row.fixture.gold_route) return "wrong_hop";
  return "other";
}

export function tracesFromCard(card: ScoreCard): TraceRow[] {
  return card.rows.map((row) => ({
    mode: card.mode,
    fixture_id: row.fixture.id,
    bucket: row.fixture.bucket,
    utterance: row.fixture.utterance,
    gold_route: row.fixture.gold_route,
    gold_kind: row.fixture.gold_kind,
    parsed_id: row.prediction.parsed_id,
    next_hop: row.prediction.next_hop,
    gated: row.prediction.gated,
    gate_reason: row.prediction.gate_reason,
    confidence: row.prediction.confidence,
    noul: row.prediction.noul,
    clarity: row.prediction.clarity,
    exact: row.exact,
    false_escalate: row.false_escalate,
    false_auto: row.false_auto,
    unsafe_action: row.unsafe_action,
    pre_gate_exact: preGateExact(row),
    outcome: classifyOutcome(row),
  }));
}

export function debugSummary(card: ScoreCard): DebugSummary {
  const traces = tracesFromCard(card);
  const outcomes = emptyCounts(OUTCOME_CLASSES);
  const gate_reason: Record<string, number> = {};
  let preGate = 0;
  let choiceNone = 0;
  let gateForced = 0;
  let escalateOther = 0;
  for (const trace of traces) {
    outcomes[trace.outcome] += 1;
    gate_reason[trace.gate_reason] = (gate_reason[trace.gate_reason] ?? 0) + 1;
    if (trace.pre_gate_exact) preGate += 1;
    if (trace.false_escalate) {
      if (trace.outcome === "choice_none") choiceNone += 1;
      else if (trace.outcome === "gate_forced_none") gateForced += 1;
      else escalateOther += 1;
    }
  }
  const n = traces.length;
  return {
    n,
    pre_gate_exact_accuracy: n === 0 ? 0 : preGate / n,
    outcomes,
    false_escalate_split: {
      choice_none: choiceNone,
      gate_forced_none: gateForced,
      other: escalateOther,
    },
    gate_reason,
  };
}

export function filterFixtures(
  fixtures: Fixture[],
  opts: { buckets?: Bucket[]; ids?: string[] },
): Fixture[] {
  let next = fixtures;
  if (opts.buckets && opts.buckets.length > 0) {
    const allowed = new Set(opts.buckets);
    next = next.filter((fixture) => allowed.has(fixture.bucket));
  }
  if (opts.ids && opts.ids.length > 0) {
    const allowed = new Set(opts.ids);
    const missing = opts.ids.filter((id) => !fixtures.some((fixture) => fixture.id === id));
    if (missing.length > 0) {
      throw new Error(`unknown fixture id(s): ${missing.join(", ")}`);
    }
    next = next.filter((fixture) => allowed.has(fixture.id));
  }
  if (next.length === 0) {
    throw new Error("fixture filter matched 0 rows");
  }
  return next;
}

export function parseBucketList(raw: string): Bucket[] {
  const tokens = splitCsv(raw);
  const unknown = tokens.filter((token) => !BUCKETS.includes(token as Bucket));
  if (unknown.length > 0) {
    throw new Error(`unknown bucket(s): ${unknown.join(", ")}. Legal: ${BUCKETS.join(", ")}`);
  }
  return tokens as Bucket[];
}

export function splitCsv(raw: string): string[] {
  return raw
    .split(",")
    .map((token) => token.trim())
    .filter((token) => token.length > 0);
}

export function formatDebugSection(cards: ScoreCard[]): string {
  const blocks = cards.flatMap((card) => formatCardDebug(card));
  return [
    "## Debug — Choice vs post-gate",
    "",
    "`parsed_id` is the hop before the fail-closed post-gate; `next_hop` is after.",
    "Ungated exact uses `parsed_id`. Gated exact is `exact_accuracy` in the tables above.",
    "If B_clear_tool is all `__none__`, this split says whether Choice refused or the gate overrode a tool id.",
    "",
    ...blocks,
  ].join("\n");
}

function formatCardDebug(card: ScoreCard): string[] {
  const summary = debugSummary(card);
  const traces = tracesFromCard(card);
  const misses = traces.filter(
    (trace) => !trace.exact || trace.false_escalate || trace.false_auto || trace.unsafe_action,
  );
  const lines = [
    `### ${card.mode} outcomes`,
    "",
    `| class | n |`,
    `| --- | ---: |`,
    ...OUTCOME_CLASSES.map((name) => `| ${name} | ${summary.outcomes[name]} |`),
    "",
    `Ungated exact: ${pct(summary.pre_gate_exact_accuracy)} (${countTrue(traces, (t) => t.pre_gate_exact)}/${summary.n}).`,
    "",
    "False-escalate split (gold is a roster hop, `next_hop` is `__none__`):",
    "",
    `| source | n |`,
    `| --- | ---: |`,
    `| Choice selected __none__ | ${summary.false_escalate_split.choice_none} |`,
    `| Post-gate forced __none__ | ${summary.false_escalate_split.gate_forced_none} |`,
    `| other | ${summary.false_escalate_split.other} |`,
    "",
    "gate_reason counts:",
    "",
    `| gate_reason | n |`,
    `| --- | ---: |`,
    ...Object.entries(summary.gate_reason)
      .sort(([a], [b]) => a.localeCompare(b))
      .map(([reason, n]) => `| ${reason} | ${n} |`),
    "",
  ];

  for (const bucket of BUCKETS) {
    const bucketTraces = traces.filter((trace) => trace.bucket === bucket);
    if (bucketTraces.length === 0) continue;
    const escalate = bucketTraces.filter((trace) => trace.false_escalate);
    if (escalate.length === 0 && bucket !== "B_clear_tool") continue;
    const bucketPre = countTrue(bucketTraces, (t) => t.pre_gate_exact);
    const choiceNone = escalate.filter((trace) => trace.outcome === "choice_none").length;
    const gateForced = escalate.filter((trace) => trace.outcome === "gate_forced_none").length;
    lines.push(
      `#### ${card.mode} / ${bucket}`,
      "",
      `n=${bucketTraces.length}; ungated exact ${bucketPre}/${bucketTraces.length}; false escalate ${escalate.length} (Choice ${choiceNone}, gate ${gateForced}).`,
      "",
    );
  }

  if (misses.length > 0) {
    lines.push(
      `#### ${card.mode} miss traces`,
      "",
      "| id | bucket | gold | parsed_id | next_hop | conf | noul | clarity | gate_reason | outcome |",
      "| --- | --- | --- | --- | --- | ---: | ---: | ---: | --- | --- |",
      ...misses.map((trace) =>
        [
          trace.fixture_id,
          trace.bucket,
          trace.gold_route,
          fmt(trace.parsed_id),
          fmt(trace.next_hop),
          num(trace.confidence),
          num(trace.noul),
          num(trace.clarity),
          trace.gate_reason,
          trace.outcome,
        ].join(" | "),
      ).map((row) => `| ${row} |`),
      "",
    );
  }
  return lines;
}

function emptyCounts<K extends string>(keys: readonly K[]): Record<K, number> {
  return Object.fromEntries(keys.map((key) => [key, 0])) as Record<K, number>;
}

function countTrue<T>(items: T[], pred: (item: T) => boolean): number {
  return items.reduce((sum, item) => sum + (pred(item) ? 1 : 0), 0);
}

function pct(value: number): string {
  return `${(value * 100).toFixed(1)}%`;
}

function fmt(value: string | null): string {
  return value === null ? "null" : value;
}

function num(value: number | undefined): string {
  return value === undefined ? "" : value.toFixed(2);
}
