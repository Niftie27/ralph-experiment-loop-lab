// F1a-3 commit 2: interval-aware Vision paths and kline parser (docs/f1/f1a-3-contract.md, C2 and V3).
// The 1m behaviour is the regression contract: every existing test stays unchanged.
import test from 'node:test';
import assert from 'node:assert/strict';
import * as vision from '../src/vision-source.mjs';
import { klineCsv, klineRow, minutes, KLINE_HEADER } from '../test-support/vision-fixtures.mjs';

const ms = iso => Date.parse(iso);
const H = 3600000, D = 86400000, W = 7 * D;
const BTC = { exchange: 'binance', market: 'linear_perpetual', contract: 'BTCUSDT' };
const JAN = { startMs: ms('2024-01-01T00:00:00.000Z'), endMs: ms('2024-02-01T00:00:00.000Z') };
const OCT21 = { startMs: ms('2021-10-01T00:00:00.000Z'), endMs: ms('2021-11-01T00:00:00.000Z') };
const opens = (startIso, count, step) => Array.from({ length: count }, (_, i) => ms(startIso) + i * step);
const csvOf = (openTimes, step) => Buffer.from(KLINE_HEADER + '\n' + openTimes.map(t => klineRow(t, { closeTime: String(t + step - 1) })).join('\n') + '\n');
const parse = (csv, bounds, interval) => vision.parseKlines(csv, { ...bounds, interval });

test('interval grid: epoch multiples up to 1d, Monday 00:00 UTC for 1w', () => {
  assert.deepEqual(Object.keys(vision.KLINE_INTERVALS), ['1m', '5m', '15m', '1h', '4h', '1d', '1w']);
  const t = ms('2024-01-03T13:47:30.000Z');
  assert.equal(vision.gridOpen('1m', t), ms('2024-01-03T13:47:00.000Z'));
  assert.equal(vision.gridOpen('5m', t), ms('2024-01-03T13:45:00.000Z'));
  assert.equal(vision.gridOpen('15m', t), ms('2024-01-03T13:45:00.000Z'));
  assert.equal(vision.gridOpen('1h', t), ms('2024-01-03T13:00:00.000Z'));
  assert.equal(vision.gridOpen('4h', t), ms('2024-01-03T12:00:00.000Z'));
  assert.equal(vision.gridOpen('1d', t), ms('2024-01-03T00:00:00.000Z'));
  assert.equal(vision.gridOpen('1w', t), ms('2024-01-01T00:00:00.000Z'));
  assert.equal(vision.gridOpen('1w', ms('2021-10-24T23:59:00.000Z')), ms('2021-10-18T00:00:00.000Z'));
  assert.equal(vision.gridOpen('1w', ms('2022-01-01T00:00:00.000Z')), ms('2021-12-27T00:00:00.000Z'));
  assert.equal(vision.gridOpen('1w', ms('2025-10-16T23:59:00.000Z')), ms('2025-10-13T00:00:00.000Z'));
  assert.throws(() => vision.gridOpen('2h', t), /unknown kline interval/);
});

test('Vision source paths carry the interval; the default stays 1m', () => {
  const m = vision.visionSource(BTC, 'monthly', JAN.startMs, '1h');
  assert.equal(m.file, 'data/futures/um/monthly/klines/BTCUSDT/1h/BTCUSDT-1h-2024-01.zip');
  assert.equal(m.checksumFile, 'data/futures/um/monthly/klines/BTCUSDT/1h/BTCUSDT-1h-2024-01.zip.CHECKSUM');
  assert.equal(m.zipName, 'BTCUSDT-1h-2024-01.zip');
  assert.equal(m.csvName, 'BTCUSDT-1h-2024-01.csv');
  assert.deepEqual([m.startMs, m.endMs], [JAN.startMs, JAN.endMs]);
  const d = vision.visionSource(BTC, 'daily', ms('2023-06-12T00:00:00.000Z'), '1w');
  assert.equal(d.file, 'data/futures/um/daily/klines/BTCUSDT/1w/BTCUSDT-1w-2023-06-12.zip');
  assert.deepEqual([d.startMs, d.endMs], [ms('2023-06-12T00:00:00.000Z'), ms('2023-06-13T00:00:00.000Z')]);
  assert.deepEqual(vision.visionSource(BTC, 'monthly', JAN.startMs), vision.visionSource(BTC, 'monthly', JAN.startMs, '1m'));
  assert.equal(vision.visionSource(BTC, 'daily', JAN.startMs).file, 'data/futures/um/daily/klines/BTCUSDT/1m/BTCUSDT-1m-2024-01-01.zip');
  assert.throws(() => vision.visionSource(BTC, 'monthly', JAN.startMs, '3d'), /unknown kline interval/);
});

test('1h rows: grid alignment, close_time = open_time + 3,599,999 ms, row cap = 1h opens of the file', () => {
  const day = opens('2024-01-01T00:00:00.000Z', 24, H);
  const parsed = parse(csvOf(day, H), JAN, '1h');
  assert.equal(parsed.rowCount, 24);
  assert.deepEqual([...parsed.columns.open_time], day);
  assert.deepEqual(parsed.quarantined, []);
  assert.throws(() => parse(csvOf([day[0] + 30 * 60000], H), JAN, '1h'), /row 1 \(2024-01-01T00:30:00.000Z\): open_time not aligned to the 1h grid/);
  assert.throws(() => parse(Buffer.from(klineCsv([day[0]])), JAN, '1h'), /close_time is not open_time \+ 3,599,999 ms/);
  assert.throws(() => parse(Buffer.from('1\n'.repeat(745)), JAN, '1h'), /^Error: Vision klines: 745 rows exceed the 744 1h opens of the source file$/);
  assert.throws(() => parse(Buffer.from('1\n'.repeat(744)), JAN, '1h'), /row 1 has 1 fields/);
  assert.throws(() => parse(csvOf([ms('2024-02-01T00:00:00.000Z')], H), JAN, '1h'), /outside its source file bounds/);
});

test('4h and 1d rows use their own grid and close_time', () => {
  assert.equal(parse(csvOf(opens('2024-01-01T00:00:00.000Z', 186, 4 * H), 4 * H), JAN, '4h').rowCount, 186);
  assert.throws(() => parse(csvOf([ms('2024-01-01T02:00:00.000Z')], 4 * H), JAN, '4h'), /not aligned to the 4h grid/);
  assert.equal(parse(csvOf(opens('2024-01-01T00:00:00.000Z', 31, D), D), JAN, '1d').rowCount, 31);
  assert.throws(() => parse(Buffer.from('1\n'.repeat(32)), JAN, '1d'), /32 rows exceed the 31 1d opens/);
  assert.throws(() => parse(csvOf([ms('2024-01-01T00:00:00.000Z')], H), JAN, '1d'), /close_time is not open_time \+ 86,399,999 ms/);
});

test('1w rows: Monday opens inside the file count for the row cap; a week may close after its file ends', () => {
  const oct = opens('2021-10-04T00:00:00.000Z', 4, W); // Mondays 4, 11, 18, 25
  assert.equal(parse(csvOf(oct, W), OCT21, '1w').rowCount, 4);
  assert.throws(() => parse(Buffer.from('1\n'.repeat(5)), OCT21, '1w'), /5 rows exceed the 4 1w opens of the source file/);
  const jan = opens('2024-01-01T00:00:00.000Z', 5, W); // the week of 2024-01-29 closes 2024-02-04
  assert.equal(parse(csvOf(jan, W), JAN, '1w').rowCount, 5);
  assert.throws(() => parse(Buffer.from('1\n'.repeat(6)), JAN, '1w'), /6 rows exceed the 5 1w opens/);
  assert.throws(() => parse(csvOf([ms('2021-10-03T00:00:00.000Z')], W), OCT21, '1w'), /not aligned to the 1w grid/);
  assert.throws(() => parse(csvOf([ms('2021-09-27T00:00:00.000Z')], W), OCT21, '1w'), /outside its source file bounds/);
  assert.throws(() => parse(csvOf([oct[0]], D), OCT21, '1w'), /close_time is not open_time \+ 604,799,999 ms/);
  const day = { startMs: ms('2023-06-12T00:00:00.000Z'), endMs: ms('2023-06-13T00:00:00.000Z') };
  assert.equal(parse(csvOf([day.startMs], W), day, '1w').rowCount, 1);
  assert.throws(() => parse(Buffer.from('1\n'.repeat(2)), day, '1w'), /2 rows exceed the 1 1w opens/);
});

test('value rules quarantine reference rows the same way as 1m rows', () => {
  const [t0, t1] = opens('2024-01-01T00:00:00.000Z', 2, H);
  const csv = Buffer.from(KLINE_HEADER + '\n' + klineRow(t0, { closeTime: String(t0 + H - 1), volume: '-1' }) + '\n' + klineRow(t1, { closeTime: String(t1 + H - 1) }) + '\n');
  const parsed = parse(csv, JAN, '1h');
  assert.equal(parsed.rowCount, 1);
  assert.deepEqual(parsed.quarantined, [{ openTime: t0, rule: 'volume must be >= 0' }]);
});

test('1m parse with an explicit interval equals the default parse; unknown intervals fail before parsing', () => {
  const csv = Buffer.from(klineCsv(minutes('2024-01-01T00:00:00.000Z', 5)));
  assert.deepEqual(parse(csv, JAN, '1m'), vision.parseKlines(csv, JAN));
  assert.throws(() => parse(csv, JAN, '1M'), /unknown kline interval/);
  assert.throws(() => parse(Buffer.from(''), JAN, '2h'), /unknown kline interval/);
});
