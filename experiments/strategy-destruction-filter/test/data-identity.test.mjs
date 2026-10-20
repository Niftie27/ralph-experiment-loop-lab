// F1a-1: exchange, market type and contract are part of every snapshot lookup and registry identity.
import test from 'node:test';
import assert from 'node:assert/strict';
import fs from 'node:fs';
import os from 'node:os';
import path from 'node:path';
import { PERIODS, freezeSeries, cachedSeries, sha256, appendRegistry, registryRows, guardHoldout, identityFor,
  instrumentFor, instrumentForSymbol, instrumentOf, sameInstrument, provenanceOf } from '../src/h2-contract.mjs';
import { backtestVariant } from '../src/engine.mjs';
import { fetchConfiguredCandles } from '../src/market-data.mjs';
import { buildQueue, validateQueue, researchConfig } from '../src/research-queue.mjs';
import { runQueue } from '../src/run-queue.mjs';
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

// Queue: every snapshot resolved for a queue item carries the item's instrument.
const queue = read('research-queue.json');
const baseConfig = researchConfig(read('config.default.json'));
const BTC_SPOT = { exchange: 'binance', market: 'spot', contract: 'BTCUSDT' };
const BTC_USDM = { exchange: 'binance', market: 'linear_perpetual', contract: 'BTCUSDT' };
const research = Array.from({ length: (end - start) / 14400 }, (_, i) => ({ time: start + i * 14400, open: 100, high: 102, low: 98, close: 100 + Math.sin(i), volume: 100 + i % 23 }));
function queueFixture(t, items) {
  const dir = fs.mkdtempSync(path.join(os.tmpdir(), 'data-identity-queue-'));
  t.after(() => fs.rmSync(dir, { recursive: true, force: true }));
  const resultsDir = path.join(dir, 'results'); fs.mkdirSync(resultsDir);
  const config = { ...baseConfig, h2Paths: { cache: path.join(dir, 'cache'), manifest: path.join(dir, 'manifest.json'), registry: path.join(dir, 'registry.jsonl') } };
  const configPath = path.join(dir, 'config.json'), queuePath = path.join(dir, 'queue.json');
  fs.writeFileSync(configPath, JSON.stringify(config));
  const write = list => fs.writeFileSync(queuePath, JSON.stringify({ ...queue, items: list.map(i => ({ ...i, status: 'pending' })) }));
  write(items);
  return { resultsDir, configPath, queuePath, config, write };
}
const legacyItem = () => structuredClone(queue.items[0]); // BTC 4h, no BTC gate, built before F1a-1

test('F1a-1 buildQueue looks up each symbol by its instrument and records it on every item', t => {
  const f = queueFixture(t, []), calls = [];
  freezeSeries(research, 'SOL', '4h', f.config, USDM); // futures bytes only: no spot SOL item may be built
  freezeSeries(research, 'BTC', '4h', f.config, BTC_SPOT);
  const q = buildQueue(f.config, read('candidates/seed-strategies.json'), (s, tfId, instrument) => { calls.push([s, instrument]); return cachedSeries(s, tfId, f.config, instrument); });
  for (const [s, instrument] of calls) assert.deepEqual(instrument, instrumentForSymbol(f.config, s));
  assert.deepEqual(new Set(calls.map(([s]) => s)), new Set(['BTC', 'ETH', 'SOL', 'HYPE']));
  assert.ok(q.items.length > 0 && q.items.every(i => i.symbol === 'BTC' && i.timeframe === '4h'));
  assert.ok(q.skipped.some(s => s.symbol === 'SOL' && s.timeframe === '4h' && s.reasons.includes('missing frozen research OHLCV')));
  for (const item of q.items) {
    assert.deepEqual(item.instrument, BTC_SPOT);
    assert.deepEqual(item.btcInstrument, item.btcSnapshotSha256 ? BTC_SPOT : null);
  }
  assert.ok(q.items.some(i => i.btcInstrument));
});

test('F1a-1 validateQueue rejects incomplete instruments and keeps legacy items valid', () => {
  assert.equal(validateQueue(queue), true);
  const gated = queue.items.findIndex(i => i.btcSnapshotSha256);
  for (const change of [q => { q.items[0].instrument = { exchange: 'binance' }; },
    q => { q.items[gated].instrument = BTC_USDM; },
    q => { q.items[gated].instrument = instrumentForSymbol(baseConfig, q.items[gated].symbol); q.items[gated].btcInstrument = { market: 'spot' }; }]) {
    const q = structuredClone(queue); change(q); assert.throws(() => validateQueue(q), /data identity/);
  }
});

test('F1a-1 the queue worker resolves only the item instrument; legacy items resolve only Binance spot', t => {
  const futures = { ...legacyItem(), instrument: BTC_USDM, btcInstrument: null };
  futures.candidate.dataRequirements.markets = ['linear_perpetual'];
  const f = queueFixture(t, [legacyItem()]);
  const usdm = freezeSeries(research, 'BTC', '4h', f.config, BTC_USDM);
  f.write([{ ...legacyItem(), snapshotSha256: usdm.entry.sha256 }]);
  const legacyRun = runQueue(f);
  assert.equal(legacyRun.exitCode, 1);
  assert.match(legacyRun.report.itemErrors[0].error, /missing frozen research OHLCV/);
  f.write([{ ...futures, snapshotSha256: usdm.entry.sha256 }]);
  const futuresRun = runQueue(f);
  assert.equal(futuresRun.exitCode, 0, JSON.stringify(futuresRun.report.itemErrors));
  assert.deepEqual(instrumentOf(registryRows(f.config.h2Paths.registry)[0].identity), BTC_USDM);
  // Same bytes under the spot key: the identity, not the content, decides.
  const spotOnly = queueFixture(t, []);
  spotOnly.write([{ ...futures, snapshotSha256: freezeSeries(research, 'BTC', '4h', spotOnly.config, BTC_SPOT).entry.sha256 }]);
  const spotRun = runQueue(spotOnly);
  assert.equal(spotRun.exitCode, 1);
  assert.match(spotRun.report.itemErrors[0].error, /missing frozen research OHLCV/);
});

// Provenance: every new manifest entry records where its candles came from, outside the key and the bytes.
const ARCHIVE = 'binance-vision-archive';
const checksums = [{ file: 'SOLUSDT-4h-2021-10.zip', sha256: 'a'.repeat(64) }];
const manifestSeries = c => JSON.parse(fs.readFileSync(c.h2Paths.manifest, 'utf8')).series;

test('F1a-1 a new manifest entry records its source; provenance changes neither the key nor the bytes', async () => {
  const rest = config(), archive = config(), plain = config();
  const a = freezeSeries([candle(start)], 'SOL', '4h', rest, SPOT, { source: 'binance-public-rest-fixed-window' });
  const b = freezeSeries([candle(start)], 'SOL', '4h', archive, USDM, { source: ARCHIVE, checksums });
  const d = freezeSeries([candle(start)], 'SOL', '4h', plain);
  assert.deepEqual(manifestSeries(rest)[0].provenance, { source: 'binance-public-rest-fixed-window' });
  assert.deepEqual(manifestSeries(archive)[0].provenance, { source: ARCHIVE, checksums });
  assert.deepEqual(manifestSeries(plain)[0].provenance, { source: 'caller-supplied' });
  assert.deepEqual(cachedSeries('SOL', '4h', archive, USDM).meta.provenance, { source: ARCHIVE, checksums });
  for (const frozen of [a, b, d]) assert.equal(frozen.entry.sha256, sha256(JSON.stringify([candle(start)]) + '\n'));
  // Same key and bytes from another source: no new entry, nothing rewritten; other bytes still conflict.
  const before = fs.readFileSync(rest.h2Paths.manifest);
  freezeSeries([candle(start)], 'SOL', '4h', rest, SPOT, { source: 'snapshot-input' });
  assert.deepEqual(fs.readFileSync(rest.h2Paths.manifest), before);
  assert.throws(() => freezeSeries([candle(start, 100.5)], 'SOL', '4h', rest, SPOT, { source: ARCHIVE, checksums }), /different bytes/);
  // The fixed loader and the engine pass their source on.
  const offline = config(), input = path.join(path.dirname(offline.h2Paths.registry), 'input.json');
  fs.writeFileSync(input, JSON.stringify({ candles: [candle(start)], meta: { source: 'binance-public-rest-fixed-window' } }));
  const loaded = await fetchConfiguredCandles({ symbol: 'SOL' }, tf, { ...offline, offline: true, snapshotInputs: { 'SOL:4h': input } });
  assert.deepEqual(loaded.meta.provenance, { source: 'snapshot-input' });
  assert.deepEqual(manifestSeries(offline)[0].provenance, { source: 'snapshot-input' });
  const engine = config(), rows = Array.from({ length: 100 }, (_, i) => candle(end - (100 - i) * 14400));
  backtestVariant(variant, rows, 'SOL', tf, engine, { instrument: USDM, provenance: { source: ARCHIVE, checksums } });
  assert.deepEqual(manifestSeries(engine)[0].provenance, { source: ARCHIVE, checksums });
});

test('F1a-1 an archive source without verified checksums, or an unknown source, is rejected before any write', () => {
  const c = config();
  for (const provenance of [{ source: ARCHIVE }, { source: ARCHIVE, checksums: [] }, { source: ARCHIVE, checksums: [{ file: 'SOLUSDT-4h-2021-10.zip' }] },
    { source: ARCHIVE, checksums: [{ file: 'SOLUSDT-4h-2021-10.zip', sha256: 'not-a-checksum' }] }, { source: ARCHIVE, checksums: [{ sha256: 'a'.repeat(64) }] }]) {
    assert.throws(() => freezeSeries([candle(start)], 'SOL', '4h', c, USDM, provenance), /verified checksums/);
  }
  for (const provenance of [null, {}, { source: 'legacy-unknown' }, { source: 'binance-vision' }]) {
    assert.throws(() => freezeSeries([candle(start)], 'SOL', '4h', c, USDM, provenance), /Unknown snapshot source/);
  }
  assert.ok(!fs.existsSync(c.h2Paths.manifest) && !fs.existsSync(c.h2Paths.cache));
});

test('F1a-1 legacy entries load unchanged as source unknown; existing manifest bytes are never rewritten', () => {
  const committed = new URL('results/manifest-h2.json', root), committedBytes = fs.readFileSync(committed);
  assert.equal(sha256(committedBytes), '41dc53724f78315658a5e07071db5b1aab4f8811ff7ff37e1849dfea4f11a308');
  const legacy = JSON.parse(committedBytes).series;
  for (const s of legacy) assert.ok(!('provenance' in s) && provenanceOf(s).source === 'legacy-unknown');
  // A new entry appended to a copy of the committed manifest leaves the old bytes as an exact prefix.
  const c = config(), tail = '\n  ]\n}\n';
  fs.writeFileSync(c.h2Paths.manifest, committedBytes);
  freezeSeries([candle(start)], 'SOL', '4h', c, USDM, { source: ARCHIVE, checksums });
  const after = fs.readFileSync(c.h2Paths.manifest, 'utf8'), old = committedBytes.toString('utf8');
  assert.ok(old.endsWith(tail) && after.startsWith(old.slice(0, -tail.length)));
  assert.deepEqual(manifestSeries(c).slice(0, 2), legacy);
  assert.deepEqual(manifestSeries(c)[2].provenance, { source: ARCHIVE, checksums });
  // A legacy entry is served with its read-time provenance; re-freezing the same bytes rewrites nothing.
  const l = config(), bytes = JSON.stringify([candle(start)]) + '\n', hash = sha256(bytes);
  fs.mkdirSync(l.h2Paths.cache, { recursive: true });
  fs.writeFileSync(path.join(l.h2Paths.cache, `${hash}.json`), bytes);
  fs.writeFileSync(l.h2Paths.manifest, JSON.stringify({ schemaVersion: 1, periods: PERIODS, series: [{ symbol: 'SOL', timeframe: '4h',
    dataStart: PERIODS.research[0], dataEnd: PERIODS.research[1], snapshot: `data/market-cache/h2/${hash}.json`,
    firstCandle: PERIODS.research[0], lastCandle: PERIODS.research[0], count: 1, sha256: hash }] }, null, 2) + '\n');
  const before = fs.readFileSync(l.h2Paths.manifest);
  assert.deepEqual(cachedSeries('SOL', '4h', l).meta.provenance, { source: 'legacy-unknown' });
  freezeSeries([candle(start)], 'SOL', '4h', l, SPOT, { source: 'binance-public-rest-fixed-window' });
  assert.deepEqual(fs.readFileSync(l.h2Paths.manifest), before);
  assert.deepEqual(fs.readFileSync(committed), committedBytes);
});

test('F1a-1 an identity match returns the persisted manifest entry, not the new source', () => {
  const c = config();
  freezeSeries([candle(start)], 'SOL', '4h', c, USDM, { source: ARCHIVE, checksums });
  const again = freezeSeries([candle(start)], 'SOL', '4h', c, USDM, { source: 'snapshot-input' });
  assert.deepEqual(again.entry, manifestSeries(c)[0]);
  assert.deepEqual(again.entry.provenance, { source: ARCHIVE, checksums });
  // A legacy entry comes back as stored: no provenance, read as legacy-unknown and Binance spot.
  const l = config(), bytes = JSON.stringify([candle(start)]) + '\n', hash = sha256(bytes);
  const legacy = { symbol: 'SOL', timeframe: '4h', dataStart: PERIODS.research[0], dataEnd: PERIODS.research[1], snapshot: `data/market-cache/h2/${hash}.json`,
    firstCandle: PERIODS.research[0], lastCandle: PERIODS.research[0], count: 1, sha256: hash };
  fs.writeFileSync(l.h2Paths.manifest, JSON.stringify({ schemaVersion: 1, periods: PERIODS, series: [legacy] }, null, 2) + '\n');
  const before = fs.readFileSync(l.h2Paths.manifest);
  const legacyAgain = freezeSeries([candle(start)], 'SOL', '4h', l);
  assert.deepEqual(legacyAgain.entry, legacy);
  assert.deepEqual(provenanceOf(legacyAgain.entry), { source: 'legacy-unknown' });
  assert.deepEqual(instrumentOf(legacyAgain.entry), SPOT);
  assert.deepEqual(fs.readFileSync(l.h2Paths.manifest), before);
});
