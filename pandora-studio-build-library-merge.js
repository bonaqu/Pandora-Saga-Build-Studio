(function(root){
'use strict';
// Keep conflicting local and cloud snapshots: a timestamp is not an edit history.
const ID=/^[a-f0-9]{32}$/;
function reconcile({local=[],remote=[],pendingDeletes=[],activeId=null,newId,lang='ru'}={}){
 if(!Array.isArray(local)||!Array.isArray(remote)||typeof newId!=='function')
  throw Error('Invalid library merge inputs');
 const pending=new Set(Array.isArray(pendingDeletes)?pendingDeletes:[]);
 // Historical imports and previous browser bugs can create two distinct local
 // snapshots with one ID. Keep the newer revision as the original and recover
 // the remaining variants as local-only copies; never silently discard data.
 const originals=new Map(),duplicates=[];
 for(const entry of local){
  if(!entry||!ID.test(entry.id))continue;
  const previous=originals.get(entry.id);
  if(!previous){originals.set(entry.id,entry);continue}
  if((Number(entry.at)||0)>(Number(previous.at)||0)){
   duplicates.push(previous);originals.set(entry.id,entry);
  }else duplicates.push(entry);
 }
 const known=new Set([...originals.keys(),
  ...remote.filter(x=>x&&ID.test(x.id)).map(x=>x.id)]);
 // D1 uses unique build IDs. If a damaged transport unexpectedly delivers
 // two rows for one ID, never choose whichever happened to arrive first:
 // neither version is safe to upload over or display as authoritative.
 const seenRemote=new Set(),duplicateRemote=new Set();
 for(const record of remote){
  if(!record||!ID.test(record.id))continue;
  if(seenRemote.has(record.id))duplicateRemote.add(record.id);
  seenRemote.add(record.id);
 }
 const remoteIds=new Set(),merged=[],outgoing=[];
 let selected=activeId,copies=0,unavailable=0;
 const copy=(source,origin)=>{
  let id=null;
  for(let n=0;n<12;n++){
   const candidate=newId();
   if(ID.test(candidate)&&!known.has(candidate)){id=candidate;break}
  }
  if(!id)throw Error('Unable to reserve unique local conflict copy ID');
  known.add(id);copies++;
  const english=lang==='en';
  const suffix=origin==='deleted'?(english?' · deleted build copy':' · копия удалённого билда'):
   origin==='unavailable'?(english?' · recovered local copy':' · восстановленная локальная копия'):
   origin==='local'?(english?' · local copy':' · локальная копия'):
   (english?' · cloud copy':' · облачная копия');
  const duplicate={...source,id,name:String(source.name||(english?'Build':'Билд')).slice(0,70-suffix.length)+suffix,
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
 const recoveredVariants=new Map();
 for(const duplicate of duplicates){
  if(pending.has(duplicate.id)||same(duplicate,originals.get(duplicate.id)))
   continue;
  // A matching healthy cloud record already preserves this edition.
  const remotelySaved=remote.some(row=>row?.id===duplicate.id&&!row.deleted&&
   row.entry&&same(duplicate,row.entry));
  if(remotelySaved)continue;
  const variants=recoveredVariants.get(duplicate.id)||[];
  if(variants.some(previous=>same(previous,duplicate)))continue;
  variants.push(duplicate);recoveredVariants.set(duplicate.id,variants);
  copy(duplicate,'local');
 }
 for(const record of remote){
  if(!record||!ID.test(record.id)||remoteIds.has(record.id))continue;
  if(duplicateRemote.has(record.id)){
   remoteIds.add(record.id);unavailable++;
   const offline=originals.get(record.id);
   if(offline&&!pending.has(record.id)){
    const recovered=copy(offline,'unavailable');
    if(selected===record.id)selected=recovered;
   }
   continue;
  }
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
  if(record.unavailable===true||!cloud||cloud.id!==record.id||
   !Number.isSafeInteger(cloud.at)||!cloud.data||
   typeof cloud.data!=='object'||Array.isArray(cloud.data)){
   // The original cloud ID is reserved. NEVER retry PUT against it.
   remoteIds.add(record.id);unavailable++;
   const offline=originals.get(record.id);
   if(offline&&!pending.has(record.id)){
    const recovered=copy(offline,'unavailable');
    if(selected===record.id)selected=recovered;
   }
   continue;
  }
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
 for(const entry of originals.values()){
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
 return {merged,outgoing,activeId:selected,copies,unavailable};
}
root.PandoraBuildLibraryMerge=Object.freeze({reconcile});
})(typeof window==='undefined'?globalThis:window);
