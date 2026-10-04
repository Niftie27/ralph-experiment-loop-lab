#!/usr/bin/env node

import fs from "node:fs/promises";
import path from "node:path";

const ROOT = path.resolve(new URL("..", import.meta.url).pathname);
const WORKSPACE_ROOT = path.resolve(ROOT, "../../..");
const FEEDBACK_PATH = path.join(WORKSPACE_ROOT, "crypto-updates", "runtime", "alert-feedback.jsonl");
const CANDLE_CACHE_PATH = path.join(WORKSPACE_ROOT, "crypto-updates", "runtime", "setup-candle-context-cache.json");
const RESULTS_DIR = path.join(ROOT, "results");
const REPORT_JSON = path.join(RESULTS_DIR, "velocity-replay-adapter-feasibility.json");
const REPORT_MD = path.join(RESULTS_DIR, "velocity-replay-adapter-feasibility.md");

const feedbackRecords = parseJsonl(await fs.readFile(FEEDBACK_PATH, "utf8"));
const candleCache = await readJson(CANDLE_CACHE_PATH, {});
const alerts = new Map();
const reviews = [];

for (const record of feedbackRecords) {
  if (record.type === "alert_sent" && record.alert?.id) alerts.set(record.alert.id, record.alert);
  if (record.type === "review_finalized" && record.review?.id) reviews.push(record);
}

const rows = reviews
  .filter((record) => record.review?.triggerKind === "VELOCITY")
  .map((record) => velocityReplayRow(alerts.get(record.review.id), record))
  .filter(Boolean);

const includedRows = rows.filter((row) => !row.strictQuality.exclude);
const adapterSummary = summarizeRows(includedRows);
const report = {
  generatedAt: new Date().toISOString(),
  status: "research-only-no-live-execution",
  purpose: "bounded feasibility check for replaying watcher volume-velocity alerts from public/no-key historical data",
  sources: {
    feedback: path.relative(WORKSPACE_ROOT, FEEDBACK_PATH),
    oneMinuteCandleCache: path.relative(WORKSPACE_ROOT, CANDLE_CACHE_PATH),
    watcherImplementation: "crypto-updates/realtime-market-watcher.mjs volumeVelocity(): 5s recent notional versus previous 5m split into 5s slots"
  },
  strictExclusions: ["missing_alert_record", "delayed_or_untrusted_delivery", "negative_bookAgeMs", "score_gt_maxScore"],
  feasibility: {
    oneMinuteCandles: {
      status: adapterSummary.rowsWithCandleCoverage > 0 ? "usable_for_coarse_price_context_only" : "not_available_in_current_cache",
      canReconstructAlertDirection: "coarse_only",
      canReconstructVolumeVelocityRatio: false,
      reason: "Watcher volume velocity is a 5s notional burst metric; 1m OHLCV compresses twelve 5s slots and cannot replay the triggering slot or intraminute event ordering."
    },
    binancePublicAggTrades: {
      status: "proposed_no_key_adapter",
      canReconstructAlertDirection: true,
      canReconstructVolumeVelocityRatio: true,
      assets: ["BTC", "ETH", "SOL", "XRP"],
      reason: "Binance aggTrades are public/no-key and include millisecond timestamps, trade price, quantity, and buyer-maker side, enough to rebuild 5s notional slots and 60s/5m price baselines around Binance alerts."
    },
    hyperliquidHistoricalTrades: {
      status: "unverified_for_historical_replay",
      canReconstructAlertDirection: "unknown",
      canReconstructVolumeVelocityRatio: "unknown",
      assets: ["HYPE"],
      reason: "Current HYPE alert rows are event-only allMids in this path. Treat them as movement taxonomy until Hyperliquid historical trades/book access is verified for the same windows."
    },
    historicalOrderBook: {
      status: "not_reconstructable_from_1m_candles_or_aggTrades",
      canReconstructFreshBookEvidence: false,
      reason: "Fresh book state requires recorded alert evidence or a live depth capture. Public candle and aggTrade archives do not recreate top-of-book freshness, spread, or depth imbalance at alert time."
    }
  },
  totals: {
    velocityReviews: rows.length,
    includedAfterStrictQuality: includedRows.length,
    excludedByStrictQuality: rows.length - includedRows.length,
    rowsWithOneMinuteCandleCoverage: adapterSummary.rowsWithCandleCoverage,
    rowsWithCoarseMoveSameSign: adapterSummary.rowsWithCoarseMoveSameSign,
    rowsWithRecordedVolumeVelocity: adapterSummary.rowsWithRecordedVolumeVelocity,
    rowsNeedingAggTradesForExactVolumeVelocity: adapterSummary.rowsNeedingAggTradesForExactVolumeVelocity
  },
  rows: includedRows,
  decision: {
    verdict: "build_public_aggtrades_adapter_before_any_new_strict_candidate",
    rationale: [
      "A 1m-only adapter is useful for context and sanity checks but would overclaim exact 5s volume-velocity reconstruction.",
      "The clean ETH bucket remains tiny, and the prior OHLCV proxy was killed by the destruction filter.",
      "The next honest upgrade is a Binance public aggTrades replay for Binance assets plus explicit non-replay status for historical book/HYPE rows."
    ],
    noLiveChange: true
  }
};

await fs.mkdir(RESULTS_DIR, { recursive: true });
await fs.writeFile(REPORT_JSON, `${JSON.stringify(report, null, 2)}\n`);
await fs.writeFile(REPORT_MD, renderMarkdown(report));

console.log(JSON.stringify({
  ok: true,
  verdict: report.decision.verdict,
  velocityReviews: report.totals.velocityReviews,
  includedAfterStrictQuality: report.totals.includedAfterStrictQuality,
  rowsWithOneMinuteCandleCoverage: report.totals.rowsWithOneMinuteCandleCoverage,
  rowsNeedingAggTradesForExactVolumeVelocity: report.totals.rowsNeedingAggTradesForExactVolumeVelocity,
  report: REPORT_JSON
}, null, 2));

function parseJsonl(text) {
  return text.split(/\n+/).filter(Boolean).map((line) => JSON.parse(line));
}

async function readJson(file, fallback) {
  try {
    return JSON.parse(await fs.readFile(file, "utf8"));
  } catch {
    return fallback;
  }
}

function velocityReplayRow(alert, record) {
  const review = record.review;
  const strictQuality = strictQualityState(alert);
  if (!alert) {
    return {
      id: review.id,
      asset: review.assetLabel,
      triggerLabel: review.triggerLabel,
      direction: review.direction,
      strictQuality
    };
  }

  const alertMs = Number(alert.eventTime || review.alertTime);
  const candleSource = candleSourceFor(alert);
  const candleEntry = findCandleCacheEntry(candleSource, alertMs);
  const oneMinuteReplay = candleEntry
    ? replayFromOneMinuteCandles(candleEntry.candles || [], alert, review)
    : { status: "missing_cache_coverage", reason: "No cached public 1m candle context covers this alert timestamp." };

  return {
    id: review.id,
    asset: review.assetLabel,
    symbol: review.assetSymbol,
    source: review.source,
    alertTime: review.alertTimeIso,
    direction: review.direction,
    triggerLabel: review.triggerLabel,
    windowMs: alert.windowMs,
    recordedTriggerMovePct: round(review.triggerMovePct),
    recordedVolumeVelocityRatio: round(review.volumeVelocityRatio),
    recordedVolumeRecentNotional: Number.isFinite(review.volumeRecentNotional) ? Math.round(review.volumeRecentNotional) : null,
    strictQuality,
    oneMinuteReplay,
    exactReplayRequirement: exactReplayRequirement(alert)
  };
}

function strictQualityState(alert) {
  if (!alert) return { exclude: true, reasons: ["missing_alert_record"] };
  const evidence = alert.evidence || null;
  const features = evidence?.features || {};
  const reasons = [];
  if (alert.id === "ETH-UP-1787063419374-k24uu9") reasons.push("delayed_or_untrusted_delivery");
  if (Number.isFinite(features.bookAgeMs) && features.bookAgeMs < 0) reasons.push("negative_bookAgeMs");
  if (Number.isFinite(evidence?.score) && Number.isFinite(evidence?.maxScore) && evidence.score > evidence.maxScore) {
    reasons.push("score_gt_maxScore");
  }
  return { exclude: reasons.length > 0, reasons };
}

function candleSourceFor(alert) {
  if (/Hyperliquid allMids/i.test(alert.source || "") || String(alert.assetLabel).toUpperCase() === "HYPE") {
    return { venue: "hyperliquid", id: String(alert.assetLabel || alert.assetSymbol || "").toUpperCase() };
  }
  return { venue: "binance_spot", id: String(alert.assetSymbol || "").toUpperCase() };
}

function findCandleCacheEntry(source, alertMs) {
  for (const [key, value] of Object.entries(candleCache)) {
    if (!key.startsWith(`${source.venue}:${source.id}:`)) continue;
    if (Number(value.startMs) <= alertMs && Number(value.endMs) >= alertMs) return { key, ...value };
  }
  return null;
}

function replayFromOneMinuteCandles(candles, alert, review) {
  const alertMs = Number(alert.eventTime || review.alertTime);
  const windowMs = Number(alert.windowMs || review.windowMs);
  const current = candleAtOrBefore(candles, alertMs);
  const baseline = candleAtOrBefore(candles, alertMs - windowMs);
  if (!current || !baseline || !Number.isFinite(windowMs)) {
    return { status: "insufficient_candles", reason: "Could not locate candle-aligned alert and baseline prices." };
  }

  const coarseMovePct = pctMove(baseline.close, current.close);
  const sameSign = Math.sign(coarseMovePct) === Math.sign(Number(review.triggerMovePct));
  const windowStart = alertMs - Math.max(windowMs, 60_000);
  const recentCandles = candles.filter((candle) => candle.time >= windowStart && candle.time <= alertMs);
  const coarseRecentNotional = recentCandles.reduce((sum, candle) => sum + candle.close * candle.volume, 0);
  const recordedNotional = Number(review.volumeRecentNotional);
  const notionalRatioToRecorded =
    Number.isFinite(recordedNotional) && recordedNotional > 0 ? coarseRecentNotional / recordedNotional : null;

  return {
    status: "coarse_1m_replay",
    candleCacheKey: findCandleCacheEntry(candleSourceFor(alert), alertMs)?.key || null,
    baselineCandleTime: new Date(baseline.time).toISOString(),
    alertCandleTime: new Date(current.time).toISOString(),
    coarseMovePct: round(coarseMovePct),
    recordedMovePct: round(review.triggerMovePct),
    sameSign,
    coarseRecentNotional: Math.round(coarseRecentNotional),
    notionalRatioToRecorded: round(notionalRatioToRecorded),
    limitations: [
      "Candle close may be before or after the exact intraminute alert tick.",
      "1m volume is a whole-minute aggregate and cannot isolate the watcher 5s recent slot.",
      "1m candles cannot replay fresh book state."
    ]
  };
}

function exactReplayRequirement(alert) {
  const asset = String(alert.assetLabel || "").toUpperCase();
  if (asset === "HYPE") {
    return {
      status: "needs_hyperliquid_historical_trade_access_verification",
      requiredData: ["millisecond trades or mids around event", "optional l2Book snapshots for book evidence"]
    };
  }
  return {
    status: "needs_binance_public_aggtrades",
    requiredData: ["aggTrades from eventTime-5m through eventTime", "optional recorded live depth evidence for book state"]
  };
}

function candleAtOrBefore(candles, targetMs) {
  let best = null;
  for (const candle of candles) {
    if (Number(candle.time) <= targetMs && (!best || Number(candle.time) > Number(best.time))) best = candle;
  }
  return best;
}

function pctMove(from, to) {
  if (!Number.isFinite(from) || !Number.isFinite(to) || from === 0) return null;
  return (to - from) / from * 100;
}

function summarizeRows(rows) {
  return rows.reduce((summary, row) => {
    if (row.oneMinuteReplay?.status === "coarse_1m_replay") summary.rowsWithCandleCoverage += 1;
    if (row.oneMinuteReplay?.sameSign === true) summary.rowsWithCoarseMoveSameSign += 1;
    if (row.recordedVolumeVelocityRatio !== null) summary.rowsWithRecordedVolumeVelocity += 1;
    if (row.exactReplayRequirement?.status === "needs_binance_public_aggtrades") {
      summary.rowsNeedingAggTradesForExactVolumeVelocity += 1;
    }
    return summary;
  }, {
    rowsWithCandleCoverage: 0,
    rowsWithCoarseMoveSameSign: 0,
    rowsWithRecordedVolumeVelocity: 0,
    rowsNeedingAggTradesForExactVolumeVelocity: 0
  });
}

function renderMarkdown(report) {
  const lines = [
    "# Velocity Replay Adapter Feasibility",
    "",
    `Generated: ${report.generatedAt}`,
    "",
    "Status: research-only feasibility check. No live trading, orders, keys, paid APIs, cron, watcher behavior, alert wording, risk, or sizing changed.",
    "",
    "## Verdict",
    "",
    `- ${report.decision.verdict}`,
    "",
    "## Totals",
    "",
    `- Velocity reviews: ${report.totals.velocityReviews}`,
    `- Included after strict quality: ${report.totals.includedAfterStrictQuality}`,
    `- Excluded by strict quality: ${report.totals.excludedByStrictQuality}`,
    `- 1m candle coverage: ${report.totals.rowsWithOneMinuteCandleCoverage}`,
    `- Coarse 1m same-sign moves: ${report.totals.rowsWithCoarseMoveSameSign}`,
    `- Rows needing Binance public aggTrades for exact volume velocity: ${report.totals.rowsNeedingAggTradesForExactVolumeVelocity}`,
    "",
    "## Adapter Decision",
    "",
    "- 1m candles: usable for coarse price context only; not exact volume velocity replay.",
    "- Binance public aggTrades: proposed no-key adapter for exact 5s notional slots on BTC/ETH/SOL/XRP.",
    "- HYPE: keep event-only until historical Hyperliquid trade/book access is verified.",
    "- Historical book evidence: cannot be reconstructed from candles or aggTrades; needs recorded live depth evidence.",
    "",
    "## Rows",
    ""
  ];

  const shownRows = report.rows.slice(0, 30);
  for (const row of shownRows) {
    lines.push(
      `- ${row.id}: ${row.asset} ${row.triggerLabel} ${row.direction}, recordedMove=${row.recordedTriggerMovePct}%, ` +
      `1mReplay=${row.oneMinuteReplay?.status || "unknown"}, exact=${row.exactReplayRequirement?.status || "unknown"}`
    );
  }
  if (report.rows.length > shownRows.length) {
    lines.push(`- ... ${report.rows.length - shownRows.length} more rows in velocity-replay-adapter-feasibility.json`);
  }

  lines.push("", "## Rationale", "");
  for (const item of report.decision.rationale) lines.push(`- ${item}`);
  return `${lines.join("\n")}\n`;
}

function round(value, digits = 4) {
  return Number.isFinite(value) ? Number(value.toFixed(digits)) : null;
}
