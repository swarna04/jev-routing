import { dirname, join } from "node:path";
import { fileURLToPath } from "node:url";
import { describe, expect, it } from "vitest";
import { assertToyShape, bucketCounts, loadToyFromJsonl } from "./build-toy.ts";
import { ROSTER } from "./roster.ts";
import {
  EXPECTED_BUCKET_COUNTS,
  EXPECTED_FIXTURE_COUNT,
  NONE_ID,
  legalIds,
} from "./types.ts";

const jsonl = join(dirname(fileURLToPath(import.meta.url)), "../../../fixtures/routing-toy.jsonl");

describe("routing toy", () => {
  const fixtures = loadToyFromJsonl(jsonl);

  it("has 180 fixtures with 30 per bucket A–F", () => {
    expect(fixtures).toHaveLength(EXPECTED_FIXTURE_COUNT);
    expect(bucketCounts(fixtures)).toEqual(EXPECTED_BUCKET_COUNTS);
    expect(() => assertToyShape(fixtures)).not.toThrow();
  });

  it("embeds the shared nested roster on every line", () => {
    for (const fixture of fixtures) {
      expect(fixture.roster).toEqual(ROSTER);
    }
  });

  it("uses legal gold_route labels only", () => {
    const allowed = new Set(legalIds(ROSTER));
    for (const fixture of fixtures) {
      expect(allowed.has(fixture.gold_route)).toBe(true);
    }
  });

  it("uses __none__ gold on D/E/F and a concrete hop on A/B/C", () => {
    for (const fixture of fixtures) {
      if (
        fixture.bucket === "D_inventable" ||
        fixture.bucket === "E_ambiguous" ||
        fixture.bucket === "F_high_consequence"
      ) {
        expect(fixture.gold_route).toBe(NONE_ID);
        expect(fixture.gold_kind).toBe("none");
      } else {
        expect(fixture.gold_route).not.toBe(NONE_ID);
      }
    }
  });
});
