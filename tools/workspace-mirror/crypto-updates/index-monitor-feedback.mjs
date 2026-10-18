#!/usr/bin/env node

import { DatabaseSync } from "node:sqlite";
import { mkdirSync, readFileSync, writeFileSync } from "node:fs";
import { dirname, resolve } from "node:path";
import { fileURLToPath } from "node:url";

const ROOT = dirname(fileURLToPath(import.meta.url));
const FEEDBACK_FILE = resolve(ROOT, "runtime/alert-feedback.jsonl");
const SQLITE_FILE = resolve(ROOT, "runtime/monitor-index.sqlite");
const YAML_INDEX_FILE = resolve(ROOT, "monitor-index.yaml");
const WIKI_DIR = resolve(ROOT, "wiki/monitor");
const DAILY_DIR = resolve(WIKI_DIR, "daily");
const WIKI_INDEX_FILE = resolve(WIKI_DIR, "index.md");

function readJsonl(path) {
  let text = "";
  try {
    text = readFileSync(path, "utf8");
  } catch {
    return [];
  }

  return text
    .split(/\n+/)
    .map((line, index) => {
      const trimmed = line.trim();
      if (!trimmed) return null;
      try {
        return { line: index + 1, record: JSON.parse(trimmed) };
      } catch {
        return { line: index + 1, parseError: true, raw: trimmed };
      }
    })
    .filter(Boolean);
}

function yamlString(value) {
  if (value === null || value === undefined) return "null";
  const str = String(value);
  if (/^[A-Za-z0-9_.:/@+-]+$/.test(str)) return str;
  return JSON.stringify(str);
}

function pct(value) {
  if (!Number.isFinite(value)) return null;
  return Number(value.toFixed(4));
}

function eventKey(item) {
  const record = item.record;
  if (record.type === "alert_sent") return record.alert?.id || `line-${item.line}`;
  if (record.type === "review_finalized") return record.review?.id || `line-${item.line}`;
  if (record.type === "manual_review") {
    return record.sourceAlert?.id || record.sourceAlert?.telegramMessageId || `manual-${item.line}`;
  }
  return `line-${item.line}`;
}

function normalize(item) {
  const record = item.record;
  const key = eventKey(item);

  if (record.type === "alert_sent") {
    const alert = record.alert || {};
    const telegramMatch = String(alert.sendResult?.stdout || "").match(/Message ID:\s*(\d+)/);
    return {
      id: key,
      recordedAt: record.recordedAt,
      type: "alert_sent",
      asset: alert.assetLabel || null,
      symbol: alert.assetSymbol || null,
      direction: alert.direction || null,
      alertTime: alert.eventTime ? new Date(alert.eventTime).toISOString() : null,
      alertPrice: alert.price ?? null,
      triggerKind: alert.triggerKind || null,
      triggerLabel: alert.triggerLabel || null,
      triggerMovePct: pct(alert.triggerMovePct),
      verdict: null,
      maxFavorablePct: null,
      maxAdversePct: null,
      fade30mPct: null,
      fade1hPct: null,
      source: alert.source || null,
      telegramMessageId: telegramMatch?.[1] || null,
      rawJson: JSON.stringify(record)
    };
  }

  if (record.type === "alert_suppressed") {
    const candidate = record.candidate || {};
    return {
      id: key,
      recordedAt: record.recordedAt,
      type: "alert_suppressed",
      asset: candidate.assetLabel || null,
      symbol: candidate.assetSymbol || null,
      direction: candidate.direction || null,
      alertTime: candidate.eventTime ? new Date(candidate.eventTime).toISOString() : null,
      alertPrice: candidate.price ?? null,
      triggerKind: candidate.triggerKind || null,
      triggerLabel: candidate.triggerLabel || null,
      triggerMovePct: pct(candidate.triggerMovePct),
      verdict: record.evidence?.pass ? "gate-pass-not-sent" : "gate-fail",
      maxFavorablePct: null,
      maxAdversePct: null,
      fade30mPct: null,
      fade1hPct: null,
      source: candidate.source || null,
      telegramMessageId: null,
      rawJson: JSON.stringify(record)
    };
  }

  if (record.type === "review_finalized") {
    const review = record.review || {};
    const checkpoints = review.checkpoints || [];
    const checkpoint30m = checkpoints.find((checkpoint) => checkpoint.label === "30m");
    const checkpoint1h = checkpoints.find((checkpoint) => checkpoint.label === "1h");
    const fade30m = checkpoint30m ? -checkpoint30m.directionalMovePct : null;
    const fade1h = checkpoint1h ? -checkpoint1h.directionalMovePct : null;
    return {
      id: key,
      recordedAt: record.recordedAt,
      type: "review_finalized",
      asset: review.assetLabel || null,
      symbol: review.assetSymbol || null,
      direction: review.direction || null,
      alertTime: review.alertTimeIso || (review.alertTime ? new Date(review.alertTime).toISOString() : null),
      alertPrice: review.alertPrice ?? null,
      triggerKind: review.triggerKind || null,
      triggerLabel: review.triggerLabel || null,
      triggerMovePct: pct(review.triggerMovePct),
      verdict: record.classification?.verdict || null,
      maxFavorablePct: pct(review.maxFavorablePct),
      maxAdversePct: pct(review.maxAdversePct),
      fade30mPct: pct(fade30m),
      fade1hPct: pct(fade1h),
      source: review.source || null,
      telegramMessageId: null,
      rawJson: JSON.stringify(record)
    };
  }

  if (record.type === "manual_review") {
    const alert = record.sourceAlert || {};
    const review = record.review || {};
    return {
      id: key,
      recordedAt: record.recordedAt,
      type: "manual_review",
      asset: alert.assetLabel || null,
      symbol: alert.assetSymbol || null,
      direction: alert.direction || null,
      alertTime: alert.alertTimeIso || null,
      alertPrice: alert.alertPrice ?? null,
      triggerKind: alert.triggerKind || null,
      triggerLabel: alert.triggerLabel || null,
      triggerMovePct: pct(alert.triggerMovePct),
      verdict: record.classification?.verdict || null,
      maxFavorablePct: pct(review.maxFavorablePct),
      maxAdversePct: pct(review.maxAdversePct),
      fade30mPct: null,
      fade1hPct: null,
      source: alert.source || null,
      telegramMessageId: alert.telegramMessageId || null,
      rawJson: JSON.stringify(record)
    };
  }

  return {
    id: key,
    recordedAt: record.recordedAt || null,
    type: record.type || "unknown",
    asset: null,
    symbol: null,
    direction: null,
    alertTime: null,
    alertPrice: null,
    triggerKind: null,
    triggerLabel: null,
    triggerMovePct: null,
    verdict: null,
    maxFavorablePct: null,
    maxAdversePct: null,
    fade30mPct: null,
    fade1hPct: null,
    source: null,
    telegramMessageId: null,
    rawJson: JSON.stringify(record)
  };
}

function dateKey(value) {
  if (!value) return "unknown";
  return String(value).slice(0, 10);
}

function writeSqlite(events) {
  mkdirSync(dirname(SQLITE_FILE), { recursive: true });
  const db = new DatabaseSync(SQLITE_FILE);
  db.exec(`
    CREATE TABLE IF NOT EXISTS monitor_events (
      id TEXT NOT NULL,
      recorded_at TEXT,
      type TEXT NOT NULL,
      asset TEXT,
      symbol TEXT,
      direction TEXT,
      alert_time TEXT,
      alert_price REAL,
      trigger_kind TEXT,
      trigger_label TEXT,
      trigger_move_pct REAL,
      verdict TEXT,
      max_favorable_pct REAL,
      max_adverse_pct REAL,
      fade_30m_pct REAL,
      fade_1h_pct REAL,
      source TEXT,
      telegram_message_id TEXT,
      raw_json TEXT NOT NULL,
      PRIMARY KEY (id, type)
    );
    CREATE INDEX IF NOT EXISTS idx_monitor_events_recorded_at ON monitor_events(recorded_at);
    CREATE INDEX IF NOT EXISTS idx_monitor_events_asset ON monitor_events(asset);
    CREATE INDEX IF NOT EXISTS idx_monitor_events_verdict ON monitor_events(verdict);
  `);

  const insert = db.prepare(`
    INSERT OR REPLACE INTO monitor_events (
      id, recorded_at, type, asset, symbol, direction, alert_time, alert_price,
      trigger_kind, trigger_label, trigger_move_pct, verdict, max_favorable_pct,
      max_adverse_pct, fade_30m_pct, fade_1h_pct, source, telegram_message_id, raw_json
    ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
  `);

  db.exec("BEGIN");
  try {
    for (const event of events) {
      insert.run(
        event.id,
        event.recordedAt,
        event.type,
        event.asset,
        event.symbol,
        event.direction,
        event.alertTime,
        event.alertPrice,
        event.triggerKind,
        event.triggerLabel,
        event.triggerMovePct,
        event.verdict,
        event.maxFavorablePct,
        event.maxAdversePct,
        event.fade30mPct,
        event.fade1hPct,
        event.source,
        event.telegramMessageId,
        event.rawJson
      );
    }
    db.exec("COMMIT");
  } catch (error) {
    db.exec("ROLLBACK");
    throw error;
  }
  db.close();
}

function summarize(events) {
  const stats = {
    totalRecords: events.length,
    alertsSent: events.filter((event) => event.type === "alert_sent").length,
    alertsSuppressed: events.filter((event) => event.type === "alert_suppressed").length,
    reviewsFinalized: events.filter((event) => event.type === "review_finalized").length,
    manualReviews: events.filter((event) => event.type === "manual_review").length,
    byAsset: new Map(),
    byVerdict: new Map(),
    byDate: new Map()
  };

  for (const event of events) {
    const asset = event.asset || "unknown";
    const verdict = event.verdict || "unclassified";
    const day = dateKey(event.recordedAt || event.alertTime);
    stats.byAsset.set(asset, (stats.byAsset.get(asset) || 0) + 1);
    stats.byVerdict.set(verdict, (stats.byVerdict.get(verdict) || 0) + 1);
    if (!stats.byDate.has(day)) stats.byDate.set(day, []);
    stats.byDate.get(day).push(event);
  }

  return stats;
}

function mapToYaml(map, indent = "  ") {
  return [...map.entries()]
    .sort(([a], [b]) => String(a).localeCompare(String(b)))
    .map(([key, value]) => `${indent}${yamlString(key)}: ${value}`)
    .join("\n");
}

function writeYamlIndex(events, stats) {
  const lastEvent = [...events].reverse().find((event) => event.recordedAt || event.alertTime);
  const recentReviews = events
    .filter((event) => event.type === "review_finalized" || event.type === "manual_review")
    .slice(-8)
    .reverse();

  const lines = [
    "version: 1",
    "generated_at: " + yamlString(new Date().toISOString()),
    "purpose: Compact index for Crypto Updates monitor feedback. Read this before raw JSONL.",
    "sources:",
    "  raw_jsonl: runtime/alert-feedback.jsonl",
    "  sqlite: runtime/monitor-index.sqlite",
    "  obsidian_index: wiki/monitor/index.md",
    "  daily_pages: wiki/monitor/daily/",
    "counts:",
    `  total_records: ${stats.totalRecords}`,
    `  alerts_sent: ${stats.alertsSent}`,
    `  alerts_suppressed: ${stats.alertsSuppressed}`,
    `  reviews_finalized: ${stats.reviewsFinalized}`,
    `  manual_reviews: ${stats.manualReviews}`,
    "by_asset:",
    mapToYaml(stats.byAsset),
    "by_verdict:",
    mapToYaml(stats.byVerdict),
    "last_event:",
    `  id: ${yamlString(lastEvent?.id)}`,
    `  type: ${yamlString(lastEvent?.type)}`,
    `  recorded_at: ${yamlString(lastEvent?.recordedAt)}`,
    `  asset: ${yamlString(lastEvent?.asset)}`,
    `  direction: ${yamlString(lastEvent?.direction)}`,
    `  verdict: ${yamlString(lastEvent?.verdict)}`,
    "recent_reviews:"
  ];

  for (const event of recentReviews) {
    lines.push(
      `  - id: ${yamlString(event.id)}`,
      `    recorded_at: ${yamlString(event.recordedAt)}`,
      `    asset: ${yamlString(event.asset)}`,
      `    direction: ${yamlString(event.direction)}`,
      `    verdict: ${yamlString(event.verdict)}`,
      `    trigger: ${yamlString([event.triggerKind, event.triggerLabel].filter(Boolean).join(" "))}`,
      `    trigger_move_pct: ${yamlString(event.triggerMovePct)}`,
      `    fade_30m_pct: ${yamlString(event.fade30mPct)}`,
      `    fade_1h_pct: ${yamlString(event.fade1hPct)}`
    );
  }

  writeFileSync(YAML_INDEX_FILE, `${lines.join("\n")}\n`, "utf8");
}

function eventBullet(event) {
  const trigger = [event.triggerKind, event.triggerLabel].filter(Boolean).join(" ") || "trigger";
  const verdict = event.verdict ? ` verdict ${event.verdict}` : "";
  const fade = event.fade30mPct != null ? ` fade30m ${event.fade30mPct}%` : "";
  return `- ${event.recordedAt || event.alertTime}: ${event.asset || "?"} ${event.direction || "?"} ${trigger} ${event.triggerMovePct ?? "?"}%${verdict}${fade}`;
}

function writeWiki(events, stats) {
  mkdirSync(DAILY_DIR, { recursive: true });
  const generatedAt = new Date().toISOString();
  const recent = events.slice(-12).reverse();

  const indexLines = [
    "---",
    "type: monitor-index",
    "name: Crypto Updates Monitor Index",
    `generated: '${generatedAt}'`,
    "source: runtime/alert-feedback.jsonl",
    "database: runtime/monitor-index.sqlite",
    "---",
    "",
    "# Crypto Updates Monitor Index",
    "",
    "This page is generated from `runtime/alert-feedback.jsonl`. It is the Obsidian-facing view; use `monitor-index.yaml` or SQLite for cheap agent retrieval.",
    "",
    "## Counts",
    "",
    `- Total records: ${stats.totalRecords}`,
    `- Alerts sent: ${stats.alertsSent}`,
    `- Alerts suppressed by evidence gate: ${stats.alertsSuppressed}`,
    `- Reviews finalized: ${stats.reviewsFinalized}`,
    `- Manual reviews: ${stats.manualReviews}`,
    "",
    "## By Asset",
    "",
    ...[...stats.byAsset.entries()].sort().map(([asset, count]) => `- ${asset}: ${count}`),
    "",
    "## By Verdict",
    "",
    ...[...stats.byVerdict.entries()].sort().map(([verdict, count]) => `- ${verdict}: ${count}`),
    "",
    "## Daily Pages",
    "",
    ...[...stats.byDate.keys()].sort().reverse().map((day) => `- [[daily/${day}|${day}]]`),
    "",
    "## Recent Events",
    "",
    ...recent.map(eventBullet),
    "",
    "> Synthesis: This is monitor evidence for threshold tuning and RALPH research, not financial advice."
  ];

  writeFileSync(WIKI_INDEX_FILE, `${indexLines.join("\n")}\n`, "utf8");

  for (const [day, dayEvents] of stats.byDate.entries()) {
    const dayStats = summarize(dayEvents);
    const lines = [
      "---",
      "type: monitor-day",
      `date: '${day}'`,
      `generated: '${generatedAt}'`,
      "source: ../../runtime/alert-feedback.jsonl",
      "---",
      "",
      `# Crypto Monitor ${day}`,
      "",
      "## Counts",
      "",
      `- Records: ${dayStats.totalRecords}`,
      `- Alerts sent: ${dayStats.alertsSent}`,
      `- Alerts suppressed by evidence gate: ${dayStats.alertsSuppressed}`,
      `- Reviews finalized: ${dayStats.reviewsFinalized}`,
      `- Manual reviews: ${dayStats.manualReviews}`,
      "",
      "## Verdicts",
      "",
      ...[...dayStats.byVerdict.entries()].sort().map(([verdict, count]) => `- ${verdict}: ${count}`),
      "",
      "## Events",
      "",
      ...dayEvents.map(eventBullet),
      "",
      "> Synthesis: Daily alert/review evidence. Use aggregated samples before proposing threshold changes."
    ];
    writeFileSync(resolve(DAILY_DIR, `${day}.md`), `${lines.join("\n")}\n`, "utf8");
  }
}

const items = readJsonl(FEEDBACK_FILE);
const events = items.filter((item) => item.record).map(normalize);
const stats = summarize(events);

writeSqlite(events);
writeYamlIndex(events, stats);
writeWiki(events, stats);

console.log(
  JSON.stringify({
    ok: true,
    records: stats.totalRecords,
    alertsSent: stats.alertsSent,
    alertsSuppressed: stats.alertsSuppressed,
    reviewsFinalized: stats.reviewsFinalized,
    sqlite: SQLITE_FILE,
    yaml: YAML_INDEX_FILE,
    wiki: WIKI_INDEX_FILE
  })
);
