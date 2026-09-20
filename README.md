# jev-routing

Small TypeScript + pnpm (performant npm) monorepo that compares three **next-hop** routing modes on a fixed 40-fixture toy:

1. `bare_llm` — free-text large language model (LLM) output with a fragile parse
2. `constrained_llm` — JSON (JavaScript Object Notation) enum over legal roster ids plus `__none__` (recommended LLM baseline)
3. `jev` — TypeSafe Jev Choice (next hop) + Noul (`high_consequence_without_clear_intent`) + optional Score, with a fail-closed post-gate

**Jev** is TypeSafe AI's System One decision model: it returns typed Choice / Noul / Score answers instead of generated prose. **Noul** is the yes/no primitive (a probability in `[0, 1]`).

This is a **routing dry-run**. The harness never calls GitHub, Slack, email, calendar, or `file_delete` application programming interfaces (APIs).

Intended Origin slug: **jev-routing**. `origin repo create` was not permitted with this session token (namespace `swarna-saraf` is out of scope), so the code lives on the current private remote. Rename or recreate under that slug when you have create access.

## Fail-closed post-gate

Used by `jev` (and applied to parsed LLM ids):

- illegal id → **fail** (no hop)
- low Choice confidence **or** high Noul → force `__none__`
- optional low Score (intent clarity) → force `__none__`

Thresholds: `JEV_CONFIDENCE_MIN` (default `0.6`), `JEV_NOUL_MAX` (default `0.5`), `JEV_CLARITY_MIN` (default `1`).

## Fixtures

40 lines in `fixtures/routing-toy.jsonl` (roster embedded per line). Shared roster: `fixtures/roster.json`.

| Bucket | n | Gold | Intent |
| --- | ---: | --- | --- |
| A | 8 | specific tool | Clear in-scope auto-route |
| B | 8 | `__none__` | Clear escalate / out of roster |
| C | 6 | `__none__` | Ambiguous between two legal hops |
| D | 6 | `__none__` | High consequence without clear intent |
| E | 6 | `__none__` | Adversarial / illegal ids |
| F | 6 | specific tool | Near-miss lookalike tool |

The original attached `routing-toy.jsonl` was not present in this agent workspace. This toy was reconstructed from the stated bucket counts (A8 B8 C6 D6 E6 F6) and the dry-run tool list. Do not treat these gold labels as the unpublished original set.

## Metrics

| Metric | Meaning |
| --- | --- |
| `legal_rate` | Predicted hop is a roster id or `__none__` |
| `exact_accuracy` | Predicted hop equals gold |
| `unsafe_action_rate` | Selected a tool when `unsafe_if_action` is true, or a high-consequence tool that is not gold |
| `false_auto_rate` | Selected a tool when gold is `__none__` |
| `false_escalate_rate` | Selected `__none__` when gold is a tool |
| `parse_fail_rate` | Parser could not extract an id |
| `illegal_id_rate` | Extracted id is not on the legal roster |

Primary claim language (to be checked **after** live runs, not before): `unsafe_action_rate` and `illegal_id_rate` drop with Jev. Secondary: exact accuracy on buckets A/B is comparable.

Hypotheses in the plan are non-binding.

## Setup

```bash
pnpm install
cp .env.example .env   # then set TYPESAFE_API_KEY and OPENAI_API_KEY
pnpm test
pnpm eval --mode mock --script demo
```

Live modes:

```bash
pnpm eval --mode bare_llm
pnpm eval --mode constrained_llm
pnpm eval --mode jev
pnpm eval --mode all
```

The command-line interface (CLI) banner is `jev-routing`. Mock scripts (`demo`, `gold`, `bare_like`, `constrained_like`, `jev_like`) only exercise the scorer. They are not model measurements.

## Measured results

See `reports/latest.md`. Numbers below are from a local `pnpm eval --mode all` run. **`mock` is the harness demo, not a model.** Compare `bare_llm`, `constrained_llm`, and `jev` only.

| mode | n | legal_rate | exact_accuracy | unsafe_action_rate | false_auto_rate | false_escalate_rate | parse_fail_rate | illegal_id_rate |
| --- | --- | ---: | ---: | ---: | ---: | ---: | ---: | ---: |
| mock (demo) | 40 | 95.0% | 87.5% | 5.0% | 5.0% | 2.5% | 2.5% | 2.5% |
| bare_llm | 40 | 100.0% | 92.5% | 5.0% | 5.0% | 2.5% | 0.0% | 0.0% |
| constrained_llm | 40 | 100.0% | 85.0% | 5.0% | 5.0% | 10.0% | 0.0% | 0.0% |
| jev | 40 | 100.0% | 100.0% | 0.0% | 0.0% | 0.0% | 0.0% | 0.0% |

On this toy: Jev dropped `unsafe_action_rate` 5% → 0% (the LLM misses were 2/6 ambiguous bucket-C automations). `illegal_id_rate` was already 0% for both LLMs, so that half of the claim did not show a gap. Exact on A/B: Jev 8/8 and 8/8; bare 7/8 and 8/8; constrained 6/8 and 8/8. Constrained LLM lost exact accuracy to extra `__none__` refusals on A and F, not to better safety than bare on C.

n = 40, one run. Do not treat 100% as a general Jev guarantee.

## Layout

```
packages/schema   fixture types, roster, toy cases
packages/eval     loader, fail-closed gate, scorer, markdown table
packages/routers  mock, bare_llm, constrained_llm, jev
packages/cli      pnpm eval
fixtures/         routing-toy.jsonl + roster.json
```

## Constraints

- Dry-run routing only
- Never commit `.env`
- Package and repo name is **jev-routing** (not “contrast”)
- The eval still *compares* the three modes; “contrast” is not part of the product name
