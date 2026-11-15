#!/usr/bin/env node
/* Source-only icon delta: never downloads, guesses, aliases or publishes art. */
import {readFileSync} from 'node:fs';
import {resolve,dirname,join} from 'node:path';
import {fileURLToPath} from 'node:url';
import {safeIconStem,isWebP} from './icon-utils.mjs';

const root=resolve(dirname(fileURLToPath(import.meta.url)),'..');
const snapshot='ps-ca9a604163b54a2da5c83ea55077ef96';
const gameKinds=Object.freeze(['items','skills','souls']);
const localJson=path=>JSON.parse(readFileSync(join(root,path),'utf8'));
const canonical=(kind,stem)=>'assets/'+kind+'/icons/'+safeIconStem(stem)+'.webp';

function iconIdentities(collection,kind){
 const result=new Map();
 for(const [id,row] of Object.entries(collection||{})){
  const icon=kind==='skills'?row?.iconId:row?.icon;
  if(icon===null||icon===undefined||icon==='')continue;
  const stem=kind==='skills'?'skill_'+safeIconStem(icon):safeIconStem(icon);
  const entry=result.get(stem)||{kind,stem,ids:[],names:[]};
  entry.ids.push(id);
  if(typeof row.name==='string'&&row.name.trim()&&
   !entry.names.includes(row.name)&&entry.names.length<4)
   entry.names.push(row.name);
  result.set(stem,entry);
 }
 return result;
}

export function auditCatalogIconDelta({historical={},candidate={},
 manifest={},verifyAsset=()=>false}={}){
 const byKind={},entries=[];
 const declaredMissing=new Set((manifest.missing||[])
  .filter(x=>x&&typeof x.kind==='string'&&typeof x.stem==='string')
  .map(x=>x.kind+'/'+x.stem));
 for(const kind of gameKinds){
  const previous=iconIdentities(historical[kind],kind);
  const current=iconIdentities(candidate[kind],kind);
  let verifiedNew=0,unverifiedNew=0;
  for(const [stem,row] of current){
   if(previous.has(stem))continue;
   const path=canonical(kind,stem);
   const mapped=manifest.icons?.[kind]?.[stem];
   const verified=mapped===path&&verifyAsset(path)===true;
   if(verified)verifiedNew++;else unverifiedNew++;
   entries.push({...row,path,verification:verified?'verified':'unverified',
    // A new icon absent from the old 404 manifest must NOT be called HTTP 404.
    previouslyReported404:declaredMissing.has(kind+'/'+stem)});
  }
  byKind[kind]={historicalDistinct:previous.size,
   candidateDistinct:current.size,addedDistinct:verifiedNew+unverifiedNew,
   verifiedNew,unverifiedNew};
 }
 entries.sort((a,b)=>a.kind.localeCompare(b.kind)||a.stem.localeCompare(b.stem));
 return {snapshot,byKind,added:entries.length,
  verified:entries.filter(x=>x.verification==='verified').length,
  unverified:entries.filter(x=>x.verification==='unverified').length,
  entries,hasUnverified:entries.some(x=>x.verification==='unverified'),
  readOnly:true};
}

export function auditPinnedCandidateIcons(){
 const source=kind=>localJson('data/os/'+kind+'.json');
 const proposed=kind=>localJson('data/catalog-review/'+snapshot+'/'+kind+'.json');
 const historical=Object.fromEntries(gameKinds.map(k=>[k,source(k)]));
 const candidate=Object.fromEntries(gameKinds.map(k=>[k,proposed(k)]));
 const manifest=localJson('assets/os-icon-manifest.json');
 return auditCatalogIconDelta({historical,candidate,manifest,
  verifyAsset:path=>{
   // canonical() has already sanitized both kind and stem; no arbitrary URLs.
   try{return isWebP(readFileSync(join(root,path)))}
   catch{return false}
  }});
}
if(process.argv[1]&&resolve(process.argv[1])===fileURLToPath(import.meta.url)){
 const report=auditPinnedCandidateIcons();
 console.log(JSON.stringify(report,null,2));
 // Opt-in validation: ordinary offline review remains informative, while
 // promotion may block if unverified new source-art coverage is unacceptable.
 if(process.argv.includes('--strict')&&report.hasUnverified)process.exitCode=1;
}
