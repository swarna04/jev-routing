import { readFileSync } from "node:fs";
import { dirname, join } from "node:path";
import { fileURLToPath } from "node:url";
import {
  assertToyShape,
  type Fixture,
} from "@jev-routing/schema";

export function fixturesRoot(from = fileURLToPath(import.meta.url)): string {
  return join(dirname(from), "../../../fixtures");
}

export function loadJsonlFixtures(path: string): Fixture[] {
  const text = readFileSync(path, "utf8");
  const fixtures: Fixture[] = [];
  for (const [index, line] of text.split(/\r?\n/).entries()) {
    if (!line.trim()) continue;
    try {
      fixtures.push(JSON.parse(line) as Fixture);
    } catch (error) {
      throw new Error(`invalid JSONL at line ${index + 1}: ${String(error)}`);
    }
  }
  assertToyShape(fixtures);
  return fixtures;
}

export function loadDefaultFixtures(): Fixture[] {
  return loadJsonlFixtures(join(fixturesRoot(), "routing-toy.jsonl"));
}
