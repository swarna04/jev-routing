import { existsSync } from "node:fs";
import { join } from "node:path";
import { describe, expect, it } from "vitest";
import { EXPECTED_BUCKET_COUNTS, EXPECTED_FIXTURE_COUNT, bucketCounts } from "@jev-routing/schema";
import { fixturesRoot, loadJsonlFixtures } from "./load.ts";

describe("jsonl fixtures", () => {
  it("loads 180 embedded-roster lines", () => {
    const path = join(fixturesRoot(), "routing-toy.jsonl");
    expect(existsSync(path)).toBe(true);
    const fixtures = loadJsonlFixtures(path);
    expect(fixtures).toHaveLength(EXPECTED_FIXTURE_COUNT);
    expect(bucketCounts(fixtures)).toEqual(EXPECTED_BUCKET_COUNTS);
    expect(fixtures[0]?.roster.agents.length).toBeGreaterThan(0);
    expect(fixtures[0]?.roster.tools.length).toBeGreaterThan(0);
  });
});
