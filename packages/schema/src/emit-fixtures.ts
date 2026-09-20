import { mkdirSync, writeFileSync } from "node:fs";
import { dirname, join } from "node:path";
import { fileURLToPath } from "node:url";
import { buildToy } from "./build-toy.ts";
import { ROSTER } from "./roster.ts";

const root = join(dirname(fileURLToPath(import.meta.url)), "../../..");
const fixturesDir = join(root, "fixtures");

mkdirSync(fixturesDir, { recursive: true });
writeFileSync(join(fixturesDir, "roster.json"), `${JSON.stringify(ROSTER, null, 2)}\n`);

const lines = buildToy().map((fixture) => JSON.stringify(fixture));
writeFileSync(join(fixturesDir, "routing-toy.jsonl"), `${lines.join("\n")}\n`);

console.log(`wrote ${lines.length} fixtures to fixtures/routing-toy.jsonl`);
