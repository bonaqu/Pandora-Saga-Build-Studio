import test from 'node:test';
import assert from 'node:assert/strict';
import {createHash} from 'node:crypto';
import worker from '../worker/index.js';
const sha=value=>createHash('sha256').update(value).digest('base64url');
const token='a'.repeat(43),guest='f'.repeat(64),different='e'.repeat(64);
const id='1'.repeat(32),bad='2'.repeat(32),deleted='3'.repeat(32);
const good={id,name:'Old guest hero',at:171,data:{race:1,job:16,level:55}};
function mockDb(){
 const reads=[],writes=[],rows=[
  {build_id:id,payload:JSON.stringify(good),deleted_at:null},
  {build_id:bad,payload:'{invalid JSON',deleted_at:null},
  {build_id:deleted,payload:'{}',deleted_at:123}
 ];
 return {reads,writes,prepare(sql){
  if(sql.startsWith('SELECT a.id,a.username,a.owner_hash FROM user_accounts'))
   return {bind(hash){return{first:async()=>hash===sha(token)?
    {id:'test',username:'player_1',owner_hash:sha(token)}:null}}};
  if(sql.includes("FROM sqlite_master"))
   return {all:async()=>({results:[{name:'private_builds'}]})};
  if(sql.startsWith('SELECT build_id,payload,deleted_at FROM private_builds'))
   return {bind(owner){return{all:async()=>{
    reads.push(owner);
    return{results:owner===sha(guest)?rows:[]};
   }}}};
  writes.push(sql);
  throw Error('Unexpected query '+sql);
 }};
}
function request({key=guest,bearer=token,method='POST'}={}){
 return new Request('https://ps-build-studio-cloud.bonaqu.workers.dev/api/library/legacy-preview',{
  method,headers:{Origin:'https://bonaqu.github.io',
   ...(bearer?{Authorization:'Bearer '+bearer}:{}),
   'Content-Type':'application/json'},
  ...(method==='POST'?{body:JSON.stringify({legacyKey:key})}:{})
 });
}
test('the preview requires real account login, denies legacy and absent bearer',async()=>{
 const DB=mockDb();
 assert.equal((await worker.fetch(request({bearer:null}),{DB})).status,401);
 assert.equal((await worker.fetch(request({bearer:guest}),{DB})).status,401);
 assert.equal((await worker.fetch(request({key:'bad'}),{DB})).status,400);
 assert.equal((await worker.fetch(request({method:'GET'}),{DB})).status,401,
  'An anonymous legacy preview request must require an account before method checks');
 assert.equal((await worker.fetch(request({method:'GET',bearer:guest}),{DB})).status,401);
 assert.equal((await worker.fetch(request({method:'GET',bearer:token}),{DB})).status,405,
  'An authenticated caller still cannot use unsupported GET previews');
 assert.deepEqual(DB.reads,[]);
 assert.deepEqual(DB.writes,[]);
});
test('signed-in preview reads only the requested legacy owner and preserves malformed rows',async()=>{
 const DB=mockDb();
 const response=await worker.fetch(request(),{DB});
 assert.equal(response.status,200,await response.clone().text());
 const body=await response.json();
 assert.deepEqual(body.records,[
  {id,deleted:false,entry:good},
  {id:bad,deleted:false,entry:null,unavailable:true},
  {id:deleted,deleted:true,entry:null}
 ]);
 assert.equal(JSON.stringify(body).includes('{invalid JSON'),false,
  'Corrupted D1 payload must never be exposed');
 assert.deepEqual(DB.reads,[sha(guest)]);
 assert.deepEqual(DB.writes,[],'Preview is always read-only');
 const other=await worker.fetch(request({key:different}),{DB});
 assert.equal(other.status,200);
 assert.deepEqual((await other.json()).records,[]);
 assert.deepEqual(DB.reads,[sha(guest),sha(different)]);
});
