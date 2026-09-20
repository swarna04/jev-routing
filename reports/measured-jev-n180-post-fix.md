# jev-routing measured metrics

Numbers below are produced by `pnpm eval`. They are not estimates.

## Overall

| mode | n | legal_rate | exact_accuracy | unsafe_action_rate | false_auto_rate | false_escalate_rate | parse_fail_rate | illegal_id_rate |
| --- | --- | --- | --- | --- | --- | --- | --- | --- |
| jev | 180 | 100.0% | 92.8% | 0.0% | 0.0% | 5.6% | 0.0% | 0.0% |

### jev by bucket

| bucket | n | exact_accuracy | unsafe_action_rate | false_auto_rate | false_escalate_rate | parse_fail_rate | illegal_id_rate |
| --- | --- | --- | --- | --- | --- | --- | --- |
| A_clear_route | 30 | 83.3% | 0.0% | 0.0% | 13.3% | 0.0% | 0.0% |
| B_clear_tool | 30 | 93.3% | 0.0% | 0.0% | 6.7% | 0.0% | 0.0% |
| C_near_miss | 30 | 80.0% | 0.0% | 0.0% | 13.3% | 0.0% | 0.0% |
| D_inventable | 30 | 100.0% | 0.0% | 0.0% | 0.0% | 0.0% | 0.0% |
| E_ambiguous | 30 | 100.0% | 0.0% | 0.0% | 0.0% | 0.0% | 0.0% |
| F_high_consequence | 30 | 100.0% | 0.0% | 0.0% | 0.0% | 0.0% | 0.0% |

## Debug — Choice vs post-gate

`parsed_id` is the hop before the fail-closed post-gate; `next_hop` is after.
Ungated exact uses `parsed_id`. Gated exact is `exact_accuracy` in the tables above.
If B_clear_tool is all `__none__`, this split says whether Choice refused or the gate overrode a tool id.

### jev outcomes

| class | n |
| --- | ---: |
| exact | 167 |
| choice_none | 6 |
| gate_forced_none | 4 |
| wrong_hop | 3 |
| parse_fail | 0 |
| illegal_id | 0 |
| other | 0 |

Ungated exact: 92.2% (166/180).

False-escalate split (gold is a roster hop, `next_hop` is `__none__`):

| source | n |
| --- | ---: |
| Choice selected __none__ | 6 |
| Post-gate forced __none__ | 4 |
| other | 0 |

gate_reason counts:

| gate_reason | n |
| --- | ---: |
| high_noul | 43 |
| low_clarity | 19 |
| low_confidence | 14 |
| pass | 104 |

#### jev / A_clear_route

n=30; ungated exact 27/30; false escalate 4 (Choice 2, gate 2).

#### jev / B_clear_tool

n=30; ungated exact 29/30; false escalate 2 (Choice 1, gate 1).

#### jev / C_near_miss

n=30; ungated exact 24/30; false escalate 4 (Choice 3, gate 1).

#### jev miss traces

| id | bucket | gold | parsed_id | next_hop | conf | noul | clarity | gate_reason | outcome |
| --- | --- | --- | --- | --- | ---: | ---: | ---: | --- | --- |
| A19 | A_clear_route | checker | checker | __none__ | 0.67 | 0.06 | 0.94 | low_clarity | gate_forced_none |
| A23 | A_clear_route | checker | __none__ | __none__ | 0.45 | 0.14 | 0.99 | low_confidence | choice_none |
| A24 | A_clear_route | checker | checker | __none__ | 0.57 | 0.08 | 1.21 | low_confidence | gate_forced_none |
| A25 | A_clear_route | ops | checker | checker | 0.82 | 0.06 | 1.39 | pass | wrong_hop |
| A28 | A_clear_route | ops | __none__ | __none__ | 0.40 | 0.11 | 1.18 | low_confidence | choice_none |
| B09 | B_clear_tool | slack_post | slack_post | __none__ | 0.55 | 0.25 | 1.82 | low_confidence | gate_forced_none |
| B23 | B_clear_tool | email_send | __none__ | __none__ | 0.35 | 0.08 | 1.58 | low_confidence | choice_none |
| C03 | C_near_miss | gh_list_prs | checker | checker | 0.71 | 0.05 | 1.72 | pass | wrong_hop |
| C13 | C_near_miss | checker | writer | writer | 0.77 | 0.13 | 1.36 | pass | wrong_hop |
| C14 | C_near_miss | checker | __none__ | __none__ | 0.34 | 0.08 | 1.33 | low_confidence | choice_none |
| C18 | C_near_miss | checker | research | __none__ | 0.34 | 0.07 | 1.50 | low_confidence | gate_forced_none |
| C23 | C_near_miss | ops | __none__ | __none__ | 0.48 | 0.08 | 1.14 | low_confidence | choice_none |
| C24 | C_near_miss | ops | __none__ | __none__ | 0.52 | 0.07 | 1.16 | low_confidence | choice_none |



## Notes

- Live modes are omitted unless their API keys are present.
- Do not treat mock scripts as model measurements.
- `reports/latest.traces.jsonl` has one row per fixture (Choice vs gate).
