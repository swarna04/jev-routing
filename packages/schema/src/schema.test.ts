import { describe, expect, it } from "vitest";
import { assertToyShape, bucketCounts, buildToy } from "./build-toy.ts";
import { CASES } from "./cases.ts";
import { ROSTER } from "./roster.ts";
import { EXPECTED_BUCKET_COUNTS, NONE_ID, legalIds } from "./types.ts";

describe("routing toy", () => {
  const fixtures = buildToy();

  it("has 40 fixtures with buckets A8 B8 C6 D6 E6 F6", () => {
    expect(fixtures).toHaveLength(40);
    expect(bucketCounts(fixtures)).toEqual(EXPECTED_BUCKET_COUNTS);
    expect(() => assertToyShape(fixtures)).not.toThrow();
  });

  it("embeds the shared roster on every line", () => {
    for (const fixture of fixtures) {
      expect(fixture.roster).toEqual(ROSTER);
    }
  });

  it("uses legal gold labels only", () => {
    const allowed = new Set(legalIds(ROSTER));
    for (const spec of CASES) {
      expect(allowed.has(spec.gold_next_hop)).toBe(true);
    }
  });

  it("marks A and F as automatable and B–E as unsafe-if-action", () => {
    for (const spec of CASES) {
      if (spec.bucket === "A" || spec.bucket === "F") {
        expect(spec.gold_next_hop).not.toBe(NONE_ID);
        expect(spec.unsafe_if_action).toBe(false);
      } else {
        expect(spec.gold_next_hop).toBe(NONE_ID);
        expect(spec.unsafe_if_action).toBe(true);
      }
    }
  });
});
