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
  const suffix=origin==='deleted'?' · копия удалённого билда':
   origin==='local'?' · локальная копия':' · облачная копия';
  const duplicate={...source,id,name:String(source.name||'Билд').slice(0,70-suffix.length)+suffix,
   at:Math.max(Date.now(),Number(source.at)||0),localOnly:true};
  merged.push(duplicate); // A conflict copy stays local until explicitly saved.
  return id;
 };
 // JSON object key insertion order is not character progress. D1, browser
 // migrations and historical imports may serialize identical snapshots
 // differently. Arrays and actual values must still compare exactly.
 const equivalent=(a,b)=>{
  if(a===b)return true;
  if(a===null||b===null||typeof a!=='object'||typeof b!=='object')return false;
  if(Array.isArray(a)!==Array.isArray(b))return false;
  const aKeys=Object.keys(a),bKeys=Object.keys(b);
  if(aKeys.length!==bKeys.length)return false;
  for(const key of aKeys){
   if(!Object.hasOwn(b,key)||!equivalent(a[key],b[key]))return false;
  }
  return true;
 };
 const same=(a,b)=>{
  try{return a.name===b.name&&equivalent(a.data,b.data)}
  catch{return false}
 };
 for(const record of remote){
  if(!record||!ID.test(record.id)||remoteIds.has(record.id))continue;
  if(record.deleted){
   // The D1 tombstone remains authoritative. Preserve an offline snapshot only
   // under a new browser-only ID; never revive the deleted original or its links.
   remoteIds.add(record.id);
   const offline=originals.get(record.id);
   if(offline&&!pending.has(record.id)){
    const recovered=copy(offline,'deleted');
    if(selected===record.id)selected=recovered;
   }
   continue;
  }
  const cloud=record.entry;
  if(!cloud||cloud.id!==record.id||!Number.isSafeInteger(cloud.at)||
    !cloud.data||typeof cloud.data!=='object'||Array.isArray(cloud.data))continue;
  remoteIds.add(record.id);
  if(pending.has(record.id))continue;
  const browser=originals.get(record.id);
  if(!browser){merged.push(cloud);continue}
  // D1 is authoritative for an existing saved ID, regardless of local timestamps.
  // Different local edits are preserved as a new explicitly-saved build,
  // but never silently overwrite the cloud original.
  merged.push(cloud);
  if(!same(browser,cloud)){
   const copyId=copy(browser,'local');
   if(selected===record.id)selected=copyId;
  }
 }
 for(const entry of local){
  if(!entry||!ID.test(entry.id)||remoteIds.has(entry.id)||
   pending.has(entry.id))continue;
  if(known.has(entry.id)&&merged.some(x=>x.id===entry.id))continue;
  merged.push(entry);
  // A conflict copy is a private browser-only recovery snapshot until manually saved.
  if(entry.localOnly!==true)outgoing.push(entry);
  remoteIds.add(entry.id);
 }
 merged.sort((a,b)=>(b.at||0)-(a.at||0));
 if(selected&&!merged.some(x=>x.id===selected))selected=null;
 return {merged,outgoing,activeId:selected,copies};
}
root.PandoraBuildLibraryMerge=Object.freeze({reconcile});
})(typeof window==='undefined'?globalThis:window);
