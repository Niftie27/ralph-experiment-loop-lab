// Listing mutations on the real root page (session 54): insert one symbol prefix with one S1-forbidden char; expect freeze unresolved.
import { readFileSync } from 'node:fs';
import { ROOT, s1, listing, freeze } from './indep.mjs';
const REPO = process.env.REPO, P = REPO + '/experiments/m9-gate/probe-4a/';
const { run, text } = await import(REPO + '/experiments/m9-gate/test/support.mjs');
const page = readFileSync(P + 'listing/root-default-001.xml', 'utf8');
const esc = s => s.replaceAll('&', '&amp;').replaceAll('<', '&lt;').replaceAll('>', '&gt;').replaceAll('"', '&quot;');
const empty = p => '<?xml version="1.0" encoding="UTF-8"?>\n<ListBucketResult xmlns="http://s3.amazonaws.com/doc/2006-03-01/"><Name>data.binance.vision</Name><Prefix>' + esc(p) + '</Prefix><Marker></Marker><MaxKeys>1000</MaxKeys><Delimiter>/</Delimiter><IsTruncated>false</IsTruncated></ListBucketResult>';
const chars = (process.env.CHARS ? process.env.CHARS.split(' ') : ['#', '@', ';', '"', ',', ':', '+', '\t', '\u0085', '\u009f', '\u00a0', '\u3000', '\ufeff', '\u0001', '\u007f']);
let bad = 0;
for (const c of [...chars, 'OK']) {
  const sym = c === 'OK' ? 'AAAZUSDT' : process.env.FULLSYM ? c : 'AAA' + c + 'USDT', ins = '<CommonPrefixes><Prefix>' + esc(ROOT + sym + '/') + '</Prefix></CommonPrefixes>';
  const root = page.replace('<CommonPrefixes>', ins + '<CommonPrefixes>');
  const routes = new Map([['/list?delimiter=%2F&prefix=' + s1(ROOT, false), root]]);
  for (const p of listing(Buffer.from(root)).prefixes) if (!/\/(BTC|ETH|SOL|XRP|DOGE|HYPE)USDT\/$/.test(p)) routes.set('/list?delimiter=%2F&prefix=' + s1(p, false), empty(p));
  let ind; try { await freeze(async (pr, m) => routes.get('/list?delimiter=%2F&prefix=' + s1(pr, false))); ind = 'resolved'; } catch (e) { ind = e.message.startsWith('freeze') ? 'unresolved' : 'error ' + e.message; }
  const r = await run(routes), out = text(r, 'outcome.csv') || '';
  const m9 = out.includes('freeze_unresolved') ? 'unresolved' : 'resolved';
  const want = c === 'OK' ? 'resolved' : 'unresolved';
  if (ind !== want || m9 !== want) { bad++; console.log('MISMATCH', JSON.stringify(c), 'want', want, 'indep', ind, 'm9', m9); }
}
console.log('s1 cases', chars.length + 1, 'mismatches', bad);
