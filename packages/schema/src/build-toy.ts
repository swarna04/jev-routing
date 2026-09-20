import { CASES } from "./cases.ts";
import { ROSTER } from "./roster.ts";
import {
  EXPECTED_BUCKET_COUNTS,
  type Bucket,
  type Fixture,
} from "./types.ts";

export function buildToy(roster = ROSTER): Fixture[] {
  return CASES.map((spec) => ({
    ...spec,
    roster: roster.map((entry) => ({ ...entry })),
  }));
}

export function bucketCounts(fixtures: Fixture[]): Record<Bucket, number> {
  const counts: Record<Bucket, number> = {
    A: 0,
    B: 0,
    C: 0,
    D: 0,
    E: 0,
    F: 0,
  };
  for (const fixture of fixtures) {
    counts[fixture.bucket] += 1;
  }
  return counts;
}

export function assertToyShape(fixtures: Fixture[]): void {
  if (fixtures.length !== 40) {
    throw new Error(`expected 40 fixtures, got ${fixtures.length}`);
  }
  const counts = bucketCounts(fixtures);
  for (const bucket of Object.keys(EXPECTED_BUCKET_COUNTS) as Bucket[]) {
    if (counts[bucket] !== EXPECTED_BUCKET_COUNTS[bucket]) {
      throw new Error(
        `bucket ${bucket}: expected ${EXPECTED_BUCKET_COUNTS[bucket]}, got ${counts[bucket]}`,
      );
    }
  }
}
