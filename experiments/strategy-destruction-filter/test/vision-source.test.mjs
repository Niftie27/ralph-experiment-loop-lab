// F1a-2: Binance Vision source files: ZIP member, CHECKSUM, kline CSV rows and units (docs/f1/f1a-2-contract.md).
import test from 'node:test';
import assert from 'node:assert/strict';
import { readZipMember, parseChecksum, verifyZip, parseKlines, planUnits, assembleUnit, unitCoverage, visionInstrument, VISION_SYMBOLS, QUARANTINE_RULES,
  visionSource, fillSources, mergeUnit, minuteRanges } from '../src/vision-source.mjs';
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
  // Value rules quarantine the row (contract amendment round 5, Q1); the count rule still fails the file.
  const quarantined = (over, rule) => assert.deepEqual(parseKlines(Buffer.from(KLINE_HEADER + '\n' + klineRow(T[0], over) + '\n'), JAN).quarantined, [{ openTime: T[0], rule }]);
  quarantined({ volume: '-0.001' }, 'volume must be >= 0');
  quarantined({ quoteVolume: '-1' }, 'quote_volume must be >= 0');
  quarantined({ takerBuyVolume: '289.642' }, 'taker_buy_volume must be within 0..volume');
  quarantined({ takerBuyVolume: '-1' }, 'taker_buy_volume must be within 0..volume');
  quarantined({ takerBuyQuoteVolume: '12256155.25626' }, 'taker_buy_quote_volume must be within 0..quote_volume');
  quarantined({ takerBuyQuoteVolume: '-0.5' }, 'taker_buy_quote_volume must be within 0..quote_volume');
  reject({ count: '3.5' }, /count/);
  reject({ count: '-3' }, /count/);
  reject({ count: '9007199254740993' }, /count/);
  quarantined({ low: '0', open: '0', close: '0' }, 'low must be > 0');
  quarantined({ low: '42320.00' }, 'low above min(open, close)');
  quarantined({ high: '42330.00' }, 'high below max(open, close)');
  assert.equal(parseKlines(Buffer.from(KLINE_HEADER + '\n' + klineRow(T[0], { volume: '0', quoteVolume: '0', count: '0', takerBuyVolume: '0', takerBuyQuoteVolume: '0' }) + '\n'), JAN).rowCount, 1);
});

test('F1a-2 klines: errors name the row and time, never a price; sparse rows stay sparse', () => {
  const prices = { high: '98765.43', open: '98799.11' };
  try { parseKlines(Buffer.from(KLINE_HEADER + '\n' + klineRow(T[0], { ...prices, closeTime: String(T[0] + 1) }) + '\n'), JAN); assert.fail('expected a failure'); }
  catch (error) { assert.match(error.message, /2024-01-01T00:00:00.000Z/); assert.doesNotMatch(error.message, /9876|9879|4233|4228/); }
  const record = parseKlines(Buffer.from(KLINE_HEADER + '\n' + klineRow(T[0], prices) + '\n'), JAN).quarantined;
  assert.deepEqual(record, [{ openTime: T[0], rule: 'high below max(open, close)' }]);
  assert.doesNotMatch(JSON.stringify(record), /9876|9879|4233|4228/);
  const sparse = parseKlines(Buffer.from(klineCsv([T[0], T[3]])), JAN);
  assert.deepEqual(Array.from(sparse.columns.open_time), [T[0], T[3]]);
});

test('F1a-2 klines: every parsed value equals Number() of its token, for short, long, zero-padded and negative-zero decimals', () => {
  let seed = 7;
  const rand = n => { seed = (seed * 1103515245 + 12345) % 2147483648; return seed % n; };
  const digits = n => Array.from({ length: n }, () => rand(10)).join('');
  const tokens = ['0', '0.0', '-0.000', '00012.5000', '9007199254740993', '123456789012345', '1234567890123456', '0.000000000000000000001234',
    '42314.00', '12256155.25625', '7414459.86355', '1.7976931348623157', '99999999999999.99'];
  for (let i = 0; i < 400; i++) tokens.push(`${digits(1 + rand(12))}.${digits(1 + rand(12))}`, digits(1 + rand(18)));
  const t0 = Date.parse('2024-01-01T00:00:00.000Z');
  const csv = tokens.map((tok, i) => klineRow(t0 + i * 60000, { volume: tok, quoteVolume: '99999999999999999999', takerBuyVolume: '0', takerBuyQuoteVolume: '0' })).join('\n') + '\n';
  const { columns } = parseKlines(Buffer.from(csv), JAN);
  tokens.forEach((tok, i) => assert.ok(Object.is(columns.volume[i], Number(tok)), tok));
  assert.ok(Object.is(columns.volume[2], -0));
  assert.equal(columns.quote_volume[0], Number('99999999999999999999'));
});

const ms = iso => Date.parse(iso);
const parsedFor =(source, openTimes) => ({ file: source.file, parsed: parseKlines(Buffer.from(klineCsv(openTimes)), source) });

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

// Row quarantine (contract amendment round 5, Q1, Q2 and Q4).
const csvOf = rows => Buffer.from(KLINE_HEADER + '\n' + rows.join('\n') + '\n');
const SEVEN = [{ volume: '-1' }, { quoteVolume: '-1' }, { takerBuyVolume: '289.642' }, { takerBuyQuoteVolume: '12256155.25626' }, { low: '0', open: '0', close: '0' },
  { low: '42320.00' }, { high: '42330.00' }];

test('F1a-2 r5 quarantine: each of the seven value rules quarantines its row with the exact text; no candle, dense columns', () => {
  assert.deepEqual(QUARANTINE_RULES, ['volume must be >= 0', 'quote_volume must be >= 0', 'taker_buy_volume must be within 0..volume',
    'taker_buy_quote_volume must be within 0..quote_volume', 'low must be > 0', 'low above min(open, close)', 'high below max(open, close)']);
  const t = minutes('2024-01-01T00:00:00.000Z', 9);
  const parsed = parseKlines(csvOf([klineRow(t[0]), ...SEVEN.map((over, i) => klineRow(t[i + 1], over)), klineRow(t[8], { close: '42320.50' })]), JAN);
  assert.deepEqual(parsed.quarantined, SEVEN.map((_, i) => ({ openTime: t[i + 1], rule: QUARANTINE_RULES[i] })));
  assert.equal(parsed.rowCount, 2);
  for (const [name, col] of Object.entries(parsed.columns)) assert.equal(col.length, 2, name);
  assert.deepEqual(Array.from(parsed.columns.open_time), [t[0], t[8]]);
  assert.deepEqual(Array.from(parsed.columns.close), [42331.9, 42320.5]);
  assert.ok(Object.values(parsed.columns).every(c => c instanceof Float64Array));
  assert.deepEqual(parseKlines(Buffer.from(klineCsv(t)), JAN).quarantined, []);
});

test('F1a-2 r5 quarantine: a row breaking several value rules records the first in the fixed order', () => {
  const first = over => parseKlines(csvOf([klineRow(T[0], over)]), JAN).quarantined[0].rule;
  assert.equal(first({ volume: '-1', quoteVolume: '-1', high: '1' }), 'volume must be >= 0');
  assert.equal(first({ quoteVolume: '-1', low: '0' }), 'quote_volume must be >= 0');
  assert.equal(first({ takerBuyVolume: '300', takerBuyQuoteVolume: '-1', low: '0' }), 'taker_buy_volume must be within 0..volume');
  assert.equal(first({ takerBuyQuoteVolume: '-1', low: '0' }), 'taker_buy_quote_volume must be within 0..quote_volume');
  assert.equal(first({ low: '0', high: '1' }), 'low must be > 0');
  assert.equal(first({ low: '42320.00', high: '42320.00' }), 'low above min(open, close)');
});

test('F1a-2 r5 quarantine: the count rule, every structural error and a structural error after a quarantinable row still fail the file', () => {
  const reject = (rows, pattern) => assert.throws(() => parseKlines(csvOf(rows), JAN), pattern);
  reject([klineRow(T[0], { count: '3.5', volume: '-1' })], /count/);
  reject([klineRow(T[0], { count: '-3', low: '0' })], /count/);
  reject([klineRow(T[0], { high: 'NaN', volume: '-1' })], /number/);
  reject([klineRow(T[0], { volume: '-1', closeTime: String(T[0] + 60000) })], /close_time/);
  reject([klineRow(T[0], { volume: '-1' }), klineRow(T[1], { closeTime: String(T[1] + 60000) })], /close_time/);
  reject([klineRow(T[0], { volume: '-1' }), klineRow(T[1]).split(',').slice(0, 11).join(',')], /12 columns/);
  reject([klineRow(T[0], { low: '0' }), klineRow(JAN.endMs)], /outside its source/);
  reject([klineRow(T[0], { low: '0' }), klineRow(T[1] + 1000, { closeTime: String(T[1] + 1000 + 59999) })], /aligned/);
  reject([klineRow(T[0], { volume: '-1', openTime: String(T[0] * 1000) })], /milliseconds/);
  assert.throws(() => parseKlines(Buffer.from(KLINE_HEADER + '\n' + klineRow(T[0], { volume: '-1' }) + '\n\n' + klineRow(T[1]) + '\n'), JAN), /empty line/);
  assert.throws(() => parseKlines(Buffer.from(KLINE_HEADER + '\n' + klineRow(T[0], { volume: '-1' })), JAN), /newline/);
});

test('F1a-2 r5 quarantine: a duplicate open_time right after a quarantined row fails', () => {
  assert.throws(() => parseKlines(csvOf([klineRow(T[0], { volume: '-1' }), klineRow(T[0])]), JAN), /not strictly increasing/);
  assert.throws(() => parseKlines(csvOf([klineRow(T[1]), klineRow(T[0], { volume: '-1' })]), JAN), /not strictly increasing/);
});

test('F1a-2 r5 quarantine: 10 quarantined rows in one file pass, 11 fail (counted over the whole file, no values in the error)', () => {
  const t = minutes('2024-01-01T00:00:00.000Z', 12);
  const bad = { open: '98799.11', high: '98765.43' };
  const ten = parseKlines(csvOf([...t.slice(0, 10).map(x => klineRow(x, bad)), klineRow(t[10])]), JAN);
  assert.equal(ten.quarantined.length, 10);
  assert.deepEqual(Array.from(ten.columns.open_time), [t[10]]);
  try { parseKlines(csvOf([klineRow(t[0], bad), klineRow(t[1]), ...t.slice(2, 12).map(x => klineRow(x, bad))]), JAN); assert.fail('expected a failure'); }
  catch (error) {
    assert.match(error.message, /more than 10 quarantined rows in this file/);
    assert.match(error.message, /2024-01-01T00:11:00.000Z/);
    assert.doesNotMatch(error.message, /9876|9879/);
  }
  const all = parseKlines(csvOf(t.slice(0, 3).map(x => klineRow(x, bad))), JAN);
  assert.deepEqual([all.rowCount, all.columns.open_time.length, all.quarantined.length], [0, 0, 3]);
});

// Daily fill (contract amendment round 5, F1, F4, F6).
const DAY = 86400000;
const [JAN24] = planUnits('BTC', { from: '2024-01', to: '2024-01' });
const dayFile = day => `data/futures/um/daily/klines/BTCUSDT/1m/BTCUSDT-1m-${day}.zip`;
const allMinutes = (startMs, endMs, skip = []) => Float64Array.from({ length: (endMs - startMs) / 60000 }, (_, i) => startMs + i * 60000).filter(t => !skip.includes(t));
const dailyOf = (unit, day) => visionSource(unit.instrument, 'daily', ms(`${day}T00:00:00.000Z`));
const parsedRows = (source, rows) => parseKlines(csvOf(rows), source);
// Merges with the dailies given as {source, rows}; returns the result and the files load() was asked for.
function merge(unit, monthlyRows, dailies) {
  const base = { file: unit.sources[0].file, parsed: parsedRows(unit.sources[0], monthlyRows) };
  const loaded = [];
  const byFile = new Map(dailies.map(d => [d.source.file, d]));
  const result = mergeUnit(unit, base, dailies.map(d => d.source), source => { loaded.push(source.file); return parsedRows(source, byFile.get(source.file).rows); });
  return { ...result, loaded };
}

test('F1a-2 r5 fill set: the days of a monthly unit with a minute lacking an accepted candle, leading and trailing days included; per unit in 2025-10; none for 2026-10', () => {
  const files = (unit, openTime) => fillSources(unit, openTime).map(s => s.file);
  assert.deepEqual(files(JAN24, allMinutes(JAN24.startMs, JAN24.endMs)), []);
  const lacking = [ms('2024-01-01T00:00:00.000Z'), ...allMinutes(ms('2024-01-15T00:00:00.000Z'), ms('2024-01-16T00:00:00.000Z')), ms('2024-01-31T23:59:00.000Z')];
  assert.deepEqual(files(JAN24, allMinutes(JAN24.startMs, JAN24.endMs, lacking)), [dayFile('2024-01-01'), dayFile('2024-01-15'), dayFile('2024-01-31')]);
  const [day1] = fillSources(JAN24, allMinutes(JAN24.startMs, JAN24.endMs, lacking));
  assert.deepEqual([day1.kind, day1.startMs, day1.endMs, day1.checksumFile, day1.csvName],
    ['daily', ms('2024-01-01T00:00:00.000Z'), ms('2024-01-02T00:00:00.000Z'), `${dayFile('2024-01-01')}.CHECKSUM`, 'BTCUSDT-1m-2024-01-01.csv']);
  assert.equal(files(JAN24, new Float64Array(0)).length, 31);
  const [oct21] = planUnits('BTC', { from: '2021-10', to: '2021-10' });
  assert.deepEqual(files(oct21, new Float64Array(0)), Array.from({ length: 14 }, (_, i) => dayFile(`2021-10-${18 + i}`)));
  const [r25, h25] = planUnits('BTC', { from: '2025-10', to: '2025-10' });
  const oct25 = allMinutes(ms('2025-10-01T00:00:00.000Z'), ms('2025-11-01T00:00:00.000Z'), [ms('2025-10-16T23:59:00.000Z'), ms('2025-10-17T00:00:00.000Z')]);
  assert.deepEqual([files(r25, oct25), files(h25, oct25)], [[dayFile('2025-10-16')], [dayFile('2025-10-17')]]);
  const [oct26] = planUnits('BTC', { from: '2026-10', to: '2026-10' });
  assert.deepEqual(files(oct26, new Float64Array(0)), []);
});

test('F1a-2 r5 merge: a gap is filled from a daily; valid/valid equal keeps the monthly row; filledRanges are maximal and end-exclusive', () => {
  const t3 = minutes('2024-01-03T00:00:00.000Z', 6), late = minutes('2024-01-03T23:58:00.000Z', 4); // 01-03T23:58 .. 01-04T00:01
  const monthly = [t3[0], t3[1], t3[2], t3[5], late[0], late[3]].map(t => klineRow(t));
  const day3 = dailyOf(JAN24, '2024-01-03'), day4 = dailyOf(JAN24, '2024-01-04');
  const out = merge(JAN24, monthly, [{ source: day3, rows: [...t3, late[0], late[1]].map(t => klineRow(t)) }, { source: day4, rows: [late[2], late[3]].map(t => klineRow(t)) }]);
  assert.deepEqual(out.loaded, [day3.file, day4.file]);
  assert.deepEqual(Array.from(out.columns.open_time), [...t3, ...late]);
  assert.equal(out.rowCount, 10);
  assert.deepEqual(out.filledRanges, [{ start: '2024-01-03T00:03:00.000Z', end: '2024-01-03T00:05:00.000Z' }, { start: '2024-01-03T23:59:00.000Z', end: '2024-01-04T00:01:00.000Z' }]);
  assert.deepEqual(out.quarantinedRows, []);
  assert.ok(Object.values(out.columns).every(c => c instanceof Float64Array && c.length === 10));
  assert.deepEqual(Array.from(out.columns.close), Array(10).fill(42331.9));
  // No fill source: the monthly rows clipped to the unit, as assembleUnit gives them.
  const plain = merge(JAN24, monthly, []);
  const assembled = assembleUnit(JAN24, [{ file: JAN24.sources[0].file, parsed: parsedRows(JAN24.sources[0], monthly) }]);
  for (const name of Object.keys(assembled.columns)) assert.deepEqual(Array.from(plain.columns[name]), Array.from(assembled.columns[name]));
  assert.deepEqual(plain.filledRanges, []);
  assert.deepEqual(minuteRanges([]), []);
  assert.deepEqual(minuteRanges([...t3.slice(0, 2), t3[4]]), [{ start: '2024-01-03T00:00:00.000Z', end: '2024-01-03T00:02:00.000Z' }, { start: '2024-01-03T00:04:00.000Z', end: '2024-01-03T00:05:00.000Z' }]);
});

test('F1a-2 r5 merge: a value mismatch anywhere on a fetched day fails, also outside the holes; parsed values compare, +0 equals -0, the ignore field and decimal spelling do not count', () => {
  const t = minutes('2024-01-03T00:00:00.000Z', 4);
  const day3 = dailyOf(JAN24, '2024-01-03');
  const monthly = [t[0], t[1], t[2]].map(x => klineRow(x, { volume: '0', takerBuyVolume: '0' }));
  try {
    merge(JAN24, monthly, [{ source: day3, rows: t.map((x, i) => klineRow(x, { volume: '0', takerBuyVolume: '0', ...(i === 1 ? { close: '42331.95' } : {}) })) }]);
    assert.fail('expected a disagreement');
  } catch (error) {
    assert.match(error.message, /sources disagree at 2024-01-03T00:01:00.000Z/);
    assert.ok(error.message.includes(JAN24.sources[0].file) && error.message.includes(day3.file));
    assert.doesNotMatch(error.message, /4233|4231|4228/);
  }
  const same = merge(JAN24, monthly, [{ source: day3, rows: t.map(x => klineRow(x, { volume: '-0.0', takerBuyVolume: '0', close: '42331.90000', ignore: '1' })) }]);
  assert.deepEqual([same.rowCount, same.filledRanges], [4, [{ start: '2024-01-03T00:03:00.000Z', end: '2024-01-03T00:04:00.000Z' }]]);
  assert.ok(Object.is(same.columns.volume[0], 0));
});

test('F1a-2 r5 merge: valid / quarantined fails in both directions; an all-quarantined monthly file against a valid daily row fails', () => {
  const t = minutes('2024-01-03T00:00:00.000Z', 3);
  const day3 = dailyOf(JAN24, '2024-01-03');
  const bad = { open: '98799.11', high: '98765.43' };
  const conflict = (monthly, daily) => {
    try { merge(JAN24, monthly, [{ source: day3, rows: daily }]); assert.fail('expected a conflict'); }
    catch (error) { assert.match(error.message, /quarantined/); assert.match(error.message, /2024-01-03T00:01:00.000Z/); assert.doesNotMatch(error.message, /9876|9879/); }
  };
  conflict(t.map(x => klineRow(x)), t.map((x, i) => klineRow(x, i === 1 ? bad : {})));
  conflict(t.map((x, i) => klineRow(x, i === 1 ? bad : {})), t.map(x => klineRow(x)));
  conflict([t[0], t[1]].map(x => klineRow(x, bad)), [klineRow(t[1])]);
});

test('F1a-2 r5 merge: quarantined in both gives two records and one missing minute; quarantined / absent and absent / quarantined give one record; valid / absent keeps the monthly row', () => {
  const t = minutes('2024-01-03T00:00:00.000Z', 5);
  const day3 = dailyOf(JAN24, '2024-01-03');
  const bad = { open: '98799.11', high: '98765.43' }, rule = 'high below max(open, close)';
  // minute:   0 valid/absent, 1 quarantined/quarantined, 2 quarantined/absent, 3 absent/quarantined, 4 valid/valid
  const monthly = [klineRow(t[0]), klineRow(t[1], bad), klineRow(t[2], bad), klineRow(t[4])];
  const out = merge(JAN24, monthly, [{ source: day3, rows: [klineRow(t[1], { volume: '-1' }), klineRow(t[3], bad), klineRow(t[4])] }]);
  assert.deepEqual(Array.from(out.columns.open_time), [t[0], t[4]]);
  assert.deepEqual(out.filledRanges, []);
  const iso = x => new Date(x).toISOString(), monthlyFile = JAN24.sources[0].file;
  assert.deepEqual(out.quarantinedRows, [
    { file: day3.file, openTime: iso(t[1]), rule: 'volume must be >= 0' }, { file: monthlyFile, openTime: iso(t[1]), rule },
    { file: monthlyFile, openTime: iso(t[2]), rule }, { file: day3.file, openTime: iso(t[3]), rule }]);
  assert.equal(unitCoverage(JAN24, out.columns.open_time).missingMinutes, 31 * 1440 - 2);
});

// Review round 7: the row count is bounded by the minutes of the source file before anything is allocated.
test('F1a-2 r7 klines: a file with more rows than the minutes of its source bounds fails before any row is parsed; a full day still parses', () => {
  const day = dailyOf(JAN24, '2024-01-03');
  // 1,440 short lines reach row parsing (a row error); 1,441 fail on the count, before any row is read.
  assert.throws(() => parseKlines(Buffer.from('1\n'.repeat(1440)), day), /row 1 has 1 fields/);
  assert.throws(() => parseKlines(Buffer.from('1\n'.repeat(1441)), day), /^Error: Vision klines: 1441 rows exceed the 1440 minutes of the source file$/);
  assert.throws(() => parseKlines(Buffer.from(KLINE_HEADER + '\n' + '1\n'.repeat(1441)), day), /1441 rows exceed the 1440 minutes/);
  assert.throws(() => parseKlines(Buffer.from('1\n'.repeat(31 * 1440 + 1)), JAN), /44641 rows exceed the 44640 minutes of the source file/);
  assert.throws(() => parseKlines(Buffer.from('1\n'.repeat(31 * 1440)), JAN), /row 1 has 1 fields/);
  const full = parseKlines(Buffer.from(klineCsv(minutes('2024-01-03T00:00:00.000Z', 1440))), day);
  assert.deepEqual([full.rowCount, full.columns.open_time.at(-1)], [1440, ms('2024-01-03T23:59:00.000Z')]);
});
