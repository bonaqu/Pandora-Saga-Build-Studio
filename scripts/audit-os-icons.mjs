#!/usr/bin/env node
import {readFile} from 'node:fs/promises';
import {dirname,resolve,join} from 'node:path';
import {fileURLToPath} from 'node:url';
import {safeIconStem,isWebP} from './icon-utils.mjs';
import {buildSkillDisplayAliases} from './skill-icon-display-aliases.mjs';
const root=resolve(dirname(fileURLToPath(import.meta.url)),'..');
const load=async key=>JSON.parse(await readFile(join(root,'data/os',key+'.json'),'utf8'));
const [skills,items,souls]=await Promise.all(['skills','items','souls'].map(load));
const all=[];
for(const entry of Object.values(skills))if(entry.iconId)all.push({kind:'skills',stem:'skill_'+safeIconStem(entry.iconId)});
for(const entry of Object.values(items))if(entry.icon)all.push({kind:'items',stem:safeIconStem(entry.icon)});
for(const entry of Object.values(souls))if(entry.icon)all.push({kind:'souls',stem:safeIconStem(entry.icon)});
const unique=[...new Map(all.map(v=>[v.kind+'/'+v.stem,v])).values()];
const groups=Object.fromEntries(['skills','items','souls'].map(k=>[k,{expected:0,present:0,missing:0,corrupt:0}]));
const sample=[],paths=new Set(),presentPaths=new Set(),missingPaths=new Set(),
 corruptPaths=new Set(),issues=[];
for(const row of unique){
 const stats=groups[row.kind],path='assets/'+row.kind+'/icons/'+row.stem+'.webp';
 stats.expected++;paths.add(path);
 try{
  const bytes=await readFile(join(root,path));
  if(isWebP(bytes)){stats.present++;presentPaths.add(path)}
  else{stats.corrupt++;corruptPaths.add(path);
   if(sample.length<24)sample.push({path,reason:'invalid WebP'})}
 }catch(err){stats.missing++;missingPaths.add(path);
  if(sample.length<24)sample.push({path,reason:err.code||'read error'})}
}
let manifest=null;
try{manifest=JSON.parse(await readFile(join(root,'assets/os-icon-manifest.json'),'utf8'))}
catch(err){if(err.code!=='ENOENT')issues.push('Unreadable manifest: '+String(err.message))}
const totals=Object.values(groups).reduce((a,v)=>({
 expected:a.expected+v.expected,present:a.present+v.present,
 missing:a.missing+v.missing,corrupt:a.corrupt+v.corrupt
}),{expected:0,present:0,missing:0,corrupt:0});
if(manifest){
 const recordedPresent=new Set();
 for(const kind of ['skills','items','souls']){
  const entries=manifest.icons?.[kind]||{};
  for(const [stem,path] of Object.entries(entries)){
   const expectedPath='assets/'+kind+'/icons/'+stem+'.webp';
   if(!paths.has(path)||path!==expectedPath)
    issues.push('Noncanonical manifest mapping: '+kind+'/'+stem);
   if(recordedPresent.has(path))issues.push('Duplicate present manifest entry: '+path);
   recordedPresent.add(path);
   if(!presentPaths.has(path))issues.push('Manifest points to an absent or invalid WebP: '+path);
  }
 }
 for(const path of presentPaths)if(!recordedPresent.has(path))
  issues.push('Verified local WebP missing from icon manifest: '+path);
 const recordedMissing=new Set(),rows=manifest.missing;
 if(!Array.isArray(rows))issues.push('Manifest missing list is not an array');
 else for(const row of rows){
  const path='assets/'+row?.kind+'/icons/'+row?.stem+'.webp';
  if(recordedMissing.has(path))issues.push('Duplicate missing manifest entry: '+path);
  recordedMissing.add(path);
  if(!paths.has(path))issues.push('Missing entry not in live OS catalog: '+path);
  if(!missingPaths.has(path))issues.push('Stale missing entry (recovered or invalid file): '+path);
  if(row?.error!=='HTTP 404')issues.push('Unverified missing source: '+path);
 }
 for(const path of missingPaths)if(!recordedMissing.has(path))
  issues.push('Missing original has no manifest record: '+path);
 for(const path of corruptPaths)
  issues.push('Corrupt original icon: '+path);
 if(manifest.count?.expected!==totals.expected)
  issues.push('Manifest expected count differs from source catalog');
 if(manifest.count?.present!==totals.present)
  issues.push('Manifest present count differs from verified WebP');
 if(manifest.count?.missing!==totals.missing)
  issues.push('Manifest missing count differs from checked files');
 if(recordedPresent.size!==totals.present||recordedMissing.size!==totals.missing)
  issues.push('Manifest path sets do not match current disk state');
 const aliases=manifest.displayAliases?.skills||{};
 const expected=buildSkillDisplayAliases(skills,manifest.icons?.skills,manifest.missing);
 if(JSON.stringify(aliases)!==JSON.stringify(expected))
  issues.push('Skill display-only aliases differ from original catalog names and rank families');
 for(const [target,donor] of Object.entries(aliases)){
  if(!recordedMissing.has('assets/skills/icons/'+target+'.webp'))
   issues.push('Display alias target is not a missing original: '+target);
  if(!manifest.icons.skills?.[donor])
   issues.push('Display alias points to missing original: '+target+' -> '+donor);
 }
 try{
  if(!isWebP(await readFile(join(root,'assets/skills/icons/skill_unknown.webp'))))
   issues.push('Unknown skill fallback is not a valid local WebP');
 }catch{issues.push('Missing unknown skill fallback WebP')}

}
console.log(JSON.stringify({source:'data/os',...totals,groups,manifest:!!manifest,issues,examples:sample},null,2));
if(issues.length||(process.argv.includes('--strict')&&(totals.missing||totals.corrupt)))process.exitCode=1;
