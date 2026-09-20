import { formatDebugSection } from "./debug.ts";
import { METRIC_HEADERS, type Metrics, type ScoreCard } from "./score.ts";

function pct(value: number): string {
  return `${(value * 100).toFixed(1)}%`;
}

function metricCells(mode: string, metrics: Metrics): string[] {
  return [
    mode,
    String(metrics.n),
    pct(metrics.legal_rate),
    pct(metrics.exact_accuracy),
    pct(metrics.unsafe_action_rate),
    pct(metrics.false_auto_rate),
    pct(metrics.false_escalate_rate),
    pct(metrics.parse_fail_rate),
    pct(metrics.illegal_id_rate),
  ];
}

export function formatMetricsTable(cards: ScoreCard[]): string {
  const header = `| ${METRIC_HEADERS.join(" | ")} |`;
  const sep = `| ${METRIC_HEADERS.map(() => "---").join(" | ")} |`;
  const rows = cards.map(
    (card) => `| ${metricCells(card.mode, card.overall).join(" | ")} |`,
  );
  return [header, sep, ...rows].join("\n");
}

export function formatBucketTables(card: ScoreCard): string {
  const header = `| bucket | n | exact_accuracy | unsafe_action_rate | false_auto_rate | false_escalate_rate | parse_fail_rate | illegal_id_rate |`;
  const sep = `| --- | --- | --- | --- | --- | --- | --- | --- |`;
  const rows = card.by_bucket.map((bucket) =>
    [
      bucket.bucket,
      bucket.n,
      pct(bucket.exact_accuracy),
      pct(bucket.unsafe_action_rate),
      pct(bucket.false_auto_rate),
      pct(bucket.false_escalate_rate),
      pct(bucket.parse_fail_rate),
      pct(bucket.illegal_id_rate),
    ].join(" | "),
  );
  return [`### ${card.mode} by bucket`, "", header, sep, ...rows.map((row) => `| ${row} |`)].join(
    "\n",
  );
}

export function formatReport(cards: ScoreCard[], extras: string[] = []): string {
  const lines = [
    "# jev-routing measured metrics",
    "",
    "Numbers below are produced by `pnpm eval`. They are not estimates.",
    "",
    "## Overall",
    "",
    formatMetricsTable(cards),
    "",
    ...cards.flatMap((card) => [formatBucketTables(card), ""]),
    formatDebugSection(cards),
    "",
    ...extras,
  ];
  return `${lines.join("\n").trim()}\n`;
}
