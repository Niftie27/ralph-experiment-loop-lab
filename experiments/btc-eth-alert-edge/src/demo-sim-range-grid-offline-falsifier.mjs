#!/usr/bin/env node

import fs from "node:fs/promises";
import path from "node:path";

const ROOT = path.resolve(new URL("..", import.meta.url).pathname);
const CONFIG_PATH = path.join(ROOT, "config.default.json");
const CANDLE_DIR = path.join(ROOT, "data", "candles");
const RESULTS_DIR = path.join(ROOT, "results");
const REPORT_JSON_PATH = path.join(RESULTS_DIR, "demo-sim-range-grid-offline-falsifier.json");
const REPORT_MD_PATH = path.join(RESULTS_DIR, "demo-sim-range-grid-offline-falsifier.md");

const TIMEFRAME = "4h";
const SYMBOLS = ["BTC", "ETH", "SOL"];
const LOOKBACK_BARS = 180;
const HOLD_BARS = 12;
const GRID_LEVELS = 5;
const STARTING_EQUITY = 10_000;
const FEE_BPS_PER_SIDE = 4;
const SLIPPAGE_BPS_PER_SIDE = 2;
const ROUND_TRIP_COST = ((FEE_BPS_PER_SIDE + SLIPPAGE_BPS_PER_SIDE) * 2) / 10_000;

const nowIso = () => new Date().toISOString();
const iso = (seconds) => new Date(seconds * 1000).toISOString();
const monthKey = (seconds) => iso(seconds).slice(0, 7);
const round = (value, digits = 6) => Number.isFinite(value) ? Number(value.toFixed(digits)) : null;
const pct = (value) => Number.isFinite(value) ? `${(value * 100).toFixed(2)}%` : "n/a";
const money = (value) => Number.isFinite(value) ? value.toFixed(2) : "n/a";
const cell = (value) => String(value ?? "n/a").replaceAll("|", " / ");

async function readJson(file) {
  return JSON.parse(await fs.readFile(file, "utf8"));
}

async function writeJson(file, value) {
  await fs.mkdir(path.dirname(file), { recursive: true });
  await fs.writeFile(file, `${JSON.stringify(value, null, 2)}\n`);
}

function candleFile(binanceSpotSymbol) {
  return path.join(CANDLE_DIR, `binance-spot-${binanceSpotSymbol}-${TIMEFRAME}.json`);
}

function sma(candles, index, period) {
  if (index + 1 < period) return null;
  let sum = 0;
  for (let i = index - period + 1; i <= index; i += 1) sum += candles[i].close;
  return sum / period;
}

function btcGateAt(btcCandles, time) {
  let index = -1;
  for (let i = 0; i < btcCandles.length; i += 1) {
    if (btcCandles[i].time > time) break;
    index = i;
  }
  if (index < 0) return { state: "BTC_STALE", pass: false, reason: "No BTC candle at or before candidate time." };

  const candle = btcCandles[index];
  const ma20 = sma(btcCandles, index, 20);
  const ma50 = sma(btcCandles, index, 50);
  let state = "BTC_TRANSITION";
  if (ma20 && ma50) {
    if (candle.close > ma20 && ma20 > ma50) state = "BTC_RISK_ON";
    else if (candle.close < ma20 && ma20 < ma50) state = "BTC_RISK_OFF";
  }
  return {
    state,
    pass: state === "BTC_TRANSITION",
    btcClose: round(candle.close, 2),
    btcTimeIso: iso(candle.time),
    reason: `Offline grid requires BTC_TRANSITION by close/MA20/MA50; BTC was ${state}.`,
  };
}

function quantile(values, q) {
  const sorted = [...values].filter(Number.isFinite).sort((a, b) => a - b);
  if (!sorted.length) return null;
  const pos = (sorted.length - 1) * q;
  const base = Math.floor(pos);
  const rest = pos - base;
  return sorted[base + 1] === undefined ? sorted[base] : sorted[base] + rest * (sorted[base + 1] - sorted[base]);
}

function priorRange(candles, index) {
  const prior = candles.slice(index - LOOKBACK_BARS, index);
  if (prior.length < LOOKBACK_BARS) return null;
  const lower = quantile(prior.map((candle) => candle.low), 0.2);
  const upper = quantile(prior.map((candle) => candle.high), 0.8);
  if (!Number.isFinite(lower) || !Number.isFinite(upper) || upper <= lower) return null;
  const step = (upper - lower) / (GRID_LEVELS - 1);
  return {
    lower,
    upper,
    buyLevel: lower + step,
    sellLevel: upper - step,
    stopLevel: lower - step * 0.5,
    widthPct: (upper - lower) / ((upper + lower) / 2),
  };
}

function exitForEntry(candles, entryIndex, range) {
  const maxIndex = Math.min(candles.length - 1, entryIndex + HOLD_BARS);
  for (let i = entryIndex + 1; i <= maxIndex; i += 1) {
    const candle = candles[i];
    const hitStop = candle.low <= range.stopLevel;
    const hitTakeProfit = candle.high >= range.sellLevel;
    if (hitStop) {
      return { candle, reason: "STOP_OR_TREND_BREAK", exitPrice: range.stopLevel, ambiguous: hitTakeProfit };
    }
    if (hitTakeProfit) {
      return { candle, reason: "GRID_MEAN_REVERSION", exitPrice: range.sellLevel, ambiguous: false };
    }
  }
  return { candle: candles[maxIndex], reason: "TIME_EXIT", exitPrice: candles[maxIndex].close, ambiguous: false };
}

function makeTrade({ symbol, candles, index, range, btcGate }) {
  const entryCandle = candles[index];
  const exit = exitForEntry(candles, index, range);
  const grossReturn = (exit.exitPrice - range.buyLevel) / range.buyLevel;
  const netReturn = grossReturn - ROUND_TRIP_COST;
  return {
    id: `${symbol}:${TIMEFRAME}:range_grid:${entryCandle.time}`,
    symbol,
    timeframe: TIMEFRAME,
    setup: "range_grid_offline",
    entryTime: entryCandle.time,
    entryTimeIso: iso(entryCandle.time),
    entryPrice: round(range.buyLevel, 8),
    exitTime: exit.candle.time,
    exitTimeIso: iso(exit.candle.time),
    exitPrice: round(exit.exitPrice, 8),
    exitReason: exit.reason,
    ambiguous: exit.ambiguous,
    rangeLower: round(range.lower, 8),
    rangeUpper: round(range.upper, 8),
    rangeWidthPct: round(range.widthPct),
    grossReturn: round(grossReturn),
    netReturn: round(netReturn),
    netPnlPer10kUsd: round(netReturn * STARTING_EQUITY, 4),
    btcGate,
  };
}

function deriveGridTrades(symbol, candles, btcCandles) {
  const trades = [];
  let nextAllowedIndex = LOOKBACK_BARS;
  for (let i = LOOKBACK_BARS; i < candles.length - HOLD_BARS; i += 1) {
    if (i < nextAllowedIndex) continue;
    const range = priorRange(candles, i);
    if (!range) continue;
    const candle = candles[i];
    const btcGate = btcGateAt(btcCandles, candle.time);
    if (!btcGate.pass) continue;
    if (candle.low > range.buyLevel) continue;

    const trade = makeTrade({ symbol, candles, index: i, range, btcGate });
    trades.push(trade);
    const exitIndex = candles.findIndex((exitCandle) => exitCandle.time === trade.exitTime);
    nextAllowedIndex = exitIndex > i ? exitIndex + 1 : i + HOLD_BARS + 1;
  }
  return trades;
}

function maxDrawdown(rows, valueFn) {
  let equity = STARTING_EQUITY;
  let peak = STARTING_EQUITY;
  let maxDrawdownUsd = 0;
  let maxDrawdownPct = 0;
  let maxDrawdownAt = null;
  for (const row of [...rows].sort((a, b) => a.exitTime - b.exitTime || a.id.localeCompare(b.id))) {
    equity += valueFn(row);
    if (equity > peak) peak = equity;
    const drawdownUsd = peak - equity;
    const drawdownPct = peak > 0 ? drawdownUsd / peak : 0;
    if (drawdownUsd > maxDrawdownUsd) {
      maxDrawdownUsd = drawdownUsd;
      maxDrawdownPct = drawdownPct;
      maxDrawdownAt = row.exitTimeIso;
    }
  }
  return {
    endingEquityUsd: round(equity, 2),
    maxDrawdownUsd: round(maxDrawdownUsd, 2),
    maxDrawdownPct: round(maxDrawdownPct),
    maxDrawdownAt,
  };
}

function summarizeTrades(trades) {
  const wins = trades.filter((trade) => trade.netPnlPer10kUsd > 0);
  const losses = trades.filter((trade) => trade.netPnlPer10kUsd <= 0);
  const grossWins = wins.reduce((sum, trade) => sum + trade.netPnlPer10kUsd, 0);
  const grossLosses = Math.abs(losses.reduce((sum, trade) => sum + trade.netPnlPer10kUsd, 0));
  const netPnl = trades.reduce((sum, trade) => sum + trade.netPnlPer10kUsd, 0);
  return {
    trades: trades.length,
    wins: wins.length,
    losses: losses.length,
    winrate: trades.length ? round(wins.length / trades.length) : null,
    netPnlPer10kUsd: round(netPnl, 2),
    avgPnlPerTradeUsd: trades.length ? round(netPnl / trades.length, 4) : null,
    profitFactor: grossLosses > 0 ? round(grossWins / grossLosses, 4) : (grossWins > 0 ? Infinity : null),
    ambiguousTrades: trades.filter((trade) => trade.ambiguous).length,
    stopTrades: trades.filter((trade) => trade.exitReason === "STOP_OR_TREND_BREAK").length,
    timeExitTrades: trades.filter((trade) => trade.exitReason === "TIME_EXIT").length,
    tpTrades: trades.filter((trade) => trade.exitReason === "GRID_MEAN_REVERSION").length,
    ...maxDrawdown(trades, (trade) => trade.netPnlPer10kUsd),
  };
}

function buyHoldSummary(symbol, candles) {
  const start = candles[LOOKBACK_BARS];
  const end = candles[candles.length - 1];
  const netReturn = ((end.close - start.close) / start.close) - ROUND_TRIP_COST;
  return {
    key: `${symbol}_buy_hold`,
    symbol,
    startTimeIso: iso(start.time),
    endTimeIso: iso(end.time),
    startPrice: round(start.close, 8),
    endPrice: round(end.close, 8),
    netReturn: round(netReturn),
    netPnlPer10kUsd: round(netReturn * STARTING_EQUITY, 2),
  };
}

function groupRows(rows, keyFn) {
  const groups = new Map();
  for (const row of rows) {
    const key = keyFn(row);
    const group = groups.get(key) ?? [];
    group.push(row);
    groups.set(key, group);
  }
  return [...groups.entries()]
    .map(([key, group]) => ({ key, ...summarizeTrades(group) }))
    .sort((a, b) => (b.netPnlPer10kUsd ?? -Infinity) - (a.netPnlPer10kUsd ?? -Infinity) || b.trades - a.trades);
}

function table(rows, columns) {
  if (!rows.length) return "_No rows._";
  const header = `| ${columns.map((column) => column.label).join(" | ")} |`;
  const divider = `| ${columns.map((column) => column.align ?? "---").join(" | ")} |`;
  const body = rows.map((row) => `| ${columns.map((column) => cell(column.value(row))).join(" | ")} |`);
  return [header, divider, ...body].join("\n");
}

function verdict({ totalSummary, bySymbol, buyHoldBaselines }) {
  const beatsNoTrade = (totalSummary.netPnlPer10kUsd ?? 0) > 0;
  const profitableSymbols = bySymbol.filter((row) => (row.netPnlPer10kUsd ?? 0) > 0).length;
  const bestBuyHold = Math.max(...buyHoldBaselines.map((row) => row.netPnlPer10kUsd));
  if (!totalSummary.trades) return "reject_no_grid_events";
  if (!beatsNoTrade) return "reject_loses_to_no_trade";
  if ((totalSummary.maxDrawdownPct ?? 1) > 0.35) return "reject_tail_drawdown";
  if (totalSummary.netPnlPer10kUsd < bestBuyHold) return "reject_loses_to_buy_hold";
  if (profitableSymbols < 2) return "watch_symbol_concentration";
  return "survives_first_offline_falsifier";
}

async function main() {
  const config = await readJson(CONFIG_PATH);
  const symbolConfigs = config.symbols.filter((symbol) => SYMBOLS.includes(symbol.symbol));
  const candlesBySymbol = new Map();
  for (const symbol of symbolConfigs) {
    candlesBySymbol.set(symbol.symbol, await readJson(candleFile(symbol.binanceSpotSymbol)));
  }
  const btcCandles = candlesBySymbol.get("BTC");

  const trades = [];
  const buyHoldBaselines = [];
  for (const symbol of symbolConfigs) {
    const candles = candlesBySymbol.get(symbol.symbol);
    buyHoldBaselines.push(buyHoldSummary(symbol.symbol, candles));
    trades.push(...deriveGridTrades(symbol.symbol, candles, btcCandles));
  }

  const bySymbol = groupRows(trades, (trade) => trade.symbol);
  const byMonth = groupRows(trades, (trade) => monthKey(trade.exitTime));
  const byExitReason = groupRows(trades, (trade) => trade.exitReason);
  const totalSummary = summarizeTrades(trades);
  const status = verdict({ totalSummary, bySymbol, buyHoldBaselines });
  const bestBuyHold = [...buyHoldBaselines].sort((a, b) => b.netPnlPer10kUsd - a.netPnlPer10kUsd)[0];
  const totalBuyHold = {
    key: "equal_weight_buy_hold",
    netPnlPer10kUsd: round(buyHoldBaselines.reduce((sum, row) => sum + row.netPnlPer10kUsd, 0) / buyHoldBaselines.length, 2),
  };

  const report = {
    generated: nowIso(),
    status,
    workItem: "validation.range-grid-offline-falsifier",
    outputs: {
      json: "results/demo-sim-range-grid-offline-falsifier.json",
      markdown: "results/demo-sim-range-grid-offline-falsifier.md",
    },
    boundaries: [
      "research_only",
      "offline_public_candles_only",
      "existing_local_binance_spot_candle_cache",
      "no_live_execution",
      "no_exchange_keys_or_accounts",
      "no_paid_apis",
      "no_scheduler_or_cron_changes",
      "no_tradingview_automation",
      "no_alert_wording_threshold_watcher_or_sizing_changes",
      "no_tp_sl_changes",
      "no_strategy_promotion",
    ],
    assumptions: {
      symbols: SYMBOLS,
      timeframe: TIMEFRAME,
      range: "Prior-only rolling 180 4h candles; lower=20th percentile lows, upper=80th percentile highs.",
      grid: "Buy at the first inner grid level under BTC_TRANSITION, sell at the upper inner grid level, stop half a grid step below the lower range, or time-exit after 12 bars.",
      btcGate: "BTC_TRANSITION only by close/MA20/MA50 proxy; BTC_RISK_OFF and BTC_RISK_ON are skipped.",
      costs: {
        feeBpsPerSide: FEE_BPS_PER_SIDE,
        slippageBpsPerSide: SLIPPAGE_BPS_PER_SIDE,
        roundTripCostBps: round(ROUND_TRIP_COST * 10_000, 2),
      },
      startingEquityUsd: STARTING_EQUITY,
    },
    dataCoverage: symbolConfigs.map((symbol) => {
      const candles = candlesBySymbol.get(symbol.symbol);
      return {
        symbol: symbol.symbol,
        candleFile: path.relative(ROOT, candleFile(symbol.binanceSpotSymbol)),
        candles: candles.length,
        startTimeIso: iso(candles[0].time),
        endTimeIso: iso(candles[candles.length - 1].time),
      };
    }),
    baselines: {
      noTrade: { netPnlPer10kUsd: 0, maxDrawdownPct: 0 },
      buyHoldBySymbol: buyHoldBaselines,
      equalWeightBuyHold: totalBuyHold,
      bestBuyHold,
    },
    grid: {
      total: totalSummary,
      bySymbol,
      byMonth,
      byExitReason,
      sampleTrades: trades.slice(0, 25),
    },
    interpretation: {
      verdict: status,
      summary: status.startsWith("reject")
        ? "The fixed offline range-grid rule fails the cheap falsifier and should not be joined to DEMO-SIM or paper-fund surfaces."
        : "The fixed offline range-grid rule has a narrow first-pass hint, but still requires harsher walk-forward, tail, and fill realism checks before any DEMO-SIM join.",
      blockers: [
        totalSummary.netPnlPer10kUsd <= 0 ? "grid loses to no-trade" : null,
        totalSummary.netPnlPer10kUsd < bestBuyHold.netPnlPer10kUsd ? `grid loses to best buy-and-hold baseline (${bestBuyHold.symbol})` : null,
        totalSummary.maxDrawdownPct > 0.35 ? `grid max drawdown is ${pct(totalSummary.maxDrawdownPct)}` : null,
        bySymbol.filter((row) => row.netPnlPer10kUsd > 0).length < 2 ? "profit is not distributed across at least two symbols" : null,
        "single fixed offline fill model does not prove executable grid fills",
      ].filter(Boolean),
      nextActions: status.startsWith("reject")
        ? [
          "Keep range-grid offline falsifier as rejected/watch-only reference.",
          "Do not join this branch to DEMO-SIM paper fund, live alerts, watchers, sizing, TP/SL, execution, or schedulers.",
          "Route next work back to survivor hardening, source discovery, or a new user-approved validation branch.",
        ]
        : [
          "Run a harsher purged monthly split and concentration stress before any DEMO-SIM join.",
          "Stress grid fills with worse fees/spread and same-candle adverse ordering.",
          "Keep all grid work research-only until a separate approval exists for any account/product trial.",
        ],
    },
  };

  await writeJson(REPORT_JSON_PATH, report);

  const summaryColumns = [
    { label: "Case", value: (row) => row.key ?? row.symbol },
    { label: "Trades", align: "---:", value: (row) => row.trades ?? "n/a" },
    { label: "Net/10k", align: "---:", value: (row) => money(row.netPnlPer10kUsd) },
    { label: "PF", align: "---:", value: (row) => row.profitFactor ?? "n/a" },
    { label: "Winrate", align: "---:", value: (row) => pct(row.winrate) },
    { label: "Max DD", align: "---:", value: (row) => pct(row.maxDrawdownPct) },
  ];
  const buyHoldColumns = [
    { label: "Symbol", value: (row) => row.symbol ?? row.key },
    { label: "Net/10k", align: "---:", value: (row) => money(row.netPnlPer10kUsd) },
    { label: "Start", value: (row) => row.startTimeIso ?? "n/a" },
    { label: "End", value: (row) => row.endTimeIso ?? "n/a" },
  ];

  const md = `# DEMO-SIM Range Grid Offline Falsifier\n\nGenerated: ${report.generated}\nStatus: \`${report.status}\`\n\nThis is a research-only offline falsifier for the seeded range/grid idea. It uses existing local public Binance spot 4h candles for BTC/ETH/SOL, derives each grid range only from prior candles, requires BTC \`BTC_TRANSITION\` context, and compares the fixed grid against no-trade and buy-and-hold baselines after conservative costs. It does not change live alerts, watcher behavior, scheduler payloads, keys, accounts, risk/sizing, TP/SL, execution, or public posting.\n\n## Rule\n\n- Range: ${report.assumptions.range}\n- Grid: ${report.assumptions.grid}\n- BTC gate: ${report.assumptions.btcGate}\n- Round-trip cost: ${report.assumptions.costs.roundTripCostBps} bps\n\n## Grid Results\n\n${table([{ key: "grid_total", ...report.grid.total }, ...report.grid.bySymbol], summaryColumns)}\n\n## Buy-And-Hold Baselines\n\n${table([...report.baselines.buyHoldBySymbol, report.baselines.equalWeightBuyHold], buyHoldColumns)}\n\n## Grid By Month\n\n${table(report.grid.byMonth, summaryColumns)}\n\n## Grid By Exit Reason\n\n${table(report.grid.byExitReason, summaryColumns)}\n\n## Interpretation\n\nVerdict: \`${report.interpretation.verdict}\`\n\n${report.interpretation.summary}\n\n## Blockers\n\n${report.interpretation.blockers.map((item) => `- ${item}`).join("\n")}\n\n## Next Actions\n\n${report.interpretation.nextActions.map((item) => `- ${item}`).join("\n")}\n\n## Boundary Delta\n\nChanged: standalone research script and standalone JSON/Markdown outputs only.\n\nUnchanged: no scheduler or cron payloads, no live alerts, no watcher behavior, no keys/accounts/paid services, no sizing, no TP/SL, no execution behavior, no public posting, and no strategy promotion.\n`;

  await fs.writeFile(REPORT_MD_PATH, md);
  console.log(JSON.stringify({
    ok: true,
    status,
    trades: totalSummary.trades,
    netPnlPer10kUsd: totalSummary.netPnlPer10kUsd,
    maxDrawdownPct: totalSummary.maxDrawdownPct,
    bestBuyHold,
    output: "results/demo-sim-range-grid-offline-falsifier.md",
  }, null, 2));
}

main().catch((error) => {
  console.error(error);
  process.exit(1);
});
