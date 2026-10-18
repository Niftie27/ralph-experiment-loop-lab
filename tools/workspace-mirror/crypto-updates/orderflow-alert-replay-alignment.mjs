#!/usr/bin/env node

import { DatabaseSync } from "node:sqlite";
import { existsSync, mkdirSync, readdirSync, readFileSync, writeFileSync } from "node:fs";
import { dirname, resolve } from "node:path";
import { fileURLToPath } from "node:url";

const ROOT = dirname(fileURLToPath(import.meta.url));
const SPIKES_DIR = resolve(ROOT, "runtime/orderflow-spikes");
const FEEDBACK_FILE = resolve(ROOT, "runtime/alert-feedback.jsonl");
const OUTPUT_DIR = resolve(ROOT, "runtime/orderflow-alignment");
const OUTPUT_JSON = resolve(OUTPUT_DIR, "latest.json");
const OUTPUT_MD = resolve(ROOT, "wiki/orderflow/replay-alignment.md");
const LOOKBACK_MS = Number(process.env.ORDERFLOW_ALIGNMENT_LOOKBACK_MS || 60_000);
const LOOKAHEAD_MS = Number(process.env.ORDERFLOW_ALIGNMENT_LOOKAHEAD_MS || 60_000);
const NEAR_MISS_MS = Number(process.env.ORDERFLOW_ALIGNMENT_NEAR_MISS_MS || 5 * 60_000);

const alertRows = readJsonl(FEEDBACK_FILE);
const reviewsById = new Map(
  alertRows
    .filter((row) => row.record?.type === "review_finalized" && row.record.review?.id)
    .map((row) => [row.record.review.id, row.record.review])
);
const alerts = alertRows
  .filter((row) => row.record?.type === "alert_sent" && row.record.alert?.id)
  .map((row) => ({
    ...row.record.alert,
    review: reviewsById.get(row.record.alert.id) || null
  }));
const runs = loadRuns();
const matches = [];
const nearMisses = [];

for (const alert of alerts) {
  const alertTs = alertTime(alert);
  if (!Number.isFinite(alertTs)) continue;
  const alertSymbols = symbolAliases(alert);

  for (const run of runs) {
    const timeDeltaMs = distanceFromWindow(alertTs, run.startedAtMs, run.finishedAtMs);
    const hasSymbol = run.symbols.some((symbol) => alertSymbols.includes(symbol));
    if (timeDeltaMs === 0 && hasSymbol) {
      matches.push(buildMatch(alert, alertTs, run, alertSymbols));
    } else if (timeDeltaMs <= NEAR_MISS_MS || (timeDeltaMs === 0 && !hasSymbol)) {
      nearMisses.push({
        alertId: alert.id,
        alertTime: new Date(alertTs).toISOString(),
        asset: alert.assetLabel || alert.assetSymbol,
        trigger: `${alert.triggerKind || "unknown"} ${alert.triggerLabel || ""}`.trim(),
        runId: run.runId,
        runWindow: `${new Date(run.startedAtMs).toISOString()} -> ${new Date(run.finishedAtMs).toISOString()}`,
        hasTimeOverlap: timeDeltaMs === 0,
        hasSymbolOverlap: hasSymbol,
        timeDeltaMs
      });
    }
  }
}

const report = {
  generatedAt: new Date().toISOString(),
  status: "research-only-replay-alignment-audit",
  inputs: {
    feedback: relative(FEEDBACK_FILE),
    spikesDir: relative(SPIKES_DIR),
    lookbackMs: LOOKBACK_MS,
    lookaheadMs: LOOKAHEAD_MS,
    nearMissMs: NEAR_MISS_MS
  },
  totals: {
    alertSent: alerts.length,
    finalizedReviews: reviewsById.size,
    featureRuns: runs.length,
    exactSymbolTimeMatches: matches.length,
    nearMisses: nearMisses.length
  },
  runs: runs.map((run) => ({
    runId: run.runId,
    startedAtIso: new Date(run.startedAtMs).toISOString(),
    finishedAtIso: new Date(run.finishedAtMs).toISOString(),
    minBucketIso: new Date(run.minBucketMs).toISOString(),
    maxBucketIso: new Date(run.maxBucketMs).toISOString(),
    featureRows: run.featureRows,
    symbols: run.symbols,
    sources: run.sources
  })),
  matches,
  nearMisses: nearMisses.slice(0, 50),
  verdict:
    matches.length > 0
      ? "Some captured orderflow feature windows can be replay-aligned by symbol and time."
      : "Current saved feature captures do not contain any finalized alert with both symbol and time overlap. They are pipeline evidence, not alert-classification evidence."
};

mkdirSync(OUTPUT_DIR, { recursive: true });
mkdirSync(dirname(OUTPUT_MD), { recursive: true });
writeFileSync(OUTPUT_JSON, `${JSON.stringify(report, null, 2)}\n`, "utf8");
writeFileSync(OUTPUT_MD, renderMarkdown(report), "utf8");

console.log(
  JSON.stringify(
    {
      ok: true,
      alertSent: report.totals.alertSent,
      finalizedReviews: report.totals.finalizedReviews,
      featureRuns: report.totals.featureRuns,
      exactSymbolTimeMatches: report.totals.exactSymbolTimeMatches,
      nearMisses: report.totals.nearMisses,
      outputJson: relative(OUTPUT_JSON),
      outputMarkdown: relative(OUTPUT_MD)
    },
    null,
    2
  )
);

function loadRuns() {
  if (!existsSync(SPIKES_DIR)) return [];
  const out = [];

  for (const entry of readdirSync(SPIKES_DIR, { withFileTypes: true }).filter((item) => item.isDirectory())) {
    const runId = entry.name;
    const dbPath = resolve(SPIKES_DIR, runId, "features.sqlite");
    const manifestPath = resolve(SPIKES_DIR, runId, "manifest.yaml");
    if (!existsSync(dbPath)) continue;
    const manifest = parseManifest(manifestPath);
    const db = new DatabaseSync(dbPath, { readOnly: true });
    const summary = db
      .prepare(
        `SELECT
          min(bucket_start_ms) AS minBucketMs,
          max(bucket_start_ms) AS maxBucketMs,
          count(*) AS featureRows
        FROM orderflow_features`
      )
      .get();
    const symbols = db
      .prepare("SELECT DISTINCT symbol FROM orderflow_features WHERE symbol IS NOT NULL ORDER BY symbol")
      .all()
      .map((row) => row.symbol);
    const sources = db
      .prepare("SELECT DISTINCT source FROM orderflow_features WHERE source IS NOT NULL ORDER BY source")
      .all()
      .map((row) => row.source);
    db.close();
    if (!Number.isFinite(summary?.minBucketMs) || !Number.isFinite(summary?.maxBucketMs)) continue;
    const startedAtMs = Number.isFinite(manifest.startedAtMs) ? manifest.startedAtMs : Number(summary.minBucketMs);
    const finishedAtMs = Number.isFinite(manifest.finishedAtMs) ? manifest.finishedAtMs : Number(summary.maxBucketMs);
    out.push({
      runId,
      dbPath,
      startedAtMs,
      finishedAtMs,
      minBucketMs: Number(summary.minBucketMs),
      maxBucketMs: Number(summary.maxBucketMs),
      featureRows: Number(summary.featureRows),
      symbols,
      sources
    });
  }

  return out.sort((a, b) => a.startedAtMs - b.startedAtMs || a.runId.localeCompare(b.runId));
}

function buildMatch(alert, alertTs, run, alertSymbols) {
  const db = new DatabaseSync(run.dbPath, { readOnly: true });
  const windowStart = alertTs - LOOKBACK_MS;
  const windowEnd = alertTs + LOOKAHEAD_MS;
  const rows = db
    .prepare(
      `SELECT
        source,
        symbol,
        count(*) AS rows,
        sum(trade_count) AS tradeCount,
        sum(signed_qty) AS signedQty,
        sum(total_qty) AS totalQty,
        sum(notional) AS notional,
        sum(book_updates) AS bookUpdates,
        avg(avg_spread_bps) AS avgSpreadBps,
        avg(avg_l1_imbalance) AS avgL1Imbalance,
        min(bucket_start_ms) AS firstBucketMs,
        max(bucket_start_ms) AS lastBucketMs
      FROM orderflow_features
      WHERE bucket_start_ms BETWEEN ? AND ?
        AND symbol IN (${alertSymbols.map(() => "?").join(",")})
      GROUP BY source, symbol
      ORDER BY source, symbol`
    )
    .all(windowStart, windowEnd, ...alertSymbols);
  db.close();

  return {
    alertId: alert.id,
    alertTime: new Date(alertTs).toISOString(),
    asset: alert.assetLabel || alert.assetSymbol,
    direction: alert.direction,
    trigger: `${alert.triggerKind || "unknown"} ${alert.triggerLabel || ""}`.trim(),
    reviewVerdict: alert.review?.classification?.verdict || null,
    runId: run.runId,
    featureWindow: {
      lookbackMs: LOOKBACK_MS,
      lookaheadMs: LOOKAHEAD_MS,
      matchedRows: rows.reduce((sum, row) => sum + Number(row.rows || 0), 0)
    },
    sources: rows.map((row) => ({
      source: row.source,
      symbol: row.symbol,
      rows: Number(row.rows),
      tradeCount: Number(row.tradeCount || 0),
      signedQty: fixed(row.signedQty),
      totalQty: fixed(row.totalQty),
      notional: fixed(row.notional),
      bookUpdates: Number(row.bookUpdates || 0),
      avgSpreadBps: fixed(row.avgSpreadBps),
      avgL1Imbalance: fixed(row.avgL1Imbalance),
      firstBucketIso: new Date(Number(row.firstBucketMs)).toISOString(),
      lastBucketIso: new Date(Number(row.lastBucketMs)).toISOString()
    }))
  };
}

function readJsonl(path) {
  if (!existsSync(path)) return [];
  return readFileSync(path, "utf8")
    .split(/\r?\n/)
    .map((line, index) => {
      const trimmed = line.trim();
      if (!trimmed) return null;
      try {
        return { line: index + 1, record: JSON.parse(trimmed) };
      } catch {
        return { line: index + 1, parseError: true };
      }
    })
    .filter(Boolean);
}

function parseManifest(path) {
  if (!existsSync(path)) return {};
  const out = {};
  for (const line of readFileSync(path, "utf8").split(/\r?\n/)) {
    const match = line.match(/^(started_at|finished_at):\s*(.+)$/);
    if (!match) continue;
    const parsed = Date.parse(match[2].trim());
    if (Number.isFinite(parsed)) {
      if (match[1] === "started_at") out.startedAtMs = parsed;
      if (match[1] === "finished_at") out.finishedAtMs = parsed;
    }
  }
  return out;
}

function alertTime(alert) {
  const numeric = Number(alert.eventTime || alert.alertTime);
  if (Number.isFinite(numeric)) return numeric;
  const parsed = Date.parse(alert.alertTimeIso || "");
  return Number.isFinite(parsed) ? parsed : null;
}

function symbolAliases(alert) {
  const raw = [alert.assetLabel, alert.assetSymbol].filter(Boolean).map((value) => String(value).toUpperCase());
  const aliases = new Set(raw);
  for (const value of raw) {
    aliases.add(value.replace(/USDT$/, ""));
    if (!value.endsWith("USDT")) aliases.add(`${value}USDT`);
  }
  return [...aliases].filter(Boolean);
}

function distanceFromWindow(ts, start, end) {
  if (ts >= start && ts <= end) return 0;
  if (ts < start) return start - ts;
  return ts - end;
}

function fixed(value) {
  const number = Number(value);
  return Number.isFinite(number) ? Number(number.toFixed(6)) : null;
}

function relative(path) {
  return path.replace(`${ROOT}/`, "");
}

function renderMarkdown(report) {
  const lines = [
    "---",
    "type: orderflow-replay-alignment",
    `generated: '${report.generatedAt}'`,
    "scope: research-only",
    "related:",
    "  - ../../orderflow-index.yaml",
    "  - ../../runtime/alert-feedback.jsonl",
    "  - ../../wiki/orderflow/index.md",
    "---",
    "",
    "# Orderflow Replay Alignment",
    "",
    "This audit checks whether saved public orderflow feature captures overlap finalized Crypto Updates alerts by both time and symbol. It does not change live alerts, thresholds, delivery, sizing, or execution.",
    "",
    "## Summary",
    "",
    `- Alert records: ${report.totals.alertSent}`,
    `- Finalized reviews: ${report.totals.finalizedReviews}`,
    `- Feature runs checked: ${report.totals.featureRuns}`,
    `- Exact symbol/time matches: ${report.totals.exactSymbolTimeMatches}`,
    `- Near misses or partial overlaps: ${report.totals.nearMisses}`,
    "",
    "## Verdict",
    "",
    report.verdict,
    "",
    "## Feature Runs",
    "",
    "| Run | Window | Symbols | Rows |",
    "| --- | --- | --- | ---: |",
    ...report.runs.map(
      (run) =>
        `| ${run.runId} | ${run.startedAtIso} -> ${run.finishedAtIso} | ${run.symbols.join(", ")} | ${run.featureRows} |`
    ),
    "",
    "## Exact Matches",
    ""
  ];

  if (report.matches.length === 0) {
    lines.push("No saved feature run currently overlaps a finalized alert by both symbol and time.", "");
  } else {
    lines.push("| Alert | Run | Verdict | Feature rows | Sources |", "| --- | --- | --- | ---: | --- |");
    for (const match of report.matches) {
      lines.push(
        `| ${match.alertId} | ${match.runId} | ${match.reviewVerdict || "unreviewed"} | ${match.featureWindow.matchedRows} | ${match.sources
          .map((source) => `${source.source}:${source.symbol}`)
          .join(", ")} |`
      );
    }
    lines.push("");
  }

  lines.push(
    "## Near Misses",
    "",
    "| Alert | Run | Time overlap | Symbol overlap | Delta ms |",
    "| --- | --- | --- | --- | ---: |",
    ...report.nearMisses
      .slice(0, 20)
      .map(
        (item) =>
          `| ${item.alertId} | ${item.runId} | ${item.hasTimeOverlap ? "yes" : "no"} | ${item.hasSymbolOverlap ? "yes" : "no"} | ${item.timeDeltaMs} |`
      ),
    "",
    "## Reassess",
    "",
    "The saved captures are still useful for pipeline and feature-shape validation, but they cannot prove alert-classification value without exact symbol/time overlap. The next bounded orderflow branch should either run a capture across BTC/ETH/SOL/HYPE during active alert windows or attach this alignment audit to future capture jobs so overlap is known immediately.",
    "",
    "No live trading, alert wording, thresholds, risk, sizing, TP/SL, execution behavior, orders, accounts, keys, paid services, public posting, scheduler, cron, systemd, dependency adoption, watcher behavior, or strategy promotion changed.",
    ""
  );

  return `${lines.join("\n")}\n`;
}
