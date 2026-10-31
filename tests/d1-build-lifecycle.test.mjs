import test from 'node:test';
import assert from 'node:assert/strict';
import {readFileSync} from 'node:fs';
import worker from '../worker/index.js';

const key='a'.repeat(64),other='b'.repeat(64);
const ORIGIN='https://bonaqu.github.io';
function database(){
 const rows=new Map();
 return {prepare(sql){
  if(sql.includes('FROM sqlite_master'))return {all:async()=>({
   results:sql.includes("name='shared_build_sources'")?[]:[{name:'private_builds'}]
  })};
  if(sql.startsWith('SELECT build_id,payload,deleted_at FROM'))return{bind(owner){
   return{all:async()=>({results:[...rows.entries()].filter(([k])=>k.startsWith(owner+':')).map(([,v])=>v)})};
  }};
  if(sql.startsWith('SELECT build_id,deleted_at FROM'))return{bind(owner,id){
   return{first:async()=>rows.get(owner+':'+id)||null};
  }};
  if(sql.startsWith('SELECT COUNT(*) AS total'))return{bind(owner){
   return{first:async()=>({total:[...rows.keys()].filter(k=>k.startsWith(owner+':')).length})};
  }};
  if(sql.startsWith('SELECT deleted_at FROM private_builds'))return{bind(owner,id){
   return{first:async()=>{const row=rows.get(owner+':'+id);return row?{deleted_at:row.deleted_at}:null}};
  }};
  if(sql.startsWith('INSERT INTO private_builds')){
   const deleting=sql.includes("VALUES(?,?,'{}'");
   return{bind(...values){
    return{run:async()=>{
     if(deleting){
      const [owner,id,time,deletedAt]=values;
      rows.set(owner+':'+id,{build_id:id,payload:'{}',updated_at:time,deleted_at:deletedAt});
     }else{
      const [owner,id,payload,time]=values;
      const previous=rows.get(owner+':'+id);
      if(previous&&(previous.deleted_at!==null||
        Number(JSON.parse(previous.payload).at)>time))return{meta:{changes:0}};
      rows.set(owner+':'+id,{build_id:id,payload,updated_at:time,deleted_at:null});
     }
     return{meta:{changes:1}};
    }};
   }};
  }
  throw Error('Unexpected SQL '+sql);
 }};
}
function request(method,body,token=key){
 return new Request('https://ps-build-studio-cloud.bonaqu.workers.dev/api/library',{
  method,headers:{Origin:ORIGIN,Authorization:'Bearer '+token,'Content-Type':'application/json'},
  ...(body?{body:JSON.stringify(body)}:{})
 });
}
test('private D1 library save/list/delete/reload keeps records isolated by browser secret',async()=>{
 const DB=database(),entry={id:'a'.repeat(32),name:'Future 55',at:Date.now(),
  data:{race:3,job:0,level:55,points:{slash:90},equipment:{}}};
 const saved=await worker.fetch(request('POST',{action:'put',entry}),{DB});
 assert.equal(saved.status,200,await saved.text());
 const first=await worker.fetch(request('GET'),{DB});
 assert.equal(first.status,200);
 assert.equal(first.headers.get('access-control-allow-origin'),ORIGIN);
 assert.deepEqual((await first.json()).records[0].entry,entry);
 const foreign=await worker.fetch(request('GET',null,other),{DB});
 assert.deepEqual((await foreign.json()).records,[]);
 const removed=await worker.fetch(request('POST',{action:'delete',id:entry.id}),{DB});
 assert.equal(removed.status,200);
 const listing=await worker.fetch(request('GET'),{DB});
 assert.deepEqual((await listing.json()).records,[{id:entry.id,deleted:true,entry:null}]);
});
test('D1 library rejects invalid levels, IDs and tokens',async()=>{
 const DB=database(),entry={id:'a'.repeat(32),name:'No',at:100,
  data:{race:0,job:1,level:56}};
 assert.equal((await worker.fetch(request('POST',{action:'put',entry}),{DB})).status,400);
 assert.equal((await worker.fetch(request('GET',null,'bad'),{DB})).status,401);
 assert.equal((await worker.fetch(request('POST',{action:'delete',id:'../../'}),{DB})).status,400);
});

test('deleted tombstones cannot push older active builds outside a 250-record window',async()=>{
 const DB=database(),liveId='f'.repeat(32);
 const source=readFileSync(new URL('../worker/index.js',import.meta.url),'utf8');
 assert.match(source,/ORDER BY \(deleted_at IS NOT NULL\), updated_at DESC/);
 assert.doesNotMatch(source,/FROM private_builds WHERE owner_hash=\? ORDER BY updated_at DESC LIMIT 250/);
 const entry={id:liveId,name:'Old but active',at:1,data:{race:1,job:0,level:55}};
 assert.equal((await worker.fetch(request('POST',{action:'put',entry}),{DB})).status,200);
 for(let i=0;i<275;i++){
  const id=i.toString(16).padStart(32,'0');
  assert.equal((await worker.fetch(request('POST',{action:'delete',id}),{DB})).status,200);
 }
 const result=await worker.fetch(request('GET'),{DB});
 assert.equal(result.status,200);
 const records=(await result.json()).records;
 assert.equal(records.length,276);
 assert.deepEqual(records.find(x=>x.id===liveId)?.entry,entry);
});

test('older and delayed saves cannot overwrite newer versions or resurrect deleted D1 rows',async()=>{
 const DB=database(),id='d'.repeat(32),data={race:1,job:0,level:55};
 const version=at=>({action:'put',entry:{id,name:'Timeline',at,data}});
 assert.equal((await worker.fetch(request('POST',version(100)),{DB})).status,200);
 assert.equal((await worker.fetch(request('POST',version(200)),{DB})).status,200);
 const stale=await worker.fetch(request('POST',version(150)),{DB});
 assert.equal(stale.status,409);assert.equal((await stale.json()).reason,'stale');
 let listing=await worker.fetch(request('GET'),{DB});
 assert.equal((await listing.json()).records.find(x=>x.id===id).entry.at,200);
 assert.equal((await worker.fetch(request('POST',{action:'delete',id}),{DB})).status,200);
 const late=await worker.fetch(request('POST',version(300)),{DB});
 assert.equal(late.status,409);assert.equal((await late.json()).reason,'deleted');
 listing=await worker.fetch(request('GET'),{DB});
 assert.equal((await listing.json()).records.find(x=>x.id===id).deleted,true);
});
