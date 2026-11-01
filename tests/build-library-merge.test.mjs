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
test('cloud tombstones and pending deletes never resurrect deleted builds',()=>{
 const result=reconcile({local:[mk(A,100,55),mk(B,110,54),mk(C,120,53)],
  remote:[{id:A,deleted:true,entry:null},{id:B,entry:mk(B,101,45)}],
  pendingDeletes:[B],activeId:A,newId:()=>D});
 assert.deepEqual(result.merged.map(x=>x.id),[C]);
 assert.equal(result.activeId,null);
 assert.deepEqual(result.outgoing.map(x=>x.id),[C]);
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
