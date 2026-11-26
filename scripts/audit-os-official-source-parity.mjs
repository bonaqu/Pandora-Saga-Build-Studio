#!/usr/bin/env node
// #476: exact read-only official OS GAME FILES vs pinned GitHub source.
// Published D1 is checked separately. Neither run updates files or databases.
import {readFileSync,appendFileSync} from 'node:fs';
import {createHash} from 'node:crypto';
import {isDeepStrictEqual} from 'node:util';
import {fileURLToPath} from 'node:url';
import {resolve} from 'node:path';

export const OFFICIAL_FILES=Object.freeze([
 'meta','classes','skills','items','souls','monsters','drops',
 'maps','instances','racialPassives','itemForth','unison','trades',
 'tables','expertise','chests','strings.en'
]);
export const OFFICIAL_GAME_URL='https://pandorasaga-os.com/gamedata/';
const sha=value=>createHash('sha256').update(JSON.stringify(canonical(value))).digest('hex');
const isObject=x=>x!==null&&typeof x==='object'&&!Array.isArray(x);
const canonical=value=>Array.isArray(value)?value.map(canonical):
 isObject(value)?Object.fromEntries(Object.keys(value).sort().map(k=>[k,canonical(value[k])])):value;
const MARKUP_RE=/<\/?b>|<br\s*\/?>/gi;
const normalizePresentation=value=>String(value).replace(MARKUP_RE,' ').replace(/\s+/g,' ').trim();
const rowsFor=(name,value)=>{
 if(name==='instances'){
  if(!Array.isArray(value)||!value.every(row=>isObject(row)&&Number.isSafeInteger(row.id)))
   throw Error('Invalid public instances array');
  const keys=value.map(x=>String(x.id));
  if(new Set(keys).size!==keys.length)throw Error('Duplicate instance IDs');
  return new Map(value.map(row=>[String(row.id),row]));
 }
 if(!isObject(value)||Object.keys(value).length===0)
  throw Error('Invalid public source object');
 return new Map(Object.entries(value));
};

export function compareOfficialSource(local,live,name){
 if(!OFFICIAL_FILES.includes(name))throw Error('Not an allowlisted game source dataset');
 const a=rowsFor(name,local),b=rowsFor(name,live);
 const missing=[],added=[],changed=[],fieldCounts={};
 let descriptionOnly=0,descriptionFormatting=0,otherData=0;
 for(const id of a.keys())if(!b.has(id))missing.push(id);
 for(const id of b.keys())if(!a.has(id))added.push(id);
 for(const [id,current] of b){
  if(!a.has(id)||isDeepStrictEqual(a.get(id),current))continue;
  const previous=a.get(id);
  const fields=isObject(previous)&&isObject(current)?
   [...new Set([...Object.keys(previous),...Object.keys(current)])]
    .filter(field=>!isDeepStrictEqual(previous[field],current[field])).sort():
   ['<record>'];
  fields.forEach(field=>{fieldCounts[field]=(fieldCounts[field]||0)+1;});
  const onlyDesc=fields.length===1&&fields[0]==='desc'&&
   typeof previous?.desc==='string'&&typeof current?.desc==='string';
  if(onlyDesc){
   descriptionOnly++;
   if(normalizePresentation(previous.desc)===normalizePresentation(current.desc))
    descriptionFormatting++;
  }else otherData++;
  changed.push({id,fields,kind:onlyDesc?'description-only':'other-data',
   presentationEquivalent:onlyDesc&&
    normalizePresentation(previous.desc)===normalizePresentation(current.desc)});
 }
 const equal=missing.length===0&&added.length===0&&changed.length===0;
 return {
  dataset:name,equal,localRecords:a.size,officialRecords:b.size,
  // Canonical hashes ignore JSON object field order but preserve every value.
  localSha256:sha(local),officialSha256:sha(live),
  missingCount:missing.length,addedCount:added.length,changedCount:changed.length,
  descriptionOnly,descriptionFormatting,otherData,
  fieldCounts:Object.fromEntries(Object.entries(fieldCounts).sort(([a],[b])=>a.localeCompare(b))),
  examples:{
   missing:missing.slice(0,8),added:added.slice(0,8),
   changed:changed.slice(0,12)
  },
  // All changed source IDs are available in machine-readable output, with
  // no source values copied into public logs and no production D1 reads.
  changedIds:changed.map(x=>x.id)
 };
}

export async function inspectOfficialSources({
 names=OFFICIAL_FILES,readLocal=path=>readFileSync(new URL('../data/os/'+path+'.json',import.meta.url),'utf8'),
 fetcher=fetch,concurrency=3,timeoutMs=20000
}={}){
 if(!Array.isArray(names)||!names.length||new Set(names).size!==names.length||
  names.some(n=>!OFFICIAL_FILES.includes(n))||
  !Number.isInteger(concurrency)||concurrency<1||concurrency>4||
  !Number.isInteger(timeoutMs)||timeoutMs<1000||timeoutMs>30000)
  throw Error('Invalid bounded official source inspection options');
 let index=0;
 const results=Array(names.length);
 await Promise.all(Array.from({length:Math.min(concurrency,names.length)},async()=>{
  while(index<names.length){
   const position=index++,name=names[position];
   try{
    const before=JSON.parse(await readLocal(name));
    rowsFor(name,before);
    // One fixed URL per allowlisted name; no cookies, credentials or redirect.
    const response=await fetcher(OFFICIAL_GAME_URL+name+'.json',{
     method:'GET',headers:{Accept:'application/json'},redirect:'manual',
     signal:AbortSignal.timeout(timeoutMs),cache:'no-store'
    });
    if(!response?.ok||response.status!==200)
     throw Error('Official HTTP '+(response?.status??'unavailable'));
    if(response.headers?.get?.('content-type')&&
       !/application\/json/i.test(response.headers.get('content-type')))
     throw Error('Official source content-type is not JSON');
    const declared=Number(response.headers?.get?.('content-length')||0);
    if(declared>4000000)throw Error('Official source exceeds 4MB limit');
    const raw=await response.text();
    if(raw.length>1500000||Buffer.byteLength(raw,'utf8')>4000000)
     throw Error('Official source exceeds bounded response limit');
    const live=JSON.parse(raw);
    results[position]={name,available:true,
     ...compareOfficialSource(before,live,name)};
   }catch(error){
    results[position]={name,available:false,error:String(error.message||error).slice(0,150)};
   }
  }
 }));
 return {
  origin:OFFICIAL_GAME_URL,sourceAuthority:'public current Pandora Saga OS /gamedata JSON',
  sourceMeaning:'exact file data, not proof of server-side execution or rounding',
  checkedAt:new Date().toISOString(),
  summary:{
   datasets:results.length,available:results.filter(x=>x.available).length,
   identical:results.filter(x=>x.available&&x.equal).length,
   changed:results.filter(x=>x.available&&!x.equal).length,
   unavailable:results.filter(x=>!x.available).length,
   descriptionOnly:results.reduce((n,r)=>n+(r.descriptionOnly||0),0),
   descriptionFormatting:results.reduce((n,r)=>n+(r.descriptionFormatting||0),0),
   otherDataChanged:results.reduce((n,r)=>n+(r.otherData||0),0),
   missingRecords:results.reduce((n,r)=>n+(r.missingCount||0),0),
   addedRecords:results.reduce((n,r)=>n+(r.addedCount||0),0)
  },
  datasets:results
 };
}

export function sourceParityMarkdown(report){
 const status=r=>!r.available?'UNAVAILABLE':r.equal?'MATCH':
  (r.otherData||r.addedCount||r.missingCount)?'DATA DRIFT':'TEXT DRIFT';
 const rows=report.datasets.map(r=>
  '| '+r.name+' | '+status(r)+' | '+(r.officialRecords??'-')+
  ' | '+(r.changedCount??'-')+' | '+(r.descriptionOnly??'-')+
  ' | '+(r.otherData??'-')+' |').join('\n');
 return ['### Official Pandora Saga OS API vs checked-in source',
  'Checked: '+report.checkedAt+' · **read-only**, no D1 or build writes.',
  'Source: '+report.origin+' · **verified raw values, not verified server formulas**.',
  '| Dataset | Status | Official records | Changed | Description-only | Other-data |',
  '|---|---|---:|---:|---:|---:|',
  rows,
  'Total: '+JSON.stringify(report.summary),
  'An unavailable upstream or changed description is not automatically a game-mechanics regression.'
 ].join('\n')+'\n';
}

if(process.argv[1]&&resolve(process.argv[1])===fileURLToPath(import.meta.url)){
 const args=process.argv.slice(2);
 if(args.some(x=>!['--strict','--observe'].includes(x))||
  args.includes('--strict')&&args.includes('--observe')||args.length>1)
  throw Error('Usage: node scripts/audit-os-official-source-parity.mjs [--strict|--observe]');
 const report=await inspectOfficialSources();
 for(const dataset of report.datasets){
  console.log((!dataset.available?'WARN':dataset.equal?'OK  ':'DRIFT')+
   ' '+dataset.name+': '+(dataset.available?
    dataset.officialRecords+' official, '+dataset.changedCount+' changed, '+
     dataset.descriptionOnly+' descriptions, '+dataset.otherData+' other data; '+
     dataset.addedCount+' added, '+dataset.missingCount+' missing':
     dataset.error));
  if(dataset.available&&!dataset.equal)
   console.log('  Fields: '+JSON.stringify(dataset.fieldCounts)+
    '; sample source IDs: '+dataset.examples.changed.map(x=>x.id).join(', '));
 }
 console.log('Official source parity summary: '+JSON.stringify(report.summary));
 if(process.env.GITHUB_STEP_SUMMARY)
  appendFileSync(process.env.GITHUB_STEP_SUMMARY,sourceParityMarkdown(report));
 const drift=report.summary.changed||report.summary.unavailable;
 if(drift)console.log('::warning::Official game-source parity has drift/unavailable datasets; inspect source and review publication via the existing admin D1/CAS workflow.');
 if(!args.includes('--observe')&&drift)process.exitCode=1;
}
