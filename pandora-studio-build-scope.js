(function(root){
'use strict';
// Keep browser-only drafts, saved records and queued deletions separate for each owner.
// The original active storage keys are retained for backwards compatibility.
const MARKER='ps-build-owner-scope.v1';
const PREFIX='ps-build-scope-cache.v1:';
const KEYS=['ps-build-library.v1','ps-build-studio.v1',
 'ps-build-library-pending-deletes.v1','ps-active-build-id.v1'];
const DEFAULTS=['[]','', '[]', ''];
const validScope=value=>typeof value==='string'&&
 (/^account:[a-z][a-z0-9_]{2,19}$/.test(value)||
 /^guest:[a-f0-9]{64}$/.test(value));
const owner=(username,guestKey)=>typeof username==='string'&&
 /^[a-z][a-z0-9_]{2,19}$/.test(username.toLowerCase())?
 'account:'+username.toLowerCase():'guest:'+guestKey;
function snapshot(storage){
 return KEYS.map((key,i)=>storage.getItem(key)??DEFAULTS[i]);
}
function write(storage,values){
 for(let i=0;i<KEYS.length;i++){
  const value=values?.[i]??DEFAULTS[i];
  if(value==='')storage.removeItem(KEYS[i]);
  else storage.setItem(KEYS[i],String(value));
 }
}
const slot=scope=>PREFIX+scope;
function storedSnapshot(storage,scope){
 try{
  const value=JSON.parse(storage.getItem(slot(scope))||'null');
  return Array.isArray(value)&&value.length===KEYS.length?value:DEFAULTS.slice();
 }catch{return DEFAULTS.slice()}
}
// Multiple tabs can be signed into different accounts while sharing localStorage.
// A tab may only write the generic active keys if those keys belong to its owner.
// Otherwise save to that owner's own recovery cache and leave the other tab intact.
function getOwned(storage,scope,key){
 if(!validScope(scope)||!KEYS.includes(key))throw Error('Invalid owner or storage key');
 const index=KEYS.indexOf(key);
 return storage.getItem(MARKER)===scope?
  storage.getItem(key)??DEFAULTS[index]:
  storedSnapshot(storage,scope)[index]??DEFAULTS[index];
}
function setOwned(storage,scope,key,value){
 if(!validScope(scope)||!KEYS.includes(key))throw Error('Invalid owner or storage key');
 const index=KEYS.indexOf(key),next=value==null?DEFAULTS[index]:String(value);
 if(storage.getItem(MARKER)===scope){
  // A different tab may claim the shared primary slots at ANY storage
  // operation. Capture this owner's complete state before writing anything.
  const values=snapshot(storage);
  if(storage.getItem(MARKER)!==scope){
   // The other tab has already switched ownership: never mirror into its
   // active keys. Its transition has saved our previous state in our cache.
   const own=storedSnapshot(storage,scope);
   own[index]=next;
   storage.setItem(slot(scope),JSON.stringify(own));
   return true;
  }
  const previousBackup=storage.getItem(slot(scope));
  values[index]=next;
  // Commit the independent owner recovery copy FIRST. If this hits quota,
  // not even one shared primary key is changed.
  storage.setItem(slot(scope),JSON.stringify(values));
  // A concurrent switch may copy the OLD primary snapshot over our freshly
  // stored cache. Reapply this ONE key after the switch using the recovered
  // owner snapshot, rather than overwriting the other owner's active keys.
  if(storage.getItem(MARKER)!==scope){
   const own=storedSnapshot(storage,scope);
   own[index]=next;
   storage.setItem(slot(scope),JSON.stringify(own));
   return true;
  }
  const previous=storage.getItem(key);
  try{
   if(next==='')storage.removeItem(key);else storage.setItem(key,next);
  }catch(error){
   // The primary write failed. Restore the old recovery copy so the app
   // cannot report this edit as durable when the primary slot stayed stale.
   // Do not roll back a key now owned by another browser tab.
   if(storage.getItem(MARKER)===scope)try{
    if(previous===null)storage.removeItem(key);
    else storage.setItem(key,previous);
   }catch{}
   try{
    if(previousBackup===null)storage.removeItem(slot(scope));
    else storage.setItem(slot(scope),previousBackup);
   }catch(rollbackError){
    throw Error('Could not roll back owner-scoped save after primary failure',{
     cause:rollbackError
    });
   }
   throw error;
  }
 }else{
  const values=storedSnapshot(storage,scope);
  values[index]=next;
  storage.setItem(slot(scope),JSON.stringify(values));
 }
 return true;
}
function sync(storage){
 const current=storage.getItem(MARKER);
 if(!validScope(current))return false;
 storage.setItem(slot(current),JSON.stringify(snapshot(storage)));
 return true;
}
function transition(storage,next,{carry=false,carryFrom=null,legacyOwner=null}={}){
 if(!validScope(next))throw Error('Invalid library owner context');
 const raw=storage.getItem(MARKER);
 const previous=validScope(raw)?raw:validScope(legacyOwner)?legacyOwner:next;
 // A pre-upgrade cache is attributed to its former owner before switching.
 if(!raw||previous===next)syncWithOwner(storage,previous);
 if(previous===next){
  try{storage.setItem(MARKER,next);sync(storage)}
  catch(error){
   // An initial, same-owner claim must not leave an incorrect marker behind.
   try{if(raw===null)storage.removeItem(MARKER);else storage.setItem(MARKER,raw)}catch{}
   throw error;
  }
  return {changed:false,owner:next,previous};
 }
 // Do not accidentally overwrite a newer saved context on a second tab.
 syncWithOwner(storage,previous);
 let saved=null;
 if(carry){
  // A different tab may currently own the shared top-level keys. Carry only
  // the initiating tab's guest records, never that other tab's active records.
  const source=validScope(carryFrom)?carryFrom:previous;
  saved=source===previous?snapshotBeforeSwitch(storage):storedSnapshot(storage,source);
 }else{
  try{const restored=JSON.parse(storage.getItem(slot(next))||'null');
   if(Array.isArray(restored)&&restored.length===KEYS.length)saved=restored;
  }catch{}
 }
 const before=KEYS.map(key=>storage.getItem(key));
 try{
  write(storage,saved||DEFAULTS);
  storage.setItem(MARKER,next);
  sync(storage);
 }catch(error){
  // Avoid half-switched owner data if any write or final backup fails.
  if(!restorePrimary(storage,before,raw))
   throw Error('Could not restore local library after failed owner switch',{cause:error});
  throw error;
 }
 return {changed:true,owner:next,previous};
}
function snapshotBeforeSwitch(storage){return snapshot(storage)}
function syncWithOwner(storage,current){
 if(!validScope(current))return;
 storage.setItem(slot(current),JSON.stringify(snapshot(storage)));
}
// localStorage is not transactional. If switching owners fails halfway through
// (quota, browser storage restrictions), restore every original primary slot
// and the scope marker. Use raw nulls, not the fallback [] defaults, so a
// previously missing key stays missing after rollback.
function restorePrimary(storage,values,marker){
 let restored=true;
 for(let i=0;i<KEYS.length;i++){
  try{
   if(values[i]===null)storage.removeItem(KEYS[i]);
   else storage.setItem(KEYS[i],values[i]);
  }catch{restored=false}
 }
 try{
  if(marker===null)storage.removeItem(MARKER);
  else storage.setItem(MARKER,marker);
 }catch{restored=false}
 return restored;
}
// Releases before 0.197 kept the guest's saved builds in a separate backup when
// signing into an account. Import it once into the GUEST cache without touching
// the current account data or issuing network requests.
function migrateLegacyGuest(storage,guestKey){
 const guest=owner(null,guestKey);
 if(!validScope(guest)||storage.getItem(slot(guest))!==null)return false;
 const old=storage.getItem('ps-preaccount-library.v1');
 if(!old)return false;
 try{
  const rows=JSON.parse(old);
  if(!Array.isArray(rows)||rows.some(x=>!x||typeof x!=='object'||
   !/^[a-f0-9]{32}$/.test(x.id)||!x.data||typeof x.data!=='object'))
   return false;
  storage.setItem(slot(guest),JSON.stringify([JSON.stringify(rows),'','[]','']));
  return true;
 }catch{return false}
}
root.PandoraBuildScope=Object.freeze({owner,transition,sync,getOwned,setOwned,migrateLegacyGuest,MARKER});
})(typeof window==='undefined'?globalThis:window);
