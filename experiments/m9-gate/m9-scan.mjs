// m9 spec v5: offline-testable acquisition, fail-closed integrity, cadence and canonical outputs.
// No rate decoding. Only scheduleClass is called from the pinned import closure.
import { createHash } from 'node:crypto';
import { existsSync, mkdirSync, readFileSync, writeFileSync, appendFileSync, renameSync, rmSync, lstatSync } from 'node:fs';
import { resolve, join, dirname, basename } from 'node:path';
import { pathToFileURL } from 'node:url';
import { inflateRawSync, crc32 } from 'node:zlib';

export const ROOT = 'data/futures/um/monthly/fundingRate/';
const SIX = ['BTCUSDT','ETHUSDT','SOLUSDT','XRPUSDT','DOGEUSDT','HYPEUSDT'];
const MONTHS = ['2025-04','2025-05','2025-06','2025-07','2025-08','2025-09','2025-10'];
const CHECKS = ['missing_checksum','checksum','hash','archive','member','crc','routing','framing','fields','month','order','hour','interval'];
const STATUSES = ['verified_nonempty','verified_empty','not_verified', ...CHECKS.map(c => 'excluded:' + c)];
const ROLES = ['entry_outer','entry_inner','interior','exit_inner','exit_outer','isolated_in','isolated_out','none'];
const CLASSES = ['regular','interval_change','bridge','off_grid','unexplained_gap','unexplained_change'];
const ERAS = ['era1','era2','era3'];
const HOUR = 3600000, W = Date.parse('2025-05-01Z'), SEAL = Date.parse('2025-10-17Z');
const TREE_A = Date.parse('2025-08-31T08:00Z'), TREE_B = Date.parse('2025-09-01T04:00Z');
export const LIMITS = Object.freeze({ listing:16*1024*1024, sidecar:4096, zip:16*1024*1024, member:64*1024*1024, line:65536, lines:1000000, total:1073741824, output:256*1024*1024, keys:10000 });
const MODULE_ROOT = 'experiments/strategy-destruction-filter/src/';
const PINS = {
 'f1-funding.mjs':'9f6741134e6f59463c6cda371a0355a387650fea8106efcf38ac8a843004f628',
 'h2-contract.mjs':'8fee0b4dbd7f03d7c00f1c8fe7461b7772bb3deb93f16d74850bd043df5beaf1',
 'f1-1m-format.mjs':'b261d673ae36576273dbf3f3d5bc14a89901d71990f3388f2e08b1b3ae17820f',
 'vision-source.mjs':'d918bf6804803028d56e7e9c42efd459fc94b77f6cf4a4ed57dba7f3fca1d891',
 'f1-1m-store.mjs':'1795c7344d5da729caf0c71ff74b5f08ba45ab03e09338f6a5daab289f745ea2',
 'vision-transport.mjs':'ed051e5a6b15aefcbacaf9be432e63d181a75b3b711b1ab8acd985f2b5a6b130',
 'vision-1m.mjs':'09fdbd908159c12eda159f34fd0b89aae6723e8f38b345277a75bab0f4121f30'
};
export const sha = b => createHash('sha256').update(b).digest('hex');
const cmp = (a,b) => Buffer.compare(Buffer.from(a), Buffer.from(b));
const era = t => t < Date.parse('2025-05-02T08:00Z') ? 'era1' : t < Date.parse('2025-09-01Z') ? 'era2' : 'era3';
const inTree = t => t >= TREE_A && t <= TREE_B;
const verified = s => s === 'verified_empty' || s === 'verified_nonempty';
const stopped = c => !CLASSES.slice(0,3).includes(c);
export class Abort extends Error { constructor(reason) { super(reason); this.reason = reason; } }
class Freeze extends Error {}
class Exclude extends Error { constructor(check) { super(check); this.check = check; } }
const reject = check => { throw new Exclude(check); };
export function bound(kind,n) { if (n > LIMITS[kind]) throw new Abort(kind); }
export class Budget {
 constructor() { this.total = 0; this.output = 0; }
 receive(kind, n, attemptBytes) { this.total += n; bound('total',this.total); bound(kind,attemptBytes); }
 write(n) { this.output += n; bound('output',this.output); }
}
// enc/decodeXml/parsePage adapted from probe-4a, including fatal UTF-8 and strict entity handling.
export function enc(str, keepSlash) {
 let out = '';
 for (const b of Buffer.from(str)) {
  if ((b>=65&&b<=90)||(b>=97&&b<=122)||(b>=48&&b<=57)||[45,46,95,126].includes(b)||(keepSlash&&b===47)) out += String.fromCharCode(b);
  else out += '%' + b.toString(16).toUpperCase().padStart(2,'0');
 }
 return out;
}
export function decodeXml(s) {
 return s.replace(/&(?:(#x[0-9a-fA-F]+|#[0-9]+|amp|lt|gt|quot|apos);)?/g,(m,g) => {
  if (!g) throw new Freeze();
  if (g[0]==='#') {
   const cp = g[1]==='x' ? parseInt(g.slice(2),16) : parseInt(g.slice(1),10);
   if (!(cp>=0&&cp<=0x10ffff)|| (cp>=0xd800&&cp<=0xdfff)) throw new Freeze();
   return String.fromCodePoint(cp);
  }
  return {amp:'&',lt:'<',gt:'>',quot:'"',apos:"'"}[g];
 });
}
export function parsePage(body) {
 let text;
 try { text = new TextDecoder('utf-8',{fatal:true,ignoreBOM:true}).decode(body); } catch { throw new Freeze(); }
 if (!/<ListBucketResult[\s>]/.test(text)) throw new Freeze();
 const tr = /<IsTruncated>(true|false)<\/IsTruncated>/.exec(text);
 if (!tr) throw new Freeze();
 const nm = /<NextMarker>([^<]*)<\/NextMarker>/.exec(text);
 const prefixes = [...text.matchAll(/<CommonPrefixes>\s*<Prefix>([^<]*)<\/Prefix>\s*<\/CommonPrefixes>/g)].map(m=>decodeXml(m[1]));
 const keys = [...text.matchAll(/<Contents>[\s\S]*?<Key>([^<]*)<\/Key>[\s\S]*?<\/Contents>/g)].map(m=>decodeXml(m[1]));
 if ((text.match(/<CommonPrefixes>/g)||[]).length!==prefixes.length||(text.match(/<Contents>/g)||[]).length!==keys.length) throw new Freeze();
 return {truncated:tr[1]==='true',next:nm?decodeXml(nm[1]):null,prefixes,keys};
}
const sleep = ms => new Promise(r=>setTimeout(r,ms));
export function requester(options,budget) {
 let end = null;
 return async (kind,url) => {
  let lastStatus = null;
  for (let attempt=0;attempt<2;attempt++) {
   if (end!==null) await sleep(Math.max(0,end+(attempt?Math.max(options.pause,options.retry):options.pause)-Date.now()));
   let n=0;
   const chunks=[];
   try {
    const res=await fetch(url,{redirect:'manual',signal:AbortSignal.timeout(30000)});
    lastStatus=res.status;
    if (res.body) for await (const ch of res.body) { n+=ch.length; budget.receive(kind,ch.length,n); chunks.push(ch); }
    if (res.status===200) return {status:200,body:Buffer.concat(chunks,n)};
   } catch(e) { if(e instanceof Abort) throw e; lastStatus=null; }
   finally { end=Date.now(); }
  }
  return {status:lastStatus,body:null};
 };
}
// Match the pinned ZIP variant; compare raw UTF-8 member-name bytes, not latin1 text.
export function member(buf,name) {
 let end=-1;
 for(let i=buf.length-22;i>=Math.max(0,buf.length-22-65535);i--) if(buf.readUInt32LE(i)===0x06054b50 && i+22+buf.readUInt16LE(i+20)===buf.length) {end=i;break;}
 if(end<0) reject('archive');
 const entries=buf.readUInt16LE(end+10), size=buf.readUInt32LE(end+12), at=buf.readUInt32LE(end+16);
 if(buf.readUInt16LE(end+4)||buf.readUInt16LE(end+6)||buf.readUInt16LE(end+8)!==entries||entries===65535||size===0xffffffff||at===0xffffffff||at+size!==end) reject('archive');
 const records=[];
 let p=at;
 for(let i=0;i<entries;i++) {
  if(p+46>end||buf.readUInt32LE(p)!==0x02014b50) reject('archive');
  const next=p+46+buf.readUInt16LE(p+28)+buf.readUInt16LE(p+30)+buf.readUInt16LE(p+32);
  if(next>end||buf.readUInt16LE(p+34)!==0||buf.readUInt32LE(p+20)===0xffffffff||buf.readUInt32LE(p+24)===0xffffffff||buf.readUInt32LE(p+42)===0xffffffff) reject('archive');
  records.push(p);p=next;
 }
 if(p!==end) reject('archive');
 if(records.length!==1) reject('member');
 const c=records[0], flags=buf.readUInt16LE(c+8), method=buf.readUInt16LE(c+10), packed=buf.readUInt32LE(c+20), declared=buf.readUInt32LE(c+24), nl=buf.readUInt16LE(c+28), local=buf.readUInt32LE(c+42);
 if(flags!==0||method!==8||!buf.subarray(c+46,c+46+nl).equals(Buffer.from(name))) reject('member');
 if(local+30>at||buf.readUInt32LE(local)!==0x04034b50) reject('member');
 const ln=buf.readUInt16LE(local+26), extra=buf.readUInt16LE(local+28), start=local+30+ln+extra;
 if(buf.readUInt16LE(local+6)!==flags||buf.readUInt16LE(local+8)!==method||ln!==nl||!buf.subarray(local+30,local+30+ln).equals(buf.subarray(c+46,c+46+nl))||start+packed>at) reject('member');
 bound('member',declared);
 let bytes;
 try { bytes=inflateRawSync(buf.subarray(start,start+packed),{maxOutputLength:LIMITS.member}); }
 catch(e) { if(e.code==='ERR_BUFFER_TOO_LARGE') throw new Abort('member'); reject('crc'); }
 bound('member',bytes.length);
 if(bytes.length!==declared||crc32(bytes)!==buf.readUInt32LE(c+16)) reject('crc');
 return bytes;
}
export function rows(bytes,month) {
 const lo=Date.parse(month+'-01Z'), hi=Date.UTC(2025,Number(month.slice(-2)),1);
 // At most one row per settlement hour can survive I2. Compact columns, no retained source bytes.
 const times=new Float64Array(744), hours=new Float64Array(744), originals=Buffer.alloc(744*13);
 let count=0, line=0, start=0, prev=-Infinity, prevHour=-Infinity;
 while(start<bytes.length) {
  let end=bytes.indexOf(10,start); const terminated=end!==-1;
  if(!terminated) end=bytes.length;
  bound('line',end-start); bound('lines',++line);
  const b=bytes.subarray(start,end); start=end+1;
  if(line===1 && b.equals(Buffer.from('calc_time,funding_interval_hours,last_funding_rate'))) continue;
  const comma=b.indexOf(44);
  const token=comma<0?b:b.subarray(0,comma);
  if(token.length!==13 || !token.every(v=>v>=48&&v<=57)) reject('routing');
  const time=Number(token.toString('ascii')), t=Math.floor(time/HOUR)*HOUR;
  if(time>=SEAL) { if(month!=='2025-10') reject('month'); continue; }
  if(!terminated) reject('framing');
  const comma2=b.indexOf(44,comma+1);
  if(comma<0||comma2<0||b.indexOf(44,comma2+1)!==-1) reject('fields');
  if(time<lo||time>=hi) reject('month');
  if(time<=prev) reject('order');
  if(t===prevHour) reject('hour');
  const interval=b.subarray(comma+1,comma2);
  if(!interval.length||interval[0]<49||interval[0]>57||!interval.every(v=>v>=48&&v<=57)) reject('interval');
  const h=Number(interval.toString('ascii'));
  if(!Number.isSafeInteger(h)) reject('interval');
  times[count]=time; hours[count]=h; token.copy(originals,count*13); count++;prev=time;prevHour=t;
 }
 return {times:times.slice(0,count),hours:hours.slice(0,count),originals:originals.subarray(0,count*13)};
}
class Output {
 constructor(out,budget) {this.out=out;this.partial=out+'.partial';this.budget=budget;this.hashes=new Map();mkdirSync(this.partial);}
 append(path,data) {
  const bytes=Buffer.isBuffer(data)?data:Buffer.from(data);this.budget.write(bytes.length);
  if(!this.hashes.has(path)) {mkdirSync(dirname(join(this.partial,path)),{recursive:true});writeFileSync(join(this.partial,path),'',{flag:'wx'});this.hashes.set(path,createHash('sha256'));}
  appendFileSync(join(this.partial,path),bytes);this.hashes.get(path).update(bytes);
 }
 csv(path,values) {this.append(path,values.join(',')+'\n');}
 finish() {
  const sums=[...this.hashes.keys()].sort(cmp).map(p=>this.hashes.get(p).digest('hex')+'  '+p+'\n').join('');
  this.budget.write(Buffer.byteLength(sums));writeFileSync(join(this.partial,'checksums.sha256'),sums,{flag:'wx'});renameSync(this.partial,this.out);
 }
 invalidate(reason) {
  // Only delete the directory created by this invocation, after checking its identity/type.
  if(existsSync(this.partial)&&lstatSync(this.partial).isDirectory()&&!lstatSync(this.partial).isSymbolicLink()) rmSync(this.partial,{recursive:true});
  writeFileSync(this.out+'.invalid','invalid '+reason+'\n',{flag:'wx'});
 }
}
function options(argv) {
 const allowed=new Set(['--out','--closure-root','--list-base','--download-base','--pause-ms','--retry-ms']), o={};
 for(let i=0;i<argv.length;i+=2) {if(!allowed.has(argv[i])||argv[i+1]===undefined||o[argv[i]]!==undefined) return null;o[argv[i]]=argv[i+1];}
 if(!o['--out']||!o['--closure-root']) return null;
 const testing=['--list-base','--download-base','--pause-ms','--retry-ms'].some(k=>o[k]!==undefined);
 if(testing && !['--list-base','--download-base'].every(k=>/^http:\/\/127\.0\.0\.1:[0-9]+(?:\/|$)/.test(o[k]||'') && (()=>{try{return new URL(o[k]).hostname==='127.0.0.1'&&!new URL(o[k]).username&&!new URL(o[k]).password;}catch{return false;}})())) return null;
 for(const k of ['--pause-ms','--retry-ms']) if(o[k]!==undefined && (!/^\d+$/.test(o[k])||!Number.isSafeInteger(+o[k]))) return null;
 return {out:resolve(o['--out']),closure:resolve(o['--closure-root']),list:o['--list-base']||'https://s3-ap-northeast-1.amazonaws.com/data.binance.vision',download:o['--download-base']||'https://data.binance.vision/'+ROOT,pause:o['--pause-ms']===undefined?250:+o['--pause-ms'],retry:o['--retry-ms']===undefined?2000:+o['--retry-ms']};
}
async function pins(root) {
 const lines=[['node',process.version]];let mismatch=process.version!=='v24.22.0';
 for(const file of Object.keys(PINS).sort(cmp)) {const hash=sha(readFileSync(join(root,MODULE_ROOT,file)));lines.push(['module:'+MODULE_ROOT+file,hash]);if(hash!==PINS[file]) mismatch=true;}
 return {lines,mismatch};
}
async function freeze(o,get,stats) {
 async function list(prefix,maxPages) {
  const prefixes=[],keys=[],seen=new Set(),markers=new Set();let marker=null;
  for(let n=1;;n++) {
   const r=await get('listing',o.list+'?delimiter=%2F&prefix='+enc(prefix,false)+(marker===null?'':'&marker='+enc(marker,false)));
   if(r.status!==200) throw new Freeze();stats.listing_pages++;
   const p=parsePage(r.body);
   if(prefix===ROOT)stats.prefixes_received+=p.prefixes.length;
   for(const item of [...p.prefixes,...p.keys]) {if(seen.has(item)) throw new Freeze();seen.add(item);}
   prefixes.push(...p.prefixes); keys.push(...p.keys);
   if(!p.truncated) return {prefixes,keys};
   if(!p.next||markers.has(p.next)||n>=maxPages) throw new Freeze();markers.add(p.next);marker=p.next;
  }
 }
 const root=await list(ROOT,30);stats.noncanonical_names+=root.keys.length;
 const symbols=[];
 for(const prefix of root.prefixes) {
  const symbol=prefix.startsWith(ROOT)&&prefix.endsWith('/')?prefix.slice(ROOT.length,-1):'';
  if(!symbol||symbol.includes('/')||/[,"#@:;+\u0000-\u001f\u007f-\u009f\s]/u.test(symbol)) throw new Freeze();
  if(SIX.includes(symbol)) stats['dropped:'+symbol]=true;else symbols.push(symbol);
 }
 symbols.sort(cmp);stats.symbols_listed=symbols.length;
 const files=[];
 for(const symbol of symbols) {
  const listing=await list(ROOT+symbol+'/',5);
  stats.noncanonical_names+=listing.prefixes.length;
  for(const key of listing.keys) {
   const month=MONTHS.find(m=>key===ROOT+symbol+'/'+symbol+'-fundingRate-'+m+'.zip');
   if(!month) {
    const canonicalSidecar=MONTHS.some(m=>key===ROOT+symbol+'/'+symbol+'-fundingRate-'+m+'.zip.CHECKSUM'&&listing.keys.includes(key.slice(0,-9)));
    if(!canonicalSidecar)stats.noncanonical_names++;continue;
   }
   files.push({key:key.slice(ROOT.length),symbol,month,status:'not_verified',hash:'',size:'',data:null});
  }
 }
 files.sort((a,b)=>cmp(a.key,b.key));stats.keys_frozen=files.length;stats.symbols_with_keys=new Set(files.map(f=>f.symbol)).size;
 bound('keys',files.length);return {symbols,files};
}
async function acquire(f,completion,get,o,output,selected) {
 const url=o.download+enc(f.key,true), base=basename(f.key);
 const sc=await get('sidecar',url+'.CHECKSUM');
 if(sc.status!==200) {f.status=completion&&sc.status===404?'excluded:missing_checksum':'not_verified';}
 else {
  const zip=await get('zip',url);
  if(zip.status!==200) f.status='not_verified';
  else {
   f.hash=sha(zip.body);f.size=f.month==='2025-10'?'':zip.body.length;
   try {
    // Compare exact bytes; never replacement-decode a malformed sidecar.
    const first=sc.body.subarray(0,64).toString('ascii');
    if(!/^[0-9a-f]{64}$/.test(first)||!sc.body.equals(Buffer.from(first+'  '+base+'\n'))) reject('checksum');
    if(f.hash!==first) reject('hash');
    f.data=rows(member(zip.body,base.replace(/\.zip$/,'.csv')),f.month);
    f.status=f.data.times.length?'verified_nonempty':'verified_empty';
    if(selected.has(f.key)&&f.month!=='2025-10') {output.append('fixtures/'+base,zip.body);output.append('fixtures/'+base+'.CHECKSUM',sc.body);}
   } catch(e) {if(!(e instanceof Exclude)) throw e;f.data=null;f.status='excluded:'+e.check;}
  }
 }

}
const HEADERS={
 'timing.csv':'symbol,segment,calc_time,funding_interval_hours',
 'episodes.csv':'episode,symbol,segment,part,calc_time,funding_interval_hours,status',
 'label1_outside.csv':'candidate,symbol,segment,calc_time,funding_interval_hours',
 'tree_control.csv':'symbol,segment,calc_time,funding_interval_hours,status',
 'manifest.csv':'symbol,month,status,zip_sha256,zip_bytes',
 'pairs.csv':'symbol,segment,p_calc_time,p_h,r_calc_time,r_h,elapsed_h,class,era,cross_era,tree,roles',
 'matrix.csv':'era,cross_era,tree,role,p_h,r_h,elapsed_h,class,pairs',
 'e4.csv':'symbol,calc_time,funding_interval_hours,hourly_related',
 'e1.csv':'era,cross_era,tree,class,pairs'
};
function* evaluate(files,output,stats) {
 const symbols=[...new Set(files.map(f=>f.symbol))].sort(cmp);
 for(const symbol of symbols) {
  let segment=null,id=0;const segments=[];
  for(const month of MONTHS) {
   const file=files.find(f=>f.symbol===symbol&&f.month===month);
   output.csv('manifest.csv',[symbol,month,file?.status||'not_listed',file?.hash||'',file?.size??'']);
   if(file?.status!=='verified_nonempty') {segment=null;continue;}
   if(!segment) {segment={symbol,id:++id,rows:[],lastMonth:month};segments.push(segment);}
   segment.lastMonth=month;
   for(let i=0;i<file.data.times.length;i++) segment.rows.push({raw:file.data.originals.toString('ascii',i*13,i*13+13),time:file.data.times[i],t:Math.floor(file.data.times[i]/HOUR)*HOUR,h:file.data.hours[i]});
   file.data=null;
  }
  yield* segments;
 }
}
async function reports(files,output,stats,scheduleClass) {
 for(const [name,header] of Object.entries(HEADERS)) output.append(name,header+'\n');
 const segments=evaluate(files,output,stats),hist=new Map(),e1=new Map(),matrix=new Map(),tuples=new Map();
 let observed=false,hourlyStop=false,e4=false,treeStatus='unavailable';const hourlyEras=new Set();
 const treeFiles=files.filter(f=>f.symbol==='TREEUSDT');
 if(treeFiles.some(f=>f.data&&f.data.times.some(t=>inTree(Math.floor(t/HOUR)*HOUR)))) {
  treeStatus='partial';
  const aug=treeFiles.find(f=>f.month==='2025-08'),sep=treeFiles.find(f=>f.month==='2025-09');
  if(aug?.status==='verified_nonempty'&&sep?.status==='verified_nonempty'&&Math.floor(aug.data.times[0]/HOUR)*HOUR<=TREE_A&&Math.floor(sep.data.times.at(-1)/HOUR)*HOUR>=TREE_B) treeStatus='available';
 }
 if(treeStatus==='unavailable') output.csv('tree_control.csv',['TREEUSDT','','','','unavailable']);
 const runNumbers=new Map();
 for(const seg of segments) {
  const {symbol,id,rows:rs}=seg,roles=new Map(),related=new Set(),inside=new Uint8Array(rs.length);
  const add=(i,key,role)=> {if(i<1||i>=rs.length)return; if(!roles.has(i))roles.set(i,new Map());const map=roles.get(i);if(!map.has(key))map.set(key,new Set());map.get(key).add(role);};
  const rawRow=r=>[symbol,id,r.raw,r.h];
  for(let a=0;a<rs.length;) {
   let b=a;while(b+1<rs.length&&rs[b+1].t-rs[b].t===HOUR)b++;
   if(b>a&&rs[b].t>=W) {
    const n=(runNumbers.get(symbol)||0)+1;runNumbers.set(symbol,n);const key=symbol+'#'+n;
    const entry=a===0?'left_censored_segment':rs[a].t<W?'left_censored_window':'observed';
    const exit=b+1<rs.length?'observed':seg.lastMonth==='2025-10'?'right_censored_seal':'right_censored_segment';
    stats['runs_entry:'+era(rs[a].t)+':'+entry]++;stats['runs_exit:'+era(rs[b].t)+':'+exit]++;
    if(entry==='observed'||exit==='observed') observed=true;
    for(let i=a;i<=b;i++)inside[i]=1;
    for(let i=Math.max(0,a-3);i<=Math.min(b,a+2);i++) output.csv('episodes.csv',[key,...rawRow(rs[i]).slice(0,2),'entry',rs[i].raw,rs[i].h,entry]);
    for(let i=Math.max(a,b-2);i<=Math.min(rs.length-1,b+3);i++) output.csv('episodes.csv',[key,...rawRow(rs[i]).slice(0,2),'exit',rs[i].raw,rs[i].h,exit]);
    add(a,key,'entry_outer');add(a+1,key,'entry_inner');add(b,key,'exit_inner');add(b+1,key,'exit_outer');
    for(let i=a+2;i<b;i++)add(i,key,'interior');
   }
   a=b+1;
  }
  for(let i=0;i<rs.length;i++) if(rs[i].t>=W&&rs[i].h===1&&!inside[i]) {
   const key=symbol+'@'+rs[i].raw;stats.isolated_candidates++;
   for(let j=Math.max(0,i-3);j<=Math.min(rs.length-1,i+3);j++)output.csv('label1_outside.csv',[key,...rawRow(rs[j])]);
   add(i,key,'isolated_in');add(i+1,key,'isolated_out');
  }
  for(let i=0;i<rs.length;i++) {
   const r=rs[i];output.csv('timing.csv',rawRow(r));stats.rows_o0++;hist.set(r.h,(hist.get(r.h)||0)+1);
   if(symbol==='TREEUSDT'&&inTree(r.t))output.csv('tree_control.csv',[...rawRow(r),treeStatus]);
   if(r.t<W)continue;
   const p=i?rs[i-1]:null,e=era(r.t),cross=p?era(p.t)!==e:false,tr=symbol==='TREEUSDT'&&inTree(r.t);
   const cls=scheduleClass(p?{t:p.t,h:p.h}:null,{t:r.t,h:r.h})||'unclassified';
   if(!p) {output.csv('pairs.csv',[symbol,id,'','',r.raw,r.h,'',cls,e,false,tr,'']);continue;}
   const rm=roles.get(i),roleSet=new Set();let encoded='';
   if(rm) {
    encoded=[...rm.keys()].sort((a,b)=>{const ar=a.includes('#'),br=b.includes('#');return ar!==br?ar?-1:1:Number(a.split(ar?'#':'@')[1])-Number(b.split(br?'#':'@')[1]);}).map(k=>{const ordered=ROLES.filter(v=>rm.get(k).has(v));ordered.forEach(v=>roleSet.add(v));return k+':'+ordered.join('+');}).join(';');
    related.add(i-1);related.add(i);hourlyEras.add(e);if(stopped(cls))hourlyStop=true;
   } else {roleSet.add('none');if(stopped(cls))stats.role_none_stops=(stats.role_none_stops||0)+1;}
   const elapsed=(r.t-p.t)/HOUR,tuple=[p.h,r.h,elapsed].join(',');tuples.set(tuple,[p.h,r.h,elapsed]);
   const countKey=[e,cross,tr,cls].join(',');e1.set(countKey,(e1.get(countKey)||0)+1);
   for(const role of roleSet) {const key=[e,cross,tr,role,tuple,cls].join(',');matrix.set(key,(matrix.get(key)||0)+1);}
   if(cls!=='regular'||encoded)output.csv('pairs.csv',[symbol,id,p.raw,p.h,r.raw,r.h,elapsed,cls,e,cross,tr,encoded]);
  }
  for(let i=0;i<rs.length;i++) {const r=rs[i];if(r.time-r.t>=15000||![1,2,4,8].includes(r.h)) {output.csv('e4.csv',[symbol,r.raw,r.h,related.has(i)]);if(related.has(i))e4=true;}}
 }
 for(const [h,n] of [...hist].sort((a,b)=>a[0]-b[0]))stats['h:'+h]=n;
 const ordered=[...tuples.values()].sort((a,b)=>a[0]-b[0]||a[1]-b[1]||a[2]-b[2]);
 for(const e of ERAS)for(const cross of [false,true])for(const tr of [false,true]) {
  for(const cls of CLASSES) {const key=[e,cross,tr,cls].join(',');output.append('e1.csv',key+','+(e1.get(key)||0)+'\n');}
  for(const role of ROLES)for(const tuple of ordered)for(const cls of CLASSES) {const key=[e,cross,tr,role,...tuple,cls].join(',');output.append('matrix.csv',key+','+(matrix.get(key)||0)+'\n');}
 }
 return {observed,hourlyStop,e4,hourlyEras};
}
function initialStats() {
 const s={listing_pages:0,prefixes_received:0};for(const symbol of SIX)s['dropped:'+symbol]=false;
 for(const k of ['symbols_listed','symbols_with_keys','noncanonical_names','keys_frozen'])s[k]=0;return s;
}
function decision(files,pin,r) {
 const p0=[];
 if(!files.length)p0.push('no_key');if(files.some(f=>!verified(f.status)))p0.push('not_final_verified');
 if(files.some(f=>f.month!=='2025-10'&&f.status==='verified_empty'))p0.push('verified_empty');
 if(pin.mismatch)p0.push('pin_mismatch');if(r.e4)p0.push('e4_hourly_related');if(p0.length)return ['P0',p0];
 const p3=[];for(const e of ['era2','era3'])if(!r.hourlyEras.has(e))p3.push('no_hourly_pair_'+e);
 if(!r.observed)p3.push('no_observed_boundary');if(p3.length)return ['P3',p3];return r.hourlyStop?['P2',['stops']]:['P1',['all_pass']];
}
export async function main(argv=process.argv.slice(2)) {
 const o=options(argv);
 if(!o||[o.out,o.out+'.partial',o.out+'.invalid'].some(existsSync))return 2;
 const budget=new Budget();let output;
 try {
  output=new Output(o.out,budget);
  const pin=await pins(o.closure),stats=initialStats(),get=requester(o,budget);
  let frozen;
  try {frozen=await freeze(o,get,stats);} catch(e) {
   if(!(e instanceof Freeze))throw e;
   output.append('summary.txt',[...Object.entries(stats),...pin.lines].map(([k,v])=>k+' '+v+'\n').join(''));
   output.append('outcome.csv','stage,outcome,reason\nscript,P0,freeze_unresolved\n');output.finish();process.stdout.write('result P0\n');return 0;
  }
  const {symbols,files}=frozen;
  const symbolsText=symbols.map(s=>s+'\n').join(''),keysText=files.map(f=>f.key+'\n').join('');
  output.append('symbols.txt',symbolsText);output.append('keys.txt',keysText);
  const selected=new Set(['TREEUSDT/TREEUSDT-fundingRate-2025-08.zip','TREEUSDT/TREEUSDT-fundingRate-2025-09.zip']);
  files.filter(f=>f.month!=='2025-10').forEach((f,i)=>{if(i%50===0)selected.add(f.key);});
  for(const phase of ['first_pass','final'])for(const s of STATUSES)stats[phase+':'+s]=0;
  let done=0;
  for(const f of files) {await acquire(f,false,get,o,output,selected);stats['first_pass:'+f.status]++;if(++done%100===0)process.stdout.write('progress keys '+done+'/'+files.length+'\n');}
  for(const f of files)if(f.status==='not_verified')await acquire(f,true,get,o,output,selected);
  for(const f of files)stats['final:'+f.status]++;
  for(const check of CHECKS) {const first=files.find(f=>f.month!=='2025-10'&&f.status==='excluded:'+check);if(first)selected.add(first.key);}
  stats.rows_o0=0;
  for(const e of ERAS)for(const s of ['left_censored_segment','left_censored_window','observed'])stats['runs_entry:'+e+':'+s]=0;
  for(const e of ERAS)for(const s of ['observed','right_censored_seal','right_censored_segment'])stats['runs_exit:'+e+':'+s]=0;
  stats.isolated_candidates=0;
  // Property insertion of role_none_stops is delayed until after the h histogram for canonical O6 order.
  const {scheduleClass}=await import(pathToFileURL(join(o.closure,MODULE_ROOT,'f1-funding.mjs')).href);
  const r=await reports(files,output,stats,scheduleClass);
  const roleStops=stats.role_none_stops||0;delete stats.role_none_stops;stats.role_none_stops=roleStops;
  stats['sha256:symbols.txt']=sha(symbolsText);stats['sha256:keys.txt']=sha(keysText);
  output.append('fixtures/fixtures.csv','key,status,zip_sha256\n');
  for(const key of [...selected].sort(cmp)) {const f=files.find(f=>f.key===key);output.csv('fixtures/fixtures.csv',[key,f?.status||'not_listed',f&&verified(f.status)?f.hash:'']);}
  output.append('summary.txt',[...Object.entries(stats),...pin.lines].map(([k,v])=>k+' '+v+'\n').join(''));
  const [outcome,reasons]=decision(files,pin,r);output.append('outcome.csv','stage,outcome,reason\n');for(const reason of reasons)output.csv('outcome.csv',['script',outcome,reason]);
  output.finish();process.stdout.write('result '+outcome+'\n');return 0;
 } catch(e) {
  const reason=e instanceof Abort?e.reason:'implementation';
  try {if(output)output.invalidate(reason);else writeFileSync(o.out+'.invalid','invalid '+reason+'\n',{flag:'wx'});}catch { /* A failed marker write cannot be made successful by disclosing data. */ }
  process.stdout.write('invalid '+reason+'\n');return 3;
 }
}
if(process.argv[1]&&resolve(process.argv[1])===resolve(new URL(import.meta.url).pathname))process.exitCode=await main();
