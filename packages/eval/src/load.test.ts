import { existsSync } from "node:fs";
import { join } from "node:path";
import { describe, expect, it } from "vitest";
import { EXPECTED_BUCKET_COUNTS, bucketCounts } from "@jev-routing/schema";
import { fixturesRoot, loadJsonlFixtures } from "./load.ts";

describe("jsonl fixtures", () => {
  it("loads 40 embedded-roster lines when emitted", () => {
    const path = join(fixturesRoot(), "routing-toy.jsonl");
    if (!existsSync(path)) {
      throw new Error("run pnpm fixtures:emit first");
    }
    const fixtures = loadJsonlFixtures(path);
    expect(fixtures).toHaveLength(40);
    expect(bucketCounts(fixtures)).toEqual(EXPECTED_BUCKET_COUNTS);
    expect(fixtures[0]?.roster.length).toBeGreaterThan(0);
  });
});
