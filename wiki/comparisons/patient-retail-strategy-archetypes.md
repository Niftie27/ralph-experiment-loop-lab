---
type: comparison
name: Patient-Retail Strategy Archetypes
sources:
  - raw/patient-retail-strategy-map-2026-07-01.md
related:
  - wiki/concepts/patient-retail-strategy-map.md
  - wiki/concepts/shadowability-latency-axis.md
created: 2026-07-01T22:50:00Z
last_updated: 2026-07-01T22:50:00Z
---

# Patient-Retail Strategy Archetypes

| Archetype | Speed | Main edge | Main failure mode | RALPH stance |
| --- | --- | --- | --- | --- |
| Funding/basis | Slow / structural | collect market-structure yield | tail risk, funding flip, depeg, liquidation, yield compression | first baseline candidate |
| Staking / real yield | Slow / structural | passive yield | protocol/slashing/liquidity risk; may be low return | baseline floor |
| Token unlocks | Slow / public information | supply shock into liquidity | crowded, priced in, wrong recipient/liquidity assumptions | research branch |
| Smart-money accumulation cohort | Slow / informational | cohort flow leads retail price reaction | exit/distribution risk, vendor-label survivorship bias | main alpha branch |
| Copy vaults / auto-copy | Delegated | operator skill | operator risk, fees, survivorship, blow-up | prior-art/reference only |
| Airdrop farming | Slow / effort | labor for potential rewards | sybil filters, uncertain payout, opportunity cost | side branch, not trading edge |
| Event-timing wallets | Fast / informational | possible private/public-event timing | impossible to copy in time, attribution risk | radar only |

## Selection Rule

RALPH should prefer branches where:

- the edge survives hours/days delay;
- the data can be verified without keys or paid infrastructure;
- the failure mode can be simulated or at least bounded;
- the strategy can beat the staking/real-yield baseline net of risk and effort.

