# Patient-Retail Crypto Strategy Map + Wallet Detection Criteria

_Reference note for the wallet-shadowing / trading research. Scope: strategies for a
patient retail participant who will NOT compete on latency and can wait weeks for a
trade to play out. Nothing here is investment advice or a proven edge; every wallet-based
signal must pass an out-of-sample forward test before capital._

---

## Core principle: pick edges by SPEED, not by asset

The wrong question is "which coin." The right question is "how fast is the edge vs. my
detection + execution delay."

- **Fast-informational edges** (timing a market-moving event, front-running a print):
  price discovery is off-chain and milliseconds fast. You see it late, you lose. **Avoid.**
- **Slow-informational edges** (public schedules, multi-day accumulation): lead price by
  days to weeks. Being a day late still captures most of the move. **Shadowable.**
- **Structural edges** (yield/mechanics, not prediction): the edge accrues over time and
  does not decay because you saw it late. **Most robust for patient retail.**

Order of preference for someone who won't play latency: **structural > slow-informational
> delegated > fast-informational (skip).**

---

## Strategy archetypes

### 1. Funding-rate / basis harvesting (cash-and-carry) — structural
- **What:** Long spot + short perp (or short-dated future). Collect funding while
  delta-neutral (indifferent to price direction).
- **Why it fits:** No prediction, no timing, no latency race. Pure structural yield.
- **Edge:** Funding paid by the crowded side of the perp market; persists while leverage
  demand is one-sided.
- **Catch / decay:** Yield compresses as more capital arrives; funding can flip and you
  start paying; liquidation risk on the perp leg during volatility; stablecoin depeg risk;
  rebalancing/execution cost. "Delta-neutral" is NOT "risk-free" (see 2022 blowups).
- **Tools:** Hyperliquid funding data, DefiLlama, funding-rate dashboards.

### 2. Staking / real yield — structural baseline
- **What:** Native staking, liquid staking, protocol real-yield.
- **Why it fits:** Zero skill, zero timing.
- **Role:** This is the BASELINE — the "do nothing clever" floor you are trying to beat.
  If a strategy can't beat staking net of risk, it isn't worth the effort.

### 3. Token-unlock positioning — slow-informational
- **What:** Vesting/unlock schedules are public weeks ahead. Large unlocks add supply and
  often precede price weakness.
- **Why it fits:** Weeks of lead time, no latency race, simple to understand.
- **Edge:** Supply shock into finite liquidity.
- **Catch / decay:** The naive "short before unlock" is widely known and often already
  priced/front-run. Real edge lives in the nuance: cliff vs. linear vesting, unlock to
  insiders vs. community, low-float/high-FDV tokens, and order-book/liquidity depth. The
  simple version is crowded.
- **Tools:** Token unlock calendars, on-chain vesting-contract tracking.

### 4. Smart-money accumulation — slow-informational (the "find smart money" thesis)
- **What:** Identify wallets that repeatedly accumulate real mid-cap tokens over days/weeks
  before sustained runs, then position with them.
- **Why it fits:** Accumulation is slow; entering hours-to-a-day late still captures most
  of a multi-day/week move. Latency-tolerant.
- **Edge:** On-chain repositioning leads the retail price response.
- **Catch / decay:** (a) "Smart money" labels are vendor-defined SURVIVOR sets — selection
  bias. (b) The real risk is the EXIT, not entry: informed wallets distribute INTO the hype
  you joined; you can become exit liquidity. You must shadow the exit too, and exits are
  less telegraphed than accumulation. (c) Alt on-chain data coverage is thinner than BTC/ETH.
- **Two forms:**
  - **Single-wallet shadowing** — higher variance, more selection-bias exposure.
  - **Cohort/aggregate flow** — read the GROUP (net accumulation, stablecoin→alt rotation)
    rather than one wallet. More robust; one wallet is noise, a hundred is signal.
    Preferred for patient retail.

### 5. Copy-vaults / auto-copy — delegated
- **What:** Deposit into a vault run by a proven trader, or auto-mirror via a platform.
- **Why it fits:** Zero build, literally "for plebs."
- **Catch:** You inherit operator risk + fees; advertised performance is survivorship; the
  operator can blow up, rug, or be the one exiting on you. Least control.

### 6. Airdrop / points farming — effort, not edge
- **What:** Use protocols to earn future airdrops.
- **Why it fits:** Slow, low-skill, patient.
- **Catch:** It's labor, not alpha. Sybil detection, uncertain/decaying payouts,
  increasingly gamed, real opportunity cost.

---

## On-chain detection criteria (for the wallet-based archetypes)

### Smart-money accumulation wallet — inclusion criteria
Define the universe by ACTIVITY, not by past PnL (leaderboards = pre-selected survivors).
Then screen:
- **Repeated pre-run accumulation:** builds position in a token over multiple days BEFORE
  a sustained appreciation, across MULTIPLE independent tokens (not one lucky hit).
- **Real assets only:** mid-caps (roughly top-20 to top-150 by mcap), real projects.
  Exclude memecoins and freshly deployed low-liquidity tokens.
- **Accumulation shape:** scaling in over time (many buys), not a single all-in print.
- **Holding period > your detection+execution delay:** median hold measured in days/weeks,
  not minutes.
- **Residual alpha, not beta:** regress the wallet's returns against matched-exposure
  buy-and-hold of the relevant majors; require alpha AFTER stripping market beta. A wallet
  that is just "long everything in an up market" is beta, not skill.
- **Exit discipline:** does the wallet also EXIT well (takes profit before the dump), or
  does it round-trip? Entry skill without exit skill is not copyable.
- **Reject if:** top 1–3 positions explain most of PnL; edge disappears once you apply a
  realistic (hours/days) entry lag; activity concentrated in one narrative/event window.

### Cohort / aggregate-flow signal — construction
- Build a COHORT of wallets meeting the above (e.g., N wallets with demonstrated repeated
  pre-run accumulation).
- Track the cohort's **net accumulation** and **stablecoin→alt rotation ratio** over rolling
  windows (e.g., 14 days).
- Signal = rate-of-change of the cohort's aggregate positioning, not any single wallet.
- More robust to any one wallet being noise or being a decoy leg of a hedge.

### Token-unlock positioning — screen
- Pull unlock schedule; flag unlocks that are LARGE relative to circulating supply and to
  daily on-chain/venue liquidity.
- Weight by recipient (insider/team/VC cliffs > community linear).
- Flag low-float / high-FDV tokens (thin float amplifies supply shocks).
- Position with weeks of lead; do NOT treat it as a latency trade.

---

## How this maps to the scanner infra (asset-agnostic)

The scanner (activity universe → screening → frozen cohort → forward paper-trade →
capture metrics) is neutral to which archetype you run. To point it at slow smart-money
accumulation instead of fast perp traders:

1. **Widen the latency axis** in forward paper-trade from seconds (15s–5min) to
   **hours/days**. For a latency-tolerant edge, capture_ratio should stay high even at
   large delay; that is the property you are selecting for.
2. **Add exit-shadowing** to the simulation, not just entry. Measure capture on the FULL
   round-trip, because the exit/distribution risk is the real failure mode here.
3. **Keep beta decomposition** in screening (residual alpha, not leverage-beta).
4. **Keep the multiple-testing gate** (frozen cohort + FDR / second holdout window).

The infra investment is safe regardless of which archetype wins — you change the universe,
the instrument, and the latency-axis width, not the architecture.

---

## Standing caveats

- No signal here is proven. Public "smart money predicts returns" claims are mostly
  anecdotal and survivorship-biased.
- Every wallet-based edge must clear an OUT-OF-SAMPLE forward test with realistic delay,
  slippage, and the exit modeled — before any capital.
- Structural strategies (funding/basis) fail differently from informational ones: not via
  late entry, but via yield compression, tail risk, and depeg/liquidation. Size accordingly.
- The floor to beat is staking. If net-of-risk return doesn't clear it, don't run it.
