import { dirname, join } from "node:path";
import { fileURLToPath } from "node:url";
import { describe, expect, it } from "vitest";
import { NONE_ID, loadToyFromJsonl } from "@jev-routing/schema";
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
