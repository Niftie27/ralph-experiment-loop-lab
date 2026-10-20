// F1a-2: Binance Vision source files: ZIP member, CHECKSUM, kline CSV rows and units (docs/f1/f1a-2-contract.md).
import test from 'node:test';
import assert from 'node:assert/strict';
import { readZipMember, parseChecksum, verifyZip, parseKlines } from '../src/vision-source.mjs';
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
