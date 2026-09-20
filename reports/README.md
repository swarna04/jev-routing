# Reports

`pnpm eval` writes `latest.md`, `latest.json`, and `latest.traces.jsonl` here.

- Mock scripts demonstrate the scorer. They are not live-model results.
- Live `bare_llm`, `constrained_llm`, and `jev` numbers in `latest.md` are from a local `--mode all` run.
- `latest.traces.jsonl` is the per-fixture debug dump (`parsed_id` vs `next_hop`, `gate_reason`, Noul, confidence, clarity). Use it to split Choice refusals from post-gate overrides.
- `--bucket B_clear_tool` and `--ids B01,B07` slice the toy without rewriting gold labels.
- `measured-jev-n180.*` is live Jev before the Choice `__none__` wording change.
- `measured-jev-n180-choice-fix.*` is live Jev after that wording change (still before the dry-run constraint rewrite).
- Do not paste fabricated percentages into this folder.
