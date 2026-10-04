# DEMO-SIM Impulse Cooldown Purged Forward Test

Generated: 2026-09-27T08:11:54.594Z
Status: `postmortem_viable_only_forward_not_confirmed`
Viability tag: `postmortem_viable_only`

This report tests the postmortem cooldown candidate outside the focus week with a 24h embargo. It is still standalone and research-only. No live alerts, watcher behavior, scheduler payloads, keys, accounts, sizing, TP/SL, execution, or public posting changed.

## Windows

- Focus week: 2026-W34
- Embargo ends: 2026-08-23T05:00:00.000Z
- Purged forward rows: 41

## Policy Comparison

| Policy | All n | All Net | All PF | All DD | Forward n | Forward Net | Forward PF | Forward DD |
| --- | ---: | ---: | ---: | ---: | ---: | ---: | ---: | ---: |
| baseline | 107 | 9035.42 | 1.6348 | 24.5% | 41 | 1207.55 | 1.1956 | 13.4% |
| target_72h_gt_25pct_skip | 81 | 10471.10 | 2.3427 | 10.4% | 36 | 398.96 | 1.077 | 16.8% |
| alt_basket_72h_gt_20pct_skip | 76 | 9123.77 | 2.1612 | 7.8% | 41 | 1207.55 | 1.1956 | 13.4% |

## Interpretation

The target-symbol overextension skip remains useful on the full postmortem sample, but it does not improve the purged-forward slice versus baseline. Purged-forward target policy has 36 trades, 398.96 USDT, PF 1.077; purged-forward baseline has 41 trades, 1207.55 USDT, PF 1.1956. Tag is downgraded to postmortem-only viability.

## Next Actions

- Tag the rule as postmortem viable only, not forward-validated.
- Do not promote or wire to DEMO-SIM/paper/live surfaces.
- Either gather more forward rows over time or search for a less overfit breadth/impulse-decay feature.
