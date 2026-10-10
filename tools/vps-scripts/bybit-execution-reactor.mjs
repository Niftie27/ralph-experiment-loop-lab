#!/usr/bin/env node

import crypto from "node:crypto";
import { appendFileSync, mkdirSync, readFileSync, writeFileSync } from "node:fs";
import https from "node:https";
import { dirname } from "node:path";
import { spawnSync } from "node:child_process";

const CREDENTIAL_PATH = process.env.BYBIT_READONLY_CREDENTIAL_PATH || "/home/coder/.bybit/main_readonly.json";
const STATE_PATH =
  process.env.BYBIT_EXECUTION_REACTOR_STATE ||
  "/home/coder/.openclaw/workspace/crypto-updates/runtime/bybit-execution-reactor-state.json";
const EXECUTION_FEEDBACK_FILE =
  process.env.BYBIT_EXECUTION_FEEDBACK_FILE ||
  "/home/coder/.openclaw/workspace/crypto-updates/runtime/execution-feedback.jsonl";
const TRADE_JOURNAL_SCRIPT =
  process.env.BYBIT_TRADE_JOURNAL_SCRIPT ||
  "/home/coder/.openclaw/workspace/crypto-updates/index-trade-research-journal.mjs";
const OPENCLAW_BIN = process.env.OPENCLAW_BIN || "openclaw";
const TELEGRAM_TARGET = process.env.BYBIT_REACTOR_TELEGRAM_TARGET || "telegram:1539856256";
const CHANNEL = process.env.BYBIT_REACTOR_CHANNEL || "telegram";
const BASE = process.env.BYBIT_BASE_URL || "https://api.bybit.com";
const RECV_WINDOW = "5000";
const MAX_SEEN = 1000;
const LOOKBACK_MS = Number(process.env.BYBIT_REACTOR_LOOKBACK_MS || 6 * 60 * 60 * 1000);

const args = new Set(process.argv.slice(2));
const seedOnly = args.has("--seed");
const dryRun = args.has("--dry-run");
const loop = args.has("--loop");
const LOOP_INTERVAL_MS = Number(process.env.BYBIT_REACTOR_INTERVAL_MS || 30_000);

function nowIso() {
  return new Date().toISOString();
}

function readJson(path, fallback) {
  try {
    return JSON.parse(readFileSync(path, "utf8"));
  } catch {
    return fallback;
  }
}

function writeJson(path, value) {
  mkdirSync(dirname(path), { recursive: true });
  writeFileSync(path, `${JSON.stringify(value, null, 2)}\n`, { mode: 0o600 });
}

function appendExecution(record) {
  mkdirSync(dirname(EXECUTION_FEEDBACK_FILE), { recursive: true });
  appendFileSync(EXECUTION_FEEDBACK_FILE, `${JSON.stringify({ recordedAt: nowIso(), ...record })}\n`, {
    encoding: "utf8",
    mode: 0o600
  });
}

function rebuildTradeJournal() {
  const result = spawnSync(process.execPath, [TRADE_JOURNAL_SCRIPT], { encoding: "utf8" });
  if (result.status !== 0) {
    console.error(JSON.stringify({ ok: false, journalError: result.stderr?.trim() || result.stdout?.trim() }));
  }
}

function queryString(params) {
  return Object.entries(params)
    .filter(([, value]) => value !== undefined && value !== null && value !== "")
    .map(([key, value]) => `${encodeURIComponent(key)}=${encodeURIComponent(String(value))}`)
    .join("&");
}

function signedGet(creds, endpoint, params = {}) {
  return new Promise((resolve, reject) => {
    const query = queryString(params);
    const timestamp = String(Date.now());
    const payload = timestamp + creds.api_key + RECV_WINDOW + query;
    const sign = crypto.createHmac("sha256", creds.api_secret).update(payload).digest("hex");
    const url = new URL(BASE + endpoint + (query ? `?${query}` : ""));

    const req = https.request(
      {
        hostname: url.hostname,
        path: url.pathname + url.search,
        method: "GET",
        headers: {
          "X-BAPI-API-KEY": creds.api_key,
          "X-BAPI-TIMESTAMP": timestamp,
          "X-BAPI-RECV-WINDOW": RECV_WINDOW,
          "X-BAPI-SIGN": sign,
          "X-BAPI-SIGN-TYPE": "2",
          "User-Agent": "openclaw-bybit-execution-reactor/0.1"
        }
      },
      (res) => {
        let data = "";
        res.on("data", (chunk) => {
          data += chunk;
        });
        res.on("end", () => {
          try {
            resolve(JSON.parse(data));
          } catch {
            reject(new Error(`invalid_json:${res.statusCode}:${data.slice(0, 160)}`));
          }
        });
      }
    );

    req.setTimeout(30000, () => req.destroy(new Error("timeout")));
    req.on("error", reject);
    req.end();
  });
}

function number(value) {
  const n = Number(value);
  return Number.isFinite(n) ? n : 0;
}

function formatNumber(value, decimals = 4) {
  const n = Number(value);
  if (!Number.isFinite(n)) return "n/a";
  return n.toLocaleString("en-US", { maximumFractionDigits: decimals });
}

function signed(value, decimals = 2) {
  const n = Number(value);
  if (!Number.isFinite(n)) return "n/a";
  return `${n >= 0 ? "+" : ""}${n.toFixed(decimals)}`;
}

function feeLine(group, closedPnl) {
  if (!closedPnl) return `Execution fee: ${formatNumber(group.fee, 6)} USDT`;

  const openFee = number(closedPnl.openFee);
  const closeFee = number(closedPnl.closeFee);
  if (openFee || closeFee) {
    return `Fees included: open ${formatNumber(openFee, 6)} + close ${formatNumber(closeFee, 6)} = ${formatNumber(
      openFee + closeFee,
      6
    )} USDT`;
  }

  return `Close execution fee included: ${formatNumber(group.fee, 6)} USDT`;
}

function sideLabel(group) {
  const closed = group.closedSize > 0;
  if (closed && group.side === "Buy") return "close SHORT";
  if (closed && group.side === "Sell") return "close LONG";
  if (group.side === "Buy") return "open/add LONG";
  if (group.side === "Sell") return "open/add SHORT";
  return group.side || "trade";
}

function groupExecutions(executions) {
  const groups = new Map();
  for (const execution of executions) {
    if (execution.execType !== "Trade") continue;
    const key = execution.orderId || execution.execId;
    if (!groups.has(key)) {
      groups.set(key, {
        key,
        symbol: execution.symbol,
        side: execution.side,
        orderType: execution.orderType,
        createType: execution.createType,
        isMaker: execution.isMaker,
        execTime: Number(execution.execTime || 0),
        execIds: [],
        qty: 0,
        value: 0,
        fee: 0,
        closedSize: 0
      });
    }
    const group = groups.get(key);
    const qty = number(execution.execQty);
    group.execTime = Math.max(group.execTime, Number(execution.execTime || 0));
    group.execIds.push(execution.execId);
    group.qty += qty;
    group.value += number(execution.execValue) || qty * number(execution.execPrice);
    group.fee += number(execution.execFee);
    group.closedSize += number(execution.closedSize);
  }
  return [...groups.values()]
    .map((group) => ({
      ...group,
      avgPrice: group.qty > 0 ? group.value / group.qty : null
    }))
    .sort((a, b) => a.execTime - b.execTime);
}

function findClosedPnl(group, closedRows) {
  if (group.closedSize <= 0) return null;
  return closedRows
    .filter((row) => row.symbol === group.symbol)
    .map((row) => ({ ...row, updated: Number(row.updatedTime || 0) }))
    .filter((row) => Math.abs(row.updated - group.execTime) <= 5 * 60 * 1000)
    .sort((a, b) => Math.abs(a.updated - group.execTime) - Math.abs(b.updated - group.execTime))[0] || null;
}

function messageFor(group, closedPnl) {
  const label = sideLabel(group);
  const lines = [
    `BYBIT EXECUTION: ${group.symbol} ${label}`,
    `${group.side} ${formatNumber(group.qty, 6)} @ ${formatNumber(group.avgPrice, 6)} (${group.orderType}${
      group.isMaker ? ", maker" : ", taker"
    })`
  ];

  if (closedPnl) {
    lines.push(
      `Closed PnL (net after fees/funding): ${signed(closedPnl.closedPnl, 2)} USDT`,
      `Entry -> exit: ${formatNumber(closedPnl.avgEntryPrice, 6)} -> ${formatNumber(closedPnl.avgExitPrice, 6)}`
    );
  }

  lines.push(feeLine(group, closedPnl), `Time: ${new Date(group.execTime).toISOString()}`);

  if (group.closedSize <= 0) {
    lines.push("Reaction: zapsano jako nova/rozsirena exekuce; pohlidam close.");
  } else if (Number(closedPnl?.closedPnl || 0) > 0) {
    lines.push("Reaction: dobry close, profit zamceny.");
  } else if (closedPnl) {
    lines.push("Reaction: close zapsany, chce to rychly review duvodu.");
  } else {
    lines.push("Reaction: close detekovan, PnL jeste neni sparovane z closed-pnl.");
  }

  return lines.join("\n");
}

function sendTelegram(message) {
  if (dryRun) {
    console.log(message);
    return { status: 0, stdout: "dry-run", stderr: "" };
  }
  const result = spawnSync(
    OPENCLAW_BIN,
    ["message", "send", "--channel", CHANNEL, "--target", TELEGRAM_TARGET, "--message", message],
    { encoding: "utf8" }
  );
  return { status: result.status, stdout: result.stdout, stderr: result.stderr };
}

async function runOnce() {
  const creds = readJson(CREDENTIAL_PATH, null);
  if (!creds?.api_key || !creds?.api_secret) throw new Error("missing Bybit read-only credentials");

  const state = readJson(STATE_PATH, { seenExecIds: [], seenOrderKeys: [] });
  const seenExecIds = new Set(state.seenExecIds || []);
  const seenOrderKeys = new Set(state.seenOrderKeys || []);
  const since = Date.now() - LOOKBACK_MS;

  const [executionsResp, closedResp] = await Promise.all([
    signedGet(creds, "/v5/execution/list", { category: "linear", limit: 50 }),
    signedGet(creds, "/v5/position/closed-pnl", { category: "linear", limit: 50 })
  ]);

  if (executionsResp.retCode !== 0) throw new Error(`execution/list failed: ${executionsResp.retCode} ${executionsResp.retMsg}`);
  if (closedResp.retCode !== 0) throw new Error(`closed-pnl failed: ${closedResp.retCode} ${closedResp.retMsg}`);

  const executions = (executionsResp.result?.list || [])
    .filter((execution) => Number(execution.execTime || 0) >= since)
    .filter((execution) => execution.execType === "Trade");
  const groups = groupExecutions(executions);
  const closedRows = closedResp.result?.list || [];
  const newGroups = [];

  for (const group of groups) {
    const allSeen = group.execIds.every((id) => seenExecIds.has(id));
    if (!allSeen && !seenOrderKeys.has(group.key)) newGroups.push(group);
    for (const id of group.execIds) seenExecIds.add(id);
    seenOrderKeys.add(group.key);
  }

  if (!seedOnly) {
    for (const group of newGroups) {
      const closedPnl = findClosedPnl(group, closedRows);
      const result = sendTelegram(messageFor(group, closedPnl));
      if (result.status !== 0) {
        console.error(JSON.stringify({ ok: false, sendError: result.stderr?.trim(), group: group.key }));
      }
      appendExecution({
        type: "bybit_execution",
        group,
        closedPnl,
        sendResult: {
          status: result.status,
          stdout: result.stdout?.trim() || "",
          stderr: result.stderr?.trim() || ""
        }
      });
      rebuildTradeJournal();
    }
  }

  const nextState = {
    updatedAt: nowIso(),
    seenExecIds: [...seenExecIds].slice(-MAX_SEEN),
    seenOrderKeys: [...seenOrderKeys].slice(-MAX_SEEN),
    lastRun: {
      checkedExecutions: executions.length,
      newGroups: seedOnly ? 0 : newGroups.length,
      seedOnly
    }
  };
  writeJson(STATE_PATH, nextState);

  console.log(JSON.stringify({ ok: true, at: nowIso(), ...nextState.lastRun, statePath: STATE_PATH }));
}

async function main() {
  if (!loop) {
    await runOnce();
    return;
  }

  console.log(JSON.stringify({ ok: true, mode: "loop", intervalMs: LOOP_INTERVAL_MS, startedAt: nowIso() }));
  await runOnce().catch((error) => {
    console.error(JSON.stringify({ ok: false, at: nowIso(), error: error.message }));
  });
  const timer = setInterval(() => {
    runOnce().catch((error) => {
      console.error(JSON.stringify({ ok: false, at: nowIso(), error: error.message }));
    });
  }, LOOP_INTERVAL_MS);
  timer.ref();
  process.stdin.resume();
}

main().catch((error) => {
  console.error(JSON.stringify({ ok: false, error: error.message }));
  process.exit(1);
});
