import test from 'node:test';
import assert from 'node:assert/strict';
import {readFileSync} from 'node:fs';
const host={};
Function('window',readFileSync(new URL('../build-library-merge.js',import.meta.url),'utf8'))(host);
const reconcile=host.PandoraBuildLibraryMerge.reconcile;
const A='a'.repeat(32),B='b'.repeat(32),C='c'.repeat(32),D='d'.repeat(32);
const mk=(id,at,level,name='Hero')=>({id,name,at,data:{race:1,job:16,level}});
test('equal cloud timestamp with differing data keeps both builds and retains local active draft',()=>{
 const local=mk(A,100,55),cloud=mk(A,100,54);
 const r=reconcile({local:[local],remote:[{id:A,deleted:false,entry:cloud}],activeId:A,newId:()=>B});
 assert.equal(r.copies,1);
 assert.deepEqual(r.merged.find(x=>x.id===A),cloud);
 assert.equal(r.merged.find(x=>x.id===B).data.level,55);
 assert.equal(r.activeId,B);
 assert.equal(r.outgoing.length,0);
 assert.equal(r.merged.find(x=>x.id===B).localOnly,true);
 assert.match(r.merged.find(x=>x.id===B).name,/локальная копия/);
 assert.equal(local.name,'Hero');
});
test('cloud always wins original ID even when local timestamp is newer',()=>{
 const local=mk(A,201,55),cloud=mk(A,200,45);
 const r=reconcile({local:[local],remote:[{id:A,entry:cloud}],activeId:A,newId:()=>B});
 assert.deepEqual(r.merged.find(x=>x.id===A),cloud);
 assert.equal(r.merged.find(x=>x.id===B).data.level,55);
 assert.equal(r.activeId,B);
 assert.deepEqual(r.outgoing.map(v=>v.id),[]);
});
test('older local version remains available if newer cloud build is different',()=>{
 const r=reconcile({local:[mk(A,100,54)],
  remote:[{id:A,entry:mk(A,200,55)}],activeId:A,newId:()=>B});
 assert.equal(r.merged.find(x=>x.id===A).data.level,55);
 assert.equal(r.merged.find(x=>x.id===B).data.level,54);
 assert.equal(r.activeId,B);
});
test('identical data with different at uses newer revision without unnecessary duplication',()=>{
 const result=reconcile({local:[mk(A,300,55)],remote:[{id:A,entry:mk(A,200,55)}],
  activeId:A,newId:()=>B});
 assert.equal(result.copies,0);
 assert.deepEqual(result.merged.find(x=>x.id===A),mk(A,200,55));
 assert.deepEqual(result.outgoing.map(x=>x.id),[]);
});
test('remote tombstone keeps a local-only recovery without reviving deleted ID',()=>{
 const result=reconcile({local:[mk(A,100,55),mk(B,110,54),mk(C,120,53)],
  remote:[{id:A,deleted:true,entry:null},{id:B,entry:mk(B,101,45)}],
  pendingDeletes:[B],activeId:A,newId:()=>D});
 assert.deepEqual(new Set(result.merged.map(x=>x.id)),new Set([C,D]));
 assert.ok(!result.merged.some(x=>x.id===A||x.id===B));
 assert.equal(result.activeId,D);
 assert.equal(result.merged.find(x=>x.id===D).localOnly,true);
 assert.match(result.merged.find(x=>x.id===D).name,/копия удалённого билда/);
 assert.deepEqual(result.outgoing.map(x=>x.id),[C]);
 const repeat=reconcile({local:result.merged,
  remote:[{id:A,deleted:true,entry:null}],activeId:D,newId:()=>A});
 assert.equal(repeat.copies,0,'Refresh never creates another recovery copy');
 assert.equal(repeat.activeId,D);
 assert.deepEqual(repeat.outgoing.map(x=>x.id),[C],
  'Only the previously explicitly saved C may retry; never the recovered D');
});
test('a locally queued delete never generates a recovery copy',()=>{
 const result=reconcile({local:[mk(A,100,55)],remote:[{id:A,deleted:true}],
  pendingDeletes:[A],activeId:A,newId:()=>B});
 assert.deepEqual(result.merged,[]);
 assert.deepEqual(result.outgoing,[]);
 assert.equal(result.activeId,null);
});
test('malformed cloud payload cannot delete valid local save; ID collisions cannot erase copies',()=>{
 const local=mk(A,100,55),remote=[{id:A,entry:{id:'wrong',at:101,data:{}}}];
 const valid=reconcile({local:[local],remote,activeId:A,newId:()=>B});
 assert.deepEqual(valid.merged,[local]);
 assert.deepEqual(valid.outgoing,[local]);
 let i=0;
 const both=reconcile({local:[local],remote:[{id:A,entry:mk(A,101,54)}],
  newId:()=>++i===1?A:B});
 assert.equal(both.merged.find(x=>x.id===B).data.level,55);
 assert.throws(()=>reconcile({local:[local],remote:[{id:A,entry:mk(A,101,54)}],
  newId:()=>A}),/unique local conflict/);
});

test('conflict copies remain browser-only across repeated cloud refreshes',()=>{
 const first=reconcile({local:[mk(A,210,55)],remote:[{id:A,entry:mk(A,180,54)}],
  activeId:A,newId:()=>B});
 const second=reconcile({local:first.merged,remote:[{id:A,entry:mk(A,180,54)}],
  activeId:first.activeId,newId:()=>C});
 assert.equal(first.copies,1);
 assert.equal(second.copies,0);
 assert.equal(second.merged.length,2);
 assert.equal(second.activeId,B);
 assert.equal(second.merged.find(x=>x.id===B).localOnly,true);
 assert.deepEqual(second.outgoing,[],'refresh must not send conflict copies to D1');
});
test('user-created offline saved builds still retry while local-only copies never do',()=>{
 const r=reconcile({local:[mk(C,80,48),{...mk(B,95,55),localOnly:true}],
  remote:[],newId:()=>D});
 assert.deepEqual(r.outgoing.map(x=>x.id),[C]);
 assert.ok(r.merged.some(x=>x.id===B&&x.localOnly));
});

test('remote and local key order differences do not manufacture conflict copies',()=>{
 const local={id:A,name:'Same build',at:250,data:{
  level:55,job:16,race:1,stats:{str:3,vit:5},equipment:{
   0:{id:422,name:'Sword',grade:7}
  },souls:{0:[{id:103013}]}
 }};
 const cloud={id:A,name:'Same build',at:190,data:{
  souls:{0:[{id:103013}]},
  equipment:{0:{grade:7,name:'Sword',id:422}},
  stats:{vit:5,str:3},race:1,job:16,level:55
 }};
 const r=reconcile({local:[local],remote:[{id:A,entry:cloud}],
  activeId:A,newId:()=>B});
 assert.equal(r.copies,0);
 assert.equal(r.merged.length,1);
 assert.deepEqual(r.merged[0],cloud);
 assert.equal(r.activeId,A);
 assert.deepEqual(r.outgoing,[]);
});
test('actual equipment, level or array order changes still preserve distinct editions',()=>{
 const local=mk(A,100,55),cloud={...mk(A,100,55)};
 local.data.equipment={0:{id:1}};cloud.data.equipment={0:{id:2}};
 const r=reconcile({local:[local],remote:[{id:A,entry:cloud}],
  activeId:A,newId:()=>B});
 assert.equal(r.copies,1);
 assert.equal(r.merged.find(x=>x.id===B).data.equipment[0].id,1);
 const listLocal={...mk(A,100,55),data:{list:[1,2,3]}};
 const listRemote={...mk(A,100,55),data:{list:[3,2,1]}};
 const s=reconcile({local:[listLocal],remote:[{id:A,entry:listRemote}],
  newId:()=>B});
 assert.equal(s.copies,1);
});
