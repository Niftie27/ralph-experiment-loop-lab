#!/usr/bin/env node

import fs from "node:fs/promises";
import path from "node:path";

const ROOT = path.resolve(new URL("..", import.meta.url).pathname);
const RESULTS_DIR = path.join(ROOT, "results");
const REPLAY_JSON_PATH = path.join(RESULTS_DIR, "historical-demo-sim-replay.json");
const LEDGER_JSON_PATH = path.join(RESULTS_DIR, "demo-sim-paper-fund-ledger.json");
const LEDGER_MD_PATH = path.join(RESULTS_DIR, "demo-sim-paper-fund-ledger.md");

const DEFAULTS = {
  startingCapitalUsd: 10_000,
  reviewDrawdownPct: 0.05,
};

const nowIso = () => new Date().toISOString();
const round = (value, digits = 4) => Number.isFinite(value) ? Number(value.toFixed(digits)) : null;
const pct = (value) => Number.isFinite(value) ? `${(value * 100).toFixed(1)}%` : "n/a";
const money = (value) => Number.isFinite(value) ? value.toFixed(2) : "n/a";
const cell = (value) => String(value ?? "n/a").replaceAll("|", " / ");

async function readJson(file) {
  return JSON.parse(await fs.readFile(file, "utf8"));
}

async function writeJson(file, value) {
  await fs.mkdir(path.dirname(file), { recursive: true });
  await fs.writeFile(file, `${JSON.stringify(value, null, 2)}\n`);
}

function table(rows, columns) {
  if (!rows.length) return "_No rows._";
  const header = `| ${columns.map((column) => column.label).join(" | ")} |`;
  const divider = `| ${columns.map((column) => column.align ?? "---").join(" | ")} |`;
  const body = rows.map((row) => `| ${columns.map((column) => cell(column.value(row))).join(" | ")} |`);
  return [header, divider, ...body].join("\n");
}

function compareTradeOrder(a, b) {
  return (a.exitTime ?? 0) - (b.exitTime ?? 0)
    || (a.entryTime ?? 0) - (b.entryTime ?? 0)
    || String(a.id).localeCompare(String(b.id));
}

function buildEquityLedger(closedRecords, startingCapitalUsd) {
  let equity = startingCapitalUsd;
  let peakEquity = startingCapitalUsd;

  return closedRecords
    .slice()
    .sort(compareTradeOrder)
    .map((record, index) => {
      const equityBefore = equity;
      const netPnlUsd = record.pnl?.netPnlUsd ?? 0;
      equity += netPnlUsd;
      peakEquity = Math.max(peakEquity, equity);
      const drawdownUsd = peakEquity - equity;
      const drawdownPct = peakEquity > 0 ? drawdownUsd / peakEquity : null;

      return {
        sequence: index + 1,
        id: record.id,
        status: "closed",
        entryTime: record.entryTime,
        entryTimeIso: record.entryTimeIso,
        exitTime: record.exitTime,
        exitTimeIso: record.exitTimeIso,
        symbol: record.symbol,
        productId: record.productId,
        timeframe: record.timeframe,
        setup: record.setup,
        strategy: `${record.setup ?? "unknown"}:${record.direction ?? "unknown"}`,
        direction: record.direction,
        tier: record.tier,
        regime: record.regime,
        btcGateState: record.btcGate?.state ?? "BTC_UNKNOWN",
        btcGatePass: record.btcGate?.pass ?? null,
        exitReason: record.exitReason,
        ambiguous: Boolean(record.ambiguous),
        grossPnlUsd: record.pnl?.grossPnlUsd ?? null,
        feesUsd: record.pnl?.feesUsd ?? null,
        netPnlUsd,
        rMultiple: record.pnl?.rMultiple ?? null,
        equityBefore: round(equityBefore, 2),
        equityAfter: round(equity, 2),
        peakEquity: round(peakEquity, 2),
        drawdownUsd: round(drawdownUsd, 2),
        drawdownPct: round(drawdownPct, 6),
      };
    });
}

function summarizeLedger(ledger, startingCapitalUsd) {
  const endingEquity = ledger.length ? ledger.at(-1).equityAfter : startingCapitalUsd;
  const wins = ledger.filter((row) => row.netPnlUsd > 0);
  const losses = ledger.filter((row) => row.netPnlUsd <= 0);
  const grossWins = wins.reduce((sum, row) => sum + row.netPnlUsd, 0);
  const grossLosses = Math.abs(losses.reduce((sum, row) => sum + row.netPnlUsd, 0));
  const maxDrawdownRow = ledger.reduce((best, row) => {
    if (!best) return row;
    return (row.drawdownUsd ?? 0) > (best.drawdownUsd ?? 0) ? row : best;
  }, null);
  const feesUsd = ledger.reduce((sum, row) => sum + (row.feesUsd ?? 0), 0);
  const grossPnlUsd = ledger.reduce((sum, row) => sum + (row.grossPnlUsd ?? 0), 0);
  const netPnlUsd = ledger.reduce((sum, row) => sum + row.netPnlUsd, 0);
  const rRows = ledger.filter((row) => Number.isFinite(row.rMultiple));
  const netR = rRows.reduce((sum, row) => sum + row.rMultiple, 0);

  return {
    startingCapitalUsd,
    endingEquityUsd: round(endingEquity, 2),
    netPnlUsd: round(netPnlUsd, 2),
    grossPnlUsd: round(grossPnlUsd, 2),
    feesUsd: round(feesUsd, 2),
    returnPct: startingCapitalUsd > 0 ? round(netPnlUsd / startingCapitalUsd, 6) : null,
    closedTrades: ledger.length,
    wins: wins.length,
    losses: losses.length,
    winrate: ledger.length ? round(wins.length / ledger.length, 6) : null,
    profitFactor: grossLosses > 0 ? round(grossWins / grossLosses, 4) : null,
    netR: round(netR, 4),
    avgR: rRows.length ? round(netR / rRows.length, 4) : null,
    invalidRiskRecords: ledger.length - rRows.length,
    maxDrawdownUsd: round(maxDrawdownRow?.drawdownUsd ?? 0, 2),
    maxDrawdownPct: round(maxDrawdownRow?.drawdownPct ?? 0, 6),
    maxDrawdownAt: maxDrawdownRow?.exitTimeIso ?? null,
    ambiguousTrades: ledger.filter((row) => row.ambiguous).length,
  };
}

function groupLedger(ledger, keyFn) {
  const groups = new Map();
  for (const row of ledger) {
    const key = keyFn(row);
    if (!groups.has(key)) groups.set(key, []);
    groups.get(key).push(row);
  }

  return [...groups.entries()]
    .map(([key, rows]) => {
      const summary = summarizeLedger(rows, 0);
      return {
        key,
        closedTrades: rows.length,
        wins: summary.wins,
        losses: summary.losses,
        winrate: summary.winrate,
        grossPnlUsd: summary.grossPnlUsd,
        feesUsd: summary.feesUsd,
        netPnlUsd: summary.netPnlUsd,
        profitFactor: summary.profitFactor,
        netR: summary.netR,
        avgR: summary.avgR,
        invalidRiskRecords: summary.invalidRiskRecords,
        ambiguousTrades: summary.ambiguousTrades,
      };
    })
    .sort((a, b) => (b.netPnlUsd ?? -Infinity) - (a.netPnlUsd ?? -Infinity) || b.closedTrades - a.closedTrades);
}

function monthlyEquitySurface(ledger, startingCapitalUsd) {
  const months = new Map();
  for (const row of ledger) {
    const month = row.exitTimeIso?.slice(0, 7) ?? "unknown";
    if (!months.has(month)) {
      months.set(month, {
        month,
        closedTrades: 0,
        netPnlUsd: 0,
        feesUsd: 0,
        endingEquityUsd: row.equityAfter,
        maxDrawdownPct: 0,
      });
    }
    const bucket = months.get(month);
    bucket.closedTrades += 1;
    bucket.netPnlUsd += row.netPnlUsd;
    bucket.feesUsd += row.feesUsd ?? 0;
    bucket.endingEquityUsd = row.equityAfter;
    bucket.maxDrawdownPct = Math.max(bucket.maxDrawdownPct, row.drawdownPct ?? 0);
  }

  if (!months.size) {
    return [{
      month: "none",
      closedTrades: 0,
      netPnlUsd: 0,
      feesUsd: 0,
      endingEquityUsd: startingCapitalUsd,
      maxDrawdownPct: 0,
    }];
  }

  return [...months.values()]
    .sort((a, b) => a.month.localeCompare(b.month))
    .map((bucket) => ({
      ...bucket,
      netPnlUsd: round(bucket.netPnlUsd, 2),
      feesUsd: round(bucket.feesUsd, 2),
      endingEquityUsd: round(bucket.endingEquityUsd, 2),
      maxDrawdownPct: round(bucket.maxDrawdownPct, 6),
    }));
}

function worstConsecutiveLossRun(ledger) {
  let current = null;
  let best = null;

  for (const row of ledger) {
    if (row.netPnlUsd <= 0) {
      if (!current) {
        current = {
          trades: 0,
          netPnlUsd: 0,
          startAt: row.exitTimeIso,
          endAt: row.exitTimeIso,
        };
      }
      current.trades += 1;
      current.netPnlUsd += row.netPnlUsd;
      current.endAt = row.exitTimeIso;
      continue;
    }

    if (current && (!best || current.trades > best.trades || (current.trades === best.trades && current.netPnlUsd < best.netPnlUsd))) {
      best = current;
    }
    current = null;
  }

  if (current && (!best || current.trades > best.trades || (current.trades === best.trades && current.netPnlUsd < best.netPnlUsd))) {
    best = current;
  }

  return best ? { ...best, netPnlUsd: round(best.netPnlUsd, 2) } : null;
}

function worstRollingWindow(ledger, windowSize) {
  if (ledger.length < windowSize) return null;
  let best = null;

  for (let index = 0; index <= ledger.length - windowSize; index += 1) {
    const rows = ledger.slice(index, index + windowSize);
    const netPnlUsd = rows.reduce((sum, row) => sum + row.netPnlUsd, 0);
    const candidate = {
      windowSize,
      netPnlUsd,
      startAt: rows[0].exitTimeIso,
      endAt: rows.at(-1).exitTimeIso,
      endingEquityUsd: rows.at(-1).equityAfter,
      maxDrawdownPct: Math.max(...rows.map((row) => row.drawdownPct ?? 0)),
    };
    if (!best || candidate.netPnlUsd < best.netPnlUsd) best = candidate;
  }

  return {
    ...best,
    netPnlUsd: round(best.netPnlUsd, 2),
    maxDrawdownPct: round(best.maxDrawdownPct, 6),
  };
}

function capitalTripwires(ledger) {
  return [0.25, 0.5, 0.75, 0.9].map((threshold) => {
    const row = ledger.find((item) => (item.drawdownPct ?? 0) >= threshold);
    return {
      threshold,
      breached: Boolean(row),
      firstAt: row?.exitTimeIso ?? null,
      equityAfterUsd: row?.equityAfter ?? null,
    };
  });
}

function buildRiskReport(ledger, summary) {
  const capitalRemainingPct = summary.startingCapitalUsd > 0
    ? summary.endingEquityUsd / summary.startingCapitalUsd
    : null;
  const feeDragPct = summary.startingCapitalUsd > 0
    ? summary.feesUsd / summary.startingCapitalUsd
    : null;
  const feeShareOfLoss = summary.netPnlUsd < 0
    ? summary.feesUsd / Math.abs(summary.netPnlUsd)
    : null;
  const riskVerdict = (summary.maxDrawdownPct ?? 0) >= 0.5 || (capitalRemainingPct ?? 1) <= 0.5
    ? "paper_fund_capital_impaired_stop_and_rebuild_required"
    : "paper_fund_requires_review";

  return {
    riskVerdict,
    capitalRemainingPct: round(capitalRemainingPct, 6),
    feeDragPct: round(feeDragPct, 6),
    feeShareOfLoss: round(feeShareOfLoss, 6),
    worstConsecutiveLossRun: worstConsecutiveLossRun(ledger),
    worst25TradeWindow: worstRollingWindow(ledger, 25),
    worst50TradeWindow: worstRollingWindow(ledger, 50),
    capitalTripwires: capitalTripwires(ledger),
    interpretation: [
      "The full replay surface is not capital-ready: ending equity is deeply impaired and max drawdown is above any reasonable paper-fund review threshold.",
      "Fees are large enough to explain most of the net loss, so any future candidate must clear costs before it earns paper-capital status.",
      "Short families and BTC_RISK_OFF rows remain the clearest avoid/quarantine surfaces; long-only positive pockets still require separate walk-forward and drawdown containment.",
    ],
  };
}

function classifyStatus(summary, reviewDrawdownPct) {
  if (summary.closedTrades === 0) return "no_closed_trades";
  if ((summary.maxDrawdownPct ?? 0) >= reviewDrawdownPct) return "capital_impaired_review_required";
  if ((summary.netPnlUsd ?? 0) <= 0) return "not_capital_ready";
  return "profitable_but_requires_robustness_review";
}

async function main() {
  const replay = await readJson(REPLAY_JSON_PATH);
  const records = Array.isArray(replay.records) ? replay.records : [];
  const closed = records.filter((record) => record.status === "closed");
  const openOrSkipped = records.filter((record) => record.status !== "closed");
  const ledger = buildEquityLedger(closed, DEFAULTS.startingCapitalUsd);
  const summary = summarizeLedger(ledger, DEFAULTS.startingCapitalUsd);
  const riskReport = buildRiskReport(ledger, summary);
  const status = classifyStatus(summary, DEFAULTS.reviewDrawdownPct);

  const report = {
    generated: nowIso(),
    status,
    sourceReplay: path.relative(ROOT, REPLAY_JSON_PATH),
    outputs: {
      json: path.relative(ROOT, LEDGER_JSON_PATH),
      markdown: path.relative(ROOT, LEDGER_MD_PATH),
    },
    boundaries: [
      "research_only",
      "no_live_execution",
      "no_exchange_keys",
      "no_paid_apis",
      "no_tradingview_automation",
      "no_alert_wording_threshold_watcher_or_sizing_changes",
    ],
    assumptions: {
      startingCapitalUsd: DEFAULTS.startingCapitalUsd,
      reviewDrawdownPct: DEFAULTS.reviewDrawdownPct,
      replayPositionSizing: replay.assumptions?.account ?? null,
      fees: replay.assumptions?.fees ?? null,
      execution: replay.assumptions?.execution ?? null,
      equityAccounting: "Closed trades are applied sequentially by replay exit time. The report does not reserve margin for overlapping positions.",
    },
    counts: {
      sourceRecords: records.length,
      closed: closed.length,
      openOrSkipped: openOrSkipped.length,
      skippedReasons: Object.fromEntries(Object.entries(openOrSkipped.reduce((acc, row) => {
        const key = row.reason ?? row.status ?? "unknown";
        acc[key] = (acc[key] ?? 0) + 1;
        return acc;
      }, {})).sort((a, b) => a[0].localeCompare(b[0]))),
    },
    summary,
    riskReport,
    equitySurface: {
      monthly: monthlyEquitySurface(ledger, DEFAULTS.startingCapitalUsd),
      recent: ledger.slice(-25),
    },
    groups: {
      byStrategy: groupLedger(ledger, (row) => row.strategy),
      bySetup: groupLedger(ledger, (row) => row.setup ?? "unknown"),
      bySymbolTimeframe: groupLedger(ledger, (row) => `${row.symbol ?? "unknown"}:${row.timeframe ?? "unknown"}`),
      byTier: groupLedger(ledger, (row) => row.tier ?? "unknown"),
      byBtcGate: groupLedger(ledger, (row) => row.btcGateState ?? "BTC_UNKNOWN"),
    },
    limitations: [
      "The ledger is built from historical synthetic DEMO-SIM replay rows, not real exchange fills.",
      "Closed trades are sequenced by exit time; overlapping exposure, margin reservation, funding, liquidation, borrow costs, queue priority, and slippage are not modeled.",
      "The current replay records BTC gate context but does not filter rows by BTC gate pass/fail.",
      "Some source rows have rounded signal prices that make R-multiple invalid; USDT PnL is still counted after fees.",
      "This is an interpretation surface for capital discipline, not evidence that any strategy is live-capital-ready.",
    ],
  };

  await writeJson(LEDGER_JSON_PATH, report);

  const groupColumns = [
    { label: "Group", value: (row) => row.key },
    { label: "Closed", align: "---:", value: (row) => row.closedTrades },
    { label: "Winrate", align: "---:", value: (row) => pct(row.winrate) },
    { label: "Net USDT", align: "---:", value: (row) => money(row.netPnlUsd) },
    { label: "Fees", align: "---:", value: (row) => money(row.feesUsd) },
    { label: "PF", align: "---:", value: (row) => row.profitFactor ?? "n/a" },
    { label: "Avg R", align: "---:", value: (row) => row.avgR ?? "n/a" },
    { label: "Bad R", align: "---:", value: (row) => row.invalidRiskRecords },
    { label: "Ambig", align: "---:", value: (row) => row.ambiguousTrades },
  ];

  const monthColumns = [
    { label: "Month", value: (row) => row.month },
    { label: "Closed", align: "---:", value: (row) => row.closedTrades },
    { label: "Net USDT", align: "---:", value: (row) => money(row.netPnlUsd) },
    { label: "Fees", align: "---:", value: (row) => money(row.feesUsd) },
    { label: "Ending Equity", align: "---:", value: (row) => money(row.endingEquityUsd) },
    { label: "Max DD", align: "---:", value: (row) => pct(row.maxDrawdownPct) },
  ];

  const tripwireColumns = [
    { label: "DD Threshold", value: (row) => pct(row.threshold) },
    { label: "Breached", value: (row) => row.breached ? "yes" : "no" },
    { label: "First At", value: (row) => row.firstAt ?? "n/a" },
    { label: "Equity After", align: "---:", value: (row) => money(row.equityAfterUsd) },
  ];

  const recentLines = report.equitySurface.recent
    .slice()
    .reverse()
    .map((row) => `- ${row.exitTimeIso} ${row.symbol} ${row.timeframe} ${row.direction} ${row.setup}: net ${money(row.netPnlUsd)} USDT, equity ${money(row.equityAfter)} USDT, DD ${pct(row.drawdownPct)}, BTC ${row.btcGateState}`)
    .join("\n");

  const riskRows = [
    ["Risk verdict", report.riskReport.riskVerdict],
    ["Capital remaining", pct(report.riskReport.capitalRemainingPct)],
    ["Fee drag vs starting capital", pct(report.riskReport.feeDragPct)],
    ["Fees as share of net loss", pct(report.riskReport.feeShareOfLoss)],
    ["Worst loss streak", report.riskReport.worstConsecutiveLossRun ? `${report.riskReport.worstConsecutiveLossRun.trades} trades / ${money(report.riskReport.worstConsecutiveLossRun.netPnlUsd)} USDT / ${report.riskReport.worstConsecutiveLossRun.startAt} -> ${report.riskReport.worstConsecutiveLossRun.endAt}` : "n/a"],
    ["Worst 25-trade window", report.riskReport.worst25TradeWindow ? `${money(report.riskReport.worst25TradeWindow.netPnlUsd)} USDT / ${report.riskReport.worst25TradeWindow.startAt} -> ${report.riskReport.worst25TradeWindow.endAt}` : "n/a"],
    ["Worst 50-trade window", report.riskReport.worst50TradeWindow ? `${money(report.riskReport.worst50TradeWindow.netPnlUsd)} USDT / ${report.riskReport.worst50TradeWindow.startAt} -> ${report.riskReport.worst50TradeWindow.endAt}` : "n/a"],
  ];

  const riskSection = `## Drawdown And Risk Report\n\n${table(riskRows.map(([metric, value]) => ({ metric, value })), [
    { label: "Metric", value: (row) => row.metric },
    { label: "Value", value: (row) => row.value },
  ])}\n\n### Drawdown Tripwires\n\n${table(report.riskReport.capitalTripwires, tripwireColumns)}\n\n### Risk Interpretation\n\n${report.riskReport.interpretation.map((line) => `- ${line}`).join("\n")}`;

  const md = `# DEMO-SIM Paper Fund Ledger\n\nGenerated: ${report.generated}\nSource replay: \`${report.sourceReplay}\`\n\nStatus: \`${report.status}\`\n\nThis report interprets historical DEMO-SIM replay rows as a paper-fund ledger. It starts with ${money(DEFAULTS.startingCapitalUsd)} USDT, applies closed replay trades in exit-time order, and tracks fee-adjusted equity and drawdown. It is research-only and does not change live execution, keys, schedulers, TradingView automation, alert wording, thresholds, watchers, or sizing behavior.\n\n## Account Summary\n\n| Starting Capital | Ending Equity | Net PnL | Return | Gross PnL | Fees | Closed | Open/skipped | Winrate | Profit Factor | Max DD | Max DD At | Bad R | Ambig |\n| ---: | ---: | ---: | ---: | ---: | ---: | ---: | ---: | ---: | ---: | ---: | --- | ---: | ---: |\n| ${money(summary.startingCapitalUsd)} | ${money(summary.endingEquityUsd)} | ${money(summary.netPnlUsd)} | ${pct(summary.returnPct)} | ${money(summary.grossPnlUsd)} | ${money(summary.feesUsd)} | ${summary.closedTrades} | ${report.counts.openOrSkipped} | ${pct(summary.winrate)} | ${summary.profitFactor ?? "n/a"} | ${money(summary.maxDrawdownUsd)} (${pct(summary.maxDrawdownPct)}) | ${summary.maxDrawdownAt ?? "n/a"} | ${summary.invalidRiskRecords} | ${summary.ambiguousTrades} |\n\n${riskSection}\n\n## Monthly Equity Surface\n\n${table(report.equitySurface.monthly, monthColumns)}\n\n## By Strategy\n\n${table(report.groups.byStrategy, groupColumns)}\n\n## By Setup\n\n${table(report.groups.bySetup, groupColumns)}\n\n## By Symbol And Timeframe\n\n${table(report.groups.bySymbolTimeframe, groupColumns)}\n\n## By Tier\n\n${table(report.groups.byTier, groupColumns)}\n\n## By BTC Gate\n\n${table(report.groups.byBtcGate, groupColumns)}\n\n## Recent Ledger Rows\n\n${recentLines || "- No closed ledger rows."}\n\n## Limitations\n\n${report.limitations.map((line) => `- ${line}`).join("\n")}\n`;

  await fs.writeFile(LEDGER_MD_PATH, md);

  console.log(JSON.stringify({
    ok: true,
    status,
    ledgerJson: LEDGER_JSON_PATH,
    ledgerMarkdown: LEDGER_MD_PATH,
    summary,
    counts: report.counts,
  }, null, 2));
}

main().catch((error) => {
  console.error(error);
  process.exit(1);
});
