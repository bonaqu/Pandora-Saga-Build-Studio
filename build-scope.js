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
  if(next==='')storage.removeItem(key);else storage.setItem(key,next);
  sync(storage);
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
function transition(storage,next,{carry=false,legacyOwner=null}={}){
 if(!validScope(next))throw Error('Invalid library owner context');
 const raw=storage.getItem(MARKER);
 const previous=validScope(raw)?raw:validScope(legacyOwner)?legacyOwner:next;
 // A pre-upgrade cache is attributed to its former owner before switching.
 if(!raw||previous===next)syncWithOwner(storage,previous);
 if(previous===next){
  storage.setItem(MARKER,next);
  sync(storage);return {changed:false,owner:next,previous};
 }
 // Do not accidentally overwrite a newer saved context on a second tab.
 syncWithOwner(storage,previous);
 let saved=null;
 if(!carry){
  try{const restored=JSON.parse(storage.getItem(slot(next))||'null');
   if(Array.isArray(restored)&&restored.length===KEYS.length)saved=restored;
  }catch{}
 }
 write(storage,saved|| (carry?snapshotBeforeSwitch(storage):DEFAULTS));
 storage.setItem(MARKER,next);sync(storage);
 return {changed:true,owner:next,previous};
}
function snapshotBeforeSwitch(storage){return snapshot(storage)}
function syncWithOwner(storage,current){
 if(!validScope(current))return;
 storage.setItem(slot(current),JSON.stringify(snapshot(storage)));
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
