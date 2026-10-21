// F1a-2 Binance Vision source files (docs/f1/f1a-2-contract.md): ZIP member, CHECKSUM, kline CSV rows, units.
// Node built-ins only. Every check fails closed: a file that fails gives no rows at all.
import zlib from 'node:zlib';
import { createHash } from 'node:crypto';
import { PERIODS } from './h2-contract.mjs';

export const MAX_MEMBER_BYTES = 64 * 1024 * 1024;
const fail = message => { throw new Error(`Vision zip: ${message}`); };

// The one expected member of a Vision zip, located through the end record and the central directory. Only the
// variant seen in real files is accepted: one member, deflate, no flags, no zip64.
export function readZipMember(bytes, expectedName, { maxBytes = MAX_MEMBER_BYTES } = {}) {
  const buf = Buffer.from(bytes.buffer, bytes.byteOffset, bytes.byteLength);
  let eocd = -1;
  for (let i = buf.length - 22; i >= Math.max(0, buf.length - 22 - 0xffff); i--) {
    if (buf.readUInt32LE(i) === 0x06054b50 && i + 22 + buf.readUInt16LE(i + 20) === buf.length) { eocd = i; break; }
  }
  if (eocd < 0) fail('no end record (truncated or not a zip)');
  const entries = buf.readUInt16LE(eocd + 10), cdSize = buf.readUInt32LE(eocd + 12), cdOffset = buf.readUInt32LE(eocd + 16);
  if (buf.readUInt16LE(eocd + 4) || buf.readUInt16LE(eocd + 6) || buf.readUInt16LE(eocd + 8) !== entries) fail('multi-disk zip');
  if (entries === 0xffff || cdSize === 0xffffffff || cdOffset === 0xffffffff) fail('zip64 not supported');
  if (entries !== 1) fail(`expected exactly one member, found ${entries}`);
  if (cdOffset + cdSize !== eocd || cdSize < 46) fail('central directory out of place');
  if (buf.readUInt32LE(cdOffset) !== 0x02014b50) fail('bad central directory header');
  const flags = buf.readUInt16LE(cdOffset + 8), method = buf.readUInt16LE(cdOffset + 10), crc = buf.readUInt32LE(cdOffset + 16);
  const packedSize = buf.readUInt32LE(cdOffset + 20), size = buf.readUInt32LE(cdOffset + 24);
  const nameLength = buf.readUInt16LE(cdOffset + 28), localOffset = buf.readUInt32LE(cdOffset + 42);
  if (46 + nameLength + buf.readUInt16LE(cdOffset + 30) + buf.readUInt16LE(cdOffset + 32) !== cdSize) fail('central directory size mismatch');
  const name = buf.toString('latin1', cdOffset + 46, cdOffset + 46 + nameLength);
  if (name !== expectedName) fail(`unexpected member ${JSON.stringify(name)}, expected ${expectedName}`);
  if (packedSize === 0xffffffff || size === 0xffffffff) fail('zip64 not supported');
  if (flags !== 0) fail(`unsupported flags ${flags}`);
  if (method !== 8) fail(`unsupported compression method ${method}`);
  if (size > maxBytes) fail(`member of ${size} bytes over the ${maxBytes} byte cap`);
  if (localOffset + 30 > cdOffset || buf.readUInt32LE(localOffset) !== 0x04034b50) fail('bad local header');
  const localName = buf.readUInt16LE(localOffset + 26), localExtra = buf.readUInt16LE(localOffset + 28);
  if (buf.readUInt16LE(localOffset + 6) !== flags || buf.readUInt16LE(localOffset + 8) !== method || localName !== nameLength
    || buf.toString('latin1', localOffset + 30, localOffset + 30 + localName) !== name) fail('local header disagrees with the central directory');
  const start = localOffset + 30 + localName + localExtra;
  if (start + packedSize > cdOffset) fail('member data runs into the central directory');
  let out;
  try { out = zlib.inflateRawSync(buf.subarray(start, start + packedSize), { maxOutputLength: maxBytes }); }
  catch (error) { fail(error.code === 'ERR_BUFFER_TOO_LARGE' ? `member inflates over the ${maxBytes} byte cap` : `inflate failed (${error.code ?? error.message})`); }
  if (out.length !== size) fail(`uncompressed size ${out.length} != declared ${size}`);
  if (zlib.crc32(out) !== crc) fail('CRC32 mismatch');
  return out;
}

// A Vision .CHECKSUM file is exactly "<64 lowercase hex>  <zip name>\n" (sha256sum format, as published).
export function parseChecksum(text, expectedZipName) {
  const match = typeof text === 'string' ? /^([0-9a-f]{64}) {2}([^\s]+)\n$/.exec(text) : null;
  if (!match) throw new Error(`Vision CHECKSUM: malformed CHECKSUM for ${expectedZipName}`);
  if (match[2] !== expectedZipName) throw new Error(`Vision CHECKSUM: names ${match[2]}, expected ${expectedZipName}`);
  return match[1];
}
// The zip's own bytes against its own CHECKSUM, before anything is parsed or written. Returns the verified sha256.
export function verifyZip(zipBytes, checksumText, zipName) {
  if (typeof checksumText !== 'string') throw new Error(`Vision CHECKSUM: missing CHECKSUM for ${zipName}`);
  const published = parseChecksum(checksumText, zipName);
  const actual = createHash('sha256').update(zipBytes).digest('hex');
  if (actual !== published) throw new Error(`Vision CHECKSUM: sha256 mismatch for ${zipName}`);
  return actual;
}

// Kline CSV rows (contract A3). The first line is the exact header or a numeric first row; anything else fails.
// Rows are validated against their source file's bounds [startMs, endMs); units are clipped later. Errors name
// the row and its open time, never a price.
export const KLINE_HEADER = 'open_time,open,high,low,close,volume,close_time,quote_volume,count,taker_buy_volume,taker_buy_quote_volume,ignore';
export const KLINE_COLUMNS = Object.freeze(['open_time', 'open', 'high', 'low', 'close', 'volume', 'quote_volume', 'count', 'taker_buy_volume', 'taker_buy_quote_volume']);
// The value rules a row can break without failing its file (contract amendment round 5, Q1), in the fixed order in
// which the first broken one is recorded. The texts are part of the manifest: never reword them.
export const QUARANTINE_RULES = Object.freeze(['volume must be >= 0', 'quote_volume must be >= 0', 'taker_buy_volume must be within 0..volume',
  'taker_buy_quote_volume must be within 0..quote_volume', 'low must be > 0', 'low above min(open, close)', 'high below max(open, close)']);
const KEPT = [0, 1, 2, 3, 4, 5, 7, 8, 9, 10]; // CSV field index of each kept column; close_time (6) is checked, ignore (11) dropped
const POW10 = Array.from({ length: 16 }, (_, k) => 10 ** k); // exact doubles
// The value of the ASCII token buf[a, b) if it matches -?\d+(\.\d+)?, else NaN. With at most 15 digits the mantissa m
// and 10^k are exact doubles, so m / 10^k is the correctly rounded value of the decimal, i.e. Number(token); longer
// tokens go through Number(). Parsing from bytes keeps per-row strings out of the V8 young generation, which
// otherwise grew to 128 MiB over successive months (measured).
function decimalAt(buf, a, b) {
  let i = a, m = 0, digits = 0;
  const negative = i < b && buf[i] === 0x2d;
  if (negative) i++;
  const intStart = i;
  while (i < b && buf[i] >= 0x30 && buf[i] <= 0x39) { m = m * 10 + buf[i] - 0x30; i++; }
  if (i === intStart) return NaN;
  digits = i - intStart;
  let k = 0;
  if (i < b && buf[i] === 0x2e) {
    const fracStart = ++i;
    while (i < b && buf[i] >= 0x30 && buf[i] <= 0x39) { m = m * 10 + buf[i] - 0x30; i++; }
    k = i - fracStart;
    if (!k) return NaN;
    digits += k;
  }
  if (i !== b) return NaN;
  const value = digits <= 15 ? m / POW10[k] : Number(buf.latin1Slice(negative ? a + 1 : a, b));
  return negative ? -value : value;
}
// Exactly 13 ASCII digits: milliseconds UTC for every date this loader accepts; seconds (10) or microseconds (16) fail.
function millisAt(buf, a, b) {
  if (b - a !== 13) return NaN;
  let v = 0;
  for (let i = a; i < b; i++) { const d = buf[i] - 0x30; if (d < 0 || d > 9) return NaN; v = v * 10 + d; }
  return v;
}
const digitsOnly = (buf, a, b) => { for (let i = a; i < b; i++) if (buf[i] < 0x30 || buf[i] > 0x39) return false; return b > a; };
export function parseKlines(csv, { startMs, endMs }) {
  const buf = Buffer.from(csv.buffer, csv.byteOffset, csv.byteLength);
  if (!buf.length || buf[buf.length - 1] !== 0x0a) throw new Error('Vision klines: file does not end with a newline');
  let lineCount = 0;
  for (let p = buf.indexOf(0x0a); p !== -1; p = buf.indexOf(0x0a, p + 1)) lineCount++;
  const firstEnd = buf.indexOf(0x0a);
  const firstLine = buf.latin1Slice(0, Math.min(firstEnd, KLINE_HEADER.length + 1));
  let variant = 'no_header', pos = 0, rowCount = lineCount;
  if (firstLine === KLINE_HEADER) { variant = 'header'; pos = firstEnd + 1; rowCount--; }
  else if (!(buf[0] >= 0x30 && buf[0] <= 0x39)) throw new Error('Vision klines: unknown header (expected the exact Vision header or a numeric first row)');
  if (rowCount < 1) throw new Error('Vision klines: no rows');
  const columns = Object.fromEntries(KLINE_COLUMNS.map(name => [name, new Float64Array(rowCount)]));
  const cols = KLINE_COLUMNS.map(name => columns[name]);
  const starts = new Int32Array(13); // field j spans [starts[j], starts[j + 1] - 1)
  let previous = -Infinity;
  for (let r = 0; r < rowCount; r++) {
    const end = buf.indexOf(0x0a, pos), row = r + 1;
    if (end === pos) throw new Error(`Vision klines: empty line at row ${row}`);
    let fields = 1;
    starts[0] = pos;
    for (let i = pos; i < end; i++) if (buf[i] === 0x2c) { if (fields < 12) starts[fields] = i + 1; fields++; }
    if (fields !== 12) throw new Error(`Vision klines: row ${row} has ${fields} fields, expected 12 columns`);
    starts[12] = end + 1;
    pos = end + 1;
    const openTime = millisAt(buf, starts[0], starts[1] - 1), closeTime = millisAt(buf, starts[6], starts[7] - 1);
    if (Number.isNaN(openTime) || Number.isNaN(closeTime)) throw new Error(`Vision klines: row ${row} timestamp unit is not milliseconds`);
    if (openTime % 60000 !== 0) throw rowError(row, openTime, 'open_time not aligned to a minute');
    if (closeTime !== openTime + 59999) throw rowError(row, openTime, 'close_time is not open_time + 59,999 ms');
    if (openTime < startMs || openTime >= endMs) throw rowError(row, openTime, 'open_time outside its source file bounds');
    if (openTime <= previous) throw rowError(row, openTime, 'open_time not strictly increasing');
    previous = openTime;
    cols[0][r] = openTime;
    for (let c = 1; c < KEPT.length; c++) {
      const value = decimalAt(buf, starts[KEPT[c]], starts[KEPT[c] + 1] - 1);
      if (!Number.isFinite(value)) throw rowError(row, openTime, `${KLINE_COLUMNS[c]} is not a non-empty finite decimal number`);
      cols[c][r] = value;
    }
    const open = cols[1][r], high = cols[2][r], low = cols[3][r], close = cols[4][r], volume = cols[5][r], quoteVolume = cols[6][r];
    const count = cols[7][r], takerBuy = cols[8][r], takerBuyQuote = cols[9][r];
    const rule = !digitsOnly(buf, starts[8], starts[9] - 1) || !Number.isSafeInteger(count) ? 'count must be a safe non-negative integer'
      : !(volume >= 0) ? 'volume must be >= 0'
      : !(quoteVolume >= 0) ? 'quote_volume must be >= 0'
      : !(takerBuy >= 0 && takerBuy <= volume) ? 'taker_buy_volume must be within 0..volume'
      : !(takerBuyQuote >= 0 && takerBuyQuote <= quoteVolume) ? 'taker_buy_quote_volume must be within 0..quote_volume'
      : !(low > 0) ? 'low must be > 0'
      : !(low <= Math.min(open, close)) ? 'low above min(open, close)'
      : !(high >= Math.max(open, close)) ? 'high below max(open, close)' : null;
    if (rule) throw rowError(row, openTime, rule);
  }
  return { variant, rowCount, columns };
}
const rowError = (row, openTime, rule) => new Error(`Vision klines: row ${row} (${new Date(openTime).toISOString()}): ${rule}`);

// Symbols, instruments and Vision paths are data. Symbol convention: the config symbol (BTC), never the contract.
export const VISION_SYMBOLS = Object.freeze({ BTC: 'BTCUSDT', ETH: 'ETHUSDT', SOL: 'SOLUSDT', XRP: 'XRPUSDT', DOGE: 'DOGEUSDT', HYPE: 'HYPEUSDT' });
const VISION_ROOTS = Object.freeze({ 'binance:linear_perpetual': 'data/futures/um' });
const usage = message => Object.assign(new Error(message), { usage: true });
export function visionInstrument(symbol) {
  if (typeof symbol !== 'string' || !Object.hasOwn(VISION_SYMBOLS, symbol)) throw usage(`Unknown symbol ${JSON.stringify(symbol)}; use one of ${Object.keys(VISION_SYMBOLS).join(',')}`);
  return { exchange: 'binance', market: 'linear_perpetual', contract: VISION_SYMBOLS[symbol] };
}

// The F1a range in milliseconds, parsed from the locked PERIODS strings (windowFor works in seconds; never used here).
const MS_PERIODS = Object.freeze(Object.fromEntries(Object.entries(PERIODS).map(([name, [a, b]]) => [name, [Date.parse(a), Date.parse(b)]])));
export const F1A_RANGE = Object.freeze({ startMs: MS_PERIODS.research[0], endMs: MS_PERIODS.holdout[1] });
const FIRST_MONTH = '2021-10', LAST_MONTH = '2026-10', DAILY_MONTH = '2026-10'; // the month without a monthly file yet
const iso = t => new Date(t).toISOString();
const monthIndex = month => {
  const m = typeof month === 'string' ? /^(\d{4})-(\d\d)$/.exec(month) : null;
  if (!m || +m[2] < 1 || +m[2] > 12) throw usage(`Invalid month ${JSON.stringify(month)}; use YYYY-MM`);
  return +m[1] * 12 + (+m[2] - 1);
};
const monthStart = index => Date.UTC(Math.floor(index / 12), index % 12, 1);
const monthName = index => `${Math.floor(index / 12)}-${String(index % 12 + 1).padStart(2, '0')}`;

function source(instrument, kind, label, startMs, endMs) {
  const root = VISION_ROOTS[`${instrument.exchange}:${instrument.market}`];
  const base = `${instrument.contract}-1m-${label}`;
  const file = `${root}/${kind}/klines/${instrument.contract}/1m/${base}.zip`;
  return { file, checksumFile: `${file}.CHECKSUM`, zipName: `${base}.zip`, csvName: `${base}.csv`, kind, startMs, endMs };
}
const DAY_MS = 86400000;
// The Vision source of an instrument for the UTC month ('monthly') or day ('daily') that starts at startMs.
export function visionSource(instrument, kind, startMs) {
  const d = new Date(startMs);
  return kind === 'monthly' ? source(instrument, kind, iso(startMs).slice(0, 7), startMs, Date.UTC(d.getUTCFullYear(), d.getUTCMonth() + 1, 1))
    : source(instrument, kind, iso(startMs).slice(0, 10), startMs, startMs + DAY_MS);
}
// Units for the inclusive source months from..to: one per instrument x calendar month, clipped to the F1a range and
// split at the period boundary; 2026-10 is built from the daily files 01..16 only.
export function planUnits(symbol, { from = FIRST_MONTH, to = LAST_MONTH } = {}) {
  const instrument = visionInstrument(symbol);
  const a = monthIndex(from), b = monthIndex(to);
  if (a < monthIndex(FIRST_MONTH) || b > monthIndex(LAST_MONTH)) throw usage(`Months must lie inside ${FIRST_MONTH}..${LAST_MONTH} (data after 2026-10-17 is sealed)`);
  if (a > b) throw usage(`--from ${from} is after --to ${to}`);
  const units = [];
  for (let m = a; m <= b; m++) {
    const startMs = monthStart(m), endMs = monthStart(m + 1);
    let sources;
    if (monthName(m) === DAILY_MONTH) {
      sources = [];
      for (let day = startMs; day < F1A_RANGE.endMs; day += 86400000) sources.push(source(instrument, 'daily', iso(day).slice(0, 10), day, day + 86400000));
    } else sources = [source(instrument, 'monthly', monthName(m), startMs, endMs)];
    for (const [period, [p0, p1]] of Object.entries(MS_PERIODS)) {
      const s = Math.max(startMs, p0, F1A_RANGE.startMs), e = Math.min(endMs, p1, F1A_RANGE.endMs);
      if (s < e) units.push({ symbol, instrument, period, dataStart: iso(s), dataEnd: iso(e), startMs: s, endMs: e, sources });
    }
  }
  return units;
}

// Concatenates the parsed rows of a unit's sources in source-file order and clips them to [startMs, endMs).
export function assembleUnit(unit, inputs) {
  const byFile = new Map();
  for (const { file, parsed } of inputs) {
    if (!unit.sources.some(s => s.file === file)) throw new Error(`Vision unit: ${file} is not a source of this unit`);
    if (byFile.has(file)) throw new Error(`Vision unit: duplicate source ${file}`);
    byFile.set(file, parsed);
  }
  const ordered = [...byFile.keys()].sort((x, y) => x < y ? -1 : x > y ? 1 : 0).map(file => byFile.get(file));
  const ranges = ordered.map(p => {
    const t = p.columns.open_time;
    let i = 0, j = t.length;
    while (i < j && t[i] < unit.startMs) i++;
    while (j > i && t[j - 1] >= unit.endMs) j--;
    return [p, i, j];
  });
  const rowCount = ranges.reduce((n, [, i, j]) => n + j - i, 0);
  const columns = Object.fromEntries(KLINE_COLUMNS.map(name => [name, new Float64Array(rowCount)]));
  let offset = 0, previous = -Infinity;
  for (const [p, i, j] of ranges) {
    for (const name of KLINE_COLUMNS) columns[name].set(p.columns[name].subarray(i, j), offset);
    if (j > i && p.columns.open_time[i] <= previous) throw new Error('Vision unit: sources overlap or are out of order');
    if (j > i) previous = p.columns.open_time[j - 1];
    offset += j - i;
  }
  return { rowCount, columns };
}

// Missing minutes over the whole unit, leading and trailing gaps included, ranges end-exclusive. open_time is the
// validated, strictly increasing, minute-aligned column of the unit (possibly empty).
export function unitCoverage(unit, openTime) {
  const missingRanges = [];
  let cursor = unit.startMs;
  for (const t of openTime) {
    if (t > cursor) missingRanges.push({ start: iso(cursor), end: iso(t) });
    cursor = t + 60000;
  }
  if (cursor < unit.endMs) missingRanges.push({ start: iso(cursor), end: iso(unit.endMs) });
  const expectedMinutes = (unit.endMs - unit.startMs) / 60000;
  return { expectedMinutes, rowCount: openTime.length, missingMinutes: expectedMinutes - openTime.length, missingRanges };
}
