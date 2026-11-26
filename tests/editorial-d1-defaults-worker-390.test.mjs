import test from 'node:test';
import assert from 'node:assert/strict';
import {webcrypto} from 'node:crypto';
import {readFileSync} from 'node:fs';
import {buildEditorialDefaultsManifest} from '../scripts/plan-editorial-d1-defaults.mjs';
import {readVerifiedEditorialSnapshot} from '../worker/pandora-studio-editorial-defaults.js';
import worker from '../worker/index.js';

const manifest=buildEditorialDefaultsManifest();
const metadata={
 snapshot:manifest.snapshot,
 source_release:manifest.release,
 sha256:manifest.digest,
 expected_rows:manifest.records.length
};
const records=manifest.records.map(r=>({
 record_key:r.recordKey,field:r.field,value:r.value
}));
const defaultTables=['editorial_default_rows','editorial_default_snapshots'];

function stagingDB({marker=metadata,rows=records,tables=defaultTables}={}){
 const queries=[],args=[];
 return {queries,args,prepare(query){
  queries.push(query);
  const bind=(...params)=>{
   args.push(params);
   return {
    first:async()=>query.includes('FROM editorial_default_snapshots')?marker:null,
    all:async()=>query.includes('FROM editorial_default_rows')?{results:rows}:{results:[]}
   };
  };
  return {bind,all:async()=>({results:tables.map(name=>({name}))})};
 }};
}
const read=(db,snapshot=manifest.snapshot)=>
 readVerifiedEditorialSnapshot(db,snapshot,{subtle:webcrypto.subtle});

test('#390 released Worker owner kill switch disables route with zero database reads',async()=>{
 let queries=0;
 const env={DB:{prepare(){queries++;throw Error('Unexpected production query')}},
  EDITORIAL_DEFAULTS_PREVIEW:'disabled'};
 const request=new Request('https://ps-build-studio-cloud.bonaqu.workers.dev'+
  '/api/editorial-defaults?snapshot='+manifest.snapshot);
 const response=await worker.fetch(request,env,{});
 assert.equal(response.status,404);
 assert.equal(queries,0,'A deliberately disabled release must never query production D1');
 const payload=await response.json();
 assert.equal(payload.error,'Not found');
 const source=readFileSync(new URL('../worker/index.js',import.meta.url),'utf8');
 assert.match(source,/env\.EDITORIAL_DEFAULTS_PREVIEW==='disabled'/);
});

test('#390 released Worker exposes only the exact pinned public snapshot',async()=>{
 const db=stagingDB();
 const endpoint='https://ps-build-studio-cloud.bonaqu.workers.dev/api/editorial-defaults?snapshot=';
 const mismatched=await worker.fetch(new Request(endpoint+'0.948.0-0000000000000000'),{DB:db},{});
 assert.equal(mismatched.status,404,'Unknown snapshots are not public');
 assert.equal(db.queries.length,0,'Unknown snapshot must be rejected before D1 reads');
 const valid=await worker.fetch(new Request(endpoint+manifest.snapshot),{DB:db},{});
 assert.equal(valid.status,200,'Reviewed pinned version is the only released snapshot');
 assert.equal((await valid.json()).sha256,manifest.digest);
 const source=readFileSync(new URL('../worker/index.js',import.meta.url),'utf8');
 assert.match(source,/if\(snapshot!=='0\.948\.0-5637e5c111eb4528'\)/);
});

test('#390 D1 authored defaults: exact version read validates every source field',async()=>{
 const db=stagingDB();
 const result=await read(db);
 assert.equal(result.status,200);
 assert.deepEqual(result.payload,{
  schema:1,release:manifest.release,snapshot:manifest.snapshot,
  sha256:manifest.digest,records:manifest.records
 });
 assert.equal(db.queries.length,3);
 assert.ok(db.queries.every(query=>/^\s*SELECT\b/i.test(query)),
  'Public version read must never issue a write or D1 schema mutation');
 assert.deepEqual(db.args,[[manifest.snapshot],[manifest.snapshot]]);
 const worker=readFileSync(new URL('../worker/index.js',import.meta.url),'utf8');
 assert.match(worker,/if\(path==='\/api\/editorial-defaults'&&method==='GET'\)/);
 assert.match(worker,/return json\(outcome\.payload,outcome\.status\)/);
 assert.match(worker,/if\(path==='\/api\/overrides'&&method==='GET'\)/);
});

test('#390 D1 authored defaults: absent tables and unknown snapshots remain safe',async()=>{
 let db=stagingDB({tables:[]});
 let result=await read(db);
 assert.equal(result.status,404);
 assert.equal(result.payload.code,'EDITORIAL_DEFAULTS_NOT_INSTALLED');
 assert.equal(db.queries.length,1,'No read from an uninstalled D1 table');
 db=stagingDB({marker:null});
 result=await read(db);
 assert.equal(result.status,404);
 assert.equal(result.payload.code,'EDITORIAL_DEFAULTS_SNAPSHOT_NOT_FOUND');
 assert.equal(db.queries.length,2);
 db=stagingDB();
 result=await read(db,'../latest');
 assert.equal(result.status,400);
 assert.equal(result.payload.code,'EDITORIAL_DEFAULTS_BAD_SNAPSHOT');
 assert.equal(db.queries.length,0);
});

test('#390 D1 authored defaults: incomplete, duplicate and edited snapshots fail closed',async()=>{
 const cases=[
  [{rows:records.slice(1)},'EDITORIAL_DEFAULTS_INCOMPLETE'],
  [{rows:[records[0],...records.slice(0,-1)]},'EDITORIAL_DEFAULTS_DUPLICATE'],
  [{rows:records.map((r,i)=>i===0?{...r,value:r.value+' edited'}:r)},
   'EDITORIAL_DEFAULTS_DIGEST_MISMATCH'],
  [{rows:records.map((r,i)=>i===0?{...r,record_key:'guideedit.user.55'}:r)},
   'EDITORIAL_DEFAULTS_INVALID_ROW'],
  [{rows:records.map(r=>r.record_key==='guideedit.wiki.labels'&&
    r.field==='honor_victories_ru'?{...r,field:'honor_victories_points'}:r)},
   'EDITORIAL_DEFAULTS_INVALID_ROW'],
  [{rows:records.map((r,i)=>i===0?{
    ...r,record_key:'guideedit.book.owner-dock.title',field:'unverifiedRu'
   }:r)},'EDITORIAL_DEFAULTS_INVALID_ROW'],
  [{rows:records.map((r,i)=>i===0?{
    ...r,record_key:'guideedit.honor.overview',field:'secretRu'
   }:r)},'EDITORIAL_DEFAULTS_INVALID_ROW'],
  [{rows:records.map((r,i)=>i===0?{
    ...r,record_key:'guideedit.honor.rank.0',field:'requirementRu'
   }:r)},'EDITORIAL_DEFAULTS_INVALID_ROW'],
  [{marker:{...metadata,sha256:'f'.repeat(64)}},
   'EDITORIAL_DEFAULTS_CORRUPT_MARKER'],
  [{marker:{...metadata,expected_rows:3001}},
   'EDITORIAL_DEFAULTS_CORRUPT_MARKER'],
  [{marker:{...metadata,source_release:'0.000.0'}},
   'EDITORIAL_DEFAULTS_CORRUPT_MARKER']
 ];
 for(const [options,code] of cases){
  const db=stagingDB(options);
  const outcome=await read(db);
  assert.equal(outcome.status,503,code);
  assert.equal(outcome.payload.code,code);
  assert.equal(Object.hasOwn(outcome.payload,'records'),false,
   'A malformed D1 snapshot must never return partially trusted copy');
  assert.ok(db.queries.every(query=>/^\s*SELECT\b/i.test(query)));
 }
});

test('#390 staged endpoint rejects unexpected or repeated snapshot inputs before D1',async()=>{
 let queryCount=0;
 const db={prepare(){queryCount++;throw Error('Unexpected staging SQL read')}};
 const endpoint='https://ps-build-studio-cloud.bonaqu.workers.dev/api/editorial-defaults';
 for(const query of [
  '',
  '?snapshot='+manifest.snapshot+'&debug=1',
  '?snapshot='+manifest.snapshot+'&snapshot='+manifest.snapshot,
  '?debug=1',
  '?snapshot='+manifest.snapshot+'&snapshot=other'
 ]){
  const response=await worker.fetch(new Request(endpoint+query),
   {DB:db,EDITORIAL_DEFAULTS_PREVIEW:'enabled'},{});
  assert.equal(response.status,400,query);
  assert.equal((await response.json()).code,'EDITORIAL_DEFAULTS_BAD_REQUEST');
  assert.equal(response.headers.get('cache-control'),'no-store');
 }
 assert.equal(queryCount,0,'Preview query validation must precede all D1 access');
});

test('#390 staged endpoint masks D1 errors without leaking private SQL, preserving daily quota',async()=>{
 const endpoint='https://ps-build-studio-cloud.bonaqu.workers.dev'+
  '/api/editorial-defaults?snapshot='+manifest.snapshot;
 const fault=message=>({prepare(){throw Error(message)}});
 const internal=await worker.fetch(new Request(endpoint),{
  DB:fault('PRIVATE_SNAPSHOT_TABLE or internal SQL info'),
  EDITORIAL_DEFAULTS_PREVIEW:'enabled'
 },{});
 assert.equal(internal.status,503);
 assert.equal(internal.headers.get('cache-control'),'no-store');
 const body=await internal.text();
 assert.equal(JSON.parse(body).code,'EDITORIAL_DEFAULTS_READ_FAILED');
 assert.doesNotMatch(body,/PRIVATE_SNAPSHOT_TABLE|internal SQL info/);
 const quota=await worker.fetch(new Request(endpoint),{
  DB:fault("exceeded D1's free tier daily row read limit"),
  EDITORIAL_DEFAULTS_PREVIEW:'enabled'
 },{});
 assert.equal(quota.status,503);
 assert.equal(JSON.parse(await quota.text()).code,'D1_DAILY_QUOTA_EXCEEDED');
 assert.match(quota.headers.get('retry-after')||'',/^[0-9]+$/);
});

test('#390 enabled preview route exposes only exact verified snapshot and remains GET-only',async()=>{
 const db=stagingDB();
 const endpoint='https://ps-build-studio-cloud.bonaqu.workers.dev'+
  '/api/editorial-defaults?snapshot='+manifest.snapshot;
 const response=await worker.fetch(new Request(endpoint),{
  DB:db,EDITORIAL_DEFAULTS_PREVIEW:'enabled'
 },{});
 assert.equal(response.status,200);
 const payload=await response.json();
 assert.equal(payload.sha256,manifest.digest);
 assert.equal(payload.records.length,manifest.records.length);
 assert.ok(db.queries.every(q=>/^\s*SELECT\b/i.test(q)));
});
