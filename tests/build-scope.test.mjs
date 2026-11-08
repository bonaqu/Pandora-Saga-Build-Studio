import test from 'node:test';
import assert from 'node:assert/strict';
import {readFileSync} from 'node:fs';
import vm from 'node:vm';
const scope={};scope.window=scope;
vm.runInNewContext(readFileSync(new URL('../pandora-studio-build-scope.js',import.meta.url),'utf8'),scope);
const mod=scope.PandoraBuildScope;
const ownerA=mod.owner('alice_01','a'.repeat(64));
const ownerB=mod.owner('bob_222','a'.repeat(64));
const guest=mod.owner(null,'a'.repeat(64));
function storage(){
 const db=new Map();
 return {getItem:key=>db.has(key)?db.get(key):null,
 setItem:(key,value)=>db.set(key,String(value)),removeItem:key=>db.delete(key)};
}
const keys=['ps-build-library.v1','ps-build-studio.v1',
 'ps-build-library-pending-deletes.v1','ps-active-build-id.v1'];
function put(s,build,level,del='[]'){
 s.setItem(keys[0],JSON.stringify([{id:build,data:{level}}]));
 s.setItem(keys[1],JSON.stringify({level,name:build}));
 s.setItem(keys[2],del);
}
test('login never merges one account or guest builds into another account',()=>{
 const s=storage();put(s,'Guest',33,'["'+ 'a'.repeat(32)+'"]');
 mod.transition(s,guest);
 const a=mod.transition(s,ownerA);
 assert.equal(a.changed,true);assert.equal(s.getItem(keys[0]),'[]');
 assert.equal(s.getItem(keys[2]),'[]');
 put(s,'Alice',44,'["'+'b'.repeat(32)+'"]');mod.sync(s);
 mod.transition(s,ownerB);
 assert.equal(s.getItem(keys[0]),'[]');assert.equal(s.getItem(keys[2]),'[]');
 put(s,'Bob',55);mod.sync(s);
 mod.transition(s,ownerA);
 assert.equal(JSON.parse(s.getItem(keys[0]))[0].id,'Alice');
 assert.equal(JSON.parse(s.getItem(keys[1])).level,44);
 assert.equal(JSON.parse(s.getItem(keys[2]))[0],'b'.repeat(32));
 mod.transition(s,guest);
 assert.equal(JSON.parse(s.getItem(keys[0]))[0].id,'Guest');
 assert.equal(JSON.parse(s.getItem(keys[1])).level,33);
});
test('registration intentionally adopts the current guest saves but retains guest recovery',()=>{
 const s=storage();put(s,'Guest',25);mod.transition(s,guest);
 const result=mod.transition(s,ownerA,{carry:true});
 assert.equal(result.changed,true);
 assert.equal(JSON.parse(s.getItem(keys[0]))[0].id,'Guest');
 put(s,'My account',42);mod.sync(s);
 mod.transition(s,guest);
 assert.equal(JSON.parse(s.getItem(keys[0]))[0].id,'Guest');
 mod.transition(s,ownerA);
 assert.equal(JSON.parse(s.getItem(keys[0]))[0].id,'My account');
});
test('migration attributes legacy unsorted cache to an expired account session',()=>{
 const s=storage();put(s,'Old account',55);
 mod.transition(s,guest,{legacyOwner:ownerA});
 assert.equal(s.getItem(keys[0]),'[]');
 mod.transition(s,ownerA);
 assert.equal(JSON.parse(s.getItem(keys[0]))[0].id,'Old account');
});
test('persisting a draft or queued deletion has an owner-specific recovery cache',()=>{
 const s=storage();put(s,'A',45);mod.transition(s,ownerA);
 s.setItem(keys[1],JSON.stringify({level:55}));mod.sync(s);
 mod.transition(s,guest);mod.transition(s,ownerA);
 assert.equal(JSON.parse(s.getItem(keys[1])).level,55);
 assert.equal(mod.transition(s,ownerA).changed,false);
});

test('malformed remembered username never crashes the guest scope boundary',()=>{
 assert.equal(mod.owner(42,'a'.repeat(64)),guest);
 assert.equal(mod.owner(null,'a'.repeat(64)),guest);
});

test('pre-0.197 guest backup remains accessible after account sign-out',()=>{
 const s=storage();put(s,'Alice',45);s.setItem('ps-account-session.v1',
  JSON.stringify({username:'alice_01'}));
 const oldGuest=[{id:'9'.repeat(32),name:'Guest saved before accounts',data:{level:55}}];
 s.setItem('ps-preaccount-library.v1',JSON.stringify(oldGuest));
 assert.equal(mod.migrateLegacyGuest(s,'a'.repeat(64)),true);
 assert.equal(mod.migrateLegacyGuest(s,'a'.repeat(64)),false);
 mod.transition(s,ownerA);
 mod.transition(s,guest);
 assert.equal(JSON.parse(s.getItem(keys[0]))[0].name,'Guest saved before accounts');
 mod.transition(s,ownerA);
 assert.equal(JSON.parse(s.getItem(keys[0]))[0].id,'Alice');
 assert.ok(s.getItem('ps-preaccount-library.v1'),
  'Never delete old backup without confirmed user recovery');
});
test('legacy backup cannot overwrite an existing guest context or import malformed records',()=>{
 const s=storage();put(s,'Guest',30);mod.transition(s,guest);
 s.setItem('ps-preaccount-library.v1',JSON.stringify([{id:'1'.repeat(32),
  data:{level:55}}]));
 assert.equal(mod.migrateLegacyGuest(s,'a'.repeat(64)),false);
 mod.transition(s,ownerA);mod.transition(s,guest);
 assert.equal(JSON.parse(s.getItem(keys[0]))[0].id,'Guest');
 const broken=storage();broken.setItem('ps-preaccount-library.v1',
  JSON.stringify([{id:'not an id',data:{}}]));
 assert.equal(mod.migrateLegacyGuest(broken,'a'.repeat(64)),false);
});

test('a stale Alice tab cannot overwrite Bob primary saves, draft, or deletion queue',()=>{
 const s=storage();
 mod.transition(s,ownerA);put(s,'Alice',45,'["'+'a'.repeat(32)+'"]');mod.sync(s);
 mod.transition(s,ownerB);put(s,'Bob',55,'["'+'b'.repeat(32)+'"]');mod.sync(s);
 const bob=keys.map(k=>s.getItem(k));
 mod.setOwned(s,ownerA,keys[0],JSON.stringify([{id:'a'.repeat(32),data:{level:46}}]));
 mod.setOwned(s,ownerA,keys[1],JSON.stringify({level:46}));
 mod.setOwned(s,ownerA,keys[2],JSON.stringify(['c'.repeat(32)]));
 mod.setOwned(s,ownerA,keys[3],'a'.repeat(32));
 assert.deepEqual(keys.map(k=>s.getItem(k)),bob,
  'An old account tab must leave active Bob keys untouched');
 assert.equal(JSON.parse(mod.getOwned(s,ownerA,keys[0]))[0].data.level,46);
 assert.equal(JSON.parse(mod.getOwned(s,ownerA,keys[1])).level,46);
 assert.deepEqual(JSON.parse(mod.getOwned(s,ownerA,keys[2])),['c'.repeat(32)]);
 assert.equal(mod.getOwned(s,ownerA,keys[3]),'a'.repeat(32));
 mod.transition(s,ownerA);
 assert.equal(JSON.parse(s.getItem(keys[0]))[0].data.level,46);
 mod.transition(s,ownerB);
 assert.equal(JSON.parse(s.getItem(keys[0]))[0].id,'Bob');
 assert.equal(JSON.parse(s.getItem(keys[2]))[0],'b'.repeat(32));
});
test('only owning tab writes active keys; unowned snapshot fallback is empty',()=>{
 const s=storage();mod.transition(s,guest);
 mod.setOwned(s,guest,keys[1],JSON.stringify({level:55}));
 assert.equal(JSON.parse(s.getItem(keys[1])).level,55);
 assert.equal(JSON.parse(mod.getOwned(s,guest,keys[1])).level,55);
 assert.equal(mod.getOwned(s,ownerA,keys[0]),'[]');
 assert.equal(mod.getOwned(s,ownerA,keys[1]),'');
 assert.throws(()=>mod.setOwned(s,'other',keys[0],'[]'),/Invalid owner/);
 assert.throws(()=>mod.getOwned(s,guest,'ps-account-session.v1'),/Invalid owner/);
});

test('cross-tab guest library transfer only carries the initiating guest, never the active stranger',()=>{
 const s=storage();
 const guestB=mod.owner(null,'b'.repeat(64));
 const guestC=mod.owner(null,'c'.repeat(64));
 mod.transition(s,guest);put(s,'Guest A',30);mod.sync(s);
 mod.transition(s,guestB);put(s,'Guest B',40);mod.sync(s);
 const result=mod.transition(s,guestC,{carry:true,carryFrom:guest});
 assert.equal(result.changed,true);
 assert.equal(JSON.parse(s.getItem(keys[0]))[0].id,'Guest A',
  'Guest C may import only initiating tab A when another tab B owns primary keys');
 mod.transition(s,guestB);
 assert.equal(JSON.parse(s.getItem(keys[0]))[0].id,'Guest B');
 mod.transition(s,guest);
 assert.equal(JSON.parse(s.getItem(keys[0]))[0].id,'Guest A');
});

test('quota failure while writing owner backup rolls back the primary saved-build slot',()=>{
 const store=storage();mod.transition(store,ownerA);
 mod.setOwned(store,ownerA,keys[0],JSON.stringify([{name:'Original',id:'a'.repeat(32)}]));
 const before=store.getItem(keys[0]);
 const fragile={
  getItem:key=>store.getItem(key),
  removeItem:key=>store.removeItem(key),
  setItem:(key,value)=>{
   if(key==='ps-build-scope-cache.v1:'+ownerA)throw Error('Quota exceeded on backup');
   store.setItem(key,value);
  }
 };
 assert.throws(()=>mod.setOwned(fragile,ownerA,keys[0],
  JSON.stringify([{name:'New',id:'b'.repeat(32)}])),/Quota exceeded/);
 assert.equal(store.getItem(keys[0]),before,
  'Primary library must not change when the recovery snapshot write fails');
});

test('a partially failed owner switch restores every old primary key and marker',()=>{
 const s=storage();mod.transition(s,ownerA);
 put(s,'Alice preserved',42,'["'+ 'c'.repeat(32)+'"]');
 s.setItem(keys[3],'a'.repeat(32));mod.sync(s);
 mod.setOwned(s,ownerB,keys[0],JSON.stringify([{id:'Bob future',data:{level:55}}]));
 mod.setOwned(s,ownerB,keys[1],JSON.stringify({level:55,name:'Bob future'}));
 const before=keys.map(key=>s.getItem(key)),marker=s.getItem(mod.MARKER);
 let fail=true;
 const fragile={getItem:key=>s.getItem(key),removeItem:key=>s.removeItem(key),
  setItem:(key,value)=>{
   if(key===keys[2]&&fail){fail=false;throw Error('Simulated quota during owner switch')}
   s.setItem(key,value);
  }};
 assert.throws(()=>mod.transition(fragile,ownerB),/Simulated quota/);
 assert.deepEqual(keys.map(key=>s.getItem(key)),before);
 assert.equal(s.getItem(mod.MARKER),marker);
 assert.equal(JSON.parse(mod.getOwned(s,ownerA,keys[0]))[0].id,'Alice preserved');
 mod.transition(s,ownerB);
 assert.equal(JSON.parse(s.getItem(keys[0]))[0].id,'Bob future');
 mod.transition(s,ownerA);
 assert.equal(JSON.parse(s.getItem(keys[0]))[0].id,'Alice preserved');
});

test('failed destination recovery-cache sync also rolls back owner switch',()=>{
 const s=storage();mod.transition(s,ownerA);put(s,'Alice kept',44);mod.sync(s);
 mod.setOwned(s,ownerB,keys[0],JSON.stringify([{id:'Bob cached',data:{level:55}}]));
 const before=keys.map(key=>s.getItem(key)),marker=s.getItem(mod.MARKER);
 let fail=true;
 const fragile={getItem:key=>s.getItem(key),removeItem:key=>s.removeItem(key),
  setItem:(key,value)=>{
   if(key==='ps-build-scope-cache.v1:'+ownerB&&fail){
    fail=false;throw Error('Simulated quota on destination backup');
   }
   s.setItem(key,value);
  }};
 assert.throws(()=>mod.transition(fragile,ownerB),/Simulated quota/);
 assert.deepEqual(keys.map(key=>s.getItem(key)),before);
 assert.equal(s.getItem(mod.MARKER),marker);
 assert.equal(JSON.parse(mod.getOwned(s,ownerB,keys[0]))[0].id,'Bob cached');
});

test('failure claiming the initial scope restores the previous absent marker',()=>{
 const s=storage();put(s,'Guest initial',20);
 let fail=true;
 const fragile={getItem:key=>s.getItem(key),removeItem:key=>s.removeItem(key),
  setItem:(key,value)=>{
   if(key===mod.MARKER&&fail){fail=false;throw Error('Marker storage denied')}
   s.setItem(key,value);
  }};
 assert.throws(()=>mod.transition(fragile,guest),/Marker storage denied/);
 assert.equal(s.getItem(mod.MARKER),null);
 assert.equal(JSON.parse(s.getItem(keys[0]))[0].id,'Guest initial');
 mod.transition(s,guest);
 assert.equal(s.getItem(mod.MARKER),guest);
});

test('failure setting the new owner marker rolls back already-written primary data',()=>{
 const s=storage();mod.transition(s,ownerA);put(s,'Alice owner',43);mod.sync(s);
 mod.setOwned(s,ownerB,keys[0],JSON.stringify([{id:'Bob inactive',data:{level:55}}]));
 const before=keys.map(key=>s.getItem(key));
 let fail=true;
 const fragile={getItem:key=>s.getItem(key),removeItem:key=>s.removeItem(key),
  setItem:(key,value)=>{
   if(key===mod.MARKER&&value===ownerB&&fail){
    fail=false;throw Error('Marker write rejected after primary data');
   }
   s.setItem(key,value);
  }};
 assert.throws(()=>mod.transition(fragile,ownerB),/Marker write rejected/);
 assert.deepEqual(keys.map(key=>s.getItem(key)),before);
 assert.equal(s.getItem(mod.MARKER),ownerA);
 assert.equal(JSON.parse(mod.getOwned(s,ownerB,keys[0]))[0].id,'Bob inactive');
});


test('cross-tab owner switch during a draft save preserves both recovery copies',()=>{
 const store=storage();
 mod.transition(store,ownerA);
 mod.setOwned(store,ownerA,keys[1],JSON.stringify({name:'Alice original',level:45}));
 mod.setOwned(store,ownerB,keys[1],JSON.stringify({name:'Bob own',level:55}));
 const newDraft=JSON.stringify({name:'Alice edited',level:46});
 let switched=false;
 const interleaved={
  getItem:key=>store.getItem(key),
  removeItem:key=>store.removeItem(key),
  setItem:(key,value)=>{
   store.setItem(key,value);
   // Model an actual second browser tab switching the shared owner while
   // the first tab is committing its owner-specific recovery snapshot.
   if(key==='ps-build-scope-cache.v1:'+ownerA&&!switched){
    switched=true;
    mod.transition(store,ownerB);
   }
  }
 };
 assert.equal(mod.setOwned(interleaved,ownerA,keys[1],newDraft),true);
 assert.equal(switched,true);
 assert.equal(store.getItem(mod.MARKER),ownerB);
 assert.equal(JSON.parse(store.getItem(keys[1])).name,'Bob own',
  'Alice may not overwrite Bob active primary draft after the owner switches');
 assert.equal(JSON.parse(mod.getOwned(store,ownerA,keys[1])).name,'Alice edited',
  'The concurrent switch must not erase Alice just-saved recovery draft');
 assert.equal(JSON.parse(mod.getOwned(store,ownerB,keys[1])).name,'Bob own');
 mod.transition(store,ownerA);
 assert.equal(JSON.parse(store.getItem(keys[1])).name,'Alice edited');
 mod.transition(store,ownerB);
 assert.equal(JSON.parse(store.getItem(keys[1])).name,'Bob own');
});

test('owner marker changing while gathering the primary snapshot selects scoped cache',()=>{
 const store=storage();
 mod.transition(store,ownerA);
 mod.setOwned(store,ownerA,keys[0],JSON.stringify([{name:'Alice original'}]));
 mod.setOwned(store,ownerB,keys[0],JSON.stringify([{name:'Bob original'}]));
 let markerReads=0,switched=false;
 const interleaved={
  getItem:key=>{
   if(key===mod.MARKER&&++markerReads===2){
    mod.transition(store,ownerB);
    switched=true;
   }
   return store.getItem(key);
  },
  setItem:(key,value)=>store.setItem(key,value),
  removeItem:key=>store.removeItem(key)
 };
 const saved=JSON.stringify([{name:'Alice saved'}]);
 mod.setOwned(interleaved,ownerA,keys[0],saved);
 assert.equal(switched,true);
 assert.equal(JSON.parse(store.getItem(keys[0]))[0].name,'Bob original');
 assert.equal(JSON.parse(mod.getOwned(store,ownerA,keys[0]))[0].name,'Alice saved');
});

test('failure mirroring to primary rolls back newly saved scoped backup',()=>{
 const store=storage();
 mod.transition(store,ownerA);
 mod.setOwned(store,ownerA,keys[0],JSON.stringify([{name:'Alice original'}]));
 const previousPrimary=store.getItem(keys[0]);
 const backupKey='ps-build-scope-cache.v1:'+ownerA;
 const previousBackup=store.getItem(backupKey);
 let failed=false;
 const fragile={
  getItem:key=>store.getItem(key),
  removeItem:key=>store.removeItem(key),
  setItem:(key,value)=>{
   if(key===keys[0]&&!failed){
    failed=true;
    throw Error('Simulated failure mirroring current owner to primary');
   }
   store.setItem(key,value);
  }
 };
 assert.throws(()=>mod.setOwned(fragile,ownerA,keys[0],
  JSON.stringify([{name:'Alice unsaved'}])),/Simulated failure mirroring/);
 assert.equal(failed,true);
 assert.equal(store.getItem(keys[0]),previousPrimary);
 assert.equal(store.getItem(backupKey),previousBackup,
  'Failed primary write must not commit a newer recovery version');
});

test('sync refuses a mixed owner snapshot when another tab switches mid-read',()=>{
 const store=storage();
 mod.transition(store,ownerA);
 mod.setOwned(store,ownerA,keys[0],JSON.stringify([{name:'Alice saved'}]));
 mod.setOwned(store,ownerA,keys[1],JSON.stringify({name:'Alice draft'}));
 mod.setOwned(store,ownerB,keys[0],JSON.stringify([{name:'Bob saved'}]));
 mod.setOwned(store,ownerB,keys[1],JSON.stringify({name:'Bob draft'}));
 const originalDraft=mod.getOwned(store,ownerA,keys[1]);
 let switched=false;
 const interleaved={
  getItem:key=>{
   if(key===keys[1]&&!switched){
    switched=true;
    mod.transition(store,ownerB);
   }
   return store.getItem(key);
  },
  setItem:(key,value)=>store.setItem(key,value),
  removeItem:key=>store.removeItem(key)
 };
 assert.equal(mod.sync(interleaved),false);
 assert.equal(switched,true);
 assert.equal(store.getItem(mod.MARKER),ownerB);
 assert.equal(mod.getOwned(store,ownerA,keys[1]),originalDraft,
  'Bob draft must not replace Alice owner-specific recovery draft');
 assert.equal(JSON.parse(mod.getOwned(store,ownerB,keys[1])).name,'Bob draft');
});

test('transition aborts if another tab takes ownership while reading old keys',()=>{
 const store=storage(),ownerC=mod.owner('charlie_03','a'.repeat(64));
 mod.transition(store,ownerA);
 mod.setOwned(store,ownerA,keys[0],JSON.stringify([{name:'Alice saved'}]));
 mod.setOwned(store,ownerA,keys[1],JSON.stringify({name:'Alice draft'}));
 mod.setOwned(store,ownerB,keys[0],JSON.stringify([{name:'Bob saved'}]));
 mod.setOwned(store,ownerB,keys[1],JSON.stringify({name:'Bob draft'}));
 const aliceBefore=mod.getOwned(store,ownerA,keys[1]);
 let switched=false;
 const interleaved={
  getItem:key=>{
   if(key===keys[1]&&!switched){
    switched=true;
    mod.transition(store,ownerB);
   }
   return store.getItem(key);
  },
  setItem:(key,value)=>store.setItem(key,value),
  removeItem:key=>store.removeItem(key)
 };
 assert.throws(()=>mod.transition(interleaved,ownerC),
  /Library owner changed in another tab/);
 assert.equal(switched,true);
 assert.equal(store.getItem(mod.MARKER),ownerB);
 assert.equal(JSON.parse(store.getItem(keys[0]))[0].name,'Bob saved');
 assert.equal(mod.getOwned(store,ownerA,keys[1]),aliceBefore);
 assert.equal(JSON.parse(mod.getOwned(store,ownerB,keys[1])).name,'Bob draft');
});
