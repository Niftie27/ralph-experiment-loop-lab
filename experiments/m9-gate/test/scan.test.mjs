import test from 'node:test';
import assert from 'node:assert/strict';
import { readFileSync, mkdtempSync, cpSync, appendFileSync, rmSync, existsSync } from 'node:fs';
import { join, resolve } from 'node:path';
import { tmpdir } from 'node:os';
import { inflateRawSync } from 'node:zlib';
import { sources,run,text,status,sums,root,page,listPath,key,downloadPath,zip,sidecar,csv,time,closure,digest } from './support.mjs';
import { Budget, LIMITS, bound, member, rows, parsePage, main } from '../m9-scan.mjs';
const sample=readFileSync(new URL('../probe-4a/fixtures/key-001.zip',import.meta.url));
const sampleName='ADAUSDT-fundingRate-2025-04.csv';
// Read the real member by its local ZIP record, independently of the production parser.
const realMember=()=>{const start=30+sample.readUInt16LE(26)+sample.readUInt16LE(28);return inflateRawSync(sample.subarray(start,start+sample.readUInt32LE(18)));};
const noRows=(r)=> {assert.equal(text(r,'timing.csv'),'symbol,segment,calc_time,funding_interval_hours\n');assert.equal(text(r,'episodes.csv'),'episode,symbol,segment,part,calc_time,funding_interval_hours,status\n');assert.equal(text(r,'pairs.csv'),'symbol,segment,p_calc_time,p_h,r_calc_time,r_h,elapsed_h,class,era,cross_era,tree,roles\n');assert.equal(text(r,'e4.csv'),'symbol,calc_time,funding_interval_hours,hourly_related\n');};
const frozen=async routes=> {const r=await run(routes);assert.equal(r.code,0);assert.deepEqual(Object.keys(r.files).sort(),['checksums.sha256','outcome.csv','summary.txt']);assert.equal(text(r,'outcome.csv'),'stage,outcome,reason\nscript,P0,freeze_unresolved\n');sums(r);return r;};

test('listing: exact multipage URLs, six excluded, ampersand, percent and non-ASCII real member',async()=> {
 const nonAscii=readFileSync(new URL('../probe-4a/selected.csv',import.meta.url),'utf8').split('\n').find(l=>l.startsWith('05,')).split(',')[1];
 const syms=['Z%USDT','A&USDT',nonAscii,'BTCUSDT','ETHUSDT','SOLUSDT','XRPUSDT','DOGEUSDT','HYPEUSDT'];
 const entries=syms.slice(0,3).flatMap(symbol=>['2025-04','2025-05','2025-06','2025-07'].map(month=>({symbol,month,body:csv([month+'-01T00:00Z',8])})));
 entries.find(e=>e.symbol===nonAscii&&e.month==='2025-04').zip=zip(nonAscii+'-fundingRate-2025-04.csv',realMember());
 const routes=sources(entries,syms),r=await run(routes,{repeats:2});
 assert.equal(r.code,0);assert.equal(text(r,'symbols.txt'),'A&USDT\nZ%USDT\n'+nonAscii+'\n');
 assert.equal(text(r,'keys.txt'),entries.map(e=>key(e.symbol,e.month)).sort((a,b)=>Buffer.compare(Buffer.from(a),Buffer.from(b))).join('\n')+'\n');
 assert.ok(r.requests.every(p=>!syms.slice(3).some(s=>p.includes(s))));
 assert.ok([...routes.keys()].every(p=>r.requests.includes(p)));
 for(const p of Object.keys(r.files))assert.ok(r.results[0].files[p].equals(r.results[1].files[p]),'deterministic '+p);
 status(r,nonAscii,'2025-04','verified_nonempty');sums(r);
});
for(const [name,char] of [['comma',','],['plus','+'],['colon',':'],['NBSP','\u00a0'],['ideographic space','\u3000'],['BOM','\ufeff'],['control','\u0001']])test('freeze unresolved '+name,async()=>frozen(new Map([[listPath(root),page([root+'A'+char+'USDT/'])]])));
test('freeze unresolved invalid UTF-8',async()=>frozen(new Map([[listPath(root),Buffer.concat([Buffer.from('<ListBucketResult><IsTruncated>false</IsTruncated><CommonPrefixes><Prefix>'+root),Buffer.from([0xff]),Buffer.from('/</Prefix></CommonPrefixes></ListBucketResult>')])]])));
test('freeze unresolved repeated marker',async()=>frozen(new Map([[listPath(root),page([],[],'repeat')],[listPath(root,'repeat'),page([],[],'repeat')]])));
test('freeze unresolved repeated CommonPrefix across pages',async()=>frozen(new Map([[listPath(root),page([root+'A/'],[],'next')],[listPath(root,'next'),page([root+'A/'])]])));
test('freeze unresolved repeated CommonPrefix within page',async()=>frozen(new Map([[listPath(root),page([root+'A/',root+'A/'])]])));
test('freeze unresolved repeated Key',async()=>{const k=root+key('A','2025-05');await frozen(new Map([[listPath(root),page([root+'A/'])],[listPath(root+'A/'),page([],[k,k])]]));});
test('freeze unresolved truncated without marker',async()=>frozen(new Map([[listPath(root),page([],[],null,true)]])));
test('freeze unresolved root page limit',async()=>{const m=new Map();for(let i=0;i<30;i++)m.set(listPath(root,i?String(i):undefined),page([],[],String(i+1)));const r=await frozen(m);assert.equal(r.requests.length,30);});
test('freeze unresolved symbol page limit',async()=>{const m=new Map([[listPath(root),page([root+'A/'])]]);for(let i=0;i<5;i++)m.set(listPath(root+'A/',i?String(i):undefined),page([],[],String(i+1)));const r=await frozen(m);assert.equal(r.requests.length,6);});
test('freeze unresolved listing twice fails',async()=>{const r=await frozen(new Map([[listPath(root),500]]));assert.equal(r.requests.length,2);});
for(const entity of ['&bogus;','&#xD800;','&'])test('strict XML entity '+entity,()=>assert.throws(()=>parsePage(Buffer.from('<ListBucketResult><IsTruncated>false</IsTruncated><CommonPrefixes><Prefix>'+entity+'</Prefix></CommonPrefixes></ListBucketResult>'))));

for(const check of ['missing_checksum','checksum','hash','archive','member','crc'])test('I1 '+check,async()=> {
 let z=Buffer.from(sample),s;
 if(check==='archive')z=z.subarray(0,z.length-1);
 if(check==='member') {z=Buffer.from(z);z[30]=88;}
 if(check==='crc') {z=Buffer.from(z);const cd=z.readUInt32LE(z.length-6);z.writeUInt32LE((z.readUInt32LE(cd+16)^1)>>>0,cd+16);}
 const k=key('ADAUSDT','2025-04');s=sidecar(k,z);
 if(check==='checksum')s=s.replace('  ',' ');
 if(check==='hash')s='0'.repeat(64)+'  '+k.split('/')[1]+'\n';
 const r=await run(sources([{symbol:'ADAUSDT',month:'2025-04',zip:z,sidecar:s,sideResponse:check==='missing_checksum'?404:undefined}]));
 assert.equal(r.code,0);status(r,'ADAUSDT','2025-04','excluded:'+check);noRows(r);sums(r);
 assert.equal(text(r,'fixtures/fixtures.csv'),'key,status,zip_sha256\n'+k+',excluded:'+check+',\nTREEUSDT/TREEUSDT-fundingRate-2025-08.zip,not_listed,\nTREEUSDT/TREEUSDT-fundingRate-2025-09.zip,not_listed,\n');
 assert.equal(r.requests.filter(p=>p===downloadPath(k)+'.CHECKSUM').length,check==='missing_checksum'?4:1);
 assert.equal(r.requests.filter(p=>p===downloadPath(k)).length,check==='missing_checksum'?0:1);
});
const may=time('2025-05-01T00:00Z');
const badRows={routing:'notdigits,1,opaque\n',framing:may+',1,opaque',fields:may+',1\n',month:time('2025-04-30T00:00Z')+',1,opaque\n',order:may+',1,opaque\n'+may+',1,opaque\n',hour:may+',1,opaque\n'+String(+may+1)+',1,opaque\n',interval:may+',01,opaque\n'};
for(const [check,body] of Object.entries(badRows))test('I2 '+check,async()=>{const r=await run(sources([{symbol:'A',month:'2025-05',body}]));assert.equal(r.code,0);status(r,'A','2025-05','excluded:'+check);noRows(r);assert.equal(r.requests.length,4);});
for(const header of [false,true])test('I2 header '+header,async()=> {const r=await run(sources([{symbol:'A',month:'2025-05',body:(header?'calc_time,funding_interval_hours,last_funding_rate\n':'')+may+',8,\n'}]));status(r,'A','2025-05','verified_nonempty');assert.equal(text(r,'timing.csv'),'symbol,segment,calc_time,funding_interval_hours\nA,1,'+may+',8\n');});
test('I2 sealed September row excludes month before malformed fields',async()=>{const r=await run(sources([{symbol:'A',month:'2025-09',body:time('2025-10-17Z')+',bad'}]));status(r,'A','2025-09','excluded:month');noRows(r);});
test('I2 sealed October rows dropped without fields or framing; never fixture bytes',async()=> {
 const t=time('2025-10-01Z'),k=key('A','2025-10');const r=await run(sources([{symbol:'A',month:'2025-10',body:t+',8,\n'+time('2025-10-17Z')+',bad,too,many\n'+time('2025-10-18Z')+',bad'}]));
 status(r,'A','2025-10','verified_nonempty');assert.equal(text(r,'timing.csv'),'symbol,segment,calc_time,funding_interval_hours\nA,1,'+t+',8\n');
 assert.ok(r.requests.includes(downloadPath(k)));assert.ok(!Object.keys(r.files).some(p=>p.startsWith('fixtures/')&&p.includes('2025-10')));
 assert.equal(text(r,'manifest.csv').split('\n').find(l=>l.startsWith('A,2025-10,')).split(',')[4],'');
});
test('I2 real fixture mutation reaches interval with rewritten sidecar',async()=> {
 const b=realMember(),first=b.indexOf(10)+1,c1=b.indexOf(44,first),c2=b.indexOf(44,c1+1);
 const mutated=Buffer.concat([b.subarray(0,c1+1),Buffer.from('0'),b.subarray(c2)]);
 const r=await run(sources([{symbol:'ADAUSDT',month:'2025-04',zip:zip(sampleName,mutated)}]));status(r,'ADAUSDT','2025-04','excluded:interval');noRows(r);
});
test('F2 completion retries transient failure then verifies',async()=> {
 const k=key('A','2025-05'),z=zip('A-fundingRate-2025-05.csv',csv(['2025-05-01Z',8]));
 const r=await run(sources([{symbol:'A',month:'2025-05',zip:z,sideResponse:n=>n<=2?503:sidecar(k,z)}]));status(r,'A','2025-05','verified_nonempty');assert.equal(r.counts.get(downloadPath(k)+'.CHECKSUM'),3);assert.match(text(r,'summary.txt'),/first_pass:not_verified 1\n/);assert.match(text(r,'summary.txt'),/final:verified_nonempty 1\n/);assert.ok(r.files['fixtures/A-fundingRate-2025-05.zip'].equals(z));
});
test('F2 zip availability never becomes missing_checksum',async()=> {const r=await run(sources([{symbol:'A',month:'2025-05',zipResponse:404}]));status(r,'A','2025-05','not_verified');noRows(r);assert.equal(r.counts.get(downloadPath(key('A','2025-05'))),4);});
test('F2 sidecar non-404 failure remains not_verified',async()=> {const r=await run(sources([{symbol:'A',month:'2025-05',sideResponse:503}]));status(r,'A','2025-05','not_verified');noRows(r);assert.equal(r.counts.get(downloadPath(key('A','2025-05'))+'.CHECKSUM'),4);});
test('F2 incomplete response retries and completion remains not_verified',async()=> {const r=await run(sources([{symbol:'A',month:'2025-05',sideResponse:{stream:res=>{res.writeHead(200,{'Content-Length':'100'});res.write('short');res.destroy();}}}]));status(r,'A','2025-05','not_verified');noRows(r);});

test('D, O1-O5, O9-O13: observed boundaries in era2 and era3, hand-written records, P1',async()=> {
 const entries=['05','09'].map(m=>({symbol:'A',month:'2025-'+m,body:csv(['2025-'+m+'-03T00:00Z',8],['2025-'+m+'-03T08:00Z',1],['2025-'+m+'-03T09:00Z',1],['2025-'+m+'-03T10:00Z',1],['2025-'+m+'-03T12:00Z',4])}));
 const r=await run(sources(entries));assert.equal(r.code,0);assert.equal(text(r,'outcome.csv'),'stage,outcome,reason\nscript,P1,all_pass\n');
 assert.equal(text(r,'timing.csv'),'symbol,segment,calc_time,funding_interval_hours\nA,1,1746230400000,8\nA,1,1746259200000,1\nA,1,1746262800000,1\nA,1,1746266400000,1\nA,1,1746273600000,4\nA,2,1756857600000,8\nA,2,1756886400000,1\nA,2,1756890000000,1\nA,2,1756893600000,1\nA,2,1756900800000,4\n');
 assert.equal(text(r,'episodes.csv'),'episode,symbol,segment,part,calc_time,funding_interval_hours,status\nA#1,A,1,entry,1746230400000,8,observed\nA#1,A,1,entry,1746259200000,1,observed\nA#1,A,1,entry,1746262800000,1,observed\nA#1,A,1,entry,1746266400000,1,observed\nA#1,A,1,exit,1746259200000,1,observed\nA#1,A,1,exit,1746262800000,1,observed\nA#1,A,1,exit,1746266400000,1,observed\nA#1,A,1,exit,1746273600000,4,observed\nA#2,A,2,entry,1756857600000,8,observed\nA#2,A,2,entry,1756886400000,1,observed\nA#2,A,2,entry,1756890000000,1,observed\nA#2,A,2,entry,1756893600000,1,observed\nA#2,A,2,exit,1756886400000,1,observed\nA#2,A,2,exit,1756890000000,1,observed\nA#2,A,2,exit,1756893600000,1,observed\nA#2,A,2,exit,1756900800000,4,observed\n');
 assert.equal(text(r,'pairs.csv'),'symbol,segment,p_calc_time,p_h,r_calc_time,r_h,elapsed_h,class,era,cross_era,tree,roles\nA,1,,,1746230400000,8,,unclassified,era2,false,false,\nA,1,1746230400000,8,1746259200000,1,8,interval_change,era2,false,false,A#1:entry_outer\nA,1,1746259200000,1,1746262800000,1,1,regular,era2,false,false,A#1:entry_inner\nA,1,1746262800000,1,1746266400000,1,1,regular,era2,false,false,A#1:exit_inner\nA,1,1746266400000,1,1746273600000,4,2,bridge,era2,false,false,A#1:exit_outer\nA,2,,,1756857600000,8,,unclassified,era3,false,false,\nA,2,1756857600000,8,1756886400000,1,8,interval_change,era3,false,false,A#2:entry_outer\nA,2,1756886400000,1,1756890000000,1,1,regular,era3,false,false,A#2:entry_inner\nA,2,1756890000000,1,1756893600000,1,1,regular,era3,false,false,A#2:exit_inner\nA,2,1756893600000,1,1756900800000,4,2,bridge,era3,false,false,A#2:exit_outer\n');
 assert.equal(text(r,'label1_outside.csv'),'candidate,symbol,segment,calc_time,funding_interval_hours\n');assert.equal(text(r,'tree_control.csv'),'symbol,segment,calc_time,funding_interval_hours,status\nTREEUSDT,,,,unavailable\n');assert.equal(text(r,'e4.csv'),'symbol,calc_time,funding_interval_hours,hourly_related\n');
 // Entire matrix including all zero cells, expected numeric domain and evidence fixed independently.
 const expectedMatrix=['era,cross_era,tree,role,p_h,r_h,elapsed_h,class,pairs'];const expectedE1=['era,cross_era,tree,class,pairs'];
 const classes=['regular','interval_change','bridge','off_grid','unexplained_gap','unexplained_change'];
 for(const era of ['era1','era2','era3'])for(const cross of ['false','true'])for(const tree of ['false','true']) {
  for(const c of classes)expectedE1.push([era,cross,tree,c,era!=='era1'&&cross==='false'&&tree==='false'?({regular:2,interval_change:1,bridge:1}[c]||0):0].join(','));
  for(const role of ['entry_outer','entry_inner','interior','exit_inner','exit_outer','isolated_in','isolated_out','none'])for(const tuple of ['1,1,1','1,4,2','8,1,8'])for(const c of classes) {
   const evidence=(role==='entry_outer'&&tuple==='8,1,8'&&c==='interval_change')||(['entry_inner','exit_inner'].includes(role)&&tuple==='1,1,1'&&c==='regular')||(role==='exit_outer'&&tuple==='1,4,2'&&c==='bridge');
   expectedMatrix.push([era,cross,tree,role,tuple,c,era!=='era1'&&cross==='false'&&tree==='false'&&evidence?1:0].join(','));
  }
 }
 assert.equal(text(r,'matrix.csv'),expectedMatrix.join('\n')+'\n');assert.equal(text(r,'e1.csv'),expectedE1.join('\n')+'\n');sums(r);
});
test('D April beginning left_censored_window, cross_era, October right_censored_seal',async()=> {
 const r=await run(sources([{symbol:'A',month:'2025-04',body:csv(['2025-04-30T16:00Z',8],['2025-04-30T23:00Z',1])},{symbol:'A',month:'2025-05',body:csv(['2025-05-01T00:00Z',1],['2025-05-01T08:00Z',8],['2025-05-02T07:00Z',1],['2025-05-02T08:00Z',1])},{symbol:'A',month:'2025-10',body:csv(['2025-10-16T22:00Z',1],['2025-10-16T23:00Z',1])}]));
 assert.ok(text(r,'episodes.csv').includes('A#1,A,1,entry,'+time('2025-04-30T23:00Z')+',1,left_censored_window\n'));
 assert.ok(text(r,'episodes.csv').includes('A#3,A,2,exit,'+time('2025-10-16T23:00Z')+',1,right_censored_seal\n'));
 assert.ok(text(r,'pairs.csv').includes(',regular,era2,true,false,A#2:entry_inner+exit_inner\n'));assert.equal(text(r,'outcome.csv'),'stage,outcome,reason\nscript,P2,stops\n');
});
test('D isolated label1, segment break from not_verified, P0',async()=> {
 const r=await run(sources([{symbol:'A',month:'2025-05',body:csv(['2025-05-01T00:00Z',8],['2025-05-01T08:00Z',1],['2025-05-01T16:00Z',8])},{symbol:'A',month:'2025-06',sideResponse:503},{symbol:'A',month:'2025-07',body:csv(['2025-07-01Z',8])}]));
 const candidate='A@1746086400000';assert.equal(text(r,'label1_outside.csv'),'candidate,symbol,segment,calc_time,funding_interval_hours\n'+candidate+',A,1,1746057600000,8\n'+candidate+',A,1,1746086400000,1\n'+candidate+',A,1,1746115200000,8\n');
 assert.ok(text(r,'pairs.csv').endsWith('A,2,,,'+time('2025-07-01Z')+',8,,unclassified,era2,false,false,\n'));
 assert.equal(text(r,'outcome.csv'),'stage,outcome,reason\nscript,P0,not_final_verified\n');
});
for(const expected of ['available','partial','unavailable'])test('TREE '+expected,async()=> {
 const entries=expected==='unavailable'?[]:[{symbol:'TREEUSDT',month:'2025-08',body:csv(['2025-08-31T08:00Z',8])},...(expected==='available'?[{symbol:'TREEUSDT',month:'2025-09',body:csv(['2025-09-01T04:00Z',4])}]:[])];
 const r=await run(sources(entries));assert.equal(text(r,'tree_control.csv'),'symbol,segment,calc_time,funding_interval_hours,status\n'+(expected==='unavailable'?'TREEUSDT,,,,unavailable\n':'TREEUSDT,1,'+time('2025-08-31T08:00Z')+',8,'+expected+'\n'+(expected==='available'?'TREEUSDT,1,'+time('2025-09-01T04:00Z')+',4,available\n':'')));
});
test('P3 zero hourly evidence, role-none stops retained',async()=> {
 const r=await run(sources([{symbol:'A',month:'2025-05',body:csv(['2025-05-01T00:00Z',8],['2025-05-01T16:00Z',8])}]));assert.equal(text(r,'outcome.csv'),'stage,outcome,reason\nscript,P3,no_hourly_pair_era2\nscript,P3,no_hourly_pair_era3\nscript,P3,no_observed_boundary\n');assert.match(text(r,'summary.txt'),/role_none_stops 1\n/);assert.ok(text(r,'pairs.csv').endsWith(',16,unexplained_gap,era1,false,false,\n'));
});
test('P0 no_key and verified_empty reasons',async()=> {
 const empty=await run(sources([]));assert.equal(text(empty,'outcome.csv'),'stage,outcome,reason\nscript,P0,no_key\n');
 const r=await run(sources([{symbol:'A',month:'2025-05',body:''}]));status(r,'A','2025-05','verified_empty');assert.equal(text(r,'outcome.csv'),'stage,outcome,reason\nscript,P0,verified_empty\n');
});
test('E4 hourly endpoints only, context remains false',async()=> {
 const r=await run(sources([{symbol:'A',month:'2025-05',body:csv(['2025-05-03T00:00:15Z',3],['2025-05-03T08:00:15Z',1],['2025-05-03T09:00:15Z',1],['2025-05-03T12:00Z',4],['2025-05-03T16:00:15Z',4])}]));
 assert.equal(text(r,'e4.csv'),'symbol,calc_time,funding_interval_hours,hourly_related\nA,1746230415000,3,true\nA,1746259215000,1,true\nA,1746262815000,1,true\nA,1746288015000,4,false\n');assert.equal(text(r,'outcome.csv'),'stage,outcome,reason\nscript,P0,e4_hourly_related\n');
});
test('pins: changed closure yields P0 pin_mismatch',async()=> {
 const temp=mkdtempSync(join(tmpdir(),'m9-pin-'));
 try {cpSync(closure,temp,{recursive:true});appendFileSync(join(temp,'experiments/strategy-destruction-filter/src/f1-funding.mjs'),'\n// offline pin mutation\n');const r=await run(sources([{symbol:'A',month:'2025-05'}]),{closureRoot:temp});assert.equal(text(r,'outcome.csv'),'stage,outcome,reason\nscript,P0,pin_mismatch\n');}
 finally {assert.ok(temp.startsWith(resolve(tmpdir())+'/m9-pin-'));if(existsSync(temp))rmSync(temp,{recursive:true});}
});

// Resource boundaries use their actual fixed limits, never a reduced cap or test-only CLI override.
for(const kind of ['listing','sidecar','zip'])test('F6 '+kind+' body abort leaves only invalid',async()=> {
 const body={stream:res=>{res.writeHead(200);const chunk=Buffer.alloc(Math.min(65536,LIMITS[kind]+1));let remaining=LIMITS[kind]+1;const pump=()=>{while(remaining>0){const n=Math.min(remaining,chunk.length);remaining-=n;if(!res.write(chunk.subarray(0,n))){res.once('drain',pump);return;}}res.end();};pump();}};
 const routes=kind==='listing'?new Map([[listPath(root),body]]):sources([{symbol:'A',month:'2025-05',...(kind==='sidecar'?{sideResponse:body}:{zipResponse:body})}]);
 const r=await run(routes);assert.equal(r.code,3);assert.equal(r.invalid,'invalid '+kind+'\n');assert.equal(r.partial,false);assert.deepEqual(r.names,['out0.invalid']);assert.deepEqual(r.files,{});
});
test('F6 total byte accounting includes failed attempts and crosses 1 GiB exactly',()=> {
 const budget=new Budget();for(let i=0;i<64;i++)budget.receive('zip',16*1024*1024,16*1024*1024);assert.equal(budget.total,LIMITS.total);assert.throws(()=>budget.receive('sidecar',1,1),e=>e.reason==='total');
});
test('F6 total abort invalidates partial output using already-consumed budget',async()=> {
 const original=Budget.prototype.receive;
 Budget.prototype.receive=function(kind,n,attempt){this.total=LIMITS.total;return original.call(this,kind,n,attempt);};
 try {const r=await run(sources([]));assert.equal(r.code,3);assert.equal(r.invalid,'invalid total\n');assert.deepEqual(r.names,['out0.invalid']);}
 finally {Budget.prototype.receive=original;}
});
test('F6 output-space boundary and invalid marker',async()=> {
 const budget=new Budget();budget.write(LIMITS.output);assert.throws(()=>budget.write(1),e=>e.reason==='output');
 const original=Budget.prototype.write;
 Budget.prototype.write=function(n){this.output=LIMITS.output;return original.call(this,n);};
 try {const r=await run(sources([]));assert.equal(r.code,3);assert.equal(r.invalid,'invalid output\n');assert.deepEqual(r.names,['out0.invalid']);}
 finally {Budget.prototype.write=original;}
});
test('F6 frozen-key bound is inclusive 10000, rejects 10001',()=> {assert.doesNotThrow(()=>bound('keys',10000));assert.throws(()=>bound('keys',10001),e=>e.reason==='keys');});
test('F6 declared inflated-member size abort',async()=> {
 const z=zip('A-fundingRate-2025-05.csv',csv(['2025-05-01Z',8]));const at=z.readUInt32LE(z.length-6);z.writeUInt32LE(LIMITS.member+1,at+24);
 const r=await run(sources([{symbol:'A',month:'2025-05',zip:z}]));assert.equal(r.code,3);assert.equal(r.invalid,'invalid member\n');assert.deepEqual(r.names,['out0.invalid']);
});
test('F6 line bound aborts before parsing row fields',async()=> {
 const r=await run(sources([{symbol:'A',month:'2025-05',body:may+',8,'+'x'.repeat(65536)+'\n'}]));assert.equal(r.code,3);assert.equal(r.invalid,'invalid line\n');assert.deepEqual(r.names,['out0.invalid']);
});
test('F6 million-line bound counts sealed lines without exposing them',async()=> {
 const body=(time('2025-10-17Z')+'\n').repeat(1000001);
 const r=await run(sources([{symbol:'A',month:'2025-10',body}]));assert.equal(r.code,3);assert.equal(r.invalid,'invalid lines\n');assert.deepEqual(r.names,['out0.invalid']);
});
test('I2 resource edges permit exactly 65536-byte sealed line and 1000000 lines',()=> {
 assert.equal(rows(Buffer.from(time('2025-10-17Z')+','+'x'.repeat(65536-14)+'\n'),'2025-10').times.length,0);
 assert.equal(rows(Buffer.from((time('2025-10-17Z')+'\n').repeat(1000000)),'2025-10').times.length,0);
});
test('CLI refuses existing output/partial/invalid without deleting it',async()=> {
 const {writeFileSync,mkdirSync}=await import('node:fs');const temp=mkdtempSync(join(tmpdir(),'m9-exists-'));
 try {for(const suffix of ['','.partial','.invalid']) {const out=join(temp,'r'+suffix.length);writeFileSync(out+suffix,'sentinel');assert.equal(await main(['--out',out,'--closure-root',closure,'--list-base','http://127.0.0.1:1/list','--download-base','http://127.0.0.1:1/download/']),2);assert.equal(readFileSync(out+suffix,'utf8'),'sentinel');}}
 finally {assert.ok(temp.startsWith(resolve(tmpdir())+'/m9-exists-'));if(existsSync(temp))rmSync(temp,{recursive:true});}
});
test('F6 actual inflate overflow aborts regardless of smaller declared size',async()=> {
 // Streaming fixture construction avoids retaining a 64 MiB input buffer.
 const {createDeflateRaw}=await import('node:zlib');const {once}=await import('node:events');const deflater=createDeflateRaw();const pieces=[];
 const collected=(async()=>{for await(const b of deflater)pieces.push(b);})();
 const chunk=Buffer.alloc(65536,120);
 for(let i=0;i<1024;i++)if(!deflater.write(chunk))await once(deflater,'drain');deflater.end(Buffer.from('x'));await collected;
 const packed=Buffer.concat(pieces),name=Buffer.from('A-fundingRate-2025-05.csv'),local=Buffer.alloc(30),central=Buffer.alloc(46),end=Buffer.alloc(22);
 local.writeUInt32LE(0x04034b50);local.writeUInt16LE(8,8);local.writeUInt16LE(name.length,26);
 central.writeUInt32LE(0x02014b50);central.writeUInt16LE(8,10);central.writeUInt32LE(packed.length,20);central.writeUInt32LE(1,24);central.writeUInt16LE(name.length,28);
 end.writeUInt32LE(0x06054b50);end.writeUInt16LE(1,8);end.writeUInt16LE(1,10);end.writeUInt32LE(46+name.length,12);end.writeUInt32LE(30+name.length+packed.length,16);
 const z=Buffer.concat([local,name,packed,central,name,end]);
 const r=await run(sources([{symbol:'A',month:'2025-05',zip:z}]));assert.equal(r.code,3);assert.equal(r.invalid,'invalid member\n');assert.deepEqual(r.names,['out0.invalid']);
});

test('S1 canonical sidecar is not another object; other names counted without fetching',async()=> {
 const routes=sources([{symbol:'A',month:'2025-05'}]),k=root+key('A','2025-05');
 routes.set(listPath(root+'A/'),page([],[k,k+'.CHECKSUM',root+'A/irrelevant'], 'next'));
 routes.set(listPath(root+'A/','next'),page([],[root+'A/A-fundingRate-2024-01.zip.CHECKSUM']));
 const r=await run(routes);assert.match(text(r,'summary.txt'),/noncanonical_names 2\n/);assert.match(text(r,'summary.txt'),/keys_frozen 1\n/);assert.equal(r.requests.length,5);
});
test('O4 exact manifest bytes, fetched ZIP identity and absent months',async()=> {
 const z=zip('A-fundingRate-2025-05.csv',csv(['2025-05-01Z',8]));const r=await run(sources([{symbol:'A',month:'2025-05',zip:z}]));
 assert.equal(text(r,'manifest.csv'),'symbol,month,status,zip_sha256,zip_bytes\nA,2025-04,not_listed,,\nA,2025-05,verified_nonempty,'+digest(z)+','+z.length+'\nA,2025-06,not_listed,,\nA,2025-07,not_listed,,\nA,2025-08,not_listed,,\nA,2025-09,not_listed,,\nA,2025-10,not_listed,,\n');
});
test('D multi-id boundary role order and interior role',async()=> {
 const r=await run(sources([{symbol:'A',month:'2025-05',body:csv(['2025-05-03T00:00Z',1],['2025-05-03T01:00Z',1],['2025-05-03T02:00Z',1],['2025-05-03T03:00Z',1],['2025-05-03T08:00Z',1],['2025-05-03T09:00Z',1])}]));
 assert.equal(text(r,'pairs.csv'),'symbol,segment,p_calc_time,p_h,r_calc_time,r_h,elapsed_h,class,era,cross_era,tree,roles\nA,1,,,1746230400000,1,,unclassified,era2,false,false,\nA,1,1746230400000,1,1746234000000,1,1,regular,era2,false,false,A#1:entry_inner\nA,1,1746234000000,1,1746237600000,1,1,regular,era2,false,false,A#1:interior\nA,1,1746237600000,1,1746241200000,1,1,regular,era2,false,false,A#1:exit_inner\nA,1,1746241200000,1,1746259200000,1,5,unexplained_gap,era2,false,false,A#1:exit_outer;A#2:entry_outer\nA,1,1746259200000,1,1746262800000,1,1,regular,era2,false,false,A#2:entry_inner+exit_inner\n');
});
