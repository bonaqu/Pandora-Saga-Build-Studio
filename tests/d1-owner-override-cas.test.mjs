import test from 'node:test';
import assert from 'node:assert/strict';
import worker from '../worker/index.js';

const token='x'.repeat(43);
const domain='https://ps-build-studio-cloud.bonaqu.workers.dev';
const key='itemdesc.123';
const lockData=()=>({
 values:new Map(),
 prepare(sql){
  let args=[];
  return {
   bind(...values){args=values;return this},
   async first(){return{id:1}},
   async run(){
    if(sql.includes('ON CONFLICT(key) DO NOTHING')){
     const [key,value]=args;
     if(lock.values.has(key))return{meta:{changes:0}};
     lock.values.set(key,value);return{meta:{changes:1}};
    }
    if(sql.startsWith('UPDATE overrides SET value=')){
     const [value,_now,key,expected]=args;
     if(lock.values.get(key)!==expected||!lock.values.has(key))
      return{meta:{changes:0}};
     lock.values.set(key,value);return{meta:{changes:1}};
    }
    if(sql.startsWith('DELETE FROM overrides WHERE key=? AND value=?')){
     const [key,expected]=args;
     if(lock.values.get(key)!==expected||!lock.values.has(key))
      return{meta:{changes:0}};
     lock.values.delete(key);return{meta:{changes:1}};
    }
    if(sql.includes('INSERT INTO overrides')){
     const [key,value]=args;
     lock.values.set(key,value);return{meta:{changes:1}};
    }
    if(sql.startsWith('DELETE FROM overrides')){
     const [key]=args,exists=lock.values.delete(key);
     return{meta:{changes:exists?1:0}};
    }
    throw Error('Unexpected SQL '+sql);
   }
  };
 }
});
let lock;
const env=()=>({DB:(lock=lockData())});
const send=async (env,path,body,auth=token)=>{
 const response=await worker.fetch(new Request(domain+path,{
  method:'POST',headers:{Origin:'https://bonaqu.github.io',
   Authorization:'Bearer '+auth,'Content-Type':'application/json'},
  body:JSON.stringify(body)
 }),env);
 return{status:response.status,body:await response.json()};
};
const edit=(env,value,expectedValue)=>send(env,'/api/admin/override',{key,value,expectedValue});
const reset=(env,expectedValue)=>send(env,'/api/admin/reset',{key,expectedValue});

test('new client can atomically create an absent override exactly once',async()=>{
 const cloud=env();
 const [a,b]=await Promise.all([
  edit(cloud,'Owner A',null),edit(cloud,'Owner B',null)
 ]);
 assert.deepEqual([a.status,b.status].sort(),[200,409]);
 assert.equal(cloud.DB===undefined,false);
 assert.equal(lock.values.size,1);
 assert.equal(lock.values.get(key),a.status===200?'Owner A':'Owner B');
 assert.equal((a.status===409?a:b).body.code,'OWNER_EDIT_CONFLICT');
 assert.equal((a.status===200?a:b).body.conditional,true);
});

test('two tabs editing the same original version cannot overwrite one another',async()=>{
 const cloud=env();
 assert.equal((await edit(cloud,'Original',null)).status,200);
 const [a,b]=await Promise.all([
  edit(cloud,'Alice edited','Original'),edit(cloud,'Bob edited','Original')
 ]);
 assert.deepEqual([a.status,b.status].sort(),[200,409]);
 assert.equal(lock.values.get(key),a.status===200?'Alice edited':'Bob edited');
 assert.equal((await edit(cloud,'Next valid change',lock.values.get(key))).status,200);
 assert.equal(lock.values.get(key),'Next valid change');
});

test('reset against a stale version cannot erase a newer value',async()=>{
 const cloud=env();
 await edit(cloud,'First',null);
 await edit(cloud,'Second','First');
 const rejected=await reset(cloud,'First');
 assert.equal(rejected.status,409);
 assert.equal(rejected.body.code,'OWNER_EDIT_CONFLICT');
 assert.equal(lock.values.get(key),'Second');
 const accepted=await reset(cloud,'Second');
 assert.equal(accepted.status,200);
 assert.equal(accepted.body.deleted,true);
 assert.equal(accepted.body.conditional,true);
 assert.equal(lock.values.has(key),false);
 assert.equal((await reset(cloud,'Second')).status,409,
  'Repeated undo cannot delete a newly recreated record');
});

test('another tab changing the row between reset and write causes an explicit conflict',async()=>{
 const cloud=env();
 await edit(cloud,'Initial',null);
 const [a,b]=await Promise.all([
  reset(cloud,'Initial'),
  edit(cloud,'Edit after reset','Initial')
 ]);
 assert.deepEqual([a.status,b.status].sort(),[200,409]);
 if(a.status===200)assert.equal(lock.values.has(key),false);
 else assert.equal(lock.values.get(key),'Edit after reset');
});

test('stale browser clients cannot overwrite or reset a newer D1 record',async()=>{
 const cloud=env();
 assert.equal((await edit(cloud,'Protected change',null)).status,200);
 const put=value=>send(cloud,'/api/admin/override',{key,value});
 const deleted=()=>send(cloud,'/api/admin/reset',{key});
 for(const operation of [put('Old cached tab'),deleted()]){
  const result=await operation;
  assert.equal(result.status,428);
  assert.equal(result.body.code,'OWNER_CLIENT_UPDATE_REQUIRED');
 }
 assert.equal(lock.values.get(key),'Protected change');
 assert.equal((await edit(cloud,'Modern save','Protected change')).status,200);
 assert.equal((await reset(cloud,'Modern save')).status,200);
 assert.equal(lock.values.has(key),false);
});

test('untrusted preconditions and credentials fail closed without D1 mutations',async()=>{
 const cloud=env();
 for(const value of [42,false,{},[], 'X'.repeat(24001)]){
  const result=await edit(cloud,'Payload',value);
  assert.equal(result.status,400);
 }
 for(const value of [null,3,{},'X'.repeat(24001)]){
  const result=await reset(cloud,value);
  assert.equal(result.status,400);
 }
 const unauthorized=await send(cloud,'/api/admin/override',
  {key,value:'Should not exist',expectedValue:null},'invalid');
 assert.equal(unauthorized.status,401);
 assert.equal(lock.values.size,0);
});

test('runtime capabilities explicitly advertise compare-and-set support',async()=>{
 const response=await worker.fetch(new Request(domain+'/api/runtime-capabilities'),env());
 assert.equal(response.status,200);
 const capability=await response.json();
 assert.equal(capability.ownerOverrideCAS,true);
 assert.equal(capability.ownerOverrideCASRequired,true);
});
