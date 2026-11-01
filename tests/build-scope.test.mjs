import test from 'node:test';
import assert from 'node:assert/strict';
import {readFileSync} from 'node:fs';
import vm from 'node:vm';
const scope={};scope.window=scope;
vm.runInNewContext(readFileSync(new URL('../build-scope.js',import.meta.url),'utf8'),scope);
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
