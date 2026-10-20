// F1a-2: Binance Vision source files: ZIP member, CHECKSUM, kline CSV rows and units (docs/f1/f1a-2-contract.md).
import test from 'node:test';
import assert from 'node:assert/strict';
import { readZipMember, parseChecksum, verifyZip, parseKlines, planUnits, assembleUnit, unitCoverage, visionInstrument, VISION_SYMBOLS } from '../src/vision-source.mjs';
import { instrumentForSymbol } from '../src/h2-contract.mjs';
import fs from 'node:fs';
import { makeZip, klineCsv, klineRow, minutes, checksumText, sha256, KLINE_HEADER } from '../test-support/vision-fixtures.mjs';

const NAME = 'BTCUSDT-1m-2024-01.csv';
const CSV = klineCsv(minutes('2024-01-01T00:00:00.000Z', 3));
const JAN = { startMs: Date.parse('2024-01-01T00:00:00.000Z'), endMs: Date.parse('2024-02-01T00:00:00.000Z') };
const T = minutes('2024-01-01T00:00:00.000Z', 4);

test('F1a-2 zip: returns the one expected deflated member after CRC32 and size checks', () => {
  const out = readZipMember(makeZip([{ name: NAME, data: CSV }]), NAME);
  assert.ok(Buffer.isBuffer(out));
  assert.equal(out.toString('utf8'), CSV);
});

test('F1a-2 zip: rejects a wrong or extra member, a CRC or size mismatch, other methods, flags and zip64, and truncation', () => {
  const reject = (bytes, pattern, options) => assert.throws(() => readZipMember(bytes, NAME, options), pattern);
  reject(makeZip([{ name: 'other.csv', data: CSV }]), /member/);
  reject(makeZip([{ name: NAME, data: CSV }, { name: 'extra.csv', data: CSV }]), /exactly one member/);
  reject(makeZip([{ name: NAME, data: CSV }], { centralName: 'BTCUSDT-1m-2024-02.csv' }), /member/);
  reject(makeZip([{ name: NAME, data: CSV }], { crc: 12345 }), /CRC32/);
  reject(makeZip([{ name: NAME, data: CSV }], { declaredSize: CSV.length + 1 }), /size/);
  reject(makeZip([{ name: NAME, data: CSV }], { declaredSize: CSV.length - 1 }), /size/);
  reject(makeZip([{ name: NAME, data: CSV }], { method: 0 }), /compression method/);
  reject(makeZip([{ name: NAME, data: CSV }], { flags: 1 }), /flags/);
  reject(makeZip([{ name: NAME, data: CSV }], { flags: 8 }), /flags/);
  reject(makeZip([{ name: NAME, data: CSV }], { zip64: true }), /zip64/);
  const good = makeZip([{ name: NAME, data: CSV }]);
  reject(good.subarray(0, good.length - 5), /end record/);
  reject(good.subarray(10), /end record|local header|central/);
  reject(Buffer.from('not a zip at all'), /end record/);
  const corrupt = Buffer.from(good); corrupt[30 + NAME.length + 8] ^= 0xff; // inside the deflate stream
  reject(corrupt, /inflate|CRC32|size/);
});

test('F1a-2 zip: the uncompressed size cap (64 MiB default) applies before and during inflation', () => {
  const zip = makeZip([{ name: NAME, data: CSV }]);
  assert.throws(() => readZipMember(zip, NAME, { maxBytes: CSV.length - 1 }), /cap/);
  // A member that lies about its size cannot inflate past the cap either.
  const bomb = makeZip([{ name: NAME, data: Buffer.alloc(4096, 0x41) }], { declaredSize: 10 });
  assert.throws(() => readZipMember(bomb, NAME, { maxBytes: 100 }), /cap|size/);
  assert.equal(readZipMember(zip, NAME, { maxBytes: CSV.length }).length, CSV.length);
});

test('F1a-2 CHECKSUM: accepts only "<64 hex>  <expected zip name>\\n" as published', () => {
  const sha = sha256(Buffer.from('x'));
  assert.equal(parseChecksum(`${sha}  BTCUSDT-1m-2024-01.zip\n`, 'BTCUSDT-1m-2024-01.zip'), sha);
  assert.equal(parseChecksum(`${sha}  BTCUSDT-1m-2026-10-01.zip\n`, 'BTCUSDT-1m-2026-10-01.zip'), sha);
  for (const bad of [`${sha}  BTCUSDT-1m-2024-02.zip\n`, `${sha} BTCUSDT-1m-2024-01.zip\n`, `${sha.toUpperCase()}  BTCUSDT-1m-2024-01.zip\n`,
    `${sha}  BTCUSDT-1m-2024-01.zip`, `${sha}  BTCUSDT-1m-2024-01.zip\n${sha}  BTCUSDT-1m-2024-01.zip\n`, `${sha.slice(1)}  BTCUSDT-1m-2024-01.zip\n`, '',
    `${sha}  BTCUSDT-1m-2024-01.zip\r\n`]) {
    assert.throws(() => parseChecksum(bad, 'BTCUSDT-1m-2024-01.zip'), /CHECKSUM/);
  }
});

test('F1a-2 CHECKSUM: the sha256 of the downloaded bytes must equal the published one; a tampered zip or a foreign CHECKSUM fails', () => {
  const zip = makeZip([{ name: NAME, data: CSV }]);
  assert.equal(verifyZip(zip, checksumText(zip, 'BTCUSDT-1m-2024-01.zip'), 'BTCUSDT-1m-2024-01.zip'), sha256(zip));
  const tampered = Buffer.from(zip); tampered[tampered.length - 30] ^= 1;
  assert.throws(() => verifyZip(tampered, checksumText(zip, 'BTCUSDT-1m-2024-01.zip'), 'BTCUSDT-1m-2024-01.zip'), /sha256 mismatch/);
  assert.throws(() => verifyZip(zip, checksumText(Buffer.from('other'), 'BTCUSDT-1m-2024-01.zip'), 'BTCUSDT-1m-2024-01.zip'), /sha256 mismatch/);
  assert.throws(() => verifyZip(zip, undefined, 'BTCUSDT-1m-2024-01.zip'), /CHECKSUM/);
});

test('F1a-2 klines: the header and the no-header variant (both seen in real files) parse to the same ten columns', () => {
  const withHeader = parseKlines(Buffer.from(klineCsv(T)), JAN);
  const noHeader = parseKlines(Buffer.from(klineCsv(T, { header: false })), JAN);
  assert.equal(withHeader.variant, 'header');
  assert.equal(noHeader.variant, 'no_header');
  assert.equal(withHeader.rowCount, 4);
  assert.deepEqual(Object.keys(withHeader.columns), ['open_time', 'open', 'high', 'low', 'close', 'volume', 'quote_volume', 'count', 'taker_buy_volume', 'taker_buy_quote_volume']);
  for (const [name, col] of Object.entries(withHeader.columns)) assert.deepEqual(Array.from(col), Array.from(noHeader.columns[name]));
  assert.deepEqual(Array.from(withHeader.columns.open_time), T);
  assert.deepEqual([withHeader.columns.close[0], withHeader.columns.quote_volume[0], withHeader.columns.count[0], withHeader.columns.taker_buy_quote_volume[0]],
    [42331.9, 12256155.25625, 3310, 7414459.86355]);
});

test('F1a-2 klines: an unknown header, a non-numeric first row or a non-millisecond timestamp unit fails closed', () => {
  const reject = (csv, pattern) => assert.throws(() => parseKlines(Buffer.from(csv), JAN), pattern);
  reject(KLINE_HEADER.replace('count', 'trades') + '\n' + klineRow(T[0]) + '\n', /header/);
  reject(KLINE_HEADER.split(',').slice(0, 11).join(',') + '\n' + klineRow(T[0]) + '\n', /header/);
  reject('Open_time' + KLINE_HEADER.slice(9) + '\n' + klineRow(T[0]) + '\n', /header/);
  reject('# comment\n' + klineRow(T[0]) + '\n', /header/);
  reject(klineRow(T[0], { openTime: String(T[0] * 1000), closeTime: String(T[0] * 1000 + 59999999) }) + '\n', /milliseconds/);
  reject(klineRow(T[0], { openTime: String(T[0] / 1000), closeTime: String(T[0] / 1000 + 59) }) + '\n', /milliseconds/);
});

test('F1a-2 klines: close_time, order, alignment and the source file bounds are checked on every row', () => {
  const reject = (rows, pattern) => assert.throws(() => parseKlines(Buffer.from(KLINE_HEADER + '\n' + rows.join('\n') + '\n'), JAN), pattern);
  reject([klineRow(T[0], { closeTime: String(T[0] + 60000) })], /close_time/);
  reject([klineRow(T[0]), klineRow(T[0])], /increasing/);
  reject([klineRow(T[1]), klineRow(T[0])], /increasing/);
  reject([klineRow(T[0] + 1000, { closeTime: String(T[0] + 1000 + 59999) })], /aligned/);
  reject([klineRow(JAN.endMs)], /outside its source/);
  reject([klineRow(JAN.startMs - 60000)], /outside its source/);
  assert.throws(() => parseKlines(Buffer.from(KLINE_HEADER + '\n'), JAN), /no rows/);
});

test('F1a-2 klines: every kept token is a non-empty finite decimal; quote, taker and count rules hold', () => {
  const reject = (over, pattern) => assert.throws(() => parseKlines(Buffer.from(KLINE_HEADER + '\n' + klineRow(T[0], over) + '\n'), JAN), pattern);
  for (const v of ['', 'NaN', 'Infinity', '1e5', ' 1', '0x10', '1.']) reject({ high: v }, /number/);
  reject({ ignore: '0,extra' }, /12 columns/);
  assert.throws(() => parseKlines(Buffer.from(KLINE_HEADER + '\n' + klineRow(T[0]).split(',').slice(0, 11).join(',') + '\n'), JAN), /12 columns/);
  assert.throws(() => parseKlines(Buffer.from((KLINE_HEADER + '\n' + klineRow(T[0]) + '\n').replaceAll('\n', '\r\n')), JAN), /header|number/);
  assert.throws(() => parseKlines(Buffer.from(KLINE_HEADER + '\n' + klineRow(T[0]) + '\n\n' + klineRow(T[1]) + '\n'), JAN), /empty line/);
  assert.throws(() => parseKlines(Buffer.from(KLINE_HEADER + '\n' + klineRow(T[0])), JAN), /newline/);
  reject({ volume: '-0.001' }, /volume/);
  reject({ quoteVolume: '-1' }, /quote_volume/);
  reject({ takerBuyVolume: '289.642' }, /taker_buy_volume/);
  reject({ takerBuyVolume: '-1' }, /taker_buy_volume/);
  reject({ takerBuyQuoteVolume: '12256155.25626' }, /taker_buy_quote_volume/);
  reject({ takerBuyQuoteVolume: '-0.5' }, /taker_buy_quote_volume/);
  reject({ count: '3.5' }, /count/);
  reject({ count: '-3' }, /count/);
  reject({ count: '9007199254740993' }, /count/);
  reject({ low: '0', open: '0', close: '0' }, /low/);
  reject({ low: '42320.00' }, /low/);
  reject({ high: '42330.00' }, /high/);
  assert.equal(parseKlines(Buffer.from(KLINE_HEADER + '\n' + klineRow(T[0], { volume: '0', quoteVolume: '0', count: '0', takerBuyVolume: '0', takerBuyQuoteVolume: '0' }) + '\n'), JAN).rowCount, 1);
});

test('F1a-2 klines: errors name the row and time, never a price; sparse rows stay sparse', () => {
  try { parseKlines(Buffer.from(KLINE_HEADER + '\n' + klineRow(T[0], { high: '98765.43', open: '98799.11' }) + '\n'), JAN); assert.fail('expected a failure'); }
  catch (error) { assert.match(error.message, /2024-01-01T00:00:00.000Z/); assert.doesNotMatch(error.message, /9876|9879|4233|4228/); }
  const sparse = parseKlines(Buffer.from(klineCsv([T[0], T[3]])), JAN);
  assert.deepEqual(Array.from(sparse.columns.open_time), [T[0], T[3]]);
});

const ms = iso => Date.parse(iso);
const parsedFor = (source, openTimes) => ({ file: source.file, parsed: parseKlines(Buffer.from(klineCsv(openTimes)), source) });

test('F1a-2 units: one instrument x calendar month, split at 2025-10-17, 2021-10 from 10-18, 2026-10 from daily files 01-16 only', () => {
  const units = planUnits('BTC');
  assert.equal(units.length, 62);
  assert.deepEqual(units.map(u => u.period).filter(p => p === 'research').length, 49);
  const [first] = units, last = units.at(-1);
  assert.deepEqual([first.dataStart, first.dataEnd, first.period], ['2021-10-18T00:00:00.000Z', '2021-11-01T00:00:00.000Z', 'research']);
  assert.deepEqual(first.sources.map(s => s.file), ['data/futures/um/monthly/klines/BTCUSDT/1m/BTCUSDT-1m-2021-10.zip']);
  const oct25 = units.filter(u => u.dataStart.startsWith('2025-10'));
  assert.deepEqual(oct25.map(u => [u.dataStart, u.dataEnd, u.period]), [
    ['2025-10-01T00:00:00.000Z', '2025-10-17T00:00:00.000Z', 'research'], ['2025-10-17T00:00:00.000Z', '2025-11-01T00:00:00.000Z', 'holdout']]);
  assert.deepEqual(oct25[0].sources, oct25[1].sources);
  assert.deepEqual([last.dataStart, last.dataEnd, last.period], ['2026-10-01T00:00:00.000Z', '2026-10-17T00:00:00.000Z', 'holdout']);
  assert.equal(last.sources.length, 16);
  assert.equal(last.sources[0].file, 'data/futures/um/daily/klines/BTCUSDT/1m/BTCUSDT-1m-2026-10-01.zip');
  assert.equal(last.sources[15].file, 'data/futures/um/daily/klines/BTCUSDT/1m/BTCUSDT-1m-2026-10-16.zip');
  assert.ok(units.every(u => u.sources.every(s => !s.file.includes('2026-10.zip'))));
  assert.deepEqual([first.sources[0].zipName, first.sources[0].csvName, first.sources[0].checksumFile],
    ['BTCUSDT-1m-2021-10.zip', 'BTCUSDT-1m-2021-10.csv', 'data/futures/um/monthly/klines/BTCUSDT/1m/BTCUSDT-1m-2021-10.zip.CHECKSUM']);
  assert.deepEqual([last.sources[0].startMs, last.sources[0].endMs], [ms('2026-10-01T00:00:00.000Z'), ms('2026-10-02T00:00:00.000Z')]);
  const minutesTotal = units.reduce((n, u) => n + (u.endMs - u.startMs) / 60000, 0);
  assert.equal(minutesTotal, 2628000);
  for (let i = 1; i < units.length; i++) assert.equal(units[i].startMs, units[i - 1].endMs);
});

test('F1a-2 units: every symbol is Binance USD-M <SYMBOL>USDT, passed explicitly (config.default.json keeps HYPE on Bybit)', () => {
  assert.deepEqual(Object.keys(VISION_SYMBOLS), ['BTC', 'ETH', 'SOL', 'XRP', 'DOGE', 'HYPE']);
  for (const symbol of Object.keys(VISION_SYMBOLS)) {
    assert.deepEqual(visionInstrument(symbol), { exchange: 'binance', market: 'linear_perpetual', contract: `${symbol}USDT` });
    assert.deepEqual(planUnits(symbol, { from: '2024-01', to: '2024-01' })[0].instrument, visionInstrument(symbol));
  }
  const config = JSON.parse(fs.readFileSync(new URL('../config.default.json', import.meta.url), 'utf8'));
  assert.equal(instrumentForSymbol(config, 'HYPE').exchange, 'bybit');
  for (const bad of ['BTCUSDT', 'btc', 'PEPE', '', undefined]) assert.throws(() => visionInstrument(bad), error => error.usage === true && /symbol/.test(error.message));
});

test('F1a-2 units: --from/--to are inclusive source-month selectors inside 2021-10..2026-10, strictly validated', () => {
  assert.deepEqual(planUnits('ETH', { from: '2025-10', to: '2025-10' }).map(u => u.period), ['research', 'holdout']);
  assert.deepEqual(planUnits('ETH', { from: '2024-02', to: '2024-04' }).map(u => u.dataStart.slice(0, 7)), ['2024-02', '2024-03', '2024-04']);
  assert.equal(planUnits('ETH', { from: '2026-10', to: '2026-10' }).length, 1);
  assert.equal(planUnits('ETH', { from: '2021-10', to: '2021-10' })[0].dataStart, '2021-10-18T00:00:00.000Z');
  for (const [from, to] of [['2024-1', '2024-02'], ['2024-13', '2024-13'], ['2024-00', '2024-01'], ['2021-09', '2021-10'], ['2026-10', '2026-11'],
    ['2024-03', '2024-02'], ['2024-01-05', '2024-02'], [2024, '2024-02']]) {
    assert.throws(() => planUnits('ETH', { from, to }), error => error.usage === true, `${from}..${to}`);
  }
});

test('F1a-2 units: rows are clipped half-open at 2021-10-18, 2025-10-17 and 2026-10-17; the split October 2025 has no duplicate row', () => {
  const [u21] = planUnits('BTC', { from: '2021-10', to: '2021-10' });
  const src21 = u21.sources[0];
  const a = assembleUnit(u21, [parsedFor(src21, minutes('2021-10-17T23:58:00.000Z', 4))]);
  assert.deepEqual(Array.from(a.columns.open_time), [ms('2021-10-18T00:00:00.000Z'), ms('2021-10-18T00:01:00.000Z')]);
  const [r25, h25] = planUnits('BTC', { from: '2025-10', to: '2025-10' });
  const rows25 = parsedFor(r25.sources[0], minutes('2025-10-16T23:58:00.000Z', 4));
  const research = assembleUnit(r25, [rows25]), holdout = assembleUnit(h25, [rows25]);
  assert.deepEqual(Array.from(research.columns.open_time), [ms('2025-10-16T23:58:00.000Z'), ms('2025-10-16T23:59:00.000Z')]);
  assert.deepEqual(Array.from(holdout.columns.open_time), [ms('2025-10-17T00:00:00.000Z'), ms('2025-10-17T00:01:00.000Z')]);
  const [u26] = planUnits('BTC', { from: '2026-10', to: '2026-10' });
  const day16 = u26.sources[15];
  const end = assembleUnit(u26, [parsedFor(day16, minutes('2026-10-16T23:58:00.000Z', 2))]);
  assert.equal(new Date(end.columns.open_time.at(-1)).toISOString(), '2026-10-16T23:59:00.000Z');
  assert.throws(() => parseKlines(Buffer.from(klineCsv(minutes('2026-10-17T00:00:00.000Z', 1))), day16), /outside its source/);
  assert.equal(research.rowCount + holdout.rowCount, 4);
  for (const name of Object.keys(research.columns)) assert.ok(research.columns[name] instanceof Float64Array);
});

test('F1a-2 units: a multi-file unit is assembled in source-file order whatever order the files arrive in', () => {
  const [u26] = planUnits('SOL', { from: '2026-10', to: '2026-10' });
  const inputs = u26.sources.slice(0, 3).map((s, i) => parsedFor(s, minutes(`2026-10-0${i + 1}T12:00:00.000Z`, 2)));
  const forward = assembleUnit(u26, inputs), reversed = assembleUnit(u26, [...inputs].reverse());
  for (const name of Object.keys(forward.columns)) assert.deepEqual(Array.from(reversed.columns[name]), Array.from(forward.columns[name]));
  assert.equal(forward.rowCount, 6);
  assert.throws(() => assembleUnit(u26, [inputs[0], inputs[0]]), /duplicate source/);
  assert.throws(() => assembleUnit(u26, [{ file: 'data/futures/um/daily/klines/SOLUSDT/1m/SOLUSDT-1m-2026-09-30.zip', parsed: inputs[0].parsed }]), /not a source of this unit/);
});

test('F1a-2 coverage: missing ranges cover the whole unit including leading and trailing gaps, end exclusive; an empty unit is all gap', () => {
  const [unit] = planUnits('XRP', { from: '2024-02', to: '2024-02' });
  const full = unitCoverage(unit, Float64Array.from(minutes('2024-02-01T00:00:00.000Z', 29 * 1440)));
  assert.deepEqual(full, { expectedMinutes: 41760, rowCount: 41760, missingMinutes: 0, missingRanges: [] });
  const sparse = unitCoverage(unit, Float64Array.from([ms('2024-02-01T00:02:00.000Z'), ms('2024-02-01T00:03:00.000Z'), ms('2024-02-10T00:00:00.000Z')]));
  assert.equal(sparse.missingMinutes, 41760 - 3);
  assert.deepEqual(sparse.missingRanges, [
    { start: '2024-02-01T00:00:00.000Z', end: '2024-02-01T00:02:00.000Z' },
    { start: '2024-02-01T00:04:00.000Z', end: '2024-02-10T00:00:00.000Z' },
    { start: '2024-02-10T00:01:00.000Z', end: '2024-03-01T00:00:00.000Z' }]);
  assert.deepEqual(unitCoverage(unit, new Float64Array(0)), { expectedMinutes: 41760, rowCount: 0, missingMinutes: 41760,
    missingRanges: [{ start: '2024-02-01T00:00:00.000Z', end: '2024-03-01T00:00:00.000Z' }] });
  // A source whose rows all fall outside the unit leaves the unit empty (gap status, no snapshot).
  const [u21] = planUnits('XRP', { from: '2021-10', to: '2021-10' });
  const empty = assembleUnit(u21, [parsedFor(u21.sources[0], minutes('2021-10-01T00:00:00.000Z', 3))]);
  assert.equal(empty.rowCount, 0);
  assert.equal(unitCoverage(u21, empty.columns.open_time).missingMinutes, 14 * 1440);
});
