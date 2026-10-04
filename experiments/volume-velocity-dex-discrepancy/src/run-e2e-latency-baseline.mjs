#!/usr/bin/env node

import fs from "node:fs/promises";
import path from "node:path";
import { setTimeout as delay } from "node:timers/promises";
import { Contract, JsonRpcProvider, formatUnits, parseUnits } from "ethers";

const ROOT = path.resolve(new URL("..", import.meta.url).pathname);
const CONFIG_PATH = path.join(ROOT, "config", "avalanche-wavax-usdc.json");
const RESULTS_DIR = path.join(ROOT, "results");
const SAMPLES_JSONL = path.join(RESULTS_DIR, "e2e-latency-samples.jsonl");
const SUMMARY_JSON = path.join(RESULTS_DIR, "e2e-latency-summary.json");
const SUMMARY_MD = path.join(RESULTS_DIR, "e2e-latency-summary.md");

const DEFAULT_CYCLES = Number.parseInt(process.env.E2E_BASELINE_CYCLES ?? "2", 10);
const REQUEST_TIMEOUT_MS = Number.parseInt(process.env.E2E_BASELINE_TIMEOUT_MS ?? "12000", 10);

const V3_QUOTER_ABI = [{
  inputs: [{ components: [
    { name: "tokenIn", type: "address" },
    { name: "tokenOut", type: "address" },
    { name: "amountIn", type: "uint256" },
    { name: "fee", type: "uint24" },
    { name: "sqrtPriceLimitX96", type: "uint160" }
  ], name: "params", type: "tuple" }],
  name: "quoteExactInputSingle",
  outputs: [
    { name: "amountOut", type: "uint256" },
    { name: "sqrtPriceX96After", type: "uint160" },
    { name: "initializedTicksCrossed", type: "uint32" },
    { name: "gasEstimate", type: "uint256" }
  ],
  stateMutability: "nonpayable",
  type: "function"
}];

const LB_QUOTER_ABI = [{
  inputs: [
    { name: "route", type: "address[]" },
    { name: "amountIn", type: "uint128" }
  ],
  name: "findBestPathFromAmountIn",
  outputs: [{
    components: [
      { name: "route", type: "address[]" },
      { name: "pairs", type: "address[]" },
      { name: "binSteps", type: "uint256[]" },
      { name: "versions", type: "uint8[]" },
      { name: "amounts", type: "uint128[]" },
      { name: "virtualAmountsWithoutSlippage", type: "uint128[]" },
      { name: "fees", type: "uint128[]" }
    ],
    type: "tuple"
  }],
  stateMutability: "view",
  type: "function"
}];

await fs.mkdir(RESULTS_DIR, { recursive: true });
const config = JSON.parse(await fs.readFile(CONFIG_PATH, "utf8"));
const factorContext = await fetchFactorContext();
const samples = [];

for (const providerConfig of config.providers) {
  const provider = new JsonRpcProvider(providerConfig.rpcUrl, {
    chainId: config.chainId,
    name: config.chain
  });

  for (let cycleIndex = 0; cycleIndex < DEFAULT_CYCLES; cycleIndex += 1) {
    for (const notionalUsd of config.notionalsUsd) {
      for (const [buyVenue, sellVenue] of orderedVenuePairs(config.venues)) {
        const baseSample = await runRoundTrip({
          provider,
          providerConfig,
          buyVenue,
          sellVenue,
          notionalUsd,
          delayBucketMs: 0,
          baseSample: null,
          cycleIndex,
          factorContext
        });
        samples.push(baseSample);

        for (const delayBucketMs of config.delayBucketsMs) {
          await delay(delayBucketMs);
          const delayedSample = await runRoundTrip({
            provider,
            providerConfig,
            buyVenue,
            sellVenue,
            notionalUsd,
            delayBucketMs,
            baseSample,
            cycleIndex,
            factorContext
          });
          samples.push(delayedSample);
        }
      }
    }
  }
}

const summary = summarize(samples);
await fs.writeFile(SAMPLES_JSONL, `${samples.map((sample) => JSON.stringify(sample)).join("\n")}\n`);
await fs.writeFile(SUMMARY_JSON, `${JSON.stringify(summary, null, 2)}\n`);
await fs.writeFile(SUMMARY_MD, renderMarkdown(summary));

console.log(JSON.stringify({
  ok: true,
  status: summary.status,
  samples: summary.totals.samples,
  postCostPositive: summary.totals.postCostPositive,
  latencySurvived: summary.totals.latencySurvived,
  verdict: summary.decision.verdict,
  summary: path.relative(ROOT, SUMMARY_JSON)
}, null, 2));

async function runRoundTrip({
  provider,
  providerConfig,
  buyVenue,
  sellVenue,
  notionalUsd,
  delayBucketMs,
  baseSample,
  cycleIndex,
  factorContext
}) {
  const cycleId = `${new Date().toISOString()}__${providerConfig.id}__${cycleIndex}__${notionalUsd}__${buyVenue.id}_to_${sellVenue.id}__${delayBucketMs}`;
  const tsLocalStartMs = Date.now();
  const blockBeforeQuote = await timed("eth_blockNumber", () => provider.getBlockNumber());
  const gasPrice = await timed("gas_price", () => provider.getFeeData());
  const block = await timed("get_block", () => provider.getBlock(blockBeforeQuote.value));
  const avaxPriceUsd = await fetchAvaxPriceUsd(provider);
  const amountIn = parseUnits(String(notionalUsd), config.tokens.USDC.decimals);

  const quoteAStartMs = Date.now();
  const quoteA = await quoteVenue(provider, buyVenue, "USDC", "WAVAX", amountIn);
  const quoteAEndMs = Date.now();
  const quoteBStartMs = Date.now();
  const quoteB = quoteA.ok
    ? await quoteVenue(provider, sellVenue, "WAVAX", "USDC", quoteA.amountOut)
    : { ok: false, amountOut: 0n, errorClass: "skipped_after_first_leg_error" };
  const quoteBEndMs = Date.now();
  const blockAfterQuote = await timed("eth_blockNumber_after", () => provider.getBlockNumber());
  const tsLocalEndMs = Date.now();

  const grossOutputUsd = quoteB.ok ? Number(formatUnits(quoteB.amountOut, config.tokens.USDC.decimals)) : 0;
  const grossProfitUsd = grossOutputUsd - notionalUsd;
  const costs = calculateCosts({
    notionalUsd,
    gasPriceWei: gasPrice.value.gasPrice ?? gasPrice.value.maxFeePerGas ?? 0n,
    avaxPriceUsd
  });
  const netAfterCostsUsd = quoteB.ok ? grossProfitUsd - costs.totalCostUsd : null;
  const netAfterCostsPct = netAfterCostsUsd === null ? null : netAfterCostsUsd / notionalUsd;
  const spreadDecayUsd = baseSample ? grossProfitUsd - baseSample.gross_profit_usd : null;
  const requotedNetAfterCostsUsd = delayBucketMs > 0 ? netAfterCostsUsd : null;
  const survivedDelay = delayBucketMs > 0 && netAfterCostsUsd !== null && netAfterCostsUsd > 0;
  const quoteErrorClass = [quoteA.errorClass, quoteB.errorClass].filter(Boolean).join("|") || null;
  const blockTimestampMs = block.value?.timestamp ? block.value.timestamp * 1000 : null;
  const blockLagMs = blockTimestampMs ? tsLocalEndMs - blockTimestampMs : null;

  return {
    sample_id: cycleId,
    status: "research-only-no-live-execution",
    ts_local_start_ms: tsLocalStartMs,
    ts_local_end_ms: tsLocalEndMs,
    chain: config.chain,
    chain_id: config.chainId,
    provider_id: providerConfig.id,
    rpc_url_class: providerConfig.rpcUrlClass,
    block_number_start: blockBeforeQuote.value ?? null,
    block_number_end: blockAfterQuote.value ?? null,
    block_timestamp: block.value?.timestamp ?? null,
    block_lag_ms: blockLagMs,
    btc_gate: factorContext.btc_gate,
    btc_gate_reason: factorContext.btc_gate_reason,
    btc_last_price: factorContext.btc_last_price,
    eth_major_state: factorContext.eth_major_state,
    leader_asset: null,
    leader_impulse_window: null,
    follower_token: "WAVAX",
    factor_class: "none",
    pair: config.pair,
    notional_usd: notionalUsd,
    token_in: "USDC",
    token_mid: "WAVAX",
    token_out: "USDC",
    buy_venue: buyVenue.id,
    sell_venue: sellVenue.id,
    buy_pool: buyVenue.poolHint ?? null,
    sell_pool: sellVenue.poolHint ?? null,
    buy_amm_type: buyVenue.type,
    sell_amm_type: sellVenue.type,
    route_direction: "USDC_to_WAVAX_to_USDC",
    quote_a_start_ms: quoteAStartMs,
    quote_a_end_ms: quoteAEndMs,
    quote_a_latency_ms: quoteAEndMs - quoteAStartMs,
    quote_b_start_ms: quoteBStartMs,
    quote_b_end_ms: quoteBEndMs,
    quote_b_latency_ms: quoteBEndMs - quoteBStartMs,
    roundtrip_latency_ms: quoteBEndMs - quoteAStartMs,
    cycle_latency_ms: tsLocalEndMs - tsLocalStartMs,
    quote_error_class: quoteErrorClass,
    amount_in: amountIn.toString(),
    amount_mid: quoteA.ok ? quoteA.amountOut.toString() : null,
    amount_out: quoteB.ok ? quoteB.amountOut.toString() : null,
    gross_output_usd: round(grossOutputUsd, 8),
    gross_profit_usd: round(grossProfitUsd, 8),
    gross_spread_pct: round(grossProfitUsd / notionalUsd, 8),
    gas_units_est: config.estimatedGasUnits,
    base_fee_gwei: round(Number(gasPrice.value.gasPrice ?? 0n) / 1e9, 6),
    priority_tip_gwei: null,
    l1_data_fee_usd: 0,
    gas_cost_usd: costs.gasCostUsd,
    priority_or_bribe_cost_usd: costs.priorityOrBribeCostUsd,
    flashloan_fee_usd: 0,
    simulation_failure_budget_usd: costs.simulationFailureBudgetUsd,
    revert_failure_budget_usd: costs.revertFailureBudgetUsd,
    stale_state_drift_usd: costs.staleStateDriftUsd,
    mev_competition_haircut_usd: costs.mevCompetitionHaircutUsd,
    infra_hurdle_allocated_usd: 0,
    net_after_costs_usd: netAfterCostsUsd === null ? null : round(netAfterCostsUsd, 8),
    net_after_costs_pct: netAfterCostsPct === null ? null : round(netAfterCostsPct, 8),
    cost_model_version: config.costModelVersion,
    delay_bucket: delayBucketMs === 0 ? "0s" : `${delayBucketMs}ms`,
    requoted_amount_out: delayBucketMs > 0 && quoteB.ok ? quoteB.amountOut.toString() : null,
    requoted_net_after_costs_usd: requotedNetAfterCostsUsd === null ? null : round(requotedNetAfterCostsUsd, 8),
    spread_decay_usd: spreadDecayUsd === null ? null : round(spreadDecayUsd, 8),
    spread_decay_pct: spreadDecayUsd === null ? null : round(spreadDecayUsd / notionalUsd, 8),
    survived_delay: survivedDelay,
    sample_label: labelSample({ quoteB, grossProfitUsd, netAfterCostsUsd, survivedDelay, delayBucketMs }),
    kill_reason: killReason({ quoteErrorClass, netAfterCostsUsd, delayBucketMs, survivedDelay }),
    data_quality_flags: dataQualityFlags({ blockLagMs, quoteErrorClass, blockBeforeQuote, blockAfterQuote })
  };
}

async function quoteVenue(provider, venue, tokenInSymbol, tokenOutSymbol, amountIn) {
  try {
    if (venue.type === "v3") {
      const quoter = new Contract(venue.quoter, V3_QUOTER_ABI, provider);
      const result = await withTimeout(quoter.quoteExactInputSingle.staticCall({
        tokenIn: config.tokens[tokenInSymbol].address,
        tokenOut: config.tokens[tokenOutSymbol].address,
        amountIn,
        fee: venue.fee,
        sqrtPriceLimitX96: 0n
      }), REQUEST_TIMEOUT_MS, `${venue.id}_v3_quote_timeout`);
      return { ok: true, amountOut: result[0], errorClass: null };
    }

    if (venue.type === "lb") {
      const quoter = new Contract(venue.quoter, LB_QUOTER_ABI, provider);
      const result = await withTimeout(quoter.findBestPathFromAmountIn(
        [config.tokens[tokenInSymbol].address, config.tokens[tokenOutSymbol].address],
        amountIn
      ), REQUEST_TIMEOUT_MS, `${venue.id}_lb_quote_timeout`);
      const amounts = result.amounts ?? result[4];
      return { ok: true, amountOut: amounts[amounts.length - 1], errorClass: null };
    }

    return { ok: false, amountOut: 0n, errorClass: `unsupported_venue_type_${venue.type}` };
  } catch (error) {
    return { ok: false, amountOut: 0n, errorClass: classifyError(error) };
  }
}

async function fetchAvaxPriceUsd(provider) {
  const oneAvax = parseUnits("1", config.tokens.WAVAX.decimals);
  for (const venue of config.venues) {
    const quote = await quoteVenue(provider, venue, "WAVAX", "USDC", oneAvax);
    if (quote.ok && quote.amountOut > 0n) {
      return Number(formatUnits(quote.amountOut, config.tokens.USDC.decimals));
    }
  }
  return 25;
}

async function timed(label, fn) {
  const start = Date.now();
  try {
    const value = await withTimeout(fn(), REQUEST_TIMEOUT_MS, `${label}_timeout`);
    return { ok: true, value, latencyMs: Date.now() - start, errorClass: null };
  } catch (error) {
    return { ok: false, value: null, latencyMs: Date.now() - start, errorClass: classifyError(error) };
  }
}

async function withTimeout(promise, timeoutMs, label) {
  let timeout;
  try {
    return await Promise.race([
      promise,
      new Promise((_, reject) => {
        timeout = setTimeout(() => reject(new Error(label)), timeoutMs);
      })
    ]);
  } finally {
    clearTimeout(timeout);
  }
}

function orderedVenuePairs(venues) {
  const pairs = [];
  for (const buyVenue of venues) {
    for (const sellVenue of venues) {
      if (buyVenue.id !== sellVenue.id) pairs.push([buyVenue, sellVenue]);
    }
  }
  return pairs;
}

function calculateCosts({ notionalUsd, gasPriceWei, avaxPriceUsd }) {
  const gasCostUsd = Number(gasPriceWei * BigInt(config.estimatedGasUnits)) / 1e18 * avaxPriceUsd;
  const priorityOrBribeCostUsd = Math.max(
    gasCostUsd * config.costProxy.priorityOrBribeGasMultiplier,
    config.costProxy.minimumPriorityOrBribeUsd
  );
  const simulationFailureBudgetUsd = notionalUsd * config.costProxy.simulationFailurePct;
  const revertFailureBudgetUsd = notionalUsd * config.costProxy.revertFailurePct;
  const staleStateDriftUsd = notionalUsd * config.costProxy.staleDriftPct;
  const mevCompetitionHaircutUsd = notionalUsd * config.costProxy.mevCompetitionHaircutPct;
  const totalCostUsd = gasCostUsd + priorityOrBribeCostUsd + simulationFailureBudgetUsd +
    revertFailureBudgetUsd + staleStateDriftUsd + mevCompetitionHaircutUsd;

  return {
    gasCostUsd: round(gasCostUsd, 8),
    priorityOrBribeCostUsd: round(priorityOrBribeCostUsd, 8),
    simulationFailureBudgetUsd: round(simulationFailureBudgetUsd, 8),
    revertFailureBudgetUsd: round(revertFailureBudgetUsd, 8),
    staleStateDriftUsd: round(staleStateDriftUsd, 8),
    mevCompetitionHaircutUsd: round(mevCompetitionHaircutUsd, 8),
    totalCostUsd: round(totalCostUsd, 8)
  };
}

function labelSample({ quoteB, grossProfitUsd, netAfterCostsUsd, survivedDelay, delayBucketMs }) {
  if (!quoteB.ok) return "killed";
  if (delayBucketMs > 0 && survivedDelay) return "latency_survived";
  if (netAfterCostsUsd > 0) return "post_cost_positive";
  if (grossProfitUsd > 0) return "executable_quote_positive";
  return "gross_spread_only";
}

function killReason({ quoteErrorClass, netAfterCostsUsd, delayBucketMs, survivedDelay }) {
  if (quoteErrorClass) return quoteErrorClass;
  if (delayBucketMs > 0 && !survivedDelay) return "positive_did_not_survive_delay_or_never_positive";
  if (netAfterCostsUsd <= 0) return "not_positive_after_v0_proxy_costs";
  return null;
}

function dataQualityFlags({ blockLagMs, quoteErrorClass, blockBeforeQuote, blockAfterQuote }) {
  const flags = [];
  if (quoteErrorClass) flags.push("quote_error");
  if (blockLagMs !== null && blockLagMs > 8000) flags.push("block_lag_gt_8s");
  if (blockBeforeQuote.ok && blockAfterQuote.ok && Math.abs(blockAfterQuote.value - blockBeforeQuote.value) > 2) {
    flags.push("provider_head_moved_gt_2_blocks_during_cycle");
  }
  if (!blockBeforeQuote.ok || !blockAfterQuote.ok) flags.push("block_number_error");
  return flags;
}

async function fetchFactorContext() {
  try {
    const [btc, eth] = await Promise.all([
      fetchBinanceKlines("BTCUSDT"),
      fetchBinanceKlines("ETHUSDT")
    ]);
    return {
      btc_gate: classifyBtcGate(btc),
      btc_gate_reason: btc.reason,
      btc_last_price: btc.last,
      eth_major_state: classifyMajorState(eth),
      source: "binance_public_rest_1m_30"
    };
  } catch (error) {
    return {
      btc_gate: "BTC_STALE",
      btc_gate_reason: `factor_context_fetch_failed:${classifyError(error)}`,
      btc_last_price: null,
      eth_major_state: "ETH_STALE",
      source: "binance_public_rest_1m_30"
    };
  }
}

async function fetchBinanceKlines(symbol) {
  const url = `https://api.binance.com/api/v3/klines?symbol=${symbol}&interval=1m&limit=30`;
  const response = await withTimeout(fetch(url), REQUEST_TIMEOUT_MS, `${symbol}_klines_timeout`);
  if (!response.ok) throw new Error(`${symbol}_klines_http_${response.status}`);
  const rows = await response.json();
  const closes = rows.map((row) => Number(row[4])).filter(Number.isFinite);
  const last = closes.at(-1);
  const first = closes[0];
  const high = Math.max(...closes);
  const low = Math.min(...closes);
  return {
    symbol,
    last,
    first,
    high,
    low,
    changePct: first ? (last - first) / first : 0,
    highDistancePct: high ? (high - last) / high : null,
    lowDistancePct: low ? (last - low) / low : null,
    reason: `${symbol} 30m change ${round(first ? (last - first) / first : 0, 6)}, highDist ${round(high ? (high - last) / high : 0, 6)}, lowDist ${round(low ? (last - low) / low : 0, 6)}`
  };
}

function classifyBtcGate(snapshot) {
  if (!snapshot.last) return "BTC_STALE";
  if (snapshot.changePct > 0.003 && snapshot.highDistancePct < 0.0015) return "BTC_RISK_ON";
  if (snapshot.changePct < -0.003 && snapshot.lowDistancePct < 0.0015) return "BTC_RISK_OFF";
  return "BTC_TRANSITION";
}

function classifyMajorState(snapshot) {
  if (!snapshot.last) return "ETH_STALE";
  if (snapshot.changePct > 0.003) return "ETH_UP";
  if (snapshot.changePct < -0.003) return "ETH_DOWN";
  return "ETH_MIXED";
}

function summarize(rows) {
  const groups = groupBy(rows, (row) => [row.provider_id, row.buy_venue, row.sell_venue, row.notional_usd].join("|"));
  const groupSummaries = [...groups.entries()].map(([key, groupRows]) => ({
    key,
    provider_id: groupRows[0].provider_id,
    route: `${groupRows[0].buy_venue}->${groupRows[0].sell_venue}`,
    notional_usd: groupRows[0].notional_usd,
    samples: groupRows.length,
    quote_success_rate: round(groupRows.filter((row) => !row.quote_error_class).length / groupRows.length, 6),
    p50_cycle_latency_ms: percentile(groupRows.map((row) => row.cycle_latency_ms), 50),
    p95_cycle_latency_ms: percentile(groupRows.map((row) => row.cycle_latency_ms), 95),
    p99_cycle_latency_ms: percentile(groupRows.map((row) => row.cycle_latency_ms), 99),
    median_block_lag_ms: percentile(groupRows.map((row) => row.block_lag_ms).filter(Number.isFinite), 50),
    p95_block_lag_ms: percentile(groupRows.map((row) => row.block_lag_ms).filter(Number.isFinite), 95),
    post_cost_positive_count: groupRows.filter((row) => row.sample_label === "post_cost_positive").length,
    latency_survived_count: groupRows.filter((row) => row.sample_label === "latency_survived").length,
    median_net_after_costs_usd: percentile(groupRows.map((row) => row.net_after_costs_usd).filter(Number.isFinite), 50),
    best_net_after_costs_usd: round(Math.max(...groupRows.map((row) => row.net_after_costs_usd).filter(Number.isFinite)), 8),
    kill_reasons: countBy(groupRows, (row) => row.kill_reason ?? "none"),
    data_quality_flags: countFlags(groupRows.flatMap((row) => row.data_quality_flags))
  }));

  const postCostPositive = rows.filter((row) => row.sample_label === "post_cost_positive").length;
  const latencySurvived = rows.filter((row) => row.sample_label === "latency_survived").length;
  return {
    generatedAt: new Date().toISOString(),
    status: "research-only-no-live-execution",
    purpose: "read-only Avalanche WAVAX/USDC e2e quote-latency and stale-state baseline",
    config: {
      chain: config.chain,
      chainId: config.chainId,
      pair: config.pair,
      providers: config.providers.map((provider) => ({ id: provider.id, rpcUrlClass: provider.rpcUrlClass })),
      venues: config.venues.map((venue) => ({ id: venue.id, type: venue.type })),
      notionalsUsd: config.notionalsUsd,
      delayBucketsMs: config.delayBucketsMs,
      costModelVersion: config.costModelVersion
    },
    factorContext: rows[0] ? {
      btc_gate: rows[0].btc_gate,
      btc_gate_reason: rows[0].btc_gate_reason,
      btc_last_price: rows[0].btc_last_price,
      eth_major_state: rows[0].eth_major_state,
      factor_class: rows[0].factor_class
    } : null,
    totals: {
      samples: rows.length,
      quoteErrors: rows.filter((row) => row.quote_error_class).length,
      postCostPositive,
      latencySurvived,
      providers: new Set(rows.map((row) => row.provider_id)).size,
      routes: new Set(rows.map((row) => `${row.buy_venue}->${row.sell_venue}`)).size
    },
    groups: groupSummaries,
    decision: decide(rows, { postCostPositive, latencySurvived })
  };
}

function decide(rows, totals) {
  if (!rows.length) {
    return {
      verdict: "blocked_no_samples",
      rationale: "No samples were collected.",
      noLiveChange: true
    };
  }
  if (totals.latencySurvived > 0) {
    return {
      verdict: "extend_measurement_only",
      rationale: "At least one v0 post-cost positive sample survived a delay bucket. This only justifies a longer read-only run with stricter data-quality checks.",
      noLiveChange: true
    };
  }
  if (totals.postCostPositive > 0) {
    return {
      verdict: "retest_delay_buckets",
      rationale: "At least one immediate v0 post-cost positive sample appeared, but none survived delay buckets in this tiny baseline.",
      noLiveChange: true
    };
  }
  return {
    verdict: "no_positive_after_v0_costs_in_tiny_baseline",
    rationale: "This tiny baseline found no post-cost-positive route after conservative v0 proxy costs. It is not a final kill, but it blocks promotion.",
    noLiveChange: true
  };
}

function renderMarkdown(summary) {
  const lines = [
    "# E2E Latency Baseline",
    "",
    `Generated: ${summary.generatedAt}`,
    "",
    "Status: research-only, read-only measurement. No live trading, private keys, tx signing, bundle submission, paid infra, scheduler change, alert wording change, risk/sizing/TP/SL change, or execution path.",
    "",
    "## Decision",
    "",
    `- Verdict: ${summary.decision.verdict}`,
    `- Rationale: ${summary.decision.rationale}`,
    `- No live change: ${summary.decision.noLiveChange}`,
    "",
    "## Scope",
    "",
    `- Chain: ${summary.config.chain} (${summary.config.chainId})`,
    `- Pair: ${summary.config.pair}`,
    `- Providers: ${summary.config.providers.map((provider) => provider.id).join(", ")}`,
    `- Venues: ${summary.config.venues.map((venue) => `${venue.id}/${venue.type}`).join(", ")}`,
    `- Notionals: ${summary.config.notionalsUsd.map((value) => `$${value}`).join(", ")}`,
    `- Delay buckets: ${summary.config.delayBucketsMs.map((value) => `${value}ms`).join(", ")}`,
    `- Cost model: ${summary.config.costModelVersion}`,
    "",
    "## Factor Context",
    "",
    `- BTC gate: ${summary.factorContext?.btc_gate ?? "n/a"}`,
    `- BTC reason: ${summary.factorContext?.btc_gate_reason ?? "n/a"}`,
    `- ETH/major state: ${summary.factorContext?.eth_major_state ?? "n/a"}`,
    `- Factor class: ${summary.factorContext?.factor_class ?? "none"}`,
    "",
    "## Totals",
    "",
    `- Samples: ${summary.totals.samples}`,
    `- Quote errors: ${summary.totals.quoteErrors}`,
    `- Post-cost positives: ${summary.totals.postCostPositive}`,
    `- Latency survived: ${summary.totals.latencySurvived}`,
    "",
    "## Route Groups",
    ""
  ];

  for (const group of summary.groups) {
    lines.push(
      `- ${group.key}: samples=${group.samples}, success=${group.quote_success_rate}, ` +
      `p50=${group.p50_cycle_latency_ms}ms, p95=${group.p95_cycle_latency_ms}ms, ` +
      `medianBlockLag=${group.median_block_lag_ms}ms, bestNet=${group.best_net_after_costs_usd}, ` +
      `postCost=${group.post_cost_positive_count}, survived=${group.latency_survived_count}, ` +
      `killReasons=${JSON.stringify(group.kill_reasons)}`
    );
  }

  lines.push(
    "",
    "## Interpretation",
    "",
    "- This is a tiny access-path baseline, not a strategy result.",
    "- Gross quote mismatches are discovery/debug signals only.",
    "- Any extension still needs longer sampling, provider disagreement checks, exact quoter/pool sanity, and the historical/live timing join before an execution-research label."
  );

  return `${lines.join("\n")}\n`;
}

function groupBy(rows, keyFn) {
  const groups = new Map();
  for (const row of rows) {
    const key = keyFn(row);
    if (!groups.has(key)) groups.set(key, []);
    groups.get(key).push(row);
  }
  return groups;
}

function countBy(rows, keyFn) {
  const counts = {};
  for (const row of rows) {
    const key = keyFn(row);
    counts[key] = (counts[key] ?? 0) + 1;
  }
  return counts;
}

function countFlags(flags) {
  const counts = {};
  for (const flag of flags) counts[flag] = (counts[flag] ?? 0) + 1;
  return counts;
}

function percentile(values, p) {
  const sorted = values.filter(Number.isFinite).sort((a, b) => a - b);
  if (!sorted.length) return null;
  const rank = (p / 100) * (sorted.length - 1);
  const lower = Math.floor(rank);
  const upper = Math.ceil(rank);
  if (lower === upper) return round(sorted[lower], 6);
  const weight = rank - lower;
  return round(sorted[lower] * (1 - weight) + sorted[upper] * weight, 6);
}

function classifyError(error) {
  const text = `${error?.code ?? ""}:${error?.shortMessage ?? error?.message ?? error}`.toLowerCase();
  if (text.includes("timeout")) return "timeout";
  if (text.includes("execution reverted")) return "execution_reverted";
  if (text.includes("missing revert data")) return "missing_revert_data";
  if (text.includes("call_exception")) return "call_exception";
  if (text.includes("rate") || text.includes("429")) return "rate_limited";
  return "rpc_or_quote_error";
}

function round(value, digits = 6) {
  if (!Number.isFinite(value)) return null;
  const scale = 10 ** digits;
  return Math.round(value * scale) / scale;
}
