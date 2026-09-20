import { dirname, join } from "node:path";
import { fileURLToPath } from "node:url";
import { describe, expect, it } from "vitest";
import { NONE_ID, loadToyFromJsonl } from "@jev-routing/schema";
import { choiceCriteria, DRY_RUN_CONSTRAINT, NEXT_HOP_QUESTION } from "./jev.ts";
import { mockPrediction } from "./mock.ts";
import { parseBareHop } from "./parse.ts";

const jsonl = join(dirname(fileURLToPath(import.meta.url)), "../../../fixtures/routing-toy.jsonl");

describe("parseBareHop", () => {
  const fixture = loadToyFromJsonl(jsonl)[0]!;

  it("reads a raw id, JSON, and labeled text", () => {
    expect(parseBareHop("research", fixture)).toBe("research");
    expect(parseBareHop('{"next_hop":"slack_post"}', fixture)).toBe("slack_post");
    expect(parseBareHop("next hop: gh_list_prs", fixture)).toBe("gh_list_prs");
    expect(parseBareHop("none", fixture)).toBe(NONE_ID);
  });

  it("fails closed on empty or ambiguous text", () => {
    expect(parseBareHop("", fixture)).toBeNull();
    expect(parseBareHop("maybe slack_post or email_send", fixture)).toBeNull();
  });

  it("returns illegal tokens so the gate can fail them", () => {
    expect(parseBareHop("shell_exec", fixture)).toBe("shell_exec");
  });
});

describe("Jev Choice criteria", () => {
  const fixture = loadToyFromJsonl(jsonl).find((row) => row.id === "B01");
  if (!fixture) throw new Error("missing B01");

  it("does not tell Choice that __none__ means no tool should run", () => {
    const criteria = choiceCriteria(fixture);
    expect(criteria[NONE_ID]).not.toMatch(/no tool should run/i);
    expect(NEXT_HOP_QUESTION).not.toMatch(/if no agent or tool should run/i);
    expect(criteria[NONE_ID]).toMatch(/invented or out-of-roster/i);
    expect(criteria.slack_post).toMatch(/legal next hop/i);
    expect(DRY_RUN_CONSTRAINT).toMatch(/does not call those APIs/i);
    expect(DRY_RUN_CONSTRAINT).not.toMatch(/Never call GitHub, Slack/i);
  });
});

describe("mock router scripts", () => {
  const fixtures = loadToyFromJsonl(jsonl);

  it("gold is exact on all 180", () => {
    for (const fixture of fixtures) {
      expect(mockPrediction(fixture, "gold").next_hop).toBe(fixture.gold_route);
    }
  });

  it("demo emits parse fail, illegal id, false auto, and unsafe delete", () => {
    const byId = Object.fromEntries(
      fixtures.map((fixture) => [fixture.id, mockPrediction(fixture, "demo")]),
    );
    expect(byId.A08?.parse_fail).toBe(true);
    expect(byId.E01?.illegal_id).toBe(true);
    expect(byId.B01?.next_hop).toBe("slack_post");
    expect(byId.D01?.next_hop).toBe("file_delete");
    expect(byId.A01?.next_hop).toBe(NONE_ID);
  });
});
