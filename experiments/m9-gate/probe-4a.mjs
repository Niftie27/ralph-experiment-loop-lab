// m9 probe 4a, 2026-10-29. Read-only HTTP probe for the m9 gate (spec v5, sha256 5e8ce1e4...).
// Tests the S3 listing endpoint, its pagination and the S1 URL encoding on real keys, and saves a small real
// fixture set. Never lists below, downloads or reads anything of the six. Zip bytes only for months 2025-04 to
// 2025-09; for 2025-10 only the .CHECKSUM sidecar is fetched. Writes only inside the output directory (argv[2]).
import { createHash } from 'node:crypto';
import { mkdirSync, writeFileSync, existsSync, readdirSync, readFileSync } from 'node:fs';
import { join } from 'node:path';

const EXPECTED_NODE = 'v24.22.0';
const SIX = ['BTCUSDT', 'ETHUSDT', 'SOLUSDT', 'XRPUSDT', 'DOGEUSDT', 'HYPEUSDT'];
const ROOT = 'data/futures/um/monthly/fundingRate/';
const LIST_BASE = 'https://s3-ap-northeast-1.amazonaws.com/data.binance.vision';
const DL_BASE = 'https://data.binance.vision/';
const INDEX_URL = 'https://data.binance.vision/';
const BUCKET_MARK = 's3-ap-northeast-1.amazonaws.com/data.binance.vision';
const MONTHS = ['2025-04', '2025-05', '2025-06', '2025-07', '2025-08', '2025-09', '2025-10'];
const ZIP_MONTHS = new Set(MONTHS.slice(0, 6));
const CONTROLS = ['ADAUSDT', 'LTCUSDT'];
const TREE = 'TREEUSDT';
const MAX_NONUNRESERVED = 8;
const MAX_PAGES_ROOT = 30;
const MAX_PAGES_SYMBOL = 5;
const MAX_BODY = 16 * 1024 * 1024;
const MAX_TOTAL = 64 * 1024 * 1024;
const TIMEOUT_MS = 30000;
const PAUSE_MS = 250;
const MAX_CONSEC_NET = 6;
const FATAL = new Set(['network_down', 'byte_cap', 'body_too_large']);

class Stop extends Error {
  constructor(reason) { super(reason); this.reason = reason; }
}
const sleep = ms => new Promise(r => setTimeout(r, ms));
const utf8 = s => Buffer.from(s, 'utf8');
const byteCmp = (a, b) => Buffer.compare(utf8(a), utf8(b));
const isUnres = b => (b >= 0x41 && b <= 0x5a) || (b >= 0x61 && b <= 0x7a) || (b >= 0x30 && b <= 0x39) ||
  b === 0x2d || b === 0x2e || b === 0x5f || b === 0x7e;
// Every byte outside A-Z a-z 0-9 - . _ ~ (and "/" when keepSlash) becomes %XX, uppercase hex of the UTF-8 bytes.
function enc(str, keepSlash) {
  let out = '';
  for (const b of utf8(str)) {
    if (isUnres(b) || (keepSlash && b === 0x2f)) out += String.fromCharCode(b);
    else out += '%' + b.toString(16).toUpperCase().padStart(2, '0');
  }
  return out;
}
const unreservedName = s => [...utf8(s)].every(isUnres);
const s1Forbidden = s => /[,"\r\n#@:;+]/.test(s) || /[\u0000-\u001f\u007f-\u009f]/.test(s) || /\s/.test(s);
const hex = s => utf8(s).toString('hex');
const csvField = v => {
  const s = v === null || v === undefined ? '' : String(v);
  return /[,"\r\n]/.test(s) ? '"' + s.replace(/"/g, '""') + '"' : s;
};
const csv = (header, rows) => [header, ...rows].map(r => r.map(csvField).join(',')).join('\n') + '\n';

let outDir = '';
let requests = 0;
let bytesTotal = 0;
let netErrors = 0;
let consecNet = 0;
const reqRows = [];

async function get(kind, url) {
  for (let attempt = 1; attempt <= 2; attempt++) {
    if (requests > 0) await sleep(PAUSE_MS);
    requests++;
    const n0 = requests;
    let res;
    let n = 0;
    const chunks = [];
    try {
      res = await fetch(url, { signal: AbortSignal.timeout(TIMEOUT_MS) });
      if (res.body) {
        for await (const ch of res.body) {
          n += ch.length;
          bytesTotal += ch.length;
          if (n > MAX_BODY) throw new Stop('body_too_large');
          if (bytesTotal > MAX_TOTAL) throw new Stop('byte_cap');
          chunks.push(ch);
        }
      }
    } catch (e) {
      if (e instanceof Stop) {
        reqRows.push([n0, kind, attempt, 'ABORT:' + e.reason, n, '', url]);
        throw e;
      }
      const code = e && e.cause && typeof e.cause.code === 'string' ? ':' + e.cause.code : '';
      reqRows.push([n0, kind, attempt, 'ERR:' + (e && e.name ? e.name : 'Error') + code, n, '', url]);
      netErrors++;
      consecNet++;
      if (consecNet >= MAX_CONSEC_NET) throw new Stop('network_down');
      continue;
    }
    consecNet = 0;
    reqRows.push([n0, kind, attempt, res.status, n, res.redirected ? 'true' : 'false', url]);
    if ((res.status >= 500 || res.status === 429) && attempt === 1) continue;
    return { status: res.status, body: Buffer.concat(chunks) };
  }
  return { status: 'ERR', body: null };
}

function decodeXml(s) {
  return s.replace(/&(?:(#x[0-9a-fA-F]+|#[0-9]+|amp|lt|gt|quot|apos);)?/g, (m, g) => {
    if (!g) throw new Stop('xml_entity');
    if (g[0] === '#') {
      const cp = g[1] === 'x' ? parseInt(g.slice(2), 16) : parseInt(g.slice(1), 10);
      if (!(cp >= 0 && cp <= 0x10ffff)) throw new Stop('xml_entity');
      return String.fromCodePoint(cp);
    }
    return { amp: '&', lt: '<', gt: '>', quot: '"', apos: "'" }[g];
  });
}

function parsePage(body) {
  let text;
  try { text = new TextDecoder('utf-8', { fatal: true }).decode(body); } catch { throw new Stop('invalid_utf8'); }
  if (!/<ListBucketResult[\s>]/.test(text)) throw new Stop('not_listing');
  const tr = /<IsTruncated>(true|false)<\/IsTruncated>/.exec(text);
  if (!tr) throw new Stop('no_istruncated');
  const nm = /<NextMarker>([^<]*)<\/NextMarker>/.exec(text);
  const prefixes = [...text.matchAll(/<CommonPrefixes>\s*<Prefix>([^<]*)<\/Prefix>\s*<\/CommonPrefixes>/g)].map(m => decodeXml(m[1]));
  const keys = [...text.matchAll(/<Contents>[\s\S]*?<Key>([^<]*)<\/Key>[\s\S]*?<\/Contents>/g)].map(m => decodeXml(m[1]));
  if ((text.match(/<CommonPrefixes>/g) || []).length !== prefixes.length) throw new Stop('xml_shape');
  if ((text.match(/<Contents>/g) || []).length !== keys.length) throw new Stop('xml_shape');
  return { truncated: tr[1] === 'true', next: nm ? decodeXml(nm[1]) : null, prefixes, keys };
}

async function listAll(prefix, maxKeys, maxPages, tag) {
  const prefixes = [];
  const keys = [];
  const seenItems = new Set();
  const seenMarkers = new Set();
  let marker = null;
  let pages = 0;
  for (;;) {
    let url = LIST_BASE + '?delimiter=%2F&prefix=' + enc(prefix, false);
    if (maxKeys) url += '&max-keys=' + maxKeys;
    if (marker !== null) url += '&marker=' + enc(marker, false);
    const r = await get('list', url);
    if (r.status !== 200) throw new Stop('list_http_' + r.status);
    pages++;
    writeFileSync(join(outDir, 'listing', `${tag}-${String(pages).padStart(3, '0')}.xml`), r.body);
    const p = parsePage(r.body);
    for (const item of [...p.prefixes, ...p.keys]) {
      if (seenItems.has(item)) throw new Stop('repeated_item');
      seenItems.add(item);
    }
    prefixes.push(...p.prefixes);
    keys.push(...p.keys);
    if (!p.truncated) return { prefixes, keys, pages };
    if (p.next === null || p.next === '') throw new Stop('no_next_marker');
    if (seenMarkers.has(p.next)) throw new Stop('repeated_marker');
    seenMarkers.add(p.next);
    marker = p.next;
    if (pages >= maxPages) throw new Stop('too_many_pages');
  }
}

function walk(dir, rel = '') {
  const out = [];
  for (const e of readdirSync(join(dir, rel), { withFileTypes: true })) {
    const r = rel ? rel + '/' + e.name : e.name;
    if (e.isDirectory()) out.push(...walk(dir, r));
    else out.push(r);
  }
  return out;
}

const summary = [];
const selRows = [];
const keyRows = [];
const put = (k, v) => summary.push([k, v]);

function finish(result) {
  put('requests', requests);
  put('bytes_received', bytesTotal);
  put('network_errors', netErrors);
  put('result', result);
  writeFileSync(join(outDir, 'requests.csv'), csv(['n', 'kind', 'attempt', 'http', 'bytes', 'redirected', 'url'], reqRows));
  writeFileSync(join(outDir, 'selected.csv'), csv(['idx', 'symbol', 'symbol_hex', 'reason', 'status', 'pages'], selRows));
  writeFileSync(join(outDir, 'keys.csv'), csv(['idx', 'symbol', 'month', 'key', 'key_hex', 'in_listing', 'sidecar_in_listing',
    'sidecar_http', 'zip_http', 'check', 'zip_sha256', 'zip_bytes'], keyRows));
  writeFileSync(join(outDir, 'summary.txt'), summary.map(([k, v]) => `${k} ${v}`).join('\n') + '\n');
  const files = walk(outDir).filter(f => f !== 'checksums.sha256').sort(byteCmp);
  const lines = files.map(f => createHash('sha256').update(readFileSync(join(outDir, f))).digest('hex') + '  ' + f);
  writeFileSync(join(outDir, 'checksums.sha256'), lines.join('\n') + '\n');
  process.stdout.write(summary.map(([k, v]) => `${k} ${v}`).join('\n') + '\n');
}

async function main() {
  if (process.version !== EXPECTED_NODE) {
    process.stdout.write(`STOP: node ${process.version}, expected ${EXPECTED_NODE}\n`);
    return 2;
  }
  outDir = process.argv[2] || '';
  if (!/^[A-Za-z0-9._-]+$/.test(outDir) || outDir === '.' || outDir === '..' || existsSync(outDir)) {
    process.stdout.write('STOP: output directory missing, not a plain relative name, or already exists\n');
    return 3;
  }
  mkdirSync(outDir);
  mkdirSync(join(outDir, 'listing'));
  mkdirSync(join(outDir, 'fixtures'));
  put('node', process.version);
  try {
    const ix = await get('index', INDEX_URL);
    put('index_http', ix.status);
    if (ix.status === 200) writeFileSync(join(outDir, 'index.html'), ix.body);
    put('index_bucket_url_count', ix.status === 200 ? ix.body.toString('latin1').split(BUCKET_MARK).length - 1 : '');

    const a = await listAll(ROOT, null, MAX_PAGES_ROOT, 'root-default');
    const b = await listAll(ROOT, 100, MAX_PAGES_ROOT, 'root-max100');
    put('root_default_pages', a.pages);
    put('root_max100_pages', b.pages);
    put('root_default_keys', a.keys.length);
    put('prefixes_received', a.prefixes.length);
    const syms = v => v.prefixes.map(p => {
      const s = p.startsWith(ROOT) && p.endsWith('/') ? p.slice(ROOT.length, -1) : '';
      if (s === '' || s.includes('/')) throw new Stop('bad_prefix');
      return s;
    }).sort(byteCmp);
    const sa = syms(a);
    const sb = syms(b);
    put('prefix_sets_equal', sa.length === sb.length && sa.every((s, i) => s === sb[i]) ? 'true' : 'false');
    for (const s of SIX) put('dropped:' + s, sa.includes(s) ? 'true' : 'false');
    const remaining = sa.filter(s => !SIX.includes(s));
    writeFileSync(join(outDir, 'symbols.txt'), remaining.map(s => s + '\n').join(''));
    put('symbols_listed', remaining.length);
    const nonunres = remaining.filter(s => !unreservedName(s));
    put('nonunreserved_symbols', nonunres.length);
    put('s1_forbidden_symbols', remaining.filter(s1Forbidden).length);

    const selected = [];
    for (const s of CONTROLS) selected.push([s, 'control']);
    selected.push([TREE, 'tree']);
    for (const s of nonunres.slice(0, MAX_NONUNRESERVED)) selected.push([s, 'nonunreserved']);
    put('selected', selected.length);
    let keyIdx = 0;
    let keysOk = 0;
    let keysFail = 0;
    let controlsOk = 0;
    for (let i = 0; i < selected.length; i++) {
      const [sym, reason] = selected[i];
      if (SIX.includes(sym)) throw new Stop('six_selected');
      const idx = String(i + 1).padStart(2, '0');
      if (!remaining.includes(sym)) { selRows.push([idx, sym, hex(sym), reason, 'absent', 0]); continue; }
      let lst;
      try {
        lst = await listAll(ROOT + sym + '/', null, MAX_PAGES_SYMBOL, 'sym-' + idx);
      } catch (e) {
        if (!(e instanceof Stop) || FATAL.has(e.reason)) throw e;
        selRows.push([idx, sym, hex(sym), reason, 'list_error:' + e.reason, '']);
        continue;
      }
      selRows.push([idx, sym, hex(sym), reason, 'listed', lst.pages]);
      const rel = new Set();
      for (const k of lst.keys) {
        if (!k.startsWith(ROOT + sym + '/')) throw new Stop('bad_key');
        rel.add(k.slice(ROOT.length));
      }
      for (const m of MONTHS) {
        const base = `${sym}-fundingRate-${m}.zip`;
        const key = `${sym}/${base}`;
        const inListing = rel.has(key);
        const scListed = rel.has(key + '.CHECKSUM');
        if (!inListing) {
          keyRows.push(['', sym, m, key, hex(key), 'false', scListed ? 'true' : 'false', '', '', 'not_listed', '', '']);
          continue;
        }
        keyIdx++;
        const kid = 'key-' + String(keyIdx).padStart(3, '0');
        let check = 'ok';
        let zipHttp = '';
        let zipSha = '';
        let zipBytes = '';
        const sc = await get('sidecar', DL_BASE + enc(ROOT + key + '.CHECKSUM', true));
        let published = null;
        if (sc.status !== 200) check = 'sidecar_http_' + sc.status;
        else {
          writeFileSync(join(outDir, 'fixtures', kid + '.zip.CHECKSUM'), sc.body);
          let t = null;
          try { t = new TextDecoder('utf-8', { fatal: true }).decode(sc.body); } catch { t = null; }
          const mm = t === null ? null : /^([0-9a-f]{64}) {2}([^\s]+)\n$/.exec(t);
          if (!mm) check = 'sidecar_grammar';
          else if (mm[2] !== base) check = 'sidecar_name';
          else published = mm[1];
        }
        if (ZIP_MONTHS.has(m) && check === 'ok') {
          const z = await get('zip', DL_BASE + enc(ROOT + key, true));
          zipHttp = z.status;
          if (z.status !== 200) check = 'zip_http_' + z.status;
          else {
            writeFileSync(join(outDir, 'fixtures', kid + '.zip'), z.body);
            zipSha = createHash('sha256').update(z.body).digest('hex');
            zipBytes = z.body.length;
            if (zipSha !== published) check = 'hash';
          }
        }
        if (check === 'ok') keysOk++; else keysFail++;
        if (reason === 'control' && ZIP_MONTHS.has(m) && check === 'ok') controlsOk++;
        keyRows.push([kid, sym, m, key, hex(key), 'true', scListed ? 'true' : 'false', sc.status, zipHttp, check, zipSha, zipBytes]);
      }
    }
    put('keys_listed', keyIdx);
    put('keys_ok', keysOk);
    put('keys_fail', keysFail);
    put('controls_ok', `${controlsOk}/${CONTROLS.length * ZIP_MONTHS.size}`);
    finish('ok');
    return 0;
  } catch (e) {
    if (e instanceof Stop) { finish('stopped:' + e.reason); return 4; }
    finish('error:' + (e && e.name ? e.name : 'Error'));
    return 1;
  }
}

process.exitCode = await main();
