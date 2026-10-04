#!/usr/bin/env node

import fs from "node:fs/promises";
import path from "node:path";
import { fetchConfiguredCandles } from "./market-data.mjs";

const ROOT = path.resolve(new URL("..", import.meta.url).pathname);
const RESULTS_DIR = path.join(ROOT, "results");
const CONFIG_FILE = path.join(ROOT, "config.default.json");
const CACHE_DIR = path.join(ROOT, "data", "planned-level-aggtrades-cache");
const OUT_JSON = path.join(RESULTS_DIR, "planned-level-proxy-replay.json");
const OUT_MD = path.join(RESULTS_DIR, "planned-level-proxy-replay.md");

const BINANCE_API = process.env.STRATEGY_FILTER_BINANCE_API || "https://api.binance.com";
const FETCH_ENABLED = process.env.PLANNED_LEVEL_PROXY_FETCH === "1";
const MAX_EVENTS = Number(process.env.PLANNED_LEVEL_PROXY_MAX_EVENTS || 8);
const MAX_FETCH_EVENTS = Number(process.env.PLANNED_LEVEL_PROXY_MAX_FETCH_EVENTS || 2);
const WINDOW_BEFORE_MS = Number(process.env.PLANNED_LEVEL_PROXY_BEFORE_MS || 5 * 60_000);
const WINDOW_AFTER_MS = Number(process.env.PLANNED_LEVEL_PROXY_AFTER_MS || 10 * 60_000);
const MAX_PAGES_PER_EVENT = Number(process.env.PLANNED_LEVEL_PROXY_MAX_PAGES || 12);
const SLEEP_MS = Number(process.env.PLANNED_LEVEL_PROXY_SLEEP_MS || 120);

const config = JSON.parse(await fs.readFile(CONFIG_FILE, "utf8"));
const btc = config.data.symbols.find((item) => item.symbol === "BTC");
const oneHour = config.data.timeframes.find((item) => item.id === "1h");
if (!btc || !oneHour) throw new Error("BTC 1h config is required for planned-level proxy replay");

const fetched = await fetchConfiguredCandles(btc, oneHour);
const candles = fetched.candles;
const events = selectPreviousDayLevelEvents(candles).slice(-MAX_EVENTS);
const rows = [];
for (const [index, event] of events.entries()) {
  const shouldFetch = FETCH_ENABLED && index >= Math.max(0, events.length - MAX_FETCH_EVENTS);
  rows.push(await enrichEvent(event, shouldFetch));
}

const report = {
  generatedAt: new Date().toISOString(),
  status: "research-only-no-live-execution",
  purpose: "planned-level public-orderflow proxy scaffold for Filip pdV/pdN Cluster Search lane",
  source: {
    candles: fetched.meta,
    trades: {
      provider: "binance_spot_public_aggTrades",
      auth: "none",
      fetchEnabled: FETCH_ENABLED,
      cacheDir: path.relative(ROOT, CACHE_DIR)
    }
  },
  schema: {
    eventFields: [
      "event_id",
      "symbol",
      "level_source",
      "level_price",
      "level_side",
      "setup_type",
      "btc_gate_entry",
      "classification",
      "candle_time_utc",
      "proxy_cluster_label",
      "mfe_1c_3c_5c",
      "mae_1c_3c_5c",
      "fast_kill_label"
    ],
    proxyFields: [
      "trade_side_delta_notional",
      "cvd_slope_notional_per_min",
      "aggressive_volume_at_level",
      "price_progress_per_aggressive_volume",
      "opposing_absorption_candidate",
      "fail_back_or_reclaim"
    ]
  },
  gates: {
    minFrozenEventsBeforeCandidate: 20,
    minFetchedTradeWindowsBeforeRule: 10,
    requiresBtcGate: true,
    requiresBaselineLift: true
  },
  totals: {
    candidateEvents: rows.length,
    fetchedTradeWindows: rows.filter((row) => row.tradeWindow.status === "ok").length,
    noFetchRows: rows.filter((row) => row.tradeWindow.status === "fetch_disabled").length,
    fetchFailedRows: rows.filter((row) => row.tradeWindow.status === "fetch_failed").length
  },
  rows,
  decision: decision(rows)
};

await fs.mkdir(RESULTS_DIR, { recursive: true });
await fs.writeFile(OUT_JSON, `${JSON.stringify(report, null, 2)}\n`);
await fs.writeFile(OUT_MD, renderMarkdown(report));

console.log(JSON.stringify({
  ok: true,
  verdict: report.decision.verdict,
  candidateEvents: report.totals.candidateEvents,
  fetchedTradeWindows: report.totals.fetchedTradeWindows,
  report: OUT_JSON
}, null, 2));

function selectPreviousDayLevelEvents(rows) {
  const enriched = withAtr(rows, 14);
  const levelsByDay = previousDayLevels(enriched);
  const out = [];
  const seen = new Set();

  for (let i = 20; i < enriched.length - 6; i += 1) {
    const candle = enriched[i];
    const levels = levelsByDay.get(dayKey(candle.time));
    if (!levels || !Number.isFinite(candle.atr) || candle.atr <= 0) continue;
    const keyDate = dayKey(candle.time);
    const btcGate = btcGateFor(enriched, i);

    if (!seen.has(`${keyDate}:pdh`) && candle.high > levels.high) {
      seen.add(`${keyDate}:pdh`);
      out.push(eventRow(enriched, i, levels.high, "previous_day_high", "up", btcGate));
    }
    if (!seen.has(`${keyDate}:pdl`) && candle.low < levels.low) {
      seen.add(`${keyDate}:pdl`);
      out.push(eventRow(enriched, i, levels.low, "previous_day_low", "down", btcGate));
    }
  }

  return out.filter(Boolean);
}

function eventRow(rows, index, levelPrice, levelSource, levelSide, btcGate) {
  const candle = rows[index];
  const atr = candle.atr;
  const buffer = atr * 0.05;
  const classification = levelSide === "up"
    ? candle.close > levelPrice + buffer ? "accepted_break" : candle.close <= levelPrice ? "sweep_rejection" : "mixed_weak_break"
    : candle.close < levelPrice - buffer ? "accepted_break" : candle.close >= levelPrice ? "sweep_rejection" : "mixed_weak_break";
  const setupType = setupTypeFor(levelSide, classification);
  const direction = setupDirection(setupType);
  const mfeMae = mfeMaeByCandles(rows, index, direction, candle.close);

  return {
    eventId: `BTC-1h-${levelSource}-${candle.time}`,
    symbol: "BTCUSDT",
    market: "binance_spot",
    levelSource,
    levelPrice: round(levelPrice, 2),
    levelSide,
    setupType,
    direction,
    btcGateEntry: btcGate,
    classification,
    candleTimeUtc: new Date(candle.time * 1000).toISOString(),
    proxyClusterLabel: "not_fetched",
    entryPriceProxy: round(candle.close, 2),
    atr: round(atr, 2),
    mfeMae,
    fastKillLabel: "unscored_without_trade_window"
  };
}

async function enrichEvent(event, shouldFetch) {
  const eventMs = Date.parse(event.candleTimeUtc);
  const startMs = eventMs - WINDOW_BEFORE_MS;
  const endMs = eventMs + WINDOW_AFTER_MS;
  if (!shouldFetch) {
    return {
      ...event,
      tradeWindow: {
        status: "fetch_disabled",
        reason: "Set PLANNED_LEVEL_PROXY_FETCH=1 for bounded public/no-key aggTrades windows.",
        start: new Date(startMs).toISOString(),
        end: new Date(endMs).toISOString()
      }
    };
  }

  try {
    const trades = await fetchAggTrades(event.symbol, startMs, endMs);
    const proxy = proxyFromTrades(trades, event, startMs, endMs);
    return {
      ...event,
      proxyClusterLabel: proxy.proxyClusterLabel,
      fastKillLabel: proxy.fastKillLabel,
      tradeWindow: proxy
    };
  } catch (error) {
    return {
      ...event,
      tradeWindow: {
        status: "fetch_failed",
        error: error?.message || String(error),
        start: new Date(startMs).toISOString(),
        end: new Date(endMs).toISOString()
      }
    };
  }
}

async function fetchAggTrades(symbol, startMs, endMs) {
  const cacheFile = path.join(CACHE_DIR, `${symbol}-${startMs}-${endMs}.json`);
  try {
    return JSON.parse(await fs.readFile(cacheFile, "utf8"));
  } catch (error) {
    if (error.code !== "ENOENT") throw error;
  }

  const trades = [];
  let cursor = startMs;
  let pages = 0;
  while (cursor <= endMs && pages < MAX_PAGES_PER_EVENT) {
    const url = new URL("/api/v3/aggTrades", BINANCE_API);
    url.searchParams.set("symbol", symbol);
    url.searchParams.set("startTime", String(cursor));
    url.searchParams.set("endTime", String(endMs));
    url.searchParams.set("limit", "1000");
    const response = await fetch(url);
    if (!response.ok) throw new Error(`${symbol} aggTrades ${response.status}: ${await response.text()}`);
    const payload = await response.json();
    const page = payload.map(parseAggTrade).filter(Boolean);
    pages += 1;
    if (!page.length) break;
    trades.push(...page);
    const nextCursor = Math.max(...page.map((trade) => trade.time)) + 1;
    if (nextCursor <= cursor) break;
    cursor = nextCursor;
    if (page.length < 1000) break;
    await sleep(SLEEP_MS);
  }

  const deduped = [...new Map(trades.map((trade) => [trade.id, trade])).values()]
    .filter((trade) => trade.time >= startMs && trade.time <= endMs)
    .sort((a, b) => a.time - b.time || a.id - b.id);
  await fs.mkdir(path.dirname(cacheFile), { recursive: true });
  await fs.writeFile(cacheFile, `${JSON.stringify(deduped, null, 2)}\n`);
  return deduped;
}

function proxyFromTrades(trades, event, startMs, endMs) {
  if (!trades.length) {
    return {
      status: "no_trades_returned",
      start: new Date(startMs).toISOString(),
      end: new Date(endMs).toISOString(),
      trades: 0,
      proxyClusterLabel: "not_available",
      fastKillLabel: "unscored_no_trades"
    };
  }

  const levelBand = Math.max(event.atr * 0.05, event.levelPrice * 0.0002);
  const nearLevel = trades.filter((trade) => Math.abs(trade.price - event.levelPrice) <= levelBand);
  const buy = sumNotional(trades.filter((trade) => trade.takerSide === "buy"));
  const sell = sumNotional(trades.filter((trade) => trade.takerSide === "sell"));
  const nearBuy = sumNotional(nearLevel.filter((trade) => trade.takerSide === "buy"));
  const nearSell = sumNotional(nearLevel.filter((trade) => trade.takerSide === "sell"));
  const first = trades[0];
  const last = trades.at(-1);
  const signedDelta = buy - sell;
  const minutes = Math.max(1, (endMs - startMs) / 60_000);
  const priceProgress = event.direction === "long"
    ? last.price - event.entryPriceProxy
    : event.entryPriceProxy - last.price;
  const aggressiveAtLevel = nearBuy + nearSell;
  const progressPerAggressiveVolume = aggressiveAtLevel > 0 ? priceProgress / aggressiveAtLevel : null;
  const opposingAbsorption = event.direction === "long"
    ? nearSell > nearBuy * 1.25 && priceProgress >= 0
    : nearBuy > nearSell * 1.25 && priceProgress >= 0;
  const failed = event.direction === "long"
    ? last.price < event.levelPrice
    : last.price > event.levelPrice;
  const proxyClusterLabel = classifyProxyCluster({ event, signedDelta, priceProgress, opposingAbsorption, failed });

  return {
    status: "ok",
    start: new Date(startMs).toISOString(),
    end: new Date(endMs).toISOString(),
    trades: trades.length,
    firstTradeTime: new Date(first.time).toISOString(),
    lastTradeTime: new Date(last.time).toISOString(),
    firstPrice: round(first.price, 2),
    lastPrice: round(last.price, 2),
    tradeSideDeltaNotional: Math.round(signedDelta),
    cvdSlopeNotionalPerMin: Math.round(signedDelta / minutes),
    aggressiveVolumeAtLevel: Math.round(aggressiveAtLevel),
    priceProgress: round(priceProgress, 2),
    priceProgressPerAggressiveVolume: round(progressPerAggressiveVolume, 8),
    opposingAbsorptionCandidate: opposingAbsorption,
    failBackOrReclaim: failed,
    proxyClusterLabel,
    fastKillLabel: failed ? "fast_kill_candidate" : "hold_or_retest_candidate"
  };
}

function classifyProxyCluster({ event, signedDelta, priceProgress, opposingAbsorption, failed }) {
  if (failed) return "fail_back_or_reclaim";
  if (opposingAbsorption) return "opposing_absorption_candidate";
  const aligned = event.direction === "long" ? signedDelta > 0 : signedDelta < 0;
  if (aligned && priceProgress > 0) return "acceptance_proxy";
  if (!aligned && priceProgress >= 0) return "absorption_proxy";
  return "mixed_no_trade_proxy";
}

function btcGateFor(rows, index) {
  const now = rows[index];
  const lookback = rows.slice(Math.max(0, index - 24), index);
  if (!lookback.length) return { regime: "BTC_STALE", reason: "insufficient lookback" };
  const high = Math.max(...lookback.map((row) => row.high));
  const low = Math.min(...lookback.map((row) => row.low));
  const range = high - low;
  if (!Number.isFinite(range) || range <= 0) return { regime: "BTC_STALE", reason: "invalid lookback range" };
  if (now.close > high) return { regime: "BTC_RISK_ON", reason: "1h close above prior 24h high", keyLevel: round(high, 2), price: round(now.close, 2) };
  if (now.close < low) return { regime: "BTC_RISK_OFF", reason: "1h close below prior 24h low", keyLevel: round(low, 2), price: round(now.close, 2) };
  if (high - now.close < range * 0.1 || now.close - low < range * 0.1) {
    return { regime: "BTC_TRANSITION", reason: "BTC near edge of prior 24h range", high: round(high, 2), low: round(low, 2), price: round(now.close, 2) };
  }
  return { regime: "BTC_TRANSITION", reason: "BTC inside prior 24h range", high: round(high, 2), low: round(low, 2), price: round(now.close, 2) };
}

function decision(rows) {
  const fetched = rows.filter((row) => row.tradeWindow.status === "ok").length;
  if (fetched < 10) {
    return {
      verdict: "schema_ready_trade_windows_low_sample",
      nextAction: "Freeze 20 planned-level paper events and fetch at least 10 public trade windows before testing hold/fast-kill rules.",
      noLiveChange: true
    };
  }
  return {
    verdict: "proxy_replay_rows_ready_for_baseline_test",
    nextAction: "Compare proxy labels against candle-only hold/kill baselines with costs and false-kill rates.",
    noLiveChange: true
  };
}

function setupTypeFor(levelSide, classification) {
  if (levelSide === "up" && classification === "accepted_break") return "continuation_long";
  if (levelSide === "up") return "fade_short";
  if (classification === "accepted_break") return "continuation_short";
  return "fade_long";
}

function setupDirection(setupType) {
  return setupType.endsWith("long") ? "long" : "short";
}

function mfeMaeByCandles(rows, index, direction, entry) {
  const out = {};
  for (const horizon of [1, 3, 5]) {
    const slice = rows.slice(index + 1, index + 1 + horizon);
    if (!slice.length) {
      out[`mfe${horizon}cPct`] = null;
      out[`mae${horizon}cPct`] = null;
      continue;
    }
    const favorable = direction === "long"
      ? Math.max(...slice.map((row) => row.high)) - entry
      : entry - Math.min(...slice.map((row) => row.low));
    const adverse = direction === "long"
      ? entry - Math.min(...slice.map((row) => row.low))
      : Math.max(...slice.map((row) => row.high)) - entry;
    out[`mfe${horizon}cPct`] = round((favorable / entry) * 100, 4);
    out[`mae${horizon}cPct`] = round((adverse / entry) * 100, 4);
  }
  return out;
}

function previousDayLevels(candles) {
  const byDay = new Map();
  for (const candle of candles) {
    const key = dayKey(candle.time);
    if (!byDay.has(key)) byDay.set(key, []);
    byDay.get(key).push(candle);
  }
  const days = [...byDay.keys()].sort();
  const levels = new Map();
  for (let i = 1; i < days.length; i += 1) {
    const previous = byDay.get(days[i - 1]);
    levels.set(days[i], {
      high: Math.max(...previous.map((row) => row.high)),
      low: Math.min(...previous.map((row) => row.low))
    });
  }
  return levels;
}

function withAtr(candles, period) {
  const out = [];
  const trs = [];
  for (let i = 0; i < candles.length; i += 1) {
    const previous = candles[i - 1];
    const candle = candles[i];
    const tr = previous
      ? Math.max(candle.high - candle.low, Math.abs(candle.high - previous.close), Math.abs(candle.low - previous.close))
      : candle.high - candle.low;
    trs.push(tr);
    const slice = trs.slice(Math.max(0, trs.length - period));
    out.push({ ...candle, atr: slice.reduce((sum, value) => sum + value, 0) / slice.length });
  }
  return out;
}

function parseAggTrade(row) {
  const id = Number(row.a);
  const price = Number(row.p);
  const quantity = Number(row.q);
  const time = Number(row.T);
  if (![id, price, quantity, time].every(Number.isFinite)) return null;
  return {
    id,
    price,
    quantity,
    time,
    notional: price * quantity,
    buyerIsMaker: Boolean(row.m),
    takerSide: row.m ? "sell" : "buy"
  };
}

function renderMarkdown(report) {
  const lines = [
    "# Planned-Level Proxy Replay",
    "",
    `Generated: ${report.generatedAt}`,
    "",
    "Research-only public-data scaffold for the Filip pdV/pdN / Cluster Search lane. It does not change live alerts, thresholds, sizing, execution, or strategy status.",
    "",
    "## Totals",
    "",
    `- Candidate events: ${report.totals.candidateEvents}`,
    `- Fetched trade windows: ${report.totals.fetchedTradeWindows}`,
    `- No-fetch rows: ${report.totals.noFetchRows}`,
    `- Fetch-failed rows: ${report.totals.fetchFailedRows}`,
    `- Verdict: ${report.decision.verdict}`,
    `- Next action: ${report.decision.nextAction}`,
    "",
    "## Gates",
    "",
    `- Minimum frozen events before candidate: ${report.gates.minFrozenEventsBeforeCandidate}`,
    `- Minimum fetched trade windows before rule: ${report.gates.minFetchedTradeWindowsBeforeRule}`,
    "- BTC gate required for every row.",
    "- Baseline lift required before any promotion.",
    "",
    "## Rows",
    ""
  ];
  for (const row of report.rows) {
    lines.push(
      `### ${row.eventId}`,
      "",
      `- Time: ${row.candleTimeUtc}`,
      `- Level: ${row.levelSource} ${row.levelSide} @ ${row.levelPrice}`,
      `- Setup: ${row.setupType}, classification=${row.classification}`,
      `- BTC gate: ${row.btcGateEntry.regime} (${row.btcGateEntry.reason})`,
      `- Proxy: ${row.proxyClusterLabel}, tradeWindow=${row.tradeWindow.status}`,
      `- Fast-kill label: ${row.fastKillLabel}`,
      ""
    );
  }
  return `${lines.join("\n")}\n`;
}

function sumNotional(rows) {
  return rows.reduce((sum, row) => sum + row.notional, 0);
}

function dayKey(sec) {
  return new Date(sec * 1000).toISOString().slice(0, 10);
}

function round(value, digits = 4) {
  return Number.isFinite(value) ? Number(value.toFixed(digits)) : null;
}

function sleep(ms) {
  return new Promise((resolve) => setTimeout(resolve, ms));
}
