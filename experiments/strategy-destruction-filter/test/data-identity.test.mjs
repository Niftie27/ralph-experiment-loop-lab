// F1a-1: exchange, market type and contract are part of every snapshot lookup and registry identity.
import test from 'node:test';
import assert from 'node:assert/strict';
import fs from 'node:fs';
import os from 'node:os';
import path from 'node:path';
import { PERIODS, freezeSeries, cachedSeries, sha256, appendRegistry, registryRows, guardHoldout, identityFor,
  instrumentFor, instrumentForSymbol, instrumentOf, sameInstrument } from '../src/h2-contract.mjs';
import { backtestVariant } from '../src/engine.mjs';
import { fetchConfiguredCandles } from '../src/market-data.mjs';
const root = new URL('../', import.meta.url);
const read = f => JSON.parse(fs.readFileSync(new URL(f, root), 'utf8'));
const start = Date.parse(PERIODS.research[0]) / 1000;
const end = Date.parse(PERIODS.research[1]) / 1000;
const candle = (time, close = 101) => ({ time, open: 100, high: 102, low: 99, close, volume: 10 });
const SPOT = { exchange: 'binance', market: 'spot', contract: 'SOLUSDT' };
const USDM = { exchange: 'binance', market: 'linear_perpetual', contract: 'SOLUSDT' };
const BYBIT = { exchange: 'bybit', market: 'linear_perpetual', contract: 'SOLUSDT' };
function config() {
  const dir = fs.mkdtempSync(path.join(os.tmpdir(), 'data-identity-test-'));
  return { period: 'research', dataStart: PERIODS.research[0], dataEnd: PERIODS.research[1],
    entryMode: 'next_open', risk: { stopAtr: 1.2, targetR: 1.8 }, costs: { feeBpsPerSide: 4, slippageBpsPerSide: 3 },
    evaluation: { split: { method: 'purged_embargo_entry_time', inSampleRatio: 0.7 } },
    h2Paths: { cache: path.join(dir, 'cache'), manifest: path.join(dir, 'manifest.json'), registry: path.join(dir, 'registry.jsonl') } };
}
const holdout = c => ({ ...c, period: 'holdout', dataStart: PERIODS.holdout[0], dataEnd: PERIODS.holdout[1] });
const variant = { candidateId: 'fixture', variantId: 'fixture:base', family: 'fixture-family', rule: 'breakout', directions: ['long'], params: { lookback: 2, volumeZ: -10, rsiMinLong: 0 } };
const tf = { id: '4h', maxBars: 4 };
const withFinal = fn => { process.argv.push('--final'); try { return fn(); } finally { process.argv.pop(); } };

test('F1a-1 binance spot, bybit linear and binance USD-M perpetual are three distinct instruments', () => {
  const spot = instrumentFor({ symbol: 'BTC', binanceSpotSymbol: 'BTCUSDT' });
  const bybit = instrumentFor({ symbol: 'HYPE', provider: 'bybit-linear', bybitSymbol: 'HYPEUSDT' });
  const usdm = instrumentFor({ symbol: 'BTC', provider: 'binance-usdm', binanceUsdmSymbol: 'BTCUSDT' });
  assert.deepEqual(spot, { exchange: 'binance', market: 'spot', contract: 'BTCUSDT' });
  assert.deepEqual(bybit, { exchange: 'bybit', market: 'linear_perpetual', contract: 'HYPEUSDT' });
  assert.deepEqual(usdm, { exchange: 'binance', market: 'linear_perpetual', contract: 'BTCUSDT' });
  assert.ok(!sameInstrument(spot, usdm) && !sameInstrument(usdm, { ...bybit, contract: 'BTCUSDT' }) && sameInstrument(spot, { ...spot }));
  assert.throws(() => instrumentFor({ symbol: 'BTC', provider: 'other' }), /Unsupported market-data provider/);
  // Default stays Binance spot in F1a-1: the configured symbols resolve exactly as their providers say.
  const c = read('config.default.json');
  assert.deepEqual(instrumentForSymbol(c, 'SOL'), SPOT);
  assert.deepEqual(instrumentForSymbol(c, 'HYPE'), { exchange: 'bybit', market: 'linear_perpetual', contract: 'HYPEUSDT' });
  assert.deepEqual(instrumentForSymbol({}, 'SOL'), SPOT);
});

test('F1a-1 a spot snapshot cannot answer a futures request and the reverse', () => {
  const c = config();
  const spot = freezeSeries([candle(start)], 'SOL', '4h', c, SPOT);
  assert.equal(cachedSeries('SOL', '4h', c, USDM), null);
  assert.equal(cachedSeries('SOL', '4h', c, BYBIT), null);
  assert.equal(cachedSeries('SOL', '4h', c, SPOT).meta.sha256, spot.entry.sha256);
  // Different futures bytes for the same symbol, timeframe and window are a separate key, not a conflict.
  const usdm = freezeSeries([candle(start, 100.5)], 'SOL', '4h', c, USDM);
  assert.notEqual(usdm.entry.sha256, spot.entry.sha256);
  assert.deepEqual(cachedSeries('SOL', '4h', c, USDM).candles, [candle(start, 100.5)]);
  assert.deepEqual(cachedSeries('SOL', '4h', c, SPOT).candles, [candle(start)]);
  assert.deepEqual(instrumentOf(cachedSeries('SOL', '4h', c, USDM).meta), USDM);
  const futuresOnly = config();
  freezeSeries([candle(start)], 'SOL', '4h', futuresOnly, USDM);
  assert.equal(cachedSeries('SOL', '4h', futuresOnly, SPOT), null);
  assert.equal(cachedSeries('SOL', '4h', futuresOnly), null); // default request is Binance spot
  assert.throws(() => freezeSeries([candle(start, 100.7)], 'SOL', '4h', futuresOnly, USDM), /different bytes/);
});

test('F1a-1 the fixed loader never answers a futures symbol with spot bytes, or the reverse', async () => {
  const c = config(), input = path.join(path.dirname(c.h2Paths.registry), 'input.json');
  fs.writeFileSync(input, JSON.stringify({ candles: [candle(start - 1), candle(start), candle(end)] }));
  const spotSymbol = { symbol: 'SOL' }, usdmSymbol = { symbol: 'SOL', provider: 'binance-usdm', binanceUsdmSymbol: 'SOLUSDT' };
  // An unqualified input key is legacy Binance spot input; it never feeds a futures request.
  const spot = await fetchConfiguredCandles(spotSymbol, tf, { ...c, offline: true, snapshotInputs: { 'SOL:4h': input } });
  assert.deepEqual(instrumentOf(spot.meta), SPOT);
  await assert.rejects(fetchConfiguredCandles(usdmSymbol, tf, { ...c, offline: true, snapshotInputs: { 'SOL:4h': input } }), /No offline snapshot/);
  const other = config();
  const usdm = await fetchConfiguredCandles(usdmSymbol, tf, { ...other, offline: true, snapshotInputs: { 'binance:linear_perpetual:SOLUSDT:4h': input } });
  assert.deepEqual(instrumentOf(usdm.meta), USDM);
  assert.deepEqual((await fetchConfiguredCandles(usdmSymbol, tf, { ...other, offline: true })).candles, [candle(start)]);
  await assert.rejects(fetchConfiguredCandles(spotSymbol, tf, { ...other, offline: true }), /No offline snapshot/);
});

test('F1a-1 legacy manifest entries resolve only for Binance spot and are never rewritten', () => {
  const c = config(), bytes = JSON.stringify([candle(start)]) + '\n', hash = sha256(bytes);
  fs.mkdirSync(c.h2Paths.cache, { recursive: true });
  fs.writeFileSync(path.join(c.h2Paths.cache, `${hash}.json`), bytes);
  const legacy = { symbol: 'BTC', timeframe: '4h', dataStart: PERIODS.research[0], dataEnd: PERIODS.research[1], snapshot: `data/market-cache/h2/${hash}.json`,
    firstCandle: PERIODS.research[0], lastCandle: PERIODS.research[0], count: 1, sha256: hash };
  fs.writeFileSync(c.h2Paths.manifest, JSON.stringify({ schemaVersion: 1, periods: PERIODS, series: [legacy] }, null, 2) + '\n');
  const before = fs.readFileSync(c.h2Paths.manifest);
  const spotBtc = { ...SPOT, contract: 'BTCUSDT' };
  const found = cachedSeries('BTC', '4h', c, spotBtc);
  assert.equal(found.meta.sha256, hash);
  assert.deepEqual(instrumentOf(found.meta), spotBtc);
  assert.equal(cachedSeries('BTC', '4h', c).meta.sha256, hash);
  for (const other of [{ ...USDM, contract: 'BTCUSDT' }, { ...BYBIT, contract: 'BTCUSDT' }, { ...SPOT, contract: 'BTCUSDC' }]) assert.equal(cachedSeries('BTC', '4h', c, other), null);
  freezeSeries([candle(start)], 'BTC', '4h', c, spotBtc); // same key, same bytes: no new entry
  assert.deepEqual(fs.readFileSync(c.h2Paths.manifest), before);
  assert.throws(() => freezeSeries([candle(start, 100.5)], 'BTC', '4h', c, spotBtc), /different bytes/);
  freezeSeries([candle(start, 100.5)], 'BTC', '4h', c, { ...USDM, contract: 'BTCUSDT' });
  const series = JSON.parse(fs.readFileSync(c.h2Paths.manifest, 'utf8')).series;
  assert.deepEqual(series[0], legacy); // old entry kept first and byte-for-byte equal in content
  assert.deepEqual(instrumentOf(series[1]), { ...USDM, contract: 'BTCUSDT' });
  assert.throws(() => instrumentOf({ ...legacy, exchange: 'binance' }), /Incomplete data identity/);
});

test('F1a-1 committed H2 legacy data maps to Binance spot without changing a byte', () => {
  const manifestFile = new URL('results/manifest-h2.json', root), registryFile = new URL('results/variant-registry.jsonl', root);
  const manifestBefore = fs.readFileSync(manifestFile), registryBefore = fs.readFileSync(registryFile);
  const series = JSON.parse(manifestBefore).series;
  assert.equal(series.length, 2);
  for (const s of series) assert.deepEqual(instrumentOf(s), { exchange: 'binance', market: 'spot', contract: `${s.symbol}USDT` });
  const rows = registryRows(registryFile);
  assert.equal(rows.length, 400);
  for (const row of rows) assert.deepEqual(instrumentOf(row.identity), { exchange: 'binance', market: 'spot', contract: `${row.identity.symbol}USDT` });
  assert.deepEqual(fs.readFileSync(manifestFile), manifestBefore);
  assert.deepEqual(fs.readFileSync(registryFile), registryBefore);
});

test('F1a-1 the same variant gets different registry identities for spot and futures', () => {
  const c = config();
  const spot = identityFor(variant, 'SOL', tf, c, SPOT), usdm = identityFor(variant, 'SOL', tf, c, USDM), bybit = identityFor(variant, 'SOL', tf, c, BYBIT);
  assert.deepEqual(instrumentOf(spot), SPOT);
  assert.deepEqual(instrumentOf(usdm), USDM);
  assert.notDeepEqual(spot, usdm);
  assert.notDeepEqual(usdm, bybit);
  assert.deepEqual(identityFor(variant, 'SOL', tf, c), spot); // default stays Binance spot
});

test('F1a-1 legacy registry rows read as Binance spot; the unchanged holdout guard matches only the spot identity', () => {
  const c = holdout(config());
  const spot = identityFor(variant, 'SOL', tf, c, SPOT);
  const { exchange, market, contract, ...legacyIdentity } = spot;
  appendRegistry(c.h2Paths.registry, { identity: legacyIdentity, period: { name: 'research' } });
  const bytes = fs.readFileSync(c.h2Paths.registry);
  assert.deepEqual(instrumentOf(registryRows(c.h2Paths.registry)[0].identity), SPOT);
  assert.deepEqual(fs.readFileSync(c.h2Paths.registry), bytes);
  withFinal(() => {
    guardHoldout(c, spot);
    assert.throws(() => guardHoldout(c, identityFor(variant, 'SOL', tf, c, USDM)), /exact variant/);
    assert.throws(() => guardHoldout(c, identityFor(variant, 'SOL', tf, c, BYBIT)), /exact variant/);
  });
  appendRegistry(c.h2Paths.registry, { identity: { ...legacyIdentity, market: 'spot' }, period: { name: 'research' } });
  assert.throws(() => registryRows(c.h2Paths.registry), /Incomplete data identity/);
});

test('F1a-1 backtestVariant registers and freezes under the requested instrument', () => {
  const rows = Array.from({ length: 100 }, (_, i) => ({ time: end - (100 - i) * 14400, open: 100 + i, high: 102 + i, low: 99 + i, close: 102 + i, volume: 100 + i }));
  const c = config();
  backtestVariant(variant, rows, 'SOL', tf, c, { instrument: USDM });
  backtestVariant(variant, rows, 'SOL', tf, c);
  const [usdm, spot] = registryRows(c.h2Paths.registry);
  assert.deepEqual(instrumentOf(usdm.identity), USDM);
  assert.deepEqual(instrumentOf(usdm), USDM);
  assert.deepEqual(instrumentOf(spot.identity), SPOT);
  assert.ok(cachedSeries('SOL', '4h', c, USDM) && cachedSeries('SOL', '4h', c, SPOT));
});
