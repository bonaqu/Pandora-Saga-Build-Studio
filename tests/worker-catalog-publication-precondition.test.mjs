import test from 'node:test';
import assert from 'node:assert/strict';
import {readFileSync} from 'node:fs';
import worker from '../worker/index.js';
import {readPublishedCatalog} from '../worker/pandora-studio-catalog-cache.js';

// A stale authenticated editor must not publish a catalog over a newer D1
// snapshot. Rejections occur before touching catalog tables.
const ORIGIN='https://bonaqu.github.io';
const API='https://ps-build-studio-cloud.bonaqu.workers.dev';
const AUTH='Bearer '+'a'.repeat(43);
const post=payload=>new Request(API+'/api/admin/catalog/publish',{
 method:'POST',headers:{Origin:ORIGIN,Authorization:AUTH,
  'Content-Type':'application/json'},body:JSON.stringify(payload)
});
function authOnly(){
 const queries=[];
 return {queries,DB:{prepare(sql){
  queries.push(sql);
  if(sql.includes('SELECT id FROM sessions WHERE token_hash'))
   return {bind(){return this},first:async()=>({id:1})};
  throw Error('Catalog must not be read or written without a valid lease: '+sql);
 }}};
}

test('authenticated legacy catalog publisher without expectedActive gets HTTP 428, no D1 writes',async()=>{
 const db=authOnly();
 const response=await worker.fetch(post({snapshot:'ps-review-example'}),{DB:db.DB});
 assert.equal(response.status,428);
 assert.match((await response.json()).error,/Expected active catalog snapshot/);
 assert.equal(db.queries.length,1,'Only admin authentication may query D1');
 assert.equal(response.headers.get('access-control-allow-origin'),ORIGIN);
});

test('invalid publication lease is rejected before D1 snapshot reads',async()=>{
 for(const expectedActive of ['../../../wrong',21,false,{},'']){
  const db=authOnly();
  const response=await worker.fetch(
   post({snapshot:'ps-review-example',expectedActive}),{DB:db.DB});
  assert.equal(response.status,400,JSON.stringify(expectedActive));
  assert.match((await response.json()).error,/Invalid expected snapshot/);
  assert.equal(db.queries.length,1);
 }
});

test('explicit null initial lease is a valid request and reaches catalog meta validation',async()=>{
 const queries=[];
 const DB={prepare(sql){
  queries.push(sql);
  if(sql.includes('SELECT id FROM sessions WHERE token_hash'))
   return {bind(){return this},first:async()=>({id:1})};
  if(sql.includes("dataset='meta'")&&sql.includes('SELECT payload'))
   return {bind(){return this},first:async()=>null};
  throw Error('Unexpected SQL: '+sql);
 }};
 const response=await worker.fetch(post({
  snapshot:'ps-review-example',expectedActive:null
 }),{DB});
 assert.equal(response.status,409);
 assert.match((await response.json()).error,/Meta snapshot missing/);
 assert.equal(queries.length,2,'No catalog pointer may be written for incomplete snapshots');
});

test('approved Pages origin can read both D1 provenance and snapshot headers',async()=>{
 const queries=[];
 const DB={prepare(sql){
  queries.push(sql);
  if(sql.includes('FROM catalog_current'))
   return {first:async()=>({snapshot:'ps-published-example',expected_counts:'{}',published_at:1})};
  if(sql.includes('SELECT record_key,payload FROM catalog_entries'))
   return {bind(){return this},all:async()=>({results:[
    {record_key:'all',payload:JSON.stringify({counts:{monsters:702}})}
   ]})};
  throw Error('Unexpected SQL '+sql);
 }};
 const request=new Request(API+'/api/catalog/meta.json',{headers:{Origin:ORIGIN}});
 const response=await worker.fetch(request,{DB});
 assert.equal(response.status,200);
 assert.equal(response.headers.get('x-ps-catalog'),'d1');
 assert.equal(response.headers.get('x-ps-catalog-snapshot'),'ps-published-example');
 assert.equal(response.headers.get('cache-control'),'no-store',
  'Browser/outer CDN must never bypass D1 pointer validation on future requests');
 const exposed=response.headers.get('access-control-expose-headers')||'';
 assert.match(exposed,/X-PS-Catalog-Snapshot/i);
 assert.match(exposed,/(?:^|,)\s*X-PS-Catalog\s*(?:,|$)/i);
 assert.equal(response.headers.get('access-control-allow-origin'),ORIGIN);
 assert.equal(queries.length,2);
});

test('read-only capabilities disclose required catalog precondition',async()=>{
 const response=await worker.fetch(new Request(API+'/api/runtime-capabilities'),{
  DB:{prepare(){throw Error('Capabilities must not query D1')}}
 });
 assert.equal(response.status,200);
 const flags=await response.json();
 assert.equal(flags.codeRelease,'0.361.0');
 assert.equal(flags.catalogPublishCASRequired,true);
 assert.equal(flags.catalogProvenanceCors,true);
 assert.equal(flags.catalogSnapshotCache,true);
});

test('same published D1 snapshot avoids repeated large dataset SQL reads',async()=>{
 const store=new Map(),writes=[];
 const cache={
  match:async key=>store.get(key.url)?.clone(),
  put:async(key,response)=>{writes.push(key.url);store.set(key.url,response.clone())}
 };
 let loads=0;
 const load=snapshot=>async()=>{
  loads++;
  return new Response(JSON.stringify({items:['d1-'+snapshot],loads}),{
   headers:{'cache-control':'public, max-age=60','x-ps-catalog':'d1',
    'x-ps-catalog-snapshot':snapshot}
  });
 };
 const snapshot='ps-snapshot-a',dataset='items';
 const first=await readPublishedCatalog({snapshot,dataset,cache,load:load(snapshot)});
 assert.equal(first.headers.get('cache-control'),'no-store');
 assert.equal((await first.json()).loads,1);
 const again=await readPublishedCatalog({snapshot,dataset,cache,load:load(snapshot)});
 assert.equal(again.headers.get('cache-control'),'no-store',
  'Even a Cache API hit must not let Cloudflare skip the Worker on the next GET');
 assert.equal((await again.json()).loads,1);
 assert.equal(loads,1,'D1 payload rows must only be read once for a cached snapshot');
 assert.equal(writes.length,1);
 assert.equal(store.get(writes[0]).headers.get('cache-control'),'public, max-age=60',
  'Only the internal synthetic Cache API response may have a TTL');
 const latest='ps-snapshot-b';
 const changed=await readPublishedCatalog({snapshot:latest,dataset,cache,load:load(latest)});
 assert.equal(changed.headers.get('cache-control'),'no-store');
 assert.equal((await changed.json()).loads,2);
 assert.equal(loads,2,'A newly published D1 pointer must use a fresh cache key');
 assert.notEqual(writes[0],writes[1]);
});

test('untrusted cache, failed storage and temporary cache failure never weaken D1 provenance',async()=>{
 const snapshot='ps-snapshot-c',dataset='meta';
 let reads=0;
 const valid=()=>{reads++;
  return new Response(JSON.stringify({from:'d1'}),{
   headers:{'cache-control':'public, max-age=60','x-ps-catalog':'d1',
    'x-ps-catalog-snapshot':snapshot}
  });
 };
 const cache={
  match:async()=>new Response('untrusted',{headers:{
   'x-ps-catalog':'archive','x-ps-catalog-snapshot':snapshot}}),
  put:async()=>{throw Error('Cache storage offline')}
 };
 const response=await readPublishedCatalog({snapshot,dataset,cache,load:valid});
 assert.equal(response.headers.get('cache-control'),'no-store');
 assert.equal((await response.json()).from,'d1');
 assert.equal(reads,1,'An archive-shaped cache result must not be served');
 const unavailableCache={match:async()=>{throw Error('Cache down')},put:async()=>{}};
 const again=await readPublishedCatalog({snapshot,dataset,cache:unavailableCache,load:valid});
 assert.equal((await again.json()).from,'d1');
 assert.equal(reads,2);
 const bad=await readPublishedCatalog({snapshot,dataset,
  cache:{match:async()=>null,put:async()=>{throw Error('Must not cache a 503')}},
  load:async()=>new Response('D1 unavailable',{status:503})});
 assert.equal(bad.status,503,'D1 outage may never be replaced by archived or stale JSON');
});

test('live Worker requires a readable D1 pointer before any catalog cache lookup',async()=>{
 const source=readFileSync(new URL('../worker/index.js',import.meta.url),'utf8');
 const section=source.slice(source.indexOf('async function serveCatalog('),
  source.indexOf('async function adminCatalog('));
 assert.match(section,/const active=await activeCatalog\(env\)/);
 assert.ok(section.indexOf('const active=await activeCatalog(env)')<
  section.indexOf('return readPublishedCatalog('));
 assert.match(section,/cache:globalThis\.caches\?\.default/);
 assert.match(section,/'cache-control':'no-store'/);
 assert.match(section,/if\(!active\)return no\('Catalog not published in D1 yet',503\)/);
 let pointerReads=0;
 const DB={prepare(sql){
  assert.match(sql,/FROM catalog_current/);
  pointerReads++;
  return {first:async()=>null};
 }};
 const response=await worker.fetch(new Request(API+'/api/catalog/items.json'),{DB});
 assert.equal(response.status,503);
 assert.equal(pointerReads,1);
});

test('admin batches may stage a NEW D1 snapshot but never edit the published one in place',async()=>{
 const records=[{key:'example',value:{name:'Valid staged item'}}];
 const request=snapshot=>new Request(API+'/api/admin/catalog/batch',{
  method:'POST',headers:{Origin:ORIGIN,Authorization:AUTH,
   'Content-Type':'application/json'},
  body:JSON.stringify({snapshot,dataset:'items',records})
 });
 const mock=active=>{
  const queries=[],DB={
   prepare(sql){
    queries.push(sql);
    if(sql.includes('SELECT id FROM sessions WHERE token_hash'))
     return {bind(){return this},first:async()=>({id:1})};
    if(sql.includes('SELECT id FROM catalog_current WHERE id=1 AND snapshot=?'))
     return {bind(){return this},first:async()=>active?{id:1}:null};
    if(sql.startsWith('INSERT INTO catalog_entries'))
     return {bind(){return this}};
    throw Error('Unexpected SQL '+sql);
   },
   batch:async statements=>statements.map(()=>({meta:{changes:1}}))
  };
  return {DB,queries};
 };
 const published=mock(true);
 const denied=await worker.fetch(request('ps-published-immutable'),{DB:published.DB});
 assert.equal(denied.status,409);
 assert.match((await denied.json()).error,/Published catalog snapshot is immutable/);
 assert.equal(published.queries.filter(q=>q.startsWith('INSERT INTO catalog_entries')).length,0,
  'Even an admin cannot change an already live D1 dataset without publishing a new pointer');
 const fresh=mock(false);
 const permitted=await worker.fetch(request('ps-new-safe-snapshot'),{DB:fresh.DB});
 assert.equal(permitted.status,200);
 assert.equal((await permitted.json()).received,1);
 assert.equal(fresh.queries.filter(q=>q.startsWith('INSERT INTO catalog_entries')).length,1);
 const sql=fresh.queries.find(q=>q.startsWith('INSERT INTO catalog_entries'));
 assert.match(sql,/SELECT \?,\?,\?,\?,\?,\?,\?,\?/);
 assert.match(sql,/WHERE NOT EXISTS \(SELECT 1 FROM catalog_current WHERE id=1 AND snapshot=\?\)/);
 assert.match(sql,/ON CONFLICT\(snapshot,dataset,record_key\) DO UPDATE/);
 // A concurrent publish after the preflight SELECT but before SQLite
 // executes the guarded batch must produce 0 changes and HTTP 409.
 const raced=mock(false);
 raced.DB.batch=async()=>[{meta:{changes:0}}];
 const rejected=await worker.fetch(request('ps-new-safe-snapshot'),{DB:raced.DB});
 assert.equal(rejected.status,409);
 assert.match((await rejected.json()).error,/Catalog published during batch/);
});
