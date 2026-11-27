#!/usr/bin/env node
// #476: exact live source-value parity; HTML breaks and local translations
// are deliberately kept separate from upstream numeric/mechanical fields.
// No SQL, worker credentials, login or HTTP writes.
import {readFileSync,appendFileSync} from 'node:fs';
import {createHash} from 'node:crypto';
import {isDeepStrictEqual} from 'node:util';
import {fileURLToPath} from 'node:url';
import {resolve} from 'node:path';

export const OFFICIAL_GAMEDATA_SETS=Object.freeze([
 'meta','classes','skills','items','souls','monsters','drops','maps',
 'instances','racialPassives','itemForth','unison','trades','tables',
 'expertise','chests','strings.en'
]);
export const OFFICIAL_SOURCE_HOSTS=Object.freeze([
 'https://pandorasaga-os.com','https://www.pandorasaga-os.com'
]);
const safeSets=new Set(OFFICIAL_GAMEDATA_SETS);
const stripOnlyBreaks=text=>text.replace(/<br\s*\/?>/gi,'');
const asObject=value=>value!==null&&typeof value==='object'&&!Array.isArray(value);
const count=data=>Array.isArray(data)?data.length:Object.keys(data).length;
const deepCopy=value=>structuredClone(value);

export function reconcileOfficialGamedata(name,official,local,{maxDifferences=30}={}){
 if(!safeSets.has(name))throw Error('Unknown official dataset '+String(name));
 if(!(asObject(official)||name==='instances'&&Array.isArray(official))||
  !(asObject(local)||name==='instances'&&Array.isArray(local)))
  throw Error('Expected official/local JSON data for '+name);
 if(!Number.isSafeInteger(maxDifferences)||maxDifferences<1||maxDifferences>100)
  throw Error('Invalid difference report limit');
 const source=deepCopy(official),snapshot=deepCopy(local);
 const localExtras={formattedDescriptions:0,translatedInstanceBlurbs:0,
  localCuratedMetadata:false,upstreamFileFingerprints:0};
 if(name==='meta'){
  if(!asObject(source.sha)||Object.values(source.sha).some(v=>
   typeof v!=='string'||!/^[0-9a-f]{16}$/i.test(v)))
   throw Error('Official OS metadata missing file fingerprints');
  localExtras.upstreamFileFingerprints=Object.keys(source.sha).length;
  delete source.sha;
  if(Object.hasOwn(snapshot,'curated')){
   if(!asObject(snapshot.curated))throw Error('Invalid local curated metadata');
   localExtras.localCuratedMetadata=true;
   delete snapshot.curated;
  }
 }
 if(name==='instances'){
  if(!Array.isArray(source)||!Array.isArray(snapshot))throw Error('Expected OS instances array');
  for(const entry of snapshot){
   if(Object.hasOwn(entry,'blurbRu')){
    if(typeof entry.blurbRu!=='string'||!entry.blurbRu.trim())
     throw Error('Invalid curated Russian instance blurb');
    delete entry.blurbRu;
    localExtras.translatedInstanceBlurbs++;
   }
  }
 }
 if(name==='items'||name==='souls'){
  for(const [id,entry] of Object.entries(snapshot)){
   const current=source[id];
   if(!asObject(entry)||!asObject(current))continue;
   if(typeof entry.desc!=='string'||typeof current.desc!=='string')continue;
   if(entry.desc!==current.desc&&stripOnlyBreaks(entry.desc)===current.desc){
    entry.desc=current.desc;
    localExtras.formattedDescriptions++;
   }
  }
 }
 const differences=[];
 const same=(a,b,path)=>{
  if(isDeepStrictEqual(a,b))return;
  if(differences.length>=maxDifferences)return;
  if(Array.isArray(a)||Array.isArray(b)){
   if(!Array.isArray(a)||!Array.isArray(b)||a.length!==b.length){
    differences.push({path,kind:'array-length-or-type'});return;
   }
   for(let i=0;i<a.length;i++)same(a[i],b[i],path+'['+i+']');
  }else if(asObject(a)&&asObject(b)){
   for(const k of [...new Set([...Object.keys(a),...Object.keys(b)])].sort()){
    if(differences.length>=maxDifferences)break;
    if(!Object.hasOwn(a,k)||!Object.hasOwn(b,k))
     differences.push({path:path?path+'.'+k:k,
      kind:!Object.hasOwn(a,k)?'only-in-local':'only-in-source'});
    else same(a[k],b[k],path?path+'.'+k:k);
   }
  }else differences.push({path,kind:'changed-value',
   officialType:typeof a,localType:typeof b});
 };
 same(source,snapshot,'');
 return {name,ok:differences.length===0,
  officialRecords:count(official),localRecords:count(local),
  localExtras,differences,confidence:'exact-original-fields-only',
  note:'Source fields must match exactly; only local HTML <br>, curated metadata and RU instance blurbs are allowed'};
}

export async function fetchOfficialGamedata(name,{fetchImpl=fetch,timeoutMs=12000}={}){
 if(!safeSets.has(name))throw Error('Unknown official dataset '+String(name));
 if(typeof fetchImpl!=='function'||!Number.isSafeInteger(timeoutMs)||
  timeoutMs<100||timeoutMs>60000)throw Error('Invalid read-only source fetch options');
 const failures=[];
 for(const host of OFFICIAL_SOURCE_HOSTS){
  const url=host+'/gamedata/'+name+'.json';
  try{
   const response=await fetchImpl(url,{
    method:'GET',headers:{accept:'application/json'},redirect:'manual',
    signal:AbortSignal.timeout(timeoutMs)
   });
   if(!response?.ok||response.status!==200){
    failures.push({host,status:response?.status??null});continue;
   }
   const length=Number(response.headers?.get?.('content-length')||0);
   if(length>3750000)throw Error('Official JSON exceeds size ceiling');
   const raw=await response.text();
   if(raw.length>1250000)throw Error('Official JSON exceeds character ceiling');
   const data=JSON.parse(raw);
   if(!(asObject(data)||name==='instances'&&Array.isArray(data)))
    throw Error('Unexpected game-data root shape');
   return {name,url,data,bytes:Buffer.byteLength(raw,'utf8'),
    sha256:createHash('sha256').update(raw).digest('hex')};
  }catch(error){failures.push({host,reason:String(error?.message||error).slice(0,100)})}
 }
 const fail=new Error('Official OS source unavailable for '+name+' from both allowlisted hosts');
 fail.reasons=failures;
 throw fail;
}

export async function auditOfficialOsSnapshot({
 names=OFFICIAL_GAMEDATA_SETS,readLocal,fetchSource=fetchOfficialGamedata,concurrency=3
}={}){
 if(!Array.isArray(names)||!names.length||new Set(names).size!==names.length||
  names.some(name=>!safeSets.has(name))||
  !Number.isSafeInteger(concurrency)||concurrency<1||concurrency>4||
  typeof readLocal!=='function'||typeof fetchSource!=='function')
  throw Error('Invalid official game-data audit settings');
 const result=Array(names.length);
 let next=0;
 await Promise.all(Array.from({length:Math.min(concurrency,names.length)},async()=>{
  while(next<names.length){
   const index=next++,name=names[index];
   try{
    const [remote,local]=await Promise.all([fetchSource(name),readLocal(name)]);
    const comparison=reconcileOfficialGamedata(name,remote.data,local);
    result[index]={...comparison,sourceUrl:remote.url,sourceSha256:remote.sha256};
   }catch(error){
    result[index]={name,ok:false,sourceUnavailable:!!error?.reasons,
     error:String(error?.message||error).slice(0,180)};
   }
  }
 }));
 return {source:'https://pandorasaga-os.com/gamedata/*.json (read-only GET)',
  certainty:'OS files are authoritative for exported values, NOT automatically for hidden combat algorithms',
  checkedAt:new Date().toISOString(),
  summary:{requested:names.length,matched:result.filter(r=>r.ok).length,
   different:result.filter(r=>r.ok===false&&!r.sourceUnavailable).length,
   unavailable:result.filter(r=>r.sourceUnavailable).length},
  datasets:result};
}

// Render only provenance/counts and a bounded set of paths, never tokens or player data.
export function officialSourceSummaryMarkdown(report){
 if(!Array.isArray(report?.datasets)||!report?.summary)
  throw Error('Expected official source audit report');
 const table=report.datasets.map(row=>{
  const status=row.ok?'MATCH':row.sourceUnavailable?'UNAVAILABLE':'DRIFT';
  return '| '+row.name+' | '+status+' | '+(row.officialRecords??'-')+
   ' | '+(row.localRecords??'-')+' | '+
   (row.localExtras?.formattedDescriptions??0)+' | '+
   (row.differences?.length??0)+' |';
 }).join('\n');
 return ['### Original Pandora Saga OS source vs current Build Studio catalog',
  'Checked: '+report.checkedAt+' · **read-only**, no D1 SQL/write.',
  '| Dataset | Status | Official records | Local records | Local line-break formatting | Differences |',
  '|---|---|---:|---:|---:|---:|',table,
  'Summary: '+JSON.stringify(report.summary),
  'Confirmed source fields are authoritative; this does not prove hidden server hit/rounding mechanics.'
 ].join('\n')+'\n';
}

if(process.argv[1]&&resolve(process.argv[1])===fileURLToPath(import.meta.url)){
 const args=process.argv.slice(2);
 if(args.some(x=>!['--all','--observe'].includes(x))||args.length>1)
  throw Error('Usage: node scripts/audit-official-os-source.mjs [--all|--observe]');
 const local=name=>JSON.parse(readFileSync(new URL('../data/os/'+name+'.json',import.meta.url),'utf8'));
 const report=await auditOfficialOsSnapshot({readLocal:local});
 console.log(JSON.stringify(args.includes('--all')?report:{
  ...report,datasets:report.datasets.map(({differences,...rest})=>({
   ...rest,differences:differences?.slice(0,5)
  }))
 },null,2));
 if(process.env.GITHUB_STEP_SUMMARY)
  appendFileSync(process.env.GITHUB_STEP_SUMMARY,officialSourceSummaryMarkdown(report));
 if(report.summary.matched!==report.summary.requested){
  console.log('::warning::Official OS source differs or is unavailable; inspect original JSON before changing the catalog. No D1 writes.');
  if(!args.includes('--observe'))process.exitCode=1;
 }
}
