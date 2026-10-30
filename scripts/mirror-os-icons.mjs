#!/usr/bin/env node
// One-time asset mirror. Run on a computer with Node 20+ and internet access.
// Never runs on the website and does not need GitHub Actions or Cloudflare secrets.
import {readFile,writeFile,mkdir,rename,stat} from 'node:fs/promises';
import {join,dirname} from 'node:path';
import {fileURLToPath} from 'node:url';
const root=join(dirname(fileURLToPath(import.meta.url)),'..');
const dry=process.argv.includes('--dry-run'),retries=2,concurrency=8;
const json=async file=>JSON.parse(await readFile(join(root,'data/os',file+'.json'),'utf8'));
const [skills,items,souls]=await Promise.all(['skills','items','souls'].map(json));
const list=[];
for(const r of Object.values(skills))if(r.iconId)list.push({kind:'skills',stem:'skill_'+r.iconId});
for(const r of Object.values(items))if(r.icon)list.push({kind:'items',stem:r.icon});
for(const r of Object.values(souls))if(r.icon)list.push({kind:'souls',stem:r.icon});
const unique=[...new Map(list.map(v=>[v.kind+'/'+v.stem,v])).values()];
const manifest={source:'Pandora Saga OS, one-time archive',createdAt:new Date().toISOString(),icons:{skills:{},items:{},souls:{}},missing:[]};
let done=0,fail=0,index=0;
const valid=(buffer)=>buffer.length>16&&String.fromCharCode(...buffer.subarray(0,4))==='RIFF'&&
 String.fromCharCode(...buffer.subarray(8,12))==='WEBP';
async function one(row){
 const file='assets/'+row.kind+'/icons/'+row.stem+'.webp';
 const path=join(root,file);
 try{
  try{const old=await readFile(path);if(valid(old)){manifest.icons[row.kind][row.stem]=file;done++;return}}catch{}
  if(dry){manifest.icons[row.kind][row.stem]=file;done++;return}
  const url='https://pandorasaga-os.com/icons/'+row.kind+'/'+row.stem+'.webp';
  let last;
  for(let n=0;n<=retries;n++){
   try{
    const c=new AbortController(),timer=setTimeout(()=>c.abort(),14000);
    let response;
    try{response=await fetch(url,{signal:c.signal,redirect:'error'})}
    finally{clearTimeout(timer)}
    if(!response.ok)throw Error('HTTP '+response.status);
    const bytes=new Uint8Array(await response.arrayBuffer());
    if(!valid(bytes))throw Error('Not a valid WebP image');
    await mkdir(dirname(path),{recursive:true});
    const temp=path+'.partial';await writeFile(temp,bytes);await rename(temp,path);
    manifest.icons[row.kind][row.stem]=file;done++;return;
   }catch(e){last=e;if(n<retries)await new Promise(resolve=>setTimeout(resolve,400*(n+1)))}
  }
  throw last;
 }catch(e){fail++;manifest.missing.push({kind:row.kind,stem:row.stem,error:String(e.message||e)})}
}
async function worker(){while(index<unique.length){const i=index++;await one(unique[i]);if((i+1)%100===0)console.log(i+1,'/',unique.length,'processed')}}
await Promise.all(Array.from({length:concurrency},worker));
manifest.count={expected:unique.length,present:done,missing:fail};
if(!dry){await mkdir(join(root,'assets'),{recursive:true});await writeFile(join(root,'assets','os-icon-manifest.json'),JSON.stringify(manifest,null,2)+'\n')}
console.log(JSON.stringify({dryRun:dry,...manifest.count}));
if(fail)process.exitCode=1;
