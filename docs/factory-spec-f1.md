# RALPH strategy factory spec (F1)

Approved v2 on 2026-10-18 by Tomas, after three independent reviews. Repo copy of the Claude doc; the funnel diagram is given here as a list.

## Goal and scope

The factory turns strategy ideas into verdicts under a fixed statistical budget: every trial is counted, and the number of trials is capped by how fast the pass bar rises, not by compute or Codex quota. F1 is done when the funnel runs on a schedule without Tomas, every report carries the robustness and statistics block of this spec, and frozen candidates can reach a holdout whose protection is enforced in code.

Hard boundaries:

- Research and paper only: no orders, no keys, no change to v1 alerts or the short watchers (R1).
- V6 stays blind: nothing reads V6-window paper or shadow outcomes (state-of-edge, shadow-PnL, watch-row) before the V6 evaluation after 2026-11-15. Historical bars and V6 outcomes stay separate.
- The locked holdout (2025-10-17 to 2026-10-17) opens only for a frozen candidate with a pre-registration hash, one recorded look, inside a fixed budget of looks. Today H2 enforces only `--final` plus a matching registry row; phase F1c closes that gap before any look.
- Data after 2026-10-17 is sealed as the next forward test period; research windows never extend into it.
- Candle strategies first (the intraday/swing class of I52). Tick strategies (exact CVD, footprint, cluster search I26, burst detector I04) wait for tick data (H4).
- Standing rules from Tomas apply to every strategy: the HTF trend is the overarching context, mainly BTC daily and weekly; TA is always part of a strategy; entries are refined on lower timeframes.

## Current state

The harness already runs 398 variants in 206 s with a 94 MiB memory peak; what it lacks is breadth of data, a real walk-forward, HTF context, enforced holdout protection, a sound trial count and scheduling. Checked in the repo at b194864; all code is in `experiments/strategy-destruction-filter`.

| Piece | What exists | Limit for the factory |
| --- | --- | --- |
| Engine (H1, dc420bf) | Node candle engine `src/engine.mjs`; entry at signal close or next open; stop 1.2 ATR, target 1.8 R; costs 4 bps fee + 3 bps slippage per side (14 bps round trip) | One entry family; stop and target inside one 4h bar resolved without intrabar data; no limit entries; the 4 bps fee is below the Binance USD-M regular taker fee of 5 bps |
| Windows and holdout (H2, a59af2f) | Research 2021-10-18 to 2025-10-17; holdout locked to 2026-10-17; `guardHoldout` requires `--final` and a research registry row with the same identity; content-addressed snapshots; append-only registry | No written pre-registration and no single-look record; identity has no exchange, market or rule-code hash; snapshot lookup ignores the market, so a spot snapshot would answer a futures request |
| Queue (H3a, 9e5bfd3) | Ordered queue of existing grids, cap 600, one child process per backtest, checkpoints; 398 run, 17 pass, 0 errors, 206 s; peak 94 MiB under a 1 GiB / 50 % CPU cgroup | Started by hand; no new hypotheses; 8 existing rule names; inputs must cover the whole research window, so a short history is rejected |
| Evaluation | Purged-embargo 70/30 split; 5 equal-trade-count chronological folds; time-matched alternating-direction baseline; slices by trend (MA20/MA50) × volatility (ATR %); gates such as min 80 trades, PF ≥ 1.15, expectancy ≥ 0.05 R, max drawdown 18 R | Folds split existing trades, no re-selection; trend is the symbol's own timeframe, not BTC daily/weekly; the Sharpe behind the deflated-Sharpe proxy is per trade × √n with overlapping trades |
| Trial count | 919 = distinct variants found in selected reports (`filter-report.json`, `strategy-spam-*.json`) + the queued batch | Not read from the full registry; no correction for correlated variants |
| Data | Binance spot candles, frozen snapshots only for BTC 4h and SOL 4h (H3a lists BTC 1h, SOL 1h, ETH and HYPE as unavailable) | Our datasets are USD-M futures (I10); no 1m, 15m, ETH or HYPE snapshots |

The 17 H3a passes were selected on grids explored before this window, so they are research leads, not validated strategies (I08).

## The funnel

Six stages, one gate each: the first three run on their own every day, the holdout is a deliberate single look, and the last two test execution reality. Every run, pass or fail, is one registry row and one counted trial.

0. Generate: H3c writes hypothesis specs; grids expand them into variants (VPS, daily AI cron). Gate to the next stage: novel, valid schema, inside the trial budget.
1. Sieve: candle backtest on the research window, existing gates (VPS, nightly timer H3b). Gate: passes all sieve gates after costs.
2. Robustness (I48): locked walk-forward, regime and BTC-trend slices, 2× costs (VPS, nightly timer H3b). Gate: stitched out-of-sample passes; DSR ≥ 0.95 on effective trials.
3. Holdout: frozen candidate, pre-registration hash, one recorded look (VPS, started by hand, once). Gate: meets criteria written before the run.
4. Realistic replay: NautilusTrader with 1m bars, fees and latency, S5 (PC). Gate: survives realistic fills and latency.
5. Demo-sim: forward paper on live data, pre-registered like V6 (VPS, live collectors).

A variant moves down only through its gate. A rejection is final for that variant but stays in the registry, so every later trial faces a higher bar.

## Context and entries

Every variant is built in three layers, and the entry style is its own variant axis so the factory can compare catching the wick with waiting for confirmation.

1. Context (weekly, daily): BTC weekly and daily trend state, then the symbol's own HTF trend. A variant declares which context it trades in (for example longs only when BTC daily and weekly are up); the context filter counts as a parameter.
2. Setup (4h, 1h): price at a key level from the building blocks below, with the setup rule (breakout, reclaim, sweep, reversion).
3. Entry (15m, 5m, 1m): one of the entry styles below, simulated on 1m bars.

| Entry style | Trigger | Fill rule in the backtest |
| --- | --- | --- |
| `limit_at_level` (catch the wick) | Resting limit at the level once the setup is armed | Filled only if a 1m bar trades through the level; untouched orders expire after N bars and count as misses |
| `confirm_close` | Close back beyond the level on the trigger timeframe | Next 1m open after the close |
| `confirm_sfp` | Sweep beyond a confirmed swing, close back inside | Next 1m open after the close |
| `confirm_bos` | Lower-timeframe break of structure after a sweep | Next 1m open after the break |
| `confirm_retest` | Level broken, retested and held | Next 1m open after the hold candle |
| `next_open`, `signal_close` (existing) | Signal bar close | As today (H1) |

Per style the report shows fill rate, R per filled trade and missed moves (setups that would have won but were not filled). 1m bars are not tick data: when stop and target both fall inside one 1m bar the trade is marked `ambiguous_fill` and the stop counts first; a limit counts as filled only when price trades through it, and touch-only cases are reported as optimistic. No report calls 1m replay tick-accurate.

## TA building blocks

Each block is one shared function used by the backtest and later by live code (I52 parity), and each must pass a lookahead test: changing any future bar must not change a single past value.

| Block | Definition | Known at bar t only if |
| --- | --- | --- |
| HTF trend | Trend state from MA and swing structure on daily and weekly bars, BTC and the symbol | Computed from closed HTF bars; the current week counts only after it closes |
| Swings, market structure | Pivot highs and lows with k bars each side; higher highs / lower lows | A pivot exists from bar pivot + k, never earlier |
| SFP, fakeout, liquidity sweep | Wick beyond a confirmed swing, close back inside | The swing was confirmed before the sweep bar |
| Key levels | Previous day and week high/low, weekly and monthly open, round numbers (step per symbol), HTF support/resistance from confirmed swings | The period that defines the level has closed |
| Fib | Retracements between the last two confirmed swings | Both swings are confirmed |
| VWAP | Session VWAP (UTC day) and anchored VWAP from a confirmed swing, typical price × volume from 1m bars | Uses bars up to t |
| Volume profile (approximation) | 1m volume spread across each bar's range; daily POC, VAH, VAL; naked POC = not revisited since | The day has closed; naked status updated bar by bar |
| Confluence score | Number of levels within x ATR of price, optionally weighted | Every input level is known at t |

Block parameters (k, x, round-number step, weights) are variant parameters and count as trials. Needs tick data (H4), not in F1: exact CVD, footprint, cluster search (I26). A 1-minute delta approximation from kline taker buy volume is available earlier (see Data plan).

## Robust evaluation

A variant counts only if a selection procedure fixed in advance wins out of sample, clears a pass bar computed on effective trials, and stays profitable after realistic costs. The walk-forward protocol and the statistical contract below are written and locked before F1b runs, never tuned on results.

Walk-forward protocol:

- Primary: choose on 12 months, test on the next 3, roll by 3. The research window gives 12 test windows from 2022-10-18 to 2025-10-17; the report lists their calendar boundaries.
- It tests the selection procedure (family + selection rule), not one variant. The report shows the procedure and, separately, each fixed variant over all windows. A holdout candidate is the variant the procedure picks on the last 12 research months, frozen with the procedure's stitched result.
- Selection happens inside the training window only, by a metric fixed in advance; it takes the centre of a stable plateau (neighbours one step away also pass), not the single best; "nothing qualifies" is a valid outcome.
- Leakage: trades opened in a training window that close in the test window are purged; indicators warm up on training data only; positions open at a window end close at that end.
- Judgement uses the stitched out-of-sample result with its own minimum trade count. Window consistency counts only windows with at least N trades; the rest are greyed.
- One sensitivity, locked now: an expanding training window with the same 3-month tests. It is reported, never used to choose.
- Hypotheses written with knowledge of research-window results are labelled retrospective; walk-forward cannot remove that knowledge.

Statistical contract:

- Returns: daily equity returns, so overlapping trades are handled; the per-trade Sharpe is no longer used for the bar.
- Trials: raw N from the full registry history across markets, so the 919 spot trials carry over to futures. Effective N comes from clustering the correlation of trials' daily returns (López de Prado); raw N is reported beside it.
- Bar: deflated Sharpe ratio ≥ 0.95 on effective N. Out-of-sample expectancy after costs > 0, PF ≥ 1.15 and max drawdown ≤ 18 R remain necessary conditions.
- Trial budget: a monthly cap on new trials, set after F1b from how fast the bar rises; the H3c limits follow from it.
- Test of the test: hundreds of null research campaigns (random strategies through the whole funnel); the false-pass rate must be ≤ 5 %.
- The registry separates reserved grid size, evaluated unique trials and technical repeats; an exact rerun is not a new trial.

Slices and periods:

- Slices: trend and volatility regime (existing), BTC daily trend, BTC weekly trend, long vs short, symbol. Below its minimum trade count a slice is greyed, not judged.
- Latest research period: the last 6 months of the research window (2025-04-17 to 2025-10-17). It is over a year old, so it is not current performance; only forward data after 2026-10-17 shows that.

Costs depend on the strategy class (I52), and a class whose round-trip cost exceeds its typical target cannot exist:

| Class | Holding time | Cost model in the backtest |
| --- | --- | --- |
| Intraday and swing (F1) | Minutes to days | Binance USD-M regular taker 5 bps + 3 bps slippage per side (16 bps round trip); every report also at 2× costs. Funding from the funding-rate history with each contract's actual interval (some settle every 4 h, others every 8 h). Stops trigger on trade price; mark price matters only if liquidation is modelled, which F1 does not |
| Fast scalps (later) | Seconds | Maker fees and limit fills only; the example of $2 on $3,000 is 0.067 %, so round-trip costs must stay below that |
| HFT (out of F1) | Sub-second | Needs a latency model and book data (H4, hftbacktest) |

## Data plan

F1 moves the harness from Binance spot 4h snapshots to Binance USD-M futures 1m klines (BTC, ETH and SOL as the core, XRP and DOGE as cross-checks, HYPE for information only), aggregated to every higher timeframe in one tested place. Binance Vision publishes USD-M klines (same data as `/fapi/v1/klines`) in daily and monthly files for all intervals, each with a SHA-256 checksum file ([binance-public-data](https://github.com/binance/binance-public-data)).

| Item | Plan |
| --- | --- |
| Core symbols | BTC, ETH, SOL; verdicts use these. They are not three independent markets, so cross-checks still matter |
| Cross-check symbols | XRP, DOGE from the start: robustness across symbols is the cheapest test against overfitting |
| HYPE | Binance listed the perpetual on 2025-05-30, about 4.5 months before the research window ends, so the 12/3 walk-forward has no full window. Status `insufficient_history`, information only; its windows are never shortened. A transfer test needs its own pre-registration |
| Data identity | Exchange, market type and contract join the snapshot lookup and the registry identity before the first futures snapshot, so a spot snapshot can never answer a futures request |
| Period | 2021-10-18 to the latest full day; holdout months stored but sealed; data after 2026-10-17 sealed as the next test period |
| Base data | 1m klines, monthly files plus daily files for the current month; checksum verified on download |
| Aggregation | One aggregator 1m → 5m, 15m, 1h, 4h, 1d, 1w (UTC). Acceptance: OHLCV equal to Binance's own 1h and 4h futures klines on every compared bar, count reported |
| Memory | Five years of 1m is about 2.6 M bars per symbol, too much as JS objects inside the 1 GiB cgroup. Columnar typed arrays, or 1m loaded only around armed setups; F1a and F1e acceptance include a memory peak ceiling |
| Funding | Funding-rate history with each contract's actual settlement interval, read from the data, not a constant |
| Delta proxy | Klines include taker buy volume, so a 1-minute delta and CVD approximation exists before tick data; exact CVD still needs H4 |
| Spot | Existing spot snapshots stay as a pre-defined comparison, never as independent confirmation of a futures result |
| Storage | Compressed snapshots on the Storage Box, a bounded cache on the VPS; F1a measures sizes on one month before the full download (disk 16.2 % free, I44) |
| Archive changes | Binance sometimes replaces archived files; a changed checksum creates a new snapshot, never a silent overwrite (H2 rule) |

## Automation

Running backtests is deterministic and goes on a systemd timer (H3b); only writing new hypotheses uses AI, once a day through OpenClaw cron (H3c). This follows the S3 rule: deterministic work on systemd, AI work on OpenClaw cron with a failure alert.

H3b, the queue timer:

- A systemd user timer starts the existing `src/run-queue-r6.sh` once a night inside the same cgroup as H3a (1 GiB, 50 % CPU). The existing caps stay: at most 600 variants and 90 minutes per run; an interrupted item or a held lock stops the run.
- Before running, a deterministic validator moves new hypothesis specs from the inbox into the queue (H3c below).
- Non-zero exit sends one Telegram alert through the same path as the disk alert; an empty queue exits quietly.
- A weekly summary lists runs and passes per family, the top rejection reasons, the trial count and the data snapshot hashes. It never contains V6-window paper or shadow numbers.

H3c, the hypothesis cron:

- Pilot for the first 3 weeks: at most 2 specs per day, 20 variants per spec, 40 new variants per day. After that the limits follow the monthly trial budget from the statistical contract, never the Codex quota.
- One isolated OpenClaw run per day writes specs as JSON files into an inbox. A spec names family, context filter, setup rule, building blocks with parameter grids, entry styles, directions, symbols and timeframes, and states its mechanism, its baseline and the result that would reject it, with a source (a rule from Tomas, a ledger item, an earlier result).
- Novelty: a spec must differ from earlier ones by family or context; a parameter shift alone is rejected. Specs that react to earlier results are labelled adaptive, because the trial count only partly captures that kind of data snooping.
- The validator rejects a spec that fails the schema, repeats a registry identity or exceeds the budget. Its full grid size is counted before anything runs.
- Generation pauses while the queue holds more than two measured nightly runs.
- Tomas reviews the week's specs every week for the first 3 weeks.
- The AI never edits engine code, gates, costs or windows, and never reads holdout or V6-window results.

Both jobs get entries in the existing `automation/loop-registry.yaml` (schedule, owner, alert, what each may read and write). The registry stays append-only JSONL until tick data (I37).

## Where it runs

The candle stages fit on the VPS, but only after the memory pressure in I56 is understood; the realistic replay belongs on the PC.

| Stage | Where | Why |
| --- | --- | --- |
| Sieve and robustness (H3b, H3c) | VPS, nightly, inside the 1 GiB / 50 % CPU cgroup | H3a peaked at 94 MiB; data and Storage Box are close. Blocker: at 15:07Z the VPS had 898 MiB of 3.7 GiB RAM available and 1.8 of 2.0 GiB swap in use |
| 1m download and aggregation (F1a) | VPS, one symbol-month at a time, streamed to the Storage Box | Keeps memory bounded and local disk free (13 GB, I44) |
| Realistic replay (NautilusTrader) | PC as a batch worker (S5), on hash-verified snapshots from the Storage Box | NautilusTrader 2.0.0rc6 is pinned there. Its main value is parity with future live code, not more accuracy than F1's 1m fills, so the S5 spec must avoid two engines doing the same job. A small agreement test between both engines runs during F1. PC off never affects collectors, alerts or the registry |
| Demo-sim | VPS, existing paper path | Needs the 24/7 live collectors |

Guards for every factory job: start only if available memory is above a set floor, and split work so no run exceeds the existing 90-minute cap. 1m entries across 12 walk-forward windows can cost two orders of magnitude more per variant than H3a, so thousands of variants per night are not expected; the trial budget does not want them either. F1b measures the real cost.

## Rollout

Eight phases, each one agent prompt with its own commit and acceptance check. Data comes first because every later phase needs 1m futures bars, and the holdout guard is built before anything may look at the holdout.

1. F0, machine check (read-only): RAM and swap per process (I56), disk reserve and I/O load, and a restore test of one archived file from the Storage Box.
    - Accept: a per-process table, disk and I/O numbers, a restored file with matching SHA-256, a proposed free-memory floor.
2. F1a, data: first the data identity (exchange, market, contract) in snapshot lookup and registry; then 1m futures klines for BTC, ETH, SOL, XRP, DOGE and HYPE, the aggregator, funding-rate history with intervals.
    - Accept: every checksum verified; aggregated 1h and 4h equal to Binance's own futures klines on every compared bar, with the count; coverage per symbol; sizes; memory peak under the ceiling; a test proving a spot snapshot cannot answer a futures request; holdout and post-2026-10-17 months sealed.
3. F1b, evaluation and statistics: the walk-forward protocol and statistical contract committed as a document before any code, then implemented.
    - Accept: false-pass rate ≤ 5 % over hundreds of null campaigns; a planted edge is found; trial count read from the full registry; the H3a grid rerun on futures 4h with a diff against spot; CPU time per variant measured.
4. F1c, holdout guard in code: a pre-registration file and its hash required, an atomic record of the single look, refusal of any second evaluation of that identity, a total look budget, identity including market and rule-code hash.
    - Accept: tests show refusal without pre-registration, on a second look and after the budget is spent.
5. F1d, building blocks and context (I49): one shared module.
    - Accept: the lookahead test passes for every block (count reported); bar-by-bar computation equals batch computation for every block.
6. F1e, entry styles (I51): 1m intrabar fills, limit and confirmation styles, `ambiguous_fill` with stop first.
    - Accept: a hand-built fixture per style; fill rate, R per trade and missed moves per style; memory peak under the ceiling.
7. F1f, H3b timer: validator, nightly run, failure alert, weekly summary, loop-registry entry.
    - Accept: one forced failure gives exactly one alert; seven nightly runs with the registry prefix preserved.
8. F1g, H3c hypothesis cron in pilot mode.
    - Accept: invalid, duplicate and parameter-shift-only specs rejected in tests; trial count rises by each grid's size; pilot limits hold for 3 weeks.

I08 runs after F1c: A and B are first recomputed with frozen rules on the futures research window, and only survivors get pre-registered holdout looks; C goes to forward testing only. After F1, the NautilusTrader stage (S5) and the demo-sim stage get their own spec.

## Decisions (approved by Tomas on 2026-10-18)

After three independent reviews on 2026-10-18, six of the seven proposals changed; the biggest change is a statistical trial budget in place of volume as the goal. Tomas approved all seven on 2026-10-18.

| # | Decision | Decision after the reviews | Blocks |
| --- | --- | --- | --- |
| D1 | Futures instead of spot as the harness default (I10) | Futures primary, spot a pre-defined comparison; costs 5 + 3 bps per side, every report also at 2× costs; spot trials carry over into the trial count | F1a |
| D2 | Symbols | Core BTC, ETH, SOL; cross-check XRP, DOGE; HYPE information only (`insufficient_history`) | F1a |
| D3 | Walk-forward | 12/3/3 primary with the locked protocol (selection inside the training window, plateau centre, purge, stitched out-of-sample with a minimum trade count); expanding window as the one locked sensitivity; holdout candidate = the procedure's pick on the last 12 research months | F1b |
| D4 | Pass bar | Deflated Sharpe ratio ≥ 0.95 on effective N from daily equity returns, fixed before F1b; economic gates stay; false-pass rate ≤ 5 % on null campaigns | F1b |
| D5 | H3c limits | Pilot of 2 specs a day, ≤ 20 variants per spec, ≤ 40 a day for 3 weeks with a weekly review by Tomas; then a monthly trial budget set after F1b | F1g |
| D6 | Where NautilusTrader runs (S5) | PC batch worker on hash-verified snapshots; parity with live code is its purpose; agreement test during F1 | after F1 |
| D7 | Holdout | Only frozen candidates, only after F1c; A and B recomputed on the futures research window first; C forward only; minimum trade count and a Bonferroni correction across looks; a total look budget for the 2025/26 holdout (proposal: 5) | F1c |

## Out of scope

Not in F1: tick and order-book strategies (I04, I26, exact CVD), market making and DEX arbitrage (I11), copytrading (I29), the HFT and fast-scalp classes, any live execution, and any change to v1 alerts or the short watchers. V6 data stays closed until its evaluation.

## Sources

- [binance-public-data](https://github.com/binance/binance-public-data): Binance Vision kline files, intervals and checksums.
- [Binance futures fee structure](https://www.binance.com/es/support/articles/360033544231): regular USD-M maker 0.02 %, taker 0.05 %, 10 % off with BNB.
- [Bloomingbit, Binance lists HYPE perpetual futures](https://en.bloomingbit.io/feed/news/89258): trading start on the 30th; the full date is checked in F1a against the first available Binance Vision file.
- Repo code at b194864: `h2-contract.mjs` (guardHoldout, identityFor, cachedSeries), `research-queue.mjs` (inputIssues, historicalCounts), `engine.mjs` (statsForTrades, walkForwardDiagnostics).
