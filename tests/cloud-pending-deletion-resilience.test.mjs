import test from 'node:test';
import assert from 'node:assert/strict';
import {readFileSync} from 'node:fs';
const read=path=>readFileSync(new URL('../'+path,import.meta.url),'utf8');
const app=read('pandora-studio-app.js');
const start=app.indexOf('async function loadCloudBuilds(){');
const end=app.indexOf('\nfunction h(tag,attrs={}',start);
assert.ok(start>=0&&end>start,'Test the real cloud-loader function');
const loader=app.slice(start,end);
const world={};
Function('window',read('pandora-studio-build-library-merge.js'))(world);
const A='a'.repeat(32),B='b'.repeat(32),C='c'.repeat(32);
const entry=(id,name)=>({id,name,at:100,data:{race:1,job:16,level:45}});
function scenario({pending=[A,B],fail=[A],remote=[]}={}){
 const queue=[...pending],failIds=new Set(fail),calls=[],messages=[],warnings=[];
 let saves=0;
 const run=Function('queuedDeletes','cloudLibraryRequest','acknowledgeDelete','window',
  'persistBuilds','renderDetails','reportCloudStatus','putCloudBuild','showStudioToast',
  'newId','console',
  'let libraryChangeId=0,builds=[],activeBuildId=null,activeTab="builds",lang="ru";'+
  loader+'\nreturn {load:loadCloudBuilds,builds:()=>builds,active:()=>activeBuildId};')(
  ()=>queue.slice(),
  async payload=>{
   calls.push(payload??null);
   if(!payload)return {records:remote};
   if(payload.action==='delete'&&failIds.has(payload.id))
    throw Error('Revocation temporarily unavailable');
   return {ok:true};
  },
  id=>{const i=queue.indexOf(id);if(i>=0)queue.splice(i,1)},
  world,()=>{saves++;return true},()=>{},message=>messages.push(message),async()=>true,
  ()=>{},()=>C,{warn:(...args)=>warnings.push(args)}
 );
 return {...run,queue,failIds,calls,messages,warnings,saves:()=>saves};
}
test('a failed pending delete does not block library GET and other revocations',async()=>{
 const healthy=entry(C,'Cloud Hero');
 const x=scenario({remote:[{id:A,entry:entry(A,'Awaiting deletion')},
  {id:C,entry:healthy}]});
 await x.load();
 assert.deepEqual(x.calls.map(call=>call?.action||'get'),
  ['delete','delete','get']);
 assert.deepEqual(x.queue,[A],'Only successful revocations are acknowledged');
 assert.deepEqual(x.builds(),[healthy],
  'Pending-deleted cloud ID must not reappear after GET');
 assert.ok(x.messages.at(-1).includes('удаление некоторых ссылок ещё не подтверждено'));
 assert.equal(x.saves(),1);
 assert.equal(x.warnings.length,1);
});
test('a later retry completes pending revocation without hiding healthy builds',async()=>{
 const healthy=entry(C,'Cloud Hero');
 const x=scenario({pending:[A],remote:[{id:A,entry:entry(A,'Should never reopen')},
  {id:C,entry:healthy}]});
 await x.load();
 assert.deepEqual(x.queue,[A]);
 x.failIds.clear();
 // A correct D1 GET returns a tombstone after successful retry.
 const completed=scenario({pending:x.queue,fail:[],remote:[
  {id:A,deleted:true,entry:null},{id:C,entry:healthy}
 ]});
 await completed.load();
 assert.deepEqual(completed.queue,[]);
 assert.deepEqual(completed.builds(),[healthy]);
 assert.ok(completed.messages.every(message=>!message.includes('ещё не подтверждено')));

});
