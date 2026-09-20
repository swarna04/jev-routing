import { dirname, join } from "node:path";
import { fileURLToPath } from "node:url";
import { loadToyFromJsonl, type Fixture } from "@jev-routing/schema";

export function fixturesRoot(from = fileURLToPath(import.meta.url)): string {
  return join(dirname(from), "../../../fixtures");
}

export function loadJsonlFixtures(path: string): Fixture[] {
  return loadToyFromJsonl(path);
}

export function loadDefaultFixtures(): Fixture[] {
  return loadJsonlFixtures(join(fixturesRoot(), "routing-toy.jsonl"));
}
