#!/usr/bin/env node

import fs from "node:fs/promises";
import path from "node:path";

const ROOT = path.resolve(new URL("..", import.meta.url).pathname);
const RESULTS_DIR = path.join(ROOT, "results");
const DATA_DIR = path.join(ROOT, "data", "funding");
const REPLAY_JSON_PATH = path.join(RESULTS_DIR, "historical-demo-sim-replay.json");
const SURVIVOR_STRESS_JSON_PATH = path.join(RESULTS_DIR, "demo-sim-range-breakout-survivor-stress.json");
const FUNDING_CACHE_PATH = path.join(DATA_DIR, "hyperliquid-funding-history-demo-sim.json");
const REPORT_JSON_PATH = path.join(RESULTS_DIR, "demo-sim-funding-persistence-context-baseline.json");
const REPORT_MD_PATH = path.join(RESULTS_DIR, "demo-sim-funding-persistence-context-baseline.md");

const HYPERLIQUID_INFO = "https://api.hyperliquid.xyz/info";
const STARTING_CAPITAL_USD = 10_000;
const FUNDING_LOOKBACK_HOURS = 24;
const FUNDING_MAX_STALE_HOURS = 12;
const PERSISTENCE_MIN_STREAK = 8;
const PERSISTENCE_MIN_SHARE = 0.75;
const CACHE_MAX_AGE_HOURS = 24 * 14;
const FETCH_PAD_DAYS = 3;

const BOUNDARIES = [
  "research_only",
  "public_no_key_hyperliquid_funding_history",
  "existing_demo_sim_replay_rows_only",
  "demo_sim_paper_fund_is_comparison_surface_only",
  "no_live_execution",
  "no_exchange_keys_or_accounts",
  "no_paid_apis",
  "no_scheduler_or_cron_changes",
  "no_tradingview_automation",
  "no_alert_wording_threshold_watcher_or_sizing_changes",
  "no_tp_sl_changes",
  "no_strategy_promotion",
];

const round = (value, digits = 4) => Number.isFinite(value) ? Number(value.toFixed(digits)) : null;
const pct = (value) => Number.isFinite(value) ? `${(value * 100).toFixed(1)}%` : "n/a";
const money = (value) => Number.isFinite(value) ? value.toFixed(2) : "n/a";
const cell = (value) => String(value ?? "n/a").replaceAll("|", " / ");

async function readJson(file) {
  return JSON.parse(await fs.readFile(file, "utf8"));
}

async function readJsonIfExists(file) {
  try {
    return JSON.parse(await fs.readFile(file, "utf8"));
  } catch {
    return null;
  }
}

async function writeJson(file, value) {
  await fs.mkdir(path.dirname(file), { recursive: true });
  await fs.writeFile(file, `${JSON.stringify(value, null, 2)}\n`);
}

function closedRecords(replay) {
  return (Array.isArray(replay.records) ? replay.records : [])
    .filter((record) => record.status === "closed")
    .sort((a, b) => (a.exitTime ?? 0) - (b.exitTime ?? 0) || String(a.id).localeCompare(String(b.id)));
}

function selectedRows(records) {
  return records.filter((row) => (
    row.setup === "range_breakout_long"
    && row.direction === "long"
    && row.btcGate?.state === "BTC_RISK_ON"
  ));
}

function topPocketRows(records) {
  return selectedRows(records).filter((row) => (
    row.timeframe === "4h"
    && ["B", "low-sample"].includes(row.tier)
  ));
}

function adjustedPnl(row) {
  return row.pnl?.netPnlUsd ?? 0;
}

function maxDrawdown(rows, startingCapitalUsd = STARTING_CAPITAL_USD) {
  let equity = startingCapitalUsd;
  let peak = startingCapitalUsd;
  let maxDrawdownUsd = 0;
  let maxDrawdownPct = 0;
  let maxDrawdownAt = null;
  let drawdownStartAt = null;
  let peakAt = null;

  for (const row of rows) {
    equity += adjustedPnl(row);
    if (equity > peak) {
      peak = equity;
      peakAt = row.exitTimeIso ?? null;
    }
    const drawdownUsd = peak - equity;
    const drawdownPct = peak > 0 ? drawdownUsd / peak : 0;
    if (drawdownUsd > maxDrawdownUsd) {
      maxDrawdownUsd = drawdownUsd;
      maxDrawdownPct = drawdownPct;
      maxDrawdownAt = row.exitTimeIso ?? null;
      drawdownStartAt = peakAt;
    }
  }

  return {
    endingEquityUsd: round(equity, 2),
    maxDrawdownUsd: round(maxDrawdownUsd, 2),
    maxDrawdownPct: round(maxDrawdownPct, 6),
    drawdownStartAt,
    maxDrawdownAt,
  };
}

function summarize(rows) {
  const pnls = rows.map((row) => adjustedPnl(row));
  const wins = pnls.filter((pnl) => pnl > 0);
  const losses = pnls.filter((pnl) => pnl <= 0);
  const grossWins = wins.reduce((sum, value) => sum + value, 0);
  const grossLosses = Math.abs(losses.reduce((sum, value) => sum + value, 0));
  const netPnlUsd = pnls.reduce((sum, value) => sum + value, 0);
  const grossPnlUsd = rows.reduce((sum, row) => sum + (row.pnl?.grossPnlUsd ?? 0), 0);
  const feesUsd = rows.reduce((sum, row) => sum + (row.pnl?.feesUsd ?? 0), 0);
  const rRows = rows.filter((row) => Number.isFinite(row.pnl?.rMultiple));
  const netR = rRows.reduce((sum, row) => sum + row.pnl.rMultiple, 0);
  const drawdown = maxDrawdown(rows);

  return {
    closedTrades: rows.length,
    wins: wins.length,
    losses: losses.length,
    winrate: rows.length ? round(wins.length / rows.length, 6) : null,
    grossPnlUsd: round(grossPnlUsd, 2),
    feesUsd: round(feesUsd, 2),
    netPnlUsd: round(netPnlUsd, 2),
    avgNetPnlUsd: rows.length ? round(netPnlUsd / rows.length, 4) : null,
    profitFactor: grossLosses > 0 ? round(grossWins / grossLosses, 4) : (grossWins > 0 ? Infinity : null),
    netR: round(netR, 4),
    avgR: rRows.length ? round(netR / rRows.length, 4) : null,
    invalidRiskRecords: rows.length - rRows.length,
    ambiguousTrades: rows.filter((row) => row.ambiguous).length,
    tpTrades: rows.filter((row) => row.exitReason === "TP").length,
    slTrades: rows.filter((row) => row.exitReason === "SL").length,
    timeExitTrades: rows.filter((row) => row.exitReason === "TIME_EXIT").length,
    endingEquityUsd: drawdown.endingEquityUsd,
    maxDrawdownUsd: drawdown.maxDrawdownUsd,
    maxDrawdownPct: drawdown.maxDrawdownPct,
    drawdownStartAt: drawdown.drawdownStartAt,
    maxDrawdownAt: drawdown.maxDrawdownAt,
  };
}

function groupRows(rows, keyFn, minRows = 1) {
  const groups = new Map();
  for (const row of rows) {
    const key = keyFn(row);
    if (!groups.has(key)) groups.set(key, []);
    groups.get(key).push(row);
  }

  return [...groups.entries()]
    .map(([key, group]) => ({ key, ...summarize(group) }))
    .filter((row) => row.closedTrades >= minRows)
    .sort((a, b) => (b.netPnlUsd ?? -Infinity) - (a.netPnlUsd ?? -Infinity) || b.closedTrades - a.closedTrades);
}

function compareToBaseline(summary, baseline) {
  return {
    tradeCountDelta: summary.closedTrades - baseline.closedTrades,
    avgNetPnlUsdDelta: round((summary.avgNetPnlUsd ?? 0) - (baseline.avgNetPnlUsd ?? 0), 4),
    profitFactorDelta: Number.isFinite(summary.profitFactor) && Number.isFinite(baseline.profitFactor)
      ? round(summary.profitFactor - baseline.profitFactor, 4)
      : null,
    winrateDelta: Number.isFinite(summary.winrate) && Number.isFinite(baseline.winrate)
      ? round(summary.winrate - baseline.winrate, 6)
      : null,
    maxDrawdownPctDelta: Number.isFinite(summary.maxDrawdownPct) && Number.isFinite(baseline.maxDrawdownPct)
      ? round(summary.maxDrawdownPct - baseline.maxDrawdownPct, 6)
      : null,
  };
}

async function postInfo(body) {
  const res = await fetch(HYPERLIQUID_INFO, {
    method: "POST",
    headers: { "content-type": "application/json" },
    body: JSON.stringify(body),
  });
  if (!res.ok) throw new Error(`Hyperliquid info ${body.type} failed: HTTP ${res.status}`);
  return res.json();
}

function toMs(seconds) {
  return seconds * 1000;
}

function maxAgeOk(cache) {
  if (!cache?.fetchedAt) return false;
  const ageMs = Date.now() - new Date(cache.fetchedAt).getTime();
  return ageMs >= 0 && ageMs <= CACHE_MAX_AGE_HOURS * 60 * 60 * 1000;
}

async function fetchFundingCache(symbols, minEntryTime, maxEntryTime) {
  const cached = await readJsonIfExists(FUNDING_CACHE_PATH);
  const requestedCoins = [...new Set(symbols)].sort();
  if (cached?.source === HYPERLIQUID_INFO && maxAgeOk(cached)) {
    const cachedCoins = Object.keys(cached.fundingByCoin || {});
    const hasCoins = requestedCoins.every((coin) => cachedCoins.includes(coin));
    const coversWindow = cached.window?.startTime <= minEntryTime && cached.window?.endTime >= maxEntryTime;
    if (hasCoins && coversWindow) {
      return { cache: cached, cacheStatus: "reused_local_cache" };
    }
  }

  const metaAndCtxs = await postInfo({ type: "metaAndAssetCtxs" });
  if (!Array.isArray(metaAndCtxs) || !Array.isArray(metaAndCtxs[0]?.universe)) {
    throw new Error("Unexpected Hyperliquid metaAndAssetCtxs response shape");
  }
  const availableCoins = new Set(metaAndCtxs[0].universe.map((asset) => asset.name));
  const startTimeMs = toMs(minEntryTime) - FETCH_PAD_DAYS * 24 * 60 * 60 * 1000;
  const endTimeMs = toMs(maxEntryTime) + FETCH_PAD_DAYS * 24 * 60 * 60 * 1000;
  const fundingByCoin = {};
  const unavailableCoins = [];
  const fetchErrors = [];

  for (const coin of requestedCoins) {
    if (!availableCoins.has(coin)) {
      unavailableCoins.push(coin);
      fundingByCoin[coin] = [];
      continue;
    }
    try {
      const rows = await postInfo({ type: "fundingHistory", coin, startTime: startTimeMs });
      fundingByCoin[coin] = (Array.isArray(rows) ? rows : [])
        .filter((row) => Number.isFinite(Number(row.time)) && Number(row.time) <= endTimeMs)
        .map((row) => ({
          coin: row.coin ?? coin,
          fundingRate: Number(row.fundingRate),
          premium: Number.isFinite(Number(row.premium)) ? Number(row.premium) : null,
          time: Number(row.time),
          timeIso: new Date(Number(row.time)).toISOString(),
        }))
        .filter((row) => Number.isFinite(row.fundingRate))
        .sort((a, b) => a.time - b.time);
    } catch (error) {
      fetchErrors.push({ coin, message: error.message });
      fundingByCoin[coin] = [];
    }
  }

  const cache = {
    fetchedAt: new Date().toISOString(),
    source: HYPERLIQUID_INFO,
    requests: {
      metaAndAssetCtxs: true,
      fundingHistoryCoins: requestedCoins,
      startTimeMs,
      endTimeMs,
    },
    window: {
      startTime: minEntryTime,
      endTime: maxEntryTime,
      startTimeIso: new Date(toMs(minEntryTime)).toISOString(),
      endTimeIso: new Date(toMs(maxEntryTime)).toISOString(),
    },
    totals: {
      requestedCoins: requestedCoins.length,
      availableCoins: requestedCoins.filter((coin) => availableCoins.has(coin)).length,
      unavailableCoins: unavailableCoins.length,
      fetchErrors: fetchErrors.length,
      fundingRows: Object.values(fundingByCoin).reduce((sum, rows) => sum + rows.length, 0),
    },
    unavailableCoins,
    fetchErrors,
    fundingByCoin,
  };

  await writeJson(FUNDING_CACHE_PATH, cache);
  return { cache, cacheStatus: "fetched_public_no_key_and_cached" };
}

function latestFundingAt(rows, entryTimeMs) {
  let lo = 0;
  let hi = rows.length - 1;
  let index = -1;
  while (lo <= hi) {
    const mid = Math.floor((lo + hi) / 2);
    if (rows[mid].time <= entryTimeMs) {
      index = mid;
      lo = mid + 1;
    } else {
      hi = mid - 1;
    }
  }
  return index >= 0 ? { row: rows[index], index } : { row: null, index: -1 };
}

function signLabel(rate) {
  if (!Number.isFinite(rate) || Math.abs(rate) < 1e-9) return "flat";
  return rate > 0 ? "positive" : "negative";
}

function fundingFeatures(row, fundingByCoin) {
  const coin = row.symbol;
  const rows = fundingByCoin[coin] || [];
  const entryTimeMs = toMs(row.entryTime);
  const { row: latest, index } = latestFundingAt(rows, entryTimeMs);
  if (!latest) {
    return {
      available: false,
      coin,
      label: "unavailable",
      sign: "unavailable",
      persistence: "unavailable",
      staleHours: null,
      lookbackRows: 0,
      sameSignStreak: 0,
      positiveShare: null,
      negativeShare: null,
      annualizedPct: null,
    };
  }

  const staleHours = (entryTimeMs - latest.time) / (60 * 60 * 1000);
  if (staleHours > FUNDING_MAX_STALE_HOURS) {
    return {
      available: false,
      coin,
      label: "stale",
      sign: "stale",
      persistence: "stale",
      staleHours: round(staleHours, 2),
      latestFundingTimeIso: latest.timeIso,
      lookbackRows: 0,
      sameSignStreak: 0,
      positiveShare: null,
      negativeShare: null,
      annualizedPct: annualizedPct(latest.fundingRate),
    };
  }

  const lookbackStartMs = entryTimeMs - FUNDING_LOOKBACK_HOURS * 60 * 60 * 1000;
  const lookback = rows.filter((fundingRow) => fundingRow.time <= entryTimeMs && fundingRow.time >= lookbackStartMs);
  const latestSign = signLabel(latest.fundingRate);
  const signedLookback = lookback.filter((fundingRow) => signLabel(fundingRow.fundingRate) !== "flat");
  const sameSignRows = signedLookback.filter((fundingRow) => signLabel(fundingRow.fundingRate) === latestSign);
  const positiveRows = signedLookback.filter((fundingRow) => fundingRow.fundingRate > 0);
  const negativeRows = signedLookback.filter((fundingRow) => fundingRow.fundingRate < 0);
  let sameSignStreak = 0;
  for (let i = index; i >= 0; i -= 1) {
    const sign = signLabel(rows[i].fundingRate);
    if (sign === "flat") continue;
    if (sign !== latestSign) break;
    sameSignStreak += 1;
  }

  const positiveShare = signedLookback.length ? positiveRows.length / signedLookback.length : null;
  const negativeShare = signedLookback.length ? negativeRows.length / signedLookback.length : null;
  const persistentPositive = latestSign === "positive"
    && sameSignStreak >= PERSISTENCE_MIN_STREAK
    && Number.isFinite(positiveShare)
    && positiveShare >= PERSISTENCE_MIN_SHARE;
  const persistentNegative = latestSign === "negative"
    && sameSignStreak >= PERSISTENCE_MIN_STREAK
    && Number.isFinite(negativeShare)
    && negativeShare >= PERSISTENCE_MIN_SHARE;
  const persistence = persistentPositive
    ? "persistent_positive"
    : (persistentNegative ? "persistent_negative" : `${latestSign}_not_persistent`);

  return {
    available: true,
    coin,
    label: persistence,
    sign: latestSign,
    persistence,
    latestFundingTimeIso: latest.timeIso,
    latestFundingRate: round(latest.fundingRate, 10),
    annualizedPct: annualizedPct(latest.fundingRate),
    premium: Number.isFinite(latest.premium) ? round(latest.premium, 10) : null,
    staleHours: round(staleHours, 2),
    lookbackRows: lookback.length,
    sameSignStreak,
    positiveShare: Number.isFinite(positiveShare) ? round(positiveShare, 4) : null,
    negativeShare: Number.isFinite(negativeShare) ? round(negativeShare, 4) : null,
  };
}

function enrichRows(rows, fundingByCoin) {
  return rows.map((row) => ({
    ...row,
    fundingContext: fundingFeatures(row, fundingByCoin),
  }));
}

function annualizedPct(rate) {
  return Number.isFinite(rate) ? round(rate * 24 * 365 * 100, 4) : null;
}

function liftRows(bucketRows, btcRegimeBaseline, minRows) {
  return bucketRows
    .filter((row) => row.closedTrades >= minRows)
    .map((row) => ({
      ...row,
      liftVsBtcRegimeAlone: compareToBaseline(row, btcRegimeBaseline),
    }))
    .sort((a, b) => (
      (b.liftVsBtcRegimeAlone.avgNetPnlUsdDelta ?? -Infinity)
      - (a.liftVsBtcRegimeAlone.avgNetPnlUsdDelta ?? -Infinity)
    ) || b.closedTrades - a.closedTrades);
}

function verdict(report) {
  const candidates = report.fundingContext.selectedRangeBreakoutLiftCandidates;
  const best = candidates[0] ?? null;
  if (!best) return "no_funding_lift_candidate";
  if (best.closedTrades < 20) return "no_funding_lift_low_sample";
  if ((best.liftVsBtcRegimeAlone.avgNetPnlUsdDelta ?? 0) <= 0) return "no_funding_lift_candidate";
  if ((best.profitFactor ?? 0) <= (report.baselines.btcRegimeAlone.summary.profitFactor ?? 0)) {
    return "no_clear_profit_factor_lift";
  }
  if ((best.maxDrawdownPct ?? Infinity) > (report.baselines.btcRegimeAlone.summary.maxDrawdownPct ?? Infinity)) {
    return "funding_context_lift_but_drawdown_worse";
  }
  return "funding_context_improves_research_bucket";
}

function table(rows, columns) {
  if (!rows.length) return "_No rows._";
  const header = `| ${columns.map((column) => column.label).join(" | ")} |`;
  const divider = `| ${columns.map((column) => column.align ?? "---").join(" | ")} |`;
  const body = rows.map((row) => `| ${columns.map((column) => cell(column.value(row))).join(" | ")} |`);
  return [header, divider, ...body].join("\n");
}

function renderMarkdown(report) {
  const summaryColumns = [
    { label: "Key", value: (row) => row.key },
    { label: "Trades", align: "---:", value: (row) => row.summary.closedTrades },
    { label: "Net USD", align: "---:", value: (row) => money(row.summary.netPnlUsd) },
    { label: "Avg USD", align: "---:", value: (row) => money(row.summary.avgNetPnlUsd) },
    { label: "PF", align: "---:", value: (row) => row.summary.profitFactor },
    { label: "Winrate", align: "---:", value: (row) => pct(row.summary.winrate) },
    { label: "Max DD", align: "---:", value: (row) => pct(row.summary.maxDrawdownPct) },
  ];
  const bucketColumns = [
    { label: "Bucket", value: (row) => row.key },
    { label: "Trades", align: "---:", value: (row) => row.closedTrades },
    { label: "Net USD", align: "---:", value: (row) => money(row.netPnlUsd) },
    { label: "Avg USD", align: "---:", value: (row) => money(row.avgNetPnlUsd) },
    { label: "PF", align: "---:", value: (row) => row.profitFactor },
    { label: "Winrate", align: "---:", value: (row) => pct(row.winrate) },
    { label: "Max DD", align: "---:", value: (row) => pct(row.maxDrawdownPct) },
    { label: "Avg lift", align: "---:", value: (row) => money(row.liftVsBtcRegimeAlone?.avgNetPnlUsdDelta) },
    { label: "PF lift", align: "---:", value: (row) => row.liftVsBtcRegimeAlone?.profitFactorDelta },
  ];
  const lines = [
    "# DEMO-SIM Funding Persistence Context Baseline",
    "",
    `Generated: ${report.generated}`,
    `Verdict: \`${report.status}\``,
    "",
    "This is a research-only context test. It joins public/no-key Hyperliquid funding history onto existing DEMO-SIM rows and asks whether funding sign/persistence improves the existing `range_breakout_long + BTC_RISK_ON` pocket versus BTC regime alone, no-trade, and the latest survivor stress result.",
    "",
    "## Access and Cache",
    "",
    `- Funding source: ${report.sources.hyperliquidInfoEndpoint}`,
    `- Cache status: ${report.sources.cacheStatus}`,
    `- Funding cache: ${report.sources.fundingCache}`,
    `- Requested coins: ${report.sources.requestedCoins.join(", ")}`,
    `- Funding rows cached: ${report.sources.fundingRows}`,
    `- Unavailable coins: ${report.sources.unavailableCoins.length ? report.sources.unavailableCoins.join(", ") : "none"}`,
    "",
    "## Baselines",
    "",
    table(Object.entries(report.baselines).map(([key, value]) => ({ key, ...value })), summaryColumns),
    "",
    "## Funding Buckets Inside Selected Survivor",
    "",
    table(report.fundingContext.selectedRangeBreakoutLiftCandidates, bucketColumns),
    "",
    "## Sign Buckets Inside Selected Survivor",
    "",
    table(report.fundingContext.selectedRangeBreakoutBySign, bucketColumns),
    "",
    "## Top Pocket Funding Buckets",
    "",
    table(report.fundingContext.topPocketByPersistence, [
      { label: "Bucket", value: (row) => row.key },
      { label: "Trades", align: "---:", value: (row) => row.closedTrades },
      { label: "Net USD", align: "---:", value: (row) => money(row.netPnlUsd) },
      { label: "Avg USD", align: "---:", value: (row) => money(row.avgNetPnlUsd) },
      { label: "PF", align: "---:", value: (row) => row.profitFactor },
      { label: "Max DD", align: "---:", value: (row) => pct(row.maxDrawdownPct) },
    ]),
    "",
    "## Interpretation",
    "",
    report.interpretation,
    "",
    "## Boundary Delta",
    "",
    "Changed: added one standalone research script, one standalone npm script, a local public funding cache, and JSON/Markdown outputs.",
    "",
    "Unchanged: no scheduler or cron payloads, no live alerts, no watcher behavior, no keys/accounts/paid services, no sizing, no TP/SL, no execution behavior, no public posting, and no strategy promotion.",
    "",
  ];
  return `${lines.join("\n")}\n`;
}

function interpretationFor(report) {
  const best = report.fundingContext.selectedRangeBreakoutLiftCandidates[0] ?? null;
  if (!best) {
    return "Funding context did not produce a usable lift bucket with the minimum sample threshold. Treat funding persistence as not useful for this survivor until more rows or a better predeclared context design exists.";
  }
  const lift = best.liftVsBtcRegimeAlone;
  const baseline = report.baselines.btcRegimeAlone.summary;
  const sentences = [
    `Best funding bucket is \`${best.key}\` with ${best.closedTrades} trades, ${money(best.netPnlUsd)} USDT net, PF ${best.profitFactor}, and ${pct(best.maxDrawdownPct)} max drawdown.`,
    `Versus BTC regime alone, its average PnL lift is ${money(lift.avgNetPnlUsdDelta)} per trade, PF delta is ${lift.profitFactorDelta ?? "n/a"}, and max-drawdown delta is ${pct(lift.maxDrawdownPctDelta)}.`,
  ];
  if (report.status === "funding_context_improves_research_bucket") {
    sentences.push("This is a context-filter hint, not a strategy promotion: it narrows the research pocket but still inherits survivor-stress blockers and synthetic replay limits.");
  } else if ((best.avgNetPnlUsd ?? 0) > (baseline.avgNetPnlUsd ?? 0)) {
    sentences.push("There is some bucket-level lift, but it is not clean enough to call an improvement because the profit-factor/drawdown/sample gate is weak.");
  } else {
    sentences.push("The best funding bucket does not improve enough over BTC regime alone.");
  }
  sentences.push("Keep funding as research context only; do not turn it into carry, sizing, entry, alert, or execution logic without a separate cost/tail/accounting design and explicit approval.");
  return sentences.join(" ");
}

async function main() {
  const replay = await readJson(REPLAY_JSON_PATH);
  const survivorStress = await readJsonIfExists(SURVIVOR_STRESS_JSON_PATH);
  const records = closedRecords(replay);
  if (!records.length) throw new Error("No closed DEMO-SIM records found. Run demo-sim:replay first.");

  const symbols = [...new Set(records.map((row) => row.symbol).filter(Boolean))].sort();
  const minEntryTime = Math.min(...records.map((row) => row.entryTime).filter(Number.isFinite));
  const maxEntryTime = Math.max(...records.map((row) => row.entryTime).filter(Number.isFinite));
  const { cache, cacheStatus } = await fetchFundingCache(symbols, minEntryTime, maxEntryTime);
  const enrichedRecords = enrichRows(records, cache.fundingByCoin);
  const selected = selectedRows(enrichedRecords);
  const topPocket = topPocketRows(enrichedRecords);
  const fundingAvailableSelected = selected.filter((row) => row.fundingContext.available);
  const btcRegimeAlone = summarize(selected);
  const fundingAvailableBaseline = summarize(fundingAvailableSelected);
  const topPocketSummary = summarize(topPocket);

  const byPersistence = groupRows(fundingAvailableSelected, (row) => row.fundingContext.persistence, 8);
  const bySign = groupRows(fundingAvailableSelected, (row) => row.fundingContext.sign, 8);
  const bySymbolAndPersistence = groupRows(
    fundingAvailableSelected,
    (row) => `${row.symbol}|${row.fundingContext.persistence}`,
    8,
  );
  const topPocketByPersistence = groupRows(
    topPocket.filter((row) => row.fundingContext.available),
    (row) => row.fundingContext.persistence,
    5,
  );

  const report = {
    generated: new Date().toISOString(),
    status: "pending",
    workItem: "validation.funding-persistence-context-baseline",
    sourceReplay: "results/historical-demo-sim-replay.json",
    outputs: {
      json: "results/demo-sim-funding-persistence-context-baseline.json",
      markdown: "results/demo-sim-funding-persistence-context-baseline.md",
    },
    boundaries: BOUNDARIES,
    assumptions: {
      selectedFilter: "setup=range_breakout_long, direction=long, btcGate.state=BTC_RISK_ON",
      topPocket: "timeframe=4h, tier=B|low-sample",
      fundingLookbackHours: FUNDING_LOOKBACK_HOURS,
      fundingMaxStaleHours: FUNDING_MAX_STALE_HOURS,
      persistenceMinStreak: PERSISTENCE_MIN_STREAK,
      persistenceMinShare: PERSISTENCE_MIN_SHARE,
      fundingDecisionTime: "latest public Hyperliquid funding row at or before DEMO-SIM entry time",
      noTradeBaseline: "0 PnL on the same toy 10k account",
    },
    sources: {
      hyperliquidInfoEndpoint: HYPERLIQUID_INFO,
      cacheStatus,
      fundingCache: path.relative(ROOT, FUNDING_CACHE_PATH),
      requestedCoins: symbols,
      fundingRows: cache.totals.fundingRows,
      unavailableCoins: cache.unavailableCoins,
      fetchErrors: cache.fetchErrors,
      survivorStressJson: survivorStress ? "results/demo-sim-range-breakout-survivor-stress.json" : null,
    },
    baselines: {
      noTrade: {
        description: "No-trade baseline on same toy 10k account.",
        summary: {
          closedTrades: 0,
          netPnlUsd: 0,
          avgNetPnlUsd: 0,
          profitFactor: null,
          winrate: null,
          maxDrawdownPct: 0,
          endingEquityUsd: STARTING_CAPITAL_USD,
        },
      },
      btcRegimeAlone: {
        description: "Existing survivor: range_breakout_long + BTC_RISK_ON, no funding filter.",
        summary: btcRegimeAlone,
      },
      fundingAvailableSubset: {
        description: "Selected survivor rows with non-stale local/public funding context joined.",
        summary: fundingAvailableBaseline,
      },
      survivorStressSelected: {
        description: "Latest standalone survivor stress selected baseline, if available.",
        summary: survivorStress?.baselines?.find((row) => row.key === "range_breakout_long_btc_risk_on")?.summary ?? null,
      },
      survivorStressTopPocket: {
        description: "Latest standalone survivor stress top pocket, if available.",
        summary: survivorStress?.baselines?.find((row) => row.key === "top_pocket_4h_b_or_low_sample")?.summary ?? topPocketSummary,
      },
    },
    fundingContext: {
      joinedRows: enrichedRecords.filter((row) => row.fundingContext.available).length,
      selectedRows: selected.length,
      selectedRowsWithFunding: fundingAvailableSelected.length,
      selectedRowsWithoutFunding: selected.length - fundingAvailableSelected.length,
      selectedRangeBreakoutByPersistence: byPersistence,
      selectedRangeBreakoutBySign: bySign,
      selectedRangeBreakoutBySymbolAndPersistence: bySymbolAndPersistence,
      selectedRangeBreakoutLiftCandidates: liftRows(byPersistence, btcRegimeAlone, 20),
      topPocketRows: topPocket.length,
      topPocketRowsWithFunding: topPocket.filter((row) => row.fundingContext.available).length,
      topPocketByPersistence,
    },
  };

  report.status = verdict(report);
  report.interpretation = interpretationFor(report);

  await writeJson(REPORT_JSON_PATH, report);
  await fs.writeFile(REPORT_MD_PATH, renderMarkdown(report));

  console.log(JSON.stringify({
    ok: true,
    status: report.status,
    cacheStatus,
    selectedRows: report.fundingContext.selectedRows,
    selectedRowsWithFunding: report.fundingContext.selectedRowsWithFunding,
    bestFundingBucket: report.fundingContext.selectedRangeBreakoutLiftCandidates[0]?.key ?? null,
    output: path.relative(ROOT, REPORT_MD_PATH),
  }, null, 2));
}

main().catch((error) => {
  console.error(error);
  process.exitCode = 1;
});
