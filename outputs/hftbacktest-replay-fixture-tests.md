# HftBacktest Replay Fixture Tests

Generated: 2026-08-22T07:45:49Z
Status: research-only-no-live-execution.

## Verdict: VALIDATED

Added deterministic local fixture coverage for `ralph-research-os/automation/hftbacktest-minimal-replay-runtime-spike.py`.

Covered:

- Initial depth snapshot creation from Binance `depth5`.
- `trade`, `depth5`, and `book_ticker` conversion into `hftbacktest.event_dtype`.
- Event-order correction over deliberately unsorted rows.
- Missing exchange timestamp and local receive timestamp quality flags.
- Negative feed-latency flag.
- Crossed, locked, non-positive, and `NaN` top-of-book rejection.
- Hyperliquid `l2_book` snapshot and clean native timestamp row conversion.
- No-trade baseline remains flat on a deterministic fixture replay.

Result:

- 7 tests.
- 0 failures.
- 0 errors.

Notable finding:

- Binance book/depth rows need fallback exchange timestamps, while Hyperliquid trade/`l2_book` rows provide native exchange timestamp evidence for the 30s probe.

Verification:

```bash
.tmp/openclaw-spikes/hftbacktest-minimal-replay-runtime/uv-venv/bin/python -m unittest ralph-research-os/automation/hftbacktest_minimal_replay_fixture_tests.py
.tmp/openclaw-spikes/hftbacktest-minimal-replay-runtime/uv-venv/bin/python ralph-research-os/automation/hftbacktest-minimal-replay-runtime-spike.py
.tmp/openclaw-spikes/hftbacktest-minimal-replay-runtime/uv-venv/bin/python -m py_compile ralph-research-os/automation/hftbacktest-minimal-replay-runtime-spike.py ralph-research-os/automation/hftbacktest_minimal_replay_fixture_tests.py
```
