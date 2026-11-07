import test from 'node:test';
import assert from 'node:assert/strict';
import {readFileSync} from 'node:fs';

const read=path=>readFileSync(new URL('../'+path,import.meta.url),'utf8');
const app=read('pandora-studio-app.js');
const start=app.indexOf('async function saveWikiRecordPatch(');
const end=app.indexOf('\nasync function saveWikiSpawns(',start);
assert.ok(start>=0&&end>start,'Wiki editor routine must be found');
const source=app.slice(start,end);
const window={};
Function('window',read('pandora-studio-wiki-owner-data.js'))(window);

function deferred(){
 let resolve,reject;
 const promise=new Promise((yes,no)=>{resolve=yes;reject=no});
 return {promise,resolve,reject};
}
const tick=()=>new Promise(resolve=>setImmediate(resolve));
function environment({apiRequest,refreshOwnerCatalog,wikiData}={}){
 const override={},ownerEdits=[],writes=[],states=[],queue=new Map();
 const request=apiRequest||(async(path,data)=>{writes.push({path,data})});
 const catalog=refreshOwnerCatalog||(async()=>{});
 const factory=Function('wikiRecordWriteQueue','window','override','ownerEdits',
  'activeOverride','apiRequest','refreshOwnerCatalog','refreshOwnerUI','wikiData',
  'const adminEditing=true,adminToken="test";let editIsSaving=false;\n'+source+
  '\nreturn {save:saveWikiRecordPatch,field:saveWikiRecordField,busy:()=>editIsSaving};');
 const ref=factory(queue,window,override,ownerEdits,
  key=>Object.hasOwn(override,key)?override[key]:null,request,catalog,
  ()=>{states.push(true)},wikiData||{monsters:{600:{resists:{fire:5,cold:5}}}});
 return {...ref,writes,override,ownerEdits,queue,states};
}

test('rapid same-record name and description edits preserve both fields and undo snapshots',async()=>{
 const firstRefresh=deferred(),writes=[];
 let refreshes=0;
 const env=environment({
  apiRequest:async(path,data)=>{writes.push({path,data})},
  refreshOwnerCatalog:async()=>{
   if(++refreshes===1)await firstRefresh.promise;
  }
 });
 const first=env.field('monster',600,'name','Первое имя');
 const second=env.field('monster',600,'desc','Второе описание');
 await tick();
 assert.equal(writes.length,1,'A second D1 overwrite cannot begin before the first reindex');
 assert.equal(env.busy(),true);
 assert.equal(env.queue.size,1);
 firstRefresh.resolve();
 await Promise.all([first,second]);
 assert.equal(writes.length,2);
 assert.deepEqual(JSON.parse(writes[0].data.value),{name:'Первое имя'});
 assert.deepEqual(JSON.parse(writes[1].data.value),{
  name:'Первое имя',desc:'Второе описание'
 });
 assert.deepEqual(JSON.parse(env.override['wikiedit.monster.600']),{
  name:'Первое имя',desc:'Второе описание'
 });
 assert.equal(env.ownerEdits.length,2);
 assert.equal(env.ownerEdits[0].before,null);
 assert.equal(env.ownerEdits[1].before,env.ownerEdits[0].after,
  'Undo must restore the first successful state');
 assert.equal(env.queue.size,0);
 assert.equal(env.busy(),false);
});

test('rapid resistance edits merge at commit time without restoring the old fire value',async()=>{
 const base={monsters:{600:{resists:{fire:5,cold:5,magic:-10}}}};
 const original=JSON.stringify(base),env=environment({wikiData:base});
 const fire=env.field('monster',600,'resists.fire',15);
 const cold=env.field('monster',600,'resists.cold',25);
 await Promise.all([fire,cold]);
 assert.deepEqual(JSON.parse(env.override['wikiedit.monster.600']).resists,{
  fire:15,cold:25,magic:-10
 });
 assert.equal(JSON.stringify(base),original,'Do not mutate source game resistances');
 assert.deepEqual(JSON.parse(env.ownerEdits[1].after).resists,{
  fire:15,cold:25,magic:-10
 });
});

test('editing a newly created owner NPC while its first save is pending preserves location',async()=>{
 const id='owner-npc-0123456789abcdef';
 const started=deferred();let refreshCount=0;
 const env=environment({refreshOwnerCatalog:async()=>{
  if(++refreshCount===1)await started.promise;
 }});
 const creation=env.save('npc',id,{
  name:'Мастер',nameEn:'Master',maps:['astir-kingdom']
 });
 const detail=env.field('npc',id,'service','Мастер сундуков');
 await tick();
 assert.equal(env.ownerEdits.length,1);
 started.resolve();
 await Promise.all([creation,detail]);
 assert.deepEqual(JSON.parse(env.override['wikiedit.npc.'+id]),{
  name:'Мастер',nameEn:'Master',maps:['astir-kingdom'],
  service:'Мастер сундуков'
 });
});

test('a failed write rejects its own caller but does not poison later queued changes',async()=>{
 let calls=0;
 const writes=[];
 const env=environment({apiRequest:async(path,data)=>{
  calls++;writes.push({path,data});
  if(calls===1)throw Error('Temporary D1 write failure');
 }});
 const first=env.field('monster',600,'name','Ошибка записи');
 const second=env.field('monster',600,'desc','Успешное исправление');
 await assert.rejects(first,/Temporary D1 write failure/);
 await second;
 assert.equal(calls,2);
 assert.deepEqual(JSON.parse(env.override['wikiedit.monster.600']),{
  desc:'Успешное исправление'
 });
 assert.equal(env.ownerEdits.length,1);
 assert.equal(env.queue.size,0);
 assert.equal(env.busy(),false);
});

test('unrelated record keys remain independent rather than globally blocking the editor',async()=>{
 const barrier=deferred(),writes=[];
 const env=environment({apiRequest:async(path,data)=>{
  writes.push({path,data});
  await barrier.promise;
 }});
 const a=env.field('monster',600,'name','Монстр 600');
 const b=env.field('monster',601,'name','Монстр 601');
 await tick();
 assert.equal(writes.length,2,'Different keys may save independently');
 assert.equal(env.queue.size,2);
 assert.equal(env.busy(),true);
 barrier.resolve();
 await Promise.all([a,b]);
 assert.equal(env.queue.size,0);
 assert.equal(env.busy(),false);
});
