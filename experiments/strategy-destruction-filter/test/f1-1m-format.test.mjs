// F1a-2: columnar 1m snapshot format v1 (docs/f1/f1a-2-contract.md, A2).
import test from 'node:test';
import assert from 'node:assert/strict';
import { COLUMNS, canonicalJson, encodeSnapshot, decodeSnapshot, hasExactKeys, snapshotHeader } from '../src/f1-1m-format.mjs';

const T0 = Date.parse('2024-01-01T00:00:00.000Z');
const SHA = '21eeac04a76a7a35b10467e5e752fb2f8cff77cdeb57df6b50a23ce8d69bb190';
const meta = (over = {}) => ({ instrument: { exchange: 'binance', market: 'linear_perpetual', contract: 'BTCUSDT' }, period: 'research',
  dataStart: '2024-01-01T00:00:00.000Z', dataEnd: '2024-02-01T00:00:00.000Z',
  sources: [{ file: 'data/futures/um/monthly/klines/BTCUSDT/1m/BTCUSDT-1m-2024-01.zip', sha256: SHA }], ...over });
const columns = (n = 3, over = {}) => ({
  open_time: Array.from({ length: n }, (_, i) => T0 + i * 60000), open: Array(n).fill(42314), high: Array(n).fill(42335.8),
  low: Array(n).fill(42289.6), close: Array(n).fill(42331.9), volume: Array(n).fill(289.641), quote_volume: Array(n).fill(12256155.25625),
  count: Array(n).fill(3310), taker_buy_volume: Array(n).fill(175.211), taker_buy_quote_volume: Array(n).fill(7414459.86355), ...over });
const headerLength = bytes => bytes.readUInt32LE(8);
const headerText = bytes => bytes.subarray(12, 12 + headerLength(bytes)).toString('utf8');
// Re-pack a header text with minimal padding in front of a given body (for crafted invalid files).
function craft(text, body, { pad } = {}) {
  const json = Buffer.from(text, 'utf8');
  const spaces = pad ?? (8 - ((12 + json.length) % 8)) % 8;
  const head = Buffer.alloc(12);
  head.write('RALPHCOL', 0, 'latin1');
  head.writeUInt32LE(json.length + spaces, 8);
  return Buffer.concat([head, json, Buffer.alloc(spaces, 0x20), body]);
}
const bodyOf = bytes => bytes.subarray(12 + headerLength(bytes));
const withHeader = (bytes, edit) => { const h = JSON.parse(headerText(bytes)); edit(h); return craft(canonicalJson(h), bodyOf(bytes)); };

test('F1a-2 format v1 byte layout: magic, uint32 LE header length incl. minimal padding, canonical header, f64 LE columns, exact length', () => {
  const bytes = encodeSnapshot(meta(), columns(3));
  assert.equal(bytes.subarray(0, 8).toString('latin1'), 'RALPHCOL');
  const h = headerLength(bytes);
  assert.equal((12 + h) % 8, 0);
  const text = headerText(bytes), json = text.trimEnd();
  assert.ok(text.length - json.length <= 7 && /^ *$/.test(text.slice(json.length)));
  assert.equal((8 - ((12 + Buffer.byteLength(json)) % 8)) % 8, text.length - json.length);
  assert.equal(json, canonicalJson(JSON.parse(json)));
  assert.ok(!/\s/.test(json.replace(/"[^"]*"/g, '')));
  const header = JSON.parse(json);
  assert.deepEqual(Object.keys(header), ['columns', 'dataEnd', 'dataStart', 'firstOpenTime', 'instrument', 'kind', 'lastOpenTime', 'period', 'rowCount', 'schemaVersion', 'sources']);
  assert.deepEqual(header.columns, COLUMNS.map(c => ({ dtype: c.dtype, name: c.name, unit: c.unit })));
  assert.deepEqual(header.columns.map(c => c.name), ['open_time', 'open', 'high', 'low', 'close', 'volume', 'quote_volume', 'count', 'taker_buy_volume', 'taker_buy_quote_volume']);
  assert.deepEqual(header.columns.map(c => c.unit), ['ms_utc', 'quote_per_base', 'quote_per_base', 'quote_per_base', 'quote_per_base', 'base', 'quote', 'trades', 'base', 'quote']);
  assert.equal(header.schemaVersion, 1);
  assert.equal(header.kind, 'binance_vision_kline_1m');
  assert.equal(header.rowCount, 3);
  assert.equal(header.firstOpenTime, '2024-01-01T00:00:00.000Z');
  assert.equal(header.lastOpenTime, '2024-01-01T00:02:00.000Z');
  assert.equal(bytes.length, 12 + h + 8 * 10 * 3);
  const body = bodyOf(bytes);
  assert.equal(body.readDoubleLE(0), T0);
  assert.equal(body.readDoubleLE(8 * 3), 42314); // second column starts after rowCount values of the first
  assert.equal(body.readDoubleLE(8 * 3 * 7 + 16), 3310);
  const le = Buffer.alloc(8); le.writeDoubleLE(42314);
  assert.deepEqual(body.subarray(24, 32), le);
});

test('F1a-2 format v1 padding is the minimum 0-7 spaces for every header length residue', () => {
  const seen = new Set();
  for (let n = 1; n <= 16; n++) {
    const bytes = encodeSnapshot(meta({ instrument: { exchange: 'binance', market: 'linear_perpetual', contract: 'X'.repeat(n) } }), columns(1));
    const text = headerText(bytes), pad = text.length - text.trimEnd().length;
    assert.equal(pad, (8 - ((12 + Buffer.byteLength(text.trimEnd())) % 8)) % 8);
    seen.add(pad);
    assert.deepEqual(decodeSnapshot(bytes).header.instrument.contract, 'X'.repeat(n));
  }
  assert.deepEqual([...seen].sort(), [0, 1, 2, 3, 4, 5, 6, 7]);
});

test('F1a-2 format v1 round trip returns the values, the header and Float64Array columns', () => {
  const cols = columns(4, { close: [1.1, 2.2, 3.3, 4.4] });
  const { header, columns: out } = decodeSnapshot(encodeSnapshot(meta(), cols));
  assert.equal(header.rowCount, 4);
  assert.deepEqual(header.sources, meta().sources);
  for (const { name } of COLUMNS) {
    assert.ok(out[name] instanceof Float64Array);
    assert.deepEqual(Array.from(out[name]), cols[name]);
  }
  assert.deepEqual(Object.keys(out), COLUMNS.map(c => c.name));
});

test('F1a-2 format v1 normalizes -0 to 0 when writing', () => {
  const bytes = encodeSnapshot(meta(), columns(2, { volume: [-0, 0], taker_buy_volume: [-0, 0] }));
  const { columns: out } = decodeSnapshot(bytes);
  assert.ok(Object.is(out.volume[0], 0) && Object.is(out.taker_buy_volume[0], 0));
  const body = bodyOf(bytes);
  assert.deepEqual(body.subarray(8 * 2 * 5, 8 * 2 * 5 + 8), Buffer.alloc(8));
});

test('F1a-2 format v1 encoder rejects non-finite values, ragged or missing columns, empty units and bad header fields', () => {
  for (const bad of [NaN, Infinity, -Infinity]) assert.throws(() => encodeSnapshot(meta(), columns(2, { high: [42335.8, bad] })), /non-finite/);
  assert.throws(() => encodeSnapshot(meta(), columns(2, { low: [1] })), /length/);
  const missing = columns(2); delete missing.count;
  assert.throws(() => encodeSnapshot(meta(), missing), /column/);
  assert.throws(() => encodeSnapshot(meta(), { ...columns(2), extra: [1, 2] }), /column/);
  assert.throws(() => encodeSnapshot(meta(), columns(0)), /rowCount/);
  assert.throws(() => encodeSnapshot(meta({ dataStart: '2024-01-01T00:00:00Z' }), columns(1)), /ISO/);
  assert.throws(() => encodeSnapshot(meta({ period: 'forward' }), columns(1)), /period/);
  assert.throws(() => encodeSnapshot(meta({ sources: [] }), columns(1)), /sources/);
  assert.throws(() => encodeSnapshot(meta({ sources: [{ file: '/data/futures/BTCUSDT-1m-2024-01.zip', sha256: SHA }] }), columns(1)), /source file/);
  assert.throws(() => encodeSnapshot(meta({ sources: [{ file: 'data/../x.zip', sha256: SHA }] }), columns(1)), /source file/);
  assert.throws(() => encodeSnapshot(meta({ sources: [{ file: 'data/x.zip', sha256: 'ABC' }] }), columns(1)), /sha256/);
  assert.throws(() => encodeSnapshot(meta({ sources: [{ file: 'data/x.zip', sha256: SHA }, { file: 'data/x.zip', sha256: SHA }] }), columns(1)), /duplicate/);
  assert.throws(() => encodeSnapshot(meta({ instrument: { exchange: 'binance', market: 'linear_perpetual' } }), columns(1)), /instrument/);
  assert.throws(() => encodeSnapshot(meta(), columns(2, { open_time: [T0 + 0.5, T0 + 60000] })), /open_time/);
});

test('F1a-2 format v1 sorts header keys and sources by plain code-unit order, never locale order', () => {
  assert.equal(canonicalJson({ b: 1, B: 2, a: { d: 1, C: 2 }, list: [{ z: 1, Y: 2 }] }), '{"B":2,"a":{"C":2,"d":1},"b":1,"list":[{"Y":2,"z":1}]}');
  const sources = [{ file: 'data/x/b.zip', sha256: SHA }, { file: 'data/x/B.zip', sha256: SHA }, { file: 'data/x/a.zip', sha256: SHA }];
  const { header } = decodeSnapshot(encodeSnapshot(meta({ sources }), columns(1)));
  assert.deepEqual(header.sources.map(s => s.file), ['data/x/B.zip', 'data/x/a.zip', 'data/x/b.zip']);
});

test('F1a-2 format v1 decoder rejects a corrupt file before allocating columns', () => {
  const good = encodeSnapshot(meta(), columns(2));
  const reject = (bytes, pattern) => assert.throws(() => decodeSnapshot(bytes), pattern);
  const badMagic = Buffer.from(good); badMagic.write('RALPHCOX', 0, 'latin1');
  reject(badMagic, /magic/);
  reject(good.subarray(0, 10), /magic|length/);
  const huge = Buffer.from(good); huge.writeUInt32LE(64 * 1024 + 4, 8);
  reject(huge, /header/);
  reject(withHeader(good, h => { h.schemaVersion = 2; }), /Unknown schemaVersion/);
  reject(withHeader(good, h => { h.extra = 1; }), /header key/);
  reject(withHeader(good, h => { delete h.kind; }), /header key/);
  reject(withHeader(good, h => { h.kind = 'other'; }), /kind/);
  reject(withHeader(good, h => { h.columns = [h.columns[1], h.columns[0], ...h.columns.slice(2)]; }), /column/);
  reject(withHeader(good, h => { h.columns[3].dtype = 'f32le'; }), /column/);
  reject(withHeader(good, h => { h.columns[0].unit = 'us_utc'; }), /column/);
  for (const rowCount of [0, -1, 1.5, '2', 2 ** 53]) reject(withHeader(good, h => { h.rowCount = rowCount; }), /rowCount/);
  const text = headerText(good).trimEnd();
  reject(craft(text.replace('"kind":', '"kind":"x","kind":'), bodyOf(good)), /canonical/);
  reject(craft(text.replace('{"columns"', '{ "columns"'), bodyOf(good)), /canonical/);
  reject(craft(text, bodyOf(good), { pad: ((8 - ((12 + Buffer.byteLength(text)) % 8)) % 8) + 8 }), /padding/);
  reject(craft(text + '\n', bodyOf(good)), /canonical|padding/);
  reject(good.subarray(0, good.length - 8), /length/);
  reject(Buffer.concat([good, Buffer.alloc(8)]), /length/);
  // A claimed row count far beyond the file fails on the length check, not on a huge allocation.
  reject(withHeader(good, h => { h.rowCount = 2 ** 40; }), /length/);
  reject(withHeader(good, h => { h.firstOpenTime = '2024-01-01T00:01:00.000Z'; }), /firstOpenTime/);
  const nan = Buffer.from(good); nan.writeDoubleLE(NaN, 12 + headerLength(good) + 8 * 2 * 4);
  reject(nan, /non-finite/);
  const negZero = Buffer.from(good); negZero.writeDoubleLE(-0, 12 + headerLength(good) + 8 * 2 * 5);
  reject(negZero, /-0/);
});

// Review round 8: exact key comparison, never key lists joined with commas.
test('F1a-2 r8 format: hasExactKeys compares the sorted own keys of a plain object element by element; a key containing a comma never stands for two keys', () => {
  assert.equal(hasExactKeys({ b: 1, a: 2 }, ['a', 'b']), true);
  assert.equal(hasExactKeys(Object.assign(Object.create(null), { a: 1, b: 2 }), ['b', 'a']), true);
  for (const value of [{ 'a,b': 1 }, { a: 1 }, { a: 1, b: 2, c: 3 }, { a: 1, 'b,': 2 }, ['a', 'b'], null, undefined, 'a,b', new Map([['a', 1], ['b', 2]]),
    Object.assign(Object.create({ inherited: true }), { a: 1, b: 2 })]) {
    assert.equal(hasExactKeys(value, ['a', 'b']), false, String(value && JSON.stringify(value)));
  }
});

test('F1a-2 r8 format: a merged key such as "exchange,market" is rejected by encodeSnapshot and decodeSnapshot (instrument, source, columns, header keys)', () => {
  const merged = { contract: 'BTCUSDT', 'exchange,market': 'binance' };
  assert.throws(() => encodeSnapshot(meta({ instrument: merged }), columns(3)), /incomplete instrument/);
  assert.throws(() => encodeSnapshot(meta({ sources: [{ 'file,sha256': SHA }] }), columns(3)), /source entries need exactly file and sha256/);
  const { high, low, ...rest } = columns(3);
  void low;
  assert.throws(() => encodeSnapshot(meta(), { ...rest, 'high,low': high }), /columns must be exactly/);
  const good = encodeSnapshot(meta(), columns(3));
  assert.throws(() => decodeSnapshot(withHeader(good, h => { h.instrument = merged; })), /incomplete instrument/);
  assert.throws(() => decodeSnapshot(withHeader(good, h => { h.sources = [{ 'file,sha256': SHA }]; })), /source entries need exactly file and sha256/);
  assert.throws(() => decodeSnapshot(withHeader(good, h => { h['dataEnd,dataStart'] = h.dataStart; delete h.dataStart; delete h.dataEnd; })), /header keys must be exactly/);
  assert.throws(() => decodeSnapshot(withHeader(good, h => { h['high,low'] = 1; })), /header keys must be exactly/);
});

test('F1a-2 r8 format: snapshotHeader gives the header bytes and the file length encodeSnapshot writes', () => {
  for (const n of [1, 3, 40]) {
    const m = meta(), c = columns(n), bytes = encodeSnapshot(m, c);
    const { bytes: head, length } = snapshotHeader({ ...m, rowCount: n, firstOpenTime: new Date(c.open_time[0]).toISOString(), lastOpenTime: new Date(c.open_time.at(-1)).toISOString() });
    assert.equal(length, bytes.length);
    assert.equal(length, 12 + head.length + 8 * 10 * n);
    assert.deepEqual(bytes.subarray(12, 12 + head.length), head);
    assert.equal((12 + head.length) % 8, 0);
  }
});
