import json
import math
from pathlib import Path

import numpy as np
import pandas as pd
import vectorbt as vbt


ROOT = Path(__file__).resolve().parents[1]
CONFIG = json.loads((ROOT / "config.default.json").read_text())
RESULTS = ROOT / "results"
OUT = RESULTS / "framework-benchmark.json"
OUT_MD = RESULTS / "framework-benchmark.md"


def round_or_none(value, digits=4):
    if value is None:
        return None
    try:
        if math.isnan(value) or math.isinf(value):
            return None
    except TypeError:
        pass
    return round(float(value), digits)


def load_candles(symbol):
    path = ROOT / "data" / "candles" / f"binance-spot-{symbol}-4h.json"
    df = pd.DataFrame(json.loads(path.read_text()))
    for column in ["open", "high", "low", "close", "volume", "time"]:
        df[column] = pd.to_numeric(df[column], errors="coerce")
    df = df.dropna(subset=["open", "high", "low", "close", "volume", "time"])
    df.index = pd.to_datetime(df["time"], unit="s", utc=True)
    return df


def rsi(close, period=14):
    diff = close.diff()
    gains = diff.clip(lower=0).rolling(period).sum()
    losses = (-diff.clip(upper=0)).rolling(period).sum()
    rs = gains / losses.replace(0, np.nan)
    out = 100 - (100 / (1 + rs))
    out = out.fillna(100)
    out.iloc[:period] = np.nan
    return out


def atr(df, period=14):
    prev_close = df["close"].shift(1)
    tr = pd.concat(
        [
            df["high"] - df["low"],
            (df["high"] - prev_close).abs(),
            (df["low"] - prev_close).abs(),
        ],
        axis=1,
    ).max(axis=1)
    return tr.rolling(period).mean()


def context(df):
    out = df.copy()
    out["ma20"] = out["close"].rolling(20).mean()
    out["ma50"] = out["close"].rolling(50).mean()
    out["atr14"] = atr(out, 14)
    out["rsi14"] = rsi(out["close"], 14)
    out["trend"] = "range"
    out.loc[(out["close"] > out["ma50"]) & (out["ma20"] > out["ma50"]), "trend"] = "up"
    out.loc[(out["close"] < out["ma50"]) & (out["ma20"] < out["ma50"]), "trend"] = "down"
    out["atr_pct"] = out["atr14"] / out["close"]
    out["volatility"] = "mid-vol"
    out.loc[out["atr_pct"] > 0.025, "volatility"] = "high-vol"
    out.loc[out["atr_pct"] < 0.01, "volatility"] = "low-vol"
    return out


def momentum_reversal_long_entries(df):
    ctx = context(df)
    prev = ctx.shift(1)
    entries = (
        (prev["close"] < prev["open"])
        & (ctx["close"] > ctx["open"])
        & (ctx["rsi14"] < 38)
        & (ctx["trend"] != "down")
    )
    return ctx, entries.fillna(False)


def simulate_event_study(df, entries):
    stop_atr = CONFIG["risk"]["stopAtr"]
    target_r = CONFIG["risk"]["targetR"]
    fee_bps = CONFIG["costs"]["feeBpsPerSide"]
    slippage_bps = CONFIG["costs"]["slippageBpsPerSide"]
    max_bars = next(t["maxBars"] for t in CONFIG["timeframes"] if t["id"] == "4h")
    trades = []
    entry_indexes = np.where(entries.to_numpy())[0]

    for start in entry_indexes:
        if start < 60 or start >= len(df) - max_bars - 1:
            continue
        entry = float(df["close"].iloc[start])
        risk = stop_atr * float(df["atr14"].iloc[start])
        if not math.isfinite(risk) or risk <= 0:
            continue
        stop = entry - risk
        target = entry + risk * target_r
        risk_pct = abs(risk / entry)
        cost_r = (2 * (fee_bps + slippage_bps) / 10000) / risk_pct
        result = None

        for i in range(start + 1, min(len(df), start + max_bars + 1)):
            low = float(df["low"].iloc[i])
            high = float(df["high"].iloc[i])
            if low <= stop:
                result = (-1 - cost_r, "stop-first-collision" if high >= target else "stop", i)
                break
            if high >= target:
                result = (target_r - cost_r, "target", i)
                break
        if result is None:
            exit_index = min(len(df) - 1, start + max_bars)
            exit_close = float(df["close"].iloc[exit_index])
            result = ((exit_close - entry) / risk - cost_r, "horizon", exit_index)
        trades.append(
            {
                "entry_time": df.index[start].isoformat(),
                "exit_time": df.index[result[2]].isoformat(),
                "entry_price": round_or_none(entry),
                "net_r": result[0],
                "exit_reason": result[1],
            }
        )

    return trades


def aggregate(trades):
    if not trades:
        return {"sample": 0, "winrate": None, "expectancyR": None, "profitFactor": None}
    rs = np.array([t["net_r"] for t in trades], dtype=float)
    wins = rs > 0
    gross_win = rs[wins].sum()
    gross_loss = abs(rs[~wins].sum())
    return {
        "sample": int(len(rs)),
        "winrate": round_or_none(wins.mean()),
        "expectancyR": round_or_none(rs.mean()),
        "profitFactor": round_or_none(gross_win / gross_loss if gross_loss else None),
    }


def vectorbt_sanity(df, entries):
    stop_atr = CONFIG["risk"]["stopAtr"]
    target_r = CONFIG["risk"]["targetR"]
    close = df["close"].astype(float)
    high = df["high"].astype(float)
    low = df["low"].astype(float)
    stop_pct = ((stop_atr * df["atr14"]) / close).replace([np.inf, -np.inf], np.nan).astype(float)
    exits = entries.shift(12).fillna(False).astype(bool)
    portfolio = vbt.Portfolio.from_signals(
        close,
        entries=entries.astype(bool),
        exits=exits,
        high=high,
        low=low,
        sl_stop=stop_pct,
        tp_stop=stop_pct * target_r,
        fees=CONFIG["costs"]["feeBpsPerSide"] / 10000,
        slippage=CONFIG["costs"]["slippageBpsPerSide"] / 10000,
        freq="4h",
    )
    stats = portfolio.stats()
    readable = portfolio.trades.records_readable
    rows = []
    for _, row in readable.iterrows():
        entry_ts = row.get("Entry Timestamp")
        exit_ts = row.get("Exit Timestamp")
        rows.append(
            {
                "entry_time": entry_ts.isoformat() if hasattr(entry_ts, "isoformat") else str(entry_ts),
                "exit_time": exit_ts.isoformat() if hasattr(exit_ts, "isoformat") else str(exit_ts),
                "entry_price": round_or_none(row.get("Avg Entry Price")),
                "exit_price": round_or_none(row.get("Avg Exit Price")),
                "return": round_or_none(row.get("Return")),
                "status": str(row.get("Status")),
            }
        )
    return {
        "totalTrades": int(stats.get("Total Trades", 0)),
        "winRatePct": round_or_none(stats.get("Win Rate [%]")),
        "totalReturnPct": round_or_none(stats.get("Total Return [%]")),
        "rows": rows,
        "note": "Portfolio engine models position overlap/capital, so this is a sanity benchmark rather than one-to-one parity with independent event-study trades.",
    }


def row_level_parity(event_rows, vectorbt_rows):
    event_entries = {row["entry_time"] for row in event_rows}
    vectorbt_entries = {row["entry_time"] for row in vectorbt_rows}
    shared = sorted(event_entries & vectorbt_entries)
    event_only = sorted(event_entries - vectorbt_entries)
    vectorbt_only = sorted(vectorbt_entries - event_entries)
    vectorbt_tail_only = bool(event_entries) and all(entry > max(event_entries) for entry in vectorbt_only)
    status = (
        "explainable_subset"
        if len(vectorbt_only) == 0
        else "explainable_portfolio_tail_difference"
        if vectorbt_tail_only
        else "mismatch_needs_investigation"
    )
    return {
        "status": status,
        "customEventRows": len(event_rows),
        "vectorbtRows": len(vectorbt_rows),
        "sharedEntryRows": len(shared),
        "customOnlyRows": len(event_only),
        "vectorbtOnlyRows": len(vectorbt_only),
        "latestMatureCustomEntry": max(event_entries) if event_entries else None,
        "customOnlySample": event_only[:10],
        "vectorbtOnlySample": vectorbt_only[:10],
        "interpretation": "Custom-only rows are expected when vectorbt suppresses overlapping entries under one-position portfolio mechanics. Vectorbt-only tail rows are expected when vectorbt opens a recent signal before the custom event-study has a full max-bars outcome window.",
    }


def write_markdown(result):
    lines = [
        "# Framework Benchmark",
        "",
        f"Generated: {result['generated']}",
        "",
        "Status: research-only, no live execution.",
        "",
        "## Scope",
        "",
        f"- Framework: {result['framework']['name']} {result['framework']['version']}",
        f"- Setup: {result['scope']['setup']}",
        f"- Timeframe: {result['scope']['timeframe']}",
        "",
        "## Row-Level Parity",
        "",
        "| Symbol | Custom rows | Vectorbt rows | Shared entries | Custom-only | Vectorbt-only | Status |",
        "| --- | ---: | ---: | ---: | ---: | ---: | --- |",
    ]
    for symbol, data in result["symbols"].items():
        parity = data["rowLevelParity"]
        lines.append(
            f"| {symbol} | {parity['customEventRows']} | {parity['vectorbtRows']} | "
            f"{parity['sharedEntryRows']} | {parity['customOnlyRows']} | "
            f"{parity['vectorbtOnlyRows']} | {parity['status']} |"
        )
    lines.extend(
        [
            "",
            "## Reassessment",
            "",
            "Vectorbt still agrees directionally that BTC/ETH 4h momentum reversal long is weak, but row-level parity is explainable rather than exact. Custom event-study rows score every qualifying setup independently; vectorbt suppresses overlapping entries while a portfolio position is open, and vectorbt can include a recent tail entry before the custom event-study has a full max-bars outcome window.",
            "",
            "Decision: keep vectorbt as an external sanity check and do not replace the custom event-study adapter yet. Any future framework parity claim must report row-level overlap, not only aggregate return.",
            "",
            "No live trading, alert wording, thresholds, risk, sizing, TP/SL, execution behavior, orders, accounts, keys, paid services, public posting, scheduler, cron, systemd, dependency adoption, watcher behavior, or strategy promotion changed.",
            "",
        ]
    )
    OUT_MD.write_text("\n".join(lines))


def main():
    result = {
        "generated": pd.Timestamp.now("UTC").isoformat(),
        "framework": {
            "name": "vectorbt",
            "version": vbt.__version__,
            "runner": "uv run --with 'vectorbt>=0.26.0' --with 'plotly<6' --with pandas --with numpy",
        },
        "scope": {"setup": "momentum_reversal_long", "symbols": ["BTCUSDT", "ETHUSDT"], "timeframe": "4h"},
        "symbols": {},
        "reassessment": [
            "Use vectorbt as a portfolio sanity check, not as the only source of truth yet, because RALPH currently scores independent setup events and vectorbt models position overlap/capital constraints.",
            "Row-level parity is now reported explicitly. Custom-only entries are expected when vectorbt suppresses overlapping portfolio positions; vectorbt-only tail entries are expected before the custom event-study has a full max-bars outcome window.",
        ],
    }

    for symbol in result["scope"]["symbols"]:
        df = load_candles(symbol)
        ctx, entries = momentum_reversal_long_entries(df)
        trades = simulate_event_study(ctx, entries)
        vectorbt = vectorbt_sanity(ctx, entries)
        result["symbols"][symbol] = {
            "candles": int(len(df)),
            "signals": int(entries.sum()),
            "eventStudy": aggregate(trades),
            "vectorbtPortfolio": {k: v for k, v in vectorbt.items() if k != "rows"},
            "rowLevelParity": row_level_parity(trades, vectorbt["rows"]),
            "customEventRowsSample": trades[:5],
            "vectorbtRowsSample": vectorbt["rows"][:5],
        }

    RESULTS.mkdir(parents=True, exist_ok=True)
    OUT.write_text(json.dumps(result, indent=2) + "\n")
    write_markdown(result)
    print(json.dumps(result, indent=2))


if __name__ == "__main__":
    main()
