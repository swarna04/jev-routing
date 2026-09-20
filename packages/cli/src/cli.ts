import { existsSync, mkdirSync, writeFileSync } from "node:fs";
import { dirname, join } from "node:path";
import { fileURLToPath } from "node:url";
import { config } from "dotenv";
import {
  formatReport,
  loadDefaultFixtures,
  scorePredictions,
  type ScoreCard,
} from "@jev-routing/eval";
import {
  createRouter,
  type MockScript,
  type Router,
} from "@jev-routing/routers";
import type { RoutingMode } from "@jev-routing/schema";

const ROOT = join(dirname(fileURLToPath(import.meta.url)), "../../..");
const envPath = join(ROOT, ".env");
if (existsSync(envPath)) {
  config({ path: envPath });
}

const BANNER = "jev-routing — next-hop routing eval (bare LLM vs constrained LLM vs Jev)";

type Args = {
  mode: RoutingMode | "all";
  script: MockScript;
  limit?: number;
  help: boolean;
};

function parseArgs(argv: string[]): Args {
  const args: Args = { mode: "mock", script: "demo", help: false };
  for (let i = 0; i < argv.length; i += 1) {
    const token = argv[i];
    const next = argv[i + 1];
    if (token === "--help" || token === "-h") args.help = true;
    else if (token === "--mode" && next) {
      args.mode = next as Args["mode"];
      i += 1;
    } else if (token === "--script" && next) {
      args.script = next as MockScript;
      i += 1;
    } else if (token === "--limit" && next) {
      args.limit = Number(next);
      i += 1;
    }
  }
  return args;
}

function usage(): string {
  return `${BANNER}

Usage:
  pnpm eval --mode mock [--script demo|gold|bare_like|constrained_like|jev_like]
  pnpm eval --mode bare_llm
  pnpm eval --mode constrained_llm
  pnpm eval --mode jev
  pnpm eval --mode all

This is a routing dry-run. No GitHub, Slack, email, calendar, or file_delete APIs are called.
`;
}

async function runRouter(router: Router, limit?: number): Promise<ScoreCard> {
  const fixtures = loadDefaultFixtures().slice(0, limit);
  const predictions = [];
  for (const [index, fixture] of fixtures.entries()) {
    process.stderr.write(
      `[${router.mode}] ${index + 1}/${fixtures.length} ${fixture.id}\n`,
    );
    predictions.push(await router.route(fixture));
  }
  return scorePredictions(fixtures, predictions, router.mode);
}

function writeOutputs(cards: ScoreCard[]): void {
  const reportsDir = join(ROOT, "reports");
  const runsDir = join(reportsDir, "runs");
  mkdirSync(runsDir, { recursive: true });
  const stamp = new Date().toISOString().replace(/[:.]/g, "-");
  const report = formatReport(cards, [
    "",
    "## Notes",
    "",
    "- Live modes are omitted unless their API keys are present.",
    "- Do not treat mock scripts as model measurements.",
  ]);
  writeFileSync(join(reportsDir, "latest.md"), report);
  writeFileSync(join(reportsDir, "latest.json"), `${JSON.stringify(cards.map((card) => ({
    mode: card.mode,
    overall: card.overall,
    by_bucket: card.by_bucket,
  })), null, 2)}\n`);
  writeFileSync(join(runsDir, `${stamp}.md`), report);
  process.stdout.write(`\n${BANNER}\n\n${report}`);
}

async function main(): Promise<void> {
  const args = parseArgs(process.argv.slice(2));
  if (args.help) {
    process.stdout.write(usage());
    return;
  }

  const modes: RoutingMode[] =
    args.mode === "all"
      ? ["mock", "bare_llm", "constrained_llm", "jev"]
      : [args.mode];

  const cards: ScoreCard[] = [];
  for (const mode of modes) {
    try {
      const router = createRouter(mode, { script: args.script });
      cards.push(await runRouter(router, args.limit));
    } catch (error) {
      const message = error instanceof Error ? error.message : String(error);
      if (mode === "mock") throw error;
      process.stderr.write(`[${mode}] skipped: ${message}\n`);
    }
  }
  if (cards.length === 0) {
    throw new Error("no modes produced predictions");
  }
  writeOutputs(cards);
}

main().catch((error) => {
  process.stderr.write(`${error instanceof Error ? error.stack ?? error.message : String(error)}\n`);
  process.exitCode = 1;
});
