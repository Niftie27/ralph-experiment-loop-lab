// Claude's independent parser, written from spec v5 S1/I1/I2 text (session 54). Not derived from m9-scan.mjs.
import { inflateRawSync, crc32 } from 'node:zlib';
import { createHash } from 'node:crypto';
export const ROOT = 'data/futures/um/monthly/fundingRate/';
export const SIX = ['BTCUSDT','ETHUSDT','SOLUSDT','XRPUSDT','DOGEUSDT','HYPEUSDT'];
export const MONTHS = ['2025-04','2025-05','2025-06','2025-07','2025-08','2025-09','2025-10'];
const SEAL = Date.UTC(2025, 9, 17), H = 3600000;
export const hex = b => createHash('sha256').update(b).digest('hex');
const bytesCmp = (a, b) => Buffer.compare(Buffer.from(a, 'utf8'), Buffer.from(b, 'utf8'));
// ---- listing (S3 ListObjects v1 XML)
function unxml(s) {
  return s.replace(/&(#x[0-9a-fA-F]+|#[0-9]+|amp|lt|gt|quot|apos);/g, (_, e) =>
    e === 'amp' ? '&' : e === 'lt' ? '<' : e === 'gt' ? '>' : e === 'quot' ? '"' : e === 'apos' ? "'" :
    String.fromCodePoint(e[1] === 'x' ? parseInt(e.slice(2), 16) : parseInt(e.slice(1), 10)));
}
export function listing(buf) {
  const s = Buffer.from(buf).toString('utf8');
  if (!s.includes('<ListBucketResult')) throw new Error('not a listing');
  const all = (outer, inner) => [...s.matchAll(new RegExp('<' + outer + '>([\\s\\S]*?)</' + outer + '>', 'g'))]
    .map(m => { const x = m[1].match(new RegExp('<' + inner + '>([\\s\\S]*?)</' + inner + '>')); return unxml(x[1]); });
  const tr = s.match(/<IsTruncated>(true|false)<\/IsTruncated>/);
  const nm = s.match(/<NextMarker>([\s\S]*?)<\/NextMarker>/);
  return { truncated: tr[1] === 'true', next: nm ? unxml(nm[1]) : null, prefixes: all('CommonPrefixes', 'Prefix'), keys: all('Contents', 'Key') };
}
// S1 encoder: every byte outside A-Z a-z 0-9 - . _ ~ (and / when allowed) as %XX uppercase.
export function s1(str, slash) {
  let o = '';
  for (const b of Buffer.from(str, 'utf8')) {
    const c = String.fromCharCode(b);
    o += (b >= 0x30 && b <= 0x39) || (b >= 0x41 && b <= 0x5a) || (b >= 0x61 && b <= 0x7a) || '-._~'.includes(c) || (slash && c === '/') ? c : '%' + (b < 16 ? '0' : '') + b.toString(16).toUpperCase();
  }
  return o;
}
const FORBIDDEN = /[,"\r\n#@:;+\u0000-\u001f\u007f-\u009f]/u;
const WS = /[\u0009-\u000d\u0020\u00a0\u1680\u2000-\u200a\u2028\u2029\u202f\u205f\u3000\ufeff]/u;
// get(prefix, marker) -> Buffer of the page; caps per 4j proposal are not part of v5 text.
export async function freeze(get) {
  const counts = { listing_pages: 0, prefixes_received: 0, noncanonical_names: 0 };
  async function all(prefix) {
    const items = { prefixes: [], keys: [] }, seen = new Set(); let marker = null;
    for (;;) {
      const p = listing(await get(prefix, marker)); counts.listing_pages++;
      for (const x of [...p.prefixes, ...p.keys]) { if (seen.has(x)) throw new Error('freeze: repeat'); seen.add(x); }
      items.prefixes.push(...p.prefixes); items.keys.push(...p.keys);
      if (!p.truncated) return items;
      if (p.next === null || p.next === marker) throw new Error('freeze: cursor'); marker = p.next;
    }
  }
  const root = await all(ROOT); counts.prefixes_received = root.prefixes.length; counts.noncanonical_names += root.keys.length;
  const dropped = {}, symbols = [];
  for (const p of root.prefixes) {
    if (!p.startsWith(ROOT) || !p.endsWith('/')) throw new Error('freeze: prefix shape');
    const sym = p.slice(ROOT.length, -1);
    if (!sym || sym === '.' || sym === '..' || sym.includes('/') || FORBIDDEN.test(sym) || WS.test(sym) || sym.includes('\ufffd')) throw new Error('freeze: symbol ' + JSON.stringify(sym));
    if (SIX.includes(sym)) dropped[sym] = true; else symbols.push(sym);
  }
  symbols.sort(bytesCmp);
  const keys = [];
  for (const sym of symbols) {
    const l = await all(ROOT + sym + '/');
    const frozen = new Set(MONTHS.map(m => ROOT + sym + '/' + sym + '-fundingRate-' + m + '.zip').filter(k => l.keys.includes(k)));
    for (const k of frozen) keys.push(k.slice(ROOT.length));
    counts.noncanonical_names += l.prefixes.length + l.keys.filter(k => !frozen.has(k) && !(k.endsWith('.CHECKSUM') && frozen.has(k.slice(0, -9)))).length;
  }
  keys.sort(bytesCmp);
  return { symbols, keys, dropped, counts };
}
// ---- I1 + I2 for one key. rule 'v5': flags exactly 0, name compared as readZipMember does (latin1 string).
// rule 'v6': flags 0, or 0x0800 only if the name has a non-ASCII byte; name compared as exact UTF-8 bytes.
export function check(key, sidecar, zip, rule = 'v5') {
  const base = key.split('/').at(-1), month = base.slice(-11, -4);
  const sc = Buffer.from(sidecar), z = Buffer.from(zip);
  const want = Buffer.from(base + '\n', 'utf8');
  if (sc.length !== 66 + want.length || !/^[0-9a-f]{64}$/.test(sc.subarray(0, 64).toString('latin1')) || sc[64] !== 32 || sc[65] !== 32 || !sc.subarray(66).equals(want)) return { status: 'excluded:checksum' };
  if (hex(z) !== sc.subarray(0, 64).toString('latin1')) return { status: 'excluded:hash' };
  let member;
  try { member = unzip(z, base.slice(0, -4) + '.csv', rule); } catch (e) { if (e.check) return { status: 'excluded:' + e.check }; throw e; }
  return grammar(member, month);
}
const X = c => Object.assign(new Error(c), { check: c });
function unzip(z, name, rule) {
  // archive: end record at the end (a comment is allowed, as readZipMember accepts), single disk, no zip64, CD directly before it
  let e = -1;
  for (let i = z.length - 22; i >= 0 && i >= z.length - 22 - 65535; i--) if (z.readUInt32LE(i) === 0x06054b50 && i + 22 + z.readUInt16LE(i + 20) === z.length) { e = i; break; }
  if (e < 0) throw X('archive');
  const disk = z.readUInt16LE(e + 4), cdDisk = z.readUInt16LE(e + 6), onDisk = z.readUInt16LE(e + 8), total = z.readUInt16LE(e + 10), cdSize = z.readUInt32LE(e + 12), cdOff = z.readUInt32LE(e + 16);
  if (disk || cdDisk || onDisk !== total) throw X('archive');
  if (total === 0xffff || cdSize === 0xffffffff || cdOff === 0xffffffff) throw X('archive');
  if (cdOff + cdSize !== e) throw X('archive');
  const recs = []; let p = cdOff;
  while (p < e) {
    if (p + 46 > e || z.readUInt32LE(p) !== 0x02014b50) throw X('archive');
    const len = 46 + z.readUInt16LE(p + 28) + z.readUInt16LE(p + 30) + z.readUInt16LE(p + 32);
    if (p + len > e) throw X('archive');
    if (rule === 'v6' && z.readUInt16LE(p + 34) !== 0) throw X('archive'); // v6: disk number start 0
    if (z.readUInt32LE(p + 20) === 0xffffffff || z.readUInt32LE(p + 24) === 0xffffffff || z.readUInt32LE(p + 42) === 0xffffffff) throw X('archive'); // no zip64
    recs.push(p); p += len;
  }
  if (recs.length !== total) throw X('archive');
  // member
  if (total !== 1) throw X('member');
  const c = recs[0], flags = z.readUInt16LE(c + 8), method = z.readUInt16LE(c + 10), crc = z.readUInt32LE(c + 16);
  const csize = z.readUInt32LE(c + 20), usize = z.readUInt32LE(c + 24), nlen = z.readUInt16LE(c + 28), lofs = z.readUInt32LE(c + 42);
  const nbytes = z.subarray(c + 46, c + 46 + nlen);
  const nonAscii = [...nbytes].some(b => b > 127);
  const nameOk = rule === 'v6' ? nbytes.equals(Buffer.from(name, 'utf8')) : (/^[\x00-\x7f]*$/.test(name) && nbytes.equals(Buffer.from(name, 'latin1')));
  if (!nameOk) throw X('member');
  if (!(flags === 0 || (rule === 'v6' && flags === 0x0800 && nonAscii))) throw X('member');
  if (method !== 8) throw X('member');
  if (lofs + 30 > cdOff || z.readUInt32LE(lofs) !== 0x04034b50) throw X('member');
  const ln = z.readUInt16LE(lofs + 26), lx = z.readUInt16LE(lofs + 28);
  if (z.readUInt16LE(lofs + 6) !== flags || z.readUInt16LE(lofs + 8) !== method || ln !== nlen || !z.subarray(lofs + 30, lofs + 30 + ln).equals(nbytes)) throw X('member');
  const start = lofs + 30 + ln + lx;
  if (start + csize > cdOff) throw X('member');
  // crc
  let out;
  try { out = inflateRawSync(z.subarray(start, start + csize)); } catch { throw X('crc'); }
  if (out.length !== usize || crc32(out) !== crc) throw X('crc');
  return out;
}
export function grammar(member, month) {
  const [y, m] = month.split('-').map(Number), lo = Date.UTC(y, m - 1, 1), hi = Date.UTC(y, m, 1);
  const parts = member.toString('latin1').split('\n');
  const terminated = parts.at(-1) === '';
  if (terminated) parts.pop();
  const rows = []; let prev = null;
  for (let i = 0; i < parts.length; i++) {
    const line = parts[i];
    if (i === 0 && line === 'calc_time,funding_interval_hours,last_funding_rate') continue;
    const tok = line.split(',');
    if (!/^[0-9]{13}$/.test(tok[0])) return { status: 'excluded:routing' };
    const t = Number(tok[0]);
    if (t >= SEAL) { if (month === '2025-10') continue; return { status: 'excluded:month' }; }
    if (!terminated && i === parts.length - 1) return { status: 'excluded:framing' };
    if (tok.length !== 3) return { status: 'excluded:fields' };
    if (t < lo || t >= hi) return { status: 'excluded:month' };
    if (prev !== null && t <= prev) return { status: 'excluded:order' };
    if (prev !== null && Math.floor(t / H) === Math.floor(prev / H)) return { status: 'excluded:hour' };
    if (!/^[1-9][0-9]*$/.test(tok[1]) || BigInt(tok[1]) > 9007199254740991n) return { status: 'excluded:interval' };
    rows.push([t, BigInt(tok[1]).toString()]); prev = t;
  }
  return { status: rows.length ? 'verified_nonempty' : 'verified_empty', rows };
}
