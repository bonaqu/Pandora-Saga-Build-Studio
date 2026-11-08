import test from 'node:test';
import assert from 'node:assert/strict';
import worker from '../worker/index.js';

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
 const exposed=response.headers.get('access-control-expose-headers')||'';
 assert.match(exposed,/X-PS-Catalog-Snapshot/i);
 assert.match(exposed,/(?:^|,)\s*X-PS-Catalog\s*(?:,|$)/i);
 assert.equal(response.headers.get('access-control-allow-origin'),ORIGIN);
 assert.equal(queries.length,2);
});

test('read-only capabilities disclose required catalog precondition',async()=>{
 const response=await worker.fetch(new Request(API+'/api/runtime-capabilities'),{});
 assert.equal(response.status,200);
 const flags=await response.json();
 assert.equal(flags.codeRelease,'0.361.0');
 assert.equal(flags.catalogPublishCASRequired,true);
 assert.equal(flags.catalogProvenanceCors,true);
});
