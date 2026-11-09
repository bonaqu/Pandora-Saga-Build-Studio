import test from 'node:test';
import assert from 'node:assert/strict';
import {readFileSync} from 'node:fs';
import {IDS,EXPECTED_ACTIVE,DATASETS,stageId,publish,validateInstances}
 from '../scripts/publish-six-instance-ru-once.mjs';

const original=JSON.parse(readFileSync(
 new URL('../data/os/instances.json',import.meta.url),'utf8'));
const simple=({blurbRu:_unused,...rest})=>structuredClone(rest);
const seeded=(translated=false)=>original.map(x=>translated?structuredClone(x):simple(x));
const stage=stageId(EXPECTED_ACTIVE,original);

// Simulated Cloudflare D1 REST responses. No real cloud requests, credentials
// or storage writes. Covers the complete production script, not just helpers.
function harness({translated=false,failDataset=null,changeEnglish=false}={}){
 let current=EXPECTED_ACTIVE,writes=0,removed=0,published=0;
 const counts=Object.fromEntries(DATASETS.map(key=>[key,key==='instances'?6:1]));
 const oldRows=[];
 for(const dataset of DATASETS){
  if(dataset==='instances'){
   for(const instance of seeded(translated))oldRows.push({
    dataset,record_key:String(instance.id),name:instance.name,
    kind:'',slot:'',is_costume_overlay:0,payload:JSON.stringify(instance)
   });
  }else oldRows.push({dataset,record_key:'all',name:'',kind:'',slot:'',
   is_costume_overlay:0,payload:'{}'});
 }
 const snapshots=new Map([[EXPECTED_ACTIVE,oldRows]]);
 const getRows=snapshot=>snapshots.get(snapshot)||[];
 const response=(results=[],changes=0,ok=true)=>new Response(
  JSON.stringify({success:ok,result:[{success:ok,results,meta:{changes}}]}),
  {status:ok?200:403,headers:{'content-type':'application/json'}});
 const api=async(input,init)=>{
  const url=String(input);
  if(url.includes('/api/catalog/instances.json')){
   const view=snapshots.get(current)||[];
   let result=view.filter(x=>x.dataset==='instances')
    .map(x=>JSON.parse(x.payload));
   if(changeEnglish)result[0].blurb='tampered English sentence';
   return new Response(JSON.stringify(result),{status:200,
    headers:{'x-ps-catalog':'d1','x-ps-catalog-snapshot':current}});
  }
  if(!url.includes('/d1/database/'))throw Error('Unexpected remote request');
  const {sql,params=[]}=JSON.parse(init.body);
  if(sql.startsWith('SELECT snapshot,published_at,expected_counts'))
   return response([{snapshot:current,published_at:0,
    expected_counts:JSON.stringify(counts)}]);
  if(sql.startsWith('SELECT payload FROM catalog_entries')){
   return response(getRows(params[0]).filter(x=>x.dataset==='instances')
    .map(x=>({payload:x.payload})).sort((a,b)=>a.payload.localeCompare(b.payload)));
  }
  if(sql.startsWith('SELECT dataset,COUNT(*) AS amount')){
   const groups=Object.groupBy(getRows(params[0]),row=>row.dataset);
   return response(Object.entries(groups).map(([dataset,entries])=>(
    {dataset,amount:entries.length})));
  }
  if(sql.startsWith('SELECT COUNT(*) AS n FROM catalog_entries WHERE snapshot')){
   return response([{n:getRows(params[0]).length}]);
  }
  if(sql.startsWith('INSERT INTO catalog_entries')){
   const [next,base,dataset]=params;
   if(dataset===failDataset)return response([],0,false);
   if(!snapshots.has(next))snapshots.set(next,[]);
   const cloned=getRows(base).filter(x=>x.dataset===dataset).map(x=>({...x}));
   snapshots.get(next).push(...cloned);writes+=cloned.length;
   return response([],cloned.length);
  }
  if(sql.startsWith('UPDATE catalog_entries SET payload=json_set')){
   const [ru,next,id,english]=params;
   const entry=getRows(next).find(x=>x.dataset==='instances'&&x.record_key===id);
   const value=entry&&JSON.parse(entry.payload);
   const changed=Number(Boolean(value&&value.blurb===english&&
    !Object.hasOwn(value,'blurbRu')));
   if(changed){value.blurbRu=ru;entry.payload=JSON.stringify(value);writes++}
   return response([],changed);
  }
  if(sql.startsWith('SELECT COUNT(*) AS n FROM catalog_entries AS copy')){
   const [base,next]=params;
   let changed=0;
   for(const entry of getRows(next)){
    const old=getRows(base).find(x=>
     x.dataset===entry.dataset&&x.record_key===entry.record_key);
    if(!old||JSON.stringify(old)!==JSON.stringify(entry))changed++;
   }
   return response([{n:changed}]);
  }
  if(sql.startsWith('UPDATE catalog_current SET snapshot')){
   const [next,_time,previous]=params;
   if(current!==previous)return response([],0);
   current=next;published++;return response([],1);
  }
  if(sql.startsWith('DELETE FROM catalog_entries WHERE snapshot')){
   removed+=getRows(params[0]).length;
   snapshots.delete(params[0]);return response([],removed);
  }
  throw Error('Unexpected query: '+sql.slice(0,100));
 };
 return {fetch:api,get active(){return current},get writes(){return writes},
  get cleaned(){return removed},get publications(){return published},
  rows:snapshot=>structuredClone(snapshots.get(snapshot)||[]),
  currentInstances:()=>getInstances(current),
  getInstances};
 function getInstances(snapshot){
  return getRows(snapshot).filter(row=>row.dataset==='instances')
   .map(row=>JSON.parse(row.payload));
 }
}
async function simulated(options={},fn){
 const before=globalThis.fetch,token=process.env.CLOUDFLARE_API_TOKEN;
 const sim=harness(options);globalThis.fetch=sim.fetch;
 process.env.CLOUDFLARE_API_TOKEN='test-only-not-a-secret';
 try{await fn(sim)}finally{
  globalThis.fetch=before;
  if(token===undefined)delete process.env.CLOUDFLARE_API_TOKEN;
  else process.env.CLOUDFLARE_API_TOKEN=token;
 }
}
test('end-to-end stage copies all datasets, patches only six and CAS activates new snapshot',async()=>{
 await simulated({},async sim=>{
  await publish();
  assert.equal(sim.active,stage);
  assert.equal(sim.publications,1);
  assert.equal(sim.cleaned,0);
  assert.equal(validateInstances(original,sim.currentInstances()),'published');
  assert.equal(validateInstances(original,sim.getInstances(EXPECTED_ACTIVE)),'missing');
  const previous=sim.rows(EXPECTED_ACTIVE),next=sim.rows(stage);
  assert.equal(previous.length,next.length);
  assert.equal(next.length,DATASETS.length-1+IDS.length);
  assert.equal(next.filter((row,i)=>JSON.stringify(row)!==
   JSON.stringify(previous[i])).length,6);
 });
});
test('repeated execution after publication performs no second write',async()=>{
 await simulated({translated:true},async sim=>{
  await publish();
  assert.equal(sim.publications,0);
  assert.equal(sim.writes,0);
  assert.equal(sim.active,EXPECTED_ACTIVE);
 });
});
test('incorrect English game blurb refuses all D1 writes',async()=>{
 await simulated({changeEnglish:true},async sim=>{
  await assert.rejects(publish(),/differs/);
  assert.equal(sim.writes,0);
  assert.equal(sim.publications,0);
 });
});
test('failure part-way through staging leaves prior snapshot active and cleans partial copy',async()=>{
 await simulated({failDataset:'souls'},async sim=>{
  await assert.rejects(publish(),/Cloudflare D1 query failed/);
  assert.equal(sim.active,EXPECTED_ACTIVE);
  assert.equal(sim.publications,0);
  assert.equal(sim.rows(stage).length,0,'failed staging must be removed');
  assert.ok(sim.cleaned>0,'previous completed batches must be cleaned');
  assert.equal(validateInstances(original,sim.getInstances(EXPECTED_ACTIVE)),'missing');
 });
});
