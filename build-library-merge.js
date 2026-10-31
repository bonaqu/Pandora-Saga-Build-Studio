(function(root){
'use strict';
// Keep conflicting local and cloud snapshots: a timestamp is not an edit history.
const ID=/^[a-f0-9]{32}$/;
function reconcile({local=[],remote=[],pendingDeletes=[],activeId=null,newId}={}){
 if(!Array.isArray(local)||!Array.isArray(remote)||typeof newId!=='function')
  throw Error('Invalid library merge inputs');
 const pending=new Set(Array.isArray(pendingDeletes)?pendingDeletes:[]);
 const originals=new Map(local.filter(x=>x&&ID.test(x.id)).map(x=>[x.id,x]));
 const known=new Set([...originals.keys(),
  ...remote.filter(x=>x&&ID.test(x.id)).map(x=>x.id)]);
 const remoteIds=new Set(),merged=[],outgoing=[];
 let selected=activeId,copies=0;
 const copy=(source,origin)=>{
  let id=null;
  for(let n=0;n<12;n++){
   const candidate=newId();
   if(ID.test(candidate)&&!known.has(candidate)){id=candidate;break}
  }
  if(!id)throw Error('Unable to reserve unique local conflict copy ID');
  known.add(id);copies++;
  const suffix=origin==='local'?' · локальная копия':' · облачная копия';
  const duplicate={...source,id,name:String(source.name||'Билд').slice(0,70-suffix.length)+suffix,
   at:Math.max(Date.now(),Number(source.at)||0)};
  merged.push(duplicate);outgoing.push(duplicate);
  return id;
 };
 const same=(a,b)=>{
  try{return a.name===b.name&&JSON.stringify(a.data)===JSON.stringify(b.data)}
  catch{return false}
 };
 for(const record of remote){
  if(!record||!ID.test(record.id)||remoteIds.has(record.id))continue;
  if(record.deleted){
   remoteIds.add(record.id);continue;
  }
  const cloud=record.entry;
  if(!cloud||cloud.id!==record.id||!Number.isSafeInteger(cloud.at)||
    !cloud.data||typeof cloud.data!=='object'||Array.isArray(cloud.data))continue;
  remoteIds.add(record.id);
  if(pending.has(record.id))continue;
  const browser=originals.get(record.id);
  if(!browser){merged.push(cloud);continue}
  const newerLocal=Number(browser.at)>cloud.at;
  const winner=newerLocal?browser:cloud,loser=newerLocal?cloud:browser;
  merged.push(winner);
  if(newerLocal)outgoing.push(browser);
  if(!same(browser,cloud)){
   const copyId=copy(loser,newerLocal?'cloud':'local');
   if(!newerLocal&&selected===record.id)selected=copyId;
  }
 }
 for(const entry of local){
  if(!entry||!ID.test(entry.id)||remoteIds.has(entry.id)||
   pending.has(entry.id))continue;
  if(known.has(entry.id)&&merged.some(x=>x.id===entry.id))continue;
  merged.push(entry);outgoing.push(entry);
  remoteIds.add(entry.id);
 }
 merged.sort((a,b)=>(b.at||0)-(a.at||0));
 if(selected&&!merged.some(x=>x.id===selected))selected=null;
 return {merged,outgoing,activeId:selected,copies};
}
root.PandoraBuildLibraryMerge=Object.freeze({reconcile});
})(typeof window==='undefined'?globalThis:window);
