import { readFileSync } from "node:fs";
import {
  BUCKETS,
  EXPECTED_BUCKET_COUNTS,
  EXPECTED_FIXTURE_COUNT,
  type Bucket,
  type Fixture,
} from "./types.ts";

export function emptyBucketCounts(): Record<Bucket, number> {
  return {
    A_clear_route: 0,
    B_clear_tool: 0,
    C_near_miss: 0,
    D_inventable: 0,
    E_ambiguous: 0,
    F_high_consequence: 0,
  };
}

export function bucketCounts(fixtures: Fixture[]): Record<Bucket, number> {
  const counts = emptyBucketCounts();
  for (const fixture of fixtures) {
    counts[fixture.bucket] += 1;
  }
  return counts;
}

export function parseFixtureLine(raw: unknown, line: number): Fixture {
  if (typeof raw !== "object" || raw === null) {
    throw new Error(`line ${line}: expected object`);
  }
  const row = raw as Record<string, unknown>;
  const bucket = row.bucket;
  if (typeof bucket !== "string" || !(BUCKETS as readonly string[]).includes(bucket)) {
    throw new Error(`line ${line}: invalid bucket ${String(bucket)}`);
  }
  if (typeof row.id !== "string" || typeof row.utterance !== "string") {
    throw new Error(`line ${line}: missing id or utterance`);
  }
  if (typeof row.gold_route !== "string") {
    throw new Error(`line ${line}: missing gold_route`);
  }
  return row as Fixture;
}

export function loadToyFromJsonl(path: string): Fixture[] {
  const text = readFileSync(path, "utf8");
  const fixtures: Fixture[] = [];
  for (const [index, line] of text.split(/\r?\n/).entries()) {
    if (!line.trim()) continue;
    let parsed: unknown;
    try {
      parsed = JSON.parse(line);
    } catch (error) {
      throw new Error(`invalid JSONL at line ${index + 1}: ${String(error)}`);
    }
    fixtures.push(parseFixtureLine(parsed, index + 1));
  }
  assertToyShape(fixtures);
  return fixtures;
}

export function assertToyShape(fixtures: Fixture[]): void {
  if (fixtures.length !== EXPECTED_FIXTURE_COUNT) {
    throw new Error(`expected ${EXPECTED_FIXTURE_COUNT} fixtures, got ${fixtures.length}`);
  }
  const counts = bucketCounts(fixtures);
  for (const bucket of BUCKETS) {
    if (counts[bucket] !== EXPECTED_BUCKET_COUNTS[bucket]) {
      throw new Error(
        `bucket ${bucket}: expected ${EXPECTED_BUCKET_COUNTS[bucket]}, got ${counts[bucket]}`,
      );
    }
  }
}
