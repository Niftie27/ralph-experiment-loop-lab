# H3a implementation brief

Research-only queue of existing candidate grids, capped at 600. Exact H2 window and next-open entries; unchanged costs, risk, gates. The eight canonical rule names are the report's family axis; original family names and candidate IDs remain attached for provenance. No new rules, scheduling, holdout, trading, Storage Box or watcher changes.

- Extract the existing spam template factory verbatim into a reusable module; both original entry points retain backtestVariant and explicitly use the research/next_open configuration.
- Build an ordered, deduplicated queue by round-robin over available rule/symbol/timeframe groups. Only existing parameter tuples and direction sets; symbol/timeframe expansion is the requested H3a cross-product. Store unavailable combinations and individual template exclusions.
- Frozen snapshots only, offline. Require contiguous full-window OHLCV and all template-specific features; no funding/OI/manual-evidence proxy. Legacy 1825-day rolling acquisition targets are superseded by the requested fixed H2 research window.
- Checkpoint each item. One child process per backtest (not an agent/session) allows termination at the remaining invocation deadline. First item error stops the batch and exits nonzero; interrupted running items require review, not automatic restart.
- Trial count uses historical distinct variant identities plus the complete queued batch, across families, conservatively. Report per-rule and original-family historical counts and each input report's count. Existing deflated-Sharpe proxy remains unchanged.
- Verify offline queue validation, cap/deadline enforcement, subprocess failure persisted as error and nonzero CLI exit, plus existing Node tests. Runtime directly executes repository files; hash before/after and preserve registry prefix.
- Existing historical selection may overlap later windows: no clean holdout or promotion claim.
