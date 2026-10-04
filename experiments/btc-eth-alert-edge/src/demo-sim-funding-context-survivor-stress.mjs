#!/usr/bin/env node

import fs from "node:fs/promises";
import path from "node:path";

const ROOT = path.resolve(new URL("..", import.meta.url).pathname);
const RESULTS_DIR = path.join(ROOT, "results");
const DATA_DIR = path.join(ROOT, "data", "funding");
const REPLAY_JSON_PATH = path.join(RESULTS_DIR, "historical-demo-sim-replay.json");
const SURVIVOR_STRESS_JSON_PATH = path.join(RESULTS_DIR, "demo-sim-range-breakout-survivor-stress.json");
const FUNDING_BASELINE_JSON_PATH = path.join(RESULTS_DIR, "demo-sim-funding-persistence-context-baseline.json");
const FUNDING_CACHE_PATH = path.join(DATA_DIR, "hyperliquid-funding-history-demo-sim.json");
const REPORT_JSON_PATH = path.join(RESULTS_DIR, "demo-sim-funding-context-survivor-stress.json");
const REPORT_MD_PATH = path.join(RESULTS_DIR, "demo-sim-funding-context-survivor-stress.md");

const STARTING_CAPITAL_USD = 10_000;
const FUNDING_LOOKBACK_HOURS = 24;
const FUNDING_MAX_STALE_HOURS = 12;
const PERSISTENCE_MIN_STREAK = 8;
const PERSISTENCE_MIN_SHARE = 0.75;

const round = (value, digits = 4) => Number.isFinite(value) ? Number(value.toFixed(digits)) : null;
const pct = (value) => Number.isFinite(value) ? `${(value * 100).toFixed(1)}%` : "n/a";
const money = (value) => Number.isFinite(value) ? value.toFixed(2) : "n/a";
const cell = (value) => String(value ?? "n/a").replaceAll("|", " / ");
const toMs = (seconds) => seconds * 1000;

async function readJson(file) {
  return JSON.parse(await fs.readFile(file, "utf8"));
}

async function readJsonIfExists(file) {
  try {
    return await readJson(file);
  } catch (error) {
    if (error.code === "ENOENT") return null;
    throw error;
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

function topPocketRows(rows) {
  return rows.filter((row) => row.timeframe === "4h" && ["B", "low-sample"].includes(row.tier));
}

function adjustedPnl(row, costStress = "base") {
  const netPnlUsd = row.pnl?.netPnlUsd ?? 0;
  const feesUsd = row.pnl?.feesUsd ?? 0;
  const notionalUsd = row.pnl?.notionalUsd ?? 0;
  if (costStress === "base") return netPnlUsd;
  if (costStress === "double_fees") return netPnlUsd - feesUsd;
  if (costStress === "extra_10bps_round_trip") return netPnlUsd - (notionalUsd * 10 / 10_000);
  if (costStress === "extra_20bps_round_trip") return netPnlUsd - (notionalUsd * 20 / 10_000);
  throw new Error(`Unknown cost stress: ${costStress}`);
}

function maxDrawdown(rows, costStress = "base") {
  let equity = STARTING_CAPITAL_USD;
  let peak = STARTING_CAPITAL_USD;
  let maxDrawdownUsd = 0;
  let maxDrawdownPct = 0;
  let maxDrawdownAt = null;
  let drawdownStartAt = null;
  let peakAt = null;
  for (const row of rows) {
    equity += adjustedPnl(row, costStress);
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

function summarize(rows, options = {}) {
  const costStress = options.costStress ?? "base";
  const pnls = rows.map((row) => adjustedPnl(row, costStress));
  const wins = pnls.filter((pnl) => pnl > 0);
  const losses = pnls.filter((pnl) => pnl <= 0);
  const grossWins = wins.reduce((sum, value) => sum + value, 0);
  const grossLosses = Math.abs(losses.reduce((sum, value) => sum + value, 0));
  const netPnlUsd = pnls.reduce((sum, value) => sum + value, 0);
  const drawdown = maxDrawdown(rows, costStress);
  return {
    closedTrades: rows.length,
    wins: wins.length,
    losses: losses.length,
    winrate: rows.length ? round(wins.length / rows.length, 6) : null,
    costStress,
    netPnlUsd: round(netPnlUsd, 2),
    avgNetPnlUsd: rows.length ? round(netPnlUsd / rows.length, 4) : null,
    profitFactor: grossLosses > 0 ? round(grossWins / grossLosses, 4) : (grossWins > 0 ? Infinity : null),
    ambiguousTrades: rows.filter((row) => row.ambiguous).length,
    tpTrades: rows.filter((row) => row.exitReason === "TP").length,
    slTrades: rows.filter((row) => row.exitReason === "SL").length,
    timeExitTrades: rows.filter((row) => row.exitReason === "TIME_EXIT").length,
    ...drawdown,
  };
}

function groupRows(rows, keyFn, options = {}) {
  const groups = new Map();
  for (const row of rows) {
    const key = keyFn(row);
    const group = groups.get(key) ?? [];
    group.push(row);
    groups.set(key, group);
  }
  return [...groups.entries()]
    .map(([key, group]) => ({ key, ...summarize(group, options) }))
    .sort((a, b) => (b.netPnlUsd ?? -Infinity) - (a.netPnlUsd ?? -Infinity) || b.closedTrades - a.closedTrades);
}

function removeBestGroup(rows, keyFn, label) {
  const groups = groupRows(rows, keyFn);
  const best = groups[0] ?? null;
  const remainder = best ? rows.filter((row) => keyFn(row) !== best.key) : rows;
  return {
    label,
    removedKey: best?.key ?? null,
    removed: best,
    remainder: summarize(remainder),
  };
}

function drawdownRuns(rows) {
  const runs = [];
  let current = null;
  for (const row of rows) {
    const pnl = row.pnl?.netPnlUsd ?? 0;
    if (pnl <= 0) {
      if (!current) {
        current = {
          start: row.exitTimeIso,
          end: row.exitTimeIso,
          trades: 0,
          netPnlUsd: 0,
          symbols: new Set(),
        };
      }
      current.end = row.exitTimeIso;
      current.trades += 1;
      current.netPnlUsd += pnl;
      current.symbols.add(row.symbol);
    } else if (current) {
      runs.push(current);
      current = null;
    }
  }
  if (current) runs.push(current);
  return runs
    .map((run) => ({
      start: run.start,
      end: run.end,
      trades: run.trades,
      netPnlUsd: round(run.netPnlUsd, 2),
      symbols: [...run.symbols].sort(),
    }))
    .sort((a, b) => a.netPnlUsd - b.netPnlUsd)
    .slice(0, 5);
}

function monthOf(row) {
  return row.exitTimeIso?.slice(0, 7) ?? "unknown";
}

function weekOf(row) {
  if (!row.exitTimeIso) return "unknown";
  const date = new Date(row.exitTimeIso);
  const tmp = new Date(Date.UTC(date.getUTCFullYear(), date.getUTCMonth(), date.getUTCDate()));
  const day = tmp.getUTCDay() || 7;
  tmp.setUTCDate(tmp.getUTCDate() + 4 - day);
  const yearStart = new Date(Date.UTC(tmp.getUTCFullYear(), 0, 1));
  const week = Math.ceil((((tmp - yearStart) / 86_400_000) + 1) / 7);
  return `${tmp.getUTCFullYear()}-W${String(week).padStart(2, "0")}`;
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
  if (!latest) return { available: false, coin, label: "unavailable", sign: "unavailable", persistence: "unavailable", staleHours: null };

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
    };
  }

  const lookbackStartMs = entryTimeMs - FUNDING_LOOKBACK_HOURS * 60 * 60 * 1000;
  const lookback = rows.filter((fundingRow) => fundingRow.time <= entryTimeMs && fundingRow.time >= lookbackStartMs);
  const latestSign = signLabel(latest.fundingRate);
  const signedLookback = lookback.filter((fundingRow) => signLabel(fundingRow.fundingRate) !== "flat");
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
    staleHours: round(staleHours, 2),
    lookbackRows: lookback.length,
    sameSignStreak,
    positiveShare: Number.isFinite(positiveShare) ? round(positiveShare, 4) : null,
    negativeShare: Number.isFinite(negativeShare) ? round(negativeShare, 4) : null,
  };
}

function enrichRows(rows, fundingByCoin) {
  return rows.map((row) => ({ ...row, fundingContext: fundingFeatures(row, fundingByCoin) }));
}

function compare(summary, baseline) {
  return {
    tradeCountDelta: summary.closedTrades - baseline.closedTrades,
    netPnlUsdDelta: round((summary.netPnlUsd ?? 0) - (baseline.netPnlUsd ?? 0), 2),
    avgNetPnlUsdDelta: round((summary.avgNetPnlUsd ?? 0) - (baseline.avgNetPnlUsd ?? 0), 4),
    profitFactorDelta: Number.isFinite(summary.profitFactor) && Number.isFinite(baseline.profitFactor)
      ? round(summary.profitFactor - baseline.profitFactor, 4)
      : null,
    maxDrawdownPctDelta: Number.isFinite(summary.maxDrawdownPct) && Number.isFinite(baseline.maxDrawdownPct)
      ? round(summary.maxDrawdownPct - baseline.maxDrawdownPct, 6)
      : null,
  };
}

function classify(stress) {
  const p = stress.persistentPositive.summary;
  if (p.closedTrades < 40) return "reject_low_sample_after_filter";
  if (p.netPnlUsd <= 0) return "reject_negative_funding_filter";
  if ((stress.persistentPositive.removeBestWeek.remainder.netPnlUsd ?? 0) <= 0) return "reject_week_concentration";
  if ((stress.persistentPositive.removeBestMonth.remainder.netPnlUsd ?? 0) <= 0) return "reject_month_concentration";
  if ((stress.persistentPositive.removeBestSymbol.remainder.netPnlUsd ?? 0) <= 0) return "reject_symbol_concentration";
  if ((stress.persistentPositive.costStress.find((row) => row.key === "extra_20bps_round_trip")?.netPnlUsd ?? 0) <= 0) return "reject_cost_fragile";
  if ((stress.topPocketPersistentPositive.summary.maxDrawdownPct ?? Infinity) > 0.25) return "research_hint_top_pocket_drawdown_blocked";
  if ((p.maxDrawdownPct ?? Infinity) > 0.25) return "research_hint_drawdown_blocked";
  return "funding_context_survives_first_stress";
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
    { label: "Case", value: (row) => row.key },
    { label: "Closed", align: "---:", value: (row) => row.closedTrades ?? row.summary?.closedTrades },
    { label: "Net USD", align: "---:", value: (row) => money(row.netPnlUsd ?? row.summary?.netPnlUsd) },
    { label: "Avg USD", align: "---:", value: (row) => money(row.avgNetPnlUsd ?? row.summary?.avgNetPnlUsd) },
    { label: "PF", align: "---:", value: (row) => row.profitFactor ?? row.summary?.profitFactor ?? "n/a" },
    { label: "Winrate", align: "---:", value: (row) => pct(row.winrate ?? row.summary?.winrate) },
    { label: "Max DD", align: "---:", value: (row) => pct(row.maxDrawdownPct ?? row.summary?.maxDrawdownPct) },
  ];
  const removalColumns = [
    { label: "Stress", value: (row) => row.label },
    { label: "Removed", value: (row) => row.removedKey },
    { label: "Removed Net", align: "---:", value: (row) => money(row.removed?.netPnlUsd) },
    { label: "Remainder n", align: "---:", value: (row) => row.remainder.closedTrades },
    { label: "Remainder Net", align: "---:", value: (row) => money(row.remainder.netPnlUsd) },
    { label: "Remainder PF", align: "---:", value: (row) => row.remainder.profitFactor ?? "n/a" },
    { label: "Remainder DD", align: "---:", value: (row) => pct(row.remainder.maxDrawdownPct) },
  ];
  const runColumns = [
    { label: "Start", value: (row) => row.start },
    { label: "End", value: (row) => row.end },
    { label: "Trades", align: "---:", value: (row) => row.trades },
    { label: "Net USD", align: "---:", value: (row) => money(row.netPnlUsd) },
    { label: "Symbols", value: (row) => row.symbols.join(",") },
  ];

  return `# DEMO-SIM Funding Context Survivor Stress\n\nGenerated: ${report.generated}\nStatus: \`${report.status}\`\n\nThis report stress-tests the previous funding-context hint. It re-joins existing cached public/no-key Hyperliquid funding rows onto existing DEMO-SIM replay rows, restricts to \`range_breakout_long + BTC_RISK_ON + persistent_positive\`, and asks whether the funding context survives concentration, cost, missing/stale, drawdown, and top-pocket checks. It does not fetch data and does not change live alerts, watcher behavior, scheduler payloads, keys, accounts, risk/sizing, TP/SL, execution, or public posting.\n\n## Baselines\n\n${table(report.baselines, summaryColumns)}\n\n## Persistent Positive Summary\n\n${table([{ key: "persistent_positive", ...report.stress.persistentPositive.summary }, { key: "top_pocket_persistent_positive", ...report.stress.topPocketPersistentPositive.summary }], summaryColumns)}\n\n## Remove-Best Stresses\n\n${table([report.stress.persistentPositive.removeBestSymbol, report.stress.persistentPositive.removeBestMonth, report.stress.persistentPositive.removeBestWeek], removalColumns)}\n\n## Cost Stress\n\n${table(report.stress.persistentPositive.costStress, summaryColumns)}\n\n## By Symbol / Month / Week\n\n### By Symbol\n\n${table(report.stress.persistentPositive.bySymbol, summaryColumns)}\n\n### By Month\n\n${table(report.stress.persistentPositive.byMonth, summaryColumns)}\n\n### By Week\n\n${table(report.stress.persistentPositive.byWeek, summaryColumns)}\n\n## Missing And Stale Funding\n\n${table(report.fundingAvailability, summaryColumns)}\n\n## Worst Consecutive Loss Clusters\n\n${table(report.stress.persistentPositive.drawdownRuns, runColumns)}\n\n## Interpretation\n\n${report.interpretation}\n\n## Blockers\n\n${report.decision.blockers.map((item) => `- ${item}`).join("\n")}\n\n## Next Actions\n\n${report.decision.nextActions.map((item) => `- ${item}`).join("\n")}\n`;
}

async function main() {
  const replay = await readJson(REPLAY_JSON_PATH);
  const fundingCache = await readJson(FUNDING_CACHE_PATH);
  const survivorStress = await readJsonIfExists(SURVIVOR_STRESS_JSON_PATH);
  const fundingBaseline = await readJsonIfExists(FUNDING_BASELINE_JSON_PATH);

  const records = closedRecords(replay);
  const enriched = enrichRows(records, fundingCache.fundingByCoin || {});
  const selected = selectedRows(enriched);
  const selectedWithFunding = selected.filter((row) => row.fundingContext.available);
  const persistentPositive = selectedWithFunding.filter((row) => row.fundingContext.persistence === "persistent_positive");
  const topPocketPersistentPositive = topPocketRows(persistentPositive);

  const baselines = [
    { key: "no_trade", summary: { closedTrades: 0, netPnlUsd: 0, avgNetPnlUsd: 0, profitFactor: null, winrate: null, maxDrawdownPct: 0 } },
    { key: "btc_regime_alone", summary: summarize(selected) },
    { key: "funding_available_subset", summary: summarize(selectedWithFunding) },
    { key: "persistent_positive", summary: summarize(persistentPositive) },
    { key: "survivor_stress_selected", summary: survivorStress?.baselines?.find((row) => row.key === "range_breakout_long_btc_risk_on")?.summary ?? null },
    { key: "funding_baseline_persistent_positive", summary: fundingBaseline?.fundingContext?.selectedRangeBreakoutLiftCandidates?.find((row) => row.key === "persistent_positive") ?? null },
  ].filter((row) => row.summary);

  const fundingAvailability = groupRows(selected, (row) => (
    row.fundingContext.available ? "available" : row.fundingContext.persistence
  ));

  const stress = {
    persistentPositive: {
      summary: summarize(persistentPositive),
      liftVsBtcRegimeAlone: compare(summarize(persistentPositive), summarize(selected)),
      liftVsFundingAvailableSubset: compare(summarize(persistentPositive), summarize(selectedWithFunding)),
      bySymbol: groupRows(persistentPositive, (row) => row.symbol ?? "unknown"),
      byMonth: groupRows(persistentPositive, monthOf),
      byWeek: groupRows(persistentPositive, weekOf),
      byAmbiguity: groupRows(persistentPositive, (row) => row.ambiguous ? "ambiguous" : "unambiguous"),
      removeBestSymbol: removeBestGroup(persistentPositive, (row) => row.symbol ?? "unknown", "without_best_symbol"),
      removeBestMonth: removeBestGroup(persistentPositive, monthOf, "without_best_month"),
      removeBestWeek: removeBestGroup(persistentPositive, weekOf, "without_best_week"),
      costStress: ["base", "double_fees", "extra_10bps_round_trip", "extra_20bps_round_trip"]
        .map((key) => ({ key, ...summarize(persistentPositive, { costStress: key }) })),
      drawdownRuns: drawdownRuns(persistentPositive),
    },
    topPocketPersistentPositive: {
      summary: summarize(topPocketPersistentPositive),
      bySymbol: groupRows(topPocketPersistentPositive, (row) => row.symbol ?? "unknown"),
      removeBestSymbol: removeBestGroup(topPocketPersistentPositive, (row) => row.symbol ?? "unknown", "top_pocket_without_best_symbol"),
      removeBestWeek: removeBestGroup(topPocketPersistentPositive, weekOf, "top_pocket_without_best_week"),
    },
  };

  const report = {
    generated: new Date().toISOString(),
    status: "pending",
    workItem: "validation.funding-context-survivor-stress",
    sourceReplay: "results/historical-demo-sim-replay.json",
    sourceFundingCache: "data/funding/hyperliquid-funding-history-demo-sim.json",
    outputs: {
      json: "results/demo-sim-funding-context-survivor-stress.json",
      markdown: "results/demo-sim-funding-context-survivor-stress.md",
    },
    boundaries: [
      "research_only",
      "existing_demo_sim_replay_rows_only",
      "existing_cached_public_no_key_hyperliquid_funding_only",
      "no_new_data_fetch",
      "no_live_execution",
      "no_exchange_keys_or_accounts",
      "no_paid_apis",
      "no_scheduler_or_cron_changes",
      "no_alert_wording_threshold_watcher_or_sizing_changes",
      "no_tp_sl_changes",
      "no_strategy_promotion",
    ],
    assumptions: {
      selectedFilter: "setup=range_breakout_long, direction=long, btcGate.state=BTC_RISK_ON, funding.persistence=persistent_positive",
      fundingLookbackHours: FUNDING_LOOKBACK_HOURS,
      fundingMaxStaleHours: FUNDING_MAX_STALE_HOURS,
      persistenceMinStreak: PERSISTENCE_MIN_STREAK,
      persistenceMinShare: PERSISTENCE_MIN_SHARE,
      fundingDecisionTime: "latest cached Hyperliquid funding row at or before DEMO-SIM entry time",
    },
    fundingCache: {
      fetchedAt: fundingCache.fetchedAt,
      source: fundingCache.source,
      fundingRows: fundingCache.totals?.fundingRows ?? null,
      requestedCoins: Object.keys(fundingCache.fundingByCoin || {}).sort(),
    },
    baselines,
    fundingAvailability,
    stress,
    decision: {
      blockers: [],
      nextActions: [],
    },
  };

  report.status = classify(stress);
  const pp = stress.persistentPositive.summary;
  const tp = stress.topPocketPersistentPositive.summary;
  report.decision.blockers = [
    pp.closedTrades < 40 ? `persistent_positive has only ${pp.closedTrades} closed trades` : null,
    stress.persistentPositive.removeBestWeek.remainder.netPnlUsd <= 0 ? "persistent_positive fails remove-best-week stress" : null,
    stress.persistentPositive.removeBestMonth.remainder.netPnlUsd <= 0 ? "persistent_positive fails remove-best-month stress" : null,
    stress.persistentPositive.removeBestSymbol.remainder.netPnlUsd <= 0 ? "persistent_positive fails remove-best-symbol stress" : null,
    stress.persistentPositive.costStress.find((row) => row.key === "extra_20bps_round_trip")?.netPnlUsd <= 0 ? "persistent_positive is fragile to extra 20 bps round-trip cost" : null,
    pp.maxDrawdownPct > 0.25 ? `persistent_positive selected drawdown remains high at ${pct(pp.maxDrawdownPct)}` : null,
    tp.maxDrawdownPct > 0.25 ? `top-pocket persistent_positive drawdown remains above readiness gate at ${pct(tp.maxDrawdownPct)}` : null,
    stress.persistentPositive.byAmbiguity.find((row) => row.key === "ambiguous")?.netPnlUsd < 0 ? "ambiguous persistent_positive rows are negative" : null,
  ].filter(Boolean);
  report.decision.nextActions = report.status === "funding_context_survives_first_stress"
    ? [
      "Keep persistent_positive as a research filter to paper-watch, still without live/watcher/sizing/execution changes.",
      "Run harsher purged forward and stale/missing sensitivity before promotion discussion.",
    ]
    : [
      "Keep funding as a useful context hint only, not a promotion filter.",
      "Do not wire funding context to demo-sim:all, cron, live alerts, watchers, sizing, TP/SL, or execution.",
      "Route next work to survivor postmortems or fresh source discovery rather than adding naive entry rules.",
    ];
  report.interpretation = `Persistent-positive funding remains positive at ${pp.closedTrades} trades, ${money(pp.netPnlUsd)} USDT, PF ${pp.profitFactor}, and ${pct(pp.maxDrawdownPct)} max drawdown. Remove-best symbol/month/week remainders stay ${money(stress.persistentPositive.removeBestSymbol.remainder.netPnlUsd)}, ${money(stress.persistentPositive.removeBestMonth.remainder.netPnlUsd)}, and ${money(stress.persistentPositive.removeBestWeek.remainder.netPnlUsd)} USDT respectively. However, top-pocket persistent-positive funding still has ${pct(tp.maxDrawdownPct)} max drawdown, so this remains a research context hint rather than a promotion.`;

  await writeJson(REPORT_JSON_PATH, report);
  await fs.writeFile(REPORT_MD_PATH, renderMarkdown(report));
  console.log(JSON.stringify({
    ok: true,
    status: report.status,
    persistentPositive: pp,
    topPocketPersistentPositive: tp,
    output: "results/demo-sim-funding-context-survivor-stress.md",
  }, null, 2));
}

main().catch((error) => {
  console.error(error);
  process.exitCode = 1;
});
