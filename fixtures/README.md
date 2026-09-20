Each `routing-toy.jsonl` line is one fixture with the shared roster embedded.

The JSONL is the source of truth (180 lines, 30 per bucket). Do not regenerate gold labels.

`pnpm fixtures:emit` only rewrites `fixtures/roster.json` from the first JSONL line.
