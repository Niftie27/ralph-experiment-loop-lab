// Test fixtures for F1a-2 (synthetic Binance Vision zips, CSVs and CHECKSUM files). Kept outside test/ so
// `node --test` does not count this module as a test file.
import zlib from 'node:zlib';
import { createHash } from 'node:crypto';

export const sha256 = bytes => createHash('sha256').update(bytes).digest('hex');
export const KLINE_HEADER = 'open_time,open,high,low,close,volume,close_time,quote_volume,count,taker_buy_volume,taker_buy_quote_volume,ignore';

// One CSV row per open time; fields follow the real file layout (12 columns, ms timestamps, close = open + 59,999).
export function klineRow(openTime, over = {}) {
  const r = { open: '42314.00', high: '42335.80', low: '42289.60', close: '42331.90', volume: '289.641', closeTime: String(openTime + 59999),
    quoteVolume: '12256155.25625', count: '3310', takerBuyVolume: '175.211', takerBuyQuoteVolume: '7414459.86355', ignore: '0', ...over };
  return [over.openTime ?? String(openTime), r.open, r.high, r.low, r.close, r.volume, r.closeTime, r.quoteVolume, r.count, r.takerBuyVolume, r.takerBuyQuoteVolume, r.ignore].join(',');
}
export const klineCsv = (openTimes, { header = true, over = {} } = {}) =>
  (header ? KLINE_HEADER + '\n' : '') + openTimes.map(t => klineRow(t, over[t])).join('\n') + '\n';
export const minutes = (startIso, count) => Array.from({ length: count }, (_, i) => Date.parse(startIso) + i * 60000);

// Minimal ZIP writer (local headers, central directory, end record). Options corrupt one field for negative tests.
export function makeZip(members, { method = 8, flags = 0, crc = null, declaredSize = null, centralName = null, zip64 = false } = {}) {
  const locals = [], centrals = [];
  let offset = 0;
  for (const { name, data } of members) {
    const raw = Buffer.isBuffer(data) ? data : Buffer.from(data);
    const packed = method === 8 ? zlib.deflateRawSync(raw) : raw;
    const nameBytes = Buffer.from(name);
    const sum = crc ?? zlib.crc32(raw);
    const size = zip64 ? 0xffffffff : declaredSize ?? raw.length;
    const local = Buffer.alloc(30);
    local.writeUInt32LE(0x04034b50, 0); local.writeUInt16LE(20, 4); local.writeUInt16LE(flags, 6); local.writeUInt16LE(method, 8);
    local.writeUInt32LE(sum >>> 0, 14); local.writeUInt32LE(zip64 ? 0xffffffff : packed.length, 18); local.writeUInt32LE(size, 22);
    local.writeUInt16LE(nameBytes.length, 26);
    const central = Buffer.alloc(46);
    const cName = Buffer.from(centralName ?? name);
    central.writeUInt32LE(0x02014b50, 0); central.writeUInt16LE(20, 4); central.writeUInt16LE(20, 6); central.writeUInt16LE(flags, 8);
    central.writeUInt16LE(method, 10); central.writeUInt32LE(sum >>> 0, 16); central.writeUInt32LE(zip64 ? 0xffffffff : packed.length, 20);
    central.writeUInt32LE(size, 24); central.writeUInt16LE(cName.length, 28); central.writeUInt32LE(offset, 42);
    locals.push(local, nameBytes, packed);
    centrals.push(central, cName);
    offset += 30 + nameBytes.length + packed.length;
  }
  const cd = Buffer.concat(centrals);
  const end = Buffer.alloc(22);
  end.writeUInt32LE(0x06054b50, 0); end.writeUInt16LE(members.length, 8); end.writeUInt16LE(members.length, 10);
  end.writeUInt32LE(cd.length, 12); end.writeUInt32LE(offset, 16);
  return Buffer.concat([...locals, cd, end]);
}
export const checksumText = (bytes, name) => `${sha256(bytes)}  ${name}\n`;
