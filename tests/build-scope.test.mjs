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

test('getOwned never returns a different account primary key after a tab switch',()=>{
 const store=storage();
 mod.transition(store,ownerA);
 mod.setOwned(store,ownerA,keys[0],JSON.stringify([{name:'Alice saved'}]));
 mod.setOwned(store,ownerB,keys[0],JSON.stringify([{name:'Bob saved'}]));
 let switched=false;
 const interleaved={
  getItem:key=>{
   if(key===keys[0]&&!switched){
    switched=true;
    mod.transition(store,ownerB);
   }
   return store.getItem(key);
  },
  setItem:(key,value)=>store.setItem(key,value),
  removeItem:key=>store.removeItem(key)
 };
 const read=JSON.parse(mod.getOwned(interleaved,ownerA,keys[0]));
 assert.equal(switched,true);
 assert.equal(read[0].name,'Alice saved',
  'Alice reader must use Alice backup after Bob claims primary keys');
 assert.equal(JSON.parse(store.getItem(keys[0]))[0].name,'Bob saved');
 assert.equal(store.getItem(mod.MARKER),ownerB);
});

test('a second tab cannot steal shared primary writes when owner changes on last value read',()=>{
 const values=[
  [keys[0],JSON.stringify([{name:'Alice library'}]),
   JSON.stringify([{name:'Bob library'}]),JSON.stringify([{name:'Alice updated library'}])],
  [keys[1],JSON.stringify({name:'Alice draft'}),
   JSON.stringify({name:'Bob draft'}),JSON.stringify({name:'Alice updated draft'})],
  [keys[2],JSON.stringify(['a'.repeat(32)]),
   JSON.stringify(['b'.repeat(32)]),JSON.stringify(['c'.repeat(32)])],
  [keys[3],'a'.repeat(32),'b'.repeat(32),'c'.repeat(32)]
 ];
 for(const [key,alice,bob,updated] of values){
  const store=storage();
  mod.transition(store,ownerA);
  mod.setOwned(store,ownerA,key,alice);
  mod.setOwned(store,ownerB,key,bob);
  let reads=0,switched=false;
  const interleaved={
   getItem:name=>{
    // First read belongs to snapshot(), second to the final previous-value
    // lookup. Bob's switch must happen exactly BETWEEN the marker check
    // and the old unconditional primary write.
    if(name===key&&++reads===2){
     switched=true;
     mod.transition(store,ownerB);
    }
    return store.getItem(name);
   },
   setItem:(name,value)=>store.setItem(name,value),
   removeItem:name=>store.removeItem(name)
  };
  assert.equal(mod.setOwned(interleaved,ownerA,key,updated),true);
  assert.equal(switched,true,key);
  assert.equal(store.getItem(mod.MARKER),ownerB);
  assert.equal(store.getItem(key),bob,
   key+' must retain Bob primary slot, not Alice incoming value');
  assert.equal(mod.getOwned(store,ownerA,key),updated,
   'Alice edit belongs only to Alice recovery slot: '+key);
  assert.equal(mod.getOwned(store,ownerB,key),bob);
  mod.transition(store,ownerA);
  assert.equal(store.getItem(key),updated);
  mod.transition(store,ownerB);
  assert.equal(store.getItem(key),bob);
 }
});


test('failed cross-owner switch must not roll back another tab active library',()=>{
 const store=storage(),ownerC=mod.owner('charlie_03','a'.repeat(64));
 mod.transition(store,ownerA);
 mod.setOwned(store,ownerA,keys[0],JSON.stringify([{name:'Alice library'}]));
 mod.setOwned(store,ownerB,keys[0],JSON.stringify([{name:'Bob library'}]));
 mod.setOwned(store,ownerB,keys[1],JSON.stringify({name:'Bob draft'}));
 mod.setOwned(store,ownerC,keys[0],JSON.stringify([{name:'Charlie future'}]));
 let switched=false;
 const interleaved={
  getItem:key=>store.getItem(key),
  removeItem:key=>store.removeItem(key),
  setItem:(key,value)=>{
   store.setItem(key,value);
   if(key===keys[0]&&!switched){
    switched=true;
    mod.transition(store,ownerB);
    throw Error('Simulated storage failure after another tab switched');
   }
  }
 };
 assert.throws(()=>mod.transition(interleaved,ownerC),
  /Library owner changed in another tab/);
 assert.equal(switched,true);
 assert.equal(store.getItem(mod.MARKER),ownerB);
 assert.equal(JSON.parse(store.getItem(keys[0]))[0].name,'Bob library');
 assert.equal(JSON.parse(store.getItem(keys[1])).name,'Bob draft');
 assert.equal(JSON.parse(mod.getOwned(store,ownerB,keys[0]))[0].name,'Bob library');
});

test('cross-owner transition rechecks the marker after all four primary writes',()=>{
 const store=storage(),ownerC=mod.owner('charlie_03','a'.repeat(64));
 mod.transition(store,ownerA);
 mod.setOwned(store,ownerB,keys[0],JSON.stringify([{name:'Bob library'}]));
 mod.setOwned(store,ownerC,keys[0],JSON.stringify([{name:'Charlie future'}]));
 let switched=false;
 const switchAtFinalWrite=key=>{
  if(key===keys[3]&&!switched){
   switched=true;
   mod.transition(store,ownerB);
  }
 };
 const interleaved={
  getItem:key=>store.getItem(key),
  removeItem:key=>{store.removeItem(key);switchAtFinalWrite(key)},
  setItem:(key,value)=>{store.setItem(key,value);switchAtFinalWrite(key)}
 };
 assert.throws(()=>mod.transition(interleaved,ownerC),
  /Library owner changed in another tab/);
 assert.equal(switched,true);
 assert.equal(store.getItem(mod.MARKER),ownerB);
 assert.equal(JSON.parse(store.getItem(keys[0]))[0].name,'Bob library',
  'Charlie must not overwrite Bob owner marker after Bob takes the primary keys');
});

test('failed same-owner scope sync cannot reset another tab owner marker',()=>{
 const store=storage();
 mod.transition(store,ownerA);
 mod.setOwned(store,ownerB,keys[0],JSON.stringify([{name:'Bob library'}]));
 let switched=false;
 const interleaved={
  getItem:key=>store.getItem(key),
  removeItem:key=>store.removeItem(key),
  setItem:(key,value)=>{
   store.setItem(key,value);
   if(key===mod.MARKER&&value===ownerA&&!switched){
    switched=true;
    mod.transition(store,ownerB);
    throw Error('Another tab claimed the library during same-owner sync');
   }
  }
 };
 assert.throws(()=>mod.transition(interleaved,ownerA),
  /Another tab claimed the library/);
 assert.equal(switched,true);
 assert.equal(store.getItem(mod.MARKER),ownerB);
 assert.equal(JSON.parse(store.getItem(keys[0]))[0].name,'Bob library');
});


test('same-owner transition cannot report success after another tab takes owner during sync',()=>{
 const store=storage();
 mod.transition(store,ownerA);
 mod.setOwned(store,ownerA,keys[0],JSON.stringify([{name:'Alice saved',data:{level:45}}]));
 mod.setOwned(store,ownerB,keys[0],JSON.stringify([{name:'Bob saved',data:{level:55}}]));
 const beforeAlice=mod.getOwned(store,ownerA,keys[0]);
 let writes=0,switched=false;
 const interleaved={
  getItem:key=>store.getItem(key),
  removeItem:key=>store.removeItem(key),
  setItem:(key,value)=>{
   store.setItem(key,value);
   // The first Alice backup is from syncWithOwner(); the second backup
   // is written by sync() AFTER the same-owner marker was acknowledged.
   if(key==='ps-build-scope-cache.v1:'+ownerA&&++writes===2){
    switched=true;
    mod.transition(store,ownerB);
   }
  }
 };
 assert.throws(()=>mod.transition(interleaved,ownerA),
  /Library owner changed in another tab/);
 assert.equal(switched,true);
 assert.equal(store.getItem(mod.MARKER),ownerB,
  'A failed Alice re-claim must not roll Bob back to the old marker');
 assert.equal(JSON.parse(store.getItem(keys[0]))[0].name,'Bob saved',
  'Bob active primary library must not be overwritten by Alice');
 assert.equal(mod.getOwned(store,ownerA,keys[0]),beforeAlice,
  'Alice keeps her own recovery snapshot after the failed claim');
 assert.equal(JSON.parse(mod.getOwned(store,ownerB,keys[0]))[0].name,'Bob saved');
 mod.transition(store,ownerA);
 assert.equal(JSON.parse(store.getItem(keys[0]))[0].name,'Alice saved');
});


test('failed Alice primary write cannot roll back a newer Alice save in another tab',()=>{
 const store=storage();
 mod.transition(store,ownerA);
 const original=JSON.stringify([{name:'Alice original'}]);
 const attempted=JSON.stringify([{name:'Alice first attempt'}]);
 const later=JSON.stringify([{name:'Alice newer tab'}]);
 mod.setOwned(store,ownerA,keys[0],original);
 let interleavedOnce=false;
 const fragile={
  getItem:key=>store.getItem(key),
  removeItem:key=>store.removeItem(key),
  setItem:(key,value)=>{
   if(key===keys[0]&&!interleavedOnce){
    interleavedOnce=true;
    mod.setOwned(store,ownerA,keys[0],later);
    throw Error('First tab primary write failed after newer same-owner edit');
   }
   store.setItem(key,value);
  }
 };
 assert.throws(()=>mod.setOwned(fragile,ownerA,keys[0],attempted),
  /First tab primary write failed/);
 assert.equal(interleavedOnce,true);
 assert.equal(store.getItem(mod.MARKER),ownerA);
 assert.equal(store.getItem(keys[0]),later,
  'Failed older write cannot restore a stale active value');
 assert.equal(mod.getOwned(store,ownerA,keys[0]),later,
  'Failed older write cannot restore a stale owner recovery backup');
});

test('failed primary write after Bob takes marker never destroys later Alice cache',()=>{
 const store=storage();
 mod.transition(store,ownerA);
 const original=JSON.stringify([{name:'Alice original'}]);
 const later=JSON.stringify([{name:'Alice newer backup'}]);
 const bob=JSON.stringify([{name:'Bob own'}]);
 mod.setOwned(store,ownerA,keys[0],original);
 mod.setOwned(store,ownerB,keys[0],bob);
 let interleavedOnce=false;
 const fragile={
  getItem:key=>store.getItem(key),
  removeItem:key=>store.removeItem(key),
  setItem:(key,value)=>{
   if(key===keys[0]&&!interleavedOnce){
    interleavedOnce=true;
    mod.transition(store,ownerB);
    mod.setOwned(store,ownerA,keys[0],later);
    throw Error('Failed Alice primary write after Bob switched');
   }
   store.setItem(key,value);
  }
 };
 assert.throws(()=>mod.setOwned(fragile,ownerA,keys[0],
  JSON.stringify([{name:'Alice obsolete write'}])),
 /Failed Alice primary write after Bob switched/);
 assert.equal(interleavedOnce,true);
 assert.equal(store.getItem(mod.MARKER),ownerB);
 assert.equal(store.getItem(keys[0]),bob);
 assert.equal(mod.getOwned(store,ownerA,keys[0]),later);
 assert.equal(mod.getOwned(store,ownerB,keys[0]),bob);
 mod.transition(store,ownerA);
 assert.equal(store.getItem(keys[0]),later);
});

test('failed partially-applied primary write restores own old value and backup',()=>{
 const store=storage();
 mod.transition(store,ownerA);
 const original=JSON.stringify([{name:'Alice original'}]);
 mod.setOwned(store,ownerA,keys[0],original);
 const backupKey='ps-build-scope-cache.v1:'+ownerA,
  before=store.getItem(backupKey);
 let failed=false;
 const partial={
  getItem:key=>store.getItem(key),
  removeItem:key=>store.removeItem(key),
  setItem:(key,value)=>{
   store.setItem(key,value);
   if(key===keys[0]&&!failed){
    failed=true;
    throw Error('Primary write applied but storage reported failure');
   }
  }
 };
 assert.throws(()=>mod.setOwned(partial,ownerA,keys[0],
  JSON.stringify([{name:'Alice incomplete'}])),/Primary write applied/);
 assert.equal(failed,true);
 assert.equal(store.getItem(mod.MARKER),ownerA);
 assert.equal(store.getItem(keys[0]),original);
 assert.equal(store.getItem(backupKey),before);
});


test('partially applied draft deletion restores the previous owner copy on error',()=>{
 const store=storage();mod.transition(store,ownerA);
 const original=JSON.stringify({level:45,name:'Alice preserved'});
 mod.setOwned(store,ownerA,keys[1],original);
 const backupKey='ps-build-scope-cache.v1:'+ownerA,
  beforeBackup=store.getItem(backupKey);
 let deleted=false;
 const partial={
  getItem:key=>store.getItem(key),
  setItem:(key,value)=>store.setItem(key,value),
  removeItem:key=>{
   store.removeItem(key);
   if(key===keys[1]&&!deleted){
    deleted=true;
    throw Error('Draft removal applied before browser failure');
   }
  }
 };
 assert.throws(()=>mod.setOwned(partial,ownerA,keys[1],''),
  /Draft removal applied/);
 assert.equal(deleted,true);
 assert.equal(store.getItem(keys[1]),original,
  'A failed deletion must not silently discard the active draft');
 assert.equal(store.getItem(backupKey),beforeBackup,
  'The independent owner recovery copy must also roll back');
});

test('failed draft deletion cannot resurrect stale values after a newer same-owner edit',()=>{
 const store=storage();mod.transition(store,ownerA);
 const old=JSON.stringify({level:35,name:'Old draft'});
 const newer=JSON.stringify({level:55,name:'Newer edit'});
 mod.setOwned(store,ownerA,keys[1],old);
 let interleaved=false;
 const partial={
  getItem:key=>store.getItem(key),
  setItem:(key,value)=>store.setItem(key,value),
  removeItem:key=>{
   store.removeItem(key);
   if(key===keys[1]&&!interleaved){
    interleaved=true;
    mod.setOwned(store,ownerA,keys[1],newer);
    throw Error('Earlier deletion failed after a later owner save');
   }
  }
 };
 assert.throws(()=>mod.setOwned(partial,ownerA,keys[1],''),
  /Earlier deletion failed/);
 assert.equal(store.getItem(mod.MARKER),ownerA);
 assert.equal(store.getItem(keys[1]),newer);
 assert.equal(mod.getOwned(store,ownerA,keys[1]),newer);
});

test('corrupt cached records cannot become stringified active builds or erase backups',()=>{
 const s=storage();mod.transition(s,ownerA);
 put(s,'Alice intact',45);mod.sync(s);
 const primary=keys.map(key=>s.getItem(key));
 const invalid=JSON.stringify([{name:'not a storage string'},'','[]','']);
 const backupKey='ps-build-scope-cache.v1:'+ownerB;
 s.setItem(backupKey,invalid);
 assert.equal(mod.getOwned(s,ownerB,keys[0]),'[]',
  'A foreign backup containing objects may not be returned as a build string');
 assert.throws(()=>mod.setOwned(s,ownerB,keys[1],JSON.stringify({level:55})),
  /Corrupted owner backup/);
 assert.throws(()=>mod.transition(s,ownerB),/Corrupted owner backup/);
 assert.equal(s.getItem(backupKey),invalid,
  'The only bad recovery payload must remain unmodified for diagnosis');
 assert.equal(s.getItem(mod.MARKER),ownerA);
 assert.deepEqual(keys.map(key=>s.getItem(key)),primary);
});

test('valid legacy four-string owner backup still switches without losing saved builds',()=>{
 const s=storage();mod.transition(s,ownerA);
 put(s,'Alice',45);mod.sync(s);
 const bob=JSON.stringify([{name:'Bob restored',id:'b'.repeat(32),data:{level:55}}]);
 s.setItem('ps-build-scope-cache.v1:'+ownerB,JSON.stringify([
  bob,JSON.stringify({level:55}),'[]','b'.repeat(32)
 ]));
 mod.transition(s,ownerB);
 assert.equal(s.getItem(keys[0]),bob);
 assert.equal(JSON.parse(s.getItem(keys[1])).level,55);
 mod.transition(s,ownerA);
 assert.equal(JSON.parse(s.getItem(keys[0]))[0].id,'Alice');
});

test('invalid guest handoff recovery payload is preserved rather than silently imported',()=>{
 const s=storage();mod.transition(s,ownerA);
 put(s,'Current owner',35);mod.sync(s);
 const backupKey='ps-build-scope-cache.v1:'+guest;
 const bad=JSON.stringify(['[]',null,'[]','']);
 s.setItem(backupKey,bad);
 const old=keys.map(key=>s.getItem(key));
 assert.throws(()=>mod.transition(s,ownerB,{carry:true,carryFrom:guest}),
  /Corrupted owner backup/);
 assert.equal(s.getItem(backupKey),bad);
 assert.equal(s.getItem(mod.MARKER),ownerA);
 assert.deepEqual(keys.map(key=>s.getItem(key)),old);
});
