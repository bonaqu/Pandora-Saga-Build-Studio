import test from 'node:test';
import assert from 'node:assert/strict';
import worker from '../worker/index.js';

const origin='https://bonaqu.github.io';
const workerUrl='https://ps-build-studio-cloud.bonaqu.workers.dev';
const key='chestedit.123';
const token='a'.repeat(43);
function mockD1(){
 const values=new Map(),writes=[];
 const DB={prepare(sql){
  let parameters=[];
  return{
   bind(...args){parameters=args;return this},
   async first(){return{id:1}},
   async run(){
    writes.push({sql,parameters});
    if(sql.startsWith('INSERT INTO overrides')&&sql.includes('DO NOTHING')){
     const [id,value]=parameters;
     if(values.has(id))return{meta:{changes:0}};
     values.set(id,value);return{meta:{changes:1}};
    }
    if(sql.startsWith('UPDATE overrides SET value=')){
     const [value,_time,id,old]=parameters;
     if(!values.has(id)||values.get(id)!==old)return{meta:{changes:0}};
     values.set(id,value);return{meta:{changes:1}};
    }
    if(sql.startsWith('DELETE FROM overrides WHERE key=? AND value=?')){
     const [id,expected]=parameters;
     if(!values.has(id)||values.get(id)!==expected)return{meta:{changes:0}};
     values.delete(id);return{meta:{changes:1}};
    }
    if(sql.includes('INSERT INTO overrides')){
     const [id,value]=parameters;values.set(id,value);
     return{meta:{changes:1}};
    }
    throw Error('Unexpected SQL: '+sql);
   }
  };
 }};
 return{DB,values,writes};
}
async function request(env,path,payload,{withLength=true}={}){
 const text=typeof payload==='string'?payload:JSON.stringify(payload);
 const headers={'Origin':origin,'Authorization':'Bearer '+token,
  'Content-Type':'application/json'};
 if(withLength)headers['Content-Length']=String(Buffer.byteLength(text,'utf8'));
 const response=await worker.fetch(new Request(workerUrl+path,{method:'POST',headers,
  body:text}),env);
 return{status:response.status,data:await response.json()};
}
const chest=(groups=16,items=50)=>JSON.stringify(
 Array.from({length:groups},()=>Array.from({length:items},(_,i)=>(
  {i:i+1,n:1,p:20}
 ))));

test('a valid large chest can be updated with its full earlier D1 value',async()=>{
 const db=mockD1(),original=chest(),changed=JSON.stringify(
  JSON.parse(original).map((rows,i)=>i===0?
   rows.map((row,j)=>j===0?{...row,p:30}:row):rows));
 const first={key,value:original,expectedValue:null};
 const update={key,value:changed,expectedValue:original};
 assert.ok(original.length<24000);
 assert.ok(Buffer.byteLength(JSON.stringify(update))>32768,
  'This valid D1 compare-and-set request exceeded the old 32 KiB limit');
 assert.equal((await request(db,'/api/admin/override',first)).status,200);
 const next=await request(db,'/api/admin/override',update);
 assert.equal(next.status,200,JSON.stringify(next.data));
 assert.equal(next.data.conditional,true);
 assert.equal(db.values.get(key),changed);
});

test('Undo of a large chest uses the same bounded body path as Save',async()=>{
 const db=mockD1(),original=chest();
 assert.ok(Buffer.byteLength(JSON.stringify({key,expectedValue:original}))>8192,
  'This Undo request exceeded the old default parser limit');
 assert.equal((await request(db,'/api/admin/override',
  {key,value:original,expectedValue:null})).status,200);
 const result=await request(db,'/api/admin/reset',{key,expectedValue:original});
 assert.equal(result.status,200,JSON.stringify(result.data));
 assert.equal(result.data.deleted,true);
 assert.equal(db.values.has(key),false);
});

test('UTF-8 lengths are enforced by reading the body even without Content-Length',async()=>{
 const db=mockD1();
 const huge='🛡'.repeat(105000);
 const response=await request(db,'/api/admin/override',
  {key:'itemdesc.1',value:huge,expectedValue:null},{withLength:false});
 assert.equal(response.status,400);
 assert.equal(db.writes.length,0,
  'Invalid large streams may not reach a D1 mutation');
});

test('an oversized Content-Length is rejected before reading and causes no writes',async()=>{
 const db=mockD1();
 const json=JSON.stringify({key,value:'irrelevant',expectedValue:null});
 const requestBody=new Request(workerUrl+'/api/admin/override',{
  method:'POST',headers:{Origin:origin,Authorization:'Bearer '+token,
   'Content-Length':'9999999','Content-Type':'application/json'},body:json
 });
 const response=await worker.fetch(requestBody,db);
 assert.equal(response.status,400);
 assert.equal(db.writes.length,0);
});

test('corrupted JSON and an invalid precondition cannot mutate D1',async()=>{
 const db=mockD1();
 const invalid=await request(db,'/api/admin/reset','{"key":', {withLength:false});
 assert.equal(invalid.status,400);
 const invalidPrecondition=await request(db,'/api/admin/reset',{
  key,expectedValue:{payload:'not a string'}
 });
 assert.equal(invalidPrecondition.status,400);
 assert.equal(db.writes.length,0);
});

test('legacy small owner override is rejected without touching D1',async()=>{
 const db=mockD1();
 const response=await request(db,'/api/admin/override',
  {key:'itemdesc.1',value:'Small edit'});
 assert.equal(response.status,428,JSON.stringify(response.data));
 assert.equal(response.data.code,'OWNER_CLIENT_UPDATE_REQUIRED');
 assert.equal(db.values.size,0);
 assert.equal(db.writes.length,0);
});
