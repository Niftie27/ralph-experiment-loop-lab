#!/usr/bin/env node

import fs from "node:fs/promises";
import path from "node:path";

const ROOT = path.resolve(new URL("..", import.meta.url).pathname);
const WORKSPACE = path.resolve(ROOT, "..");
const STATE_OF_EDGE = path.join(ROOT, "outputs", "state-of-edge-report.json");
const PAPER_SIGNALS = path.join(ROOT, "experiments", "btc-eth-alert-edge", "paper", "signals.json");
const OUT_JSON = path.join(ROOT, "outputs", "watch-row-aging-ledger.json");
const OUT_MD = path.join(ROOT, "outputs", "watch-row-aging-ledger.md");
const SAMPLE_GATE = 50;

const generatedAt = new Date().toISOString();
const stateOfEdge = JSON.parse(await fs.readFile(STATE_OF_EDGE, "utf8"));
const paperSignals = JSON.parse(await fs.readFile(PAPER_SIGNALS, "utf8"));
const previous = await readPreviousLedger();
const previousByKey = new Map((previous.rows ?? []).map((row) => [row.key, row]));
const signalRows = Array.isArray(paperSignals.signals) ? paperSignals.signals : [];
const currentWatchRows = (stateOfEdge.candidates ?? [])
  .filter((candidate) => ["watch_low_sample", "watch"].includes(candidate.action))
  .map((candidate) => buildCurrentRow(candidate, previousByKey.get(rowKey(candidate)), signalRows));

const currentKeys = new Set(currentWatchRows.map((row) => row.key));
const inactiveRows = (previous.rows ?? [])
  .filter((row) => !currentKeys.has(row.key))
  .map((row) => ({
    ...row,
    active: false,
    lastSeenAt: row.lastSeenAt ?? previous.generatedAt ?? null,
    agingState: "not_seen_current"
  }));

const rows = [...currentWatchRows, ...inactiveRows]
  .sort((a, b) => Number(b.active) - Number(a.active) || a.key.localeCompare(b.key));

const ledger = {
  generatedAt,
  status: "research-paper-watch-row-aging-ledger",
  source: {
    stateOfEdge: {
      path: "outputs/state-of-edge-report.json",
      generatedAt: stateOfEdge.generatedAt ?? null,
      verdict: stateOfEdge.verdict ?? null
    },
    paperSignals: {
      path: "experiments/btc-eth-alert-edge/paper/signals.json",
      updated: paperSignals.updated ?? null,
      count: signalRows.length
    },
    previousLedger: previous.generatedAt ? {
      path: "outputs/watch-row-aging-ledger.json",
      generatedAt: previous.generatedAt
    } : null
  },
  gates: {
    sampleGate: SAMPLE_GATE,
    candidatePromotionAllowed: false
  },
  summary: summarize(rows),
  rows,
  decision: {
    verdict: rows.some((row) => row.agingState === "decaying_before_sample_gate")
      ? "watch_rows_include_decay_no_promotion"
      : currentWatchRows.length > 0
        ? "watch_rows_active_low_sample_no_promotion"
        : "no_active_watch_rows",
    noThresholdChange: true,
    noPromotion: true,
    rationale: "Watch rows are tracked as paper/research inventory only; aging, sample progress, and decay are visibility signals, not promotion gates."
  },
  boundaries: {
    liveTrading: false,
    orderPlacement: false,
    alertWordingChanges: false,
    paperAlertLogicChanges: false,
    thresholdsChanged: false,
    sizingTpSlChanged: false,
    schedulerChanged: false,
    strategyPromotion: false
  }
};

await fs.writeFile(OUT_JSON, `${JSON.stringify(ledger, null, 2)}\n`);
await fs.writeFile(OUT_MD, renderMarkdown(ledger));

console.log(JSON.stringify({
  ok: true,
  verdict: ledger.decision.verdict,
  activeWatchRows: ledger.summary.activeRows,
  decayingRows: ledger.summary.decayingRows,
  outputs: [
    path.relative(ROOT, OUT_JSON),
    path.relative(ROOT, OUT_MD)
  ]
}, null, 2));

async function readPreviousLedger() {
  try {
    return JSON.parse(await fs.readFile(OUT_JSON, "utf8"));
  } catch {
    return {};
  }
}

function buildCurrentRow(candidate, previousRow, signals) {
  const key = rowKey(candidate);
  const matchingSignals = signals.filter((signal) => rowKey(signal) === key);
  const closed = matchingSignals.filter((signal) => signal.status === "closed");
  const open = matchingSignals.filter((signal) => signal.status === "open");
  const results = closed.map((signal) => signal.resultR).filter(Number.isFinite);
  const firstSignalAt = minIso(matchingSignals.map((signal) => signal.openedAt));
  const lastSignalAt = maxIso(matchingSignals.map((signal) => signal.openedAt));
  const firstSeenAt = previousRow?.firstSeenAt ?? generatedAt;
  const observations = [
    ...(previousRow?.observations ?? []),
    {
      at: generatedAt,
      action: candidate.action,
      sample: candidate.stats?.sample ?? null,
      expectancyR: round(candidate.stats?.expectancyR),
      profitFactor: round(candidate.stats?.profitFactor),
      baselineExpectancyR: round(candidate.baseline?.expectancyR)
    }
  ].slice(-12);
  const baselineLiftR = Number.isFinite(candidate.stats?.expectancyR) && Number.isFinite(candidate.baseline?.expectancyR)
    ? round(candidate.stats.expectancyR - candidate.baseline.expectancyR)
    : null;
  const avgPaperR = average(results);
  const latestStatsDecaying = Number.isFinite(candidate.stats?.expectancyR) &&
    (candidate.stats.expectancyR <= 0 || (Number.isFinite(candidate.stats.profitFactor) && candidate.stats.profitFactor < 1.1));
  const paperDecaying = Number.isFinite(avgPaperR) && avgPaperR <= 0;
  const sample = candidate.stats?.sample ?? 0;
  const sampleGap = Math.max(0, SAMPLE_GATE - sample);

  return {
    key,
    active: true,
    firstSeenAt,
    lastSeenAt: generatedAt,
    ageDays: ageDays(firstSeenAt, generatedAt),
    symbol: candidate.symbol,
    timeframe: candidate.timeframe,
    setup: candidate.setup,
    direction: candidate.direction,
    regime: candidate.regime,
    tier: candidate.tier,
    action: candidate.action,
    latestSignalIso: candidate.signalIso ?? null,
    sampleProgress: {
      sample,
      gate: SAMPLE_GATE,
      gap: sampleGap,
      percent: round(sample / SAMPLE_GATE)
    },
    stats: {
      expectancyR: round(candidate.stats?.expectancyR),
      profitFactor: round(candidate.stats?.profitFactor),
      winrate: round(candidate.stats?.winrate),
      baselineExpectancyR: round(candidate.baseline?.expectancyR),
      baselineLiftR
    },
    paperSignals: {
      total: matchingSignals.length,
      closed: closed.length,
      open: open.length,
      wins: results.filter((value) => value > 0).length,
      losses: results.filter((value) => value < 0).length,
      resultR: round(sum(results)),
      avgR: round(avgPaperR),
      firstSignalAt,
      lastSignalAt
    },
    agingState: sample >= SAMPLE_GATE
      ? "sample_gate_reached_needs_review"
      : latestStatsDecaying || paperDecaying
        ? "decaying_before_sample_gate"
        : "aging_low_sample_watch",
    observations
  };
}

function summarize(rows) {
  const active = rows.filter((row) => row.active);
  return {
    totalRows: rows.length,
    activeRows: active.length,
    inactiveRows: rows.length - active.length,
    decayingRows: rows.filter((row) => row.agingState === "decaying_before_sample_gate").length,
    sampleGateReachedRows: rows.filter((row) => row.agingState === "sample_gate_reached_needs_review").length,
    minSampleGap: active.length ? Math.min(...active.map((row) => row.sampleProgress.gap)) : null,
    oldestActiveAgeDays: active.length ? Math.max(...active.map((row) => row.ageDays ?? 0)) : null,
    byState: countBy(rows, (row) => row.agingState)
  };
}

function renderMarkdown(ledger) {
  const lines = ledger.rows.length
    ? ledger.rows.map((row) => `- ${row.key}: ${row.agingState}, age=${fmt(row.ageDays)}d, sample=${row.sampleProgress.sample}/${row.sampleProgress.gate}, exp=${fmtR(row.stats.expectancyR)}, PF=${fmt(row.stats.profitFactor)}, baselineLift=${fmtR(row.stats.baselineLiftR)}, paper=${row.paperSignals.closed} closed / ${fmtR(row.paperSignals.avgR)} avg.`)
    : ["- None."];
  return `# Watch-Row Aging Ledger

Generated: ${ledger.generatedAt}

Status: ${ledger.status}

Verdict: ${ledger.decision.verdict}

Source state-of-edge: ${ledger.source.stateOfEdge.generatedAt ?? "unknown"} (${ledger.source.stateOfEdge.verdict ?? "unknown"})

## Summary

- Active watch rows: ${ledger.summary.activeRows}
- Decaying before sample gate: ${ledger.summary.decayingRows}
- Sample-gate reached rows: ${ledger.summary.sampleGateReachedRows}
- Min active sample gap: ${ledger.summary.minSampleGap ?? "n/a"}
- Oldest active age: ${ledger.summary.oldestActiveAgeDays ?? "n/a"} days
- By state: ${formatCounts(ledger.summary.byState)}

## Rows

${lines.join("\n")}

## Decision

${ledger.decision.rationale}

## Boundary

Research/paper sidecar only. No live orders, scheduler changes, alert wording changes, paper alert logic changes, thresholds, sizing, TP/SL, execution behavior, or strategy promotion changed.
`;
}

function rowKey(row) {
  return [row.symbol, row.timeframe, row.setup, row.direction, row.regime].map((value) => value ?? "unknown").join("|");
}

function minIso(values) {
  const finite = values.filter(Number.isFinite);
  return finite.length ? new Date(Math.min(...finite) * 1000).toISOString() : null;
}

function maxIso(values) {
  const finite = values.filter(Number.isFinite);
  return finite.length ? new Date(Math.max(...finite) * 1000).toISOString() : null;
}

function ageDays(startIso, endIso) {
  const start = Date.parse(startIso);
  const end = Date.parse(endIso);
  return Number.isFinite(start) && Number.isFinite(end)
    ? round((end - start) / 86_400_000, 2)
    : null;
}

function sum(values) {
  return values.reduce((total, value) => total + value, 0);
}

function average(values) {
  return values.length ? sum(values) / values.length : null;
}

function countBy(rows, keyFn) {
  return rows.reduce((acc, row) => {
    const key = keyFn(row);
    acc[key] = (acc[key] ?? 0) + 1;
    return acc;
  }, {});
}

function formatCounts(counts) {
  const entries = Object.entries(counts ?? {});
  return entries.length ? entries.map(([key, value]) => `${key}=${value}`).join(", ") : "none";
}

function fmt(value) {
  return Number.isFinite(value) ? value.toFixed(4) : "n/a";
}

function fmtR(value) {
  return Number.isFinite(value) ? `${value.toFixed(4)}R` : "n/a";
}

function round(value, places = 4) {
  return Number.isFinite(value) ? Number(value.toFixed(places)) : null;
}
