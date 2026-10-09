#!/usr/bin/env node

import { spawnSync } from "node:child_process";
import { mkdirSync, readFileSync, writeFileSync } from "node:fs";
import { dirname, resolve } from "node:path";

const ROOT = resolve(new URL(".", import.meta.url).pathname);
const FEEDBACK_FILE = resolve(ROOT, "runtime/alert-feedback.jsonl");
const REPORT_JSON = resolve(ROOT, "runtime/service-health-report.json");
const REPORT_MD = resolve(ROOT, "wiki/monitor/service-health.md");
const SERVICES = [
  "crypto-updates-market-watcher.service",
  "bybit-execution-reactor.service",
  "ralph-collector.service",
  "ralph-collector-ethusdt.service",
  "ralph-collector-solusdt.service",
  "ralph-collector-hypeusdt.service",
  "ralph-collector-dashboard.service"
];
const ORDERFLOW_CONTEXTS = [
  { label: "BTC", path: "/home/coder/data/features/live.json" },
  { label: "ETH", path: "/home/coder/data/features-ethusdt/live.json" },
  { label: "SOL", path: "/home/coder/data/features-solusdt/live.json" },
  { label: "HYPE", path: "/home/coder/data/features-hypeusdt/live.json" }
];
const ORDERFLOW_MAX_AGE_MS = Number(process.env.CRYPTO_UPDATES_ORDERFLOW_CONTEXT_MAX_AGE_MS || 15_000);
const COLLECTOR_DELAY_WARN_MS = Number(process.env.CRYPTO_UPDATES_COLLECTOR_DELAY_WARN_MS || 1_000);
const SINCE = process.env.CRYPTO_UPDATES_HEALTH_SINCE || "24 hours ago";
const DUPLICATE_WINDOW_MS = Number(process.env.CRYPTO_UPDATES_DUPLICATE_WINDOW_MS || 10_000);
const SINCE_MS = sinceToMs(SINCE);

const report = {
  generatedAt: new Date().toISOString(),
  status: "service-health",
  since: SINCE,
  services: SERVICES.map(readServiceState),
  orderflowContexts: ORDERFLOW_CONTEXTS.map(readOrderflowContextHealth),
  oomKills: readJournalMatches(/oom-kill|OOM killer/i),
  duplicateAlerts: findDuplicateAlerts(readFeedbackAlerts(), DUPLICATE_WINDOW_MS),
  decision: {
    notifyTomas: false,
    reasons: []
  }
};

for (const service of report.services) {
  if (service.activeState !== "active") {
    report.decision.notifyTomas = true;
    report.decision.reasons.push(`${service.name} is ${service.activeState}/${service.subState}`);
  }
  if (service.nRestarts >= 3) {
    report.decision.notifyTomas = true;
    report.decision.reasons.push(`${service.name} restart counter is ${service.nRestarts}`);
  }
}
for (const context of report.orderflowContexts) {
  if (!context.available) {
    report.decision.notifyTomas = true;
    report.decision.reasons.push(`${context.label} orderflow context unavailable: ${context.reason}`);
  } else if (context.ageMs > ORDERFLOW_MAX_AGE_MS) {
    report.decision.notifyTomas = true;
    report.decision.reasons.push(`${context.label} orderflow context stale: ${context.ageMs}ms`);
  }
  if (context.collector?.gaps > 0) {
    report.decision.notifyTomas = true;
    report.decision.reasons.push(`${context.label} collector gaps=${context.collector.gaps}`);
  }
  if (context.collector?.book?.state && context.collector.book.state !== "synced") {
    report.decision.notifyTomas = true;
    report.decision.reasons.push(`${context.label} book state=${context.collector.book.state}`);
  }
  if (context.collector?.delayMs > COLLECTOR_DELAY_WARN_MS) {
    report.decision.notifyTomas = true;
    report.decision.reasons.push(`${context.label} collector delay_ms=${context.collector.delayMs}`);
  }
}
if (report.oomKills.length > 0) {
  report.decision.notifyTomas = true;
  report.decision.reasons.push(`${report.oomKills.length} OOM-related journal line(s) in ${SINCE}`);
}
if (report.duplicateAlerts.length > 0) {
  report.decision.notifyTomas = true;
  report.decision.reasons.push(`${report.duplicateAlerts.length} duplicate alert cluster(s) within ${DUPLICATE_WINDOW_MS}ms`);
}
if (!report.decision.reasons.length) report.decision.reasons.push("No service-health attention gate met.");

mkdirSync(dirname(REPORT_JSON), { recursive: true });
mkdirSync(dirname(REPORT_MD), { recursive: true });
writeFileSync(REPORT_JSON, `${JSON.stringify(report, null, 2)}\n`);
writeFileSync(REPORT_MD, renderMarkdown(report));
console.log(JSON.stringify({
  ok: true,
  notifyTomas: report.decision.notifyTomas,
  services: report.services.length,
  oomKills: report.oomKills.length,
  duplicateAlertClusters: report.duplicateAlerts.length,
  orderflowContexts: report.orderflowContexts.length,
  report: REPORT_JSON
}, null, 2));

function readServiceState(name) {
  const result = spawnSync("systemctl", [
    "--user",
    "show",
    name,
    "--property=ActiveState",
    "--property=SubState",
    "--property=NRestarts",
    "--property=MemoryCurrent",
    "--property=MainPID",
    "--property=ExecMainStartTimestamp",
    "--no-pager"
  ], { encoding: "utf8" });
  const fields = {};
  for (const line of result.stdout.trim().split("\n").filter(Boolean)) {
    const [key, ...rest] = line.split("=");
    fields[key] = rest.join("=");
  }
  return {
    name,
    activeState: fields.ActiveState || "unknown",
    subState: fields.SubState || "unknown",
    nRestarts: Number(fields.NRestarts || 0),
    memoryCurrentBytes: Number(fields.MemoryCurrent || 0),
    mainPid: Number(fields.MainPID || 0),
    startedAt: fields.ExecMainStartTimestamp || null,
    commandOk: result.status === 0,
    stderr: result.stderr.trim() || null
  };
}

function readJournalMatches(pattern) {
  const units = SERVICES.flatMap((service) => ["-u", service]);
  const result = spawnSync("journalctl", [
    "--user",
    ...units,
    "--since",
    SINCE,
    "--no-pager"
  ], { encoding: "utf8", maxBuffer: 2 * 1024 * 1024 });
  if (result.status !== 0) return [];
  return result.stdout
    .split("\n")
    .filter((line) => pattern.test(line))
    .slice(-20);
}

function readOrderflowContextHealth(context) {
  try {
    const parsed = JSON.parse(readFileSync(context.path, "utf8"));
    const generated = Number(parsed.generated);
    const ageMs = Number.isFinite(generated) ? Date.now() - generated : null;
    const status = parsed.status || {};
    const collector = parsed.collector || null;
    return {
      ...context,
      available: Number.isFinite(generated) && Number.isFinite(status.last_price),
      reason: null,
      generatedAt: Number.isFinite(generated) ? new Date(generated).toISOString() : null,
      ageMs,
      maxAgeMs: ORDERFLOW_MAX_AGE_MS,
      lastPrice: Number.isFinite(status.last_price) ? status.last_price : null,
      velocity: Number.isFinite(status.velocity) ? status.velocity : null,
      bars: Array.isArray(parsed.bars) ? parsed.bars.length : null,
      events: Array.isArray(parsed.events) ? parsed.events.length : null,
      collector: collector
        ? {
            trades: Number(collector.trades || 0),
            gaps: Number(collector.gaps || 0),
            backfilled: Number(collector.backfilled || 0),
            delayMs: Number(collector.delay_ms || 0),
            book: collector.book || null,
            dataDir: collector.data_dir || null
          }
        : null
    };
  } catch (error) {
    return {
      ...context,
      available: false,
      reason: error.message,
      generatedAt: null,
      ageMs: null,
      maxAgeMs: ORDERFLOW_MAX_AGE_MS,
      lastPrice: null,
      velocity: null,
      bars: null,
      events: null,
      collector: null
    };
  }
}

function readFeedbackAlerts() {
  const cutoff = Date.now() - SINCE_MS;
  try {
    return readFileSync(FEEDBACK_FILE, "utf8")
      .trim()
      .split("\n")
      .filter(Boolean)
      .map((line) => {
        try {
          return JSON.parse(line);
        } catch {
          return null;
        }
      })
      .filter((row) => row?.type === "alert_sent" && row.alert)
      .filter((row) => {
        const eventTime = Number(row.alert?.eventTime);
        return Number.isFinite(eventTime) && eventTime >= cutoff;
      });
  } catch {
    return [];
  }
}

function findDuplicateAlerts(records, windowMs) {
  const alerts = records
    .map((record) => ({
      id: record.alert.id,
      assetLabel: record.alert.assetLabel,
      direction: record.alert.direction,
      triggerKind: record.alert.triggerKind,
      triggerLabel: record.alert.triggerLabel,
      eventTime: Number(record.alert.eventTime),
      recordedAt: record.recordedAt || null
    }))
    .filter((alert) => Number.isFinite(alert.eventTime))
    .sort((a, b) => a.eventTime - b.eventTime);
  const clusters = [];
  for (let i = 1; i < alerts.length; i += 1) {
    const prev = alerts[i - 1];
    const current = alerts[i];
    const sameKey =
      prev.assetLabel === current.assetLabel &&
      prev.direction === current.direction &&
      prev.triggerKind === current.triggerKind &&
      prev.triggerLabel === current.triggerLabel;
    if (sameKey && current.eventTime - prev.eventTime <= windowMs) {
      clusters.push({
        key: `${current.assetLabel}:${current.direction}:${current.triggerKind}:${current.triggerLabel}`,
        firstId: prev.id,
        secondId: current.id,
        deltaMs: current.eventTime - prev.eventTime,
        firstEventTime: new Date(prev.eventTime).toISOString(),
        secondEventTime: new Date(current.eventTime).toISOString()
      });
    }
  }
  return clusters.slice(-20);
}

function renderMarkdown(input) {
  const lines = [
    "# Crypto Updates Service Health",
    "",
    `Generated: ${input.generatedAt}`,
    `Window: ${input.since}`,
    "",
    "## Decision",
    "",
    `- Notify Tomas: ${input.decision.notifyTomas ? "yes" : "no"}`,
    ...input.decision.reasons.map((reason) => `- ${reason}`),
    "",
    "## Services",
    "",
    ...input.services.map((service) =>
      `- ${service.name}: ${service.activeState}/${service.subState}, restarts=${service.nRestarts}, memory=${formatBytes(service.memoryCurrentBytes)}, pid=${service.mainPid || "n/a"}`
    ),
    "",
    "## Orderflow Contexts",
    "",
    ...input.orderflowContexts.map((context) =>
      `- ${context.label}: ${context.available ? "available" : "unavailable"}, age=${context.ageMs ?? "n/a"}ms, price=${
        context.lastPrice ?? "n/a"
      }, gaps=${context.collector?.gaps ?? "n/a"}, backfilled=${context.collector?.backfilled ?? "n/a"}, book=${
        context.collector?.book?.state ?? "n/a"
      }, delay_ms=${context.collector?.delayMs ?? "n/a"}, bars=${context.bars ?? "n/a"}, events=${context.events ?? "n/a"}`
    ),
    "",
    "## OOM / Restart Evidence",
    "",
    ...(input.oomKills.length ? input.oomKills.map((line) => `- ${line}`) : ["- none"]),
    "",
    "## Duplicate Alert Clusters",
    "",
    ...(input.duplicateAlerts.length
      ? input.duplicateAlerts.map((cluster) => `- ${cluster.key}: ${cluster.firstId} -> ${cluster.secondId} in ${cluster.deltaMs}ms`)
      : ["- none"]),
    "",
    "Boundary: read-only health check; no live trading, orders, keys, accounts, thresholds, alert wording, sizing, TP/SL, execution behavior, scheduler mutation, or public posting changed.",
    ""
  ];
  return `${lines.join("\n")}\n`;
}

function formatBytes(value) {
  if (!Number.isFinite(value) || value <= 0) return "unknown";
  const units = ["B", "KB", "MB", "GB"];
  let current = value;
  let unit = 0;
  while (current >= 1024 && unit < units.length - 1) {
    current /= 1024;
    unit += 1;
  }
  return `${current.toFixed(unit === 0 ? 0 : 1)} ${units[unit]}`;
}

function sinceToMs(input) {
  const text = String(input).trim().toLowerCase();
  const match = text.match(/^(\d+(?:\.\d+)?)\s*(minute|minutes|hour|hours|day|days)\s+ago$/);
  if (!match) return 24 * 60 * 60_000;
  const value = Number(match[1]);
  const unit = match[2];
  if (unit.startsWith("minute")) return value * 60_000;
  if (unit.startsWith("hour")) return value * 60 * 60_000;
  if (unit.startsWith("day")) return value * 24 * 60 * 60_000;
  return 24 * 60 * 60_000;
}
