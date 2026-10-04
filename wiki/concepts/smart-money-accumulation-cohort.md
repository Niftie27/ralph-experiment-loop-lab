---
type: concept
name: Smart-Money Accumulation Cohort
sources:
  - raw/patient-retail-strategy-map-2026-07-01.md
  - raw/wallet-shadowing-latency-axis-correction-2026-07-01.md
  - raw/slow-copy-trading-distinction-2026-07-01.md
related:
  - wiki/concepts/forward-paper-trade-gate.md
  - wiki/comparisons/copyable-wallets-vs-radar-wallets.md
created: 2026-07-01T22:50:00Z
last_updated: 2026-08-31T18:00:26Z
---

# Smart-Money Accumulation Cohort

Smart-money accumulation is the main slow-informational wallet-shadowing branch.

The goal is not to copy one famous wallet. The goal is to identify a cohort of wallets that repeatedly accumulates real assets before multi-day or multi-week moves, and then test whether following the cohort survives realistic entry delay and exit risk.

Tomas clarified that this is the kind of "copy-trading" he still means: slow mid-cap spot accumulation with holding periods in days/weeks, not fast perp mirroring.

## Inclusion Criteria

Candidate wallets should show:

- repeated pre-run accumulation across multiple independent tokens;
- mid-cap focus, roughly top-20 to top-150 by market cap;
- real projects, not memecoins or fresh low-liquidity launches;
- scale-in behavior over time rather than one all-in print;
- holding periods in days or weeks;
- residual alpha after stripping broad market beta;
- exit discipline, not just good entries.

## Cohort Signal

The preferred signal is aggregate flow:

- net cohort accumulation;
- stablecoin-to-alt rotation;
- rate-of-change over rolling windows;
- agreement across multiple wallets rather than one wallet.

This is more robust than single-wallet copying because one wallet can be noise, a hedge leg, or a lucky survivor.

## Reject Conditions

Reject a wallet or cohort if:

- top 1-3 trades explain most PnL;
- edge disappears with hours/days entry lag;
- activity only appears in one narrative window;
- exits round-trip profits back to zero;
- returns are mostly explained by long beta.

## Main Failure Mode

For slow accumulation, entry latency is not the main danger.

The main danger is distribution:

> Tomas joins the accumulation correctly, but the cohort sells into the later hype while Tomas becomes part of the exit liquidity.

Therefore any simulator must model full round-trip capture, not only entry capture.

## Three Branch Weaknesses

1. Exit and distribution risk: informed wallets may sell into the later attention that Tomas joins.
2. Selection and label bias: "smart money" can mean vendor-defined survivor sets rather than repeatable skill.
3. Liquidity and coverage risk: mid-cap spot is less clean than BTC/ETH data and may fragment across chains, CEXs, OTC, or private wallets.

## 2026-08-31 Discovery Layer Contract

The discovery layer is now defined as a row contract, not a scanner.

Minimum allowed future sample:

- frozen `selection_time`;
- source and access class;
- wallet/entity identifier plus label confidence;
- token, chain, market-cap/liquidity context;
- 7-14 day entry accumulation flow;
- later exit/distribution/reduction flow, or explicit no-exit status;
- CEX/bridge/off-ramp context where visible;
- delayed follower result;
- BTC/ETH/SOL or sector beta context;
- quality flags for vendor-label bias, exchange/internal/LP flow, missing exits, thin liquidity, and one-winner dependence.

Until an approved Nansen/Dune/Arkham export or manual table can fill this, the branch remains Candidate / access-gated. No no-key source currently produces the required 20+ wallet/entity cohort with entry plus exit rows.
