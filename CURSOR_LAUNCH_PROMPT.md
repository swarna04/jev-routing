# Cursor launch prompt — jev-routing

Build and eval next-hop routing on the frozen **180-fixture** toy (30 per bucket A–F).

## Name

**jev-routing** (not “contrast”). Compare bare LLM vs constrained LLM vs Jev in the eval; do not put “contrast” in the repo or package name.

## Modes

1. `bare_llm` — free-text LLM, fragile parse
2. `constrained_llm` — JSON enum over legal roster ids + `__none__`
3. `jev` — TypeSafe Choice + Noul `high_consequence_without_clear_intent` + optional Score + fail-closed post-gate

Fail-closed: illegal id → fail; low confidence or high Noul → `__none__`.

## Commands

```bash
pnpm install
pnpm test
pnpm eval --mode mock --script demo
pnpm eval --mode all
```

## Constraints

- Routing dry-run only. Never call GitHub, Slack, email, calendar, or file_delete APIs.
- Do not fabricate live metrics. Write measured numbers only.
- Keys: `TYPESAFE_API_KEY`, `OPENAI_API_KEY` in `.env` (never commit).

See IMPLEMENTATION_PLAN.md and README.md.
