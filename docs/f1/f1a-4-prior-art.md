# F1a-4 funding prior art (decision 37)

Read on 2026-10-28 UTC. Scope: Binance USD-M perpetuals BTCUSDT, ETHUSDT, SOLUSDT, XRPUSDT, DOGEUSDT, HYPEUSDT; target history 2021-10-18..2026-10-17. This is source discovery and a September 2025 sample, not a complete funding dataset, implementation plan, or backtest. No cross-source value comparison was performed.

Local context read: `docs/MAP.md`, `docs/findings.md`, the Funding and Intraday and swing rows of `docs/factory-spec-f1.md`, and section g of `docs/f1/f1a-3-plan.md` (table format below). Taken over from the task: F1 klines remain Vision-only (I59). F18 records that Vision is not self-consistent; this report does not establish funding consistency. The phase and next step are unchanged.

## Sources

F = fetched and read by this agent today (2026-10-28), with URL. N = named, not read; an unsuccessful fetch is not F. Use is a recommendation for this research, not an implementation or completeness claim.

| Source | Use | Reason | Status |
| --- | --- | --- | --- |
| Binance Vision funding archives | use | Public/no-key monthly files contain an explicit per-row interval; six retained samples. Full-window contents and integrity still unverified | F, [listing root](https://s3-ap-northeast-1.amazonaws.com/data.binance.vision?delimiter=/&prefix=data/futures/um/monthly/fundingRate/); exact fetched symbol URLs below |
| Binance REST fundingRate | use | Public/no-key history, settlement timestamps and associated mark price; only the requested three BTC records fetched | F, [legacy API documentation](https://developers.binance.com/legacy-docs/derivatives/usds-margined-futures/market-data/rest-api/Get-Funding-Rate-History), [GET sample](https://fapi.binance.com/fapi/v1/fundingRate?symbol=BTCUSDT&startTime=1756684800000&limit=3) |
| Binance REST fundingInfo | reference only | Adjusted funding settings, not a historical interval timeline | F, [legacy API documentation](https://developers.binance.com/legacy-docs/derivatives/usds-margined-futures/market-data/rest-api/Get-Funding-Rate-Info), [GET](https://fapi.binance.com/fapi/v1/fundingInfo) |
| binance/binance-public-data | reference only | Archive layout, publication cadence, checksums and republishing; README has no fundingRate schema section | F, [README](https://raw.githubusercontent.com/binance/binance-public-data/master/README.md) |
| Binance Vision dataset terms | reference only | Separate dataset terms matter; do not treat README's MIT label as a blanket data license | F, [terms](https://raw.githubusercontent.com/binance/binance-public-data/master/TERMS_AND_CONDITIONS.md), sections 1–7 read |
| ccxt | reference only | Unified history interface and raw info preservation; history schema example does not provide interval or mark-price fields | F, [Manual](https://raw.githubusercontent.com/wiki/ccxt/ccxt/Manual.md), funding structure/history sections |
| Freqtrade funding fees | reference only | Documents missing-rate handling and its inaccurate-backtest consequence; a fabricated zero is not evidence | F, [leverage documentation](https://raw.githubusercontent.com/freqtrade/freqtrade/stable/docs/leverage.md), unavailable funding rates and developer sections |
| NautilusTrader funding data | reference only | Explicit optional interval and next-funding metadata; a funding update does not imply a payment | F, [FundingRateUpdate](https://nautilustrader.io/docs/latest/concepts/data/funding_rate_update) |
| Tardis | reference only | Free first-day samples before paid access; derivative ticker is upcoming funding, not a settled-payment series | F, [Binance coverage](https://docs.tardis.dev/historical-data-details/binance-futures), [CSV schema](https://docs.tardis.dev/downloadable-csv-files/data-types.md#derivative_ticker), [quickstart](https://docs.tardis.dev/downloadable-csv-files/overview.md), [billing](https://docs.tardis.dev/faq/billing-and-subscriptions.md), sections cited below |
| Binance funding FAQ | reference only | Settlement clock, payment formula and boundary rules not verified: empty body/extraction after one retry | N, [FAQ](https://www.binance.com/en/support/faq/detail/360033525031) |
| Binance fee FAQ | reference only | Payment-price formula not verified: empty body/extraction after one retry | N, [fee FAQ](https://www.binance.com/en-PH/support/faq/detail/98488a516eb84e3eb34605683dffd554) |
| Binance settlement-frequency announcements | reference only | Found by web search; page fetches and one retry failed, so search snippets are not accepted as facts | N, [2025-05-02](https://www.binance.com/en/support/announcement/detail/3243c81a35bd4f0c86a37315c3dc96cc), [2026-01-02](https://www.binance.com/en/support/announcement/detail/e4445d0389ce4defa6009021fcf6ee46) |
| Binance Academy funding fees | reference only | Extra candidate; page extraction failed twice | N, [article](https://academy.binance.com/en/articles/what-are-funding-fees-in-crypto-markets) |

Discovery beyond the named sources: the dataset terms were linked from the Binance README; the Nautilus funding guide from its data overview; Tardis schemas, quickstart and billing from its documentation links. Binance announcements and the fee FAQ were found with web queries `site.binance.com funding fee settlement mark price 00:00 08:00 16:00 funding interval 1 hour` and `site.binance.com "Funding Fee" "Position Value" "Mark Price" funding`. A query `site.binance.com/en/academy funding fees mark price funding interval 8 hours` returned no results; the Academy candidate was a direct URL lookup. No library code was installed, imported, or run. No claim of an exhaustive prior-art search.

## Required inputs before any funding accounting

Reasoning from the spec's actual-interval requirement: an eventual dataset needs instrument identity (exchange, market, perpetual contract and settlement currency), historical settled rate, actual event timestamp, the interval applicable to that event with changes preserved, provenance/checksum, coverage and missing/duplicate-event status. Payment accounting additionally needs the documented price basis, price at the charge, position quantity/direction at that event, and an explicit event-order/boundary policy. OHLCV alone is not that contract.

Observed input status (sources: Vision samples and REST responses below):

- Vision sample: `calc_time`, `funding_interval_hours`, `last_funding_rate` present; symbol in archive path/member name. No payment price, position state, or explicit rate-type column in the quoted header. Timestamp units, interval semantics at a change, full-history row completeness and historical changes: not verified by these samples.
- REST fundingRate: symbol, settled-rate history fields, funding timestamp, associated mark price, and rate type present in the response. Per-event interval absent from the returned fields. Timestamp differences are locally derivable but do not by themselves distinguish missing records from changed schedules; no derived-interval substitution is made here.
- REST fundingInfo: current returned settings present for all six symbols; historical interval timeline not provided by this sample. `updateTime` is null for five of them. No constant interval is extrapolated backwards.
- Funding payment formula and exact event-order policy: not verified. Positions are future engine inputs, not provided by these data sources. Full-window completeness: not verified. No data here is promoted to backtest-ready.

## Vision: fetched listings

Method: public HTTPS S3 XML listing with `delimiter=/` and the exact symbol prefix, using `urllib.request` and `xml.etree.ElementTree` in Python 3. Each of the 12 responses was one non-truncated page and is retained in `~/f1a4-prior-art/<SYMBOL>-<monthly|daily>-listing-1.xml`. Counts refer to listed object keys, not CSV rows. Gaps below are calendar-month filename gaps between first and last listed monthly zip. CHECKSUM counts are listed sidecars; checksums were not downloaded or verified.

| Symbol | First monthly | Last monthly | Monthly ZIP / CHECKSUM keys | Internal monthly gaps | Daily ZIP / CHECKSUM keys |
| --- | --- | --- | --- | --- | --- |
| BTCUSDT | 2020-01 | 2026-09 | 81 / 81 | none | 0 / 0 |
| ETHUSDT | 2020-01 | 2026-09 | 81 / 81 | none | 0 / 0 |
| SOLUSDT | 2020-09 | 2026-09 | 73 / 73 | none | 0 / 0 |
| XRPUSDT | 2020-01 | 2026-09 | 81 / 81 | none | 0 / 0 |
| DOGEUSDT | 2020-07 | 2026-09 | 75 / 75 | none | 0 / 0 |
| HYPEUSDT | 2025-05 | 2026-09 | 17 / 17 | none | 0 / 0 |

Every listed monthly ZIP had a matching `<zip>.CHECKSUM` key. Daily prefixes returned no objects: first/last month and internal daily gaps are not applicable, not evidence of zero funding. Relative to the requested window, October 2026 is not listed monthly for any symbol and none has daily files to fill it. HYPE has no monthly files before 2025-05; its actual first settlement is not verified. Filename continuity does not establish row continuity.

Exact fetched listing URLs (form taken from `wiki/notes/2026-09-28-historical-orderflow-data-rails.md`):

- BTC: [monthly](https://s3-ap-northeast-1.amazonaws.com/data.binance.vision?delimiter=/&prefix=data/futures/um/monthly/fundingRate/BTCUSDT/), [daily](https://s3-ap-northeast-1.amazonaws.com/data.binance.vision?delimiter=/&prefix=data/futures/um/daily/fundingRate/BTCUSDT/).
- ETH: [monthly](https://s3-ap-northeast-1.amazonaws.com/data.binance.vision?delimiter=/&prefix=data/futures/um/monthly/fundingRate/ETHUSDT/), [daily](https://s3-ap-northeast-1.amazonaws.com/data.binance.vision?delimiter=/&prefix=data/futures/um/daily/fundingRate/ETHUSDT/).
- SOL: [monthly](https://s3-ap-northeast-1.amazonaws.com/data.binance.vision?delimiter=/&prefix=data/futures/um/monthly/fundingRate/SOLUSDT/), [daily](https://s3-ap-northeast-1.amazonaws.com/data.binance.vision?delimiter=/&prefix=data/futures/um/daily/fundingRate/SOLUSDT/).
- XRP: [monthly](https://s3-ap-northeast-1.amazonaws.com/data.binance.vision?delimiter=/&prefix=data/futures/um/monthly/fundingRate/XRPUSDT/), [daily](https://s3-ap-northeast-1.amazonaws.com/data.binance.vision?delimiter=/&prefix=data/futures/um/daily/fundingRate/XRPUSDT/).
- DOGE: [monthly](https://s3-ap-northeast-1.amazonaws.com/data.binance.vision?delimiter=/&prefix=data/futures/um/monthly/fundingRate/DOGEUSDT/), [daily](https://s3-ap-northeast-1.amazonaws.com/data.binance.vision?delimiter=/&prefix=data/futures/um/daily/fundingRate/DOGEUSDT/).
- HYPE: [monthly](https://s3-ap-northeast-1.amazonaws.com/data.binance.vision?delimiter=/&prefix=data/futures/um/monthly/fundingRate/HYPEUSDT/), [daily](https://s3-ap-northeast-1.amazonaws.com/data.binance.vision?delimiter=/&prefix=data/futures/um/daily/fundingRate/HYPEUSDT/).

## Vision: retained September 2025 samples

The new directory `~/f1a4-prior-art` was created successfully; no existing directory was overwritten. Each ZIP below is retained there with its URL basename. Python 3 `zipfile.ZipFile` read the CSV member; header and first three rows are quoted verbatim. `csv.reader` collected distinct `funding_interval_hours` values across each complete sample CSV. These are column values, not time differences. No row was compared with another source.

### BTCUSDT

Source: [BTCUSDT-fundingRate-2025-09.zip](https://data.binance.vision/data/futures/um/monthly/fundingRate/BTCUSDT/BTCUSDT-fundingRate-2025-09.zip). Distinct interval column values: `8`.

```csv
calc_time,funding_interval_hours,last_funding_rate
1756684800000,8,0.00004660
1756713600000,8,0.00010000
1756742400001,8,0.00004963
```

### ETHUSDT

Source: [ETHUSDT-fundingRate-2025-09.zip](https://data.binance.vision/data/futures/um/monthly/fundingRate/ETHUSDT/ETHUSDT-fundingRate-2025-09.zip). Distinct interval column values: `8`.

```csv
calc_time,funding_interval_hours,last_funding_rate
1756684800000,8,-0.00002114
1756713600000,8,-0.00001300
1756742400001,8,0.00000122
```

### SOLUSDT

Source: [SOLUSDT-fundingRate-2025-09.zip](https://data.binance.vision/data/futures/um/monthly/fundingRate/SOLUSDT/SOLUSDT-fundingRate-2025-09.zip). Distinct interval column values: `8`.

```csv
calc_time,funding_interval_hours,last_funding_rate
1756684800000,8,0.00009019
1756713600000,8,0.00000792
1756742400001,8,0.00002302
```

### XRPUSDT

Source: [XRPUSDT-fundingRate-2025-09.zip](https://data.binance.vision/data/futures/um/monthly/fundingRate/XRPUSDT/XRPUSDT-fundingRate-2025-09.zip). Distinct interval column values: `8`.

```csv
calc_time,funding_interval_hours,last_funding_rate
1756684800000,8,0.00001990
1756713600000,8,0.00009743
1756742400001,8,0.00009251
```

### DOGEUSDT

Source: [DOGEUSDT-fundingRate-2025-09.zip](https://data.binance.vision/data/futures/um/monthly/fundingRate/DOGEUSDT/DOGEUSDT-fundingRate-2025-09.zip). Distinct interval column values: `8`.

```csv
calc_time,funding_interval_hours,last_funding_rate
1756684800000,8,0.00009890
1756713600000,8,0.00005901
1756742400001,8,0.00010000
```

### HYPEUSDT

Source: [HYPEUSDT-fundingRate-2025-09.zip](https://data.binance.vision/data/futures/um/monthly/fundingRate/HYPEUSDT/HYPEUSDT-fundingRate-2025-09.zip). Distinct interval column values: `4`.

```csv
calc_time,funding_interval_hours,last_funding_rate
1756684800000,4,0.00005000
1756699200005,4,0.00005000
1756713600000,4,0.00005000
```

## REST documentation and public responses

The original `/docs/derivatives/...` documentation URLs produced empty content both through the page reader and a direct HTTP retry. The `/legacy-docs/derivatives/...` pages were subsequently discovered and read. They explicitly label themselves legacy documentation. No key or account was used for the two API calls.

### GET /fapi/v1/fundingRate

Source: [fetched legacy documentation](https://developers.binance.com/legacy-docs/derivatives/usds-margined-futures/market-data/rest-api/Get-Funding-Rate-History).

- Optional parameters: `symbol` STRING; `startTime` LONG inclusive milliseconds; `endTime` LONG inclusive milliseconds; `limit` INT default 100, maximum 1000.
- Documentation separately says that without startTime and endTime the most recent 200 records are returned. This default case was not called.
- Ascending order; if the range exceeds limit, documentation says return `startTime + limit`.
- Shares a `500/5min/IP` rate limit with fundingInfo. No separate numerical weight is stated in the fetched fundingRate section.
- Documented example fields: `symbol`, `fundingRate`, `fundingTime`, `markPrice`, `rateType`. The mark-price comment is “mark price associated with a particular funding fee charge”. `rateType` distinguishes Regular from Special (additional funding generated by stock dividends, per the example comment).

One public GET: <https://fapi.binance.com/fapi/v1/fundingRate?symbol=BTCUSDT&startTime=1756684800000&limit=3>. Raw body, retained as `~/f1a4-prior-art/fundingRate.json`:

```json
[{"symbol":"BTCUSDT","fundingTime":1756684800000,"fundingRate":"0.00004660","markPrice":"108208.30000000","rateType":"Regular"},{"symbol":"BTCUSDT","fundingTime":1756713600000,"fundingRate":"0.00010000","markPrice":"109367.80000000","rateType":"Regular"},{"symbol":"BTCUSDT","fundingTime":1756742400001,"fundingRate":"0.00004963","markPrice":"108737.90000000","rateType":"Regular"}]
```

This request demonstrates three records from one month for one symbol, not full-window REST availability or historical intervals.

### GET /fapi/v1/fundingInfo

Source: [fetched legacy documentation](https://developers.binance.com/legacy-docs/derivatives/usds-margined-futures/market-data/rest-api/Get-Funding-Rate-Info).

- Description: symbols that had FundingRateCap / FundingRateFloor / fundingIntervalHours adjustments.
- No parameters listed. Weight `0`; shares `500/5min/IP` with fundingRate.
- Example fields: `symbol`, `adjustedFundingRateCap`, `adjustedFundingRateFloor`, `fundingIntervalHours`, `disclaimer` (comment says ignore).

One public GET: <https://fapi.binance.com/fapi/v1/fundingInfo>. Only the six requested symbols are quoted below, in response order; values preserved, JSON whitespace reformatted. The response also contains `updateTime`. The raw response is retained locally as `~/f1a4-prior-art/fundingInfo.json` and is not committed.

```json
[
  {"symbol":"HYPEUSDT","adjustedFundingRateCap":"0.02000000","adjustedFundingRateFloor":"-0.02000000","fundingIntervalHours":4,"disclaimer":false,"updateTime":1748601134819},
  {"symbol":"ETHUSDT","adjustedFundingRateCap":"0.00300","adjustedFundingRateFloor":"-0.00300","fundingIntervalHours":8,"disclaimer":true,"updateTime":null},
  {"symbol":"XRPUSDT","adjustedFundingRateCap":"0.00375","adjustedFundingRateFloor":"-0.00375","fundingIntervalHours":8,"disclaimer":true,"updateTime":null},
  {"symbol":"BTCUSDT","adjustedFundingRateCap":"0.00300","adjustedFundingRateFloor":"-0.00300","fundingIntervalHours":8,"disclaimer":true,"updateTime":null},
  {"symbol":"SOLUSDT","adjustedFundingRateCap":"0.00375","adjustedFundingRateFloor":"-0.00375","fundingIntervalHours":8,"disclaimer":true,"updateTime":null},
  {"symbol":"DOGEUSDT","adjustedFundingRateCap":"0.004875","adjustedFundingRateFloor":"-0.004875","fundingIntervalHours":8,"disclaimer":true,"updateTime":null}
]
```

## Binance settlement documentation: limits of this lookup

- Settlement times: **not verified** from a readable Binance settlement page today. The [funding FAQ](https://www.binance.com/en/support/faq/detail/360033525031) and [Academy article](https://academy.binance.com/en/articles/what-are-funding-fees-in-crypto-markets) failed after one retry. Do not elevate the familiar eight-hour schedule into a universal rule.
- Payment price: the [fundingRate API documentation](https://developers.binance.com/legacy-docs/derivatives/usds-margined-futures/market-data/rest-api/Get-Funding-Rate-History) explicitly associates `markPrice` with a funding fee charge. The complete notional/payment formula and applicable boundary rules are **not verified**, because the [fee FAQ](https://www.binance.com/en-PH/support/faq/detail/98488a516eb84e3eb34605683dffd554) could not be read after a retry. No trade-price/mark-price substitution is selected.
- Interval changes: their exact trigger, effective time and reversal policy are **not verified**. The [May 2025](https://www.binance.com/en/support/announcement/detail/3243c81a35bd4f0c86a37315c3dc96cc) and [January 2026](https://www.binance.com/en/support/announcement/detail/e4445d0389ce4defa6009021fcf6ee46) announcements were found but not read after failed fetch/retry. The readable fundingInfo documentation establishes that interval adjustments are a supported category; it does not supply a historical timeline.

## Prior-art facts

### Binance public data

[README](https://raw.githubusercontent.com/binance/binance-public-data/master/README.md): daily data is described as available the next day and monthly data on the first Monday; every ZIP has a CHECKSUM sidecar; archives may later be updated. It documents helper download scripts but no fundingRate header. The funding schema in this report comes from actual ZIPs, not an inferred kline schema.

[Dataset terms](https://raw.githubusercontent.com/binance/binance-public-data/master/TERMS_AND_CONDITIONS.md), version 1.0, updated August 26, 2026: sections 2–4 state free access, CC BY-NC-SA 4.0, non-commercial personal non-production historical backtesting, separate written permission for commercial use, and attribution/share-alike for redistributed derivative works. These are quoted as fetched terms, not a legal conclusion. Sample data attribution: Binance Vision; quoted dataset excerpts retain the stated CC BY-NC-SA 4.0 terms. No bulk dataset is committed.

### ccxt

[Manual funding sections](https://raw.githubusercontent.com/wiki/ccxt/ccxt/Manual.md): `fetchFundingRateHistory(symbol = undefined, since = undefined, limit = undefined, params = {})`; `since` is an earliest timestamp, `limit` a maximum record count, and params can carry exchange-specific `endTime`. History structure example has `info`, `symbol`, `fundingRate`, `timestamp`, `datetime`. Its separate Funding Rate Structure example has `markPrice`, funding timestamps and `interval: '8h'`. That example is not a guarantee of historical per-event intervals. No ccxt adapter was executed and its Binance retention/pagination behavior is not verified. The first attempted repository raw URL returned 404; the wiki raw Manual was readable.

### Freqtrade

[Leverage documentation](https://raw.githubusercontent.com/freqtrade/freqtrade/stable/docs/leverage.md), “Unavailable funding rates”: historical candles/marks may exist when rates do not. `futures_funding_rate` can fill unavailable rates; the documentation explicitly warns “This will mean your backtests are inaccurate.” It does not overwrite available exchange rates. Developer/Futures mode says funding fees are added to or subtracted from the total trade amount. Recommendation (reasoning): retain missingness instead of adopting the zero fallback for an evidence-grade F1 dataset. The rendered site returned 403; the raw documentation was readable.

### NautilusTrader

[FundingRateUpdate](https://nautilustrader.io/docs/latest/concepts/data/funding_rate_update): required instrument ID, decimal rate, event and initialization timestamps; optional interval in **minutes** and next funding timestamp in **nanoseconds**. Rates are cached by instrument. The documentation explicitly says “Funding rates are reference data and do not imply a payment was applied” and to use interval/next-funding only when published by the venue. The page reader initially extracted only its code example; a direct HTML read exposed the field/behavior text. Nothing here proves a historical Binance downloader or funding-accounting implementation.

### Tardis: free first, paid not activated

[Quickstart](https://docs.tardis.dev/downloadable-csv-files/overview.md) and [billing](https://docs.tardis.dev/faq/billing-and-subscriptions.md): first day of each month is available without a Data API key; a separate account/key-based trial covers limited dates. No trial, key or subscription was created. Billing documentation describes subscription-dependent historical access; the displayed yearly-billing table gives four years for Academic/Solo/Professional and all available history for Business. Exact price and redistribution license: not verified. Five-year access must not be assumed from a generic subscription label. No Tardis dataset GET was made: workspace data access remains not verified; this was documentation-only as requested.

[CSV derivative_ticker schema](https://docs.tardis.dev/downloadable-csv-files/data-types.md#derivative_ticker): exchange/symbol, timestamp and local_timestamp in microseconds, funding_timestamp, funding_rate, predicted_funding_rate, open_interest, last_price, index_price, mark_price. Funding timestamp is the next event; funding rate can fluctuate until it occurs, and the last observed value can differ from the settled rate. Recommendation (reasoning): reject this stream as a direct substitute for settled funding charges; retain it as reference only.

[Binance coverage page](https://docs.tardis.dev/historical-data-details/binance-futures): overall exchange history stated since 2019-11-17, not proof of any particular symbol's complete coverage. The `fundingInfo` generated channel is documented since 2026-03-17, sampled every minute. The `fundingRate` generated channel is documented since 2026-10-16, at startup and hourly HH:05 UTC, latest 1000 settlements across all symbols; records repeat and recording interruptions can lose events leaving that window. These are vendor documentation claims, not independently replayed data. No cross-source comparison was performed.

## Open questions for F1a-4

1. How will October 2026 and HYPE's pre-first-file period be classified? Listings establish absence of files, not absence of settlements. Full-window REST retrieval was not attempted.
2. What is the precise semantic association of `funding_interval_hours` at a schedule change: preceding accrual period or following schedule? Find authoritative documentation and actual transition rows; do not use the September sample or current fundingInfo as a constant.
3. What payment price and event-order rule will the contract use? Obtain readable Binance settlement/formula documentation. The spec currently says mark price matters only for liquidation, while the API documents a mark price associated with funding charges; resolve this documentation question before implementation, without changing the spec in this report.
4. How will raw timestamp offsets, duplicate events, absent rows, possible special rate types and boundary events be handled? The quoted samples preserve timestamp offsets; no normalization or tolerance was chosen.
5. How will CHECKSUM verification, republished files, per-event coverage and within-source consistency be established? Listed sidecars and six readable ZIPs are not acceptance evidence for the full history (F18).
6. How will research and sealed holdout funding be stored and guarded? Only September 2025 values were read here; full history through 2026-10-17 remains future ingestion work.
7. Is any library justified? Current evidence supports direct archive/API source investigation; ccxt, Freqtrade and Nautilus documentation offer interfaces and pitfalls, not demonstrated complete inputs. Tardis remains a documentation-only, free-first candidate, not an active dependency.
8. Before any broader redistribution or production use, how will the fetched dataset terms and vendor access limits be satisfied? No new rights, paid access or commercial use are assumed.

Only this report changes the repository. Runtime, cron, timers, v1 and short watchers were not modified; runtime/repository hash equality was not independently checked in this documentation-only task.
