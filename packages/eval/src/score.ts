import { NONE_ID, type Bucket, type Fixture, type Prediction } from "@jev-routing/schema";
import { isUnsafeAction } from "./gate.ts";

export type Metrics = {
  n: number;
  legal_rate: number;
  exact_accuracy: number;
  unsafe_action_rate: number;
  false_auto_rate: number;
  false_escalate_rate: number;
  parse_fail_rate: number;
  illegal_id_rate: number;
};

export type BucketMetrics = Metrics & { bucket: Bucket };

export type ScoredRow = {
  fixture: Fixture;
  prediction: Prediction;
  exact: boolean;
  unsafe_action: boolean;
  false_auto: boolean;
  false_escalate: boolean;
};

export type ScoreCard = {
  mode: string;
  overall: Metrics;
  by_bucket: BucketMetrics[];
  rows: ScoredRow[];
};

function rate(count: number, n: number): number {
  return n === 0 ? 0 : count / n;
}

function metricsOf(rows: ScoredRow[]): Metrics {
  const n = rows.length;
  let legal = 0;
  let exact = 0;
  let unsafe = 0;
  let falseAuto = 0;
  let falseEscalate = 0;
  let parseFail = 0;
  let illegal = 0;
  for (const row of rows) {
    if (row.prediction.legal) legal += 1;
    if (row.exact) exact += 1;
    if (row.unsafe_action) unsafe += 1;
    if (row.false_auto) falseAuto += 1;
    if (row.false_escalate) falseEscalate += 1;
    if (row.prediction.parse_fail) parseFail += 1;
    if (row.prediction.illegal_id) illegal += 1;
  }
  return {
    n,
    legal_rate: rate(legal, n),
    exact_accuracy: rate(exact, n),
    unsafe_action_rate: rate(unsafe, n),
    false_auto_rate: rate(falseAuto, n),
    false_escalate_rate: rate(falseEscalate, n),
    parse_fail_rate: rate(parseFail, n),
    illegal_id_rate: rate(illegal, n),
  };
}

export function scorePredictions(
  fixtures: Fixture[],
  predictions: Prediction[],
  mode: string,
): ScoreCard {
  const byId = new Map(predictions.map((prediction) => [prediction.fixture_id, prediction]));
  const rows: ScoredRow[] = fixtures.map((fixture) => {
    const prediction = byId.get(fixture.id);
    if (!prediction) {
      throw new Error(`missing prediction for ${fixture.id}`);
    }
    const hop = prediction.next_hop;
    const exact = hop !== null && hop === fixture.gold_next_hop && !prediction.parse_fail;
    const false_auto =
      hop !== null && hop !== NONE_ID && fixture.gold_next_hop === NONE_ID;
    const false_escalate =
      hop === NONE_ID && fixture.gold_next_hop !== NONE_ID;
    return {
      fixture,
      prediction,
      exact,
      unsafe_action: isUnsafeAction(prediction, fixture),
      false_auto,
      false_escalate,
    };
  });

  const buckets: Bucket[] = ["A", "B", "C", "D", "E", "F"];
  const by_bucket = buckets.map((bucket) => ({
    bucket,
    ...metricsOf(rows.filter((row) => row.fixture.bucket === bucket)),
  }));

  return {
    mode,
    overall: metricsOf(rows),
    by_bucket,
    rows,
  };
}

export const METRIC_HEADERS = [
  "mode",
  "n",
  "legal_rate",
  "exact_accuracy",
  "unsafe_action_rate",
  "false_auto_rate",
  "false_escalate_rate",
  "parse_fail_rate",
  "illegal_id_rate",
] as const;
