#!/usr/bin/env python3
"""Research-only hftbacktest minimal runtime spike for a bounded no-key capture."""

from __future__ import annotations

import json
import math
import os
import platform
from datetime import datetime, timezone
from pathlib import Path

import hftbacktest
import numpy as np
from hftbacktest import (
    BUY_EVENT,
    DEPTH_EVENT,
    DEPTH_SNAPSHOT_EVENT,
    GTX,
    LIMIT,
    SELL_EVENT,
    TRADE_EVENT,
    BacktestAsset,
    HashMapMarketDepthBacktest,
    event_dtype,
)
from hftbacktest.data.validation import correct_event_order, validate_event_order


WORKSPACE = Path(__file__).resolve().parents[2]
RALPH_ROOT = WORKSPACE / "ralph-research-os"
RUN_ID = os.environ.get("ORDERFLOW_RUN_ID", "2026-08-22T06-48-09-276Z")
RAW_EVENTS = WORKSPACE / "crypto-updates" / "runtime" / "orderflow-spikes" / RUN_ID / "raw-events.jsonl"
OUT_JSON = RALPH_ROOT / "outputs" / "hftbacktest-minimal-replay-runtime-spike.json"
OUT_MD = RALPH_ROOT / "outputs" / "hftbacktest-minimal-replay-runtime-spike.md"

ASSUMPTIONS = {
    "venue": os.environ.get("ORDERFLOW_SOURCE", "binance"),
    "symbol": os.environ.get("ORDERFLOW_SYMBOL", "BTCUSDT"),
    "maker_fee": 0.0,
    "taker_fee": 0.0,
    "order_latency_entry_ns": 0,
    "order_latency_response_ns": 0,
    "tick_size": 0.01,
    "lot_size": 0.00001,
    "passive_order_qty_btc": 0.001,
    "exchange_model": "no_partial_fill_exchange",
    "queue_model": "risk_adverse_queue_model",
    "asset_model": "linear_asset(contract_size=1.0)",
}


def main() -> None:
    raw_events = load_raw_events()
    events = [
        event for event in raw_events
        if event.get("source") == ASSUMPTIONS["venue"] and event.get("symbol") == ASSUMPTIONS["symbol"]
    ]
    if not events:
        raise RuntimeError(f"No {ASSUMPTIONS['venue']} {ASSUMPTIONS['symbol']} events in capture.")

    first_depth = next((event for event in events if event.get("type") in {"depth5", "l2_book"}), None)
    if first_depth is None:
        raise RuntimeError(f"No depth event available for {ASSUMPTIONS['venue']} {ASSUMPTIONS['symbol']} initial snapshot.")

    snapshot = make_initial_snapshot(first_depth)
    base_rows, source_counts = make_market_rows(events, first_depth)
    replay_rows = correct_event_order(
        base_rows,
        np.argsort(base_rows["exch_ts"], kind="stable"),
        np.argsort(base_rows["local_ts"], kind="stable"),
    )
    validate_event_order(replay_rows)

    first_ts = int(replay_rows["local_ts"].min())
    last_ts = int(replay_rows["local_ts"].max())
    step_ns = max(1, (last_ts - first_ts) // 20)

    no_trade = run_no_trade(snapshot, replay_rows, step_ns)
    passive_quote = run_passive_quote(snapshot, replay_rows, step_ns)
    converted_events = [
        event for event in events
        if event.get("type") in {"trade", "depth5", "l2_book", "book_ticker"}
    ]

    timestamp_note = (
        "Selected converted rows have separate local receive timestamps and native exchange timestamp evidence."
        if sum(1 for event in converted_events if timestamp_quality(event)["missing_exchange_ts"]) == 0
        else "Some selected converted rows have separate local receive timestamps but use ts as the exchange-time fallback rather than a distinct native exchange timestamp."
    )

    report = {
        "generated_at": datetime.now(timezone.utc).isoformat(),
        "status": "research-only-no-live-execution",
        "question": f"Can hftbacktest ingest no-key capture-v2 {ASSUMPTIONS['venue']} {ASSUMPTIONS['symbol']} rows and run a trivial replay baseline?",
        "verdict": "VALIDATED",
        "source_run": RUN_ID,
        "input": str(RAW_EVENTS.relative_to(WORKSPACE)),
        "runtime": {
            "python": platform.python_version(),
            "hftbacktest": hftbacktest.__version__,
            "numpy": np.__version__,
        },
        "assumptions": ASSUMPTIONS,
        "conversion": {
            "raw_events_total": len(raw_events),
            "selected_events": len(events),
            "source_counts_after_snapshot": source_counts,
            "initial_snapshot_rows": int(len(snapshot)),
            "base_event_rows": int(len(base_rows)),
            "replay_event_rows_after_order_correction": int(len(replay_rows)),
            "local_ts_min_ns": first_ts,
            "local_ts_max_ns": last_ts,
            "negative_feed_latency_rows": int(np.sum(base_rows["local_ts"] < base_rows["exch_ts"])),
            "minimum_feed_latency_ns": int(np.min(base_rows["local_ts"] - base_rows["exch_ts"])),
            "missing_exchange_timestamp_events": sum(
                1 for event in converted_events if timestamp_quality(event)["missing_exchange_ts"]
            ),
            "missing_local_receive_timestamp_events": sum(
                1 for event in converted_events if timestamp_quality(event)["missing_local_receive_ts"]
            ),
        },
        "baselines": {
            "no_trade": no_trade,
            "passive_fixed_spread_single_quote": passive_quote,
        },
        "interpretation": [
            "Runtime/package path is available through an isolated uv venv; no global install is needed.",
            "The capture needs an initial depth snapshot before replay rows, otherwise hftbacktest loads the array but best bid/ask remain NaN.",
            "Fixture guards now reject crossed, locked, non-positive, and non-finite top-of-book rows before baseline claims.",
            timestamp_note,
            "This is only a runtime smoke test over public no-key data, not evidence of trading edge.",
            "Passive quote fills are sensitive to zero latency, zero fees, queue model, and short sample length.",
        ],
        "next_steps": [
            "Keep fixture tests in front of converter changes and add exchange-specific timestamp evidence checks before longer replay claims.",
            "Run a longer bounded no-key capture before evaluating any edge-like metric.",
            "Replace zero-fee/zero-latency assumptions with exchange-specific conservative assumptions before strategy work.",
        ],
    }

    OUT_JSON.parent.mkdir(parents=True, exist_ok=True)
    OUT_JSON.write_text(json.dumps(report, indent=2) + "\n")
    OUT_MD.write_text(render_markdown(report))
    print(json.dumps({
        "ok": True,
        "verdict": report["verdict"],
        "output": str(OUT_MD.relative_to(WORKSPACE)),
        "replay_rows": len(replay_rows),
        "no_trade_num_trades": no_trade["state"]["num_trades"],
        "passive_quote_num_trades": passive_quote["state"]["num_trades"],
    }, indent=2))


def load_raw_events() -> list[dict]:
    return [json.loads(line) for line in RAW_EVENTS.read_text().splitlines() if line.strip()]


def event_timestamps(event: dict) -> tuple[int, int]:
    if event.get("exchangeTs") is None and event.get("ts") is None:
        raise ValueError("event is missing both exchangeTs and ts fallback")
    if event.get("localReceiveTs") is None and event.get("ts") is None:
        raise ValueError("event is missing both localReceiveTs and ts fallback")
    exchange_ts = int(event.get("exchangeTs") or event.get("ts")) * 1_000_000
    local_ts = int(event.get("localReceiveTs") or event.get("ts")) * 1_000_000
    return exchange_ts, local_ts


def timestamp_quality(event: dict) -> dict:
    exchange_ts, local_ts = event_timestamps(event)
    return {
        "missing_exchange_ts": event.get("exchangeTs") is None,
        "missing_local_receive_ts": event.get("localReceiveTs") is None,
        "negative_latency": local_ts < exchange_ts,
        "latency_ns": local_ts - exchange_ts,
    }


def make_initial_snapshot(depth_event: dict) -> np.ndarray:
    validate_depth_event_book(depth_event)
    exchange_ts, local_ts = event_timestamps(depth_event)
    rows = []
    bids, asks = depth_levels(depth_event)
    for price, qty in bids:
        rows.append((BUY_EVENT | DEPTH_SNAPSHOT_EVENT, exchange_ts, local_ts, float(price), float(qty), 0, 0, 0.0))
    for price, qty in asks:
        rows.append((SELL_EVENT | DEPTH_SNAPSHOT_EVENT, exchange_ts, local_ts, float(price), float(qty), 0, 0, 0.0))
    snapshot = np.array(rows, dtype=event_dtype)
    validate_depth_rows_book(snapshot)
    return snapshot


def make_market_rows(events: list[dict], first_depth: dict) -> tuple[np.ndarray, dict[str, int]]:
    first_local_ms = int(first_depth.get("localReceiveTs") or first_depth.get("ts"))
    rows = []
    counts: dict[str, int] = {}
    for event in events:
        if int(event.get("localReceiveTs") or event.get("ts")) < first_local_ms:
            continue
        exchange_ts, local_ts = event_timestamps(event)
        if event["type"] == "trade":
            counts[event["type"]] = counts.get(event["type"], 0) + 1
            side = trade_side_event(event.get("side"))
            rows.append((side | TRADE_EVENT, exchange_ts, local_ts, float(event["price"]), float(event["quantity"]), 0, 0, 0.0))
        elif event["type"] in {"depth5", "l2_book"}:
            counts[event["type"]] = counts.get(event["type"], 0) + 1
            validate_depth_event_book(event)
            bids, asks = depth_levels(event)
            for price, qty in bids:
                rows.append((BUY_EVENT | DEPTH_EVENT, exchange_ts, local_ts, float(price), float(qty), 0, 0, 0.0))
            for price, qty in asks:
                rows.append((SELL_EVENT | DEPTH_EVENT, exchange_ts, local_ts, float(price), float(qty), 0, 0, 0.0))
        elif event["type"] == "book_ticker":
            counts[event["type"]] = counts.get(event["type"], 0) + 1
            validate_top_of_book(float(event["bid"]), float(event["ask"]))
            rows.append((BUY_EVENT | DEPTH_EVENT, exchange_ts, local_ts, float(event["bid"]), float(event["bidQty"]), 0, 0, 0.0))
            rows.append((SELL_EVENT | DEPTH_EVENT, exchange_ts, local_ts, float(event["ask"]), float(event["askQty"]), 0, 0, 0.0))
    return np.array(rows, dtype=event_dtype), dict(sorted(counts.items()))


def validate_depth_event_book(event: dict) -> None:
    bids, asks = depth_levels(event)
    if not bids or not asks:
        raise ValueError("depth event must have at least one bid and ask")
    validate_top_of_book(float(bids[0][0]), float(asks[0][0]))


def depth_levels(event: dict) -> tuple[list, list]:
    if event.get("source") == "hyperliquid" and event.get("type") == "l2_book":
        levels = event.get("raw", {}).get("levels") or []
        bids = [[level.get("px"), level.get("sz")] for level in (levels[0] if len(levels) > 0 else [])]
        asks = [[level.get("px"), level.get("sz")] for level in (levels[1] if len(levels) > 1 else [])]
        return bids, asks
    return event["raw"]["bids"], event["raw"]["asks"]


def trade_side_event(side: str | None) -> int:
    value = str(side or "").lower()
    if value in {"sell_taker", "a"}:
        return SELL_EVENT
    return BUY_EVENT


def validate_depth_rows_book(rows: np.ndarray) -> None:
    bids = [float(row["px"]) for row in rows if int(row["ev"]) & BUY_EVENT]
    asks = [float(row["px"]) for row in rows if int(row["ev"]) & SELL_EVENT]
    if not bids or not asks:
        raise ValueError("depth rows must have at least one bid and ask")
    validate_top_of_book(max(bids), min(asks))


def validate_top_of_book(best_bid: float, best_ask: float) -> None:
    if not math.isfinite(best_bid) or not math.isfinite(best_ask):
        raise ValueError("book contains non-finite best bid/ask")
    if best_bid <= 0 or best_ask <= 0:
        raise ValueError("book contains non-positive best bid/ask")
    if best_bid >= best_ask:
        raise ValueError("book is crossed or locked")


def make_backtest(snapshot: np.ndarray, replay_rows: np.ndarray):
    asset = (
        BacktestAsset()
        .tick_size(ASSUMPTIONS["tick_size"])
        .lot_size(ASSUMPTIONS["lot_size"])
        .linear_asset(1.0)
        .constant_order_latency(ASSUMPTIONS["order_latency_entry_ns"], ASSUMPTIONS["order_latency_response_ns"])
        .risk_adverse_queue_model()
        .no_partial_fill_exchange()
        .flat_per_trade_fee_model(ASSUMPTIONS["maker_fee"], ASSUMPTIONS["taker_fee"])
        .initial_snapshot(snapshot)
        .data(replay_rows)
    )
    return HashMapMarketDepthBacktest([asset])


def run_no_trade(snapshot: np.ndarray, replay_rows: np.ndarray, step_ns: int) -> dict:
    hbt = make_backtest(snapshot, replay_rows)
    valid_books = 0
    for _ in range(20):
        hbt.elapse(step_ns)
        depth = hbt.depth(0)
        valid_books += int(is_finite_book(depth))
    result = {
        "valid_book_observations": valid_books,
        "state": state_values(hbt),
        "ending_book": book_values(hbt),
    }
    hbt.close()
    return result


def run_passive_quote(snapshot: np.ndarray, replay_rows: np.ndarray, step_ns: int) -> dict:
    hbt = make_backtest(snapshot, replay_rows)
    hbt.elapse(10_000_000)
    depth = hbt.depth(0)
    starting_book = book_values(hbt)
    buy_result = hbt.submit_buy_order(0, 1, float(depth.best_bid), ASSUMPTIONS["passive_order_qty_btc"], GTX, LIMIT, False)
    sell_result = hbt.submit_sell_order(0, 2, float(depth.best_ask), ASSUMPTIONS["passive_order_qty_btc"], GTX, LIMIT, False)
    for _ in range(20):
        hbt.elapse(step_ns)
        hbt.clear_inactive_orders(0)
    result = {
        "starting_book": starting_book,
        "submit_results": {"buy": int(buy_result), "sell": int(sell_result)},
        "state": state_values(hbt),
        "open_orders": len(hbt.orders(0)),
        "ending_book": book_values(hbt),
    }
    hbt.close()
    return result


def is_finite_book(depth) -> bool:
    return (
        math.isfinite(float(depth.best_bid))
        and math.isfinite(float(depth.best_ask))
        and float(depth.best_bid) > 0
        and float(depth.best_ask) > 0
        and float(depth.best_bid) < float(depth.best_ask)
    )


def book_values(hbt) -> dict:
    depth = hbt.depth(0)
    return {
        "timestamp_ns": int(hbt.current_timestamp),
        "best_bid": float(depth.best_bid),
        "best_ask": float(depth.best_ask),
        "best_bid_qty": float(depth.best_bid_qty),
        "best_ask_qty": float(depth.best_ask_qty),
    }


def state_values(hbt) -> dict:
    state = hbt.state_values(0)
    return {
        "position": float(state.position),
        "balance": float(state.balance),
        "fee": float(state.fee),
        "num_trades": int(state.num_trades),
        "trading_volume": float(state.trading_volume),
        "trading_value": float(state.trading_value),
    }


def render_markdown(report: dict) -> str:
    return "\n".join([
        "# HftBacktest Minimal Replay Runtime Spike",
        "",
        f"Generated: {report['generated_at']}",
        f"Status: {report['status']}.",
        f"Source run: `{report['source_run']}`",
        "",
        "## Verdict: VALIDATED",
        "",
        f"Question: {report['question']}",
        "",
        f"Evidence: `hftbacktest` installed in an isolated scratch venv, converted {report['assumptions']['venue']} {report['assumptions']['symbol']} capture-v2 rows into `event_dtype`, validated corrected event order, seeded an initial depth snapshot, and ran no-trade plus passive fixed-spread smoke baselines.",
        "",
        "## Runtime",
        "",
        f"- Python: {report['runtime']['python']}",
        f"- hftbacktest: {report['runtime']['hftbacktest']}",
        f"- NumPy: {report['runtime']['numpy']}",
        "",
        "## Frozen Assumptions",
        "",
        *[f"- {key}: `{value}`" for key, value in report["assumptions"].items()],
        "",
        "## Conversion",
        "",
        f"- Raw events total: {report['conversion']['raw_events_total']}",
        f"- Selected {report['assumptions']['venue']} {report['assumptions']['symbol']} events: {report['conversion']['selected_events']}",
        f"- Source counts after snapshot: `{report['conversion']['source_counts_after_snapshot']}`",
        f"- Initial snapshot rows: {report['conversion']['initial_snapshot_rows']}",
        f"- Base event rows: {report['conversion']['base_event_rows']}",
        f"- Replay rows after order correction: {report['conversion']['replay_event_rows_after_order_correction']}",
        f"- Negative feed-latency rows: {report['conversion']['negative_feed_latency_rows']}",
        f"- Minimum feed latency: {report['conversion']['minimum_feed_latency_ns']} ns",
        f"- Events missing exchange timestamp: {report['conversion']['missing_exchange_timestamp_events']}",
        f"- Events missing local receive timestamp: {report['conversion']['missing_local_receive_timestamp_events']}",
        "",
        "## Baselines",
        "",
        f"- No-trade: `{report['baselines']['no_trade']}`",
        f"- Passive fixed-spread single quote: `{report['baselines']['passive_fixed_spread_single_quote']}`",
        "",
        "## Interpretation",
        "",
        *[f"- {item}" for item in report["interpretation"]],
        "",
        "## Next Steps",
        "",
        *[f"- {item}" for item in report["next_steps"]],
        "",
    ]) + "\n"


if __name__ == "__main__":
    main()
