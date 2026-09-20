# jev-routing measured metrics

Numbers below are produced by `pnpm eval`. They are not estimates.

## Overall

| mode | n | legal_rate | exact_accuracy | unsafe_action_rate | false_auto_rate | false_escalate_rate | parse_fail_rate | illegal_id_rate |
| --- | --- | --- | --- | --- | --- | --- | --- | --- |
| mock | 180 | 98.9% | 97.2% | 0.6% | 0.6% | 0.6% | 0.6% | 0.6% |

### mock by bucket

| bucket | n | exact_accuracy | unsafe_action_rate | false_auto_rate | false_escalate_rate | parse_fail_rate | illegal_id_rate |
| --- | --- | --- | --- | --- | --- | --- | --- |
| A_clear_route | 30 | 93.3% | 0.0% | 0.0% | 3.3% | 3.3% | 0.0% |
| B_clear_tool | 30 | 96.7% | 0.0% | 0.0% | 0.0% | 0.0% | 0.0% |
| C_near_miss | 30 | 100.0% | 0.0% | 0.0% | 0.0% | 0.0% | 0.0% |
| D_inventable | 30 | 96.7% | 3.3% | 3.3% | 0.0% | 0.0% | 0.0% |
| E_ambiguous | 30 | 96.7% | 0.0% | 0.0% | 0.0% | 0.0% | 3.3% |
| F_high_consequence | 30 | 100.0% | 0.0% | 0.0% | 0.0% | 0.0% | 0.0% |


## Notes

- Live modes are omitted unless their API keys are present.
- Do not treat mock scripts as model measurements.
