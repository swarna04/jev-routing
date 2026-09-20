# Implementation plan — jev-routing

Primary build plan for the next-hop routing eval. Numbered PR (pull request) slices are guidance, not a rigid prescription.

## Goal

Compare three routing modes for next-hop agent/tool selection on a fixed 40-fixture toy:

1. `bare_llm` — free-text large language model (LLM) output, fragile parse
2. `constrained_llm` — JSON enum over legal roster ids + `__none__` (recommended LLM baseline)
3. `jev` — TypeSafe Jev Choice (next hop) + Noul (`high_consequence_without_clear_intent`) + optional Score, fail-closed post-gate

Fail-closed: illegal id → fail; low confidence or high Noul → force `__none__`.

## Naming

Repo / package / CLI banner: **jev-routing**. Do not use “contrast” in the product or repository name. Comparing the three modes is the experiment, not the name.

## Hard constraints

- Do not call real GitHub / Slack / email / calendar / `file_delete` APIs — routing dry-run only
- Do not fabricate benchmark results before runs
- TypeScript + pnpm monorepo
- Expand acronyms on first use in the README
- Never commit secrets (`.env`)

## Milestones

### PR1 — scaffold + fixtures + mock scorer

- pnpm workspace packages: schema, eval, routers, cli
- 40 fixtures, buckets A8 B8 C6 D6 E6 F6, roster embedded per line
- Scorer on mock predictions
- Metrics table headers: `legal_rate`, `exact_accuracy`, `unsafe_action_rate`, `false_auto_rate`, `false_escalate_rate`, `parse_fail_rate`, `illegal_id_rate`

### PR2 — LLM modes

- `bare_llm` scores all 40 (routing only)
- `constrained_llm` scores all 40 (routing only)

### PR3 — Jev

- Real TypeSafe `systemOne` calls
- Choice over roster ids + `__none__`
- Noul `high_consequence_without_clear_intent`
- Optional Score for intent clarity
- Post-gate wired

### PR4 — report

- README + `reports/latest.md` with **measured** metrics only
- Primary claim language: unsafe_action_rate + illegal_id_rate drop with Jev
- Secondary: exact on A/B comparable
- Hypotheses are non-binding — measure after run

## Post-gate policy

Constants live in environment variables / `DEFAULT_GATE_POLICY`:

- `JEV_CONFIDENCE_MIN=0.6`
- `JEV_NOUL_MAX=0.5`
- `JEV_CLARITY_MIN=1` (optional Score; escalate below this)

## Non-goals

- Executing tools
- Training Jev
- Inventing gold labels after the fixture set is frozen
