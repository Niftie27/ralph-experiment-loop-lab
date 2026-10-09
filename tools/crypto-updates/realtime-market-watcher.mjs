#!/usr/bin/env node

import { spawn } from "node:child_process";
import { appendFileSync, mkdirSync, readFileSync, rmSync, writeFileSync } from "node:fs";
import { dirname } from "node:path";

const TELEGRAM_TARGET = process.env.CRYPTO_UPDATES_TELEGRAM_TARGET || "telegram:1539856256";
const CHANNEL = process.env.CRYPTO_UPDATES_CHANNEL || "telegram";
const OPENCLAW_BIN = process.env.CRYPTO_UPDATES_OPENCLAW_BIN || "openclaw";
const BINANCE_WS =
  process.env.CRYPTO_UPDATES_BINANCE_WS ||
  "wss://stream.binance.com:9443/stream?streams=btcusdt@trade/btcusdt@depth5@100ms/ethusdt@trade/ethusdt@depth5@100ms/solusdt@trade/solusdt@depth5@100ms";
const HYPERLIQUID_WS = process.env.CRYPTO_UPDATES_HYPERLIQUID_WS || "wss://api.hyperliquid.xyz/ws";
const PID_FILE =
  process.env.CRYPTO_UPDATES_PID_FILE ||
  "/home/coder/.openclaw/workspace/crypto-updates/runtime/realtime-market-watcher.pid";
const FEEDBACK_FILE =
  process.env.CRYPTO_UPDATES_FEEDBACK_FILE ||
  "/home/coder/.openclaw/workspace/crypto-updates/runtime/alert-feedback.jsonl";
const INDEX_AFTER_FEEDBACK = process.env.CRYPTO_UPDATES_INDEX_AFTER_FEEDBACK !== "0";
const INDEXER_SCRIPT =
  process.env.CRYPTO_UPDATES_INDEXER_SCRIPT ||
  "/home/coder/.openclaw/workspace/crypto-updates/index-monitor-feedback.mjs";
const TRADE_JOURNAL_SCRIPT =
  process.env.CRYPTO_UPDATES_TRADE_JOURNAL_SCRIPT ||
  "/home/coder/.openclaw/workspace/crypto-updates/index-trade-research-journal.mjs";
const SEND_REVIEW_MESSAGES = process.env.CRYPTO_UPDATES_SEND_REVIEW_MESSAGES === "1";
const ALERT_SURFACE_CHANGE_APPROVED = process.env.CRYPTO_UPDATES_ALERT_SURFACE_CHANGE_APPROVED === "1";
const REQUIRE_ALERT_EVIDENCE =
  ALERT_SURFACE_CHANGE_APPROVED && process.env.CRYPTO_UPDATES_REQUIRE_ALERT_EVIDENCE === "1";
const INCLUDE_ALERT_EVIDENCE_LINE =
  ALERT_SURFACE_CHANGE_APPROVED && process.env.CRYPTO_UPDATES_INCLUDE_ALERT_EVIDENCE_LINE === "1";
const REQUIRE_FULL_TA_FOR_TRADE = process.env.CRYPTO_UPDATES_REQUIRE_FULL_TA_FOR_TRADE !== "0";
const INCLUDE_TA_CONTEXT_LINE = process.env.CRYPTO_UPDATES_INCLUDE_TA_CONTEXT_LINE !== "0";
const ALERT_DETAIL_LEVEL = process.env.CRYPTO_UPDATES_ALERT_DETAIL_LEVEL || "compact";
const MIN_FULL_TA_TRADE_SCORE = Number(process.env.CRYPTO_UPDATES_MIN_FULL_TA_TRADE_SCORE || 4);
const ORDERFLOW_CONTEXT_ENABLED = process.env.CRYPTO_UPDATES_ORDERFLOW_CONTEXT_ENABLED !== "0";
const ORDERFLOW_CONTEXT_FILE =
  process.env.CRYPTO_UPDATES_ORDERFLOW_CONTEXT_FILE || "/home/coder/data/features/live.json";
const ORDERFLOW_CONTEXT_FILES = {
  BTC: ORDERFLOW_CONTEXT_FILE,
  ETH: process.env.CRYPTO_UPDATES_ETH_ORDERFLOW_CONTEXT_FILE || "/home/coder/data/features-ethusdt/live.json",
  SOL: process.env.CRYPTO_UPDATES_SOL_ORDERFLOW_CONTEXT_FILE || "/home/coder/data/features-solusdt/live.json",
  HYPE: process.env.CRYPTO_UPDATES_HYPE_ORDERFLOW_CONTEXT_FILE || "/home/coder/data/features-hypeusdt/live.json"
};
const ORDERFLOW_CONTEXT_MAX_AGE_MS = Number(process.env.CRYPTO_UPDATES_ORDERFLOW_CONTEXT_MAX_AGE_MS || 15_000);
const INCLUDE_ORDERFLOW_CONTEXT_LINE =
  ALERT_SURFACE_CHANGE_APPROVED && process.env.CRYPTO_UPDATES_INCLUDE_ORDERFLOW_CONTEXT_LINE === "1";
const ENFORCE_BTC_GATE_FOR_ALT_PLANS = process.env.CRYPTO_UPDATES_ENFORCE_BTC_GATE_FOR_ALT_PLANS === "1";
const LIVE_TEST_MARGIN_USD = Number(process.env.CRYPTO_UPDATES_LIVE_TEST_MARGIN_USD || 1000);
const LIVE_TEST_LEVERAGE = Number(process.env.CRYPTO_UPDATES_LIVE_TEST_LEVERAGE || 10);
const LIVE_TEST_ENTRY_VALID_MINUTES = Number(process.env.CRYPTO_UPDATES_LIVE_TEST_ENTRY_VALID_MINUTES || 2);
const PAPER_TRADING_ENABLED = process.env.CRYPTO_UPDATES_PAPER_TRADING_ENABLED !== "0";
const PAPER_TRADING_FILE =
  process.env.CRYPTO_UPDATES_PAPER_TRADING_FILE ||
  "/home/coder/.openclaw/workspace/crypto-updates/runtime/paper-trades.jsonl";
const PAPER_MAX_OPEN_TRADES = Number(process.env.CRYPTO_UPDATES_PAPER_MAX_OPEN_TRADES || 1);
const PAPER_FEE_BPS_PER_SIDE = Number(process.env.CRYPTO_UPDATES_PAPER_FEE_BPS_PER_SIDE || 5.5);
const PAPER_SEND_MESSAGES = process.env.CRYPTO_UPDATES_PAPER_SEND_MESSAGES !== "0";
const DEMO_SIM_ENABLED = process.env.CRYPTO_UPDATES_DEMO_SIM_ENABLED !== "0";
const DEMO_SIM_FILE =
  process.env.CRYPTO_UPDATES_DEMO_SIM_FILE ||
  "/home/coder/.openclaw/workspace/crypto-updates/runtime/demo-sim-trades.jsonl";
const DEMO_SIM_SEND_MESSAGES = process.env.CRYPTO_UPDATES_DEMO_SIM_SEND_MESSAGES !== "0";
const DEMO_TRADING_ENABLED = process.env.CRYPTO_UPDATES_DEMO_TRADING_ENABLED === "1";
const LIVE_TEST_ASSETS = new Set(["BTC", "ETH"]);
const LIVE_TEST_PLANS = {
  BTC: {
    takeProfitPct: 0.3,
    stopLossPct: 0.5,
    gridLine: "Research scenare jen pro porovnani, ne scale-out: TP 0.25/0.30/0.35%, SL 0.35/0.50/0.75%, exits 30m vs 1h."
  },
  ETH: {
    takeProfitPct: 0.3,
    stopLossPct: 0.5,
    gridLine: "Research scenare jen pro porovnani, ne scale-out: TP 0.30/0.35/0.50%, SL 0.35/0.50/0.75%, exits 30m vs 1h."
  }
};

const CONFIG = {
  BTC: {
    symbol: "btcusdt",
    label: "BTC",
    source: "Binance live trade stream",
    thresholds: [
      { windowMs: 5_000, pct: 0.3, label: "5s", kind: "WICK" },
      { windowMs: 60_000, pct: 0.6, label: "60s" },
      { windowMs: 5 * 60_000, pct: 1.0, label: "5m" },
      { windowMs: 15 * 60_000, pct: 1.25, label: "15m" }
    ],
    cooldownMs: 30 * 60_000
  },
  ETH: {
    symbol: "ethusdt",
    label: "ETH",
    source: "Binance live trade stream",
    thresholds: [
      { windowMs: 5_000, pct: 0.42, label: "5s", kind: "WICK" },
      { windowMs: 60_000, pct: 0.65, label: "60s" },
      { windowMs: 5 * 60_000, pct: 0.9, label: "5m" },
      { windowMs: 15 * 60_000, pct: 1.2, label: "15m" }
    ],
    cooldownMs: 30 * 60_000
  },
  SOL: {
    symbol: "solusdt",
    label: "SOL",
    source: "Binance live trade stream",
    thresholds: [
      { windowMs: 5_000, pct: 0.45, label: "5s", kind: "WICK" },
      { windowMs: 60_000, pct: 0.9, label: "60s" },
      { windowMs: 5 * 60_000, pct: 1.2, label: "5m" },
      { windowMs: 15 * 60_000, pct: 1.65, label: "15m" }
    ],
    cooldownMs: 30 * 60_000
  },
  HYPE: {
    symbol: "hype",
    label: "HYPE",
    source: "Hyperliquid allMids stream",
    thresholds: [
      { windowMs: 5_000, pct: 0.5, label: "5s", kind: "WICK" },
      { windowMs: 60_000, pct: 0.65, label: "60s" },
      { windowMs: 5 * 60_000, pct: 0.95, label: "5m" },
      { windowMs: 15 * 60_000, pct: 1.75, label: "15m" }
    ],
    cooldownMs: 30 * 60_000
  }
};

const MAX_HISTORY_MS = 20 * 60_000;
const ORDERFLOW_WINDOW_MS = 60_000;
const ORDERFLOW_BASELINE_MS = 5 * 60_000;
const BOOK_STALE_MS = 5_000;
const SUPPRESSED_LOG_COOLDOWN_MS = 5 * 60_000;
const TA_CACHE_TTL_MS = Number(process.env.CRYPTO_UPDATES_TA_CACHE_TTL_MS || 90_000);
const TA_CACHE_MAX_ENTRIES = Number(process.env.CRYPTO_UPDATES_TA_CACHE_MAX_ENTRIES || 24);
const REVIEW_WINDOW_MS = 60 * 60_000;
const BINANCE_IDLE_RECONNECT_MS = Number(process.env.CRYPTO_UPDATES_BINANCE_IDLE_RECONNECT_MS || 45_000);
const HYPERLIQUID_IDLE_RECONNECT_MS = Number(process.env.CRYPTO_UPDATES_HYPERLIQUID_IDLE_RECONNECT_MS || 3 * 60_000);
const REVIEW_CHECKPOINTS = [
  { label: "1m", afterMs: 60_000 },
  { label: "5m", afterMs: 5 * 60_000 },
  { label: "15m", afterMs: 15 * 60_000 },
  { label: "30m", afterMs: 30 * 60_000 },
  { label: "1h", afterMs: REVIEW_WINDOW_MS }
];
const ENTRY_RESEARCH_MARKS = [
  { key: "mark1m", label: "~1m price", afterMs: 60_000 },
  { key: "mark5m", label: "~5m price", afterMs: 5 * 60_000 }
];
const history = new Map(Object.values(CONFIG).map((asset) => [asset.symbol, []]));
const volumeHistory = new Map(Object.values(CONFIG).map((asset) => [asset.symbol, []]));
const flowHistory = new Map(Object.values(CONFIG).map((asset) => [asset.symbol, []]));
const bookHistory = new Map(Object.values(CONFIG).map((asset) => [asset.symbol, []]));
const bookState = new Map();
const taContextCache = new Map();
const lastAlert = new Map();
const lastSuppressed = new Map();
const alertInFlight = new Set();
const activeReviews = new Map();
const activePaperTrades = new Map();
const activeDemoSimPositions = new Map();

function nowIso() {
  return new Date().toISOString();
}

function startIdleReconnectWatch(label, ws, getLastMessageAt, maxIdleMs) {
  const timer = setInterval(() => {
    const idleMs = Date.now() - getLastMessageAt();
    if (idleMs <= maxIdleMs) return;
    console.error(`[${nowIso()}] ${label} websocket idle ${idleMs}ms; forcing reconnect`);
    try {
      ws.close();
    } catch {
      // Ignore close errors during reconnect.
    }
  }, Math.min(15_000, Math.max(5_000, Math.floor(maxIdleMs / 3))));
  timer.unref?.();
  return timer;
}

function eventId(asset, direction, eventTime) {
  return `${asset.label}-${direction}-${eventTime}-${Math.random().toString(36).slice(2, 8)}`;
}

function formatUsd(price, assetLabel) {
  return `$${price.toLocaleString("en-US", { maximumFractionDigits: assetLabel === "BTC" ? 0 : 2 })}`;
}

function formatUsdAmount(amount) {
  return `$${amount.toLocaleString("en-US", { maximumFractionDigits: 2 })}`;
}

function formatNumber(value, maximumFractionDigits = 2) {
  return value.toLocaleString("en-US", { maximumFractionDigits });
}

function formatCompactUsdAmount(amount) {
  return `$${Intl.NumberFormat("en-US", {
    notation: "compact",
    maximumFractionDigits: 2
  }).format(amount)}`;
}

function fadeTargetsFromFill(fadeDirection, fillPrice, takeProfitPct, stopLossPct) {
  if (!Number.isFinite(fillPrice)) return null;

  return fadeDirection === "SHORT"
    ? {
        takeProfitPrice: fillPrice * (1 - takeProfitPct / 100),
        stopLossPrice: fillPrice * (1 + stopLossPct / 100)
      }
    : {
        takeProfitPrice: fillPrice * (1 + takeProfitPct / 100),
        stopLossPrice: fillPrice * (1 - stopLossPct / 100)
      };
}

function entryResearchFromPlan(plan) {
  if (!plan?.tradable || !Number.isFinite(plan.noChasePrice) || !Number.isFinite(plan.entryBandLimit)) return null;

  const rangeLow = Math.min(plan.noChasePrice, plan.entryBandLimit);
  const rangeHigh = Math.max(plan.noChasePrice, plan.entryBandLimit);

  return {
    fadeDirection: plan.fadeDirection,
    rangeLow,
    rangeHigh,
    live2m: {
      label: "live 2m",
      validUntilMs: LIVE_TEST_ENTRY_VALID_MINUTES * 60_000,
      status: "waiting",
      firstInRangePrice: null,
      firstInRangeAt: null,
      minPrice: null,
      maxPrice: null
    },
    marks: ENTRY_RESEARCH_MARKS.map((mark) => ({
      ...mark,
      status: "waiting",
      price: null,
      observedAt: null
    }))
  };
}

function fadePlan(assetLabel, direction, alertPrice, ta = null) {
  if (!LIVE_TEST_ASSETS.has(assetLabel)) {
    return {
      tradable: false,
      lines: ["Event-only: neni trading setup; pro SOL/HYPE jen sbiram pohybova data."]
    };
  }

  if (REQUIRE_FULL_TA_FOR_TRADE && !ta?.tradeAllowed) {
    const blockers = ta?.blockers?.length ? ` (${ta.blockers.slice(0, 2).join("; ")})` : "";
    return {
      tradable: false,
      lines: [`Event-only: full TA gate nepustil trade${blockers}.`]
    };
  }

  const notional = LIVE_TEST_MARGIN_USD * LIVE_TEST_LEVERAGE;
  const plan = LIVE_TEST_PLANS[assetLabel] || LIVE_TEST_PLANS.BTC;
  const takeProfitPct = plan.takeProfitPct;
  const stopLossPct = plan.stopLossPct;
  const takeProfitUsd = notional * (takeProfitPct / 100);
  const stopLossUsd = notional * (stopLossPct / 100);
  const fadeDirection = ta?.tradeDirection || (direction === "UP" ? "SHORT" : "LONG");
  const hasAlertPrice = Number.isFinite(alertPrice);
  const entryBandPct = 0.15;
  const entryBandLimit = hasAlertPrice
    ? fadeDirection === "SHORT"
      ? alertPrice * (1 + entryBandPct / 100)
      : alertPrice * (1 - entryBandPct / 100)
    : null;
  const entryRangeLine = hasAlertPrice
    ? fadeDirection === "SHORT"
      ? `Entry valid ${LIVE_TEST_ENTRY_VALID_MINUTES}m: ${formatUsd(alertPrice, assetLabel)}-${formatUsd(
          entryBandLimit,
          assetLabel
        )}`
      : `Entry valid ${LIVE_TEST_ENTRY_VALID_MINUTES}m: ${formatUsd(entryBandLimit, assetLabel)}-${formatUsd(
          alertPrice,
          assetLabel
        )}`
    : null;
  const skipLine = hasAlertPrice
    ? fadeDirection === "SHORT"
      ? `If now below ${formatUsd(alertPrice, assetLabel)}: skip`
      : `If now above ${formatUsd(alertPrice, assetLabel)}: skip`
    : null;
  const recalcLine = hasAlertPrice
    ? fadeDirection === "SHORT"
      ? `If now above ${formatUsd(entryBandLimit, assetLabel)}: recalc`
      : `If now below ${formatUsd(entryBandLimit, assetLabel)}: recalc`
    : null;
  const worstFillPrice = hasAlertPrice ? alertPrice : null;
  const worstFillTargets = fadeTargetsFromFill(fadeDirection, worstFillPrice, takeProfitPct, stopLossPct);
  const takeProfitLine = worstFillTargets ? `TP: ${formatUsd(worstFillTargets.takeProfitPrice, assetLabel)}` : null;
  const stopLossLine = worstFillTargets ? `SL: ${formatUsd(worstFillTargets.stopLossPrice, assetLabel)}` : null;

  return {
    tradable: true,
    fadeDirection,
    marginUsd: LIVE_TEST_MARGIN_USD,
    leverage: LIVE_TEST_LEVERAGE,
    notional,
    takeProfitPct,
    stopLossPct,
    takeProfitUsd,
    stopLossUsd,
    worstFillPrice,
    takeProfitPrice: worstFillTargets?.takeProfitPrice ?? null,
    stopLossPrice: worstFillTargets?.stopLossPrice ?? null,
    noChasePrice: hasAlertPrice ? alertPrice : null,
    entryBandPct,
    entryBandLimit,
    lines: [
      ta?.strategy ? `Strategy: ${ta.strategy} on ${ta.tradeTimeframe}` : null,
      `${fadeDirection} ${formatUsdAmount(LIVE_TEST_MARGIN_USD)} ${LIVE_TEST_LEVERAGE}x`,
      entryRangeLine,
      worstFillPrice !== null ? `Worst fill: ${formatUsd(worstFillPrice, assetLabel)}` : null,
      takeProfitLine,
      stopLossLine,
      "Time exit: close 30m after fill",
      skipLine,
      recalcLine
    ].filter((line) => line !== null)
  };
}

function classifyEntryResearchPrice(entryResearch, price) {
  if (!entryResearch || !Number.isFinite(price)) return null;
  if (price >= entryResearch.rangeLow && price <= entryResearch.rangeHigh) return "in_range";

  if (entryResearch.fadeDirection === "LONG") {
    return price > entryResearch.rangeHigh ? "skip" : "recalc";
  }

  return price < entryResearch.rangeLow ? "skip" : "recalc";
}

function paperDirectionalMovePct(trade, price) {
  if (!trade || !Number.isFinite(price) || !Number.isFinite(trade.entryPrice) || trade.entryPrice <= 0) return 0;
  const raw = pctMove(trade.entryPrice, price);
  return trade.side === "SHORT" ? -raw : raw;
}

function paperPnl(trade, exitPrice) {
  const directionalMovePct = paperDirectionalMovePct(trade, exitPrice);
  const grossPnlUsd = trade.notional * (directionalMovePct / 100);
  const feesUsd = trade.notional * (PAPER_FEE_BPS_PER_SIDE / 10_000) * 2;
  return {
    directionalMovePct,
    grossPnlUsd,
    feesUsd,
    netPnlUsd: grossPnlUsd - feesUsd,
    rMultiple: trade.riskUsd > 0 ? (grossPnlUsd - feesUsd) / trade.riskUsd : null
  };
}

function formatPaperPnl(pnl) {
  return `${pnl.netPnlUsd >= 0 ? "+" : ""}${pnl.netPnlUsd.toFixed(2)} USDT`;
}

function paperExitReason(trade, price, eventTime) {
  if (!trade || !Number.isFinite(price)) return null;
  if (trade.side === "LONG") {
    if (price >= trade.takeProfitPrice) return "TP";
    if (price <= trade.stopLossPrice) return "SL";
  } else {
    if (price <= trade.takeProfitPrice) return "TP";
    if (price >= trade.stopLossPrice) return "SL";
  }
  if (eventTime >= trade.timeExitAt) return "TIME_EXIT";
  return null;
}

async function sendPaperMessage(message) {
  if (!PAPER_SEND_MESSAGES) return null;
  return await sendTelegram(message);
}

async function sendDemoSimMessage(message) {
  if (!DEMO_SIM_SEND_MESSAGES) return null;
  return await sendTelegram(message);
}

function paperOpenMessage(trade) {
  return [
    `PAPER OPEN: ${trade.assetLabel} ${trade.side}`,
    `Entry: ${formatUsd(trade.entryPrice, trade.assetLabel)} | notional ${formatUsdAmount(trade.notional)} (${formatUsdAmount(
      trade.marginUsd
    )} ${trade.leverage}x)`,
    `TP: ${formatUsd(trade.takeProfitPrice, trade.assetLabel)} | SL: ${formatUsd(
      trade.stopLossPrice,
      trade.assetLabel
    )} | time exit 30m`,
    `Source alert: ${trade.alertId} | ${trade.strategy || "strategy n/a"}`
  ].join("\n");
}

function paperCloseMessage(trade, close) {
  const pnl = close.pnl;
  return [
    `PAPER CLOSE: ${trade.assetLabel} ${trade.side} ${close.reason}`,
    `${formatUsd(trade.entryPrice, trade.assetLabel)} -> ${formatUsd(close.exitPrice, trade.assetLabel)} (${
      pnl.directionalMovePct >= 0 ? "+" : ""
    }${pnl.directionalMovePct.toFixed(2)}%)`,
    `PnL net: ${formatPaperPnl(pnl)} | gross ${pnl.grossPnlUsd >= 0 ? "+" : ""}${pnl.grossPnlUsd.toFixed(
      2
    )} | fees ${pnl.feesUsd.toFixed(2)}`,
    `Hold: ${Math.round((close.exitTime - trade.entryTime) / 60_000)}m | source alert ${trade.alertId}`
  ].join("\n");
}

function demoSimOpenMessage(position) {
  return [
    `DEMO-SIM FILL: ${position.assetLabel} ${position.side}`,
    `Market order filled @ ${formatUsd(position.entryPrice, position.assetLabel)} | qty ${formatNumber(position.quantity, 6)}`,
    `Notional ${formatUsdAmount(position.notional)} | margin ${formatUsdAmount(position.marginUsd)} ${position.leverage}x`,
    `Protective orders: TP ${formatUsd(position.takeProfitPrice, position.assetLabel)} | SL ${formatUsd(
      position.stopLossPrice,
      position.assetLabel
    )} | time exit ${position.timeExitAtIso}`,
    `Simulated only, no exchange order was sent.`
  ].join("\n");
}

function demoSimCloseMessage(position, close) {
  const pnl = close.pnl;
  return [
    `DEMO-SIM CLOSE: ${position.assetLabel} ${position.side} ${close.reason}`,
    `${formatUsd(position.entryPrice, position.assetLabel)} -> ${formatUsd(close.exitPrice, position.assetLabel)} (${
      pnl.directionalMovePct >= 0 ? "+" : ""
    }${pnl.directionalMovePct.toFixed(2)}%)`,
    `Net PnL: ${formatPaperPnl(pnl)} | equity ${formatUsdAmount(close.equityAfterUsd)}`,
    `Simulated only, no exchange order was sent.`
  ].join("\n");
}

async function maybeOpenDemoSimPosition(trade, alert) {
  if (!DEMO_SIM_ENABLED || !trade) return;
  if (activeDemoSimPositions.has(trade.id)) return;

  const orderId = `demo-order-${trade.id}`;
  const position = {
    ...trade,
    type: "demo_sim_position_opened",
    orderId,
    paperTradeId: trade.id,
    mode: "demo-sim",
    submittedAt: trade.entryTime,
    submittedAtIso: trade.entryTimeIso,
    fillStatus: "filled",
    protectiveOrders: [
      { id: `${orderId}-tp`, type: "take_profit", triggerPrice: trade.takeProfitPrice, status: "open" },
      { id: `${orderId}-sl`, type: "stop_loss", triggerPrice: trade.stopLossPrice, status: "open" },
      { id: `${orderId}-time`, type: "time_exit", triggerTime: trade.timeExitAt, triggerTimeIso: trade.timeExitAtIso, status: "open" }
    ]
  };

  activeDemoSimPositions.set(trade.id, position);
  appendDemoSim({
    type: "demo_sim_order_submitted",
    orderId,
    paperTradeId: trade.id,
    alertId: alert?.id || trade.alertId,
    assetSymbol: trade.assetSymbol,
    assetLabel: trade.assetLabel,
    side: trade.side,
    orderType: "Market",
    quantity: trade.quantity,
    submittedAt: trade.entryTime,
    submittedAtIso: trade.entryTimeIso,
    source: "ralph-live-watcher-demo-sim"
  });
  appendDemoSim(position);
  appendFeedback({ type: "demo_sim_position_opened", position });
  const sendResult = await sendDemoSimMessage(demoSimOpenMessage(position));
  if (sendResult) appendDemoSim({ type: "demo_sim_open_message", orderId, paperTradeId: trade.id, sendResult });
}

async function closeDemoSimPosition(trade, close) {
  if (!DEMO_SIM_ENABLED || !trade) return;
  const position = activeDemoSimPositions.get(trade.id);
  if (!position) return;

  const closedProtectiveOrders = position.protectiveOrders.map((order) => ({
    ...order,
    status:
      (close.reason === "TP" && order.type === "take_profit") ||
      (close.reason === "SL" && order.type === "stop_loss") ||
      (close.reason === "TIME_EXIT" && order.type === "time_exit")
        ? "triggered"
        : "cancelled"
  }));
  const equityAfterUsd = position.marginUsd + close.pnl.netPnlUsd;
  const demoClose = {
    type: "demo_sim_position_closed",
    orderId: position.orderId,
    paperTradeId: trade.id,
    alertId: trade.alertId,
    assetSymbol: trade.assetSymbol,
    assetLabel: trade.assetLabel,
    side: trade.side,
    entryPrice: trade.entryPrice,
    exitPrice: close.exitPrice,
    entryTime: trade.entryTime,
    exitTime: close.exitTime,
    entryTimeIso: trade.entryTimeIso,
    exitTimeIso: close.exitTimeIso,
    reason: close.reason,
    pnl: close.pnl,
    equityAfterUsd,
    protectiveOrders: closedProtectiveOrders,
    mode: "demo-sim"
  };

  activeDemoSimPositions.delete(trade.id);
  appendDemoSim(demoClose);
  appendFeedback({ type: "demo_sim_position_closed", close: demoClose });
  const sendResult = await sendDemoSimMessage(demoSimCloseMessage(position, demoClose));
  if (sendResult) appendDemoSim({ type: "demo_sim_close_message", orderId: position.orderId, paperTradeId: trade.id, sendResult });
}

async function closePaperTrade(trade, exitPrice, exitTime, reason) {
  if (!activePaperTrades.has(trade.id)) return;
  const close = {
    type: "paper_trade_closed",
    id: trade.id,
    alertId: trade.alertId,
    assetSymbol: trade.assetSymbol,
    assetLabel: trade.assetLabel,
    side: trade.side,
    entryPrice: trade.entryPrice,
    exitPrice,
    entryTime: trade.entryTime,
    exitTime,
    entryTimeIso: new Date(trade.entryTime).toISOString(),
    exitTimeIso: new Date(exitTime).toISOString(),
    reason,
    pnl: paperPnl(trade, exitPrice),
    trade
  };
  activePaperTrades.delete(trade.id);
  appendPaperTrade(close);
  appendFeedback({ type: "paper_trade_closed", close });
  await closeDemoSimPosition(trade, close);
  const sendResult = await sendPaperMessage(paperCloseMessage(trade, close));
  if (sendResult) appendPaperTrade({ type: "paper_trade_close_message", id: trade.id, sendResult });
}

async function updatePaperTrades(symbol, price, eventTime) {
  for (const trade of [...activePaperTrades.values()]) {
    if (trade.assetSymbol !== symbol) continue;
    trade.lastPrice = price;
    trade.lastEventTime = eventTime;
    trade.maxFavorablePct = Math.max(trade.maxFavorablePct, paperDirectionalMovePct(trade, price));
    trade.maxAdversePct = Math.max(trade.maxAdversePct, -paperDirectionalMovePct(trade, price));
    const reason = paperExitReason(trade, price, eventTime);
    if (reason) await closePaperTrade(trade, price, eventTime, reason);
  }
}

async function maybeOpenPaperTrade(alert, fillPrice, fillTime) {
  if (!PAPER_TRADING_ENABLED || !alert?.fadePlan?.tradable || !Number.isFinite(fillPrice)) return;
  if (activePaperTrades.size >= PAPER_MAX_OPEN_TRADES) {
    appendPaperTrade({
      type: "paper_trade_skipped",
      reason: "max_open_trades",
      maxOpenTrades: PAPER_MAX_OPEN_TRADES,
      alertId: alert.id,
      assetSymbol: alert.assetSymbol,
      assetLabel: alert.assetLabel,
      fillPrice,
      fillTime,
      fillTimeIso: new Date(fillTime).toISOString()
    });
    return;
  }

  const entryResearch = entryResearchFromPlan(alert.fadePlan);
  if (classifyEntryResearchPrice(entryResearch, fillPrice) !== "in_range") return;

  const targets = fadeTargetsFromFill(
    alert.fadePlan.fadeDirection,
    fillPrice,
    alert.fadePlan.takeProfitPct,
    alert.fadePlan.stopLossPct
  );
  if (!targets) return;

  const id = `paper-${alert.id}`;
  if (activePaperTrades.has(id)) return;
  const riskUsd = alert.fadePlan.notional * (alert.fadePlan.stopLossPct / 100);
  const trade = {
    id,
    type: "paper_trade_opened",
    alertId: alert.id,
    assetSymbol: alert.assetSymbol,
    assetLabel: alert.assetLabel,
    side: alert.fadePlan.fadeDirection,
    marginUsd: alert.fadePlan.marginUsd,
    leverage: alert.fadePlan.leverage,
    notional: alert.fadePlan.notional,
    quantity: alert.fadePlan.notional / fillPrice,
    entryPrice: fillPrice,
    takeProfitPrice: targets.takeProfitPrice,
    stopLossPrice: targets.stopLossPrice,
    takeProfitPct: alert.fadePlan.takeProfitPct,
    stopLossPct: alert.fadePlan.stopLossPct,
    riskUsd,
    entryTime: fillTime,
    entryTimeIso: new Date(fillTime).toISOString(),
    timeExitAt: fillTime + 30 * 60_000,
    timeExitAtIso: new Date(fillTime + 30 * 60_000).toISOString(),
    strategy: alert.ta?.strategy || null,
    tradeTimeframe: alert.ta?.tradeTimeframe || null,
    score: alert.ta?.score ?? null,
    htfBias: alert.ta?.htfBias || null,
    source: "ralph-live-watcher-paper",
    maxFavorablePct: 0,
    maxAdversePct: 0,
    lastPrice: fillPrice,
    lastEventTime: fillTime
  };

  activePaperTrades.set(id, trade);
  appendPaperTrade(trade);
  appendFeedback({ type: "paper_trade_opened", trade });
  await maybeOpenDemoSimPosition(trade, alert);
  const sendResult = await sendPaperMessage(paperOpenMessage(trade));
  if (sendResult) appendPaperTrade({ type: "paper_trade_open_message", id, sendResult });
}

function appendFeedback(record) {
  try {
    mkdirSync(dirname(FEEDBACK_FILE), { recursive: true });
    appendFileSync(FEEDBACK_FILE, `${JSON.stringify({ recordedAt: nowIso(), ...record })}\n`, "utf8");
    triggerFeedbackIndexRebuild();
  } catch (error) {
    console.error(`[${nowIso()}] feedback append failed`, error);
  }
}

function appendPaperTrade(record) {
  try {
    mkdirSync(dirname(PAPER_TRADING_FILE), { recursive: true });
    appendFileSync(PAPER_TRADING_FILE, `${JSON.stringify({ recordedAt: nowIso(), ...record })}\n`, {
      encoding: "utf8",
      mode: 0o600
    });
  } catch (error) {
    console.error(`[${nowIso()}] paper trade append failed`, error);
  }
}

function appendDemoSim(record) {
  try {
    mkdirSync(dirname(DEMO_SIM_FILE), { recursive: true });
    appendFileSync(DEMO_SIM_FILE, `${JSON.stringify({ recordedAt: nowIso(), ...record })}\n`, {
      encoding: "utf8",
      mode: 0o600
    });
  } catch (error) {
    console.error(`[${nowIso()}] demo sim append failed`, error);
  }
}

function triggerFeedbackIndexRebuild() {
  if (!INDEX_AFTER_FEEDBACK) return;
  try {
    const child = spawn(process.execPath, [INDEXER_SCRIPT], {
      detached: true,
      stdio: "ignore",
      env: { ...process.env, NODE_NO_WARNINGS: "1" }
    });
    child.unref();
  } catch (error) {
    console.error(`[${nowIso()}] feedback index rebuild failed`, error);
  }
  try {
    const child = spawn(process.execPath, [TRADE_JOURNAL_SCRIPT], {
      detached: true,
      stdio: "ignore",
      env: { ...process.env, NODE_NO_WARNINGS: "1" }
    });
    child.unref();
  } catch (error) {
    console.error(`[${nowIso()}] trade journal rebuild failed`, error);
  }
}

function writePidFile() {
  mkdirSync(dirname(PID_FILE), { recursive: true });
  writeFileSync(PID_FILE, `${process.pid}\n`, "utf8");
}

function removePidFile() {
  try {
    const current = readFileSync(PID_FILE, "utf8").trim();
    if (current === String(process.pid)) rmSync(PID_FILE);
  } catch {
    // Ignore missing or stale pid files during shutdown.
  }
}

function prune(points, now) {
  while (points.length && points[0].time < now - MAX_HISTORY_MS) points.shift();
}

function sumFlow(points, since, until) {
  return points.reduce(
    (total, point) => {
      if (point.time < since || point.time > until) return total;
      total.buyNotional += point.buyNotional;
      total.sellNotional += point.sellNotional;
      total.notional += point.buyNotional + point.sellNotional;
      return total;
    },
    { buyNotional: 0, sellNotional: 0, notional: 0 }
  );
}

function sumNotional(points, since, until) {
  return points.reduce((total, point) => {
    if (point.time >= since && point.time <= until) return total + point.notional;
    return total;
  }, 0);
}

function volumeVelocity(symbol, now) {
  const points = volumeHistory.get(symbol) || [];
  if (!points.length) return null;

  const recentWindowMs = 5_000;
  const baselineWindowMs = 5 * 60_000;
  const recent = sumNotional(points, now - recentWindowMs, now);
  const baseline = sumNotional(points, now - baselineWindowMs, now - recentWindowMs);
  const baselineSlots = Math.max(1, (baselineWindowMs - recentWindowMs) / recentWindowMs);
  const averageSlot = baseline / baselineSlots;

  return {
    recent,
    averageSlot,
    ratio: averageSlot > 0 ? recent / averageSlot : null
  };
}

function recordTradeFlow(symbol, eventTime, notional, buyerIsMaker = null) {
  if (!Number.isFinite(notional) || notional <= 0 || buyerIsMaker === null) return;
  const points = flowHistory.get(symbol);
  if (!points) return;
  points.push({
    time: eventTime,
    buyNotional: buyerIsMaker ? 0 : notional,
    sellNotional: buyerIsMaker ? notional : 0
  });
  prune(points, eventTime);
}

function parseDepthSide(rows) {
  return rows
    .map(([price, quantity]) => ({ price: Number(price), quantity: Number(quantity) }))
    .filter((row) => Number.isFinite(row.price) && Number.isFinite(row.quantity) && row.price > 0 && row.quantity > 0);
}

function depthRows(payload, compactKey, verboseKey) {
  if (Array.isArray(payload?.[verboseKey])) return payload[verboseKey];
  if (Array.isArray(payload?.[compactKey])) return payload[compactKey];
  return null;
}

function streamSymbol(payload) {
  const stream = String(payload.stream || "");
  return stream.includes("@") ? stream.split("@")[0].toLowerCase() : "";
}

function binanceDepthPayload(payload, data) {
  const stream = String(payload.stream || "");
  const bids = depthRows(data, "b", "bids");
  const asks = depthRows(data, "a", "asks");
  if (!Array.isArray(bids) || !Array.isArray(asks)) return null;
  if (!data.lastUpdateId && !stream.includes("@depth")) return null;
  return {
    symbol: String(data.s || streamSymbol(payload) || "").toLowerCase(),
    bids,
    asks,
    eventTime: Number(data.E || Date.now())
  };
}

function handleDepth(symbol, bidsRaw, asksRaw, eventTime) {
  const bids = parseDepthSide(bidsRaw || []);
  const asks = parseDepthSide(asksRaw || []);
  if (!bids.length || !asks.length) return;

  const bid = bids[0].price;
  const ask = asks[0].price;
  const mid = (bid + ask) / 2;
  const bidDepthNotional = bids.reduce((total, level) => total + level.price * level.quantity, 0);
  const askDepthNotional = asks.reduce((total, level) => total + level.price * level.quantity, 0);
  const totalDepthNotional = bidDepthNotional + askDepthNotional;
  const imbalance =
    totalDepthNotional > 0 ? (bidDepthNotional - askDepthNotional) / totalDepthNotional : null;
  const spreadPct = mid > 0 ? ((ask - bid) / mid) * 100 : null;
  const state = {
    time: eventTime,
    bid,
    ask,
    mid,
    bidDepthNotional,
    askDepthNotional,
    totalDepthNotional,
    imbalance,
    spreadPct
  };

  bookState.set(symbol, state);
  const points = bookHistory.get(symbol);
  if (points) {
    points.push({ time: eventTime, totalDepthNotional, imbalance, spreadPct });
    prune(points, eventTime);
  }
}

function average(values) {
  const xs = values.filter(Number.isFinite);
  return xs.length ? xs.reduce((a, b) => a + b, 0) / xs.length : null;
}

function bookBaseline(symbol, now) {
  const points = bookHistory.get(symbol) || [];
  const previous = points.filter((point) => point.time >= now - ORDERFLOW_BASELINE_MS && point.time < now - ORDERFLOW_WINDOW_MS);
  return {
    totalDepthNotional: average(previous.map((point) => point.totalDepthNotional)),
    spreadPct: average(previous.map((point) => point.spreadPct)),
    imbalance: average(previous.map((point) => point.imbalance))
  };
}

function formatEvidence(evidence) {
  if (!evidence?.features) return null;
  const f = evidence.features;
  const parts = [];
  if (f.cvdPctOfVolume !== null) parts.push(`CVD ${f.cvdPctOfVolume >= 0 ? "+" : ""}${f.cvdPctOfVolume.toFixed(0)}%`);
  if (f.bookImbalance !== null) parts.push(`book ${f.bookImbalance >= 0 ? "+" : ""}${f.bookImbalance.toFixed(0)}%`);
  if (f.volumeVelocityRatio !== null) parts.push(`vol ${f.volumeVelocityRatio.toFixed(1)}x`);
  if (f.spreadPct !== null) parts.push(`spread ${f.spreadPct.toFixed(3)}%`);
  if (f.depthChangePct !== null) parts.push(`depth ${f.depthChangePct >= 0 ? "+" : ""}${f.depthChangePct.toFixed(0)}%`);
  if (!parts.length) return null;
  return `Evidence gate: ${evidence.pass ? "PASS" : "FAIL"} ${evidence.score}/5 | ${parts.join(" | ")}`;
}

function candleCloseTime(candle) {
  return candle.closeTime ?? candle.openTime ?? candle.time ?? 0;
}

function closedCandles(candles, eventTime) {
  return (candles || []).filter((candle) => candleCloseTime(candle) <= eventTime && Number.isFinite(candle.close));
}

function parseBinanceKline(row) {
  return {
    openTime: Number(row[0]),
    open: Number(row[1]),
    high: Number(row[2]),
    low: Number(row[3]),
    close: Number(row[4]),
    volume: Number(row[5]),
    closeTime: Number(row[6])
  };
}

function parseHyperliquidCandle(row) {
  return {
    openTime: Number(row.t ?? row.T ?? row.time),
    open: Number(row.o),
    high: Number(row.h),
    low: Number(row.l),
    close: Number(row.c),
    volume: Number(row.v ?? 0),
    closeTime: Number(row.T ?? row.t ?? row.time)
  };
}

async function fetchJson(url, options = {}) {
  const controller = new AbortController();
  const timeout = setTimeout(() => controller.abort(), 8_000);
  try {
    const response = await fetch(url, { ...options, signal: controller.signal });
    if (!response.ok) throw new Error(`${response.status} ${response.statusText}`);
    return await response.json();
  } finally {
    clearTimeout(timeout);
  }
}

async function fetchBinanceCandles(symbol, interval, limit) {
  const url = new URL("https://api.binance.com/api/v3/klines");
  url.searchParams.set("symbol", symbol.toUpperCase());
  url.searchParams.set("interval", interval);
  url.searchParams.set("limit", String(limit));
  const rows = await fetchJson(url);
  return rows.map(parseBinanceKline).filter((candle) => Number.isFinite(candle.close));
}

function hyperliquidIntervalMs(interval) {
  const unit = interval.slice(-1);
  const value = Number(interval.slice(0, -1));
  if (!Number.isFinite(value)) return 60_000;
  if (unit === "m") return value * 60_000;
  if (unit === "h") return value * 60 * 60_000;
  if (unit === "d") return value * 24 * 60 * 60_000;
  if (unit === "w") return value * 7 * 24 * 60 * 60_000;
  return 30 * 24 * 60 * 60_000;
}

async function fetchHyperliquidCandles(coin, interval, limit, eventTime) {
  const intervalMs = hyperliquidIntervalMs(interval);
  const endTime = eventTime + intervalMs;
  const startTime = endTime - intervalMs * limit;
  const rows = await fetchJson("https://api.hyperliquid.xyz/info", {
    method: "POST",
    headers: { "content-type": "application/json" },
    body: JSON.stringify({
      type: "candleSnapshot",
      req: { coin: coin.toUpperCase(), interval, startTime, endTime }
    })
  });
  return rows.map(parseHyperliquidCandle).filter((candle) => Number.isFinite(candle.close));
}

async function fetchCandlesForAsset(asset, interval, limit, eventTime) {
  if (asset.source.includes("Binance")) return fetchBinanceCandles(asset.symbol, interval, limit);
  return fetchHyperliquidCandles(asset.label, interval === "1M" ? "1M" : interval, limit, eventTime);
}

function vwap(candles) {
  let pv = 0;
  let volume = 0;
  for (const candle of candles) {
    const v = Number.isFinite(candle.volume) ? candle.volume : 0;
    const typical = (candle.high + candle.low + candle.close) / 3;
    pv += typical * v;
    volume += v;
  }
  return volume > 0 ? pv / volume : null;
}

function volumeProfile(candles, bins = 24) {
  const usable = candles.filter((candle) => Number.isFinite(candle.volume) && candle.volume > 0);
  if (!usable.length) return null;
  const low = Math.min(...usable.map((candle) => candle.low));
  const high = Math.max(...usable.map((candle) => candle.high));
  const width = (high - low) / bins;
  if (!Number.isFinite(width) || width <= 0) return null;
  const bucketVolume = Array.from({ length: bins }, () => 0);
  for (const candle of usable) {
    const price = (candle.high + candle.low + candle.close) / 3;
    const index = Math.min(bins - 1, Math.max(0, Math.floor((price - low) / width)));
    bucketVolume[index] += candle.volume;
  }
  const totalVolume = bucketVolume.reduce((sum, value) => sum + value, 0);
  const pocIndex = bucketVolume.indexOf(Math.max(...bucketVolume));
  const ordered = bucketVolume.map((value, index) => ({ value, index })).sort((a, b) => b.value - a.value);
  let cumulative = 0;
  const valueArea = [];
  for (const bucket of ordered) {
    cumulative += bucket.value;
    valueArea.push(bucket.index);
    if (cumulative >= totalVolume * 0.7) break;
  }
  return {
    poc: low + width * (pocIndex + 0.5),
    val: low + width * Math.min(...valueArea),
    vah: low + width * (Math.max(...valueArea) + 1)
  };
}

function nearestLevel(price, levels) {
  const candidates = levels.filter((level) => Number.isFinite(level.price));
  if (!candidates.length || !Number.isFinite(price)) return null;
  return candidates
    .map((level) => ({ ...level, distancePct: Math.abs(pctMove(price, level.price)) }))
    .sort((a, b) => a.distancePct - b.distancePct)[0];
}

function detectSfp(candles, direction, lookback = 20) {
  const xs = candles.slice(-lookback - 1);
  if (xs.length < lookback + 1) return null;
  const last = xs[xs.length - 1];
  const previous = xs.slice(0, -1);
  const swingHigh = Math.max(...previous.map((candle) => candle.high));
  const swingLow = Math.min(...previous.map((candle) => candle.low));
  if (direction === "UP" && last.high > swingHigh && last.close < swingHigh) {
    return { type: "bearish_sfp", level: swingHigh, supports: "SHORT" };
  }
  if (direction === "DOWN" && last.low < swingLow && last.close > swingLow) {
    return { type: "bullish_sfp", level: swingLow, supports: "LONG" };
  }
  return null;
}

function fibContext(candles, price) {
  const xs = candles.slice(-80);
  if (xs.length < 12 || !Number.isFinite(price)) return null;
  const high = Math.max(...xs.map((candle) => candle.high));
  const low = Math.min(...xs.map((candle) => candle.low));
  const range = high - low;
  if (!Number.isFinite(range) || range <= 0) return null;
  const levels = [0.382, 0.5, 0.618, 0.786].map((ratio) => ({
    name: `fib ${ratio}`,
    price: high - range * ratio
  }));
  const nearest = nearestLevel(price, levels);
  return nearest && nearest.distancePct <= 0.25 ? nearest : null;
}

function trendBias(candles) {
  const xs = candles.slice(-24);
  if (xs.length < 8) return "mixed";
  const first = xs[0].close;
  const last = xs[xs.length - 1].close;
  const move = pctMove(first, last);
  if (move >= 0.35) return "up";
  if (move <= -0.35) return "down";
  return "range";
}

function rsi(candles, period = 14) {
  const closes = candles.map((candle) => candle.close).filter(Number.isFinite);
  if (closes.length < period + 1) return null;
  const xs = closes.slice(-period - 1);
  let gains = 0;
  let losses = 0;
  for (let i = 1; i < xs.length; i += 1) {
    const change = xs[i] - xs[i - 1];
    if (change >= 0) gains += change;
    else losses += Math.abs(change);
  }
  const averageGain = gains / period;
  const averageLoss = losses / period;
  if (averageLoss === 0) return 100;
  const rs = averageGain / averageLoss;
  return 100 - 100 / (1 + rs);
}

function rsiState(value) {
  if (!Number.isFinite(value)) return "n/a";
  if (value >= 75) return "overbought";
  if (value >= 60) return "bullish";
  if (value <= 25) return "oversold";
  if (value <= 40) return "bearish";
  return "neutral";
}

function linearRegressionLine(values) {
  const xs = values.filter(Number.isFinite);
  const n = xs.length;
  if (n < 8) return null;
  const meanX = (n - 1) / 2;
  const meanY = xs.reduce((sum, value) => sum + value, 0) / n;
  let numerator = 0;
  let denominator = 0;
  for (let i = 0; i < n; i += 1) {
    numerator += (i - meanX) * (xs[i] - meanY);
    denominator += (i - meanX) ** 2;
  }
  if (denominator === 0) return null;
  const slope = numerator / denominator;
  const intercept = meanY - slope * meanX;
  return {
    slope,
    current: intercept + slope * (n - 1),
    start: intercept
  };
}

function trendlineContext(candles, price) {
  const xs = candles.slice(-48);
  if (xs.length < 12 || !Number.isFinite(price)) return null;
  const closeLine = linearRegressionLine(xs.map((candle) => candle.close));
  const lowLine = linearRegressionLine(xs.map((candle) => candle.low));
  const highLine = linearRegressionLine(xs.map((candle) => candle.high));
  if (!closeLine) return null;
  const trend =
    closeLine.slope > price * 0.00015 ? "rising" : closeLine.slope < -price * 0.00015 ? "falling" : "flat";
  const dynamicSupport = lowLine?.current ?? null;
  const dynamicResistance = highLine?.current ?? null;
  const supportDistancePct = dynamicSupport ? Math.abs(pctMove(price, dynamicSupport)) : null;
  const resistanceDistancePct = dynamicResistance ? Math.abs(pctMove(price, dynamicResistance)) : null;
  return {
    trend,
    dynamicSupport,
    dynamicResistance,
    supportDistancePct,
    resistanceDistancePct,
    nearSupport: supportDistancePct !== null && supportDistancePct <= 0.25,
    nearResistance: resistanceDistancePct !== null && resistanceDistancePct <= 0.25
  };
}

function rangeBreakContext(candles, direction, lookback = 36) {
  const xs = candles.slice(-lookback - 1);
  if (xs.length < lookback + 1) return null;
  const last = xs[xs.length - 1];
  const previous = xs.slice(0, -1);
  const rangeHigh = Math.max(...previous.map((candle) => candle.high));
  const rangeLow = Math.min(...previous.map((candle) => candle.low));
  if (last.close > rangeHigh) return { type: "breakout_up", level: rangeHigh, supports: "LONG" };
  if (last.close < rangeLow) return { type: "breakout_down", level: rangeLow, supports: "SHORT" };
  if (direction === "UP" && last.high > rangeHigh && last.close <= rangeHigh) {
    return { type: "fakeout_up", level: rangeHigh, supports: "SHORT" };
  }
  if (direction === "DOWN" && last.low < rangeLow && last.close >= rangeLow) {
    return { type: "fakeout_down", level: rangeLow, supports: "LONG" };
  }
  return { type: "inside_range", level: direction === "UP" ? rangeHigh : rangeLow, supports: null };
}

function pickTradeTimeframe(triggered, frames) {
  const h1 = trendBias(frames["1h"] || []);
  const m15 = trendBias(frames["15m"] || []);
  if (triggered.windowMs <= 60_000) return m15 === "range" ? "5m" : "15m";
  if (triggered.windowMs <= 5 * 60_000) return h1 === "range" ? "15m" : "1h";
  return "1h";
}

function classifyTriggerHorizon(triggered) {
  if (!triggered?.windowMs) return "unknown";
  if (triggered.windowMs <= 60_000) return "seconds-to-minutes";
  if (triggered.windowMs <= 15 * 60_000) return "minutes";
  return "intraday";
}

function classifyTradeClass(ta, triggered) {
  if (!ta?.tradeAllowed || !ta.tradeDirection) {
    return {
      key: "no_trade",
      label: "no-trade",
      holdingHorizon: "n/a",
      reason: "Full TA did not produce a clean actionable setup."
    };
  }

  const hasHtfSupport =
    (ta.htfBias === "up" && ta.tradeDirection === "LONG") || (ta.htfBias === "down" && ta.tradeDirection === "SHORT");
  const hasMidStructure = Boolean(ta.breakout?.supports || ta.sfp?.supports || ta.nearestLevel);
  const triggerMs = triggered?.windowMs ?? 0;
  const isFastFade = ta.strategy === "fakeout fade" || ta.strategy === "SFP fade" || ta.strategy === "level reaction scalp";
  const canClassifyLongRunning =
    hasHtfSupport &&
    ta.score >= MIN_FULL_TA_TRADE_SCORE + 2 &&
    triggerMs > 15 * 60_000 &&
    !isFastFade;

  if (canClassifyLongRunning) {
    return {
      key: "long_running",
      label: "long-running",
      holdingHorizon: "8h to multi-day/weeks",
      reason: "HTF bias and confluence support holding beyond the trigger."
    };
  }

  if (isFastFade) {
    return {
      key: "scalp",
      label: "scalp",
      holdingHorizon: "seconds to 30m",
      reason: "Fade plan uses tight TP/SL and the 30m paper time exit."
    };
  }

  if (hasMidStructure && triggered?.windowMs > 60_000) {
    return {
      key: "medium",
      label: "medium",
      holdingHorizon: "30m to 8h",
      reason: "Mid-TF structure agrees with the selected side."
    };
  }

  return {
    key: "fast",
    label: "fast",
    holdingHorizon: "seconds to 30m",
    reason: "Setup is mainly an LTF trigger with tight invalidation."
  };
}

function invalidationForTradeDirection({ tradeDirection, price, sfp, breakout, nearestLevels, assetLabel }) {
  if (!tradeDirection || !Number.isFinite(price)) return null;

  const candidates = [];
  const addCandidate = (name, value) => {
    if (Number.isFinite(value)) candidates.push({ name, price: value });
  };

  addCandidate(sfp?.type || "SFP", sfp?.level);
  addCandidate(breakout?.type || "range", breakout?.level);
  for (const level of nearestLevels || []) addCandidate(level.name, level.price);

  const directional = candidates
    .filter((level) => (tradeDirection === "LONG" ? level.price < price : level.price > price))
    .sort((a, b) => (tradeDirection === "LONG" ? b.price - a.price : a.price - b.price));

  const selected = directional[0];
  if (!selected) return null;

  const side = tradeDirection === "LONG" ? "below" : "above";
  return `setup invalid/no-trade on acceptance ${side} ${formatUsd(selected.price, assetLabel)} (${selected.name})`;
}

function deliveryClassForTa(ta) {
  if (!ta) return "research_event";
  if (ta.tradeAllowed) return "actionable_alert";
  const exceptional = ta.score >= MIN_FULL_TA_TRADE_SCORE && (ta.reasons?.length || 0) >= 2;
  return exceptional ? "exceptional_research_sample" : "research_event";
}

function formatTaLine(ta) {
  if (!ta) return "TA: unavailable -> event-only";
  const status = ta.tradeAllowed ? "TRADE" : "EVENT";
  const parts = [
    `TA ${status}`,
    `tf ${ta.tradeTimeframe}`,
    ta.strategy,
    ta.nearestLevel ? `near ${ta.nearestLevel.name} ${ta.nearestLevel.distancePct.toFixed(2)}%` : null,
    ta.sfp ? ta.sfp.type.replace("_", " ") : null,
    ta.fib ? `${ta.fib.name} ${ta.fib.distancePct.toFixed(2)}%` : null,
    ta.htfBias ? `HTF ${ta.htfBias}` : null
  ].filter(Boolean);
  return parts.join(" | ");
}

function formatPriceMaybe(price, assetLabel) {
  return Number.isFinite(price) ? formatUsd(price, assetLabel) : "n/a";
}

function formatSignedPct(value, digits = 0) {
  if (!Number.isFinite(value)) return "n/a";
  return `${value >= 0 ? "+" : ""}${value.toFixed(digits)}%`;
}

function readOrderflowContext(assetLabel = "BTC", observedAt = Date.now()) {
  if (!ORDERFLOW_CONTEXT_ENABLED) return { available: false, enabled: false, blockers: ["orderflow context disabled"] };
  const label = String(assetLabel || "BTC").toUpperCase();
  const path = ORDERFLOW_CONTEXT_FILES[label] || "";
  if (!path) {
    return {
      available: false,
      enabled: true,
      assetLabel: label,
      source: "ralph-collector live.json",
      path,
      blockers: [`orderflow context path unavailable for ${label}`]
    };
  }

  let parsed;
  try {
    parsed = JSON.parse(readFileSync(path, "utf8"));
  } catch (error) {
    return {
      available: false,
      enabled: true,
      assetLabel: label,
      source: "ralph-collector live.json",
      path,
      blockers: [`orderflow read failed: ${error.message}`]
    };
  }

  const status = parsed?.status || {};
  const generated = Number(parsed?.generated);
  const ageMs = Number.isFinite(generated) ? Math.max(0, observedAt - generated) : null;
  const stale = ageMs === null || ageMs > ORDERFLOW_CONTEXT_MAX_AGE_MS;
  const bar = status.bar || null;
  const session = status.session || null;
  const book = status.book || null;
  const mark = status.mark || null;
  const events = Array.isArray(parsed?.events) ? parsed.events.slice(-8) : [];

  return {
    available: !stale && Number.isFinite(status.last_price),
    enabled: true,
    assetLabel: label,
    stale,
    source: "ralph-collector live.json",
    path,
    generated,
    generatedIso: Number.isFinite(generated) ? new Date(generated).toISOString() : null,
    ageMs,
    maxAgeMs: ORDERFLOW_CONTEXT_MAX_AGE_MS,
    symbol: `${label}USDT`,
    timeframeSeconds: Number(parsed?.tf) || null,
    features: {
      lastPrice: Number(status.last_price),
      velocity: Number.isFinite(status.velocity) ? status.velocity : null,
      markPrice: Number.isFinite(mark?.mark) ? Number(mark.mark) : null,
      indexPrice: Number.isFinite(mark?.index) ? Number(mark.index) : null,
      oi: Number.isFinite(status.oi) ? Number(status.oi) : null,
      sessionOpen: Number.isFinite(session?.open) ? Number(session.open) : null,
      sessionHigh: Number.isFinite(session?.high) ? Number(session.high) : null,
      sessionLow: Number.isFinite(session?.low) ? Number(session.low) : null,
      sessionVolume: Number.isFinite(session?.volume) ? Number(session.volume) : null,
      sessionCvd: Number.isFinite(session?.cvd) ? Number(session.cvd) : null,
      sessionVwap: Number.isFinite(session?.vwap) ? Number(session.vwap) : null,
      sessionPoc: Number.isFinite(session?.poc) ? Number(session.poc) : null,
      sessionVah: Number.isFinite(session?.vah) ? Number(session.vah) : null,
      sessionVal: Number.isFinite(session?.val) ? Number(session.val) : null,
      barOpen: Number.isFinite(bar?.open) ? Number(bar.open) : null,
      barHigh: Number.isFinite(bar?.high) ? Number(bar.high) : null,
      barLow: Number.isFinite(bar?.low) ? Number(bar.low) : null,
      barClose: Number.isFinite(bar?.close) ? Number(bar.close) : null,
      barVolume: Number.isFinite(bar?.volume) ? Number(bar.volume) : null,
      barBought: Number.isFinite(bar?.bought) ? Number(bar.bought) : null,
      barSold: Number.isFinite(bar?.sold) ? Number(bar.sold) : null,
      barDelta: Number.isFinite(bar?.delta) ? Number(bar.delta) : null,
      barVelMax: Number.isFinite(bar?.vel_max) ? Number(bar.vel_max) : null,
      bookBestBid: Number.isFinite(book?.best_bid) ? Number(book.best_bid) : null,
      bookBestAsk: Number.isFinite(book?.best_ask) ? Number(book.best_ask) : null,
      bookBidDepth: Number.isFinite(book?.bid_depth) ? Number(book.bid_depth) : null,
      bookAskDepth: Number.isFinite(book?.ask_depth) ? Number(book.ask_depth) : null,
      bookImbalance: Number.isFinite(book?.imbalance) ? Number(book.imbalance) : null,
      liquidationLong5m: Number.isFinite(status.liq_5m?.long) ? Number(status.liq_5m.long) : null,
      liquidationShort5m: Number.isFinite(status.liq_5m?.short) ? Number(status.liq_5m.short) : null,
      liquidationCount5m: Number.isFinite(status.liq_5m?.count) ? Number(status.liq_5m.count) : null
    },
    recentEvents: events,
    blockers: stale ? [`orderflow stale ${ageMs ?? "unknown"}ms > ${ORDERFLOW_CONTEXT_MAX_AGE_MS}ms`] : []
  };
}

function nearPct(price, level, maxPct) {
  if (!Number.isFinite(price) || !Number.isFinite(level)) return false;
  return Math.abs(pctMove(price, level)) <= maxPct;
}

function classifyBtcOrderflowGate(orderflowContext, tradeDirection, assetLabel) {
  if (!orderflowContext?.available) {
    return {
      regime: "BTC_STALE",
      pass: assetLabel === "BTC",
      reason: orderflowContext?.blockers?.[0] || "BTC orderflow context unavailable",
      score: 0
    };
  }

  const f = orderflowContext.features || {};
  const price = f.lastPrice;
  const positive = [];
  const negative = [];
  if (Number.isFinite(f.sessionVwap)) (price >= f.sessionVwap ? positive : negative).push("session VWAP");
  if (Number.isFinite(f.sessionPoc)) (price >= f.sessionPoc ? positive : negative).push("session POC");
  if (Number.isFinite(f.sessionCvd)) (f.sessionCvd >= 0 ? positive : negative).push("session CVD");
  if (Number.isFinite(f.barDelta)) (f.barDelta >= 0 ? positive : negative).push("current bar delta");
  if (Number.isFinite(f.bookImbalance)) (f.bookImbalance >= 0 ? positive : negative).push("book imbalance");
  if (Number.isFinite(f.sessionVah) && price > f.sessionVah) positive.push("above VAH");
  if (Number.isFinite(f.sessionVal) && price < f.sessionVal) negative.push("below VAL");

  const score = positive.length - negative.length;
  const nearProfileEdge =
    nearPct(price, f.sessionVah, 0.08) || nearPct(price, f.sessionVal, 0.08) || nearPct(price, f.sessionPoc, 0.05);
  const regime =
    score >= 2 && !nearProfileEdge ? "BTC_RISK_ON" : score <= -2 && !nearProfileEdge ? "BTC_RISK_OFF" : "BTC_TRANSITION";
  const reason = [
    `${formatPriceMaybe(price, "BTC")}`,
    positive.length ? `bull ${positive.slice(0, 3).join("/")}` : null,
    negative.length ? `bear ${negative.slice(0, 3).join("/")}` : null,
    nearProfileEdge ? "near profile edge" : null
  ]
    .filter(Boolean)
    .join("; ");

  let pass = true;
  if (assetLabel !== "BTC" && tradeDirection === "LONG") pass = regime === "BTC_RISK_ON";
  if (assetLabel !== "BTC" && tradeDirection === "SHORT") pass = regime === "BTC_RISK_OFF";

  return { regime, pass, reason, score, positive, negative, nearProfileEdge };
}

function formatOrderflowContextLine(orderflowContext, btcGate) {
  if (!INCLUDE_ORDERFLOW_CONTEXT_LINE) return null;
  if (!orderflowContext?.available) return `BTC orderflow: ${btcGate?.regime || "BTC_STALE"} | ${btcGate?.reason || "unavailable"}`;
  const f = orderflowContext.features || {};
  return `BTC orderflow: ${btcGate.regime} | ${formatPriceMaybe(f.lastPrice, "BTC")} | vel ${
    Number.isFinite(f.velocity) ? f.velocity.toFixed(1) : "n/a"
  }x | CVD ${Number.isFinite(f.sessionCvd) ? f.sessionCvd.toFixed(1) : "n/a"} | delta ${
    Number.isFinite(f.barDelta) ? f.barDelta.toFixed(1) : "n/a"
  }`;
}

function formatTaContextLines(asset, ta, evidence) {
  if (!ta) return ["TA: unavailable -> event-only"];

  const f = evidence?.features || {};
  const nearestLevels = (ta.nearestLevels || [])
    .slice(0, 5)
    .map((level) => `${level.name} ${formatPriceMaybe(level.price, asset.label)} (${level.distancePct.toFixed(2)}%)`);
  const vwapParts = [
    ta.context?.dailyVwap ? `day ${formatPriceMaybe(ta.context.dailyVwap, asset.label)}` : null,
    ta.context?.weeklyVwap ? `week ${formatPriceMaybe(ta.context.weeklyVwap, asset.label)}` : null
  ].filter(Boolean);
  const profileParts = ta.context?.profile
    ? [
        `nPOC ${formatPriceMaybe(ta.context.profile.poc, asset.label)}`,
        `VAH ${formatPriceMaybe(ta.context.profile.vah, asset.label)}`,
        `VAL ${formatPriceMaybe(ta.context.profile.val, asset.label)}`
      ]
    : [];
  const patternParts = [
    ta.sfp ? `${ta.sfp.type.replaceAll("_", " ")} @ ${formatPriceMaybe(ta.sfp.level, asset.label)}` : "SFP none",
    ta.fib ? `${ta.fib.name} @ ${formatPriceMaybe(ta.fib.price, asset.label)} (${ta.fib.distancePct.toFixed(2)}%)` : "fib none",
    ta.breakout ? `${ta.breakout.type.replaceAll("_", " ")} @ ${formatPriceMaybe(ta.breakout.level, asset.label)}` : "range n/a"
  ];
  const rsiParts = Object.entries(ta.context?.rsi || {})
    .map(([tf, value]) => `${tf} ${Number.isFinite(value) ? value.toFixed(0) : "n/a"} ${rsiState(value)}`)
    .slice(0, 4);
  const trendline = ta.context?.trendline;
  const trendlineLine = trendline
    ? `Trendline: ${trendline.trend} | sup ${formatPriceMaybe(trendline.dynamicSupport, asset.label)} (${formatSignedPct(
        trendline.supportDistancePct,
        2
      )}) | res ${formatPriceMaybe(trendline.dynamicResistance, asset.label)} (${formatSignedPct(
        trendline.resistanceDistancePct,
        2
      )})`
    : "Trendline: unavailable";
  const flowParts = [
    f.volumeVelocityRatio != null ? `vol ${f.volumeVelocityRatio.toFixed(1)}x` : "vol n/a",
    f.cvdPctOfVolume != null ? `CVD ${formatSignedPct(f.cvdPctOfVolume)}` : "CVD n/a",
    f.bookImbalance != null ? `book ${formatSignedPct(f.bookImbalance)}` : "book n/a",
    f.spreadPct != null ? `spread ${f.spreadPct.toFixed(3)}%` : "spread n/a"
  ];

  return [
    `RALPH: ${ta.tradeAllowed ? "high-probability candidate" : "not high-probability yet"}`,
    `TA: ${ta.tradeAllowed ? "TRADE" : "EVENT"} | tf ${ta.tradeTimeframe} | ${ta.strategy}`,
    `Class: ${ta.tradeClass?.label || "n/a"} | trigger ${ta.entryTriggerHorizon || "n/a"} | hold ${
      ta.tradeClass?.holdingHorizon || "n/a"
    }`,
    `Delivery: ${ta.deliveryClass || "research_event"}`,
    ta.btcGate ? `BTC gate: ${ta.btcGate.regime} | ${ta.btcGate.pass ? "pass" : "block"} | ${ta.btcGate.reason}` : null,
    `HTF: ${ta.htfBias || "mixed"} | invalidation: ${ta.invalidation || "n/a"}`,
    nearestLevels.length ? `Levels: ${nearestLevels.join(" | ")}` : "Levels: unavailable",
    vwapParts.length ? `VWAP: ${vwapParts.join(" | ")}` : "VWAP: unavailable",
    profileParts.length ? `Profile: ${profileParts.join(" | ")}` : "Profile: unavailable",
    `Pattern: ${patternParts.join(" | ")}`,
    trendlineLine,
    rsiParts.length ? `RSI: ${rsiParts.join(" | ")}` : "RSI: unavailable",
    `Flow: ${flowParts.join(" | ")}`,
    `Confluence: ${ta.confluenceLabel || "n/a"} (${ta.score}, min ${MIN_FULL_TA_TRADE_SCORE})`,
    ta.reasons?.length ? `Why: ${ta.reasons.slice(0, 3).join("; ")}` : null,
    ta.blockers?.length ? `Blockers: ${ta.blockers.slice(0, 4).join("; ")}` : null
  ].filter((line) => line !== null);
}

function formatCompactTaContextLines(asset, ta) {
  if (!ta) return ["RALPH: no-trade | TA unavailable | details logged"];

  const nearestLevels = (ta.nearestLevels || [])
    .slice(0, 3)
    .map((level) => `${level.name} ${formatPriceMaybe(level.price, asset.label)} (${level.distancePct.toFixed(2)}%)`);
  const blockers = ta.blockers?.length ? ta.blockers.slice(0, 2).join("; ") : null;
  const reasons = ta.reasons?.length ? ta.reasons.slice(0, 2).join("; ") : null;
  const status = ta.tradeAllowed ? "candidate" : "no-trade";

  return [
    `RALPH: ${status} | ${ta.tradeTimeframe || "tf n/a"} ${ta.strategy || "setup n/a"} | score ${ta.score}/${MIN_FULL_TA_TRADE_SCORE} | HTF ${ta.htfBias || "mixed"}`,
    INCLUDE_ORDERFLOW_CONTEXT_LINE && ta.btcGate
      ? `BTC gate: ${ta.btcGate.regime} | ${ta.btcGate.pass ? "pass" : "block"}`
      : null,
    nearestLevels.length ? `Levels: ${nearestLevels.join(" | ")}` : null,
    blockers ? `Blockers: ${blockers}` : reasons ? `Why: ${reasons}` : null,
    "Full TA logged locally."
  ].filter((line) => line !== null);
}

function formatCompactPlanLines(plan, assetLabel) {
  if (!plan?.tradable) return ["Plan: event-only; no trade alert."];

  const entryRange =
    Number.isFinite(plan.noChasePrice) && Number.isFinite(plan.entryBandLimit)
      ? `${formatUsd(Math.min(plan.noChasePrice, plan.entryBandLimit), assetLabel)}-${formatUsd(
          Math.max(plan.noChasePrice, plan.entryBandLimit),
          assetLabel
        )}`
      : "n/a";

  return [
    `Plan: ${plan.fadeDirection} ${formatUsdAmount(plan.marginUsd)} ${plan.leverage}x | entry ${entryRange}`,
    `Risk: TP ${formatPriceMaybe(plan.takeProfitPrice, assetLabel)} | SL ${formatPriceMaybe(plan.stopLossPrice, assetLabel)} | time exit 30m`
  ];
}

function analyzeTaContext(asset, direction, price, eventTime, frames, evidence, triggered, orderflowContext = null) {
  const levels = [];
  const addPriorLevels = (frameName, candles) => {
    const xs = closedCandles(candles, eventTime);
    if (xs.length < 2) return;
    const prior = xs[xs.length - 2];
    levels.push({ name: `${frameName}H`, price: prior.high });
    levels.push({ name: `${frameName}L`, price: prior.low });
    levels.push({ name: `${frameName}C`, price: prior.close });
  };

  addPriorLevels("M", frames["1M"]);
  addPriorLevels("W", frames["1w"]);
  addPriorLevels("D", frames["1d"]);

  const intraday = closedCandles(frames["5m"], eventTime).slice(-288);
  const weekly = closedCandles(frames["1h"], eventTime).slice(-168);
  const dailyVwap = vwap(intraday);
  const weeklyVwap = vwap(weekly);
  if (dailyVwap) levels.push({ name: "day VWAP", price: dailyVwap });
  if (weeklyVwap) levels.push({ name: "week VWAP", price: weeklyVwap });

  const profile = volumeProfile(intraday);
  if (profile) {
    levels.push({ name: "nPOC", price: profile.poc });
    levels.push({ name: "VAH", price: profile.vah });
    levels.push({ name: "VAL", price: profile.val });
  }

  const nearest = nearestLevel(price, levels);
  const nearestLevels = levels
    .filter((level) => Number.isFinite(level.price))
    .map((level) => ({ ...level, distancePct: Math.abs(pctMove(price, level.price)) }))
    .sort((a, b) => a.distancePct - b.distancePct);
  const sfp = detectSfp(closedCandles(frames["5m"], eventTime), direction) || detectSfp(closedCandles(frames["15m"], eventTime), direction);
  const fib = fibContext(closedCandles(frames["1h"], eventTime), price) || fibContext(closedCandles(frames["4h"], eventTime), price);
  const htfBias = trendBias(closedCandles(frames["4h"], eventTime).slice(-30));
  const tradeTimeframe = pickTradeTimeframe(triggered, frames);
  const breakout =
    rangeBreakContext(closedCandles(frames["15m"], eventTime), direction) ||
    rangeBreakContext(closedCandles(frames["5m"], eventTime), direction);
  const trendline =
    trendlineContext(closedCandles(frames["1h"], eventTime), price) ||
    trendlineContext(closedCandles(frames["15m"], eventTime), price);
  const rsiByFrame = {
    "5m": rsi(closedCandles(frames["5m"], eventTime)),
    "15m": rsi(closedCandles(frames["15m"], eventTime)),
    "1h": rsi(closedCandles(frames["1h"], eventTime)),
    "4h": rsi(closedCandles(frames["4h"], eventTime))
  };

  const detectorSide = direction === "UP" ? "LONG" : "SHORT";
  const fadeSide = direction === "UP" ? "SHORT" : "LONG";
  const flow = evidence?.features?.cvdPctOfVolume;
  const flowAlignedWithDetector =
    flow === null || flow === undefined ? false : direction === "UP" ? flow > 12 : flow < -12;
  const flowOpposesDetector =
    flow === null || flow === undefined ? false : direction === "UP" ? flow < -18 : flow > 18;
  const nearStrongLevel = nearest && nearest.distancePct <= 0.2;
  const reasons = [];
  const blockers = [];

  let strategy = "no-trade";
  let tradeDirection = null;
  let score = 0;

  if (sfp) {
    strategy = "SFP fade";
    tradeDirection = sfp.supports;
    score += 3;
    reasons.push(`${sfp.type} at ${formatUsd(sfp.level, asset.label)}`);
  }

  if (breakout?.type?.startsWith("fakeout")) {
    strategy = "fakeout fade";
    tradeDirection = breakout.supports;
    score += 2;
    reasons.push(`${breakout.type} at ${formatUsd(breakout.level, asset.label)}`);
  } else if (!tradeDirection && breakout?.type?.startsWith("breakout") && flowAlignedWithDetector) {
    strategy = "breakout continuation";
    tradeDirection = breakout.supports;
    score += 2;
    reasons.push(`${breakout.type} confirmed by flow`);
  }

  if (nearStrongLevel) {
    score += 1;
    reasons.push(`reaction level ${nearest.name}`);
  }

  if (fib) {
    score += 1;
    reasons.push(`fib confluence ${fib.name}`);
  }

  if (trendline?.nearSupport && (tradeDirection === "LONG" || !tradeDirection)) {
    score += 1;
    reasons.push("near dynamic support");
  }

  if (trendline?.nearResistance && (tradeDirection === "SHORT" || !tradeDirection)) {
    score += 1;
    reasons.push("near dynamic resistance");
  }

  const tradeFrameRsi = rsiByFrame[tradeTimeframe] ?? rsiByFrame["15m"];
  if (Number.isFinite(tradeFrameRsi)) {
    if (tradeDirection === "LONG" && tradeFrameRsi <= 40) {
      score += 1;
      reasons.push(`RSI ${tradeFrameRsi.toFixed(0)} supports long reaction`);
    } else if (tradeDirection === "SHORT" && tradeFrameRsi >= 60) {
      score += 1;
      reasons.push(`RSI ${tradeFrameRsi.toFixed(0)} supports short reaction`);
    } else if ((tradeDirection === "LONG" && tradeFrameRsi >= 75) || (tradeDirection === "SHORT" && tradeFrameRsi <= 25)) {
      blockers.push(`RSI ${tradeFrameRsi.toFixed(0)} against selected side`);
    }
  }

  if (!tradeDirection && flowAlignedWithDetector && (htfBias === "up" || htfBias === "down")) {
    strategy = "momentum continuation";
    tradeDirection = detectorSide;
    score += 2;
    reasons.push("flow aligned with detector");
    if ((htfBias === "up" && detectorSide === "LONG") || (htfBias === "down" && detectorSide === "SHORT")) score += 1;
  }

  if (!tradeDirection && flowOpposesDetector && nearStrongLevel) {
    strategy = "level rejection fade";
    tradeDirection = fadeSide;
    score += 2;
    reasons.push("flow rejection at level");
  }

  if (!tradeDirection && nearStrongLevel) {
    strategy = "level reaction scalp";
    tradeDirection = fadeSide;
    score += 1;
  }

  if (!nearStrongLevel && !sfp) blockers.push("no nearby HTF/VWAP/profile level");
  if (!sfp && !flowAlignedWithDetector && !flowOpposesDetector) blockers.push("no SFP or useful orderflow confirmation");
  if (!breakout || breakout.type === "inside_range") blockers.push("no breakout/fakeout structure");
  if (!trendline) blockers.push("trendline context unavailable");
  if (!dailyVwap || !profile) blockers.push("incomplete VWAP/profile context");

  const btcGate = classifyBtcOrderflowGate(orderflowContext, tradeDirection, asset.label);
  btcGate.enforced = ENFORCE_BTC_GATE_FOR_ALT_PLANS;
  btcGate.wouldBlock = asset.label !== "BTC" && Boolean(tradeDirection) && !btcGate.pass;
  if (ENFORCE_BTC_GATE_FOR_ALT_PLANS && btcGate.wouldBlock) {
    blockers.push(`BTC gate ${btcGate.regime} blocks ${tradeDirection}`);
  }

  if (score < MIN_FULL_TA_TRADE_SCORE) blockers.push(`confluence score below ${MIN_FULL_TA_TRADE_SCORE}`);

  const tradeAllowed =
    !REQUIRE_FULL_TA_FOR_TRADE || (score >= MIN_FULL_TA_TRADE_SCORE && tradeDirection !== null && blockers.length === 0);
  const confluenceLabel = score >= 6 ? "high" : score >= 4 ? "medium" : score >= 2 ? "low" : "none";
  const invalidation = invalidationForTradeDirection({
    tradeDirection,
    price,
    sfp,
    breakout,
    nearestLevels,
    assetLabel: asset.label
  });
  const baseTa = {
    available: true,
    tradeAllowed,
    score,
    strategy,
    tradeDirection,
    tradeTimeframe,
    htfBias,
    nearestLevel: nearest,
    nearestLevels,
    sfp,
    fib,
    breakout,
    invalidation,
    btcGate,
    orderflowContext,
    confluenceLabel,
    context: {
      dailyVwap,
      weeklyVwap,
      profile,
      trendline,
      rsi: rsiByFrame
    },
    reasons,
    blockers,
    levels: levels.slice(0, 12)
  };
  const tradeClass = classifyTradeClass(baseTa, triggered);
  return {
    ...baseTa,
    tradeClass,
    entryTriggerHorizon: classifyTriggerHorizon(triggered),
    holdingHorizon: tradeClass.holdingHorizon,
    deliveryClass: deliveryClassForTa(baseTa)
  };
}

async function fullTaGate(asset, direction, price, eventTime, triggered, evidence, orderflowContext = null) {
  const cacheKey = `${asset.symbol}:${Math.floor(eventTime / TA_CACHE_TTL_MS)}`;
  const cached = taContextCache.get(cacheKey);
  if (cached) return analyzeTaContext(asset, direction, price, eventTime, cached.frames, evidence, triggered, orderflowContext);

  try {
    const frameSpecs = [
      ["5m", 320],
      ["15m", 160],
      ["1h", 180],
      ["4h", 120],
      ["1d", 90],
      ["1w", 30],
      ["1M", 12]
    ];
    const entries = await Promise.all(
      frameSpecs.map(async ([interval, limit]) => [interval, await fetchCandlesForAsset(asset, interval, limit, eventTime)])
    );
    const frames = Object.fromEntries(entries);
    setTaContextCache(cacheKey, frames, eventTime);
    return analyzeTaContext(asset, direction, price, eventTime, frames, evidence, triggered, orderflowContext);
  } catch (error) {
    const btcGate = classifyBtcOrderflowGate(orderflowContext, null, asset.label);
    return {
      available: false,
      tradeAllowed: false,
      score: 0,
      strategy: "ta-unavailable",
      tradeDirection: null,
      tradeTimeframe: triggered.label,
      htfBias: null,
      nearestLevel: null,
      nearestLevels: [],
      sfp: null,
      fib: null,
      breakout: null,
      invalidation: null,
      confluenceLabel: "none",
      context: {
        dailyVwap: null,
        weeklyVwap: null,
        profile: null,
        trendline: null,
        rsi: {}
      },
      reasons: [],
      blockers: [`TA fetch failed: ${error.message}`],
      levels: [],
      btcGate,
      orderflowContext,
      tradeClass: {
        key: "no_trade",
        label: "no-trade",
        holdingHorizon: "n/a",
        reason: "TA fetch failed."
      },
      entryTriggerHorizon: classifyTriggerHorizon(triggered),
      holdingHorizon: "n/a",
      deliveryClass: "research_event"
    };
  }
}

function setTaContextCache(cacheKey, frames, eventTime) {
  taContextCache.set(cacheKey, {
    frames,
    eventTime,
    cachedAt: Date.now()
  });
  pruneTaContextCache(eventTime);
}

function pruneTaContextCache(eventTime) {
  const minEventTime = eventTime - Math.max(TA_CACHE_TTL_MS * 4, 10 * 60_000);
  for (const [key, value] of taContextCache.entries()) {
    if (value.eventTime < minEventTime) taContextCache.delete(key);
  }
  while (taContextCache.size > TA_CACHE_MAX_ENTRIES) {
    const oldestKey = taContextCache.keys().next().value;
    if (oldestKey === undefined) break;
    taContextCache.delete(oldestKey);
  }
}

function evidenceGate(asset, direction, eventTime, volume, observedAt = Date.now()) {
  const flow = sumFlow(flowHistory.get(asset.symbol) || [], eventTime - ORDERFLOW_WINDOW_MS, eventTime);
  const cvd = flow.buyNotional - flow.sellNotional;
  const cvdPctOfVolume = flow.notional > 0 ? (cvd / flow.notional) * 100 : null;
  const book = bookState.get(asset.symbol) || null;
  const bookAgeMs = book ? Math.max(0, observedAt - book.time) : null;
  const bookFresh = bookAgeMs !== null && bookAgeMs <= BOOK_STALE_MS;
  const baseline = bookBaseline(asset.symbol, observedAt);
  const depthChangePct =
    bookFresh && baseline.totalDepthNotional
      ? ((book.totalDepthNotional - baseline.totalDepthNotional) / baseline.totalDepthNotional) * 100
      : null;
  const bookImbalance = bookFresh && Number.isFinite(book.imbalance) ? book.imbalance * 100 : null;
  const spreadPct = bookFresh && Number.isFinite(book.spreadPct) ? book.spreadPct : null;

  const reasons = [];
  const blockers = [];
  let score = 0;
  let hasDirectionalEvidence = false;
  const expectedSign = direction === "UP" ? 1 : -1;

  if (volume?.ratio != null && volume.recent >= 1) {
    if (volume.ratio >= 8) {
      score += 2;
      reasons.push("large aggressive-volume burst");
    } else if (volume.ratio >= 3) {
      score += 1;
      reasons.push("volume burst");
    }
  }

  if (flow.notional >= 10_000 && cvdPctOfVolume !== null) {
    const signedCvd = cvdPctOfVolume * expectedSign;
    if (signedCvd >= 25) {
      score += 2;
      hasDirectionalEvidence = true;
      reasons.push("CVD aligned");
    } else if (signedCvd >= 12) {
      score += 1;
      hasDirectionalEvidence = true;
      reasons.push("CVD mildly aligned");
    } else if (signedCvd <= -18) {
      blockers.push("CVD against move");
    }
  }

  if (bookFresh && bookImbalance !== null) {
    const signedImbalance = bookImbalance * expectedSign;
    if (signedImbalance >= 10) {
      score += 1;
      hasDirectionalEvidence = true;
      reasons.push("book imbalance aligned");
    } else if (signedImbalance <= -12) {
      blockers.push("book imbalance against move");
    }
  }

  if (spreadPct !== null && spreadPct <= 0.04) {
    score += 1;
    reasons.push("spread tight enough");
  }

  if (depthChangePct !== null && depthChangePct <= -20) {
    score += 1;
    reasons.push("visible liquidity thinning");
  }

  if (!bookFresh) blockers.push("fresh public depth unavailable");
  if (flow.notional < 10_000) blockers.push("insufficient signed trade-flow sample");

  const cappedScore = Math.min(score, 5);
  const pass = !REQUIRE_ALERT_EVIDENCE || (cappedScore >= 3 && hasDirectionalEvidence && blockers.length === 0);
  return {
    pass,
    score: cappedScore,
    maxScore: 5,
    reasons,
    blockers,
    features: {
      windowMs: ORDERFLOW_WINDOW_MS,
      tradeFlowNotional: Number(flow.notional.toFixed(2)),
      aggressiveBuyNotional: Number(flow.buyNotional.toFixed(2)),
      aggressiveSellNotional: Number(flow.sellNotional.toFixed(2)),
      cvdNotional: Number(cvd.toFixed(2)),
      cvdPctOfVolume: Number.isFinite(cvdPctOfVolume) ? cvdPctOfVolume : null,
      bookFresh,
      bookAgeMs,
      bookImbalance,
      spreadPct,
      top5DepthNotional: bookFresh ? Number(book.totalDepthNotional.toFixed(2)) : null,
      depthChangePct,
      volumeVelocityRatio: volume?.ratio ?? null,
      volumeRecentNotional: volume?.recent ?? null
    }
  };
}

function findBaseline(points, cutoff) {
  let baseline = points[0];
  for (const point of points) {
    if (point.time <= cutoff) baseline = point;
    else break;
  }
  return baseline;
}

function pctMove(from, to) {
  return ((to - from) / from) * 100;
}

function signedDirectionalMove(review, price) {
  const move = pctMove(review.alertPrice, price);
  return review.direction === "UP" ? move : -move;
}

function classifyReview(review) {
  const triggerAbs = Math.abs(review.triggerMovePct);
  const thirtyMinuteCheckpoint = review.checkpoints.find((checkpoint) => checkpoint.label === "30m");
  const finalCheckpoint = review.checkpoints.find((checkpoint) => checkpoint.label === "1h");
  const thirtyMinuteDirectionalMove =
    thirtyMinuteCheckpoint?.directionalMovePct ?? signedDirectionalMove(review, review.lastPrice ?? review.alertPrice);
  const finalDirectionalMove =
    finalCheckpoint?.directionalMovePct ?? signedDirectionalMove(review, review.lastPrice ?? review.alertPrice);
  const usefulMove = Math.max(0.2, triggerAbs * 0.6);
  const fadedMove = Math.max(0.1, triggerAbs * 0.35);

  if (
    review.maxAdversePct >= usefulMove &&
    (thirtyMinuteDirectionalMove <= -fadedMove || finalDirectionalMove <= -fadedMove)
  ) {
    return {
      verdict: "fade-useful",
      reason: "pohyb se po alertu dostatecne otocil proti smeru alertu; relevantni pro contrarian/fade tezi."
    };
  }

  if (review.maxFavorablePct >= usefulMove && review.maxFavorablePct >= review.maxAdversePct * 0.8) {
    return {
      verdict: "follow-useful",
      reason: "pohyb mel po alertu jeste slusne pokracovani nebo follow-through."
    };
  }

  if (Math.abs(finalDirectionalMove) <= fadedMove && review.maxAdversePct > review.maxFavorablePct) {
    return {
      verdict: "noisy",
      reason: "wick se spis vymazal a proti smeru alertu bylo vic bolesti nez nasledovani."
    };
  }

  if (review.maxFavorablePct < usefulMove && review.maxAdversePct < usefulMove) {
    return {
      verdict: "noisy",
      reason: "po alertu uz nebyl dost velky nasledny pohyb, spis mikrostruktura."
    };
  }

  return {
    verdict: "mixed",
    reason: "signal nebyl cisty; neco se delo, ale bez jasneho potvrzeni nebo bez jednoznacneho retracu."
  };
}

function canAlert(key, cooldownMs) {
  const last = lastAlert.get(key) || 0;
  return Date.now() - last >= cooldownMs;
}

function canLogSuppressed(key) {
  const last = lastSuppressed.get(key) || 0;
  return Date.now() - last >= SUPPRESSED_LOG_COOLDOWN_MS;
}

function markSuppressed(key) {
  lastSuppressed.set(key, Date.now());
}

function markAlert(key) {
  lastAlert.set(key, Date.now());
}

function sendTelegram(message) {
  return new Promise((resolve) => {
    const child = spawn(
      OPENCLAW_BIN,
      ["message", "send", "--channel", CHANNEL, "--target", TELEGRAM_TARGET, "--message", message],
      { stdio: ["ignore", "pipe", "pipe"] }
    );

    let stdout = "";
    let stderr = "";
    child.stdout.on("data", (chunk) => {
      stdout += chunk.toString();
    });
    child.stderr.on("data", (chunk) => {
      stderr += chunk.toString();
    });
    child.on("close", (code) => {
      if (code !== 0) {
        console.error(`[${nowIso()}] send failed`, { code, stderr: stderr.trim() });
      } else {
        console.log(`[${nowIso()}] alert sent`, stdout.trim());
      }
      resolve({ code, stdout: stdout.trim(), stderr: stderr.trim() });
    });
  });
}

function startReview(alert) {
  const review = {
    id: alert.id,
    assetSymbol: alert.assetSymbol,
    assetLabel: alert.assetLabel,
    direction: alert.direction,
    alertTime: alert.eventTime,
    alertTimeIso: new Date(alert.eventTime).toISOString(),
    alertPrice: alert.price,
    triggerKind: alert.triggerKind,
    triggerLabel: alert.triggerLabel,
    triggerMovePct: alert.triggerMovePct,
    volumeVelocityRatio: alert.volumeVelocityRatio,
    volumeRecentNotional: alert.volumeRecentNotional,
    source: alert.source,
    lastPrice: alert.price,
    lastEventTime: alert.eventTime,
    minPrice: alert.price,
    maxPrice: alert.price,
    maxFavorablePct: 0,
    maxAdversePct: 0,
    entryResearch: entryResearchFromPlan(alert.fadePlan),
    checkpoints: REVIEW_CHECKPOINTS.map((checkpoint) => ({ ...checkpoint, price: null, movePct: null, directionalMovePct: null }))
  };

  activeReviews.set(review.id, review);
  appendFeedback({ type: "alert_sent", alert });
  maybeOpenPaperTrade(alert, alert.price, alert.eventTime).catch((error) => {
    console.error(`[${nowIso()}] paper open failed`, error);
  });

  setTimeout(() => {
    finalizeReview(review.id).catch((error) => {
      console.error(`[${nowIso()}] review finalize failed`, error);
    });
  }, REVIEW_WINDOW_MS + 5_000);
}

function updateReviewStats(symbol, price, eventTime) {
  for (const review of activeReviews.values()) {
    if (review.assetSymbol !== symbol || eventTime < review.alertTime) continue;

    review.lastPrice = price;
    review.lastEventTime = eventTime;
    review.minPrice = Math.min(review.minPrice, price);
    review.maxPrice = Math.max(review.maxPrice, price);

    const directionalMove = signedDirectionalMove(review, price);
    review.maxFavorablePct = Math.max(review.maxFavorablePct, directionalMove);
    review.maxAdversePct = Math.max(review.maxAdversePct, -directionalMove);

    const elapsed = eventTime - review.alertTime;
    if (review.entryResearch) {
      const live2m = review.entryResearch.live2m;
      if (elapsed <= live2m.validUntilMs) {
        live2m.minPrice = live2m.minPrice === null ? price : Math.min(live2m.minPrice, price);
        live2m.maxPrice = live2m.maxPrice === null ? price : Math.max(live2m.maxPrice, price);
        if (live2m.firstInRangePrice === null && classifyEntryResearchPrice(review.entryResearch, price) === "in_range") {
          live2m.status = "in_range";
          live2m.firstInRangePrice = price;
          live2m.firstInRangeAt = new Date(eventTime).toISOString();
        }
      } else if (live2m.status === "waiting") {
        live2m.status = "no_entry";
      }

      for (const mark of review.entryResearch.marks) {
        if (mark.price !== null || elapsed < mark.afterMs) continue;
        mark.price = price;
        mark.observedAt = new Date(eventTime).toISOString();
        mark.status = classifyEntryResearchPrice(review.entryResearch, price);
      }
    }

    for (const checkpoint of review.checkpoints) {
      if (checkpoint.price !== null || elapsed < checkpoint.afterMs) continue;
      checkpoint.price = price;
      checkpoint.observedAt = new Date(eventTime).toISOString();
      checkpoint.movePct = pctMove(review.alertPrice, price);
      checkpoint.directionalMovePct = directionalMove;
    }
  }
}

async function finalizeReview(id) {
  const review = activeReviews.get(id);
  if (!review) return;

  const lastPrice = review.lastPrice ?? review.alertPrice;
  for (const checkpoint of review.checkpoints) {
    if (checkpoint.price !== null) continue;
    checkpoint.price = lastPrice;
    checkpoint.observedAt = review.lastEventTime ? new Date(review.lastEventTime).toISOString() : nowIso();
    checkpoint.movePct = pctMove(review.alertPrice, lastPrice);
    checkpoint.directionalMovePct = signedDirectionalMove(review, lastPrice);
  }
  if (review.entryResearch) {
    if (review.entryResearch.live2m.status === "waiting") {
      review.entryResearch.live2m.status = "no_entry";
    }
    for (const mark of review.entryResearch.marks) {
      if (mark.price !== null) continue;
      mark.price = lastPrice;
      mark.observedAt = review.lastEventTime ? new Date(review.lastEventTime).toISOString() : nowIso();
      mark.status = classifyEntryResearchPrice(review.entryResearch, lastPrice);
    }
  }

  const classification = classifyReview(review);
  const checkpointLine = review.checkpoints
    .map((checkpoint) => `${checkpoint.label} ${checkpoint.movePct >= 0 ? "+" : ""}${checkpoint.movePct.toFixed(2)}%`)
    .join(" / ");
  const finalCheckpoint = review.checkpoints.find((checkpoint) => checkpoint.label === "1h");
  const thirtyMinuteCheckpoint = review.checkpoints.find((checkpoint) => checkpoint.label === "30m");
  const fade30m = -(thirtyMinuteCheckpoint?.directionalMovePct ?? 0);
  const fade1h = -(finalCheckpoint?.directionalMovePct ?? 0);
  const volumeLine =
    review.volumeVelocityRatio != null
      ? `Puvodni volume velocity: ~${review.volumeVelocityRatio.toFixed(1)}x 5m avg/5s.`
      : null;

  const message = [
    `CRYPTO ALERT REVIEW: ${review.assetLabel} ${review.direction} po 1h`,
    "",
    `Verdikt: ${classification.verdict}`,
    `Start: ${formatUsd(review.alertPrice, review.assetLabel)} -> 1h: ${formatUsd(finalCheckpoint.price, review.assetLabel)} (${
      finalCheckpoint.movePct >= 0 ? "+" : ""
    }${finalCheckpoint.movePct.toFixed(2)}%)`,
    `Checkpointy: ${checkpointLine}`,
    `Fade close 30m/1h: ${fade30m >= 0 ? "+" : ""}${fade30m.toFixed(2)}% / ${fade1h >= 0 ? "+" : ""}${fade1h.toFixed(2)}%`,
    `MFE/MAE ve smeru alertu: +${review.maxFavorablePct.toFixed(2)}% / -${review.maxAdversePct.toFixed(2)}%`,
    volumeLine,
    `Proc: ${classification.reason}`,
    "",
    "Beru to jako evidence pro ladeni thresholdů, ne jako trading doporuceni."
  ]
    .filter((line) => line !== null)
    .join("\n");

  const result = SEND_REVIEW_MESSAGES ? await sendTelegram(message) : null;
  if (!SEND_REVIEW_MESSAGES) {
    console.log(`[${nowIso()}] review finalized`, {
      id: review.id,
      asset: review.assetLabel,
      direction: review.direction,
      verdict: classification.verdict,
      fade30m: fade30m.toFixed(2),
      fade1h: fade1h.toFixed(2)
    });
  }
  activeReviews.delete(id);
  appendFeedback({ type: "review_finalized", review, classification, sendResult: result });
}

async function maybeAlert(asset, price, eventTime, triggered) {
  const direction = triggered.movePct > 0 ? "UP" : "DOWN";
  const cooldownKey = `${asset.label}:${direction}`;
  if (!canAlert(cooldownKey, asset.cooldownMs)) return;
  if (alertInFlight.has(cooldownKey)) return;
  alertInFlight.add(cooldownKey);

  try {
    const volume = volumeVelocity(asset.symbol, eventTime);
    const evidence = evidenceGate(asset, direction, eventTime, volume);
    const orderflowContext = readOrderflowContext("BTC");
    const targetOrderflowContext = asset.label === "BTC" ? orderflowContext : readOrderflowContext(asset.label);
    const ta = await fullTaGate(asset, direction, price, eventTime, triggered, evidence, orderflowContext);
    if (ta) ta.targetOrderflowContext = targetOrderflowContext;
    if (!evidence.pass) {
      const suppressedKey = `${asset.label}:${direction}:${triggered.label}`;
      if (canLogSuppressed(suppressedKey)) {
        markSuppressed(suppressedKey);
        appendFeedback({
          type: "alert_suppressed",
          candidate: {
            assetSymbol: asset.symbol,
            assetLabel: asset.label,
            direction,
            eventTime,
            price,
            triggerKind: triggered.kind || "VELOCITY",
            triggerLabel: triggered.label,
            triggerMovePct: triggered.movePct,
            thresholdPct: triggered.pct,
            windowMs: triggered.windowMs,
            source: asset.source
          },
          evidence,
          orderflowContext,
          targetOrderflowContext
        });
      }
      return;
    }

    markAlert(cooldownKey);

    const volumeLine =
      volume && volume.ratio != null && volume.recent >= 1
        ? `Vol: ${formatCompactUsdAmount(volume.recent)} / 5s (${volume.ratio.toFixed(1)}x)`
        : null;
    const evidenceLine = INCLUDE_ALERT_EVIDENCE_LINE ? formatEvidence(evidence) : null;
    const plan = fadePlan(asset.label, direction, price, ta);
    const taLines =
      INCLUDE_TA_CONTEXT_LINE && ALERT_DETAIL_LEVEL === "full"
        ? formatTaContextLines(asset, ta, evidence)
        : formatCompactTaContextLines(asset, ta);
    const planLines = ALERT_DETAIL_LEVEL === "full" ? plan.lines : formatCompactPlanLines(plan, asset.label);
    const orderflowLine = formatOrderflowContextLine(orderflowContext, ta?.btcGate);

    const message = [
      `${asset.label} ${direction} ${triggered.kind || "VELOCITY"} ${triggered.movePct > 0 ? "+" : ""}${triggered.movePct.toFixed(
        2
      )}% / ${triggered.label}`,
      `Price: ${formatUsd(price, asset.label)}`,
      volumeLine,
      evidenceLine,
      orderflowLine,
      ...taLines,
      "",
      ...planLines
    ]
      .filter((line) => line !== null)
      .join("\n");

    const sendResult = await sendTelegram(message);
    if (sendResult.code === 0) {
      startReview({
        id: eventId(asset, direction, eventTime),
        assetSymbol: asset.symbol,
        assetLabel: asset.label,
        direction,
        eventTime,
        price,
        triggerKind: triggered.kind || "VELOCITY",
        triggerLabel: triggered.label,
        triggerMovePct: triggered.movePct,
        thresholdPct: triggered.pct,
        windowMs: triggered.windowMs,
        volumeVelocityRatio: volume?.ratio ?? null,
        volumeRecentNotional: volume?.recent ?? null,
        evidence,
        ta,
        orderflowContext,
        targetOrderflowContext,
        fadePlan: plan,
        source: asset.source,
        sendResult
      });
    }
  } finally {
    alertInFlight.delete(cooldownKey);
  }
}

async function handleTrade(symbol, price, eventTime, notional = null, buyerIsMaker = null) {
  const asset = Object.values(CONFIG).find((entry) => entry.symbol === symbol);
  if (!asset) return;

  const points = history.get(symbol);
  points.push({ time: eventTime, price });
  prune(points, eventTime);
  updateReviewStats(symbol, price, eventTime);
  await updatePaperTrades(symbol, price, eventTime);

  if (Number.isFinite(notional) && notional > 0) {
    const volumes = volumeHistory.get(symbol);
    volumes.push({ time: eventTime, notional });
    prune(volumes, eventTime);
    recordTradeFlow(symbol, eventTime, notional, buyerIsMaker);
  }

  if (points.length < 2) return;

  let strongest = null;
  for (const threshold of asset.thresholds) {
    const baseline = findBaseline(points, eventTime - threshold.windowMs);
    if (!baseline) continue;
    const move = pctMove(baseline.price, price);
    if (Math.abs(move) >= threshold.pct) {
      const candidate = { ...threshold, movePct: move };
      if (!strongest || Math.abs(candidate.movePct) > Math.abs(strongest.movePct)) {
        strongest = candidate;
      }
    }
  }

  if (strongest) await maybeAlert(asset, price, eventTime, strongest);
}

function connectBinance() {
  console.log(`[${nowIso()}] connecting ${BINANCE_WS}`);
  const ws = new WebSocket(BINANCE_WS);
  let lastMessageAt = Date.now();
  let idleTimer = null;

  ws.addEventListener("open", () => {
    console.log(`[${nowIso()}] connected`);
    lastMessageAt = Date.now();
    idleTimer = startIdleReconnectWatch("binance", ws, () => lastMessageAt, BINANCE_IDLE_RECONNECT_MS);
  });

  ws.addEventListener("message", async (event) => {
    lastMessageAt = Date.now();
    try {
      const payload = JSON.parse(event.data);
      const trade = payload.data || payload;
      const depth = binanceDepthPayload(payload, trade);
      if (depth?.symbol) {
        handleDepth(depth.symbol, depth.bids, depth.asks, depth.eventTime);
        return;
      }
      const symbol = String(trade.s || "").toLowerCase();
      const price = Number(trade.p);
      const quantity = Number(trade.q);
      const notional = Number.isFinite(quantity) ? price * quantity : null;
      const eventTime = Number(trade.E || Date.now());
      if (!symbol || !Number.isFinite(price)) return;
      await handleTrade(symbol, price, eventTime, notional, typeof trade.m === "boolean" ? trade.m : null);
    } catch (error) {
      console.error(`[${nowIso()}] message error`, error);
    }
  });

  ws.addEventListener("close", () => {
    if (idleTimer) clearInterval(idleTimer);
    console.error(`[${nowIso()}] binance websocket closed; reconnecting in 5s`);
    setTimeout(connectBinance, 5_000);
  });

  ws.addEventListener("error", (error) => {
    console.error(`[${nowIso()}] websocket error`, error?.message || error);
    try {
      ws.close();
    } catch {
      // Ignore close errors during reconnect.
    }
  });
}

function connectHyperliquid() {
  console.log(`[${nowIso()}] connecting ${HYPERLIQUID_WS}`);
  const ws = new WebSocket(HYPERLIQUID_WS);
  let lastMessageAt = Date.now();
  let idleTimer = null;

  ws.addEventListener("open", () => {
    console.log(`[${nowIso()}] connected hyperliquid`);
    lastMessageAt = Date.now();
    idleTimer = startIdleReconnectWatch("hyperliquid", ws, () => lastMessageAt, HYPERLIQUID_IDLE_RECONNECT_MS);
    ws.send(JSON.stringify({ method: "subscribe", subscription: { type: "allMids" } }));
  });

  ws.addEventListener("message", async (event) => {
    lastMessageAt = Date.now();
    try {
      const payload = JSON.parse(event.data);
      if (payload.channel !== "allMids") return;
      const hype = Number(payload.data?.mids?.HYPE);
      if (!Number.isFinite(hype)) return;
      await handleTrade("hype", hype, Date.now());
    } catch (error) {
      console.error(`[${nowIso()}] hyperliquid message error`, error);
    }
  });

  ws.addEventListener("close", () => {
    if (idleTimer) clearInterval(idleTimer);
    console.error(`[${nowIso()}] hyperliquid websocket closed; reconnecting in 5s`);
    setTimeout(connectHyperliquid, 5_000);
  });

  ws.addEventListener("error", (error) => {
    console.error(`[${nowIso()}] hyperliquid websocket error`, error?.message || error);
    try {
      ws.close();
    } catch {
      // Ignore close errors during reconnect.
    }
  });
}

process.on("exit", removePidFile);
process.on("SIGINT", () => process.exit(0));
process.on("SIGTERM", () => process.exit(0));

writePidFile();
console.log(
  `[${nowIso()}] paper trading ${PAPER_TRADING_ENABLED ? "enabled" : "disabled"} | file ${PAPER_TRADING_FILE} | max open ${PAPER_MAX_OPEN_TRADES}`
);
console.log(
  `[${nowIso()}] demo-sim ${DEMO_SIM_ENABLED ? "enabled" : "disabled"} | file ${DEMO_SIM_FILE} | messages ${
    DEMO_SIM_SEND_MESSAGES ? "enabled" : "disabled"
  }`
);
if (DEMO_TRADING_ENABLED) {
  console.error(
    `[${nowIso()}] demo trading requested but blocked: no write-capable demo/testnet execution adapter is configured in this watcher`
  );
}
connectBinance();
connectHyperliquid();
