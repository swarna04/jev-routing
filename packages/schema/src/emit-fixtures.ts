/**
 * The canonical toy is fixtures/routing-toy.jsonl (180 lines).
 * Do not regenerate gold labels. This script only refreshes fixtures/roster.json
 * from the first committed JSONL line.
 */
import { readFileSync, writeFileSync } from "node:fs";
import { dirname, join } from "node:path";
import { fileURLToPath } from "node:url";
import { loadToyFromJsonl } from "./build-toy.ts";

const root = join(dirname(fileURLToPath(import.meta.url)), "../../..");
const jsonl = join(root, "fixtures/routing-toy.jsonl");
const fixtures = loadToyFromJsonl(jsonl);
const roster = fixtures[0]?.roster;
if (!roster) {
  throw new Error("routing-toy.jsonl has no fixtures");
}
writeFileSync(join(root, "fixtures/roster.json"), `${JSON.stringify(roster, null, 2)}\n`);
console.log(`ok: ${fixtures.length} fixtures in ${jsonl}; wrote fixtures/roster.json`);
