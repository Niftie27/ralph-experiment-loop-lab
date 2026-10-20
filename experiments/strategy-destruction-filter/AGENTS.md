## Code Review Rules

Research and paper only; nothing here trades. Report violations of these rules as P1.

### Lookahead
- Flag any feature, signal or filter that uses data timestamped after the decision time (an unclosed candle, later bars in a window, future funding), and any simulated fill priced before its order exists or resolved by the favorable path inside one bar. Safe path: decide only on data closed at or before the decision time; fill at or after the order time (next open, or a limit only when price trades through it) and count the stop first when stop and target fall inside one bar.

### Walk-forward leakage
- Flag parameter selection, normalization, thresholds or fitting that sees out-of-sample or test-window data. Safe path: fit on the in-sample window only and apply the frozen values to the next window.

### Statistics and trial count
- Flag significance, deflated Sharpe or effective-N calculations whose raw trial count is smaller than the number of distinct variants in the full variant registry (every variant ever run, across families and markets, including failed and abandoned ones; an exact rerun is not a new trial). Safe path: take raw N from the complete registry, never from the current run or a filtered subset; derive effective N from those trials and report raw N beside it.

### Holdout and forward window
- Flag any path that evaluates or summarizes holdout data, or reads outcomes from the V6 forward window (2026-10-14..2026-11-15), before its pre-registered evaluation, or that weakens the holdout guard. Safe path: every holdout look goes through the guard; sealed months may be stored and checksummed, never evaluated; no interim looks.

### Data identity
- Flag new snapshot keys, manifest entries or registry rows that omit exchange, market type or contract, and any path that can serve spot data for a futures request or the reverse. Records written before F1a-1 carry none of the three and are read as Binance spot only. Safe path: resolve data only by full instrument identity; each new manifest entry records its data source and, for archive files, the published checksums they were verified against.

### Append-only records
- Flag edits or deletions of existing registry rows, manifest entries or decision rows, and any renumbering or reuse of a ledger ID. Safe path: append a new row that supersedes the old one.

### Tests, thresholds and gates
- Flag edits or deletions of existing tests, and changes to acceptance thresholds, gates, costs or time windows, in the same PR as the code they judge, unless the PR description says Tomas approved them; new tests for new code are expected. Safe path: propose the change in a PR comment.

### Public repository hygiene
- Flag private hostnames, usernames, IP addresses, chat ids, absolute home paths, keys or anything from ~/.ssh; public exchange and data API hosts are fine. Safe path: write ~ and placeholders.
