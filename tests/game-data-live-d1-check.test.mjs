import test from 'node:test';
import assert from 'node:assert/strict';
import worker from '../worker/index.js';
const BASE='https://ps-build-studio-cloud.bonaqu.workers.dev';
const KEY='u'.repeat(43);
const request=(authenticated=true)=>new Request(BASE+'/api/admin/catalog/test-write',{
 method:'POST',headers:{Origin:'https://bonaqu.github.io',
  ...(authenticated?{Authorization:'Bearer '+KEY}:{})},
 body:'{}'
});
function ephemeralDatabase({cleanupChanges=1}={}){
 const data=new Map(),operations=[];
 return {
  operations,data,
  prepare(sql){
   const args=[];
   const query={
    bind(...values){args.push(...values);return this},
    async first(){
     if(sql.includes('FROM sessions'))return {id:1};
     if(sql.startsWith('SELECT payload FROM catalog_entries')){
      const [snapshot,dataset,key]=args;
      return {payload:data.get(snapshot+':'+dataset+':'+key)};
     }
     throw Error('Unexpected SELECT '+sql);
    },
    async run(){
     operations.push(sql.split(' ')[0]);
     if(sql.startsWith('INSERT INTO catalog_entries')){
      const [snapshot,dataset,key,,,,,payload]=args;
      data.set(snapshot+':'+dataset+':'+key,payload);
      return {meta:{changes:1}};
     }
     if(sql.startsWith('DELETE FROM catalog_entries')){
      const [snapshot,dataset]=args;
      for(const key of data.keys())if(key.startsWith(snapshot+':'+dataset+':'))data.delete(key);
      return {meta:{changes:cleanupChanges}};
     }
     throw Error('Unexpected write '+sql);
    }
   };
   return query;
  }
 };
}
test('temporary production D1 write/read/delete leaves no active catalog or player changes',async()=>{
 const db=ephemeralDatabase();
 const response=await worker.fetch(request(),{DB:db});
 assert.equal(response.status,200);
 assert.deepEqual(await response.json(),{
  ok:true,readback:true,cleaned:true,activeCatalogUnchanged:true
 });
 assert.deepEqual(db.operations,['INSERT','DELETE']);
 assert.equal(db.data.size,0);
});
test('write check refuses anonymous callers before database mutation',async()=>{
 const db=ephemeralDatabase();
 const response=await worker.fetch(request(false),{DB:db});
 assert.equal(response.status,401);
 assert.deepEqual(db.operations,[]);
});
test('cleanup errors do not produce a false-positive D1 verification',async()=>{
 const db=ephemeralDatabase({cleanupChanges:0});
 const response=await worker.fetch(request(),{DB:db});
 assert.equal(response.status,502);
 assert.deepEqual(db.operations,['INSERT','DELETE']);
});
