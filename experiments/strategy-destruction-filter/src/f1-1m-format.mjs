// F1a-2 columnar 1m snapshot format v1 (docs/f1/f1a-2-contract.md, A2). Pure bytes in and out, no fs, no clock.
// Layout: 'RALPHCOL' | uint32 LE H | H bytes = canonical JSON header + minimal 0-7 spaces so 12 + H is a multiple of 8 |
// the columns in header order, rowCount float64 little-endian values each. File length = 12 + H + 8 x columns x rowCount.
export const MAGIC = 'RALPHCOL';
export const SCHEMA_VERSION = 1;
export const KIND = 'binance_vision_kline_1m';
export const MAX_HEADER_BYTES = 64 * 1024;
export const COLUMNS = Object.freeze([
  ['open_time', 'ms_utc'], ['open', 'quote_per_base'], ['high', 'quote_per_base'], ['low', 'quote_per_base'], ['close', 'quote_per_base'],
  ['volume', 'base'], ['quote_volume', 'quote'], ['count', 'trades'], ['taker_buy_volume', 'base'], ['taker_buy_quote_volume', 'quote']
].map(([name, unit]) => Object.freeze({ name, dtype: 'f64le', unit })));
const HEADER_KEYS = ['columns', 'dataEnd', 'dataStart', 'firstOpenTime', 'instrument', 'kind', 'lastOpenTime', 'period', 'rowCount', 'schemaVersion', 'sources'];
const PERIOD_NAMES = ['research', 'holdout'];
const ISO = /^\d{4}-\d\d-\d\dT\d\d:\d\d:\d\d\.000Z$/;

// Keys sorted by plain code-unit order (Array.prototype.sort), arrays keep their order, no whitespace.
export function canonicalJson(value) {
  return JSON.stringify(value, (_, v) => v && typeof v === 'object' && !Array.isArray(v)
    ? Object.fromEntries(Object.keys(v).sort().map(k => [k, v[k]])) : v);
}
const fail = message => { throw new Error(`1m snapshot: ${message}`); };
const isIso = s => typeof s === 'string' && ISO.test(s) && new Date(Date.parse(s)).toISOString() === s;
const iso = ms => new Date(ms).toISOString();
const sameKeys = (object, keys) => object && typeof object === 'object' && !Array.isArray(object)
  && Object.keys(object).sort().join() === [...keys].sort().join();

function checkMeta({ instrument, period, dataStart, dataEnd, sources }) {
  if (!sameKeys(instrument, ['contract', 'exchange', 'market']) || !Object.values(instrument).every(v => typeof v === 'string' && v)) fail('incomplete instrument');
  if (!PERIOD_NAMES.includes(period)) fail(`unknown period ${period}`);
  if (!isIso(dataStart) || !isIso(dataEnd)) fail('dataStart and dataEnd must be ISO strings with .000Z');
  if (!Array.isArray(sources) || !sources.length) fail('sources must be a non-empty list');
  for (const s of sources) {
    if (!sameKeys(s, ['file', 'sha256'])) fail('source entries need exactly file and sha256');
    if (typeof s.file !== 'string' || !s.file || s.file.startsWith('/') || s.file.split('/').some(p => p === '..' || p === '.' || p === '')) fail('source file must be a canonical relative Vision path');
    if (typeof s.sha256 !== 'string' || !/^[0-9a-f]{64}$/.test(s.sha256)) fail('source sha256 must be 64 lowercase hex');
  }
}
const sortedSources = sources => [...sources].map(s => ({ file: s.file, sha256: s.sha256 })).sort((a, b) => a.file < b.file ? -1 : a.file > b.file ? 1 : 0);

export function encodeSnapshot(meta, columns) {
  checkMeta(meta);
  const sources = sortedSources(meta.sources);
  for (let i = 1; i < sources.length; i++) if (sources[i].file === sources[i - 1].file) fail(`duplicate source file ${sources[i].file}`);
  const names = COLUMNS.map(c => c.name);
  if (!sameKeys(columns, names)) fail(`columns must be exactly ${names.join(',')}`);
  const rowCount = columns.open_time.length;
  if (!Number.isSafeInteger(rowCount) || rowCount < 1) fail('rowCount must be a positive integer');
  for (const name of names) {
    if (columns[name].length !== rowCount) fail(`column ${name} length ${columns[name].length} != ${rowCount}`);
    for (let i = 0; i < rowCount; i++) if (!Number.isFinite(columns[name][i])) fail(`non-finite value in ${name} at row ${i}`);
  }
  for (let i = 0; i < rowCount; i++) if (!Number.isSafeInteger(columns.open_time[i])) fail(`open_time must be integer milliseconds (row ${i})`);
  const header = { schemaVersion: SCHEMA_VERSION, kind: KIND, instrument: { ...meta.instrument }, period: meta.period, dataStart: meta.dataStart,
    dataEnd: meta.dataEnd, columns: COLUMNS.map(c => ({ ...c })), rowCount, firstOpenTime: iso(columns.open_time[0]),
    lastOpenTime: iso(columns.open_time[rowCount - 1]), sources };
  const json = Buffer.from(canonicalJson(header), 'utf8');
  const pad = (8 - ((12 + json.length) % 8)) % 8;
  if (json.length + pad > MAX_HEADER_BYTES) fail('header over 64 KiB');
  const out = Buffer.alloc(12 + json.length + pad + 8 * names.length * rowCount);
  out.write(MAGIC, 0, 'latin1');
  out.writeUInt32LE(json.length + pad, 8);
  json.copy(out, 12);
  out.fill(0x20, 12 + json.length, 12 + json.length + pad);
  let offset = 12 + json.length + pad;
  for (const name of names) for (let i = 0; i < rowCount; i++, offset += 8) {
    const v = columns[name][i];
    out.writeDoubleLE(v === 0 ? 0 : v, offset); // -0 === 0, so this writes +0
  }
  return out;
}

const utf8 = new TextDecoder('utf-8', { fatal: true });
export function decodeSnapshot(bytes) {
  if (!(bytes instanceof Uint8Array) || bytes.length < 12) fail('file shorter than magic and header length');
  const buf = Buffer.from(bytes.buffer, bytes.byteOffset, bytes.byteLength);
  if (buf.toString('latin1', 0, 8) !== MAGIC) fail('bad magic');
  const h = buf.readUInt32LE(8);
  if (h > MAX_HEADER_BYTES) fail('header over 64 KiB');
  if (12 + h > buf.length) fail('file length mismatch: shorter than its header');
  if ((12 + h) % 8) fail('header padding does not align the columns to 8 bytes');
  let end = 12 + h;
  while (end > 12 && buf[end - 1] === 0x20) end--;
  if (h - (end - 12) !== (8 - ((12 + end - 12) % 8)) % 8) fail('header padding is not the minimum 0-7 spaces');
  let text, header;
  try { text = utf8.decode(buf.subarray(12, end)); header = JSON.parse(text); } catch { fail('header is not valid UTF-8 JSON'); }
  if (!header || typeof header !== 'object' || header.schemaVersion !== SCHEMA_VERSION) fail(`Unknown schemaVersion ${header?.schemaVersion}`);
  if (canonicalJson(header) !== text) fail('header is not canonical JSON (key order, whitespace or duplicate keys)');
  if (!sameKeys(header, HEADER_KEYS)) fail(`header keys must be exactly ${HEADER_KEYS.join(',')}`);
  if (header.kind !== KIND) fail(`unknown kind ${header.kind}`);
  checkMeta(header);
  if (canonicalJson(header.sources) !== canonicalJson(sortedSources(header.sources))) fail('sources not sorted by file');
  for (let i = 1; i < header.sources.length; i++) if (header.sources[i].file === header.sources[i - 1].file) fail('duplicate source file');
  if (canonicalJson(header.columns) !== canonicalJson(COLUMNS)) fail('columns, order, dtype or unit differ from format v1');
  const rowCount = header.rowCount;
  if (!Number.isSafeInteger(rowCount) || rowCount < 1) fail('invalid rowCount');
  if (!isIso(header.firstOpenTime) || !isIso(header.lastOpenTime)) fail('firstOpenTime and lastOpenTime must be ISO strings with .000Z');
  if (buf.length !== 12 + h + 8 * COLUMNS.length * rowCount) fail(`file length mismatch: ${buf.length} bytes for ${rowCount} rows`);
  // Length verified: allocation is bounded by the bytes actually present.
  const columns = {};
  let offset = 12 + h;
  for (const { name } of COLUMNS) {
    const col = new Float64Array(rowCount);
    for (let i = 0; i < rowCount; i++, offset += 8) {
      const v = buf.readDoubleLE(offset);
      if (!Number.isFinite(v)) fail(`non-finite value in ${name} at row ${i}`);
      if (Object.is(v, -0)) fail(`-0 in ${name} at row ${i} (writers normalize -0 to 0)`);
      col[i] = v;
    }
    columns[name] = col;
  }
  if (iso(columns.open_time[0]) !== header.firstOpenTime) fail('firstOpenTime differs from the first open_time');
  if (iso(columns.open_time[rowCount - 1]) !== header.lastOpenTime) fail('lastOpenTime differs from the last open_time');
  return { header: deepFreeze(header), columns };
}
function deepFreeze(value) {
  if (value && typeof value === 'object') { Object.values(value).forEach(deepFreeze); Object.freeze(value); }
  return value;
}
