/* Read-only comparison of the currently published D1 and checked-in OS snapshot.
 * Never authenticates, writes, publishes, or mutates game data. Node.js >=20.
 * Usage: npm run catalog:parity:live (RU completeness mandatory since 0.573) */
import {readFileSync} from 'node:fs';
import {pathToFileURL} from 'node:url';

export const DATASETS=Object.freeze([
 'items','skills','souls','monsters','drops','maps','instances',
 'trades','tables','chests','racialPassives','classes','itemForth',
 'unison','expertise','stringsEn'
]);
const endpoint='https://ps-build-studio-cloud.bonaqu.workers.dev/api/catalog/';
// Historical six-record exception used for precise drift diagnostics only.
// Since 0.573 published these values to D1, the live CI audit fails if they
// disappear again (e.g. accidental rollback to the pre-0.573 snapshot).
export const KNOWN_MISSING_RU_INSTANCE_IDS=Object.freeze([
 20030040,20030070,20030080,20030090,20030100,20030110
]);
const knownMissingRu=new Set(KNOWN_MISSING_RU_INSTANCE_IDS.map(String));
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
   if(same(other,current)&&knownMissingRu.has(id)){missingRu++;continue}
  }
  return {equal:false,missingRu,staticCount:staticData.length,
   d1Count:remoteData.length};
 }
 return {equal:true,missingRu,staticCount:staticData.length,
  d1Count:remoteData.length};
}

// Safe CI-only drift summary: counts and schema field labels, no catalog
// values, player information, credentials or raw record identifiers in logs.
export function describeCatalogDifference(local,remote,dataset){
 const records=value=>{
  if(dataset==='instances'&&Array.isArray(value))
   return new Map(value.map((row,index)=>[String(row?.id??index),row]));
  if(Array.isArray(value))
   return new Map(value.map((row,index)=>[String(index),row]));
  if(value&&typeof value==='object')return new Map(Object.entries(value));
  return null;
 };
 const a=records(local),b=records(remote);
 if(!a||!b)return 'incompatible JSON structure';
 let missing=0,extra=0,changed=0;
 const changedFields=new Set();
 for(const [key,value] of a){
  if(!b.has(key)){missing++;continue}
  const current=b.get(key);
  if(same(value,current))continue;
  changed++;
  // Disclose names of ordinary schema fields, never gameplay text or IDs.
  if(changedFields.size<6&&value&&current&&
   typeof value==='object'&&!Array.isArray(value)&&
   typeof current==='object'&&!Array.isArray(current)){
   for(const field of new Set([...Object.keys(value),...Object.keys(current)])){
    if(changedFields.size>=6)break;
    if(/^[A-Za-z][A-Za-z0-9_]{0,35}$/.test(field)&&
     !same(value[field],current[field]))changedFields.add(field);
   }
  }
 }
 for(const key of b.keys())if(!a.has(key))extra++;
 const fields=changedFields.size?', fields: '+[...changedFields].join(', '):'';
 return 'local '+a.size+', D1 '+b.size+
  '; missing in D1 '+missing+', extra in D1 '+extra+
  ', changed records '+changed+fields;
}

// Explain rich-text drift without treating it as verified gameplay parity.
// D1 can intentionally retain <br>, <b> and <item> tokens missing from an
// older flattened archive. Never discard those tags or silence a real drift.
export function describeDescriptionDrift(local,remote,dataset){
 const counts={lineBreaks:0,inlineMarkup:0,itemReferences:0,otherText:0};
 const sections=dataset==='stringsEn'?['items','souls']:
  ['items','souls'].includes(dataset)?[null]:[];
 for(const section of sections){
  const a=section?local?.[section]:local,b=section?remote?.[section]:remote;
  if(!a||!b||typeof a!=='object'||typeof b!=='object')continue;
  for(const [id,record] of Object.entries(a)){
   if(!Object.hasOwn(b,id))continue;
   const source=section?record?.d:record?.desc;
   const live=section?b[id]?.d:b[id]?.desc;
   if(source===live)continue;
   if(typeof source!=='string'||typeof live!=='string'){
    counts.otherText++;continue;
   }
   const noBreaks=live.replace(/<br\s*\/?>/gi,'');
   if(source===noBreaks)counts.lineBreaks++;
   else if(source===noBreaks.replace(/<\/?b>/gi,''))counts.inlineMarkup++;
   else if(/<item\s+[1-9][0-9]{0,11}\s*\/?>/i.test(live)&&
    !/<item\s+[1-9][0-9]{0,11}\s*\/?>/i.test(source))
    counts.itemReferences++;
   else counts.otherText++;
  }
 }
 return counts;
}

// A game <item N> marker becomes a link only when its destination exists.
// Validate public D1 and checked-in archive without echoing names or IDs to CI.
export function validateDescriptionReferences({items={},souls={},stringsEn={}}={}){
 const existing=new Set(Object.keys(items||{}));
 let total=0,unresolved=0;
 const scan=(rows,field)=>{
  for(const record of Object.values(rows||{})){
   if(typeof record?.[field]!=='string')continue;
   for(const match of record[field].matchAll(/<item\b([^>]*)>/gi)){
    total++;
    const id=/^\s*(\d{1,12})\s*\/?\s*$/.exec(match[1])?.[1]||null;
    if(!id||!existing.has(id))unresolved++;
   }
  }
 };
 scan(items,'desc');scan(souls,'desc');
 scan(stringsEn?.items,'d');scan(stringsEn?.souls,'d');
 return {total,unresolved};
}
export async function run({strictRu=true,fetcher=fetch}={}){
 let snapshot=null,failures=0,translations=0,checked=0;
 const archive={},published={};
 for(const dataset of DATASETS){
  try{
   // D1 uses stringsEn while the checked-in original is strings.en.json.
   const localFile=dataset==='stringsEn'?'strings.en.json':dataset+'.json';
   const local=JSON.parse(readFileSync(new URL('../data/os/'+localFile,
    import.meta.url),'utf8'));
   if(['items','souls','stringsEn'].includes(dataset))archive[dataset]=local;
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
   const remote=await response.json();
   checked++;
   if(['items','souls','stringsEn'].includes(dataset))published[dataset]=remote;
   const report=compareCatalog(local,remote,dataset);
   if(!report.equal){
    const drift=describeDescriptionDrift(local,remote,dataset);
    const details=Object.values(drift).some(Boolean)?
     '; description drift: '+JSON.stringify(drift):'';
    failures++;console.error('FAIL '+dataset+': source records differ — '+
     describeCatalogDifference(local,remote,dataset)+details);
   }else if(report.missingRu){
    translations+=report.missingRu;
    if(strictRu)failures++;
    const message=(strictRu?'FAIL ':'WARN ')+dataset+': '+report.missingRu+
     ' previously published RU descriptions absent in D1';
    if(strictRu)console.error(message);else console.log(message);
   }else console.log('OK   '+dataset+': '+report.staticCount+
    ' source records match D1');
  }catch(error){failures++;console.error('FAIL '+dataset+': '+error.message)}
 }
 // Check links in both sets; a missing target is a separate integrity defect
 // even if two copies of the same broken description happen to match.
 for(const [label,source] of [['archived',archive],['published D1',published]]){
  if(!source.items||!source.souls||!source.stringsEn)continue;
  const refs=validateDescriptionReferences(source);
  if(refs.unresolved){
   failures++;console.error('FAIL '+label+' description references: '+
    refs.unresolved+' unresolved of '+refs.total+' (no IDs disclosed)');
  }else console.log('OK   '+label+' description references: '+refs.total+
   ' verified destinations');
 }
 console.log('Read-only parity: '+checked+' of '+DATASETS.length+
  ' dataset responses checked; '+translations+
  ' missing RU blurbs; '+failures+' blocking failures. No writes performed.');
 return failures===0;
}
const invoked=process.argv[1]&&pathToFileURL(process.argv[1]).href===import.meta.url;
if(invoked){
 run({strictRu:true}).then(ok=>{
  if(!ok)process.exitCode=1;
 }).catch(error=>{console.error(error.message);process.exitCode=1});
}
