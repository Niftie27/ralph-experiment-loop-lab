#!/usr/bin/env node

import fs from "node:fs/promises";
import path from "node:path";

const ROOT = path.resolve(new URL("..", import.meta.url).pathname);
const OUT_JSON = path.join(ROOT, "outputs", "funding-basis-public-snapshot-table.json");
const OUT_MD = path.join(ROOT, "outputs", "funding-basis-public-snapshot-table.md");
const HYPERLIQUID_INFO = "https://api.hyperliquid.xyz/info";
const DEFILLAMA_YIELDS = "https://yields.llama.fi/pools";
const TOP_MARKETS = 20;
const FUNDING_HISTORY_MARKETS = 12;
const FUNDING_LOOKBACK_HOURS = 72;

const observedAt = new Date().toISOString();
const previousReport = await readPreviousReport(OUT_JSON);
const metaAndCtxs = await postInfo({ type: "metaAndAssetCtxs" });
if (!Array.isArray(metaAndCtxs) || !Array.isArray(metaAndCtxs[0]?.universe) || !Array.isArray(metaAndCtxs[1])) {
  throw new Error("Unexpected Hyperliquid metaAndAssetCtxs response shape");
}

const universe = metaAndCtxs[0].universe;
const contexts = metaAndCtxs[1];
const markets = universe.map((asset, index) => {
  const ctx = contexts[index] || {};
  return {
    venue: "Hyperliquid",
    coin: asset.name,
    maxLeverage: Number(asset.maxLeverage) || null,
    funding: toNumber(ctx.funding),
    openInterest: toNumber(ctx.openInterest),
    dayNtlVlm: toNumber(ctx.dayNtlVlm),
    dayBaseVlm: toNumber(ctx.dayBaseVlm),
    premium: toNumber(ctx.premium),
    oraclePx: toNumber(ctx.oraclePx),
    markPx: toNumber(ctx.markPx),
    midPx: toNumber(ctx.midPx),
    prevDayPx: toNumber(ctx.prevDayPx),
    impactBid: toNumber(ctx.impactPxs?.[0]),
    impactAsk: toNumber(ctx.impactPxs?.[1])
  };
}).sort((a, b) => (b.dayNtlVlm || 0) - (a.dayNtlVlm || 0));

const topMarkets = markets.slice(0, TOP_MARKETS);
const startTime = Date.now() - FUNDING_LOOKBACK_HOURS * 60 * 60 * 1000;
const fundingByCoin = {};
for (const market of topMarkets.slice(0, FUNDING_HISTORY_MARKETS)) {
  fundingByCoin[market.coin] = summarizeFunding(await postInfo({
    type: "fundingHistory",
    coin: market.coin,
    startTime
  }));
}

const yieldContext = summarizeYieldContext(await fetchJson(DEFILLAMA_YIELDS));
const rows = topMarkets.map((market, rank) => {
  const funding = fundingByCoin[market.coin] || null;
  return {
    rank: rank + 1,
    ...market,
    currentFundingAnnualizedPct: annualizedPct(market.funding),
    fundingHistoryRows: funding?.rows ?? null,
    fundingPositiveShare: funding?.positiveShare ?? null,
    fundingFlipCount: funding?.flipCount ?? null,
    fundingAvgAnnualizedPct: funding?.avgAnnualizedPct ?? null,
    markOracleDiffBps: bpsDiff(market.markPx, market.oraclePx),
    impactWidthBps: bpsDiff(market.impactAsk, market.impactBid, market.midPx),
    diagnosticState: diagnosticState(market, funding),
    notes: diagnosticNotes(market, funding)
  };
});

const report = {
  generatedAt: observedAt,
  status: "research-only-no-live-execution",
  workItem: "validation.funding-basis-public-snapshot-table",
  note: "One-shot public/no-key funding and liquidity snapshot. It is a baseline diagnostic, not a trade signal, alert, sizing rule, execution rule, or strategy promotion.",
  sources: {
    hyperliquidInfoEndpoint: HYPERLIQUID_INFO,
    hyperliquidRequests: [
      "metaAndAssetCtxs",
      `fundingHistory for top ${FUNDING_HISTORY_MARKETS} markets by daily notional volume`
    ],
    defillamaYields: DEFILLAMA_YIELDS
  },
  parameters: {
    topMarkets: TOP_MARKETS,
    fundingHistoryMarkets: FUNDING_HISTORY_MARKETS,
    fundingLookbackHours: FUNDING_LOOKBACK_HOURS
  },
  yieldContext,
  totals: {
    hyperliquidMarkets: markets.length,
    rows: rows.length,
    fundingHistoryRows: rows.reduce((sum, row) => sum + (row.fundingHistoryRows || 0), 0),
    observeRows: rows.filter((row) => row.diagnosticState === "observe").length,
    cautionRows: rows.filter((row) => row.diagnosticState === "caution").length,
    insufficientRows: rows.filter((row) => ["insufficient-history", "history-not-fetched"].includes(row.diagnosticState)).length
  },
  previousComparison: comparePrevious(previousReport, rows),
  rows
};

await fs.mkdir(path.dirname(OUT_JSON), { recursive: true });
await fs.writeFile(OUT_JSON, `${JSON.stringify(report, null, 2)}\n`);
await fs.writeFile(OUT_MD, renderMarkdown(report));

console.log(JSON.stringify({
  ok: true,
  rows: report.totals.rows,
  hyperliquidMarkets: report.totals.hyperliquidMarkets,
  fundingHistoryRows: report.totals.fundingHistoryRows,
  observeRows: report.totals.observeRows,
  output: path.relative(ROOT, OUT_MD)
}, null, 2));

async function postInfo(body) {
  const res = await fetch(HYPERLIQUID_INFO, {
    method: "POST",
    headers: { "content-type": "application/json" },
    body: JSON.stringify(body)
  });
  if (!res.ok) throw new Error(`Hyperliquid info ${body.type} failed: HTTP ${res.status}`);
  return res.json();
}

async function fetchJson(url) {
  const res = await fetch(url);
  if (!res.ok) throw new Error(`${url} failed: HTTP ${res.status}`);
  return res.json();
}

async function readPreviousReport(file) {
  try {
    const parsed = JSON.parse(await fs.readFile(file, "utf8"));
    return Array.isArray(parsed?.rows) ? parsed : null;
  } catch {
    return null;
  }
}

function summarizeFunding(rows) {
  const clean = Array.isArray(rows)
    ? rows.map((row) => ({ ...row, rate: toNumber(row.fundingRate) })).filter((row) => Number.isFinite(row.rate))
    : [];
  const signs = clean.map((row) => Math.sign(row.rate));
  let flipCount = 0;
  for (let i = 1; i < signs.length; i += 1) {
    if (signs[i] !== 0 && signs[i - 1] !== 0 && signs[i] !== signs[i - 1]) flipCount += 1;
  }
  const avg = clean.reduce((sum, row) => sum + row.rate, 0) / (clean.length || 1);
  return {
    rows: clean.length,
    positiveShare: clean.length ? round(clean.filter((row) => row.rate > 0).length / clean.length, 4) : null,
    flipCount,
    avgFunding: clean.length ? round(avg, 10) : null,
    avgAnnualizedPct: clean.length ? annualizedPct(avg) : null
  };
}

function summarizeYieldContext(body) {
  const pools = Array.isArray(body?.data) ? body.data : [];
  const stablePools = pools
    .filter((pool) => Number.isFinite(Number(pool.apy)) && Number(pool.tvlUsd) > 1_000_000)
    .filter((pool) => /usd|usdc|usdt|dai|frax|lusd|susd/i.test(String(pool.symbol || "")))
    .sort((a, b) => Number(b.tvlUsd || 0) - Number(a.tvlUsd || 0))
    .slice(0, 10)
    .map((pool) => ({
      chain: pool.chain,
      project: pool.project,
      symbol: pool.symbol,
      tvlUsd: round(Number(pool.tvlUsd || 0), 2),
      apy: round(Number(pool.apy || 0), 4)
    }));
  const weightedApy = stablePools.reduce((sum, pool) => sum + pool.apy * pool.tvlUsd, 0) /
    (stablePools.reduce((sum, pool) => sum + pool.tvlUsd, 0) || 1);
  return {
    sourceStatus: body?.status || null,
    poolCount: pools.length,
    stablePoolSampleCount: stablePools.length,
    topStablePoolsByTvl: stablePools,
    tvlWeightedTopStableApy: stablePools.length ? round(weightedApy, 4) : null,
    use: "dumb baseline context only; not an approved yield venue or allocation"
  };
}

function diagnosticState(market, funding) {
  if (!funding) return "history-not-fetched";
  if (funding.rows < 2) return "insufficient-history";
  if (!Number.isFinite(market.dayNtlVlm) || !Number.isFinite(market.openInterest)) return "caution";
  if (!Number.isFinite(market.funding) || !Number.isFinite(market.midPx)) return "caution";
  return "observe";
}

function diagnosticNotes(market, funding) {
  const notes = [];
  if (!funding) notes.push("funding history not fetched in this bounded run");
  else if (funding.rows < 2) notes.push("insufficient short-window funding history in this run");
  if (funding?.flipCount > 0) notes.push("funding sign flipped in lookback");
  if (Number.isFinite(market.markPx) && Number.isFinite(market.oraclePx) && Math.abs(bpsDiff(market.markPx, market.oraclePx)) > 10) {
    notes.push("mark/oracle divergence deserves tail-risk review");
  }
  if (Number.isFinite(market.impactBid) && Number.isFinite(market.impactAsk) && Math.abs(bpsDiff(market.impactAsk, market.impactBid, market.midPx)) > 10) {
    notes.push("impact-price width deserves liquidity review");
  }
  if (!notes.length) notes.push("public snapshot adequate for baseline observation");
  return notes;
}

function renderMarkdown(report) {
  const lines = [
    "# Funding/Basis Public Snapshot Table",
    "",
    `Generated: ${report.generatedAt}`,
    `Status: ${report.status}.`,
    "",
    report.note,
    "",
    "## Summary",
    "",
    `- Hyperliquid markets returned: ${report.totals.hyperliquidMarkets}`,
    `- Table rows: ${report.totals.rows}`,
    `- Funding-history rows fetched: ${report.totals.fundingHistoryRows}`,
    `- Observe rows: ${report.totals.observeRows}`,
    `- Caution rows: ${report.totals.cautionRows}`,
    `- Insufficient/history-not-fetched rows: ${report.totals.insufficientRows}`,
    `- Top stable-yield context APY: ${fmtPercent(report.yieldContext.tvlWeightedTopStableApy)}`,
    "",
    "## Market Snapshot",
    "",
    "| Rank | Coin | Day notional | OI | Current funding ann. | 72h avg funding ann. | Positive share | Flips | Mark/oracle bps | Impact width bps | State | Notes |",
    "| ---: | --- | ---: | ---: | ---: | ---: | ---: | ---: | ---: | ---: | --- | --- |"
  ];
  for (const row of report.rows) {
    lines.push(`| ${row.rank} | ${row.coin} | ${fmt(row.dayNtlVlm, 0)} | ${fmt(row.openInterest, 2)} | ${fmtPercent(row.currentFundingAnnualizedPct)} | ${fmtPercent(row.fundingAvgAnnualizedPct)} | ${fmtShare(row.fundingPositiveShare)} | ${row.fundingFlipCount ?? ""} | ${fmt(row.markOracleDiffBps)} | ${fmt(row.impactWidthBps)} | ${row.diagnosticState} | ${row.notes.join("; ")} |`);
  }
  if (report.previousComparison.available) {
    lines.push(
      "",
      "## Previous-Run Comparison",
      "",
      `Previous generated at: ${report.previousComparison.previousGeneratedAt}`,
      "",
      "| Coin | Rank change | Funding ann. delta | Avg funding ann. delta | Day notional delta | State change |",
      "| --- | ---: | ---: | ---: | ---: | --- |"
    );
    for (const row of report.previousComparison.rows.slice(0, 12)) {
      lines.push(`| ${row.coin} | ${fmtSigned(row.rankDelta, 0)} | ${fmtSigned(row.currentFundingAnnualizedPctDelta)}% | ${fmtSigned(row.fundingAvgAnnualizedPctDelta)}% | ${fmtSigned(row.dayNtlVlmDelta, 0)} | ${row.stateChange || ""} |`);
    }
  } else {
    lines.push(
      "",
      "## Previous-Run Comparison",
      "",
      "No previous local output was available before this run. The next manual run can compare against this output automatically."
    );
  }
  lines.push(
    "",
    "## Stable/Yield Context",
    "",
    "| Chain | Project | Symbol | TVL USD | APY |",
    "| --- | --- | --- | ---: | ---: |"
  );
  for (const pool of report.yieldContext.topStablePoolsByTvl) {
    lines.push(`| ${pool.chain} | ${pool.project} | ${pool.symbol} | ${fmt(pool.tvlUsd, 0)} | ${fmtPercent(pool.apy)} |`);
  }
  lines.push(
    "",
    "## Interpretation",
    "",
    "This table is a baseline diagnostic. It can identify markets worth observing and markets with obvious funding, liquidity, or mark/oracle caveats, but it does not authorize account setup, live monitoring, alerts, sizing, hedging, or execution.",
    "",
    "Next safe step, if needed: repeat as a fixed-window paper-accounting design that compares gross carry against conservative cost classes and the stable/yield context above.",
    "",
    "Boundary delta: generated local JSON/Markdown outputs only; no live trading, alerts, thresholds, accounts, keys, paid services, scheduler changes, risk/sizing/TP/SL, or execution behavior changed."
  );
  return `${lines.join("\n")}\n`;
}

function comparePrevious(previous, rows) {
  if (!previous) {
    return {
      available: false,
      previousGeneratedAt: null,
      rows: []
    };
  }
  const byCoin = new Map(previous.rows.map((row) => [row.coin, row]));
  const compared = rows
    .filter((row) => byCoin.has(row.coin))
    .map((row) => {
      const prev = byCoin.get(row.coin);
      return {
        coin: row.coin,
        rankDelta: nullableDiff(row.rank, prev.rank),
        currentFundingAnnualizedPctDelta: nullableDiff(row.currentFundingAnnualizedPct, prev.currentFundingAnnualizedPct),
        fundingAvgAnnualizedPctDelta: nullableDiff(row.fundingAvgAnnualizedPct, prev.fundingAvgAnnualizedPct),
        dayNtlVlmDelta: nullableDiff(row.dayNtlVlm, prev.dayNtlVlm),
        stateChange: row.diagnosticState === prev.diagnosticState ? "" : `${prev.diagnosticState} -> ${row.diagnosticState}`
      };
    });
  return {
    available: true,
    previousGeneratedAt: previous.generatedAt || null,
    rows: compared
  };
}

function nullableDiff(value, previousValue) {
  return Number.isFinite(value) && Number.isFinite(previousValue) ? round(value - previousValue, 4) : null;
}

function toNumber(value) {
  const n = Number(value);
  return Number.isFinite(n) ? n : null;
}

function annualizedPct(rate) {
  return Number.isFinite(rate) ? round(rate * 24 * 365 * 100, 4) : null;
}

function bpsDiff(a, b, denominator = null) {
  if (!Number.isFinite(a) || !Number.isFinite(b)) return null;
  const den = Number.isFinite(denominator) ? denominator : (Math.abs(a) + Math.abs(b)) / 2;
  return den ? round(((a - b) / den) * 10_000, 4) : null;
}

function fmt(value, digits = 2) {
  return Number.isFinite(value) ? value.toLocaleString("en-US", { maximumFractionDigits: digits }) : "";
}

function fmtSigned(value, digits = 2) {
  if (!Number.isFinite(value)) return "";
  const formatted = Math.abs(value).toLocaleString("en-US", { maximumFractionDigits: digits });
  if (value > 0) return `+${formatted}`;
  if (value < 0) return `-${formatted}`;
  return "0";
}

function fmtShare(value) {
  return Number.isFinite(value) ? `${round(value * 100, 2)}%` : "";
}

function fmtPercent(value) {
  return Number.isFinite(value) ? `${fmt(value)}%` : "";
}

function round(value, digits = 2) {
  const factor = 10 ** digits;
  return Math.round(value * factor) / factor;
}
