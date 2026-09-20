import { describe, expect, it } from "vitest";
import { NONE_ID, type Prediction } from "@jev-routing/schema";
import {
  classifyOutcome,
  debugSummary,
  filterFixtures,
  formatDebugSection,
  parseBucketList,
} from "./debug.ts";
import { loadDefaultFixtures } from "./load.ts";
import { scorePredictions } from "./score.ts";

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

describe("debug classification", () => {
  const fixtures = loadDefaultFixtures();
  const b01 = fixtures.find((fixture) => fixture.id === "B01");
  if (!b01) throw new Error("missing B01");

  it("splits Choice-selected __none__ from post-gate override", () => {
    const choiceNone = scorePredictions(
      [b01],
      [pred("B01", NONE_ID, { parsed_id: NONE_ID })],
      "jev",
    );
    expect(classifyOutcome(choiceNone.rows[0]!)).toBe("choice_none");
    expect(choiceNone.rows[0]!.false_escalate).toBe(true);

    const gated = scorePredictions(
      [b01],
      [
        pred("B01", NONE_ID, {
          parsed_id: b01.gold_route,
          gated: true,
          gate_reason: "high_noul",
          noul: 0.82,
          confidence: 0.91,
          clarity: 2,
        }),
      ],
      "jev",
    );
    expect(classifyOutcome(gated.rows[0]!)).toBe("gate_forced_none");
    const summary = debugSummary(gated);
    expect(summary.pre_gate_exact_accuracy).toBe(1);
    expect(summary.false_escalate_split.gate_forced_none).toBe(1);
    expect(summary.false_escalate_split.choice_none).toBe(0);
  });

  it("keeps exact rows out of the false-escalate split", () => {
    const gold = scorePredictions([b01], [pred("B01", b01.gold_route)], "jev");
    expect(classifyOutcome(gold.rows[0]!)).toBe("exact");
    expect(debugSummary(gold).false_escalate_split).toEqual({
      choice_none: 0,
      gate_forced_none: 0,
      other: 0,
    });
  });

  it("renders Choice vs post-gate tables", () => {
    const card = scorePredictions(
      [b01],
      [pred("B01", NONE_ID, { parsed_id: NONE_ID })],
      "jev",
    );
    const section = formatDebugSection([card]);
    expect(section).toContain("Choice vs post-gate");
    expect(section).toContain("Choice selected __none__");
    expect(section).toContain("B01");
  });
});

describe("fixture filters", () => {
  const fixtures = loadDefaultFixtures();

  it("parses bucket names and filters B_clear_tool to 30 rows", () => {
    expect(parseBucketList("B_clear_tool")).toEqual(["B_clear_tool"]);
    const filtered = filterFixtures(fixtures, { buckets: ["B_clear_tool"] });
    expect(filtered).toHaveLength(30);
    expect(filtered.every((fixture) => fixture.bucket === "B_clear_tool")).toBe(true);
  });

  it("rejects unknown buckets and ids", () => {
    expect(() => parseBucketList("Z_nope")).toThrow(/unknown bucket/);
    expect(() => filterFixtures(fixtures, { ids: ["ZZ99"] })).toThrow(/unknown fixture id/);
  });
});
