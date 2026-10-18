#!/usr/bin/env node

import { mkdirSync, readFileSync, writeFileSync } from "node:fs";
import { dirname, resolve } from "node:path";
import { fileURLToPath } from "node:url";

const ROOT = dirname(fileURLToPath(import.meta.url));
const WORKSPACE_ROOT = resolve(ROOT, "..");
const ALERT_FILE = resolve(ROOT, "runtime/alert-feedback.jsonl");
const EXECUTION_FILE = resolve(ROOT, "runtime/execution-feedback.jsonl");
const OUT_JSON = resolve(ROOT, "runtime/trade-research-journal.json");
const WIKI_DIR = resolve(ROOT, "wiki/trading-journal");
const DAILY_DIR = resolve(WIKI_DIR, "daily");
const ALERTS_DIR = resolve(WIKI_DIR, "alerts");
const EXECUTIONS_DIR = resolve(WIKI_DIR, "executions");
const FOLLOWED_DIR = resolve(WIKI_DIR, "followed-alert-setups");
const MODIFIED_DIR = resolve(WIKI_DIR, "modified-alert-setups");
const MANUAL_DIR = resolve(WIKI_DIR, "manual-independent-trades");
const SHADOW_DIR = resolve(WIKI_DIR, "paper-shadow-alerts");
const WIKI_INDEX = resolve(WIKI_DIR, "index.md");
const RALPH_REPORT = resolve(WORKSPACE_ROOT, "ralph-research-os/experiments/btc-eth-alert-edge/results/live-ta-execution-journal.md");
const ALERT_MATCH_WINDOW_MS = Number(process.env.CRYPTO_UPDATES_ALERT_MATCH_WINDOW_MS || 45 * 60 * 1000);

function readJsonl(path) {
  try {
    return readFileSync(path, "utf8")
      .split(/\n+/)
      .map((line) => line.trim())
      .filter(Boolean)
      .map((line) => JSON.parse(line));
  } catch {
    return [];
  }
}

function number(value) {
  const n = Number(value);
  return Number.isFinite(n) ? n : null;
}

function dateKey(value) {
  return value ? String(value).slice(0, 10) : "unknown";
}

function assetFromSymbol(symbol) {
  return String(symbol || "")
    .replace(/USDT$/i, "")
    .toUpperCase();
}

function signed(value, digits = 2) {
  const n = number(value);
  if (n === null) return "n/a";
  return `${n >= 0 ? "+" : ""}${n.toFixed(digits)}`;
}

function money(value, digits = 2) {
  const n = number(value);
  if (n === null) return "n/a";
  return n.toLocaleString("en-US", { maximumFractionDigits: digits });
}

function slug(value) {
  return String(value || "unknown")
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/^-+|-+$/g, "")
    .slice(0, 96) || "unknown";
}

function wikiTarget(path) {
  return path.replace(/\.md$/i, "");
}

function alertPageName(alert) {
  const date = dateKey(alert.recordedAt || (alert.eventTime ? new Date(alert.eventTime).toISOString() : null));
  return `${date}-${slug(alert.asset)}-${slug(alert.direction)}-${slug(alert.triggerKind)}-${slug(alert.triggerLabel)}-${slug(alert.id || alert.eventTime)}`;
}

function executionPageName(execution) {
  return `${dateKey(execution.iso)}-${slug(execution.asset)}-${slug(execution.side)}-${slug(execution.id || execution.eventTime)}`;
}

function alertLink(alert) {
  return `[[crypto-updates/wiki/trading-journal/alerts/${alertPageName(alert)}|${alert.asset} ${alert.direction} ${alert.triggerKind}/${alert.triggerLabel}]]`;
}

function executionLink(execution) {
  return `[[crypto-updates/wiki/trading-journal/executions/${executionPageName(execution)}|${execution.asset} ${execution.side} ${execution.iso}]]`;
}

function normalizeAlerts(records) {
  return records
    .filter((record) => record.type === "alert_sent" && record.alert)
    .map((record) => {
      const alert = record.alert;
      return {
        id: alert.id,
        recordedAt: record.recordedAt,
        asset: alert.assetLabel || assetFromSymbol(alert.assetSymbol),
        symbol: String(alert.assetSymbol || "").toUpperCase(),
        direction: alert.direction,
        eventTime: Number(alert.eventTime || 0),
        price: alert.price,
        triggerKind: alert.triggerKind,
        triggerLabel: alert.triggerLabel,
        triggerMovePct: alert.triggerMovePct,
        ta: alert.ta || null,
        tradePlan: alert.fadePlan || null,
        telegramMessageId: String(alert.sendResult?.stdout || "").match(/Message ID:\s*(\d+)/)?.[1] || null
      };
    })
    .filter((alert) => alert.eventTime > 0)
    .sort((a, b) => a.eventTime - b.eventTime);
}

function normalizeExecutions(records) {
  return records
    .filter((record) => record.type === "bybit_execution" && record.group)
    .map((record) => {
      const group = record.group;
      const closed = number(group.closedSize) > 0;
      const asset = assetFromSymbol(group.symbol);
      const side =
        closed && group.side === "Buy"
          ? "close SHORT"
          : closed && group.side === "Sell"
            ? "close LONG"
            : group.side === "Buy"
              ? "open/add LONG"
              : group.side === "Sell"
                ? "open/add SHORT"
                : group.side || "trade";
      return {
        id: group.key,
        recordedAt: record.recordedAt,
        symbol: group.symbol,
        asset,
        eventTime: Number(group.execTime || 0),
        iso: group.execTime ? new Date(Number(group.execTime)).toISOString() : record.recordedAt,
        side,
        qty: group.qty,
        avgPrice: group.avgPrice,
        fee: group.fee,
        closed,
        closedPnl: record.closedPnl || null,
        raw: record
      };
    })
    .filter((execution) => execution.eventTime > 0)
    .sort((a, b) => a.eventTime - b.eventTime);
}

function normalizeReviews(records) {
  return records
    .filter((record) => record.type === "review_finalized" && record.review)
    .map((record) => ({
      id: record.review.id,
      recordedAt: record.recordedAt,
      verdict: record.classification?.verdict || "unclassified",
      reason: record.classification?.reason || null,
      review: record.review
    }));
}

function matchAlert(execution, alerts) {
  const candidates = alerts
    .filter((alert) => alert.asset === execution.asset)
    .filter((alert) => alert.eventTime <= execution.eventTime)
    .filter((alert) => execution.eventTime - alert.eventTime <= ALERT_MATCH_WINDOW_MS)
    .sort((a, b) => b.eventTime - a.eventTime);
  return candidates[0] || null;
}

function plannedDirection(alert) {
  return alert?.tradePlan?.fadeDirection || alert?.ta?.tradeDirection || null;
}

function executionDirection(execution) {
  if (execution.side.includes("LONG")) return "LONG";
  if (execution.side.includes("SHORT")) return "SHORT";
  return null;
}

function isInsidePlanRange(execution, alert) {
  const price = number(execution.avgPrice);
  const low = number(alert?.tradePlan?.noChasePrice);
  const limit = number(alert?.tradePlan?.entryBandLimit);
  if (price === null || low === null || limit === null) return null;
  const rangeLow = Math.min(low, limit);
  const rangeHigh = Math.max(low, limit);
  return price >= rangeLow && price <= rangeHigh;
}

function executionBucket(execution, alert) {
  if (!alert) {
    return {
      key: "manual-independent-trades",
      label: "manual / independent trade",
      reason: "no matching alert inside the match window"
    };
  }

  const planned = plannedDirection(alert);
  const actual = executionDirection(execution);
  const inRange = isInsidePlanRange(execution, alert);
  if (!planned || !actual) {
    return {
      key: "modified-alert-setups",
      label: "modified alert setup",
      reason: "alert matched, but planned or actual side is incomplete"
    };
  }
  if (planned !== actual) {
    return {
      key: "modified-alert-setups",
      label: "modified alert setup",
      reason: `side changed: planned ${planned}, executed ${actual}`
    };
  }
  if (inRange === false) {
    return {
      key: "modified-alert-setups",
      label: "modified alert setup",
      reason: "entry outside planned alert range"
    };
  }
  if (inRange === null) {
    return {
      key: "modified-alert-setups",
      label: "modified alert setup",
      reason: "entry range unavailable, cannot verify exact follow"
    };
  }
  return {
    key: "followed-alert-setups",
    label: "followed alert setup",
    reason: "side matched and entry was inside planned alert range"
  };
}

function journalRows(alerts, executions) {
  return executions.map((execution) => {
    const alert = matchAlert(execution, alerts);
    const ta = alert?.ta || null;
    const bucket = executionBucket(execution, alert);
    return {
      id: execution.id,
      date: dateKey(execution.iso),
      execution,
      matchedAlert: alert,
      bucket,
      strategy: ta?.strategy || "unmatched",
      timeframe: ta?.tradeTimeframe || null,
      tradeClass: ta?.tradeClass?.key || null,
      confluence: ta?.confluenceLabel || null,
      taScore: ta?.score ?? null,
      ralphFit: ta?.tradeAllowed ? "high-probability candidate" : alert ? "not high-probability yet" : "no matched alert",
      pnl: execution.closedPnl ? number(execution.closedPnl.closedPnl) : null
    };
  });
}

function paperShadowRows(alerts, executions, reviews) {
  const reviewsById = new Map(reviews.map((review) => [review.id, review]));
  return alerts.map((alert) => {
    const matchedExecutions = executions.filter((execution) => matchAlert(execution, [alert]));
    const exactFollow = matchedExecutions.filter((execution) => executionBucket(execution, alert).key === "followed-alert-setups");
    const modifiedFollow = matchedExecutions.filter((execution) => executionBucket(execution, alert).key === "modified-alert-setups");
    const review = reviewsById.get(alert.id) || null;
    return {
      id: alert.id,
      date: dateKey(alert.recordedAt || (alert.eventTime ? new Date(alert.eventTime).toISOString() : null)),
      alert,
      review,
      matchedExecutionIds: matchedExecutions.map((execution) => execution.id),
      exactFollowExecutionIds: exactFollow.map((execution) => execution.id),
      modifiedExecutionIds: modifiedFollow.map((execution) => execution.id),
      bucket: {
        key: "paper-shadow-alerts",
        label: "paper / shadow alert",
        reason:
          exactFollow.length > 0
            ? "alert has exact-follow execution; paper plan remains comparator"
            : modifiedFollow.length > 0
              ? "alert has modified execution; paper plan remains exact-follow comparator"
              : "no matched execution; paper/shadow outcome only"
      },
      hasFullTa: Boolean(alert.ta?.available),
      strategy: alert.ta?.strategy || (alert.tradePlan?.fadeDirection ? "legacy fade plan" : "unknown"),
      timeframe: alert.ta?.tradeTimeframe || alert.triggerLabel || null,
      tradeClass: alert.ta?.tradeClass?.key || null,
      confluence: alert.ta?.confluenceLabel || null,
      taScore: alert.ta?.score ?? null,
      ralphFit: alert.ta?.tradeAllowed ? "high-probability candidate" : alert.ta ? "not high-probability yet" : "legacy alert: full TA not recorded"
    };
  });
}

function rowBullet(row) {
  const alert = row.matchedAlert;
  const execution = row.execution;
  const pnl = row.pnl !== null ? ` pnl ${signed(row.pnl)} USDT` : "";
  const match = alert ? `alert ${alertLink(alert)}` : "no matched alert";
  return `- ${executionLink(execution)} @ ${money(execution.avgPrice, 6)} | ${row.bucket.label} | ${match} | ${row.strategy} ${row.timeframe || ""} | ${row.ralphFit}${pnl}`;
}

function taSummary(alert) {
  const ta = alert.ta;
  if (!ta) return "legacy alert: full TA fields not recorded in this historical row";
  const parts = [
    `strategy ${ta.strategy || "n/a"}`,
    `tf ${ta.tradeTimeframe || "n/a"}`,
    `score ${ta.score ?? "n/a"}`,
    `confluence ${ta.confluenceLabel || "n/a"}`,
    `invalidation ${ta.invalidation || "n/a"}`
  ];
  const blockers = ta.blockers?.length ? ` | blockers: ${ta.blockers.slice(0, 3).join("; ")}` : "";
  return `${parts.join(" | ")}${blockers}`;
}

function alertBullet(row, dailyPrefix = "crypto-updates/wiki/trading-journal/daily") {
  const alert = row.alert;
  const review = row.review ? ` | shadow review ${row.review.verdict}` : " | shadow review pending/missing";
  const execution =
    row.exactFollowExecutionIds.length || row.modifiedExecutionIds.length
      ? ` | executions exact ${row.exactFollowExecutionIds.length}, modified ${row.modifiedExecutionIds.length}`
      : " | executions none";
  const ts = alert.eventTime ? new Date(alert.eventTime).toISOString() : alert.recordedAt;
  const dateLink = dailyPrefix === null ? row.date : `[[${dailyPrefix}/${row.date}|${row.date}]]`;
  return `- ${dateLink} ${ts}: ${alertLink(alert)} @ ${money(alert.price, 6)} | ${row.bucket.label} | ${row.ralphFit} | ${taSummary(alert)}${review}${execution}`;
}

function formatLevel(level) {
  if (!level) return "n/a";
  const distance = Number.isFinite(level.distancePct) ? ` (${level.distancePct.toFixed(2)}%)` : "";
  return `${level.name || level.type || "level"} ${money(level.price ?? level.level, 6)}${distance}`;
}

function detailedTaLines(alert) {
  const ta = alert.ta;
  if (!ta) {
    return [
      "## Full TA",
      "",
      "- Status: legacy alert; full TA was not recorded in this historical row.",
      "- Research handling: keep this in paper/shadow only unless a later note reconstructs the setup from source data."
    ];
  }

  const ctx = ta.context || {};
  const rsi = ctx.rsi || {};
  const profile = ctx.profile || {};
  const trendline = ctx.trendline || {};
  const evidence = alert.evidence?.features || {};
  const nearestLevels = (ta.nearestLevels || []).slice(0, 12).map((level) => `- ${formatLevel(level)}`);
  const blockers = ta.blockers?.length ? ta.blockers.map((item) => `- ${item}`) : ["- none"];
  const reasons = ta.reasons?.length ? ta.reasons.map((item) => `- ${item}`) : ["- none recorded"];

  return [
    "## Full TA",
    "",
    `- Status: ${ta.available ? "available" : "unavailable"}`,
    `- RALPH fit: ${ta.tradeAllowed ? "high-probability candidate" : "not high-probability yet"}`,
    `- Strategy: ${ta.strategy || "n/a"}`,
    `- Best timeframe: ${ta.tradeTimeframe || "n/a"}`,
    `- Trade class: ${ta.tradeClass?.label || ta.tradeClass?.key || "n/a"}`,
    `- Entry trigger horizon: ${ta.entryTriggerHorizon || "n/a"}`,
    `- Holding horizon: ${ta.holdingHorizon || ta.tradeClass?.holdingHorizon || "n/a"}`,
    `- Delivery class: ${ta.deliveryClass || "n/a"}`,
    `- Direction: ${ta.tradeDirection || "n/a"}`,
    `- Confluence: ${ta.confluenceLabel || "n/a"} (${ta.score ?? "n/a"})`,
    `- HTF bias: ${ta.htfBias || "n/a"}`,
    `- Invalidation: ${ta.invalidation || "n/a"}`,
    "",
    "### Monthly / Weekly / Daily / Intraday Levels",
    "",
    nearestLevels.length ? nearestLevels.join("\n") : "- unavailable",
    "",
    "### VWAP And Volume Profile",
    "",
    `- Daily VWAP: ${money(ctx.dailyVwap, 6)}`,
    `- Weekly VWAP: ${money(ctx.weeklyVwap, 6)}`,
    `- nPOC: ${money(profile.poc, 6)}`,
    `- VAH: ${money(profile.vah, 6)}`,
    `- VAL: ${money(profile.val, 6)}`,
    "",
    "### Structure, Trendlines, SFP, Fib",
    "",
    `- Breakout/fakeout: ${ta.breakout ? `${ta.breakout.type} at ${money(ta.breakout.level, 6)}` : "unavailable"}`,
    `- SFP / liquidity sweep: ${ta.sfp ? `${ta.sfp.type} at ${money(ta.sfp.level, 6)}` : "none"}`,
    `- Fib: ${ta.fib ? formatLevel(ta.fib) : "none"}`,
    `- Trendline: ${trendline.trend || "unavailable"}`,
    `- Dynamic support: ${money(trendline.dynamicSupport, 6)}`,
    `- Dynamic resistance: ${money(trendline.dynamicResistance, 6)}`,
    "",
    "### RSI",
    "",
    `- 5m: ${money(rsi["5m"], 2)}`,
    `- 15m: ${money(rsi["15m"], 2)}`,
    `- 1h: ${money(rsi["1h"], 2)}`,
    `- 4h: ${money(rsi["4h"], 2)}`,
    "",
    "### Volume And Orderflow",
    "",
    `- Volume velocity: ${money(evidence.volumeVelocityRatio, 2)}x`,
    `- Recent volume notional: ${money(evidence.volumeRecentNotional, 2)}`,
    `- Trade-flow notional: ${money(evidence.tradeFlowNotional, 2)}`,
    `- CVD percent of volume: ${money(evidence.cvdPctOfVolume, 2)}%`,
    `- Book imbalance: ${money(evidence.bookImbalance, 2)}%`,
    `- Spread: ${money(evidence.spreadPct, 4)}%`,
    `- Top-5 depth notional: ${money(evidence.top5DepthNotional, 2)}`,
    "",
    "### Reasons",
    "",
    ...reasons,
    "",
    "### Blockers",
    "",
    ...blockers
  ];
}

function tradePlanLines(alert) {
  const plan = alert.tradePlan;
  if (!plan) return ["## Trade Plan", "", "- none recorded"];
  const leverage = number(plan.leverage);
  const takeProfitPct = number(plan.takeProfitPct);
  const stopLossPct = number(plan.stopLossPct);
  return [
    "## Trade Plan",
    "",
    `- Tradable: ${plan.tradable ? "yes" : "no"}`,
    `- Direction: ${plan.fadeDirection || "n/a"}`,
    `- Margin: ${money(plan.marginUsd, 2)} USDT`,
    `- Leverage: ${leverage === null ? "n/a" : `${leverage}x`}`,
    `- Entry no-chase price: ${money(plan.noChasePrice, 6)}`,
    `- Entry band limit: ${money(plan.entryBandLimit, 6)}`,
    `- Worst fill: ${money(plan.worstFillPrice, 6)}`,
    `- TP: ${money(plan.takeProfitPrice, 6)} (${takeProfitPct === null ? "n/a" : `${takeProfitPct.toFixed(2)}%`})`,
    `- SL: ${money(plan.stopLossPrice, 6)} (${stopLossPct === null ? "n/a" : `${stopLossPct.toFixed(2)}%`})`,
    `- Time exit: ${plan.tradable ? "30m after fill" : "n/a"}`,
    "",
    "### Alert Lines",
    "",
    ...(plan.lines || []).map((line) => `- ${line}`)
  ];
}

function reviewLines(row) {
  const review = row.review;
  if (!review) return ["## Paper / Shadow Outcome", "", "- Review: pending or missing"];
  const entry = review.review?.entryResearch;
  const checkpoints = review.review?.checkpoints || [];
  return [
    "## Paper / Shadow Outcome",
    "",
    `- Verdict: ${review.verdict}`,
    `- Reason: ${review.reason || "n/a"}`,
    `- MFE in alert direction: ${money(review.review?.maxFavorablePct, 2)}%`,
    `- MAE in alert direction: ${money(review.review?.maxAdversePct, 2)}%`,
    `- Live 2m entry status: ${entry?.live2m?.status || "n/a"}`,
    "",
    "### Checkpoints",
    "",
    ...(checkpoints.length
      ? checkpoints.map((checkpoint) => `- ${checkpoint.label}: ${money(checkpoint.price, 6)} (${signed(checkpoint.movePct, 2)}%)`)
      : ["- none"])
  ];
}

function writeAlertPages(shadowRows, rows, generatedAt) {
  mkdirSync(ALERTS_DIR, { recursive: true });
  const rowsByAlertId = new Map();
  for (const row of rows) {
    if (!row.matchedAlert?.id) continue;
    if (!rowsByAlertId.has(row.matchedAlert.id)) rowsByAlertId.set(row.matchedAlert.id, []);
    rowsByAlertId.get(row.matchedAlert.id).push(row);
  }

  for (const row of shadowRows) {
    const alert = row.alert;
    const linkedRows = rowsByAlertId.get(alert.id) || [];
    const lines = [
      "---",
      "type: trading-alert",
      `id: ${JSON.stringify(alert.id || null)}`,
      `date: '${row.date}'`,
      `asset: ${JSON.stringify(alert.asset)}`,
      `symbol: ${JSON.stringify(alert.symbol)}`,
      `bucket: "paper-shadow-alerts"`,
      `generated: '${generatedAt}'`,
      "---",
      "",
      `# ${alert.asset} ${alert.direction} ${alert.triggerKind}/${alert.triggerLabel}`,
      "",
      "[[crypto-updates/wiki/trading-journal/index|RALPH Live TA Execution Journal]]",
      `[[crypto-updates/wiki/trading-journal/paper-shadow-alerts/index|Paper / Shadow Alerts]]`,
      `[[crypto-updates/wiki/trading-journal/daily/${row.date}|Daily Journal ${row.date}]]`,
      "",
      "## Alert Event",
      "",
      `- Time: ${alert.eventTime ? new Date(alert.eventTime).toISOString() : alert.recordedAt}`,
      `- Price: ${money(alert.price, 6)}`,
      `- Trigger: ${alert.triggerKind}/${alert.triggerLabel}`,
      `- Trigger move: ${signed(alert.triggerMovePct, 2)}%`,
      `- Source: ${alert.source || "n/a"}`,
      `- Telegram message id: ${alert.telegramMessageId || "unverified/not recorded"}`,
      "",
      ...detailedTaLines(alert),
      "",
      ...tradePlanLines(alert),
      "",
      ...reviewLines(row),
      "",
      "## Execution Links",
      "",
      ...(linkedRows.length
        ? linkedRows.map((executionRow) => `- ${executionLink(executionRow.execution)} | ${executionRow.bucket.label} | ${executionRow.bucket.reason}`)
        : ["- no matched execution"]),
      "",
      "## Research Links",
      "",
      "- [[ralph-research-os/experiments/btc-eth-alert-edge/results/live-ta-execution-journal|RALPH live TA execution journal]]",
      "- [[crypto-updates/strategy-notes|Crypto updates strategy notes]]"
    ];
    writeFileSync(resolve(ALERTS_DIR, `${alertPageName(alert)}.md`), `${lines.join("\n")}\n`, "utf8");
  }

  const indexLines = [
    "---",
    "type: trading-alert-index",
    `generated: '${generatedAt}'`,
    "---",
    "",
    "# Trading Alerts",
    "",
    "[[crypto-updates/wiki/trading-journal/index|RALPH Live TA Execution Journal]]",
    "[[crypto-updates/wiki/trading-journal/paper-shadow-alerts/index|Paper / Shadow Alerts]]",
    "",
    "## Alerts",
    "",
    ...shadowRows
      .slice()
      .reverse()
      .map((row) => `- ${alertLink(row.alert)} | [[crypto-updates/wiki/trading-journal/daily/${row.date}|${row.date}]] | ${row.ralphFit}`)
  ];
  writeFileSync(resolve(ALERTS_DIR, "index.md"), `${indexLines.join("\n")}\n`, "utf8");
}

function writeExecutionPages(rows, generatedAt) {
  mkdirSync(EXECUTIONS_DIR, { recursive: true });
  for (const row of rows) {
    const execution = row.execution;
    const alert = row.matchedAlert;
    const lines = [
      "---",
      "type: trading-execution",
      `id: ${JSON.stringify(execution.id || null)}`,
      `date: '${row.date}'`,
      `asset: ${JSON.stringify(execution.asset)}`,
      `symbol: ${JSON.stringify(execution.symbol)}`,
      `bucket: ${JSON.stringify(row.bucket.key)}`,
      `generated: '${generatedAt}'`,
      "---",
      "",
      `# ${execution.asset} ${execution.side}`,
      "",
      "[[crypto-updates/wiki/trading-journal/index|RALPH Live TA Execution Journal]]",
      `[[crypto-updates/wiki/trading-journal/${row.bucket.key}/index|${row.bucket.label}]]`,
      `[[crypto-updates/wiki/trading-journal/daily/${row.date}|Daily Journal ${row.date}]]`,
      "",
      "## Execution",
      "",
      `- Time: ${execution.iso}`,
      `- Side: ${execution.side}`,
      `- Quantity: ${money(execution.qty, 6)}`,
      `- Average price: ${money(execution.avgPrice, 6)}`,
      `- Fee: ${money(execution.fee, 6)} USDT`,
      `- Closed PnL: ${row.pnl !== null ? `${signed(row.pnl)} USDT` : "n/a"}`,
      "",
      "## Attribution",
      "",
      `- Bucket: ${row.bucket.label}`,
      `- Reason: ${row.bucket.reason}`,
      `- Matched alert: ${alert ? alertLink(alert) : "none"}`,
      `- Strategy: ${row.strategy}`,
      `- Timeframe: ${row.timeframe || "n/a"}`,
      `- RALPH fit: ${row.ralphFit}`,
      "",
      "## Comparison",
      "",
      `- If followed alert plan: ${alert ? "compare against linked alert trade plan and paper/shadow outcome" : "n/a; no source alert"}`,
      "- Tomas actual execution: this page",
      "- Delta in R/PnL/MFE/MAE: pending until matched close and paper plan metrics are both available"
    ];
    writeFileSync(resolve(EXECUTIONS_DIR, `${executionPageName(execution)}.md`), `${lines.join("\n")}\n`, "utf8");
  }

  const indexLines = [
    "---",
    "type: trading-execution-index",
    `generated: '${generatedAt}'`,
    "---",
    "",
    "# Trading Executions",
    "",
    "[[crypto-updates/wiki/trading-journal/index|RALPH Live TA Execution Journal]]",
    "",
    "## Buckets",
    "",
    "- [[crypto-updates/wiki/trading-journal/followed-alert-setups/index|Followed alert setups]]",
    "- [[crypto-updates/wiki/trading-journal/modified-alert-setups/index|Modified alert setups]]",
    "- [[crypto-updates/wiki/trading-journal/manual-independent-trades/index|Manual / independent trades]]",
    "",
    "## Executions",
    "",
    ...(rows.length
      ? rows.slice().reverse().map((row) => `- ${executionLink(row.execution)} | ${row.bucket.label} | ${row.bucket.reason}`)
      : ["- none recorded"])
  ];
  writeFileSync(resolve(EXECUTIONS_DIR, "index.md"), `${indexLines.join("\n")}\n`, "utf8");
}

function summarize(rows) {
  const closed = rows.filter((row) => row.pnl !== null);
  const wins = closed.filter((row) => row.pnl > 0).length;
  const totalPnl = closed.reduce((sum, row) => sum + row.pnl, 0);
  const byStrategy = new Map();
  const byBucket = new Map();
  for (const row of rows) {
    byBucket.set(row.bucket.key, (byBucket.get(row.bucket.key) || 0) + 1);
    const key = row.strategy || "unknown";
    if (!byStrategy.has(key)) byStrategy.set(key, { total: 0, closed: 0, wins: 0, pnl: 0 });
    const bucket = byStrategy.get(key);
    bucket.total += 1;
    if (row.pnl !== null) {
      bucket.closed += 1;
      bucket.wins += row.pnl > 0 ? 1 : 0;
      bucket.pnl += row.pnl;
    }
  }
  return { total: rows.length, closed: closed.length, wins, totalPnl, byStrategy, byBucket };
}

function serializableSummary(summary) {
  return {
    total: summary.total,
    closed: summary.closed,
    wins: summary.wins,
    totalPnl: summary.totalPnl,
    byBucket: Object.fromEntries(summary.byBucket.entries()),
    byStrategy: Object.fromEntries(summary.byStrategy.entries())
  };
}

function winrateLine(wins, closed) {
  return closed ? `${((wins / closed) * 100).toFixed(1)}%` : "n/a";
}

function writeWiki(rows, shadowRows, summary) {
  for (const dir of [DAILY_DIR, ALERTS_DIR, EXECUTIONS_DIR, FOLLOWED_DIR, MODIFIED_DIR, MANUAL_DIR, SHADOW_DIR]) {
    mkdirSync(dir, { recursive: true });
  }
  const generatedAt = new Date().toISOString();
  const byDate = new Map();
  for (const row of rows) {
    if (!byDate.has(row.date)) byDate.set(row.date, []);
    byDate.get(row.date).push(row);
  }
  const alertsByDate = new Map();
  for (const row of shadowRows) {
    if (!alertsByDate.has(row.date)) alertsByDate.set(row.date, []);
    alertsByDate.get(row.date).push(row);
  }
  const allDays = [...new Set([...byDate.keys(), ...alertsByDate.keys()])].sort().reverse();

  const strategyLines = [...summary.byStrategy.entries()]
    .sort(([a], [b]) => a.localeCompare(b))
    .map(([strategy, bucket]) => {
      const wr = bucket.closed ? `${((bucket.wins / bucket.closed) * 100).toFixed(1)}%` : "n/a";
      return `- ${strategy}: ${bucket.total} executions, ${bucket.closed} closed, winrate ${wr}, pnl ${signed(bucket.pnl)} USDT`;
    });

  const indexLines = [
    "---",
    "type: trading-journal-index",
    "name: RALPH Live TA Execution Journal",
    `generated: '${generatedAt}'`,
    "sources:",
    "  - runtime/alert-feedback.jsonl",
    "  - runtime/execution-feedback.jsonl",
    "---",
    "",
    "# RALPH Live TA Execution Journal",
    "",
    "Generated join of live TA alerts and captured Bybit executions. Use this as research evidence, not as proof of a profitable system.",
    "",
    "## Summary",
    "",
    `- Executions: ${summary.total}`,
    `- Closed executions with PnL: ${summary.closed}`,
    `- Winrate on closed executions: ${winrateLine(summary.wins, summary.closed)}`,
    `- Closed PnL: ${signed(summary.totalPnl)} USDT`,
    `- Paper/shadow alerts: ${shadowRows.length}`,
    `- Alerts with full TA recorded: ${shadowRows.filter((row) => row.hasFullTa).length}`,
    "",
    "## Strategy Buckets",
    "",
    ...strategyLines,
    "",
    "## Execution Buckets",
    "",
    `- [[crypto-updates/wiki/trading-journal/followed-alert-setups/index|Followed alert setups]]: ${summary.byBucket.get("followed-alert-setups") || 0}`,
    `- [[crypto-updates/wiki/trading-journal/modified-alert-setups/index|Modified alert setups]]: ${summary.byBucket.get("modified-alert-setups") || 0}`,
    `- [[crypto-updates/wiki/trading-journal/manual-independent-trades/index|Manual / independent trades]]: ${summary.byBucket.get("manual-independent-trades") || 0}`,
    `- [[crypto-updates/wiki/trading-journal/paper-shadow-alerts/index|Paper / shadow alerts]]: ${shadowRows.length}`,
    "",
    "## Mesh",
    "",
    "- Alert notes: [[crypto-updates/wiki/trading-journal/alerts/index|alerts]]",
    "- Execution notes: [[crypto-updates/wiki/trading-journal/executions/index|executions]]",
    "- RALPH report mirror: [[ralph-research-os/experiments/btc-eth-alert-edge/results/live-ta-execution-journal|live TA execution journal]]",
    "- Standing contract: [[crypto-updates/strategy-notes|crypto updates strategy notes]]",
    "",
    "## Daily Pages",
    "",
    ...allDays.map((day) => `- [[crypto-updates/wiki/trading-journal/daily/${day}|${day}]]`),
    "",
    "## Recent Executions",
    "",
    ...rows.slice(-20).reverse().map(rowBullet),
    "",
    "## Recent Paper / Shadow Alerts",
    "",
    ...shadowRows.slice(-20).reverse().map((row) => alertBullet(row)),
    "",
    "> Next research loop: compare executed vs skipped TA candidates by strategy, timeframe, confluence, entry latency, and exit quality."
  ];
  writeFileSync(WIKI_INDEX, `${indexLines.join("\n")}\n`, "utf8");
  writeAlertPages(shadowRows, rows, generatedAt);
  writeExecutionPages(rows, generatedAt);

  const bucketSpecs = [
    ["followed-alert-setups", FOLLOWED_DIR, "Followed Alert Setups"],
    ["modified-alert-setups", MODIFIED_DIR, "Modified Alert Setups"],
    ["manual-independent-trades", MANUAL_DIR, "Manual / Independent Trades"]
  ];

  for (const [key, dir, title] of bucketSpecs) {
    const bucketRows = rows.filter((row) => row.bucket.key === key);
    const bucketSummary = summarize(bucketRows);
    const lines = [
      "---",
      "type: trading-journal-bucket",
      `bucket: ${JSON.stringify(key)}`,
      `generated: '${generatedAt}'`,
      "---",
      "",
      `# ${title}`,
      "",
      `[[crypto-updates/wiki/trading-journal/index|RALPH Live TA Execution Journal]]`,
      "",
      "## Summary",
      "",
      `- Executions: ${bucketSummary.total}`,
      `- Closed with PnL: ${bucketSummary.closed}`,
      `- Closed PnL: ${signed(bucketSummary.totalPnl)} USDT`,
      "",
      "## Entries",
      "",
      ...bucketRows.map((row) => `${rowBullet(row)} | ${row.bucket.reason}`),
      "",
      "> Research use: compare this bucket against paper/shadow results before changing setup selection."
    ];
    writeFileSync(resolve(dir, "index.md"), `${lines.join("\n")}\n`, "utf8");
  }

  const shadowLines = [
    "---",
    "type: trading-journal-bucket",
    'bucket: "paper-shadow-alerts"',
    `generated: '${generatedAt}'`,
    "---",
    "",
    "# Paper / Shadow Alerts",
    "",
    "[[crypto-updates/wiki/trading-journal/index|RALPH Live TA Execution Journal]]",
    "",
    "## Summary",
    "",
    `- Alerts: ${shadowRows.length}`,
    `- Full TA recorded: ${shadowRows.filter((row) => row.hasFullTa).length}`,
    `- Legacy alerts without full TA fields: ${shadowRows.filter((row) => !row.hasFullTa).length}`,
    `- Alerts with exact-follow execution: ${shadowRows.filter((row) => row.exactFollowExecutionIds.length > 0).length}`,
    `- Alerts with modified execution: ${shadowRows.filter((row) => row.modifiedExecutionIds.length > 0).length}`,
    `- Alerts with no matched execution: ${shadowRows.filter((row) => row.matchedExecutionIds.length === 0).length}`,
    "",
    "## Entries",
    "",
    ...shadowRows.map((row) => `${alertBullet(row)} | ${row.bucket.reason}`),
    "",
    "> Research use: this is the exact-alert-plan comparator for Tomas's actual execution buckets."
  ];
  writeFileSync(resolve(SHADOW_DIR, "index.md"), `${shadowLines.join("\n")}\n`, "utf8");

  for (const day of allDays) {
    const dayRows = byDate.get(day) || [];
    const dayAlerts = alertsByDate.get(day) || [];
    const daySummary = summarize(dayRows);
    const lines = [
      "---",
      "type: trading-journal-day",
      `date: '${day}'`,
      `generated: '${generatedAt}'`,
      "---",
      "",
      `# RALPH Trading Journal ${day}`,
      "",
      "## Summary",
      "",
      `- Executions: ${daySummary.total}`,
      `- Closed with PnL: ${daySummary.closed}`,
      `- Closed PnL: ${signed(daySummary.totalPnl)} USDT`,
      `- Paper/shadow alerts: ${dayAlerts.length}`,
      "",
      "## Executions",
      "",
      ...dayRows.map((row) => `${rowBullet(row)} | ${row.bucket.reason}`),
      "",
      "## Paper / Shadow Alerts",
      "",
      ...dayAlerts.map((row) => `${alertBullet(row, null)} | ${row.bucket.reason}`),
      "",
      "## Review Prompts",
      "",
      "- Did execution match the TA-selected strategy and timeframe?",
      "- Was entry inside the alert plan range or a chase?",
      "- Did exit respect invalidation, TP, SL, or time stop?",
      "- Which blocker/confluence feature predicted the outcome best?"
    ];
    writeFileSync(resolve(DAILY_DIR, `${day}.md`), `${lines.join("\n")}\n`, "utf8");
  }

  mkdirSync(dirname(RALPH_REPORT), { recursive: true });
  writeFileSync(RALPH_REPORT, `${indexLines.join("\n")}\n`, "utf8");
}

const alerts = normalizeAlerts(readJsonl(ALERT_FILE));
const executions = normalizeExecutions(readJsonl(EXECUTION_FILE));
const reviews = normalizeReviews(readJsonl(ALERT_FILE));
const rows = journalRows(alerts, executions);
const shadowRows = paperShadowRows(alerts, executions, reviews);
const summary = summarize(rows);

mkdirSync(dirname(OUT_JSON), { recursive: true });
writeFileSync(
  OUT_JSON,
  `${JSON.stringify({ generatedAt: new Date().toISOString(), summary: serializableSummary(summary), rows, paperShadowRows: shadowRows }, null, 2)}\n`,
  "utf8"
);
writeWiki(rows, shadowRows, summary);

console.log(
  JSON.stringify({
    ok: true,
    alerts: alerts.length,
    executions: executions.length,
    paperShadowRows: shadowRows.length,
    rows: rows.length,
    json: OUT_JSON,
    wiki: WIKI_INDEX,
    ralph: RALPH_REPORT
  })
);
