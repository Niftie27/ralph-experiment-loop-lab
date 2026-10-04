# Shadow PnL Ledger

Generated: 2026-10-04T08:04:46.320Z

Status: research-only shadow ledger over finalized tradable alert plans. No live trading, orders, keys, paid APIs, cron, watcher behavior, alert wording, risk, sizing, TP/SL, or execution changed.

## Caveats

- Uses recorded alert feedback and checkpoint/min/max fields only.
- If both TP and SL are inside the reviewed range, the ledger records stop-first ambiguity conservatively.
- Time exits use the alert-time 30m checkpoint as an approximation, not exact fill-time replay.
- Gross PnL excludes fees, slippage, queue position, latency, and exchange execution constraints.

## Decision

- Verdict: shadow_negative_or_unproven
- Candidate added: false
- Rationale: Filled shadow rows=75, gross PnL=-1430 USD before fees/slippage; target hits=29, stop-like outcomes=46.
- Next: Use this as a ledger input to autoresearch; do not promote alert wording, paper trading, or live execution from shadow PnL alone.

## Totals

- Tradable plans: 92
- Filled: 75
- No fill or skipped: 17
- Target hits: 29
- Stop hits: 25
- Ambiguous stop-first: 21
- Time exits: 0
- Gross PnL: -1430 USD
- Filled win rate: 0.3867

## Groups

- WICK|ETH|5s|UP|SHORT: sample=14, filled=13, outcomes={"target":4,"stop":4,"ambiguous_stop_first":5,"no_entry":1}, grossPnl=-330 USD, winRateFilled=0.3077
- WICK|BTC|5s|UP|SHORT: sample=12, filled=12, outcomes={"stop":7,"ambiguous_stop_first":4,"target":1}, grossPnl=-520 USD, winRateFilled=0.0833
- WICK|BTC|5s|DOWN|LONG: sample=10, filled=8, outcomes={"missing_entry_research":2,"target":3,"stop":3,"ambiguous_stop_first":2}, grossPnl=-160 USD, winRateFilled=0.375
- VELOCITY|ETH|15m|DOWN|LONG: sample=10, filled=7, outcomes={"no_entry":3,"target":4,"ambiguous_stop_first":1,"stop":2}, grossPnl=-30 USD, winRateFilled=0.5714
- VELOCITY|ETH|5m|UP|SHORT: sample=9, filled=9, outcomes={"stop":3,"target":4,"ambiguous_stop_first":2}, grossPnl=-130 USD, winRateFilled=0.4444
- WICK|ETH|5s|DOWN|LONG: sample=8, filled=5, outcomes={"missing_entry_research":2,"no_entry":1,"target":1,"ambiguous_stop_first":3,"stop":1}, grossPnl=-170 USD, winRateFilled=0.2
- VELOCITY|ETH|60s|DOWN|LONG: sample=8, filled=5, outcomes={"missing_entry_research":1,"no_entry":2,"target":4,"ambiguous_stop_first":1}, grossPnl=70 USD, winRateFilled=0.8
- VELOCITY|ETH|5m|DOWN|LONG: sample=6, filled=4, outcomes={"missing_entry_research":1,"target":4,"no_entry":1}, grossPnl=120 USD, winRateFilled=1
- VELOCITY|BTC|15m|UP|SHORT: sample=4, filled=3, outcomes={"stop":1,"no_entry":1,"target":1,"ambiguous_stop_first":1}, grossPnl=-70 USD, winRateFilled=0.3333
- VELOCITY|ETH|15m|UP|SHORT: sample=3, filled=3, outcomes={"stop":1,"target":1,"ambiguous_stop_first":1}, grossPnl=-70 USD, winRateFilled=0.3333
- VELOCITY|BTC|60s|DOWN|LONG: sample=2, filled=1, outcomes={"no_entry":1,"ambiguous_stop_first":1}, grossPnl=-50 USD, winRateFilled=0
- VELOCITY|ETH|60s|UP|SHORT: sample=2, filled=2, outcomes={"target":1,"stop":1}, grossPnl=-20 USD, winRateFilled=0.5
- VELOCITY|BTC|5m|DOWN|LONG: sample=1, filled=1, outcomes={"stop":1}, grossPnl=-50 USD, winRateFilled=0
- VELOCITY|BTC|5m|UP|SHORT: sample=1, filled=1, outcomes={"stop":1}, grossPnl=-50 USD, winRateFilled=0
- VELOCITY|BTC|60s|UP|SHORT: sample=1, filled=0, outcomes={"no_entry":1}, grossPnl=0 USD, winRateFilled=null
- VELOCITY|BTC|15m|DOWN|LONG: sample=1, filled=1, outcomes={"target":1}, grossPnl=30 USD, winRateFilled=1

## Rows

- ETH-DOWN-1786374789722-rrlduq: VELOCITY ETH DOWN->LONG, fill=missing_entry_research, outcome=missing_entry_research, pnl=0 USD
- ETH-DOWN-1786462644866-k89vtm: VELOCITY ETH DOWN->LONG, fill=missing_entry_research, outcome=missing_entry_research, pnl=0 USD
- ETH-DOWN-1786537806074-zf65xw: WICK ETH DOWN->LONG, fill=missing_entry_research, outcome=missing_entry_research, pnl=0 USD
- BTC-DOWN-1786537807292-k5b8zx: WICK BTC DOWN->LONG, fill=missing_entry_research, outcome=missing_entry_research, pnl=0 USD
- ETH-DOWN-1786916407229-q9fgkn: WICK ETH DOWN->LONG, fill=missing_entry_research, outcome=missing_entry_research, pnl=0 USD
- BTC-DOWN-1786916406641-e8hw5f: WICK BTC DOWN->LONG, fill=missing_entry_research, outcome=missing_entry_research, pnl=0 USD
- ETH-UP-1787151298775-bhrjsk: VELOCITY ETH UP->SHORT, fill=filled, outcome=stop, pnl=-50 USD
- ETH-DOWN-1787151595654-yiizfv: VELOCITY ETH DOWN->LONG, fill=no_entry, outcome=no_entry, pnl=0 USD
- BTC-UP-1787152019278-xupw3o: VELOCITY BTC UP->SHORT, fill=filled, outcome=stop, pnl=-50 USD
- ETH-UP-1787153055182-ymjew4: VELOCITY ETH UP->SHORT, fill=filled, outcome=stop, pnl=-50 USD
- BTC-UP-1787153434499-s85pic: VELOCITY BTC UP->SHORT, fill=no_entry, outcome=no_entry, pnl=0 USD
- ETH-UP-1787155387758-6hajyk: WICK ETH UP->SHORT, fill=filled, outcome=target, pnl=30 USD
- ETH-UP-1787172614564-fzmr6k: WICK ETH UP->SHORT, fill=filled, outcome=stop, pnl=-50 USD
- BTC-UP-1787172640292-pi9ade: WICK BTC UP->SHORT, fill=filled, outcome=stop, pnl=-50 USD
- ETH-UP-1787174375823-5yeu15: VELOCITY ETH UP->SHORT, fill=filled, outcome=stop, pnl=-50 USD
- ETH-DOWN-1787175220292-7f6ia5: WICK ETH DOWN->LONG, fill=no_entry, outcome=no_entry, pnl=0 USD
- ETH-DOWN-1787176906667-6oyr2y: VELOCITY ETH DOWN->LONG, fill=no_entry, outcome=no_entry, pnl=0 USD
- ETH-DOWN-1787178833331-szd94s: VELOCITY ETH DOWN->LONG, fill=filled, outcome=target, pnl=30 USD
- ETH-UP-1787179272469-o4lvks: VELOCITY ETH UP->SHORT, fill=filled, outcome=target, pnl=30 USD
- ETH-DOWN-1787187119846-3vul1o: VELOCITY ETH DOWN->LONG, fill=no_entry, outcome=no_entry, pnl=0 USD
- ETH-DOWN-1787195477083-sqogs3: VELOCITY ETH DOWN->LONG, fill=filled, outcome=target, pnl=30 USD
- BTC-UP-1787213359438-7qays5: VELOCITY BTC UP->SHORT, fill=filled, outcome=stop, pnl=-50 USD
- ETH-UP-1787213450759-gcxdd2: VELOCITY ETH UP->SHORT, fill=filled, outcome=stop, pnl=-50 USD
- BTC-UP-1787220936327-ke83bj: VELOCITY BTC UP->SHORT, fill=no_entry, outcome=no_entry, pnl=0 USD
- ETH-UP-1787225500796-3ofepo: WICK ETH UP->SHORT, fill=filled, outcome=target, pnl=30 USD
- ETH-DOWN-1787227447653-ai8ddk: VELOCITY ETH DOWN->LONG, fill=filled, outcome=ambiguous_stop_first, pnl=-50 USD
- ETH-DOWN-1787232650136-ns43m6: VELOCITY ETH DOWN->LONG, fill=filled, outcome=target, pnl=30 USD
- ETH-UP-1787238219715-lur5og: VELOCITY ETH UP->SHORT, fill=filled, outcome=ambiguous_stop_first, pnl=-50 USD
- BTC-UP-1787238242568-s2y5k6: VELOCITY BTC UP->SHORT, fill=filled, outcome=target, pnl=30 USD
- ETH-DOWN-1787238511645-by69lq: WICK ETH DOWN->LONG, fill=filled, outcome=target, pnl=30 USD
- ... 62 more rows in shadow-pnl-ledger.json
