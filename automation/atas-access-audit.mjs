#!/usr/bin/env node

import fs from "node:fs/promises";
import path from "node:path";
import process from "node:process";

const ROOT = path.resolve(new URL("..", import.meta.url).pathname);
const OUT_JSON = path.join(ROOT, "outputs", "atas-access-audit.json");
const OUT_MD = path.join(ROOT, "outputs", "atas-access-audit.md");
const SCHEMA_PATH = path.join(ROOT, "experiments", "strategy-destruction-filter", "schemas", "atas-orderflow-event.schema.json");

const localChecks = await Promise.all([
  commandExists("dotnet"),
  commandExists("wine"),
  pathExists("/mnt/c/Program Files/ATAS Platform"),
  pathExists(path.join(process.env.HOME || "", "ATAS")),
  pathExists(path.join(process.env.HOME || "", ".wine", "drive_c", "Program Files", "ATAS Platform"))
]);

const report = {
  generatedAt: new Date().toISOString(),
  status: "research-only-access-audit",
  product: "ATAS",
  officialSources: [
    {
      id: "atas-docs",
      url: "https://docs.atas.net/",
      observed: "Official ATAS developer documentation is available for custom indicators and strategy/bot development."
    },
    {
      id: "atas-help-development-api",
      url: "https://help.atas.net/",
      observed: "ATAS help links Development/API and custom indicator resources."
    },
    {
      id: "atas-site-development-api",
      url: "https://atas.net/",
      observed: "ATAS markets C# custom indicators/algos, exchange raw data, webhooks, footprint, heatmap, volume profile, MBO bundle, and orderflow tools."
    },
    {
      id: "atas-github-indicators",
      url: "https://github.com/AtasPlatform/Indicators",
      observed: "Public GitHub indicator examples exist for ATAS Platform."
    }
  ],
  localAccess: {
    dotnet: localChecks[0],
    wine: localChecks[1],
    windowsInstallPath: localChecks[2],
    homeAtasPath: localChecks[3],
    wineInstallPath: localChecks[4]
  },
  accessVerdict: accessVerdict(localChecks),
  proposedExportPath: {
    mode: "custom_indicator_or_strategy_exporter",
    language: "C# inside ATAS API surface",
    transport: ["append-only jsonl file", "localhost http webhook", "Telegram/Discord webhook only for manual diagnostics"],
    preferredTransport: "append-only jsonl file watched by RALPH importer",
    eventSchema: path.relative(ROOT, SCHEMA_PATH),
    firstStrategyLane: "absorption_cluster_search_read_only"
  },
  requiredHumanInputs: [
    "Confirm whether ATAS is installed on a machine I can reach.",
    "Confirm market/data feed: crypto exchange connection, futures feed, or broker feed.",
    "Confirm whether ATAS exposes footprint/cluster values needed by custom indicators on that feed.",
    "Confirm whether export can run without live trading permissions enabled.",
    "Provide a small non-secret sample export or allow a local read-only exporter install."
  ],
  blockers: [
    "No credentials, cookies, exchange keys, broker keys, or paid feed secrets should be stored in RALPH.",
    "Do not enable ATAS strategy order placement; exporter must be read-only.",
    "Do not promote absorption/cluster strategy before public/proxy and ATAS rows pass sample, BTC-gate, baseline, and walk-forward gates."
  ],
  nextActions: [
    {
      id: "atas-exporter-proof",
      action: "Build or request a minimal ATAS C# exporter that writes one absorption/cluster JSONL event per detected footprint pattern.",
      gate: "sample file validates against schema; no trading permissions required"
    },
    {
      id: "atas-importer",
      action: "Add a RALPH importer that validates JSONL rows, joins BTC regime, and produces a research-only absorption event study.",
      gate: ">=20 frozen events, >=10 usable trade windows, baseline lift positive"
    },
    {
      id: "public-proxy-parity",
      action: "Compare ATAS rows against existing public aggTrades planned-level proxy to detect export/schema drift.",
      gate: "parity note before any candidate is added"
    }
  ],
  boundary: "Audit/spec only; no ATAS install, account setup, paid feed, credentials, live trading, order placement, strategy promotion, alert wording, thresholds, risk, sizing, TP/SL, execution, or scheduler change."
};

await fs.mkdir(path.dirname(OUT_JSON), { recursive: true });
await fs.writeFile(OUT_JSON, `${JSON.stringify(report, null, 2)}\n`);
await fs.writeFile(OUT_MD, renderMarkdown(report));

console.log(JSON.stringify({
  ok: true,
  verdict: report.accessVerdict.status,
  outputs: [path.relative(ROOT, OUT_JSON), path.relative(ROOT, OUT_MD)]
}, null, 2));

async function commandExists(name) {
  const pathValue = process.env.PATH || "";
  for (const dir of pathValue.split(path.delimiter)) {
    if (!dir) continue;
    if (await pathExists(path.join(dir, name))) return { status: "available", value: path.join(dir, name) };
  }
  return { status: "missing", value: null };
}

async function pathExists(file) {
  try {
    await fs.access(file);
    return { status: "available", value: file };
  } catch {
    return { status: "missing", value: file };
  }
}

function accessVerdict(checks) {
  const [dotnet, wine, windowsPath, homePath, winePath] = checks;
  const hasLocalAtas = [windowsPath, homePath, winePath].some((item) => item.status === "available");
  if (hasLocalAtas) return { status: "local_install_detected", canUseNow: true };
  if (dotnet.status === "available" || wine.status === "available") {
    return { status: "dev_runtime_partial_no_atas_install", canUseNow: false };
  }
  return { status: "no_local_atas_access_detected", canUseNow: false };
}

function renderMarkdown(report) {
  return `# ATAS Access Audit

Generated: ${report.generatedAt}

Verdict: ${report.accessVerdict.status}

## Official Surface

${report.officialSources.map((item) => `- ${item.id}: ${item.url} - ${item.observed}`).join("\n")}

## Local Access

${Object.entries(report.localAccess).map(([key, value]) => `- ${key}: ${value.status}${value.value ? ` (${value.value})` : ""}`).join("\n")}

## Proposed Export Path

- Mode: ${report.proposedExportPath.mode}
- Language: ${report.proposedExportPath.language}
- Preferred transport: ${report.proposedExportPath.preferredTransport}
- Event schema: ${report.proposedExportPath.eventSchema}
- First lane: ${report.proposedExportPath.firstStrategyLane}

## Required Human Inputs

${report.requiredHumanInputs.map((item) => `- ${item}`).join("\n")}

## Next Actions

${report.nextActions.map((item) => `- ${item.id}: ${item.action} Gate: ${item.gate}.`).join("\n")}

## Boundary

${report.boundary}
`;
}
