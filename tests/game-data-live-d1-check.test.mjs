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
function ephemeralDatabase({cleanupChanges=1,overrideCleanupChanges=1,
 changedPublished=false,badOverrideReadback=false,failOverrideInsert=false}={}){
 const catalog=new Map(),overrides=new Map([['item.123','Existing owner value']]);
 const operations=[];
 let publishedReads=0;
 return {
  operations,catalog,overrides,
  prepare(sql){
   const args=[];
   return {
    bind(...values){args.push(...values);return this},
    async first(){
     if(sql.includes('FROM sessions'))return {id:1};
     if(sql.startsWith('SELECT snapshot,published_at,expected_counts FROM catalog_current')){
      const snapshot=changedPublished&&publishedReads++?'published-new':'published-a';
      return {snapshot,published_at:1,expected_counts:'{}'};
     }
     if(sql.startsWith('SELECT payload FROM catalog_entries')){
      const [snapshot,dataset,key]=args;
      return {payload:catalog.get(snapshot+':'+dataset+':'+key)};
     }
     if(sql.startsWith('SELECT value FROM overrides WHERE key=?'))
      return {value:badOverrideReadback?'stale':overrides.get(args[0])};
     throw Error('Unexpected SELECT '+sql);
    },
    async all(){
     if(sql.startsWith('SELECT key,value FROM overrides'))
      return {results:[...overrides].map(([key,value])=>({key,value}))};
     throw Error('Unexpected SELECT '+sql);
    },
    async run(){
     operations.push(sql.split(' ')[0]+' '+(sql.includes('catalog_entries')?'catalog':'overrides'));
     if(sql.startsWith('INSERT INTO catalog_entries')){
      const [snapshot,dataset,key,,,,,payload]=args;
      catalog.set(snapshot+':'+dataset+':'+key,payload);
      return {meta:{changes:1}};
     }
     if(sql.startsWith('DELETE FROM catalog_entries')){
      const [snapshot,dataset,key]=args;
      catalog.delete(snapshot+':'+dataset+':'+key);
      return {meta:{changes:cleanupChanges}};
     }
     if(sql.startsWith('INSERT INTO overrides')){
      if(failOverrideInsert)throw Error('Simulated override insertion failure');
      overrides.set(args[0],args[1]);
      return {meta:{changes:1}};
     }
     if(sql.startsWith('DELETE FROM overrides')){
      overrides.delete(args[0]);
      return {meta:{changes:overrideCleanupChanges}};
     }
     throw Error('Unexpected write '+sql);
    }
   };
  }
 };
}

test('temporary authenticated D1 check covers catalog and inline admin overrides',async()=>{
 const db=ephemeralDatabase();
 const response=await worker.fetch(request(),{DB:db});
 assert.equal(response.status,200);
 assert.deepEqual(await response.json(),{
  ok:true,readback:true,cleaned:true,overrideReadback:true,
  overrideCleaned:true,activeCatalogUnchanged:true
 });
 assert.deepEqual(db.operations,['INSERT catalog','INSERT overrides','DELETE overrides','DELETE catalog']);
 assert.equal(db.catalog.size,0);
 assert.deepEqual([...db.overrides],[['item.123','Existing owner value']]);
});

test('write check refuses anonymous callers before database mutation',async()=>{
 const db=ephemeralDatabase();
 const response=await worker.fetch(request(false),{DB:db});
 assert.equal(response.status,401);
 assert.deepEqual(db.operations,[]);
});

test('D1 check does not succeed on lost readback, failed cleanup or changed published snapshot',async()=>{
 for(const options of [
  {cleanupChanges:0},{overrideCleanupChanges:0},
  {changedPublished:true},{badOverrideReadback:true}
 ]){
  const db=ephemeralDatabase(options);
  const response=await worker.fetch(request(),{DB:db});
  assert.equal(response.status,502,JSON.stringify(options));
  assert.equal(db.catalog.size,0);
  assert.deepEqual([...db.overrides],[['item.123','Existing owner value']]);
 }
});

test('failed admin override insert still cleans isolated catalog snapshot',async()=>{
 const db=ephemeralDatabase({failOverrideInsert:true});
 const response=await worker.fetch(request(),{DB:db});
 assert.equal(response.status,500);
 assert.deepEqual(db.operations,['INSERT catalog','INSERT overrides','DELETE catalog']);
 assert.equal(db.catalog.size,0);
 assert.deepEqual([...db.overrides],[['item.123','Existing owner value']]);
});

test('transient QA keys are excluded from public overrides',async()=>{
 const db=ephemeralDatabase();
 db.overrides.set('__qa.testing','Temporary debug');
 const response=await worker.fetch(new Request(BASE+'/api/overrides',{
  headers:{Origin:'https://bonaqu.github.io'}}),{DB:db});
 assert.equal(response.status,200);
 assert.deepEqual((await response.json()).values,{'item.123':'Existing owner value'});
});
