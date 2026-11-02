// m9 probe r1, 2026-11-02. Read-only preflight probe, run once before the protected m9 scan (spec docs/f1/m9-gate-spec-v6.2.txt).
// It measures real HTTP 404 bodies (to freeze LIMITS.errorBody, F6), real Content-Encoding headers (review finding R2-04),
// directory-marker and repeated keys in every real symbol listing (finding R2-01), percent encoding on real keys (G2) and RAM.
// Never lists below, requests or reads anything of the six. Object requests: three 404 probe keys of month 2000-01, a zip sample
// of months 2025-04 to 2025-09, .CHECKSUM only for 2025-10 and for the G2 sample. Object bodies are counted and hashed, never
// decoded, decompressed, parsed, printed or saved; non-200 bodies are counted only. Writes only inside --out, and only at the end.
import { createHash } from 'node:crypto';
import { lstatSync, mkdirSync, readFileSync, rmSync, writeFileSync } from 'node:fs';
import { basename, join, resolve } from 'node:path';
import { ROOT, LIMITS, sha, enc, parsePage, requester, Budget, Abort } from './m9-scan.mjs';

const NODE = 'v24.22.0';
const SIX = ['BTCUSDT','ETHUSDT','SOLUSDT','XRPUSDT','DOGEUSDT','HYPEUSDT'];
const MONTHS = ['2025-04','2025-05','2025-06','2025-07','2025-08','2025-09','2025-10'];
const ZIP_MONTHS = MONTHS.slice(0,6);
const NOTFOUND_MONTH = '2000-01';
// m9-scan.mjs line 202: the default listing base and download base.
const LIST = 'https://s3-ap-northeast-1.amazonaws.com/data.binance.vision';
const DOWNLOAD = 'https://data.binance.vision/'+ROOT;
const ALLOWED = [LIST+'?', DOWNLOAD];
// An allowed prefix, and a URL the WHATWG parser leaves unchanged (a dot segment could otherwise leave ROOT).
function allowed(url) {
 if (typeof url!=='string' || !ALLOWED.some(p => url.startsWith(p))) return false;
 try { return new URL(url).href===url; } catch { return false; }
}
const ROOT_SCAN_CAP = 30, ROOT_CAP = 60, SYMBOL_SCAN_CAP = 5, SYMBOL_CAP = 10;
const MEM = ['MemTotal','MemAvailable','SwapTotal','SwapFree'];
const ENC_KINDS = ['listing','zip','sidecar','error'], ENC_CLASSES = ['absent','identity','other'];
class RunAbort extends Error { constructor(reason) { super(reason); this.reason = reason; } }
const cmp = (a,b) => Buffer.compare(Buffer.from(a), Buffer.from(b));
const sleep = ms => new Promise(r => setTimeout(r, ms));
const keep = b => (b>=65&&b<=90)||(b>=97&&b<=122)||(b>=48&&b<=57)||b===45||b===46||b===95||b===126||b===47;
const nonunreserved = s => Buffer.from(s).some(b => !keep(b));
// m9-scan.mjs line 217 (prefix and marker as there; o.list is LIST).
const listUrl = (prefix,marker) => LIST+'?delimiter=%2F&prefix='+enc(prefix,false)+(marker===null?'':'&marker='+enc(marker,false));
// m9-scan.mjs lines 259 and 260 (f.key there is the key without ROOT; o.download is DOWNLOAD).
const zipUrl = key => DOWNLOAD+enc(key.slice(ROOT.length),true);
const sidecarUrl = key => zipUrl(key)+'.CHECKSUM';
// m9-scan.mjs line 92: the fetch options of every request.
const fetchOptions = () => ({redirect:'manual',signal:AbortSignal.timeout(30000),headers:{'accept-encoding':'identity'}});
const zipKey = (symbol,month) => ROOT+symbol+'/'+symbol+'-fundingRate-'+month+'.zip';
function canonicalAnyMonth(symbol,key) {
 const base = ROOT+symbol+'/'+symbol+'-fundingRate-';
 return key.startsWith(base) && /^[0-9]{4}-[0-9]{2}\.zip(?:\.CHECKSUM)?$/.test(key.slice(base.length));
}
// Sample positions floor(j*(n-1)/parts) for j = 0..parts, duplicates removed; n = 0 gives none.
export function indices(n,parts) {
 const out = [];
 if (n>0) for (let j=0;j<=parts;j++) { const i = Math.floor(j*(n-1)/parts); if (!out.includes(i)) out.push(i); }
 return out;
}
// Output-space bound (F6): the UTF-8 bytes of every result file; over cap is a resource abort.
export function checkOutput(files,cap) {
 let total = 0;
 for (const text of Object.values(files)) total += Buffer.byteLength(text);
 if (total>cap) throw new RangeError('cap_output');
 return total;
}
const encClass = v => v===null||v===undefined ? 'absent' : String(v).trim().toLowerCase()==='identity' ? 'identity' : 'other';
const field = v => { const s = v===null||v===undefined ? '' : String(v); return /[",\n]/.test(s) ? '"'+s.replaceAll('"','""')+'"' : s; };
const csv = (header,rows) => header+'\n'+rows.map(r => r.map(field).join(',')+'\n').join('');
function meminfo(read) {
 let text = null;
 try { text = String(read()); } catch { text = null; }
 const values = {};
 for (const name of MEM) {
  const line = text===null ? undefined : text.split('\n').find(l => l.startsWith(name+':'));
  const m = line===undefined ? null : new RegExp('^'+name+':\\s+([0-9]+) kB$').exec(line);
  values[name] = m ? m[1] : 'not_verified';
 }
 return values;
}

export async function run(opts,deps) {
 const stop = reason => { process.stdout.write('stop '+reason+'\n'); return 2; };
 if (deps.version!==NODE) return stop('node '+deps.version);
 if (![opts.capOutput,opts.capBytes,opts.capRequests].every(v => Number.isSafeInteger(v) && v>0)) return stop('cap_invalid');
 if (!opts.out) return stop('out_missing');
 const out = opts.out;
 let exists = true;
 try { lstatSync(out); } catch { exists = false; }
 if (exists) return stop('out_exists');
 try { mkdirSync(out); } catch { return stop('out_create'); }
 const state = {abort:null, requests:0, bytes:0, rows:[], ctx:null, row:null, lastEnd:null, written:[]};
 const fail = reason => { if (!state.abort) state.abort = reason; throw new RunAbort(state.abort); };
 // Every received body byte of both layers passes this counter; the run aborts once the total exceeds capBytes.
 function counted(body) {
  if (!body) return body;
  const reader = body.getReader();
  return new ReadableStream({
   async pull(controller) {
    const {done,value} = await reader.read();
    if (done) { controller.close(); return; }
    state.bytes += value.length;
    if (state.bytes>opts.capBytes) {
     if (!state.abort) state.abort = 'cap_bytes';
     reader.cancel().catch(() => {});
     controller.error(new RunAbort(state.abort));
     return;
    }
    controller.enqueue(value);
   },
   cancel(reason) { return reader.cancel(reason); }
  },{highWaterMark:0});
 }
 // The one network guard: allowed URL prefixes, request cap, one requests.csv row per request (both layers).
 async function guard(url,init) {
  if (state.abort) throw new RunAbort(state.abort);
  if (!allowed(url)) fail('url_not_allowed');
  if (state.requests+1>opts.capRequests) fail('cap_requests');
  state.requests++;
  const ctx = state.ctx, attempt = ctx.layer==='m9' ? ++ctx.attempt : ctx.attempt;
  const row = {n:state.requests, layer:ctx.layer, kind:ctx.kind, attempt, url, status:'network_error', ce:'', cl:'', ct:'', xc:'', bytes:'', sha:'', enc:null};
  state.rows.push(row); state.row = row;
  let res;
  try { res = await deps.fetch(url,init); }
  catch (e) { if (state.abort) throw new RunAbort(state.abort); throw e; }
  const header = name => { const v = res.headers?.get?.(name); return v===null||v===undefined ? null : String(v); };
  row.status = String(res.status);
  row.ce = header('content-encoding') ?? ''; row.cl = header('content-length') ?? '';
  row.ct = header('content-type') ?? ''; row.xc = header('x-cache') ?? '';
  row.enc = encClass(header('content-encoding'));
  return {status:res.status, headers:res.headers, body:counted(res.body)};
 }
 async function pace(ms) {
  if (state.lastEnd===null) return;
  const wait = state.lastEnd+ms-deps.now();
  if (wait>0) await sleep(wait);
 }
 // Raw layer: m9 fetch options, pauseMs between requests, max(pauseMs, retryMs) before the one retry (m9-scan.mjs line 87).
 async function rawGet(kind,url,retry) {
  let result = null;
  for (let attempt=1;attempt<=(retry?2:1);attempt++) {
   await pace(attempt===1 ? opts.pauseMs : Math.max(opts.pauseMs,opts.retryMs));
   state.ctx = {layer:'raw', kind, attempt};
   result = {status:null, ce:null, ct:null, bytes:null, sha:'', body:null, encoded:false};
   try {
    const res = await guard(url,fetchOptions()), row = state.row;
    result.status = res.status;
    result.ce = res.headers?.get?.('content-encoding') ?? null;
    result.ct = res.headers?.get?.('content-type') ?? null;
    // m9-scan.mjs line 100: a Content-Encoding other than identity (trimmed, case-insensitive): cancel the body unread.
    if (result.ce!==null && result.ce.trim().toLowerCase()!=='identity') { await res.body?.cancel(); result.encoded = true; }
    else {
     const ok = res.status===200, hash = ok ? createHash('sha256') : null, chunks = [];
     let n = 0;
     if (res.body) for await (const ch of res.body) { n += ch.length; if (ok) { hash.update(ch); if (kind==='listing') chunks.push(ch); } }
     result.bytes = n; row.bytes = String(n);
     if (ok) { result.sha = hash.digest('hex'); row.sha = result.sha; if (kind==='listing') result.body = Buffer.concat(chunks,n); }
    }
   } catch (e) {
    if (state.abort) throw new RunAbort(state.abort);
    if (e instanceof RunAbort) throw e;
    result = {status:null, ce:null, ct:null, bytes:null, sha:'', body:null, encoded:false};
   } finally { state.lastEnd = deps.now(); }
   if (result.status===200) return result;
  }
  return result;
 }
 // m9 layer: a fresh m9 requester and Budget per call; an m9 Abort is a result, not a run abort.
 async function m9Get(kind,url) {
  await pace(opts.pauseMs);
  const budget = new Budget(), get = requester({pause:opts.pauseMs, retry:opts.retryMs},budget);
  state.ctx = {layer:'m9', kind, attempt:0};
  let r = null, abort = '';
  try { r = await get(kind,url); }
  catch (e) { if (state.abort) throw new RunAbort(state.abort); if (e instanceof Abort) abort = e.reason; else throw e; }
  finally { state.lastEnd = deps.now(); }
  if (state.abort) throw new RunAbort(state.abort);
  return {status:r?.status ?? null, bytes:r?.body ? r.body.length : null, sha:r?.body ? sha(r.body) : '', total:budget.total, abort};
 }
 const anomalies = [], encoding = [], notfound = [];
 const anomaly = (type,symbol,value) => anomalies.push([type,symbol,value]);
 // Raw versus m9 on the same URL. For a non-200 status only the status is compared (m9 returns no body for it).
 async function compare(set,key,kind,url,raw) {
  const m = await m9Get(kind,url);
  const rs = raw.status===null ? '' : String(raw.status), ms = m.abort ? 'abort:'+m.abort : m.status===null ? '' : String(m.status);
  const match = rs===ms && (rs!=='200' || (raw.bytes===m.bytes && raw.sha===m.sha));
  if (m.abort) anomaly('m9_abort',set,key);
  if (!match) anomaly('crosscheck_mismatch',set,key);
  encoding.push([set,key,kind,rs,raw.ce ?? '',raw.bytes ?? '',raw.sha,ms,m.bytes ?? '',m.sha,match]);
  return m;
 }
 const seenKeys = new Set(), seenPrefixes = new Set(), allKeys = [];
 let repeatedKeys = 0, repeatedPrefixes = 0;
 async function list(prefix,label,scanCap,cap,crossCheck) {
  const L = {status:'ok', pages:0, prefixes:[], keys:[], overScanCap:false};
  const markers = new Set();
  let marker = null;
  for (let n=1;;n++) {
   const url = listUrl(prefix,marker), r = await rawGet('listing',url,true);
   if (crossCheck && n===1 && r.status===200) await compare('root_page1',prefix,'listing',url,r);
   if (r.status!==200 || !r.body) { L.status = 'not_verified'; return L; }
   let p;
   try { p = parsePage(r.body); } catch { L.status = 'parse_error'; return L; }
   L.pages = n;
   for (const item of p.prefixes) { if (seenPrefixes.has(item)) { repeatedPrefixes++; anomaly('repeated_prefix',label,item); } seenPrefixes.add(item); L.prefixes.push(item); }
   for (const item of p.keys) { if (seenKeys.has(item)) { repeatedKeys++; anomaly('repeated_key',label,item); } seenKeys.add(item); allKeys.push([label,item]); L.keys.push(item); }
   if (!p.truncated) return L;
   if (n===scanCap) L.overScanCap = true;
   if (n===cap) { anomaly(label ? 'symbol_cap_reached' : 'root_cap_reached',label,n); return L; }
   if (!p.next) { anomaly('truncated_without_next_marker',label,n); L.status = 'parse_error'; return L; }
   if (markers.has(p.next)) { anomaly('repeated_next_marker',label,p.next); L.status = 'parse_error'; return L; }
   markers.add(p.next); marker = p.next;
  }
 }
 // Per-listing counts; the root listing uses label '' and listing prefix ROOT, and has no canonical key.
 function count(L,listingPrefix,symbol) {
  const c = {marker:0, trailing:0, nonunreserved:0, noncanonical:0};
  if (symbol) for (const p of L.prefixes) anomaly('symbol_listing_prefix',symbol,p);
  for (const k of L.keys) {
   if (k===listingPrefix) { c.marker++; anomaly('marker_equal_listing_prefix',symbol,k); }
   if (k.endsWith('/')) { c.trailing++; anomaly('key_trailing_slash',symbol,k); }
   if (nonunreserved(k)) { c.nonunreserved++; anomaly('nonunreserved_key',symbol,k); }
   if (!symbol || !canonicalAnyMonth(symbol,k)) { c.noncanonical++; anomaly('noncanonical_key',symbol,k); }
  }
  return c;
 }
 const previousFetch = globalThis.fetch;
 globalThis.fetch = guard;
 try {
  // S0
  const started = deps.now(), startedUtc = new Date(started).toISOString(), ramStart = meminfo(deps.readMeminfo);
  // S1
  const rootL = await list(ROOT,'',ROOT_SCAN_CAP,ROOT_CAP,true);
  const rootOk = rootL.status==='ok';
  if (rootL.overScanCap) anomaly('root_pages_over_scan_cap','',rootL.pages);
  if (!rootOk) anomaly('root_listing_'+rootL.status,'',rootL.pages);
  const rootCounts = count(rootL,ROOT,'');
  // S2
  const six = Object.fromEntries(SIX.map(s => [s, rootOk ? 'false' : 'not_verified']));
  const symbols = [], listings = [];
  let badNames = 0;
  if (rootOk) for (const prefix of rootL.prefixes) {
   // m9-scan.mjs line 231.
   const symbol=prefix.startsWith(ROOT)&&prefix.endsWith('/')?prefix.slice(ROOT.length,-1):'';
   // m9-scan.mjs line 233 (there the freeze ends unresolved; here the name is recorded and never listed).
   if(!symbol||symbol==='.'||symbol==='..'||symbol.includes('/')||/[,"#@:;+\u0000-\u001f\u007f-\u009f\s]/u.test(symbol)) { badNames++; anomaly('bad_symbol_name','',symbol||prefix); continue; }
   if (SIX.includes(symbol)) { six[symbol] = 'true'; continue; }
   if (!symbols.includes(symbol)) symbols.push(symbol);
  }
  symbols.sort(cmp);
  for (const symbol of symbols) {
   const L = await list(ROOT+symbol+'/',symbol,SYMBOL_SCAN_CAP,SYMBOL_CAP,false);
   if (L.overScanCap) anomaly('symbol_pages_over_scan_cap',symbol,L.pages);
   if (L.status!=='ok') anomaly('symbol_listing_'+L.status,symbol,L.pages);
   L.symbol = symbol; L.counts = count(L,ROOT+symbol+'/',symbol);
   listings.push(L);
  }
  let keysEqualPrefix = 0;
  for (const [label,k] of allKeys) if (seenPrefixes.has(k)) { keysEqualPrefix++; anomaly('key_equal_listed_prefix',label,k); }
  // S3
  const ok = listings.filter(L => L.status==='ok'), size = s => Buffer.byteLength(s);
  const shortest = [...ok].sort((a,b) => size(a.symbol)-size(b.symbol) || cmp(a.symbol,b.symbol))[0];
  const longest = [...ok].sort((a,b) => size(b.symbol)-size(a.symbol) || cmp(a.symbol,b.symbol))[0];
  const probes = ok.length ? [['N1',shortest,'zip'],['N2',shortest,'sidecar'],['N3',longest,'sidecar']] : [];
  let notfoundChecked = 0, errorBodyMax = null, errorBodyAborts = 0;
  for (const [id,L,kind] of probes) {
   const z = zipKey(L.symbol,NOTFOUND_MONTH), key = kind==='zip' ? z : z+'.CHECKSUM';
   if (L.keys.includes(key)) { anomaly('n_key_listed',L.symbol,key); continue; }
   const url = kind==='zip' ? zipUrl(z) : sidecarUrl(z);
   const raw = await rawGet(kind,url,false);
   const m = await m9Get(kind,url);
   notfoundChecked++;
   if (raw.bytes!==null) errorBodyMax = Math.max(errorBodyMax ?? 0,raw.bytes);
   if (m.abort==='error_body') errorBodyAborts++;
   notfound.push([id,url,raw.status ?? '',raw.bytes ?? '',raw.ct ?? '',m.status ?? '',m.total,raw.bytes!==null && m.total===2*raw.bytes,m.abort]);
  }
  // S4
  const zipCandidates = [], candidates2510 = [], g2Candidates = [];
  for (const L of ok) {
   const keys = new Set(L.keys);
   for (const month of MONTHS) {
    const z = zipKey(L.symbol,month);
    if (keys.has(z) && keys.has(z+'.CHECKSUM')) (ZIP_MONTHS.includes(month) ? zipCandidates : candidates2510).push(z);
    if (keys.has(z+'.CHECKSUM') && nonunreserved(z+'.CHECKSUM')) g2Candidates.push(z);
   }
  }
  zipCandidates.sort(cmp); candidates2510.sort(cmp); g2Candidates.sort((a,b) => cmp(a+'.CHECKSUM',b+'.CHECKSUM'));
  const sampleZip = indices(zipCandidates.length,5).map(i => zipCandidates[i]);
  for (const z of sampleZip) {
   const sUrl = sidecarUrl(z), zUrl = zipUrl(z);
   const rs = await rawGet('sidecar',sUrl,true), rz = await rawGet('zip',zUrl,true);
   await compare('zip_2504_2509',z+'.CHECKSUM','sidecar',sUrl,rs);
   await compare('zip_2504_2509',z,'zip',zUrl,rz);
  }
  const sample2510 = indices(candidates2510.length,2).map(i => candidates2510[i]);
  for (const z of sample2510) { const u = sidecarUrl(z); await compare('sidecar_2510',z+'.CHECKSUM','sidecar',u,await rawGet('sidecar',u,true)); }
  const sampleG2 = g2Candidates.slice(0,5);
  let g2ok = 0;
  for (const z of sampleG2) {
   const u = sidecarUrl(z), raw = await rawGet('sidecar',u,true), m = await compare('g2',z+'.CHECKSUM','sidecar',u,raw);
   if (raw.status===200 && m.status===200) g2ok++;
  }
  // S5
  const ramEnd = meminfo(deps.readMeminfo), maxRss = process.resourceUsage().maxRSS, finished = deps.now();
  const sum = f => rootCounts[f]+listings.reduce((a,L) => a+L.counts[f],0);
  const encCount = new Map();
  for (const row of state.rows) if (row.layer==='raw' && row.enc!==null) {
   const k = (row.status==='200' ? row.kind : 'error')+':'+row.enc;
   encCount.set(k,(encCount.get(k) || 0)+1);
  }
  const summary = [
   ['started_utc',startedUtc],['node',deps.version],['root_status',rootOk ? 'ok' : 'not_verified'],['root_pages',rootL.pages],
   ['prefixes_received',rootL.prefixes.length],...SIX.map(s => ['six_present:'+s,six[s]]),['symbols_listed',symbols.length],
   ['bad_symbol_names',badNames],...['ok','not_verified','parse_error'].map(s => ['symbol_listings_'+s,listings.filter(L => L.status===s).length]),
   ['symbol_pages_max',listings.reduce((a,L) => Math.max(a,L.pages),0)],['symbol_listings_over_scan_cap',listings.filter(L => L.overScanCap).length],
   ['keys_total',rootL.keys.length+listings.reduce((a,L) => a+L.keys.length,0)],['markers_equal_listing_prefix',sum('marker')],
   ['keys_trailing_slash',sum('trailing')],['keys_equal_any_listed_prefix',keysEqualPrefix],['repeated_keys',repeatedKeys],
   ['repeated_prefixes',repeatedPrefixes],['nonunreserved_keys',sum('nonunreserved')],['noncanonical_any_month',sum('noncanonical')],
   ['g2_checked',sampleG2.length],['g2_status_200',g2ok],['notfound_checked',notfoundChecked],['error_body_max_bytes',errorBodyMax ?? 'none'],
   ['limits_error_body',LIMITS.errorBody],['error_body_abort_m9',errorBodyAborts],['sample_zip',sampleZip.length],
   ['sample_sidecar_2504_2509',sampleZip.length],['sample_sidecar_2510',sample2510.length],
   ...ENC_KINDS.flatMap(k => ENC_CLASSES.map(c => ['enc:'+k+':'+c,encCount.get(k+':'+c) || 0])),
   ['crosscheck_mismatch',encoding.filter(r => r.at(-1)===false).length],['requests_total',state.requests],
   ['bytes_received_total',state.bytes],['max_rss_kb',maxRss],['duration_ms',finished-started],['finished_utc',new Date(finished).toISOString()]
  ];
  const files = {
   'summary.txt':summary.map(([k,v]) => k+' '+v+'\n').join(''),
   'requests.csv':csv('n,layer,kind,attempt,url,status,content_encoding,content_length,content_type,x_cache,body_bytes,sha256',
    state.rows.map(r => [r.n,r.layer,r.kind,r.attempt,r.url,r.status,r.ce,r.cl,r.ct,r.xc,r.layer==='raw' ? r.bytes : '',r.layer==='raw' && r.status==='200' ? r.sha : ''])),
   'listings.csv':csv('symbol,status,pages,keys,prefixes,marker_equal_listing_prefix,keys_trailing_slash,nonunreserved_keys,noncanonical_any_month',
    listings.map(L => [L.symbol,L.status,L.pages,L.keys.length,L.prefixes.length,L.counts.marker,L.counts.trailing,L.counts.nonunreserved,L.counts.noncanonical])),
   'anomalies.csv':csv('type,symbol,value',anomalies),
   'notfound.csv':csv('id,url,raw_status,raw_body_bytes,content_type,m9_status,m9_budget_total,m9_equals_2x,m9_abort',notfound),
   'encoding.csv':csv('set,key,kind,raw_status,content_encoding,raw_bytes,raw_sha256,m9_status,m9_bytes,m9_sha256,match',encoding),
   'ram.csv':csv('phase,mem_total_kb,mem_available_kb,swap_total_kb,swap_free_kb',
    [['start',...MEM.map(k => ramStart[k])],['end','',ramEnd.MemAvailable,'',ramEnd.SwapFree]])
  };
  files['checksums.sha256'] = Object.keys(files).sort(cmp).map(p => sha(files[p])+'  '+p+'\n').join('');
  // Before any write; over capOutput only invalid.txt remains (not counted).
  try { checkOutput(files,opts.capOutput); } catch { fail('cap_output'); }
  for (const [name,text] of Object.entries(files)) {
   state.written.push(name);
   try { writeFileSync(join(out,name),text,{flag:'wx'}); } catch { fail('output'); }
  }
  process.stdout.write('done '+basename(out)+'\n');
  return 0;
 } catch (e) {
  const reason = state.abort || (e instanceof RunAbort ? e.reason : 'implementation');
  for (const name of state.written) try { rmSync(join(out,name),{force:true}); } catch { /* nothing else to remove */ }
  try { writeFileSync(join(out,'invalid.txt'),'invalid '+reason+'\n',{flag:'wx'}); } catch { /* the stdout line still reports it */ }
  process.stdout.write('invalid '+reason+'\n');
  return 3;
 } finally { globalThis.fetch = previousFetch; }
}

export async function main(argv=process.argv.slice(2)) {
 let out;
 for (let i=0;i<argv.length;i+=2) {
  if (argv[i]!=='--out' || out!==undefined) { process.stdout.write('stop unknown_argument\n'); return 2; }
  if (argv[i+1]===undefined) break;
  out = argv[i+1];
 }
 if (!out) { process.stdout.write('stop out_missing\n'); return 2; }
 return run({out:resolve(out), pauseMs:250, retryMs:2000, capBytes:134217728, capRequests:3000, capOutput:16777216},
  {fetch:globalThis.fetch, version:process.version, readMeminfo:() => readFileSync('/proc/meminfo','utf8'), now:Date.now});
}
if(process.argv[1]&&resolve(process.argv[1])===resolve(new URL(import.meta.url).pathname))process.exitCode=await main();
