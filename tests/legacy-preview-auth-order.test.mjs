import test from 'node:test';
import assert from 'node:assert/strict';
import worker from '../worker/index.js';

const host='https://ps-build-studio-cloud.bonaqu.workers.dev';
const key='f'.repeat(64),session='a'.repeat(43);
const dbQueries=[];
const DB={prepare(sql){
 dbQueries.push(sql);
 assert.ok(sql.startsWith('SELECT a.id,a.username,a.owner_hash FROM user_accounts'),
  'Authenticated previews must validate the account session');
 return {bind(){return {first:async()=>({id:'test-id',username:'account-user',
  owner_hash:'owner-for-isolated-test'})}}};
}};
function request(method,token,body){
 return new Request(host+'/api/library/legacy-preview',{
  method,
  headers:{Origin:'https://bonaqu.github.io',
   ...(token?{Authorization:'Bearer '+token}:{}),
   ...(body?{'Content-Type':'application/json'}:{})},
  ...(body?{body:JSON.stringify(body)}:{})
 });
}
const response=(method,token,body)=>
 worker.fetch(request(method,token,body),{DB});

test('GET legacy preview requires account before method check',async()=>{
 dbQueries.length=0;
 assert.equal((await response('GET')).status,401);
 assert.equal((await response('GET',key)).status,401);
 assert.equal(dbQueries.length,0,'Guests cannot query account data');
 assert.equal((await response('GET',session)).status,405,
  'Signed-in GET remains unsupported by the read-only POST preview');
 assert.equal(dbQueries.length,1);
});
test('POST legacy preview denies guests and requires a valid library code',async()=>{
 dbQueries.length=0;
 assert.equal((await response('POST',null,{legacyKey:key})).status,401);
 assert.equal((await response('POST',key,{legacyKey:key})).status,401);
 assert.equal((await response('POST',session,{legacyKey:'invalid'})).status,400);
 assert.equal(dbQueries.length,1);
});
