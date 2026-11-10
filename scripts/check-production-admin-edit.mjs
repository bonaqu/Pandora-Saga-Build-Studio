#!/usr/bin/env node
// Production acceptance for the *actual* admin override API and Cloudflare D1.
// Uses a disposable QA-only session injected with the repository's existing
// Cloudflare service token. Does not know or use the owner's password/token.
// NEVER inspect user accounts, real sessions, saved builds, or catalog records.
// All writes are isolated by a cryptographically random record key/hash.
import {randomBytes,createHash} from 'node:crypto';
import {spawnSync} from 'node:child_process';
import assert from 'node:assert/strict';
import {fileURLToPath} from 'node:url';
import {dirname,resolve} from 'node:path';

const API='https://ps-build-studio-cloud.bonaqu.workers.dev';
const ORIGIN='https://bonaqu.github.io';
const DB_NAME='ps-build-studio-db';
const ACCOUNT='57ac934cd0f0a7f5e8533177d612f893';
const DATABASE='0f8fbcd8-be06-414c-844b-a2091fdf6784';
const workerDir=resolve(dirname(fileURLToPath(import.meta.url)),'../worker');

function ready(){
 assert.equal(process.env.CLOUDFLARE_ACCOUNT_ID,ACCOUNT,
  'Production acceptance requires the exact reviewed Cloudflare account');
 assert.equal(process.env.PS_D1_DATABASE_ID,DATABASE,
  'Production acceptance requires the existing exact D1 UUID');
 assert.ok(process.env.CLOUDFLARE_API_TOKEN,
  'Cloudflare CI token is unavailable; no production writes permitted');
 assert.equal(process.argv.length,3);
 assert.equal(process.argv[2],'--isolated-authorized');
}
function escapeSql(value){return "'"+String(value).replaceAll("'","''")+"'";}
function query(sql){
 const run=spawnSync('npx',['--yes','wrangler@4','d1','execute',DB_NAME,
  '--remote','--json','--command',sql],{
  cwd:workerDir,encoding:'utf8',timeout:75000,maxBuffer:1024*1024,
  env:process.env
 });
 if(run.status!==0)throw Error('Cloudflare D1 QA query failed (no secrets logged)');
 let data;
 try{data=JSON.parse(run.stdout.trim());}
 catch{throw Error('D1 query did not return valid JSON');}
 assert.ok(Array.isArray(data),'Unexpected D1 JSON response');
 const rows=data[0]?.results;
 assert.ok(Array.isArray(rows),'Missing D1 query results');
 return rows;
}
async function call(method,path,bearer,payload){
 const response=await fetch(API+path,{
  method,
  headers:{Origin:ORIGIN,'Content-Type':'application/json',
   ...(bearer?{Authorization:'Bearer '+bearer}:{})},
  ...(payload?{body:JSON.stringify(payload)}:{}),
  signal:AbortSignal.timeout(20000)
 });
 const data=await response.json().catch(()=>null);
 assert.equal(response.headers.get('access-control-allow-origin'),ORIGIN,
  'The production Worker CORS policy does not match Pages');
 return {status:response.status,data};
}
function expect(response,status,context){
 assert.equal(response.status,status,
  context+': HTTP '+response.status+' / expected '+status+
   ' ('+String(response.data?.code||'no-code')+')');
 return response.data;
}
async function run(){
 ready();
 const nonce=randomBytes(14).toString('hex');
 const bearer=randomBytes(32).toString('base64url');
 const sessionHash=createHash('sha256').update(bearer).digest('base64url');
 const key='guideedit.book.qa.owner-copy-'+nonce;
 const first=JSON.stringify({ru:'Временная QA-надпись',en:'Disposable QA caption'});
 const second=JSON.stringify({ru:'Изменённая QA-надпись',en:'Updated disposable QA caption'});
 const expires=Date.now()+180000;
 let hasSession=false;
 console.log('Production admin API / D1: begin isolated create, CAS, readback, reset, cleanup.');
 try{
  const health=await call('GET','/api/health',null);
  assert.equal(health.status,200,'Production Worker health');
  assert.equal(health.data?.storage,'d1','Expected D1-backed production Worker');
  const empty=query('SELECT COUNT(*) AS count FROM overrides WHERE key='+escapeSql(key));
  assert.equal(empty[0].count,0,'QA record already exists unexpectedly');
  // A QA-only session with a random token: the real admin login is not
  // impersonated and no real owner account or session is ever read.
  query('INSERT INTO sessions(token_hash,expires) VALUES ('+
   escapeSql(sessionHash)+','+expires+')');
  hasSession=true;
  expect(await call('POST','/api/admin/override',bearer,{
   key,value:first,expectedValue:null}),200,'Create editorial override');
  const publicCopy=expect(await call('GET','/api/overrides',null),
   200,'Public readback of saved bilingual text');
  assert.equal(publicCopy.values?.[key],first,'Saved RU/EN copy not visible');
  expect(await call('POST','/api/admin/override',bearer,{
   key,value:second,expectedValue:null}),409,'CAS prevents stale replace');
  expect(await call('POST','/api/admin/override',bearer,{
   key,value:second,expectedValue:first}),200,'Update existing editable caption');
  assert.equal(query('SELECT value FROM overrides WHERE key='+escapeSql(key))[0]?.value,
   second,'D1 did not persist the edited caption');
  expect(await call('POST','/api/admin/reset',bearer,{
   key,expectedValue:first}),409,'CAS prevents stale Undo');
  expect(await call('POST','/api/admin/reset',bearer,{
   key,expectedValue:second}),200,'Reset exact edited caption');
  assert.equal(query('SELECT COUNT(*) AS count FROM overrides WHERE key='+
   escapeSql(key))[0]?.count,0,'Reset left an orphaned QA override');
  console.log('PASS: production admin edit, RU/EN readback, CAS conflict, update, Undo/reset.');
 }finally{
  // Clean only our random, disposable QA key and temporary session. Retry
  // both remote DELETEs and prove they are absent, even after API failures.
  let cleaned=false;
  for(let attempt=0;attempt<3&&!cleaned;attempt++){
   try{
    query('DELETE FROM overrides WHERE key='+escapeSql(key));
    if(hasSession)
     query('DELETE FROM sessions WHERE token_hash='+escapeSql(sessionHash));
    const editRows=query('SELECT COUNT(*) AS count FROM overrides WHERE key='+
     escapeSql(key));
    const sessionRows=query('SELECT COUNT(*) AS count FROM sessions WHERE token_hash='+
     escapeSql(sessionHash));
    assert.equal(editRows[0]?.count,0);
    assert.equal(sessionRows[0]?.count,0);
    cleaned=true;
   }catch(error){
    console.error('QA cleanup attempt '+(attempt+1)+' failed; retrying');
   }
  }
  if(!cleaned)throw Error('Production QA cleanup incomplete; inspect only disposable QA namespace');
  console.log('PASS: zero temporary D1 overrides and zero temporary admin sessions remain.');
 }
}
run().catch(error=>{
 console.error('Isolated production D1 admin QA FAILED:',error.message);
 process.exitCode=1;
});
