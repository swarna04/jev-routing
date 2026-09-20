# jev-routing measured metrics

Numbers below are produced by `pnpm eval`. They are not estimates.

## Overall

| mode | n | legal_rate | exact_accuracy | unsafe_action_rate | false_auto_rate | false_escalate_rate | parse_fail_rate | illegal_id_rate |
| --- | --- | --- | --- | --- | --- | --- | --- | --- |
| mock | 40 | 95.0% | 87.5% | 5.0% | 5.0% | 2.5% | 2.5% | 2.5% |
| bare_llm | 40 | 100.0% | 92.5% | 5.0% | 5.0% | 2.5% | 0.0% | 0.0% |
| constrained_llm | 40 | 100.0% | 85.0% | 5.0% | 5.0% | 10.0% | 0.0% | 0.0% |
| jev | 40 | 100.0% | 100.0% | 0.0% | 0.0% | 0.0% | 0.0% | 0.0% |

### mock by bucket

| bucket | n | exact_accuracy | unsafe_action_rate | false_auto_rate | false_escalate_rate | parse_fail_rate | illegal_id_rate |
| --- | --- | --- | --- | --- | --- | --- | --- |
| A | 8 | 87.5% | 0.0% | 0.0% | 0.0% | 12.5% | 0.0% |
| B | 8 | 87.5% | 12.5% | 12.5% | 0.0% | 0.0% | 0.0% |
| C | 6 | 100.0% | 0.0% | 0.0% | 0.0% | 0.0% | 0.0% |
| D | 6 | 83.3% | 16.7% | 16.7% | 0.0% | 0.0% | 0.0% |
| E | 6 | 83.3% | 0.0% | 0.0% | 0.0% | 0.0% | 16.7% |
| F | 6 | 83.3% | 0.0% | 0.0% | 16.7% | 0.0% | 0.0% |

### bare_llm by bucket

| bucket | n | exact_accuracy | unsafe_action_rate | false_auto_rate | false_escalate_rate | parse_fail_rate | illegal_id_rate |
| --- | --- | --- | --- | --- | --- | --- | --- |
| A | 8 | 87.5% | 0.0% | 0.0% | 12.5% | 0.0% | 0.0% |
| B | 8 | 100.0% | 0.0% | 0.0% | 0.0% | 0.0% | 0.0% |
| C | 6 | 66.7% | 33.3% | 33.3% | 0.0% | 0.0% | 0.0% |
| D | 6 | 100.0% | 0.0% | 0.0% | 0.0% | 0.0% | 0.0% |
| E | 6 | 100.0% | 0.0% | 0.0% | 0.0% | 0.0% | 0.0% |
| F | 6 | 100.0% | 0.0% | 0.0% | 0.0% | 0.0% | 0.0% |

### constrained_llm by bucket

| bucket | n | exact_accuracy | unsafe_action_rate | false_auto_rate | false_escalate_rate | parse_fail_rate | illegal_id_rate |
| --- | --- | --- | --- | --- | --- | --- | --- |
| A | 8 | 75.0% | 0.0% | 0.0% | 25.0% | 0.0% | 0.0% |
| B | 8 | 100.0% | 0.0% | 0.0% | 0.0% | 0.0% | 0.0% |
| C | 6 | 66.7% | 33.3% | 33.3% | 0.0% | 0.0% | 0.0% |
| D | 6 | 100.0% | 0.0% | 0.0% | 0.0% | 0.0% | 0.0% |
| E | 6 | 100.0% | 0.0% | 0.0% | 0.0% | 0.0% | 0.0% |
| F | 6 | 66.7% | 0.0% | 0.0% | 33.3% | 0.0% | 0.0% |

### jev by bucket

| bucket | n | exact_accuracy | unsafe_action_rate | false_auto_rate | false_escalate_rate | parse_fail_rate | illegal_id_rate |
| --- | --- | --- | --- | --- | --- | --- | --- |
| A | 8 | 100.0% | 0.0% | 0.0% | 0.0% | 0.0% | 0.0% |
| B | 8 | 100.0% | 0.0% | 0.0% | 0.0% | 0.0% | 0.0% |
| C | 6 | 100.0% | 0.0% | 0.0% | 0.0% | 0.0% | 0.0% |
| D | 6 | 100.0% | 0.0% | 0.0% | 0.0% | 0.0% | 0.0% |
| E | 6 | 100.0% | 0.0% | 0.0% | 0.0% | 0.0% | 0.0% |
| F | 6 | 100.0% | 0.0% | 0.0% | 0.0% | 0.0% | 0.0% |


## Notes

- Live modes are omitted unless their API keys are present.
- Do not treat mock scripts as model measurements.
- This table is the local `--mode all` run (bare LLM, constrained LLM, Jev). Mock is the harness demo, not a model.
