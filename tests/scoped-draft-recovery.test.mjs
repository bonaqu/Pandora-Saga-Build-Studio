import test from 'node:test';
import assert from 'node:assert/strict';
import {readFileSync} from 'node:fs';

const read=path=>readFileSync(new URL('../'+path,import.meta.url),'utf8');
const app=read('pandora-studio-app.js');
const start=app.indexOf('function restoreScopedDraft(');
const end=app.indexOf('\nfunction activateLibraryScope(',start);
assert.ok(start>=0&&end>start,'Test the actual production scope restoration');
const source=app.slice(start,end);
const root={};Function('window',read('pandora-studio-build-scope.js'))(root);
const scope=root.PandoraBuildScope;
const A='a'.repeat(32),B='b'.repeat(32),
 alice='account:alice_01',bob='account:bob_222';
function storage(){
 const map=new Map();
 return {getItem:k=>map.has(k)?map.get(k):null,
  setItem:(k,v)=>map.set(k,String(v)),removeItem:k=>map.delete(k)};
}
function make(storage,ownerRef){
 const fresh=()=>({level:1,points:{},stats:{},equipment:{},souls:{},
  soulOwners:{},refinements:{},gems:{},attributeBuffs:{},profile:{}});
 return Function('window','localStorage','libraryScopeId','fresh','safeStoredBuildRows',
  'const ACTIVE_BUILD_KEY="ps-active-build-id.v1";let state=fresh(),builds=[],activeBuildId=null,'+
  'compareIds=[],buildSearchQuery="stale";\n'+source+
  '\nreturn {restore:restoreScopedDraft,state:()=>state,builds:()=>builds,'+
  'active:()=>activeBuildId,search:()=>buildSearchQuery};')(
  root,storage,()=>ownerRef.current,fresh,rows=>Array.isArray(rows)?rows:[]
 );
}
test('owner recovery ignores another account currently occupying top-level storage keys',()=>{
 const s=storage();
 scope.transition(s,alice);
 scope.setOwned(s,alice,'ps-build-studio.v1',JSON.stringify({level:42,name:'Alice draft'}));
 scope.setOwned(s,alice,'ps-build-library.v1',
  JSON.stringify([{id:A,name:'Alice build',data:{race:1,job:16,level:42}}]));
 scope.setOwned(s,alice,'ps-active-build-id.v1',A);
 scope.transition(s,bob);
 scope.setOwned(s,bob,'ps-build-studio.v1',JSON.stringify({level:55,name:'Bob draft'}));
 scope.setOwned(s,bob,'ps-build-library.v1',
  JSON.stringify([{id:B,name:'Bob build',data:{race:0,job:0,level:55}}]));
 scope.setOwned(s,bob,'ps-active-build-id.v1',B);
 assert.equal(JSON.parse(s.getItem('ps-build-studio.v1')).name,'Bob draft');
 const ownerRef={current:alice},runtime=make(s,ownerRef);
 runtime.restore();
 assert.equal(runtime.state().name,'Alice draft');
 assert.equal(runtime.state().level,42);
 assert.deepEqual(runtime.builds().map(x=>x.name),['Alice build']);
 assert.equal(runtime.active(),A);
 assert.equal(runtime.search(),'');
 assert.equal(JSON.parse(s.getItem('ps-build-studio.v1')).name,'Bob draft',
  'Reading the Alice cache must not alter Bob primary keys');
 ownerRef.current=bob;
 runtime.restore({initial:true});
 assert.equal(runtime.state().name,'Bob draft');
 assert.deepEqual(runtime.builds().map(x=>x.name),['Bob build']);
 assert.equal(runtime.active(),B);
});
test('active selection is not inherited from another account when no owned build exists',()=>{
 const s=storage();
 scope.transition(s,bob);
 scope.setOwned(s,bob,'ps-active-build-id.v1',B);
 scope.setOwned(s,bob,'ps-build-library.v1',JSON.stringify([{id:B,data:{level:45}}]));
 const ownerRef={current:alice},runtime=make(s,ownerRef);
 runtime.restore();
 assert.equal(runtime.active(),null);
 assert.deepEqual(runtime.builds(),[]);
 assert.equal(runtime.state().level,1);
});

test('owner-scoped draft isolates damaged nested capacities without rewriting the cache',()=>{
 const s=storage();scope.transition(s,alice);
 const damaged={level:45,socketCapacities:'broken',mastery:[],
  gems:'bad',vitalsBuffs:[3],profile:{guild:'Guild A'}};
 scope.setOwned(s,alice,'ps-build-studio.v1',JSON.stringify(damaged));
 const original=s.getItem('ps-build-studio.v1');
 const runtime=make(s,{current:alice});runtime.restore();
 assert.deepEqual(runtime.state().socketCapacities,{});
 assert.deepEqual(runtime.state().mastery,{});
 assert.deepEqual(runtime.state().gems,{});
 assert.deepEqual(runtime.state().vitalsBuffs,{});
 assert.equal(runtime.state().profile.guild,'Guild A');
 assert.equal(s.getItem('ps-build-studio.v1'),original);
});
