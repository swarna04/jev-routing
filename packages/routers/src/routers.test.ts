import { describe, expect, it } from "vitest";
import { NONE_ID, buildToy } from "@jev-routing/schema";
import { mockPrediction } from "./mock.ts";
import { parseBareHop } from "./parse.ts";

describe("parseBareHop", () => {
  const fixture = buildToy()[0]!;

  it("reads a raw id, JSON, and labeled text", () => {
    expect(parseBareHop("gh_create_issue", fixture)).toBe("gh_create_issue");
    expect(parseBareHop('{"next_hop":"slack_post"}', fixture)).toBe("slack_post");
    expect(parseBareHop("next hop: file_read", fixture)).toBe("file_read");
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
  const fixtures = buildToy();

  it("gold is exact on all 40", () => {
    for (const fixture of fixtures) {
      expect(mockPrediction(fixture, "gold").next_hop).toBe(fixture.gold_next_hop);
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
    expect(byId.F01?.next_hop).toBe(NONE_ID);
  });
});
