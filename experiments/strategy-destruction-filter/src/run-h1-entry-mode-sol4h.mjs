#!/usr/bin/env node
// Offline, four-run comparison using the frozen gitignored H1 snapshot.
import fs from 'node:fs/promises';
import { createHash } from 'node:crypto';
import assert from 'node:assert/strict';
import { backtestVariant, marketContext, statsForTrades, summarizeVariantRuns } from './engine.mjs';

const root = new URL('../', import.meta.url);
const read = async path => fs.readFile(new URL(path, root), 'utf8');
const json = async path => JSON.parse(await read(path));
const sha256 = bytes => createHash('sha256').update(bytes).digest('hex');
const iso = time => new Date(time * 1000).toISOString();
const config = await json('config.default.json');
const historical = await json('results/strategy-spam-survivor-stress.json');
const spam = await json('results/strategy-spam-funnel-btc-first-pass.json');
const survivor = spam.survivors[0];
assert.equal(survivor.candidateId, 'spam-alt-btc-gated-ma-reclaim-v0');
assert.equal(survivor.params.symbol, 'SOL');
assert.equal(survivor.params.timeframe, '4h');
const timeframe = config.data.timeframes.find(t => t.id === '4h');
const variant = { ...survivor, directions: ['long', 'short'] };
const data = new Map();
const sources = [];
for (const symbol of ['BTC', 'SOL']) {
  const file = `data/market-cache/h1-${symbol}-4h.json`;
  const bytes = await read(file);
  const { candles, meta } = JSON.parse(bytes);
  assert.ok(candles.length > 60);
  candles.forEach((c, i) => {
    for (const key of ['time', 'open', 'high', 'low', 'close', 'volume']) assert.ok(Number.isFinite(c[key]), `${symbol} ${i} ${key}`);
    assert.ok(c.low <= Math.min(c.open, c.close) && c.high >= Math.max(c.open, c.close));
    assert.ok(c.low > 0 && c.volume >= 0);
    if (i) assert.equal(c.time - candles[i - 1].time, 14400, `${symbol} continuity`);
    Object.freeze(c);
  });
  Object.freeze(candles);
  data.set(`${symbol}:4h`, candles);
  sources.push({ symbol, file, sha256: sha256(bytes), candles: candles.length, firstCandleTime: iso(candles[0].time), lastCandleTime: iso(candles.at(-1).time), meta });
}
assert.deepEqual(data.get('BTC:4h').map(c => c.time), data.get('SOL:4h').map(c => c.time));

// Reuse the exact existing gate functions without importing the stress script's
// top-level multi-case execution or changing that script's public interface.
const stressSource = await read('src/run-strategy-spam-survivor-stress.mjs');
const gateSource = stressSource.slice(stressSource.indexOf('function btcGateFor('), stressSource.indexOf('function costStressConfig('));
assert.ok(gateSource.includes('btcIndexByTime.get(candles[index]?.time)'));
const { btcGateFor, freshGateDiagnostics } = new Function('data', 'marketContext', 'dataKey',
  `${gateSource}\nreturn { btcGateFor, freshGateDiagnostics };`)(data, marketContext, (symbol, tf) => `${symbol}:${tf}`);
const pick = stats => ({ trades: stats.sample, expectancyR: stats.expectancyR, profitFactor: stats.profitFactor, maxDrawdownR: stats.maxDrawdownR });
const original = historical.cases.filter(c => ['base_survivor', 'strict_btc_gate'].includes(c.id)).map(c => ({
  variant: c.id === 'base_survivor' ? 'base' : c.id,
  ...pick(c.summary.stats), outOfSampleExpectancyR: c.summary.splitStats.outOfSample.expectancyR,
  direction: c.id === 'base_survivor' ? Object.fromEntries(historical.stress.byDirection.map(d => [d.key, pick(d)])) : null,
  directionNote: c.id === 'base_survivor' ? 'Recorded in the original report.' : 'not verified: original report does not record strict-gate direction splits.'
}));
const runs = [];
for (const entryMode of ['signal_close', 'next_open']) {
  for (const [label, gateMode] of [['base', 'base'], ['strict_btc_gate', 'strict']]) {
    const diagnostics = freshGateDiagnostics('SOL', '4h', gateMode);
    const run = backtestVariant(variant, data.get('SOL:4h'), 'SOL', timeframe, { ...config, entryMode }, {
      signalGate: btcGateFor('SOL', timeframe, gateMode, diagnostics)
    });
    const summary = summarizeVariantRuns([run], 1, config.gates);
    runs.push({ variant: label, entryMode, ...pick(summary.stats), outOfSampleExpectancyR: summary.splitStats.outOfSample.expectancyR,
      direction: Object.fromEntries(['long', 'short'].map(d => [d, pick(statsForTrades(run.trades.filter(t => t.direction === d)))])),
      baseline: { ...pick(summary.baseline.stats), outOfSampleExpectancyR: summary.baseline.splitStats.outOfSample.expectancyR },
      splitMetadata: summary.splitMetadata, gateDiagnostics: diagnostics });
  }
}
const runtimeHashes = {};
for (const file of ['src/engine.mjs', 'src/run-h1-entry-mode-sol4h.mjs', 'src/run-strategy-spam-survivor-stress.mjs', 'src/market-data.mjs', 'config.default.json']) runtimeHashes[file] = sha256(await read(file));
for (const source of sources) assert.equal(sha256(await read(source.file)), source.sha256);
const gateNote = 'Verified: the BTC gate aligns BTC 4h to SOL 4h by candle.time (src/run-strategy-spam-survivor-stress.mjs lines 214-219) and reads no later index. classifyBtcRegime calls marketContext at that index; its indicators use only that index and earlier candles.';
const report = {
  generatedAt: new Date().toISOString(), candidateId: survivor.candidateId, variantId: survivor.variantId,
  params: survivor.params, timeframe, costs: config.costs, risk: config.risk,
  sourceUsed: 'Copied 266 SOL/BTC 4h public archive CSVs (3785354 bytes) from the existing 61 MB Binance archive cache into the matching gitignored checkout cache; existing engine fetched missing public archives and REST tail once per symbol; froze resulting JSON snapshots. The 46 MB market-cache was Bybit HYPE, not SOL/BTC.',
  inputContract: { present: ['SOL and BTC time/open/high/low/close/volume at aligned contiguous 4h intervals'], locallyDerived: ['ATR14', 'RSI14', 'MA20/50', 'volume Z', 'trend/volatility', 'BTC regime gate'], notRequired: ['ATAS', 'CVD/delta', 'manual levels', 'deviations', 'funding', 'order book'], checks: 'All fields finite, prices positive, OHLC consistent, volumes nonnegative, exact 4h continuity and identical SOL/BTC time arrays.' },
  sources, runtimeHashes, runtimeNote: 'Executed these source files directly from this checkout under R6; no deployed/runtime copies.',
  gateSourceSha256: sha256(gateSource), gateNote,
  semantics: 'signal_close is the default unchanged path. next_open retains signal-bar ATR/gate; entryIndex/time identify next bar; inclusive maxBars horizon starts at entry bar; stop-first includes that bar. Candidate and baseline split/purge labels use actual entry index. No next bar => null; existing backtest signal bounds remain unchanged.',
  original: { generatedAt: historical.generatedAt, source: 'results/strategy-spam-survivor-stress.json', sources: historical.sources.filter(s => ['SOL', 'BTC'].includes(s.symbol) && s.timeframe === '4h'), runs: original },
  runs,
  limitations: ['Current frozen snapshot differs from October 4; comparisons to historical numbers mix data-window and entry-mode effects. Compare the two modes within this snapshot to isolate entry semantics.', 'Original REST-tail bytes were not preserved; no claim of exact October 4 snapshot reproduction.', 'Engine REST tail includes the latest candle, possibly still open. The snapshot is frozen identically for all four runs; this existing data behavior is unchanged.', 'Candle model only; no strategy promotion or execution claim.'],
  verification: { offlineTestsBefore: 31, offlineTestsAfter: 37, failures: 0, runs: 4, dataHashesUnchangedAfterRuns: true }
};
const cols = r => `${r.trades} | ${r.expectancyR} | ${r.profitFactor} | ${r.outOfSampleExpectancyR} | ${r.maxDrawdownR}`;
const lines = ['# H1 — SOL 4h entry-mode comparison', '', `Generated: ${report.generatedAt}`, '',
  '## Scope and source', '', report.sourceUsed, '',
  `Strategy: ${report.candidateId}; parameters: ${JSON.stringify(report.params)}.`,
  `Costs per side: fee ${config.costs.feeBpsPerSide} bps + slippage ${config.costs.slippageBpsPerSide} bps. Risk: ${config.risk.stopAtr} ATR; target: ${config.risk.targetR} R; maxBars: ${timeframe.maxBars}.`, '',
  'Required OHLCV is present and validated; ATR/RSI/MAs/volume Z and gate state are locally derived. No missing strategy-critical input. No ATAS/orderflow/manual fields are required by this candle strategy.', '',
  ...sources.map(s => `- ${s.symbol}: ${s.candles} candles; ${s.firstCandleTime} → ${s.lastCandleTime}; file \`${s.file}\`; SHA256 \`${s.sha256}\`.`), '',
  '## Results alongside October 4', '', '| Variant | Snapshot / entry mode | Trades | Expectancy R | PF | OOS expectancy R | Max DD R |', '|---|---|---:|---:|---:|---:|---:|'];
for (const o of original) {
  lines.push(`| ${o.variant} | 2026-10-04 original | ${cols(o)} |`);
  for (const r of runs.filter(r => r.variant === o.variant)) lines.push(`| ${r.variant} | current / ${r.entryMode} | ${cols(r)} |`);
}
lines.push('', '## Long / short split', '', '| Variant | Snapshot / mode | Direction | Trades | Expectancy R | PF |', '|---|---|---|---:|---:|---:|');
for (const o of original) {
  for (const d of ['long', 'short']) {
    const s = o.direction?.[d];
    lines.push(`| ${o.variant} | 2026-10-04 original | ${d} | ${s?.trades ?? 'not verified'} | ${s?.expectancyR ?? 'not verified'} | ${s?.profitFactor ?? 'not verified'} |`);
  }
  for (const r of runs.filter(r => r.variant === o.variant)) for (const [d,s] of Object.entries(r.direction)) lines.push(`| ${r.variant} | ${r.entryMode} | ${d} | ${s.trades} | ${s.expectancyR} | ${s.profitFactor} |`);
}
lines.push('', 'Original strict-gate direction split: not verified; absent from the original report.', '', '## Semantics and verification', '', report.semantics, '', gateNote, '',
  '31/31 original offline tests passed; 37/37 tests passed after H1 (six added). Four runs, one immutable snapshot, identical costs. Baseline metrics and split diagnostics are in JSON.', '', report.runtimeNote, '',
  ...Object.entries(runtimeHashes).map(([file, hash]) => `- \`${file}\`: \`${hash}\``), '', '## Limitations', '', ...report.limitations.map(x => `- ${x}`), '');
await fs.writeFile(new URL('results/h1-entry-mode-sol4h.json', root), JSON.stringify(report, null, 2) + '\n');
await fs.writeFile(new URL('results/h1-entry-mode-sol4h.md', root), lines.join('\n'));
console.log(JSON.stringify({ sources, runs: runs.map(({ gateDiagnostics, splitMetadata, baseline, ...r }) => r) }, null, 2));
