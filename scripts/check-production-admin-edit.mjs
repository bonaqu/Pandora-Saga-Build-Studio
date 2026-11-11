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
 // Both sessions and records are generated per invocation. No real admin
 // account, game record or saved player build is read or changed.
 const nonce=randomBytes(14).toString('hex');
 const bearer=randomBytes(32).toString('base64url');
 const secondBearer=randomBytes(32).toString('base64url');
 const sessionHash=createHash('sha256').update(bearer).digest('base64url');
 const secondSessionHash=createHash('sha256').update(secondBearer).digest('base64url');
 const key='guideedit.book.qa.owner-copy-'+nonce;
 const other='guideedit.book.qa.peer-copy-'+nonce;
 const first=JSON.stringify({ru:'Временная QA-надпись',en:'Disposable QA caption'});
 const second=JSON.stringify({ru:'Изменённая QA-надпись',en:'Updated disposable QA caption'});
 const third=JSON.stringify({ru:'Другой ответ QA',en:'Competing disposable QA caption'});
 const peer=JSON.stringify({ru:'Соседняя QA-надпись',en:'Independent QA caption'});
 const expires=Date.now()+300000;
 const sqlKey=escapeSql(key),sqlOther=escapeSql(other);
 const qaCount=()=>query('SELECT COUNT(*) AS count FROM overrides WHERE key IN ('+
  sqlKey+','+sqlOther+')')[0]?.count;
 const readValue=record=>query('SELECT value FROM overrides WHERE key='+escapeSql(record))[0]?.value;
 const assertConflict=(response,context)=>{
  expect(response,409,context);
  assert.equal(response.data?.code,'OWNER_EDIT_CONFLICT',context+' must identify CAS collision');
 };
 console.log('Production D1: isolated dual-session CAS acceptance begins (two disposable captions).');
 try{
  const health=await call('GET','/api/health',null);
  assert.equal(health.status,200,'Production Worker health');
  assert.equal(health.data?.storage,'d1','Expected D1-backed production Worker');
  assert.equal(qaCount(),0,'QA records unexpectedly preexist');
  // Two separate, temporary auth sessions simulate conflicting editor tabs
  // without using or inspecting the owner's credentials.
  query('INSERT INTO sessions(token_hash,expires) VALUES ('+
   escapeSql(sessionHash)+','+expires+')');
  query('INSERT INTO sessions(token_hash,expires) VALUES ('+
   escapeSql(secondSessionHash)+','+expires+')');

  expect(await call('POST','/api/admin/override',bearer,{
   key,value:first,expectedValue:null}),200,'Create editable caption');
  expect(await call('POST','/api/admin/override',secondBearer,{
   key:other,value:peer,expectedValue:null}),200,'Create independent QA caption');
  const publicCopy=expect(await call('GET','/api/overrides',null),
   200,'Public readback of bilingual QA captions');
  assert.equal(publicCopy.values?.[key],first,'RU/EN readback mismatch');
  assert.equal(publicCopy.values?.[other],peer,'Independent readback mismatch');
  assertConflict(await call('POST','/api/admin/override',secondBearer,{
   key,value:second,expectedValue:null}),'Stale create cannot replace existing caption');

  // Both sessions hold the same old value. Exactly one atomic writer wins;
  // the other must receive HTTP 409, with no silent clobber.
  const contenders=await Promise.all([
   call('POST','/api/admin/override',bearer,{key,value:second,expectedValue:first}),
   call('POST','/api/admin/override',secondBearer,{key,value:third,expectedValue:first})
  ]);
  assert.deepEqual(contenders.map(result=>result.status).sort((a,b)=>a-b),[200,409],
   'Exactly one competing editor must win atomic CAS');
  const winner=contenders[0].status===200?second:third;
  const losing=contenders.find(response=>response.status===409);
  assertConflict(losing,'Concurrent stale editor');
  assert.equal(readValue(key),winner,'D1 persisted a value other than the winning edit');
  assert.equal(readValue(other),peer,'Concurrent edit touched independent QA caption');
  const afterRace=expect(await call('GET','/api/overrides',null),
   200,'Readback after concurrent requests');
  assert.equal(afterRace.values?.[key],winner);
  assert.equal(afterRace.values?.[other],peer);

  assertConflict(await call('POST','/api/admin/reset',secondBearer,{
   key,expectedValue:first}),'Stale Undo must not delete winner');
  assertConflict(await call('POST','/api/admin/override',secondBearer,{
   key,value:first,expectedValue:first}),'Stale update must not revert winner');
  expect(await call('POST','/api/admin/override',secondBearer,{
   key,value:first}),428,'Outdated client cannot omit expectedValue');
  assert.equal(readValue(key),winner,'Failed conflict attempts changed saved value');
  assert.equal(readValue(other),peer,'Failed conflict attempts touched other QA key');

  expect(await call('POST','/api/admin/reset',bearer,{
   key,expectedValue:winner}),200,'Undo exact winning value');
  assertConflict(await call('POST','/api/admin/reset',secondBearer,{
   key,expectedValue:winner}),'Repeated stale Undo after reset');
  assert.equal(readValue(other),peer,'Undo changed the independent QA caption');
  expect(await call('POST','/api/admin/reset',secondBearer,{
   key:other,expectedValue:peer}),200,'Reset independent QA caption');
  assertConflict(await call('POST','/api/admin/reset',bearer,{
   key:other,expectedValue:peer}),'Repeated stale independent reset');
  assert.equal(qaCount(),0,'D1 retained a QA caption after both resets');
  const emptyCopy=expect(await call('GET','/api/overrides',null),
   200,'Public readback after reset');
  assert.equal(Object.hasOwn(emptyCopy.values||{},key),false);
  assert.equal(Object.hasOwn(emptyCopy.values||{},other),false);
  console.log('PASS: real D1 create, two sessions, concurrent 200/409 CAS, independent key, Undo and stale reset.');
 }finally{
  // Cleanup owns only two unpredictable QA keys and two temporary hashes.
  // Failed requests are never counted as successful editorial writes.
  let cleaned=false;
  for(let attempt=0;attempt<3&&!cleaned;attempt++){
   try{
    query('DELETE FROM overrides WHERE key='+sqlKey);
    query('DELETE FROM overrides WHERE key='+sqlOther);
    query('DELETE FROM sessions WHERE token_hash='+escapeSql(sessionHash));
    query('DELETE FROM sessions WHERE token_hash='+escapeSql(secondSessionHash));
    assert.equal(qaCount(),0,'Temporary QA overrides remain');
    const sessions=query('SELECT COUNT(*) AS count FROM sessions WHERE token_hash IN ('+
     escapeSql(sessionHash)+','+escapeSql(secondSessionHash)+')');
    assert.equal(sessions[0]?.count,0,'Temporary QA admin sessions remain');
    cleaned=true;
   }catch(error){
    console.error('QA cleanup attempt '+(attempt+1)+' failed; retrying');
   }
  }
  if(!cleaned)throw Error('Production QA cleanup incomplete; inspect only disposable QA namespace');
  console.log('PASS: both D1 QA captions and both temporary sessions removed.');
 }
}
run().catch(error=>{
 console.error('Isolated production D1 admin QA FAILED:',error.message);
 process.exitCode=1;
});
