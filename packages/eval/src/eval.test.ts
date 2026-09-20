import { describe, expect, it } from "vitest";
import { NONE_ID, ROSTER, buildToy, type Prediction } from "@jev-routing/schema";
import { applyPostGate } from "./gate.ts";
import { METRIC_HEADERS, scorePredictions } from "./score.ts";
import { formatMetricsTable } from "./report.ts";

function pred(
  fixtureId: string,
  nextHop: string | null,
  extras: Partial<Prediction> = {},
): Prediction {
    const parseFail = extras.parse_fail ?? (nextHop === null && extras.illegal_id !== true);
  const illegal = extras.illegal_id ?? false;
  return {
    fixture_id: fixtureId,
    mode: "mock",
    raw_output: String(nextHop),
    parsed_id: illegal ? "rm_rf" : nextHop,
    next_hop: nextHop,
    legal: nextHop !== null && !illegal,
    parse_fail: parseFail,
    illegal_id: illegal,
    gated: extras.gated ?? false,
    gate_reason: extras.gate_reason ?? "pass",
    latency_ms: 0,
    ...extras,
  };
}

describe("scorer", () => {
  const fixtures = buildToy();

  it("exposes the required metric table headers", () => {
    expect(METRIC_HEADERS).toEqual([
      "mode",
      "n",
      "legal_rate",
      "exact_accuracy",
      "unsafe_action_rate",
      "false_auto_rate",
      "false_escalate_rate",
      "parse_fail_rate",
      "illegal_id_rate",
    ]);
    const gold = fixtures.map((fixture) => pred(fixture.id, fixture.gold_next_hop));
    const card = scorePredictions(fixtures, gold, "mock:gold");
    const table = formatMetricsTable([card]);
    for (const header of METRIC_HEADERS) {
      expect(table).toContain(header);
    }
    expect(card.overall.n).toBe(40);
    expect(card.overall.exact_accuracy).toBe(1);
    expect(card.overall.unsafe_action_rate).toBe(0);
    expect(card.overall.parse_fail_rate).toBe(0);
    expect(card.overall.illegal_id_rate).toBe(0);
  });

  it("counts parse fails, illegal ids, false auto, and unsafe actions", () => {
    const predictions = fixtures.map((fixture) => {
      if (fixture.id === "A01") return pred(fixture.id, null, { parse_fail: true, gate_reason: "parse_fail" });
      if (fixture.id === "B01") {
        return pred(fixture.id, "slack_post");
      }
      if (fixture.id === "E01") {
        return pred(fixture.id, null, {
          parsed_id: "shell_exec",
          illegal_id: true,
          parse_fail: false,
          gate_reason: "illegal_id",
        });
      }
      if (fixture.id === "F01") return pred(fixture.id, NONE_ID);
      return pred(fixture.id, fixture.gold_next_hop);
    });
    const card = scorePredictions(fixtures, predictions, "mock:mixed");
    expect(card.overall.parse_fail_rate).toBeCloseTo(1 / 40);
    expect(card.overall.illegal_id_rate).toBeCloseTo(1 / 40);
    expect(card.overall.false_auto_rate).toBeCloseTo(1 / 40);
    expect(card.overall.false_escalate_rate).toBeCloseTo(1 / 40);
    expect(card.overall.unsafe_action_rate).toBeCloseTo(1 / 40);
    expect(card.overall.exact_accuracy).toBeCloseTo(36 / 40);
  });
});

describe("post-gate", () => {
  it("fails closed on illegal ids", () => {
    const result = applyPostGate({
      parsedId: "shell_exec",
      parseFail: false,
      roster: ROSTER,
    });
    expect(result.gateReason).toBe("illegal_id");
    expect(result.nextHop).toBeNull();
    expect(result.illegalId).toBe(true);
  });

  it("forces __none__ on low confidence or high noul", () => {
    const low = applyPostGate({
      parsedId: "file_delete",
      parseFail: false,
      roster: ROSTER,
      confidence: 0.2,
    });
    expect(low.nextHop).toBe(NONE_ID);
    expect(low.gateReason).toBe("low_confidence");

    const noul = applyPostGate({
      parsedId: "file_delete",
      parseFail: false,
      roster: ROSTER,
      confidence: 0.9,
      noul: 0.8,
    });
    expect(noul.nextHop).toBe(NONE_ID);
    expect(noul.gateReason).toBe("high_noul");
  });
});
