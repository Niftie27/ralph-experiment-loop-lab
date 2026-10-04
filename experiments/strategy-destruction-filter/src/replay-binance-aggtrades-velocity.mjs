#!/usr/bin/env node

import fs from "node:fs/promises";
import path from "node:path";

const ROOT = path.resolve(new URL("..", import.meta.url).pathname);
const WORKSPACE_ROOT = path.resolve(ROOT, "../../..");
const FEEDBACK_PATH = path.join(WORKSPACE_ROOT, "crypto-updates", "runtime", "alert-feedback.jsonl");
const CACHE_DIR = path.join(ROOT, "data", "aggtrades-cache");
const RESULTS_DIR = path.join(ROOT, "results");
const REPORT_JSON = path.join(RESULTS_DIR, "binance-aggtrades-velocity-replay.json");
const REPORT_MD = path.join(RESULTS_DIR, "binance-aggtrades-velocity-replay.md");

const BINANCE_API = process.env.STRATEGY_FILTER_BINANCE_API || "https://api.binance.com";
const MAX_ALERTS = Number(process.env.VELOCITY_REPLAY_MAX_ALERTS || 80);
const DISABLE_CACHE = process.env.VELOCITY_REPLAY_DISABLE_CACHE === "1";
const RECENT_WINDOW_MS = 5_000;
const BASELINE_WINDOW_MS = 5 * 60_000;
const MAX_PAGES_PER_ALERT = 25;
const SLEEP_MS = 120;

const feedbackRecords = parseJsonl(await fs.readFile(FEEDBACK_PATH, "utf8"));
const alerts = new Map();
const reviews = [];
for (const record of feedbackRecords) {
  if (record.type === "alert_sent" && record.alert?.id) alerts.set(record.alert.id, record.alert);
  if (record.type === "review_finalized" && record.review?.id) reviews.push(record);
}

const candidates = reviews
  .filter((record) => record.review?.triggerKind === "VELOCITY")
  .map((record) => ({ alert: alerts.get(record.review.id), reviewRecord: record }))
  .filter(({ alert }) => isBinanceVelocityAlert(alert) && !strictQualityState(alert).exclude)
  .slice(0, MAX_ALERTS);

const replayRows = [];
for (const candidate of candidates) {
  replayRows.push(await replayAlert(candidate.alert, candidate.reviewRecord));
}

const report = {
  generatedAt: new Date().toISOString(),
  status: "research-only-no-live-execution",
  source: path.relative(WORKSPACE_ROOT, FEEDBACK_PATH),
  cacheDir: path.relative(WORKSPACE_ROOT, CACHE_DIR),
  scope: {
    venue: "binance_spot_public_aggTrades",
    maxAlerts: MAX_ALERTS,
    assets: [...new Set(candidates.map(({ alert }) => alert.assetLabel))].sort(),
    excluded: ["HYPE", "non-VELOCITY triggers", "strict-quality failures"]
  },
  replayMethod: {
    endpoint: "/api/v3/aggTrades",
    auth: "none",
    recentWindowMs: RECENT_WINDOW_MS,
    baselineWindowMs: BASELINE_WINDOW_MS,
    baselineSlots: baselineSlots(),
    volumeVelocityFormula: "recent_5s_notional / mean(previous_5m_split_into_5s_slots)",
    priceMoveFormula: "last_trade_at_or_before_event / last_trade_at_or_before_event_minus_trigger_window - 1"
  },
  totals: summarizeReplayRows(replayRows),
  buckets: summarizeBuckets(replayRows.filter((row) => row.replay.status === "ok")),
  rows: replayRows,
  decision: decisionForRows(replayRows)
};

await fs.mkdir(RESULTS_DIR, { recursive: true });
await fs.writeFile(REPORT_JSON, `${JSON.stringify(report, null, 2)}\n`);
await fs.writeFile(REPORT_MD, renderMarkdown(report));

console.log(JSON.stringify({
  ok: true,
  replayed: report.totals.replayed,
  replayOk: report.totals.replayOk,
  exactMatch: report.totals.exactMatch,
  usableRows: report.totals.usableRows,
  verdict: report.decision.verdict,
  report: REPORT_JSON
}, null, 2));

async function replayAlert(alert, reviewRecord) {
  const review = reviewRecord.review;
  const alertMs = Number(alert.eventTime || review.alertTime);
  const windowMs = Number(alert.windowMs || review.windowMs || windowMsForLabel(review.triggerLabel));
  const startMs = alertMs - Math.max(windowMs, BASELINE_WINDOW_MS) - 60_000;
  const endMs = alertMs;
  const symbol = String(alert.assetSymbol || "").toUpperCase();
  const quality = strictQualityState(alert);

  try {
    const trades = await fetchAggTrades(symbol, startMs, endMs);
    const replay = replayFromTrades(trades, alertMs, windowMs, review);
    return buildReplayRow({ alert, reviewRecord, quality, symbol, startMs, endMs, trades, replay });
  } catch (error) {
    return buildReplayRow({
      alert,
      reviewRecord,
      quality,
      symbol,
      startMs,
      endMs,
      trades: [],
      replay: { status: "fetch_failed", error: error?.message || String(error) }
    });
  }
}

function buildReplayRow({ alert, reviewRecord, quality, symbol, startMs, endMs, trades, replay }) {
  const review = reviewRecord.review;
  return {
    id: review.id,
    asset: review.assetLabel,
    symbol,
    direction: review.direction,
    triggerLabel: review.triggerLabel,
    windowMs: alert.windowMs || windowMsForLabel(review.triggerLabel),
    alertTime: review.alertTimeIso,
    strictQuality: quality,
    fetchWindow: {
      start: new Date(startMs).toISOString(),
      end: new Date(endMs).toISOString(),
      trades: trades.length
    },
    recorded: {
      triggerMovePct: round(review.triggerMovePct),
      volumeRecentNotional: Number.isFinite(review.volumeRecentNotional) ? Math.round(review.volumeRecentNotional) : null,
      volumeVelocityRatio: round(review.volumeVelocityRatio),
      verdict: reviewRecord.classification?.verdict || "unknown",
      move30mPct: checkpointMove(review, "30m"),
      move1hPct: checkpointMove(review, "1h")
    },
    replay
  };
}

async function fetchAggTrades(symbol, startMs, endMs) {
  const cacheFile = path.join(CACHE_DIR, `${symbol}-${startMs}-${endMs}.json`);
  if (!DISABLE_CACHE) {
    try {
      return JSON.parse(await fs.readFile(cacheFile, "utf8"));
    } catch (error) {
      if (error.code !== "ENOENT") throw error;
    }
  }

  const trades = [];
  let cursor = startMs;
  let pages = 0;
  while (cursor <= endMs && pages < MAX_PAGES_PER_ALERT) {
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

  if (!DISABLE_CACHE) {
    await fs.mkdir(path.dirname(cacheFile), { recursive: true });
    await fs.writeFile(cacheFile, `${JSON.stringify(deduped, null, 2)}\n`);
  }
  return deduped;
}

function parseAggTrade(row) {
  const id = Number(row.a);
  const price = Number(row.p);
  const quantity = Number(row.q);
  const time = Number(row.T);
  if (![id, price, quantity, time].every(Number.isFinite)) return null;
  const notional = price * quantity;
  return {
    id,
    price,
    quantity,
    time,
    notional,
    buyerIsMaker: Boolean(row.m),
    takerSide: row.m ? "sell" : "buy"
  };
}

function replayFromTrades(trades, alertMs, windowMs, review) {
  if (!trades.length) return { status: "no_trades_returned" };
  const baselineTrade = lastTradeAtOrBefore(trades, alertMs - windowMs);
  const currentTrade = lastTradeAtOrBefore(trades, alertMs);
  if (!baselineTrade || !currentTrade) return { status: "missing_price_baseline" };

  const recent = sumNotional(trades, alertMs - RECENT_WINDOW_MS, alertMs);
  const baseline = sumNotional(trades, alertMs - BASELINE_WINDOW_MS, alertMs - RECENT_WINDOW_MS);
  const averageSlot = baseline / baselineSlots();
  const ratio = averageSlot > 0 ? recent / averageSlot : null;
  const movePct = (currentTrade.price - baselineTrade.price) / baselineTrade.price * 100;
  const recentBuy = sumNotional(trades.filter((trade) => trade.takerSide === "buy"), alertMs - RECENT_WINDOW_MS, alertMs);
  const recentSell = sumNotional(trades.filter((trade) => trade.takerSide === "sell"), alertMs - RECENT_WINDOW_MS, alertMs);

  const recordedMove = Number(review.triggerMovePct);
  const recordedRecent = Number(review.volumeRecentNotional);
  const recordedRatio = Number(review.volumeVelocityRatio);
  const moveAbsDiffPct = Number.isFinite(recordedMove) ? Math.abs(movePct - recordedMove) : null;
  const recentRelativeDiff = Number.isFinite(recordedRecent) && recordedRecent > 0 ? Math.abs(recent - recordedRecent) / recordedRecent : null;
  const ratioRelativeDiff = Number.isFinite(recordedRatio) && recordedRatio > 0 ? Math.abs(ratio - recordedRatio) / recordedRatio : null;
  const exactMatch =
    moveAbsDiffPct !== null &&
    recentRelativeDiff !== null &&
    ratioRelativeDiff !== null &&
    Math.sign(movePct) === Math.sign(recordedMove) &&
    moveAbsDiffPct <= 0.05 &&
    recentRelativeDiff <= 0.15 &&
    ratioRelativeDiff <= 0.25;

  return {
    status: "ok",
    tradeCount: trades.length,
    baselineTradeTime: new Date(baselineTrade.time).toISOString(),
    currentTradeTime: new Date(currentTrade.time).toISOString(),
    triggerMovePct: round(movePct),
    volumeRecentNotional: Math.round(recent),
    volumeAverageSlotNotional: Math.round(averageSlot),
    volumeVelocityRatio: round(ratio),
    recentAggressiveBuyNotional: Math.round(recentBuy),
    recentAggressiveSellNotional: Math.round(recentSell),
    moveAbsDiffPct: round(moveAbsDiffPct),
    recentRelativeDiff: round(recentRelativeDiff),
    ratioRelativeDiff: round(ratioRelativeDiff),
    exactMatch,
    usableForBucket: exactMatch
  };
}

function summarizeReplayRows(rows) {
  return {
    replayed: rows.length,
    replayOk: rows.filter((row) => row.replay.status === "ok").length,
    fetchFailed: rows.filter((row) => row.replay.status === "fetch_failed").length,
    noTradesReturned: rows.filter((row) => row.replay.status === "no_trades_returned").length,
    exactMatch: rows.filter((row) => row.replay.exactMatch).length,
    usableRows: rows.filter((row) => row.replay.usableForBucket).length,
    verdicts: countBy(rows, (row) => row.recorded.verdict)
  };
}

function summarizeBuckets(rows) {
  const groups = new Map();
  for (const row of rows.filter((item) => item.replay.usableForBucket)) {
    const key = [row.asset, row.triggerLabel, row.direction, row.recorded.verdict].join("|");
    if (!groups.has(key)) groups.set(key, []);
    groups.get(key).push(row);
  }
  return [...groups.entries()].map(([key, bucketRows]) => {
    const [asset, triggerLabel, direction, verdict] = key.split("|");
    return {
      key,
      asset,
      triggerLabel,
      direction,
      verdict,
      sample: bucketRows.length,
      avgReplayVelocityRatio: average(bucketRows.map((row) => row.replay.volumeVelocityRatio)),
      avgReplayMovePct: average(bucketRows.map((row) => row.replay.triggerMovePct)),
      ids: bucketRows.map((row) => row.id)
    };
  }).sort((a, b) => b.sample - a.sample || a.key.localeCompare(b.key));
}

function decisionForRows(rows) {
  const totals = summarizeReplayRows(rows);
  if (!rows.length) {
    return {
      verdict: "no_binance_velocity_rows_to_replay",
      nextStep: "Stop; no strict candidate can be built from this path.",
      noLiveChange: true
    };
  }
  if (totals.replayOk === 0) {
    return {
      verdict: "public_aggtrades_replay_not_currently_accessible",
      nextStep: "Do not add a candidate; record access failure and revisit with a smaller window or alternate public archive.",
      noLiveChange: true
    };
  }
  if (totals.usableRows < 10) {
    return {
      verdict: "insufficient_exact_replay_rows_for_candidate",
      nextStep: "Do not add a candidate; improve coverage before strict filter conversion.",
      noLiveChange: true
    };
  }
  return {
    verdict: "exact_replay_rows_available_for_bucket_selection",
    nextStep: "Use replay-clean buckets only; require sample size, same mechanism, and strict filter survival before forward paper design.",
    noLiveChange: true
  };
}

function renderMarkdown(report) {
  const lines = [
    "# Binance AggTrades Velocity Replay",
    "",
    `Generated: ${report.generatedAt}`,
    "",
    "Status: research-only replay over public/no-key Binance aggregate trades. No live trading, orders, keys, paid APIs, cron, watcher behavior, alert wording, risk, sizing, TP/SL, or execution changed.",
    "",
    "## Verdict",
    "",
    `- ${report.decision.verdict}`,
    `- Next: ${report.decision.nextStep}`,
    "",
    "## Totals",
    "",
    `- Replayed rows: ${report.totals.replayed}`,
    `- Replay OK: ${report.totals.replayOk}`,
    `- Fetch failed: ${report.totals.fetchFailed}`,
    `- No trades returned: ${report.totals.noTradesReturned}`,
    `- Exact watcher-field matches: ${report.totals.exactMatch}`,
    `- Usable bucket rows: ${report.totals.usableRows}`,
    "",
    "## Buckets",
    ""
  ];

  if (!report.buckets.length) lines.push("- none");
  for (const bucket of report.buckets) {
    lines.push(
      `- ${bucket.key}: N=${bucket.sample}, avgVelocity=${bucket.avgReplayVelocityRatio}, avgMove=${bucket.avgReplayMovePct}%`
    );
  }

  lines.push("", "## Rows", "");
  for (const row of report.rows.slice(0, 40)) {
    lines.push(
      `- ${row.id}: ${row.asset} ${row.triggerLabel} ${row.direction}, replay=${row.replay.status}, ` +
      `match=${row.replay.exactMatch ?? false}, recordedVol=${row.recorded.volumeVelocityRatio}, replayVol=${row.replay.volumeVelocityRatio ?? "n/a"}`
    );
  }
  if (report.rows.length > 40) lines.push(`- ... ${report.rows.length - 40} more rows in binance-aggtrades-velocity-replay.json`);

  return `${lines.join("\n")}\n`;
}

function isBinanceVelocityAlert(alert) {
  if (!alert || alert.triggerKind !== "VELOCITY") return false;
  if (/Hyperliquid/i.test(alert.source || "")) return false;
  return /^[a-z0-9]+usdt$/i.test(alert.assetSymbol || "");
}

function strictQualityState(alert) {
  const evidence = alert?.evidence || null;
  const features = evidence?.features || {};
  const reasons = [];
  if (!alert) reasons.push("missing_alert_record");
  if (alert?.id === "ETH-UP-1787063419374-k24uu9") reasons.push("delayed_or_untrusted_delivery");
  if (Number.isFinite(features.bookAgeMs) && features.bookAgeMs < 0) reasons.push("negative_bookAgeMs");
  if (Number.isFinite(evidence?.score) && Number.isFinite(evidence?.maxScore) && evidence.score > evidence.maxScore) {
    reasons.push("score_gt_maxScore");
  }
  return { exclude: reasons.length > 0, reasons };
}

function windowMsForLabel(label) {
  if (label === "60s") return 60_000;
  if (label === "5m") return 5 * 60_000;
  if (label === "15m") return 15 * 60_000;
  return null;
}

function lastTradeAtOrBefore(trades, time) {
  let best = null;
  for (const trade of trades) {
    if (trade.time <= time) best = trade;
    else break;
  }
  return best;
}

function sumNotional(trades, since, until) {
  return trades.reduce((sum, trade) => (
    trade.time >= since && trade.time <= until ? sum + trade.notional : sum
  ), 0);
}

function baselineSlots() {
  return Math.max(1, (BASELINE_WINDOW_MS - RECENT_WINDOW_MS) / RECENT_WINDOW_MS);
}

function checkpointMove(review, label) {
  return review.checkpoints?.find((checkpoint) => checkpoint.label === label)?.directionalMovePct ?? null;
}

function countBy(rows, keyFn) {
  return rows.reduce((counts, row) => {
    const key = keyFn(row);
    counts[key] = (counts[key] || 0) + 1;
    return counts;
  }, {});
}

function average(values) {
  const numeric = values.filter(Number.isFinite);
  if (!numeric.length) return null;
  return round(numeric.reduce((sum, value) => sum + value, 0) / numeric.length);
}

function parseJsonl(text) {
  return text.split(/\n+/).filter(Boolean).map((line) => JSON.parse(line));
}

function sleep(ms) {
  return new Promise((resolve) => setTimeout(resolve, ms));
}

function round(value, digits = 4) {
  return Number.isFinite(value) ? Number(value.toFixed(digits)) : null;
}
