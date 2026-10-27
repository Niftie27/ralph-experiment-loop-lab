// F1a-3 commit 5: the aggregator (docs/f1/f1a-3-contract.md C1, V2, V3, V5; plan sections a, c, e, j). Synthetic
// 1m tokens only. Expected bars come from an oracle that adds the tokens as written (BigInt), independent of the module.
import test from 'node:test';
import assert from 'node:assert/strict';
import fs from 'node:fs';
import os from 'node:os';
import path from 'node:path';
import { createHash } from 'node:crypto';
import * as agg from '../src/f1-aggregate.mjs';
import { openResearch1m } from '../src/f1-1m-reader.mjs';
import { storeSource, buildStore, readManifest } from '../src/f1-1m-store.mjs';
import { planUnits, visionSource } from '../src/vision-source.mjs';
import { canonicalJson } from '../src/f1-1m-format.mjs';
import { makeZip, klineCsv, minutes, checksumText } from '../test-support/vision-fixtures.mjs';

const BTC = Object.freeze({ exchange: 'binance', market: 'linear_perpetual', contract: 'BTCUSDT' });
const MIN = 60000, H = 3600000, D = 86400000, W = 7 * D;
const STEP = { '5m': 5 * MIN, '15m': 15 * MIN, '1h': H, '4h': 4 * H, '1d': D, '1w': W };
const ALL = ['5m', '15m', '1h', '4h', '1d', '1w'];
const VALUES = ['open', 'high', 'low', 'close', 'volume', 'quote_volume', 'count', 'taker_buy_volume', 'taker_buy_quote_volume'];
const SCALE = [2, 2, 2, 2, 3, 6, 0, 3, 6]; // decimals of each fixture token column, as written
const RESEARCH = [Date.parse('2021-10-18T00:00:00.000Z'), Date.parse('2025-10-17T00:00:00.000Z')];
const ms = s => Date.parse(s);
const iso = t => new Date(t).toISOString();
const pad = (n, w) => String(n).padStart(w, '0');

// Tokens of minute t in VALUES order. quote_volume has 15 significant digits (the research maximum, plan section a), so
// every 1h, 4h, 1d and 1w quote_volume sum has more than 15.
function tokensAt(t) {
  const k = (t - ms('2021-01-01T00:00:00.000Z')) / MIN;
  const price = c => `${Math.floor(c / 100)}.${pad(c % 100, 2)}`;
  const open = 2000000 + (k * 7919) % 100000, close = 2000000 + (k * 104729) % 100000;
  const vol = 1000 + (k * 31) % 9000, taker = Math.floor(vol / 2);
  return [price(open), price(Math.max(open, close) + k % 37), price(Math.min(open, close) - k % 41), price(close),
    `${Math.floor(vol / 1000)}.${pad(vol % 1000, 3)}`, `${123456789 + k % 1000}.${pad((k * 7) % 1000000, 6)}`, String(100 + k % 50),
    `${Math.floor(taker / 1000)}.${pad(taker % 1000, 3)}`, `${61728394 + k % 500}.${pad((k * 3) % 1000000, 6)}`];
}
// A reader with openResearch1m's contract over generated minutes: gen(t) gives the tokens of minute t or null (no candle).
// Values are Number(token), as the snapshots hold them. Every request is recorded.
function fakeReader(gen = tokensAt) {
  const requests = [];
  return {
    requests,
    read(request) {
      requests.push(request);
      assert.deepEqual(Object.keys(request).sort(), ['dataEnd', 'dataStart', 'instrument']);
      const a = ms(request.dataStart), b = ms(request.dataEnd);
      assert.ok(a >= RESEARCH[0] && b <= RESEARCH[1] && a < b, 'the reader would refuse this window');
      const times = [], rows = [];
      for (let t = a; t < b; t += MIN) { const r = gen(t); if (r) { times.push(t); rows.push(r); } }
      const columns = { open_time: Float64Array.from(times) };
      VALUES.forEach((name, c) => { columns[name] = Float64Array.from(rows, r => Number(r[c])); });
      const d = new Date(a), m0 = Date.UTC(d.getUTCFullYear(), d.getUTCMonth(), 1), m1 = Date.UTC(d.getUTCFullYear(), d.getUTCMonth() + 1, 1);
      const unit = { sha256: createHash('sha256').update(`${request.instrument.contract} ${iso(m0)}`).digest('hex'),
        dataStart: iso(Math.max(m0, RESEARCH[0])), dataEnd: iso(Math.min(m1, RESEARCH[1])) };
      return Object.freeze({ instrument: request.instrument, dataStart: request.dataStart, dataEnd: request.dataEnd, rowCount: times.length,
        columns: Object.freeze(columns), units: Object.freeze([Object.freeze(unit)]) });
    }
  };
}
const run = (reader, timeframes, dataStart, dataEnd, extra = {}) => agg.aggregateResearch({ reader, instrument: BTC, timeframes, dataStart, dataEnd, ...extra });

// Oracle: exact decimals of the tokens as written, {coef, scale} reduced (no trailing zeros), and their Number.
const tokenDecimal = (token, scale) => ({ coef: BigInt(token.replace('.', '')), scale });
const reduce = ({ coef, scale }) => { while (scale > 0 && coef % 10n === 0n) { coef /= 10n; scale--; } return { coef, scale }; };
const toNumber = ({ coef, scale }) => { const s = coef.toString().padStart(scale + 1, '0'); return Number(scale ? `${s.slice(0, -scale)}.${s.slice(-scale)}` : s); };
const addDec = (a, b) => a.scale >= b.scale ? { coef: a.coef + b.coef * 10n ** BigInt(a.scale - b.scale), scale: a.scale } : addDec(b, a);
const significant = ({ coef }) => coef.toString().replace(/^0+/, '').replace(/0+$/, '').length;
function oracleBar(openTime, step, gen = tokensAt) {
  const rows = [];
  for (let t = openTime; t < openTime + step; t += MIN) { const r = gen(t); if (r) rows.push(r); }
  const col = c => rows.map(r => tokenDecimal(r[c], SCALE[c]));
  const pick = (c, better) => col(c).reduce((x, y) => better(y.coef, x.coef) ? y : x);
  const sum = c => col(c).reduce(addDec);
  const exact = { open: col(0)[0], high: pick(1, (y, x) => y > x), low: pick(2, (y, x) => y < x), close: col(3).at(-1),
    volume: sum(4), quote_volume: sum(5), count: sum(6), taker_buy_volume: sum(7), taker_buy_quote_volume: sum(8) };
  return Object.fromEntries(VALUES.map(name => [name, reduce(exact[name])]));
}
// Asserts that bar i of a timeframe result equals the oracle in every exact decimal and every Number.
function assertBar(tf, i, step, gen) {
  const openTime = tf.columns.open_time[i], expected = oracleBar(openTime, step, gen);
  for (const name of VALUES) {
    assert.deepEqual(reduce(tf.exact(name, i)), expected[name], `${name} exact at ${iso(openTime)}`);
    assert.equal(tf.columns[name][i], toNumber(expected[name]), `${name} Number at ${iso(openTime)}`);
  }
}
const opensOf = tf => Array.from(tf.columns.open_time, iso);

test('aggregate: every timeframe on its UTC grid (1w on Mondays), OHLC first/max/min/last, count and volumes exact sums, all from 1m', () => {
  const reader = fakeReader();
  const out = run(reader, ALL, '2024-01-01T00:00:00.000Z', '2024-01-15T00:00:00.000Z');
  assert.deepEqual(Object.keys(out.timeframes), ALL);
  const slots = { '5m': 4032, '15m': 1344, '1h': 336, '4h': 84, '1d': 14, '1w': 2 };
  for (const name of ALL) {
    const tf = out.timeframes[name];
    assert.equal(tf.timeframe, name);
    assert.equal(tf.bars, slots[name]);
    assert.deepEqual(Object.keys(tf.columns), ['open_time', ...VALUES]);
    assert.ok(Object.values(tf.columns).every(c => c instanceof Float64Array && c.length === slots[name]));
    for (let i = 0; i < tf.bars; i++) assert.equal(tf.columns.open_time[i], ms('2024-01-01T00:00:00.000Z') + i * STEP[name]);
    assert.deepEqual([tf.incomplete, tf.emptyRanges], [[], []]);
    for (const i of [0, 1, tf.bars - 1]) assertBar(tf, i, STEP[name]);
  }
  assert.deepEqual(opensOf(out.timeframes['1w']), ['2024-01-01T00:00:00.000Z', '2024-01-08T00:00:00.000Z']);
  assert.ok(Object.isFrozen(out) && Object.isFrozen(out.timeframes) && Object.isFrozen(out.timeframes['1h']) && Object.isFrozen(out.timeframes['1h'].columns));
  assert.deepEqual(out.instrument, BTC);
  assert.equal(reader.requests.length, 1);
});

test('aggregate: sums are exact decimals, not float sums (sixty 0.1 volumes give 6)', () => {
  const gen = t => { const r = tokensAt(t); r[4] = '0.1'; r[7] = '0.1'; return r; };
  const out = run(fakeReader(gen), ['1h'], '2024-01-01T00:00:00.000Z', '2024-01-01T01:00:00.000Z');
  let naive = 0;
  for (let i = 0; i < 60; i++) naive += 0.1;
  assert.notEqual(naive, 6);
  assert.equal(out.timeframes['1h'].columns.volume[0], 6);
  assert.deepEqual(reduce(out.timeframes['1h'].exact('volume', 0)), { coef: 6n, scale: 0 });
  assert.equal(out.timeframes['1h'].columns.taker_buy_volume[0], 6);
});

test('aggregate: exact sums across mixed scales and magnitudes beyond 2^53 (the BigInt overflow path)', () => {
  const pattern = ['0.000001', '123456789012345', '98765.4321', '7', '0.5', '999999999999999'];
  const gen = t => { const r = tokensAt(t), k = ((t / MIN) % pattern.length + pattern.length) % pattern.length; r[4] = pattern[k]; r[7] = pattern[(k + 3) % pattern.length]; return r; };
  const out = run(fakeReader(gen), ['5m', '1h'], '2024-01-01T00:00:00.000Z', '2024-01-01T02:00:00.000Z');
  for (const tf of Object.values(out.timeframes)) for (let i = 0; i < tf.bars; i++) {
    for (const [name, c] of [['volume', 4], ['taker_buy_volume', 7]]) {
      const tokens = [];
      for (let t = tf.columns.open_time[i]; t < tf.columns.open_time[i] + STEP[tf.timeframe]; t += MIN) tokens.push(gen(t)[c]);
      const expected = tokens.map(x => ({ coef: BigInt(x.replace('.', '')), scale: x.includes('.') ? x.length - x.indexOf('.') - 1 : 0 })).reduce(addDec);
      assert.deepEqual(reduce(tf.exact(name, i)), reduce(expected), `${name} ${tf.timeframe} ${i}`);
      assert.equal(tf.columns[name][i], toNumber(expected));
    }
  }
  assert.ok(out.timeframes['1h'].exact('volume', 0).coef > BigInt(Number.MAX_SAFE_INTEGER));
});

test('aggregate C1: a 4h bar equals its four 1h bars and a week its seven days, on exact BigInt intermediates over 15 digits', () => {
  const out = run(fakeReader(), ['1h', '4h', '1d', '1w'], '2021-11-29T00:00:00.000Z', '2022-01-10T00:00:00.000Z');
  const [h1, h4, d1, w1] = ['1h', '4h', '1d', '1w'].map(name => out.timeframes[name]);
  assert.deepEqual([h1.bars, h4.bars, d1.bars, w1.bars], [1008, 252, 42, 6]);
  const compose = (big, small, ratio) => {
    let floatDiffers = 0;
    for (let i = 0; i < big.bars; i++) {
      const parts = Array.from({ length: ratio }, (_, k) => i * ratio + k);
      assert.equal(small.columns.open_time[parts[0]], big.columns.open_time[i]);
      for (const name of ['volume', 'quote_volume', 'count', 'taker_buy_volume', 'taker_buy_quote_volume']) {
        const whole = big.exact(name, i), sum = parts.map(k => small.exact(name, k)).reduce(addDec);
        assert.deepEqual(reduce(whole), reduce(sum), `${name} of ${iso(big.columns.open_time[i])}`);
        assert.equal(big.columns[name][i], toNumber(sum));
      }
      assert.deepEqual(reduce(big.exact('open', i)), reduce(small.exact('open', parts[0])));
      assert.deepEqual(reduce(big.exact('close', i)), reduce(small.exact('close', parts.at(-1))));
      assert.equal(big.columns.high[i], Math.max(...parts.map(k => small.columns.high[k])));
      assert.equal(big.columns.low[i], Math.min(...parts.map(k => small.columns.low[k])));
      assert.ok(significant(big.exact('quote_volume', i)) > 15, 'the fixture sums exceed 15 significant digits');
      if (parts.reduce((s, k) => s + small.columns.quote_volume[k], 0) !== big.columns.quote_volume[i]) floatDiffers++;
    }
    return floatDiffers;
  };
  const differs4h = compose(h4, h1, 4);
  compose(w1, d1, 7);
  // Adding the rounded Numbers of the parts would not give the whole: exact intermediates are needed (C1).
  assert.ok(differs4h > 0, `float composition differs in ${differs4h} of 252 4h bars`);
  for (let i = 0; i < w1.bars; i++) assertBar(w1, i, W);
  assert.ok(significant(w1.exact('quote_volume', 0)) > 17);
});

test('aggregate V2: the reader is called one calendar month at a time and open bars, the week included, carry across months', () => {
  const reader = fakeReader(), labels = [];
  const out = run(reader, ALL, '2021-11-29T00:00:00.000Z', '2022-01-10T00:00:00.000Z', { check: label => labels.push(label) });
  assert.deepEqual(reader.requests.map(r => [r.dataStart, r.dataEnd]), [
    ['2021-11-29T00:00:00.000Z', '2021-12-01T00:00:00.000Z'], ['2021-12-01T00:00:00.000Z', '2022-01-01T00:00:00.000Z'], ['2022-01-01T00:00:00.000Z', '2022-01-10T00:00:00.000Z']]);
  assert.ok(reader.requests.every(r => r.instrument === BTC || canonicalJson(r.instrument) === canonicalJson(BTC)));
  assert.deepEqual(labels, ['aggregate BTCUSDT 2021-11', 'aggregate BTCUSDT 2021-12', 'aggregate BTCUSDT 2022-01']);
  const w1 = out.timeframes['1w'];
  assert.deepEqual(opensOf(w1), ['2021-11-29T00:00:00.000Z', '2021-12-06T00:00:00.000Z', '2021-12-13T00:00:00.000Z', '2021-12-20T00:00:00.000Z',
    '2021-12-27T00:00:00.000Z', '2022-01-03T00:00:00.000Z']);
  assertBar(w1, 0, W); // spans 2021-11 and 2021-12
  assertBar(w1, 4, W); // spans 2021-12 and 2022-01
  assertBar(out.timeframes['1d'], 32, D); // 2021-12-31
  assert.deepEqual(out.units.map(u => u.dataStart), ['2021-11-01T00:00:00.000Z', '2021-12-01T00:00:00.000Z', '2022-01-01T00:00:00.000Z']);
});

test('aggregate: the memory check seam runs after every month and a throwing check aborts the run', () => {
  let calls = 0;
  const check = label => { calls++; if (calls === 2) throw new Error(`memory ceiling exceeded: 600 MiB > 512 MiB at ${label}`); };
  assert.throws(() => run(fakeReader(), ALL, '2021-11-29T00:00:00.000Z', '2022-01-10T00:00:00.000Z', { check }), /memory ceiling exceeded: 600 MiB > 512 MiB at aggregate BTCUSDT 2021-12/);
  assert.equal(calls, 2);
});

test('aggregate P1: one missing minute omits its bar in all six timeframes and lists it; neighbours unchanged; nothing filled', () => {
  const hole = ms('2024-01-03T12:37:00.000Z');
  const gen = t => t === hole ? null : tokensAt(t);
  const out = run(fakeReader(gen), ALL, '2024-01-01T00:00:00.000Z', '2024-01-15T00:00:00.000Z');
  const expected = { '5m': ['2024-01-03T12:35:00.000Z', 4, 5], '15m': ['2024-01-03T12:30:00.000Z', 14, 15], '1h': ['2024-01-03T12:00:00.000Z', 59, 60],
    '4h': ['2024-01-03T12:00:00.000Z', 239, 240], '1d': ['2024-01-03T00:00:00.000Z', 1439, 1440], '1w': ['2024-01-01T00:00:00.000Z', 10079, 10080] };
  const slots = { '5m': 4032, '15m': 1344, '1h': 336, '4h': 84, '1d': 14, '1w': 2 };
  for (const name of ALL) {
    const tf = out.timeframes[name], [openTime, present, total] = expected[name];
    assert.deepEqual(tf.incomplete, [{ openTime, minutes: present, expected: total, reason: 'missing_minutes' }], name);
    assert.equal(tf.bars, slots[name] - 1);
    assert.ok(!opensOf(tf).includes(openTime), `${name} bar ${openTime} is omitted, not filled`);
    assert.deepEqual(tf.emptyRanges, []);
    const before = opensOf(tf).indexOf(iso(ms(openTime) - STEP[name]));
    if (before >= 0) { assertBar(tf, before, STEP[name], gen); assert.equal(tf.columns.open_time[before + 1], ms(openTime) + STEP[name]); assertBar(tf, before + 1, STEP[name], gen); }
  }
  assert.ok(Object.isFrozen(out.timeframes['1h'].incomplete[0]));
});

test('aggregate: a HYPE-like leading gap gives empty ranges and partial first 1h, 4h, 1d and 1w bars; 5m and 15m start complete', () => {
  const first = ms('2025-05-30T10:30:00.000Z');
  const gen = t => t < first ? null : tokensAt(t);
  const out = run(fakeReader(gen), ALL, '2025-05-01T00:00:00.000Z', '2025-06-09T00:00:00.000Z');
  const t = out.timeframes;
  assert.deepEqual(t['5m'].emptyRanges, [{ start: '2025-05-01T00:00:00.000Z', end: '2025-05-30T10:30:00.000Z', slots: 8478 }]);
  assert.deepEqual([t['5m'].incomplete, t['15m'].incomplete], [[], []]);
  assert.equal(t['5m'].columns.open_time[0], first);
  assert.equal(t['15m'].columns.open_time[0], first);
  assert.deepEqual(t['15m'].emptyRanges, [{ start: '2025-05-01T00:00:00.000Z', end: '2025-05-30T10:30:00.000Z', slots: 2826 }]);
  assert.deepEqual(t['1h'].emptyRanges, [{ start: '2025-05-01T00:00:00.000Z', end: '2025-05-30T10:00:00.000Z', slots: 706 }]);
  assert.deepEqual(t['1h'].incomplete, [{ openTime: '2025-05-30T10:00:00.000Z', minutes: 30, expected: 60, reason: 'missing_minutes' }]);
  assert.deepEqual(t['4h'].emptyRanges, [{ start: '2025-05-01T00:00:00.000Z', end: '2025-05-30T08:00:00.000Z', slots: 176 }]);
  assert.deepEqual(t['4h'].incomplete, [{ openTime: '2025-05-30T08:00:00.000Z', minutes: 90, expected: 240, reason: 'missing_minutes' }]);
  assert.deepEqual(t['1d'].emptyRanges, [{ start: '2025-05-01T00:00:00.000Z', end: '2025-05-30T00:00:00.000Z', slots: 29 }]);
  assert.deepEqual(t['1d'].incomplete, [{ openTime: '2025-05-30T00:00:00.000Z', minutes: 810, expected: 1440, reason: 'missing_minutes' }]);
  // The week of 2025-04-28 crosses the window start but holds no minute: an empty slot, not an incomplete bar.
  assert.deepEqual(t['1w'].emptyRanges, [{ start: '2025-04-28T00:00:00.000Z', end: '2025-05-26T00:00:00.000Z', slots: 4 }]);
  assert.deepEqual(t['1w'].incomplete, [{ openTime: '2025-05-26T00:00:00.000Z', minutes: 3690, expected: 10080, reason: 'missing_minutes' }]);
  assert.deepEqual(opensOf(t['1w']), ['2025-06-02T00:00:00.000Z']);
  assertBar(t['1w'], 0, W, gen);
  assertBar(t['1h'], 0, H, gen);
});

test('aggregate V3: a window ending 2025-10-17 lists the 2025-10-13 week as window_edge; nothing past 2025-10-17 is requested', () => {
  const reader = fakeReader();
  const out = run(reader, ALL, '2025-10-06T00:00:00.000Z', '2025-10-17T00:00:00.000Z');
  assert.deepEqual(opensOf(out.timeframes['1w']), ['2025-10-06T00:00:00.000Z']);
  assert.deepEqual(out.timeframes['1w'].incomplete, [{ openTime: '2025-10-13T00:00:00.000Z', minutes: 5760, expected: 10080, reason: 'window_edge' }]);
  assert.equal(out.timeframes['1d'].bars, 11);
  for (const name of ['5m', '15m', '1h', '4h', '1d']) assert.deepEqual([out.timeframes[name].incomplete, out.timeframes[name].emptyRanges], [[], []]);
  assert.ok(reader.requests.every(r => ms(r.dataEnd) <= RESEARCH[1]));
  for (const tf of Object.values(out.timeframes)) assert.ok(Array.from(tf.columns.open_time).every(t => t + STEP[tf.timeframe] <= RESEARCH[1]));
});

test('aggregate: a window that starts or ends off a grid lists the cut bars as window_edge', () => {
  const out = run(fakeReader(), ['5m', '1h', '4h', '1d'], '2024-01-01T00:30:00.000Z', '2024-01-01T03:10:00.000Z');
  assert.deepEqual(out.timeframes['1h'].incomplete, [{ openTime: '2024-01-01T00:00:00.000Z', minutes: 30, expected: 60, reason: 'window_edge' },
    { openTime: '2024-01-01T03:00:00.000Z', minutes: 10, expected: 60, reason: 'window_edge' }]);
  assert.deepEqual(opensOf(out.timeframes['1h']), ['2024-01-01T01:00:00.000Z', '2024-01-01T02:00:00.000Z']);
  assert.deepEqual(out.timeframes['4h'].incomplete, [{ openTime: '2024-01-01T00:00:00.000Z', minutes: 160, expected: 240, reason: 'window_edge' }]);
  assert.deepEqual(out.timeframes['1d'].incomplete, [{ openTime: '2024-01-01T00:00:00.000Z', minutes: 160, expected: 1440, reason: 'window_edge' }]);
  assert.deepEqual([out.timeframes['5m'].bars, out.timeframes['5m'].incomplete], [32, []]);
});

test('aggregate: requests outside the research window and bad arguments fail before any read', () => {
  const reader = fakeReader();
  const bad = [
    [['1h'], '2025-10-13T00:00:00.000Z', '2025-10-18T00:00:00.000Z', /outside the research window/],
    [['1h'], '2025-10-17T00:00:00.000Z', '2025-10-18T00:00:00.000Z', /outside the research window/],
    [['1h'], '2021-10-17T00:00:00.000Z', '2021-10-19T00:00:00.000Z', /outside the research window/],
    [['1h'], '2024-01-02T00:00:00.000Z', '2024-01-01T00:00:00.000Z', /empty window/],
    [['1h'], '2024-01-01T00:00:30.000Z', '2024-01-02T00:00:00.000Z', /minute ISO/],
    [['1h'], '2024-01-01', '2024-01-02T00:00:00.000Z', /minute ISO/],
    [[], '2024-01-01T00:00:00.000Z', '2024-01-02T00:00:00.000Z', /timeframes/],
    [['1m'], '2024-01-01T00:00:00.000Z', '2024-01-02T00:00:00.000Z', /timeframes/],
    [['1h', '1h'], '2024-01-01T00:00:00.000Z', '2024-01-02T00:00:00.000Z', /timeframes/],
    [['2h'], '2024-01-01T00:00:00.000Z', '2024-01-02T00:00:00.000Z', /timeframes/]];
  for (const [timeframes, a, b, error] of bad) assert.throws(() => run(reader, timeframes, a, b), error, `${timeframes} ${a} ${b}`);
  assert.throws(() => agg.aggregateResearch({ reader: {}, instrument: BTC, timeframes: ['1h'], dataStart: '2024-01-01T00:00:00.000Z', dataEnd: '2024-01-02T00:00:00.000Z' }), /reader/);
  assert.equal(reader.requests.length, 0);
});

test('aggregate: a 1m value without an exact 15-digit decimal fails closed and the error names column and time, never the value', () => {
  const bad = ms('2024-01-01T00:07:00.000Z');
  for (const [column, value] of [[4, '0.0000001'], [5, String(0.1 + 0.2)], [8, '1e21'], [7, '10000000000000000']]) {
    const gen = t => { const r = tokensAt(t); if (t === bad) r[column] = value; return r; };
    assert.throws(() => run(fakeReader(gen), ['1h'], '2024-01-01T00:00:00.000Z', '2024-01-01T01:00:00.000Z'), error => {
      assert.match(error.message, new RegExp(`${VALUES[column]} at 2024-01-01T00:07:00.000Z`));
      assert.match(error.message, /exponent form or more than 15 significant digits/);
      assert.ok(!error.message.includes(String(Number(value))) && !error.message.includes('0.3'), 'no value in the error');
      return true;
    });
  }
  // An open, high, low or close value is checked when it becomes a bar value.
  const genHigh = t => { const r = tokensAt(t); if (t === bad) r[1] = '99999999.123456789'; return r; };
  assert.throws(() => run(fakeReader(genHigh), ['1h'], '2024-01-01T00:00:00.000Z', '2024-01-01T01:00:00.000Z'), /high of the 1h bar 2024-01-01T00:00:00.000Z: .*exponent form or more than 15 significant digits/);
});

test('aggregate: out-of-order or foreign rows from the reader fail closed', () => {
  const swapped = fakeReader();
  const read = swapped.read;
  swapped.read = request => { const r = read(request); const t = Float64Array.from(r.columns.open_time); [t[3], t[4]] = [t[4], t[3]]; return { ...r, columns: { ...r.columns, open_time: t } }; };
  assert.throws(() => run(swapped, ['1h'], '2024-01-01T00:00:00.000Z', '2024-01-01T01:00:00.000Z'), /1m open_time not strictly increasing, minute-aligned and inside the request at row 5/);
  const other = fakeReader();
  const readOther = other.read;
  other.read = request => ({ ...readOther(request), instrument: { ...BTC, contract: 'ETHUSDT' } });
  assert.throws(() => run(other, ['1h'], '2024-01-01T00:00:00.000Z', '2024-01-01T01:00:00.000Z'), /reader answered for another instrument/);
});

test('aggregate V5: one canonical digest per timeframe over identity, window, input units, columns, incomplete bars and empty ranges', () => {
  const hole = ms('2024-01-02T05:00:00.000Z');
  const gen = t => t === hole || t < ms('2024-01-01T02:00:00.000Z') ? null : tokensAt(t);
  const window = ['2024-01-01T00:00:00.000Z', '2024-01-08T00:00:00.000Z'];
  const out = run(fakeReader(gen), ALL, ...window);
  for (const tf of Object.values(out.timeframes)) {
    // Recomputed from the documented layout: canonical JSON metadata, a newline, then each column in fixed order as
    // little-endian float64, bars in chronological order.
    const meta = { schema: 'f1-aggregate-digest/1', instrument: BTC, timeframe: tf.timeframe, dataStart: window[0], dataEnd: window[1],
      units: out.units, columns: ['open_time', ...VALUES], bars: tf.bars, incomplete: tf.incomplete, emptyRanges: tf.emptyRanges };
    const hash = createHash('sha256').update(canonicalJson(meta)).update('\n');
    for (const name of ['open_time', ...VALUES]) { const b = Buffer.alloc(8 * tf.bars); tf.columns[name].forEach((v, i) => b.writeDoubleLE(v, 8 * i)); hash.update(b); }
    assert.equal(tf.digest, hash.digest('hex'), tf.timeframe);
  }
  assert.equal(run(fakeReader(gen), ALL, ...window).timeframes['1h'].digest, out.timeframes['1h'].digest, 'deterministic');
  const changed = gen2 => run(fakeReader(gen2), ['1h'], ...window).timeframes['1h'].digest;
  const base = out.timeframes['1h'].digest;
  assert.notEqual(changed(t => { const r = gen(t); if (r && t === ms('2024-01-03T00:00:00.000Z')) r[5] = '1.000001'; return r; }), base, 'a value');
  assert.notEqual(changed(t => t === ms('2024-01-02T06:00:00.000Z') ? null : gen(t)), base, 'an incomplete bar');
  assert.notEqual(changed(t => t < ms('2024-01-01T03:00:00.000Z') ? null : gen(t)), base, 'an empty range');
  assert.notEqual(run(fakeReader(gen), ['1h'], window[0], '2024-01-07T00:00:00.000Z').timeframes['1h'].digest, base, 'the window');
  assert.equal(out.code.module, 'src/f1-aggregate.mjs');
  assert.equal(out.code.sha256, createHash('sha256').update(fs.readFileSync(new URL('../src/f1-aggregate.mjs', import.meta.url))).digest('hex'));
});

test('aggregate with the real research 1m reader: a window across two months of a built store', () => {
  const dir = fs.mkdtempSync(path.join(os.tmpdir(), 'f1-aggregate-test-'));
  const s = { zipRoot: path.join(dir, 'vision'), cacheDir: path.join(dir, 'cache'), manifestPath: path.join(dir, 'manifest-f1-1m.json') };
  for (const [month, openTimes] of [['2024-01', minutes('2024-01-31T23:57:00.000Z', 3)], ['2024-02', minutes('2024-02-01T00:00:00.000Z', 3)]]) {
    const source = planUnits('BTC', { from: month, to: month })[0].sources[0];
    const zip = makeZip([{ name: source.csvName, data: klineCsv(openTimes) }]);
    storeSource(s.zipRoot, source, zip, checksumText(zip, source.zipName));
    for (let day = source.startMs; day < source.endMs; day += D) { // every day is a fill day; its 404 marker makes it "fill unavailable"
      const daily = visionSource(BTC, 'daily', day), marker = path.join(s.zipRoot, path.dirname(daily.file), '404', daily.zipName);
      fs.mkdirSync(path.dirname(marker), { recursive: true });
      fs.writeFileSync(marker, '404 on the zip and its CHECKSUM\n');
    }
    assert.notEqual(buildStore({ ...s, symbols: ['BTC'], from: month, to: month }).status, 'failed');
  }
  const reader = openResearch1m({ manifestPath: s.manifestPath, cacheDir: s.cacheDir });
  const out = agg.aggregateResearch({ reader, instrument: BTC, timeframes: ['5m', '1h'], dataStart: '2024-01-31T23:00:00.000Z', dataEnd: '2024-02-01T01:00:00.000Z' });
  assert.deepEqual(out.timeframes['1h'].incomplete, [{ openTime: '2024-01-31T23:00:00.000Z', minutes: 3, expected: 60, reason: 'missing_minutes' },
    { openTime: '2024-02-01T00:00:00.000Z', minutes: 3, expected: 60, reason: 'missing_minutes' }]);
  assert.deepEqual(out.timeframes['5m'].incomplete.map(b => [b.openTime, b.minutes]), [['2024-01-31T23:55:00.000Z', 3], ['2024-02-01T00:00:00.000Z', 3]]);
  assert.deepEqual(out.timeframes['5m'].emptyRanges, [{ start: '2024-01-31T23:00:00.000Z', end: '2024-01-31T23:55:00.000Z', slots: 11 },
    { start: '2024-02-01T00:05:00.000Z', end: '2024-02-01T01:00:00.000Z', slots: 11 }]);
  assert.equal(out.timeframes['5m'].bars, 0);
  const entries = readManifest(s.manifestPath).entries;
  assert.deepEqual(out.units, entries.map(e => ({ sha256: e.sha256, dataStart: e.dataStart, dataEnd: e.dataEnd })));
});
