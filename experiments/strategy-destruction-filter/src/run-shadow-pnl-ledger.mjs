#!/usr/bin/env node

import fs from "node:fs/promises";
import path from "node:path";

const ROOT = path.resolve(new URL("..", import.meta.url).pathname);
const WORKSPACE_ROOT = path.resolve(ROOT, "../../..");
const FEEDBACK_PATH = path.join(WORKSPACE_ROOT, "crypto-updates", "runtime", "alert-feedback.jsonl");
const RESULTS_DIR = path.join(ROOT, "results");
const REPORT_JSON = path.join(RESULTS_DIR, "shadow-pnl-ledger.json");
const REPORT_MD = path.join(RESULTS_DIR, "shadow-pnl-ledger.md");

const records = parseJsonl(await fs.readFile(FEEDBACK_PATH, "utf8"));
const alerts = new Map();
const reviews = [];
for (const record of records) {
  if (record.type === "alert_sent" && record.alert?.id) alerts.set(record.alert.id, record);
  if (record.type === "review_finalized" && record.review?.id) reviews.push(record);
}

const rows = [];
for (const reviewRecord of reviews) {
  const alertRecord = alerts.get(reviewRecord.review.id);
  if (!alertRecord?.alert?.fadePlan?.tradable) continue;
  rows.push(shadowRow(alertRecord, reviewRecord));
}

const filledRows = rows.filter((row) => row.fill.status === "filled");
const report = {
  generatedAt: new Date().toISOString(),
  status: "research-only-no-live-execution",
  source: path.relative(WORKSPACE_ROOT, FEEDBACK_PATH),
  purpose: "shadow-pnl-ledger-for-tradable-alert-plans-before-paper-or-live-promotion",
  caveats: [
    "Uses recorded alert feedback and checkpoint/min/max fields only.",
    "If both TP and SL are inside the reviewed range, the ledger records stop-first ambiguity conservatively.",
    "Time exits use the alert-time 30m checkpoint as an approximation, not exact fill-time replay.",
    "Gross PnL excludes fees, slippage, queue position, latency, and exchange execution constraints."
  ],
  totals: {
    records: records.length,
    tradablePlans: rows.length,
    filled: filledRows.length,
    noFillOrSkipped: rows.length - filledRows.length,
    targetHits: rows.filter((row) => row.outcome === "target").length,
    stopHits: rows.filter((row) => row.outcome === "stop").length,
    ambiguousStopFirst: rows.filter((row) => row.outcome === "ambiguous_stop_first").length,
    timeExits: rows.filter((row) => row.outcome === "time_exit").length,
    grossPnlUsd: round(sum(rows.map((row) => row.pnl.grossUsd))),
    filledGrossPnlUsd: round(sum(filledRows.map((row) => row.pnl.grossUsd))),
    winRateFilled: ratio(filledRows.filter((row) => row.pnl.grossUsd > 0).length, filledRows.length)
  },
  groups: summarizeGroups(rows),
  rows,
  decision: decide(rows, filledRows)
};

await fs.mkdir(RESULTS_DIR, { recursive: true });
await fs.writeFile(REPORT_JSON, `${JSON.stringify(report, null, 2)}\n`);
await fs.writeFile(REPORT_MD, renderMarkdown(report));

console.log(JSON.stringify({
  ok: true,
  tradablePlans: report.totals.tradablePlans,
  filled: report.totals.filled,
  targetHits: report.totals.targetHits,
  stopHits: report.totals.stopHits,
  ambiguousStopFirst: report.totals.ambiguousStopFirst,
  timeExits: report.totals.timeExits,
  grossPnlUsd: report.totals.grossPnlUsd,
  decision: report.decision.verdict,
  report: REPORT_JSON
}, null, 2));

function shadowRow(alertRecord, reviewRecord) {
  const alert = alertRecord.alert;
  const review = reviewRecord.review;
  const plan = alert.fadePlan;
  const fill = fillState(review.entryResearch, plan);
  const outcome = outcomeFor(fill, plan, review);
  const pnl = pnlFor(outcome, fill, plan, review);
  return {
    id: review.id,
    alertLine: alertRecord.lineNumber,
    reviewLine: reviewRecord.lineNumber,
    asset: review.assetLabel,
    symbol: review.assetSymbol,
    triggerKind: review.triggerKind,
    triggerLabel: review.triggerLabel,
    alertDirection: review.direction,
    fadeDirection: plan.fadeDirection,
    alertTime: review.alertTimeIso,
    alertPrice: review.alertPrice,
    fill,
    plan: {
      marginUsd: plan.marginUsd,
      leverage: plan.leverage,
      notional: plan.notional,
      takeProfitPct: plan.takeProfitPct,
      stopLossPct: plan.stopLossPct,
      takeProfitPrice: plan.takeProfitPrice,
      stopLossPrice: plan.stopLossPrice,
      timeExit: "30m_after_fill_approximated_by_alert_30m_checkpoint"
    },
    review: {
      verdict: reviewRecord.classification?.verdict || "unknown",
      move30mPct: checkpointMove(review, "30m"),
      move1hPct: checkpointMove(review, "1h"),
      minPrice: review.minPrice,
      maxPrice: review.maxPrice
    },
    outcome,
    pnl
  };
}

function fillState(entryResearch, plan) {
  const live2m = entryResearch?.live2m;
  if (!live2m) return { status: "missing_entry_research", entryPrice: null, observedAt: null };
  if (live2m.status !== "in_range") return { status: live2m.status || "not_filled", entryPrice: null, observedAt: live2m.firstInRangeAt || null };
  const entryPrice = Number(live2m.firstInRangePrice || plan.worstFillPrice);
  return {
    status: Number.isFinite(entryPrice) ? "filled" : "missing_entry_price",
    entryPrice: Number.isFinite(entryPrice) ? entryPrice : null,
    observedAt: live2m.firstInRangeAt || null
  };
}

function outcomeFor(fill, plan, review) {
  if (fill.status !== "filled") return fill.status;
  const direction = String(plan.fadeDirection || "").toUpperCase();
  const target = Number(plan.takeProfitPrice);
  const stop = Number(plan.stopLossPrice);
  const min = Number(review.minPrice);
  const max = Number(review.maxPrice);
  const targetHit = direction === "LONG" ? max >= target : min <= target;
  const stopHit = direction === "LONG" ? min <= stop : max >= stop;
  if (targetHit && stopHit) return "ambiguous_stop_first";
  if (targetHit) return "target";
  if (stopHit) return "stop";
  return "time_exit";
}

function pnlFor(outcome, fill, plan, review) {
  if (fill.status !== "filled") return { grossUsd: 0, grossReturnPctOnNotional: null, method: "no_fill" };
  if (outcome === "target") return { grossUsd: round(plan.takeProfitUsd), grossReturnPctOnNotional: round(plan.takeProfitPct), method: "target_hit" };
  if (outcome === "stop" || outcome === "ambiguous_stop_first") {
    return { grossUsd: round(-Math.abs(plan.stopLossUsd)), grossReturnPctOnNotional: round(-Math.abs(plan.stopLossPct)), method: outcome };
  }
  const exitPrice = checkpointPrice(review, "30m");
  if (!Number.isFinite(exitPrice)) return { grossUsd: 0, grossReturnPctOnNotional: null, method: "missing_time_exit_price" };
  const signedReturnPct = signedReturn(fill.entryPrice, exitPrice, plan.fadeDirection);
  return {
    grossUsd: round(plan.notional * signedReturnPct / 100),
    grossReturnPctOnNotional: round(signedReturnPct),
    method: "time_exit_30m_checkpoint"
  };
}

function summarizeGroups(rows) {
  const groups = new Map();
  for (const row of rows) {
    const key = [row.triggerKind, row.asset, row.triggerLabel, row.alertDirection, row.fadeDirection].join("|");
    if (!groups.has(key)) groups.set(key, []);
    groups.get(key).push(row);
  }
  return [...groups.entries()].map(([key, groupRows]) => ({
    key,
    sample: groupRows.length,
    filled: groupRows.filter((row) => row.fill.status === "filled").length,
    outcomes: countBy(groupRows, (row) => row.outcome),
    verdicts: countBy(groupRows, (row) => row.review.verdict),
    grossPnlUsd: round(sum(groupRows.map((row) => row.pnl.grossUsd))),
    winRateFilled: ratio(groupRows.filter((row) => row.fill.status === "filled" && row.pnl.grossUsd > 0).length, groupRows.filter((row) => row.fill.status === "filled").length),
    ids: groupRows.map((row) => row.id)
  })).sort((a, b) => b.sample - a.sample || a.grossPnlUsd - b.grossPnlUsd || a.key.localeCompare(b.key));
}

function decide(rows, filledRows) {
  if (!rows.length) {
    return {
      verdict: "no_tradable_plans",
      candidateAdded: false,
      noLiveChange: true,
      rationale: "No tradable alert plans were available in finalized feedback."
    };
  }
  const pnl = sum(filledRows.map((row) => row.pnl.grossUsd));
  const targetHits = filledRows.filter((row) => row.outcome === "target").length;
  const stopLike = filledRows.filter((row) => row.outcome === "stop" || row.outcome === "ambiguous_stop_first").length;
  return {
    verdict: "shadow_negative_or_unproven",
    candidateAdded: false,
    noLiveChange: true,
    rationale: `Filled shadow rows=${filledRows.length}, gross PnL=${round(pnl)} USD before fees/slippage; target hits=${targetHits}, stop-like outcomes=${stopLike}.`,
    nextStep: "Use this as a ledger input to autoresearch; do not promote alert wording, paper trading, or live execution from shadow PnL alone."
  };
}

function signedReturn(entryPrice, exitPrice, direction) {
  const raw = (exitPrice - entryPrice) / entryPrice * 100;
  return String(direction || "").toUpperCase() === "SHORT" ? -raw : raw;
}

function checkpointMove(review, label) {
  return round(review.checkpoints?.find((checkpoint) => checkpoint.label === label)?.directionalMovePct);
}

function checkpointPrice(review, label) {
  return review.checkpoints?.find((checkpoint) => checkpoint.label === label)?.price ?? null;
}

function countBy(rows, keyFn) {
  return rows.reduce((counts, row) => {
    const key = keyFn(row);
    counts[key] = (counts[key] || 0) + 1;
    return counts;
  }, {});
}

function ratio(numerator, denominator) {
  return denominator > 0 ? round(numerator / denominator) : null;
}

function sum(values) {
  return values.filter(Number.isFinite).reduce((total, value) => total + value, 0);
}

function parseJsonl(raw) {
  return raw.trim().split(/\n+/).filter(Boolean).map((line, index) => ({
    ...JSON.parse(line),
    lineNumber: index + 1
  }));
}

function round(value, digits = 4) {
  return Number.isFinite(value) ? Number(value.toFixed(digits)) : null;
}

function renderMarkdown(report) {
  const lines = [
    "# Shadow PnL Ledger",
    "",
    `Generated: ${report.generatedAt}`,
    "",
    "Status: research-only shadow ledger over finalized tradable alert plans. No live trading, orders, keys, paid APIs, cron, watcher behavior, alert wording, risk, sizing, TP/SL, or execution changed.",
    "",
    "## Caveats",
    "",
    ...report.caveats.map((caveat) => `- ${caveat}`),
    "",
    "## Decision",
    "",
    `- Verdict: ${report.decision.verdict}`,
    `- Candidate added: ${report.decision.candidateAdded}`,
    `- Rationale: ${report.decision.rationale}`,
    report.decision.nextStep ? `- Next: ${report.decision.nextStep}` : null,
    "",
    "## Totals",
    "",
    `- Tradable plans: ${report.totals.tradablePlans}`,
    `- Filled: ${report.totals.filled}`,
    `- No fill or skipped: ${report.totals.noFillOrSkipped}`,
    `- Target hits: ${report.totals.targetHits}`,
    `- Stop hits: ${report.totals.stopHits}`,
    `- Ambiguous stop-first: ${report.totals.ambiguousStopFirst}`,
    `- Time exits: ${report.totals.timeExits}`,
    `- Gross PnL: ${report.totals.grossPnlUsd} USD`,
    `- Filled win rate: ${report.totals.winRateFilled}`,
    "",
    "## Groups",
    ""
  ].filter((line) => line !== null);

  if (!report.groups.length) lines.push("- none");
  for (const group of report.groups.slice(0, 16)) {
    lines.push(
      `- ${group.key}: sample=${group.sample}, filled=${group.filled}, outcomes=${JSON.stringify(group.outcomes)}, ` +
      `grossPnl=${group.grossPnlUsd} USD, winRateFilled=${group.winRateFilled}`
    );
  }

  lines.push("", "## Rows", "");
  for (const row of report.rows.slice(0, 30)) {
    lines.push(
      `- ${row.id}: ${row.triggerKind} ${row.asset} ${row.alertDirection}->${row.fadeDirection}, ` +
      `fill=${row.fill.status}, outcome=${row.outcome}, pnl=${row.pnl.grossUsd} USD`
    );
  }
  if (report.rows.length > 30) lines.push(`- ... ${report.rows.length - 30} more rows in shadow-pnl-ledger.json`);

  return `${lines.join("\n")}\n`;
}
