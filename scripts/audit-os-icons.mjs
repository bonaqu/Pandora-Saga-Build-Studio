#!/usr/bin/env node
import {readFile} from 'node:fs/promises';
import {dirname,resolve,join} from 'node:path';
import {fileURLToPath} from 'node:url';
import {safeIconStem,isWebP} from './icon-utils.mjs';
const root=resolve(dirname(fileURLToPath(import.meta.url)),'..');
const load=async key=>JSON.parse(await readFile(join(root,'data/os',key+'.json'),'utf8'));
const [skills,items,souls]=await Promise.all(['skills','items','souls'].map(load));
const all=[];
for(const entry of Object.values(skills))if(entry.iconId)all.push({kind:'skills',stem:'skill_'+safeIconStem(entry.iconId)});
for(const entry of Object.values(items))if(entry.icon)all.push({kind:'items',stem:safeIconStem(entry.icon)});
for(const entry of Object.values(souls))if(entry.icon)all.push({kind:'souls',stem:safeIconStem(entry.icon)});
const unique=[...new Map(all.map(v=>[v.kind+'/'+v.stem,v])).values()];
const groups=Object.fromEntries(['skills','items','souls'].map(k=>[k,{expected:0,present:0,missing:0,corrupt:0}]));
const sample=[],paths=new Set(),issues=[];
for(const row of unique){
 const stats=groups[row.kind],path='assets/'+row.kind+'/icons/'+row.stem+'.webp';
 stats.expected++;paths.add(path);
 try{
  const bytes=await readFile(join(root,path));
  if(isWebP(bytes))stats.present++;
  else{stats.corrupt++;if(sample.length<24)sample.push({path,reason:'invalid WebP'})}
 }catch(err){stats.missing++;if(sample.length<24)sample.push({path,reason:err.code||'read error'})}
}
let manifest=null;
try{manifest=JSON.parse(await readFile(join(root,'assets/os-icon-manifest.json'),'utf8'))}
catch(err){if(err.code!=='ENOENT')issues.push('Unreadable manifest: '+String(err.message))}
if(manifest){
 for(const kind of ['skills','items','souls'])
  for(const [stem,path] of Object.entries(manifest.icons?.[kind]||{}))
   if(!paths.has(path)||path!=='assets/'+kind+'/icons/'+stem+'.webp')
    issues.push('Noncanonical manifest mapping: '+kind+'/'+stem);
 const count=Object.values(groups).reduce((n,row)=>n+row.present,0);
 if(manifest.count?.present!==count)issues.push('Manifest count differs from verified files');
}
const totals=Object.values(groups).reduce((a,v)=>({
 expected:a.expected+v.expected,present:a.present+v.present,
 missing:a.missing+v.missing,corrupt:a.corrupt+v.corrupt
}),{expected:0,present:0,missing:0,corrupt:0});
console.log(JSON.stringify({source:'data/os',...totals,groups,manifest:!!manifest,issues,examples:sample},null,2));
if(issues.length||(process.argv.includes('--strict')&&(totals.missing||totals.corrupt)))process.exitCode=1;
