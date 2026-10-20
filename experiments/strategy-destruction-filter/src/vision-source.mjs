// F1a-2 Binance Vision source files (docs/f1/f1a-2-contract.md): ZIP member, CHECKSUM, kline CSV rows, units.
// Node built-ins only. Every check fails closed: a file that fails gives no rows at all.
import zlib from 'node:zlib';
import { createHash } from 'node:crypto';

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
const KEPT = [0, 1, 2, 3, 4, 5, 7, 8, 9, 10]; // CSV field index of each kept column; close_time (6) is checked, ignore (11) dropped
const DECIMAL = /^-?\d+(\.\d+)?$/;
const MS = /^\d{13}$/; // milliseconds UTC for every date this loader accepts; seconds (10 digits) or microseconds (16) fail
export function parseKlines(csv, { startMs, endMs }) {
  const text = Buffer.from(csv.buffer, csv.byteOffset, csv.byteLength).toString('latin1');
  if (!text.endsWith('\n')) throw new Error('Vision klines: file does not end with a newline');
  const lines = text.slice(0, -1).split('\n');
  let variant = 'no_header', first = 0;
  if (lines[0] === KLINE_HEADER) { variant = 'header'; first = 1; }
  else if (!/^\d/.test(lines[0])) throw new Error('Vision klines: unknown header (expected the exact Vision header or a numeric first row)');
  const rowCount = lines.length - first;
  if (rowCount < 1) throw new Error('Vision klines: no rows');
  const columns = Object.fromEntries(KLINE_COLUMNS.map(name => [name, new Float64Array(rowCount)]));
  const cols = KLINE_COLUMNS.map(name => columns[name]);
  let previous = -Infinity;
  for (let r = 0; r < rowCount; r++) {
    const line = lines[first + r], row = r + 1;
    if (line === '') throw new Error(`Vision klines: empty line at row ${row}`);
    const fields = line.split(',');
    if (fields.length !== 12) throw new Error(`Vision klines: row ${row} has ${fields.length} fields, expected 12 columns`);
    if (!MS.test(fields[0]) || !MS.test(fields[6])) throw new Error(`Vision klines: row ${row} timestamp unit is not milliseconds`);
    const openTime = Number(fields[0]);
    const at = `row ${row} (${Number.isSafeInteger(openTime) ? new Date(openTime).toISOString() : 'invalid time'})`;
    const bad = rule => { throw new Error(`Vision klines: ${at}: ${rule}`); };
    if (!Number.isSafeInteger(openTime) || openTime % 60000 !== 0) bad('open_time not aligned to a minute');
    if (Number(fields[6]) !== openTime + 59999) bad('close_time is not open_time + 59,999 ms');
    if (openTime < startMs || openTime >= endMs) bad('open_time outside its source file bounds');
    if (openTime <= previous) bad('open_time not strictly increasing');
    previous = openTime;
    cols[0][r] = openTime;
    for (let c = 1; c < KEPT.length; c++) {
      const token = fields[KEPT[c]];
      if (!DECIMAL.test(token) || !Number.isFinite(Number(token))) bad(`${KLINE_COLUMNS[c]} is not a non-empty finite decimal number`);
      cols[c][r] = Number(token);
    }
    const [, open, high, low, close, volume, quoteVolume, count, takerBuy, takerBuyQuote] = cols.map(col => col[r]);
    if (!/^\d+$/.test(fields[8]) || !Number.isSafeInteger(count)) bad('count must be a safe non-negative integer');
    if (!(volume >= 0)) bad('volume must be >= 0');
    if (!(quoteVolume >= 0)) bad('quote_volume must be >= 0');
    if (!(takerBuy >= 0 && takerBuy <= volume)) bad('taker_buy_volume must be within 0..volume');
    if (!(takerBuyQuote >= 0 && takerBuyQuote <= quoteVolume)) bad('taker_buy_quote_volume must be within 0..quote_volume');
    if (!(low > 0)) bad('low must be > 0');
    if (!(low <= Math.min(open, close))) bad('low above min(open, close)');
    if (!(high >= Math.max(open, close))) bad('high below max(open, close)');
  }
  return { variant, rowCount, columns };
}
