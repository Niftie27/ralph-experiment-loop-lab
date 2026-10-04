#!/usr/bin/env node

import fs from "node:fs/promises";
import path from "node:path";

const ROOT = path.resolve(new URL("..", import.meta.url).pathname);
const OUT_JSON = path.join(ROOT, "outputs", "research-validation-checklist.json");
const OUT_MD = path.join(ROOT, "outputs", "research-validation-checklist.md");

const files = {
  index: path.join(ROOT, "index.yaml"),
  router: path.join(ROOT, "automation", "retrieval-router.yaml"),
  queues: path.join(ROOT, "automation", "work-queues.yaml"),
  loopState: path.join(ROOT, "automation", "loop-state.yaml"),
  subsystemRegistry: path.join(ROOT, "automation", "subsystem-registry.yaml"),
  currentMap: path.join(ROOT, "automation", "current-operating-map.md"),
  communicationProtocol: path.join(ROOT, "core", "communication-protocol.md"),
  cronHitlNote: path.join(ROOT, "wiki", "notes", "2026-08-30-autoresearch-cron-remediation-hitl.md"),
  autoresearchLoop: path.join(ROOT, "automation", "ralph-autoresearch-loop.md"),
  indexingTokenBudget: path.join(ROOT, "core", "indexing-token-budget.md"),
  paperDashboard: path.join(ROOT, "experiments", "btc-eth-alert-edge", "results", "paper-dashboard.json"),
  decisionGraph: path.join(ROOT, "graph", "decision-graph.json")
};

const [
  indexText,
  routerText,
  queuesText,
  loopStateText,
  subsystemRegistryText,
  currentMapText,
  communicationProtocolText,
  cronHitlNoteText,
  autoresearchLoopText,
  indexingTokenBudgetText
] = await Promise.all([
  fs.readFile(files.index, "utf8"),
  fs.readFile(files.router, "utf8"),
  fs.readFile(files.queues, "utf8"),
  fs.readFile(files.loopState, "utf8"),
  fs.readFile(files.subsystemRegistry, "utf8"),
  fs.readFile(files.currentMap, "utf8"),
  fs.readFile(files.communicationProtocol, "utf8"),
  fs.readFile(files.cronHitlNote, "utf8"),
  fs.readFile(files.autoresearchLoop, "utf8"),
  fs.readFile(files.indexingTokenBudget, "utf8")
]);

const report = {
  generatedAt: new Date().toISOString(),
  status: "maintenance-only",
  note: "Research-validation checklist report. It does not promote strategies, change alerts, alter schedules, or authorize trading.",
  checks: {
    retrieval: await checkRetrieval(indexText, routerText),
    pathRefs: await checkPathReferences({ indexText, routerText }),
    queues: checkQueues(queuesText, loopStateText),
    subsystemRegistry: await checkSubsystemRegistry(subsystemRegistryText, queuesText),
    cron: checkCron(loopStateText, currentMapText),
    delivery: checkDelivery(currentMapText),
    hitlQuality: checkHitlQuality(communicationProtocolText, cronHitlNoteText),
    loopQuality: checkLoopQuality(autoresearchLoopText, indexingTokenBudgetText),
    handoffReadiness: await checkHandoffReadiness(communicationProtocolText),
    noteFrontmatter: await checkNoteFrontmatter(),
    paperDemo: await checkPaperDemo(),
    boundaryDelta: {
      verdict: "pass",
      summary: "Report generation changed outputs only; no live or external behavior changed.",
      changed: ["outputs/research-validation-checklist.json", "outputs/research-validation-checklist.md"]
    }
  }
};

report.verdict = summarize(report.checks);

await fs.mkdir(path.dirname(OUT_JSON), { recursive: true });
await fs.writeFile(OUT_JSON, `${JSON.stringify(report, null, 2)}\n`);
await fs.writeFile(OUT_MD, renderMarkdown(report));

console.log(JSON.stringify({
  ok: true,
  verdict: report.verdict,
  checks: Object.fromEntries(Object.entries(report.checks).map(([key, value]) => [key, value.verdict])),
  outputs: [path.relative(ROOT, OUT_JSON), path.relative(ROOT, OUT_MD)]
}, null, 2));

async function checkRetrieval(indexText, routerText) {
  const expected = numberAfter(indexText, "total_wiki_pages");
  const actual = await countMarkdown(path.join(ROOT, "wiki"));
  const required = [
    "hot_topics:",
    "indexing_and_evals:",
    "wiki/notes/2026-08-30-indexing-and-evals-audit.md",
    "wiki/notes/2026-08-30-research-validation-checklist.md",
    "core/indexing-token-budget.md"
  ];
  const missing = required.filter((needle) => !routerText.includes(needle));
  const verdict = expected === actual && missing.length === 0 ? "pass" : "fail";
  return {
    verdict,
    summary: `wiki count index=${expected} actual=${actual}; indexing_and_evals route ${missing.length === 0 ? "present" : "missing entries"}`,
    expectedWikiPages: expected,
    actualWikiPages: actual,
    missingRouterEntries: missing
  };
}

async function checkPathReferences({ indexText, routerText }) {
  const refs = [
    ...extractYamlishPathRefs(indexText, "index.yaml"),
    ...extractYamlishPathRefs(routerText, "automation/retrieval-router.yaml")
  ];
  const missing = [];

  for (const ref of refs) {
    if (ref.skipExistsCheck) continue;
    if (!(await exists(resolveRef(ref.path)))) missing.push(ref);
  }

  return {
    verdict: missing.length === 0 ? "pass" : "warn",
    summary: `${refs.length} simple local path refs checked; ${missing.length} missing`,
    checkedRefs: refs.length,
    missingRefs: missing
  };
}

function checkQueues(queuesText, loopStateText) {
  const queueItems = parseQueues(queuesText);
  const duplicates = [];
  for (const [item, states] of queueItems.entries()) {
    if (states.has("pending") && states.has("done")) duplicates.push(item);
  }
  const activeLines = queuesText
    .split(/\r?\n/)
    .filter((line) => /^\s+active:\s+/.test(line) && !/active:\s+null\s*$/.test(line));
  const hasMaintenanceCron = loopStateText.includes("maintenance_cron:") && loopStateText.includes("ralph-weekly-maintenance");
  const verdict = duplicates.length === 0 && activeLines.length === 0 && hasMaintenanceCron ? "pass" : "warn";
  return {
    verdict,
    summary: `${duplicates.length} pending/done duplicates; ${activeLines.length} active queue entries; maintenance cron state ${hasMaintenanceCron ? "present" : "missing"}`,
    duplicatePendingDoneItems: duplicates,
    activeQueueLines: activeLines
  };
}

async function checkSubsystemRegistry(registryText, queuesText) {
  const requiredFields = [
    "id",
    "owner_loop",
    "mode",
    "behavior_policy",
    "cadence_or_trigger",
    "inputs",
    "outputs",
    "consumers",
    "notification_gate",
    "effectiveness_check",
    "failure_behavior",
    "current_status"
  ];
  const blocks = parseSubsystemBlocks(registryText);
  const missingFields = [];
  const missingOutputs = [];
  const staleOutputs = [];
  const ownedQueueItems = new Set();

  for (const block of blocks) {
    for (const field of requiredFields) {
      if (!block.has(field)) missingFields.push(`${block.id || "unknown"}.${field}`);
    }
    for (const item of block.ownedQueueItems) ownedQueueItems.add(item);

    const scheduled = ["scheduled", "scheduled_and_event_triggered"].includes(block.get("mode") || "");
    const activeCron = block.get("current_status") === "active_existing_cron";
    if (!scheduled && !activeCron) continue;

    for (const output of block.outputs) {
      if (skipSubsystemOutputCheck(output)) continue;
      const resolved = resolveRef(output);
      const stat = await statOrNull(resolved);
      if (!stat) {
        missingOutputs.push({ subsystem: block.id, output });
        continue;
      }
      if (output.startsWith("outputs/research-validation-checklist.")) continue;
      const ageHours = (Date.now() - stat.mtimeMs) / 36e5;
      if (scheduled && ageHours > 72) staleOutputs.push({ subsystem: block.id, output, ageHours: Number(ageHours.toFixed(1)) });
    }
  }

  const pendingQueueItems = pendingItems(queuesText);
  const unownedPendingQueueItems = pendingQueueItems.filter((item) => !ownedQueueItems.has(item));
  const verdict = blocks.length > 0 && missingFields.length === 0 && missingOutputs.length === 0 &&
    staleOutputs.length === 0 && unownedPendingQueueItems.length === 0 ? "pass" : "warn";

  return {
    verdict,
    summary: `${blocks.length} subsystem contracts; ${missingFields.length} missing fields; ${missingOutputs.length} missing active outputs; ${staleOutputs.length} stale active outputs; ${unownedPendingQueueItems.length} unowned pending queue items`,
    subsystemCount: blocks.length,
    missingFields,
    missingOutputs,
    staleOutputs,
    unownedPendingQueueItems
  };
}

function checkCron(loopStateText, currentMapText) {
  const weeklyState = loopStateText.includes("ralph-weekly-maintenance");
  const weeklyMap = currentMapText.includes("ralph-weekly-maintenance");
  const cronText = `${loopStateText}\n${currentMapText}`;
  const consecutiveErrors = numberAfter(loopStateText, "  consecutive_errors");
  const nextRunAt = scalarAfter(loopStateText, "  next_run_at");
  const lastError = scalarAfter(loopStateText, "  last_error");
  const knownAutoresearchIssue =
    cronText.includes("known timeout/error state") ||
    cronText.includes("timeout/restart") ||
    cronText.includes("timeout/gateway-restart") ||
    cronText.includes("timeout / gateway restart");
  const verdict = weeklyState && weeklyMap ? "warn" : "fail";
  return {
    verdict,
    summary: weeklyState && weeklyMap
      ? knownAutoresearchIssue
        ? `weekly maintenance is documented locally; ralph-autoresearch-loop has ${consecutiveErrors ?? "known"} timeout/gateway-restart error(s)`
        : "weekly maintenance is documented locally; live scheduler health still requires OpenClaw cron verification"
      : "weekly maintenance cron is not fully documented in local state",
    requiresRuntimeCronTool: true,
    weeklyMaintenanceInLoopState: weeklyState,
    weeklyMaintenanceInCurrentMap: weeklyMap,
    knownAutoresearchIssue,
    autoresearchConsecutiveErrors: consecutiveErrors,
    autoresearchNextRunAt: nextRunAt,
    autoresearchLastError: lastError
  };
}

function checkDelivery(currentMapText) {
  const maintenanceDeliveryNone = /ralph-weekly-maintenance[\s\S]*?Delivery: none/.test(currentMapText);
  const hasVerificationRule = currentMapText.includes("delivery none") || currentMapText.includes("Delivery: none");
  const verdict = maintenanceDeliveryNone && hasVerificationRule ? "pass" : "warn";
  return {
    verdict,
    summary: maintenanceDeliveryNone
      ? "weekly maintenance is silent by default; promised visible output still needs source-chat verification"
      : "maintenance delivery defaults need manual review",
    maintenanceDeliveryNone
  };
}

function checkHitlQuality(communicationProtocolText, cronHitlNoteText) {
  const hasBoundaryDeltaProtocol = communicationProtocolText.includes("Boundary delta: none") &&
    communicationProtocolText.includes("Needs HITL:");
  const hasSchedulerAsk = cronHitlNoteText.includes("Approve a scheduler update to `ralph-autoresearch-loop`");
  const scopeTerms = [
    "keep the same Monday/Thursday cadence",
    "delivery none",
    "narrow the prompt",
    "No live trading",
    "accounts",
    "keys",
    "paid services",
    "alert wording",
    "thresholds",
    "risk/sizing",
    "TP/SL",
    "execution behavior"
  ];
  const missingScopeTerms = scopeTerms.filter((term) => !cronHitlNoteText.includes(term));
  const verdict = hasBoundaryDeltaProtocol && hasSchedulerAsk && missingScopeTerms.length === 0 ? "pass" : "warn";
  return {
    verdict,
    summary: verdict === "pass"
      ? "scheduler remediation HITL ask exists and is narrow"
      : "scheduler remediation HITL ask or boundary language needs review",
    hasBoundaryDeltaProtocol,
    hasSchedulerAsk,
    missingScopeTerms
  };
}

function checkLoopQuality(autoresearchLoopText, indexingTokenBudgetText) {
  const required = [
    ["isolated session", autoresearchLoopText.includes("isolated")],
    ["exactly one work item", autoresearchLoopText.includes("choose exactly one work item")],
    ["narrow read budget", indexingTokenBudgetText.includes("read at most the router")],
    ["stop early on timeout risk", autoresearchLoopText.includes("stop early with a blocker note")],
    ["bridge ingest verification", autoresearchLoopText.includes("openclaw wiki ingest") && autoresearchLoopText.includes("openclaw wiki search")],
    ["sensitive surface exclusions", autoresearchLoopText.includes("Scheduler, cadence, delivery") && autoresearchLoopText.includes("execution changes without explicit per-action approval")]
  ];
  const missing = required.filter(([, ok]) => !ok).map(([name]) => name);
  return {
    verdict: missing.length === 0 ? "pass" : "warn",
    summary: missing.length === 0
      ? "autoresearch loop contract has bounded-run and verification guardrails"
      : `autoresearch loop contract missing ${missing.length} guardrail(s)`,
    missingGuardrails: missing
  };
}

async function checkHandoffReadiness(communicationProtocolText) {
  const hasProtocolRule = communicationProtocolText.includes("60-70%") &&
    communicationProtocolText.includes("write a handoff") &&
    communicationProtocolText.includes("fresh session");
  const handoffDir = path.resolve(ROOT, "..", "continuation-prompts");
  const handoffs = await listFiles(handoffDir);
  const ralphHandoffs = handoffs.filter((file) => /ralph/i.test(path.basename(file)));
  const latest = await latestByMtime(ralphHandoffs);
  const verdict = hasProtocolRule && latest ? "pass" : "warn";
  return {
    verdict,
    summary: verdict === "pass"
      ? `handoff protocol present; latest RALPH handoff ${path.basename(latest)}`
      : "handoff protocol or continuation prompt is missing",
    hasProtocolRule,
    latestRalphHandoff: latest ? path.relative(ROOT, latest) : null
  };
}

async function checkNoteFrontmatter() {
  const notesDir = path.join(ROOT, "wiki", "notes");
  const files = (await fs.readdir(notesDir))
    .filter((name) => name.endsWith(".md"))
    .sort();
  const missingFrontmatter = [];
  const malformedFrontmatter = [];
  const missingTags = [];
  const emptyTags = [];

  for (const name of files) {
    const text = await fs.readFile(path.join(notesDir, name), "utf8");
    if (!text.startsWith("---\n")) {
      missingFrontmatter.push(name);
      continue;
    }

    const end = text.indexOf("\n---", 4);
    if (end < 0) {
      malformedFrontmatter.push(name);
      continue;
    }

    const frontmatter = text.slice(4, end).split(/\r?\n/);
    const tagsIndex = frontmatter.findIndex((line) => /^tags:\s*(?:#.*)?$/.test(line));
    if (tagsIndex < 0) {
      missingTags.push(name);
      continue;
    }

    let tagCount = 0;
    for (let index = tagsIndex + 1; index < frontmatter.length; index += 1) {
      const line = frontmatter[index];
      if (/^\S/.test(line) && !/^\s+-\s+/.test(line)) break;
      if (/^\s+-\s+\S/.test(line)) tagCount += 1;
    }
    if (tagCount === 0) emptyTags.push(name);
  }

  const failureCount = missingFrontmatter.length + malformedFrontmatter.length + missingTags.length + emptyTags.length;
  return {
    verdict: failureCount === 0 ? "pass" : "warn",
    summary: `${files.length} wiki/notes files checked; ${failureCount} frontmatter/tag issue(s)`,
    checkedNotes: files.length,
    missingFrontmatter,
    malformedFrontmatter,
    missingTags,
    emptyTags
  };
}

async function listFiles(dir) {
  try {
    return (await fs.readdir(dir)).map((name) => path.join(dir, name));
  } catch {
    return [];
  }
}

async function latestByMtime(files) {
  let latest = null;
  for (const file of files) {
    const stat = await fs.stat(file);
    if (!latest || stat.mtimeMs > latest.mtimeMs) latest = { file, mtimeMs: stat.mtimeMs };
  }
  return latest?.file || null;
}

async function checkPaperDemo() {
  const dashboard = await readJson(files.paperDashboard, null);
  const avaxRows = countPaperRows(dashboard, (row) =>
    String(row.symbol || "").toUpperCase() === "AVAX" &&
    String(row.timeframe || "") === "1h" &&
    String(row.setup || "") === "range_breakdown_short" &&
    String(row.direction || "") === "short" &&
    String(row.regime || "") === "down/low-vol"
  );
  const threshold = 20;
  const verdict = avaxRows >= threshold ? "pass" : "not-ready";
  return {
    verdict,
    summary: `AVAX range_breakdown_short down/low-vol exact forward-paper rows ${avaxRows}/${threshold}`,
    avaxRangeBreakdownForwardRows: avaxRows,
    threshold,
    dashboardGeneratedAt: dashboard?.generated || null
  };
}

function summarize(checks) {
  const values = Object.values(checks).map((check) => check.verdict);
  if (values.includes("fail")) return "fail";
  if (values.includes("warn")) return "warn";
  if (values.includes("not-ready")) return "not-ready";
  return "pass";
}

function renderMarkdown(report) {
  const rows = Object.entries(report.checks)
    .map(([name, check]) => `| ${name} | ${check.verdict} | ${check.summary} |`)
    .join("\n");
  return `# Research Validation Checklist Report

- Generated: \`${report.generatedAt}\`
- Overall: \`${report.verdict}\`
- Mode: \`${report.status}\`

${report.note}

| Check | Verdict | Summary |
| --- | --- | --- |
${rows}

## Boundary Delta

Changed: outputs only.

Boundary delta: no strategy branch, scheduler change, live trading, accounts/keys, paid services, demo/testnet setup, alert wording, thresholds, risk/sizing/TP/SL, execution behavior, dependency adoption, public posting, or strategy promotion.
`;
}

function countPaperRows(dashboard, predicate) {
  if (!dashboard) return 0;
  const rows = dashboard.bySymbolTimeframeSetupRegime || dashboard.by_symbol_timeframe_setup_regime || [];
  return rows.filter(predicate).reduce((sum, row) => sum + (Number(row.total) || Number(row.count) || 0), 0);
}

async function countMarkdown(dir) {
  let total = 0;
  for (const entry of await fs.readdir(dir, { withFileTypes: true })) {
    const full = path.join(dir, entry.name);
    if (entry.isDirectory()) total += await countMarkdown(full);
    if (entry.isFile() && entry.name.endsWith(".md")) total += 1;
  }
  return total;
}

function extractYamlishPathRefs(text, source) {
  const refs = [];
  for (const rawLine of text.split(/\r?\n/)) {
    const line = rawLine.trimEnd();
    const listMatch = line.match(/^\s+-\s+(.+?)\s*$/);
    const scalarMatch = line.match(/^\s+[A-Za-z0-9_]+:\s+(.+?)\s*$/);
    const value = cleanYamlScalar(listMatch?.[1] || scalarMatch?.[1] || "");
    if (!looksLikeLocalPath(value)) continue;
    refs.push({
      source,
      path: value,
      skipExistsCheck: value.endsWith("/") || value.includes("*")
    });
  }
  return refs;
}

function cleanYamlScalar(value) {
  return value
    .trim()
    .replace(/^['"]|['"]$/g, "")
    .replace(/[.,;:]$/g, "")
    .split("#", 1)[0]
    .trim();
}

function looksLikeLocalPath(value) {
  if (!value || value.includes(" ") || value.includes("`")) return false;
  if (value.startsWith("http:") || value.startsWith("https:") || value.startsWith("local:")) return false;
  return /^(?:\.\.\/|wiki\/|raw\/|automation\/|core\/|decisions\/|outputs\/|experiments\/|graph\/|case-files\/|loops\/|docs\/|rules\.md$|index\.ya?ml$|index\.md$)/.test(value);
}

function resolveRef(value) {
  if (path.isAbsolute(value)) return value;
  return path.resolve(ROOT, value);
}

async function exists(file) {
  try {
    await fs.access(file);
    return true;
  } catch {
    return false;
  }
}

function numberAfter(text, key) {
  const match = text.match(new RegExp(`^${key}:\\s*(\\d+)`, "m"));
  return match ? Number(match[1]) : null;
}

function scalarAfter(text, key) {
  const escaped = key.replace(/[.*+?^${}()|[\]\\]/g, "\\$&");
  const match = text.match(new RegExp(`^${escaped}:\\s*['"]?([^'"]+)['"]?\\s*$`, "m"));
  return match ? match[1].trim() : null;
}

function parseQueues(text) {
  const items = new Map();
  let state = null;
  for (const rawLine of text.split(/\r?\n/)) {
    const stateMatch = rawLine.match(/^    (pending|done):/);
    if (stateMatch) {
      state = stateMatch[1];
      continue;
    }
    const itemMatch = rawLine.match(/^      - (.+)$/);
    if (!state || !itemMatch) continue;
    const item = itemMatch[1].trim();
    if (!items.has(item)) items.set(item, new Set());
    items.get(item).add(state);
  }
  return items;
}

function pendingItems(text) {
  const items = [];
  let state = null;
  for (const rawLine of text.split(/\r?\n/)) {
    const stateMatch = rawLine.match(/^    (pending|done):/);
    if (stateMatch) {
      state = stateMatch[1];
      continue;
    }
    const itemMatch = rawLine.match(/^      - (.+)$/);
    if (state === "pending" && itemMatch) items.push(itemMatch[1].trim());
  }
  return items;
}

function parseSubsystemBlocks(text) {
  const blocks = [];
  let current = null;
  let section = null;

  for (const rawLine of text.split(/\r?\n/)) {
    const idMatch = rawLine.match(/^  - id:\s+(.+?)\s*$/);
    if (idMatch) {
      current = {
        id: cleanYamlScalar(idMatch[1]),
        fields: new Map([["id", cleanYamlScalar(idMatch[1])]]),
        outputs: [],
        ownedQueueItems: []
      };
      blocks.push(current);
      section = null;
      continue;
    }
    if (!current) continue;

    const scalarMatch = rawLine.match(/^    ([A-Za-z0-9_]+):\s*(.*?)\s*$/);
    if (scalarMatch) {
      const [, key, value] = scalarMatch;
      current.fields.set(key, cleanYamlScalar(value));
      section = ["outputs", "owned_queue_items"].includes(key) ? key : null;
      continue;
    }

    const listMatch = rawLine.match(/^      -\s+(.+?)\s*$/);
    if (!listMatch) continue;
    const value = cleanYamlScalar(listMatch[1]);
    if (section === "outputs") current.outputs.push(value);
    if (section === "owned_queue_items") current.ownedQueueItems.push(value);
  }

  return blocks.map((block) => ({
    id: block.id,
    outputs: block.outputs,
    ownedQueueItems: block.ownedQueueItems,
    has: (field) => block.fields.has(field),
    get: (field) => block.fields.get(field)
  }));
}

function skipSubsystemOutputCheck(output) {
  return !looksLikeLocalPath(output) || output.endsWith("/") || output.includes("*") || output.startsWith("future");
}

async function statOrNull(file) {
  try {
    return await fs.stat(file);
  } catch {
    return null;
  }
}

async function readJson(file, fallback) {
  try {
    return JSON.parse(await fs.readFile(file, "utf8"));
  } catch {
    return fallback;
  }
}
