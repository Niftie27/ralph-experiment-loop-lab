import assert from 'node:assert/strict';
import { createServer } from 'node:http';
import { once } from 'node:events';
import { mkdtempSync, readFileSync, readdirSync, rmSync, existsSync } from 'node:fs';
import { tmpdir } from 'node:os';
import { join, resolve } from 'node:path';
import { deflateRawSync, crc32 } from 'node:zlib';
import { createHash } from 'node:crypto';
import { main } from '../m9-scan.mjs';
export const closure=process.env.M9_CLOSURE_ROOT;
assert.ok(closure,'M9_CLOSURE_ROOT must be set');
export const root='data/futures/um/monthly/fundingRate/';
export const digest=b=>createHash('sha256').update(b).digest('hex');
// Independent URI builder: encodeURIComponent plus RFC3986's remaining five characters.
export function uri(s,slash=false) { const part=x=>encodeURIComponent(x).replace(/[!'()*]/g,c=>'%'+c.charCodeAt(0).toString(16).toUpperCase());return slash?s.split('/').map(part).join('/'):part(s); }
export const listPath=(prefix,marker)=>'/list?delimiter=%2F&prefix='+uri(prefix)+(marker===undefined?'':'&marker='+uri(marker));
export const downloadPath=k=>'/download/'+uri(k,true);
export const key=(s,m)=>s+'/'+s+'-fundingRate-'+m+'.zip';
export const xml=s=>s.replaceAll('&','&amp;').replaceAll('<','&lt;').replaceAll('>','&gt;').replaceAll('"','&quot;').replaceAll("'",'&apos;');
export function page(prefixes=[],keys=[],next=null,truncated=next!==null) {return '<ListBucketResult><IsTruncated>'+truncated+'</IsTruncated>'+prefixes.map(p=>'<CommonPrefixes><Prefix>'+xml(p)+'</Prefix></CommonPrefixes>').join('')+keys.map(k=>'<Contents><Key>'+xml(k)+'</Key></Contents>').join('')+(next===null?'':'<NextMarker>'+xml(next)+'</NextMarker>')+'</ListBucketResult>';}
export const time=s=>String(Date.parse(s));
export const csv=(...rows)=>'calc_time,funding_interval_hours,last_funding_rate\n'+rows.map(([t,h])=>time(t)+','+h+',opaque\n').join('');
export function zip(name,body) {
 body=Buffer.from(body);const packed=deflateRawSync(body),n=Buffer.from(name),local=Buffer.alloc(30),central=Buffer.alloc(46),end=Buffer.alloc(22);
 local.writeUInt32LE(0x04034b50);local.writeUInt16LE(20,4);local.writeUInt16LE(8,8);local.writeUInt32LE(crc32(body),14);local.writeUInt32LE(packed.length,18);local.writeUInt32LE(body.length,22);local.writeUInt16LE(n.length,26);
 central.writeUInt32LE(0x02014b50);central.writeUInt16LE(20,4);central.writeUInt16LE(20,6);central.writeUInt16LE(8,10);central.writeUInt32LE(crc32(body),16);central.writeUInt32LE(packed.length,20);central.writeUInt32LE(body.length,24);central.writeUInt16LE(n.length,28);
 const offset=30+n.length+packed.length;end.writeUInt32LE(0x06054b50);end.writeUInt16LE(1,8);end.writeUInt16LE(1,10);end.writeUInt32LE(46+n.length,12);end.writeUInt32LE(offset,16);
 return Buffer.concat([local,n,packed,central,n,end]);
}
export function sidecar(k,z) {return digest(z)+'  '+k.split('/').at(-1)+'\n';}
export function sources(entries,symbols=[...new Set(entries.map(e=>e.symbol))]) {
 const routes=new Map();
 // Every mock listing page contains at most three items, including the root page.
 const paginate=(prefix,items,isRoot)=> {
  let marker;
  for(let i=0;i<Math.max(1,items.length);i+=3) {const chunk=items.slice(i,i+3),next=i+3<items.length?'cursor &% '+i:null;routes.set(listPath(prefix,marker),page(isRoot?chunk:[],isRoot?[]:chunk,next));marker=next;}
 };
 paginate(root,symbols.map(s=>root+s+'/'),true);
 for(const s of symbols)if(!['BTCUSDT','ETHUSDT','SOLUSDT','XRPUSDT','DOGEUSDT','HYPEUSDT'].includes(s))paginate(root+s+'/',entries.filter(e=>e.symbol===s).map(e=>root+key(s,e.month)),false);
 for(const e of entries) {
  const k=key(e.symbol,e.month),z=e.zip||zip(k.split('/').at(-1).replace('.zip','.csv'),e.body??csv([e.month+'-01T00:00Z',8]));
  routes.set(downloadPath(k),e.zipResponse??z);routes.set(downloadPath(k)+'.CHECKSUM',e.sideResponse??e.sidecar??sidecar(k,z));
 }
 return routes;
}
export function files(dir,prefix='') {
 const result={};for(const ent of readdirSync(join(dir,prefix),{withFileTypes:true})) {const p=prefix?prefix+'/'+ent.name:ent.name;if(ent.isDirectory())Object.assign(result,files(dir,p));else result[p]=readFileSync(join(dir,p));}return result;
}
export async function run(routes,{closureRoot=closure,repeats=1,args=[]}={}) {
 const temp=mkdtempSync(join(tmpdir(),'m9-')),requests=[],unexpected=[],counts=new Map();
 const server=createServer((req,res)=> {
  requests.push(req.url);counts.set(req.url,(counts.get(req.url)||0)+1);
  if(!routes.has(req.url)) {unexpected.push(req.url);res.writeHead(404);res.end();return;}
  let response=routes.get(req.url);if(typeof response==='function')response=response(counts.get(req.url));
  if(typeof response==='number') {res.writeHead(response);res.end();}
  else if(response&&response.stream)response.stream(res);
  else {res.writeHead(200);res.end(response);}
 });
 server.listen(0,'127.0.0.1');await once(server,'listening');
 const origin='http://127.0.0.1:'+server.address().port,results=[];
 try {
  for(let i=0;i<repeats;i++) {
   const out=join(temp,'out'+i);
   const code=await main(['--out',out,'--closure-root',closureRoot,'--list-base',origin+'/list','--download-base',origin+'/download/','--pause-ms','0','--retry-ms','0',...args]);
   const result=existsSync(out)?files(out):{};
   results.push({code,files:result,invalid:existsSync(out+'.invalid')?readFileSync(out+'.invalid','utf8'):null,partial:existsSync(out+'.partial'),names:readdirSync(temp)});
  }
  assert.deepEqual(unexpected,[],'strict mock received unexpected requests');
  return {...results.at(-1),results,requests,counts};
 } finally {server.closeAllConnections();await new Promise(r=>server.close(r));assert.ok(temp.startsWith(resolve(tmpdir())+'/m9-'));if(existsSync(temp))rmSync(temp,{recursive:true});}
}
export const text=(r,p)=>r.files[p]?.toString('utf8');
export function sums(r) {
 const paths=Object.keys(r.files).filter(p=>p!=='checksums.sha256').sort((a,b)=>Buffer.compare(Buffer.from(a),Buffer.from(b)));
 assert.equal(text(r,'checksums.sha256'),paths.map(p=>digest(r.files[p])+'  '+p+'\n').join(''));
}
export function status(r,s,m,expected) {const line=text(r,'manifest.csv').split('\n').find(l=>l.startsWith(s+','+m+','));assert.equal(line.split(',')[2],expected);}
