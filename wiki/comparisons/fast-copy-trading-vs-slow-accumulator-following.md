---
type: comparison
name: Fast Copy-Trading vs Slow Accumulator Following
sources:
  - raw/slow-copy-trading-distinction-2026-07-01.md
  - raw/patient-retail-strategy-map-2026-07-01.md
related:
  - wiki/concepts/smart-money-accumulation-cohort.md
  - wiki/comparisons/copyable-wallets-vs-radar-wallets.md
created: 2026-07-01T23:05:00Z
last_updated: 2026-07-01T23:05:00Z
---

# Fast Copy-Trading vs Slow Accumulator Following

| Dimension | Fast copy-trading | Slow accumulator following |
| --- | --- | --- |
| Typical venue | perps, scalps, event timing | spot/on-chain mid-cap accumulation |
| Holding period | seconds to hours | days to weeks |
| Main enemy | latency and worse fills | exit/distribution and selection bias |
| Copyability | usually poor for Tomas | plausible if paper-tested |
| Universe risk | leaderboard survivors | vendor-labeled or hindsight "smart money" |
| Best use | prior art, radar, learning | candidate strategy branch |
| Validation gate | likely fails delay test | must pass round-trip forward test |

## Verdict

Do not reject all copy-trading.

Reject fast copy-trading by default because it reintroduces the latency race Tomas wants to avoid.

Keep slow accumulator following as a serious patient-retail candidate, but only if:

- it is cohort-based rather than one-wallet worship;
- entry delay is measured in hours/days;
- exit-shadowing is included;
- returns are beta-adjusted;
- candidates are selected by activity and behavior, not PnL leaderboard;
- forward testing is out-of-sample.

