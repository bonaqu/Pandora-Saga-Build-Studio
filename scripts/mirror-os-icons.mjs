#!/usr/bin/env node
// Offline-first import of original Pandora Saga OS icons. Never manufacture
// lookalike textures, silently reclassify a 404, or overwrite a real WebP.
import {readFile,writeFile,mkdir,rename} from 'node:fs/promises';
import {join,dirname} from 'node:path';
import {fileURLToPath} from 'node:url';
import {safeIconStem,isWebP,originalIconUrl} from './icon-utils.mjs';
import {buildSkillDisplayAliases} from './skill-icon-display-aliases.mjs';
const root=join(dirname(fileURLToPath(import.meta.url)),'..');
const dry=process.argv.includes('--dry-run');
const retry404=process.argv.includes('--retry-404');
const retries=2,concurrency=8;
const limitArg=process.argv.find(x=>x.startsWith('--limit='));
const limit=limitArg?Number(limitArg.slice(8)):Infinity;
if(limitArg&&(!Number.isInteger(limit)||limit<1))throw Error('--limit must be a positive integer');
const readCatalog=async name=>JSON.parse(await readFile(join(root,'data/os',name+'.json'),'utf8'));
const [skills,items,souls]=await Promise.all(['skills','items','souls'].map(readCatalog));
const rows=[];
for(const entry of Object.values(skills))
 if(entry.iconId)rows.push({kind:'skills',stem:'skill_'+safeIconStem(entry.iconId)});
for(const entry of Object.values(items))
 if(entry.icon)rows.push({kind:'items',stem:safeIconStem(entry.icon)});
for(const entry of Object.values(souls))
 if(entry.icon)rows.push({kind:'souls',stem:safeIconStem(entry.icon)});
const unique=[...new Map(rows.map(row=>[row.kind+'/'+row.stem,row])).values()];
const key=row=>row.kind+'/'+row.stem;
const fileOf=row=>'assets/'+row.kind+'/icons/'+row.stem+'.webp';
const manifestPath=join(root,'assets','os-icon-manifest.json');
let prior=null;
try{prior=JSON.parse(await readFile(manifestPath,'utf8'))}
catch(error){if(error.code!=='ENOENT')throw error}
const known404=new Set((Array.isArray(prior?.missing)?prior.missing:[])
 .filter(row=>row?.error==='HTTP 404'&&['skills','items','souls'].includes(row.kind)&&
  /^[A-Za-z0-9_-]{1,120}$/.test(row.stem))
 .map(key));
// Recheck high-impact original URLs first in bounded --retry-404 batches.
// This never substitutes other images or changes the canonical manifest order.
const skillByStem=new Map(Object.values(skills).filter(x=>x.iconId).map(
 x=>['skill_'+safeIconStem(x.iconId),x]));
const retryPriority=row=>{
 if(row.kind==='items'||row.kind==='souls')return 0;
 const skill=skillByStem.get(row.stem);
 const hasClasses=Object.values(skill?.classes||{}).some(v=>v===1||v===true);
 if(hasClasses&&Array.isArray(skill.reqs)&&skill.reqs.length>0)return 1;
 if(hasClasses)return 2;
 if(skill?.learnable===true)return 3;
 return 4;
};
const available=new Map(),pending=[],failures=new Map();
let skippedKnown404=0;
for(const row of unique){
 const path=fileOf(row);
 try{
  const bytes=await readFile(join(root,path));
  if(isWebP(bytes)){available.set(key(row),path);continue}
 }catch(error){if(error.code!=='ENOENT')throw error}
 if(known404.has(key(row))&&!retry404){skippedKnown404++;continue}
 pending.push(row);
}
if(retry404)pending.sort((a,b)=>retryPriority(a)-retryPriority(b));
if(Number.isFinite(limit))pending.splice(limit);
let index=0,downloaded=0;
async function download(row){
 let failure=null;
 for(let attempt=0;attempt<=retries;attempt++){
  try{
   const controller=new AbortController();
   const timeout=setTimeout(()=>controller.abort(),14000);
   let response;
   try{response=await fetch(originalIconUrl(row.kind,row.stem),{
    signal:controller.signal,redirect:'error'
   })}finally{clearTimeout(timeout)}
   if(!response.ok){
    // A known 404 is not transient. Do not send three identical 404 requests.
    if(response.status===404){failures.set(key(row),'HTTP 404');return}
    throw Error('HTTP '+response.status);
   }
   const bytes=new Uint8Array(await response.arrayBuffer());
   if(!isWebP(bytes))throw Error('Not a valid WebP image');
   const path=fileOf(row),destination=join(root,path);
   await mkdir(dirname(destination),{recursive:true});
   const temporary=destination+'.partial';
   await writeFile(temporary,bytes);await rename(temporary,destination);
   available.set(key(row),path);downloaded++;return;
  }catch(error){
   failure=String(error.message||error);
   if(attempt<retries)await new Promise(resolve=>setTimeout(resolve,400*(attempt+1)));
  }
 }
 failures.set(key(row),failure||'Failed to download');
}
async function worker(){
 while(index<pending.length){
  const current=index++;
  if(!dry)await download(pending[current]);
  if(!dry&&(current+1)%100===0)console.log(current+1,'/',pending.length,'processed');
 }
}
await Promise.all(Array.from({length:concurrency},worker));
// Reconstruct the complete manifest from disk after the batch. Every previous
// verified 404 survives partial --limit runs unless its original was recovered.
const manifest={source:'Pandora Saga OS, one-time archive',createdAt:new Date().toISOString(),
 icons:{skills:{},items:{},souls:{}},missing:[]};
for(const row of unique){
 const id=key(row),path=fileOf(row);
 if(!available.has(id)){
  try{if(isWebP(await readFile(join(root,path))))available.set(id,path)}
  catch(error){if(error.code!=='ENOENT')throw error}
 }
 if(available.has(id))manifest.icons[row.kind][row.stem]=path;
 else manifest.missing.push({kind:row.kind,stem:row.stem,error:
  failures.get(id)||(known404.has(id)?'HTTP 404':'Not attempted')});
}
manifest.count={expected:unique.length,present:available.size,
 missing:manifest.missing.length,processed:dry?0:pending.length,planned:pending.length};
// Presentation aliases are kept separate from verified originals and
// automatically rebuilt when source icon coverage changes.
manifest.displayAliases={skills:buildSkillDisplayAliases(skills,manifest.icons.skills,manifest.missing)};
if(!dry){
 await mkdir(join(root,'assets'),{recursive:true});
 await writeFile(manifestPath,JSON.stringify(manifest,null,2)+'\n');
}
console.log(JSON.stringify({dryRun:dry,retry404,skippedKnown404,downloaded,
 firstPlanned:pending.slice(0,12).map(key),...manifest.count}));
if(failures.size&&!Number.isFinite(limit))process.exitCode=1;
