/* Read-only comparison of the currently published D1 and checked-in OS snapshot.
 * Never authenticates, writes, publishes, or mutates game data. Node.js >=20.
 * Usage: npm run catalog:parity:live [-- --strict-ru] */
import {readFileSync} from 'node:fs';
import {pathToFileURL} from 'node:url';

export const DATASETS=Object.freeze([
 'items','skills','souls','monsters','drops','maps','instances',
 'trades','tables','chests','racialPassives'
]);
const endpoint='https://ps-build-studio-cloud.bonaqu.workers.dev/api/catalog/';
const canon=value=>Array.isArray(value)?value.map(canon):
 value&&typeof value==='object'?Object.fromEntries(
  Object.keys(value).filter(k=>value[k]!==undefined).sort()
   .map(k=>[k,canon(value[k])])):value;
const same=(a,b)=>JSON.stringify(canon(a))===JSON.stringify(canon(b));
const size=(data,dataset)=>dataset==='instances'?data?.length:
 dataset==='trades'?data?.trades?.length:
 dataset==='chests'?data?.boxes?.length:
 data&&typeof data==='object'?Object.keys(data).length:null;

// Most datasets must match in full. The six missing D1 Russian instance blurbs
// are an explicit, source-matched exception already bridged by the frontend.
// The exception NEVER masks changed English gameplay content or other fields.
export function compareCatalog(staticData,remoteData,dataset){
 if(dataset!=='instances'){
  return {equal:same(staticData,remoteData),missingRu:0,
   staticCount:size(staticData,dataset),d1Count:size(remoteData,dataset)};
 }
 if(!Array.isArray(staticData)||!Array.isArray(remoteData))
  return {equal:false,missingRu:0,staticCount:size(staticData,dataset),
   d1Count:size(remoteData,dataset)};
 const toMap=rows=>{
  const map=new Map();
  for(const row of rows){
   if(!row||!Number.isSafeInteger(row.id)||map.has(String(row.id)))return null;
   map.set(String(row.id),row);
  }
  return map;
 };
 const local=toMap(staticData),d1=toMap(remoteData);
 if(!local||!d1||local.size!==d1.size)return{
  equal:false,missingRu:0,staticCount:staticData.length,d1Count:remoteData.length
 };
 let missingRu=0;
 for(const [id,source] of local){
  const current=d1.get(id);
  if(!current)return {equal:false,missingRu,staticCount:staticData.length,
   d1Count:remoteData.length};
  if(same(source,current))continue;
  if(typeof source.blurbRu==='string'&&source.blurbRu.trim()&&
     !Object.hasOwn(current,'blurbRu')&&
     typeof source.blurb==='string'&&source.blurb===current.blurb){
   const {blurbRu:_translation,...other}=source;
   if(same(other,current)){missingRu++;continue}
  }
  return {equal:false,missingRu,staticCount:staticData.length,
   d1Count:remoteData.length};
 }
 return {equal:true,missingRu,staticCount:staticData.length,
  d1Count:remoteData.length};
}

async function run({strictRu=false,fetcher=fetch}={}){
 let snapshot=null,failures=0,translations=0;
 for(const dataset of DATASETS){
  try{
   const local=JSON.parse(readFileSync(new URL('../data/os/'+dataset+'.json',
    import.meta.url),'utf8'));
   const response=await fetcher(endpoint+dataset+'.json',{
    cache:'no-store',signal:AbortSignal.timeout(15000)});
   if(!response.ok)throw Error('HTTP '+response.status);
   if(response.headers.get('x-ps-catalog')!=='d1')
    throw Error('response does not confirm D1 source');
   const observed=response.headers.get('x-ps-catalog-snapshot');
   if(!observed)throw Error('D1 snapshot header missing');
   if(snapshot!==null&&snapshot!==observed)
    throw Error('D1 snapshot changed during read-only audit');
   snapshot=observed;
   const report=compareCatalog(local,await response.json(),dataset);
   if(!report.equal){
    failures++;console.error('FAIL '+dataset+': source records differ');
   }else if(report.missingRu){
    translations+=report.missingRu;
    console.log('WARN '+dataset+': '+report.missingRu+
     ' source-matched RU descriptions absent in D1');
   }else console.log('OK   '+dataset+': '+report.staticCount+
    ' source records match D1');
  }catch(error){failures++;console.error('FAIL '+dataset+': '+error.message)}
 }
 if(strictRu&&translations)failures++;
 console.log('Read-only parity: '+(DATASETS.length-failures)+
  ' of '+DATASETS.length+' datasets checked; '+translations+
  ' missing RU blurbs; '+failures+' blocking failures. No writes performed.');
 return failures===0;
}
const invoked=process.argv[1]&&pathToFileURL(process.argv[1]).href===import.meta.url;
if(invoked){
 run({strictRu:process.argv.includes('--strict-ru')}).then(ok=>{
  if(!ok)process.exitCode=1;
 }).catch(error=>{console.error(error.message);process.exitCode=1});
}
