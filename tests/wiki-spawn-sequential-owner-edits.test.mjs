import test from 'node:test';
import assert from 'node:assert/strict';
import {readFileSync} from 'node:fs';

const source=readFileSync(new URL('../pandora-studio-app.js',import.meta.url),'utf8');
const start=source.indexOf('async function saveWikiSpawns(');
const end=source.indexOf('\nasync function saveWikiRelationRows(',start);
assert.ok(start>=0&&end>start,'Actual monster spawn writer must be found');
const code=source.slice(start,end);
const window={};
Function('window',readFileSync(
 new URL('../pandora-studio-wiki-owner-data.js',import.meta.url),'utf8'))(window);
const tick=()=>new Promise(resolve=>setImmediate(resolve));
function deferred(){
 let resolve,reject;
 const promise=new Promise((yes,no)=>{resolve=yes;reject=no});
 return {promise,resolve,reject};
}
function setup({apiRequest,initial}={}){
 const catalog={
  monsters:{600:{},601:{}},maps:{100:{mobs:[600,601]},101:{mobs:[]},
   102:{mobs:[]},103:{mobs:[]}},instances:[{id:200,mobs:[600]}]
 };
 const original=JSON.stringify(catalog);
 const overrides={},edits=[],queue=new Map(),writes=[];
 const visible=new Map([
  ['600',initial||[{type:'map',id:'100'},{type:'instance',id:'200'}]],
  ['601',[{type:'map',id:'100'}]]
 ]);
 const wikiIndex={locations:id=>visible.get(String(id))||[]};
 const write=apiRequest||(async(path,payload)=>{writes.push({path,payload})});
 const refresh=async()=>{
  for(const id of ['600','601']){
   const current=overrides['spawnedit.'+id];
   if(current)visible.set(id,JSON.parse(current));
  }
 };
 const factory=Function('wikiData','wikiIndex','wikiBaseData','window','activeOverride',
  'apiRequest','override','ownerEdits','refreshOwnerCatalog','refreshOwnerUI',
  'wikiRecordWriteQueue',
  'const adminToken="test",adminEditing=true;let editIsSaving=false;const wt=(ru,en)=>ru;\n'+code+
  '\nreturn {save:saveWikiSpawns,busy:()=>editIsSaving};');
 const handler=factory(catalog,wikiIndex,catalog,window,
  key=>Object.hasOwn(overrides,key)?overrides[key]:null,write,
  overrides,edits,refresh,()=>{},queue);
 return {...handler,catalog,original,overrides,edits,queue,writes,visible};
}
test('two rapid additions to the same monster retain both places and unrelated instance',async()=>{
 const gate=deferred(),calls=[];
 const x=setup({apiRequest:async(path,payload)=>{
  calls.push({path,payload});
  if(calls.length===1)await gate.promise;
 }});
 const a=x.save(600,'map','101',true);
 const b=x.save(600,'map','102',true);
 await tick();
 assert.equal(calls.length,1,'Second write must wait for first D1 write and reindex');
 assert.equal(x.queue.size,1);
 assert.equal(x.busy(),true);
 gate.resolve();
 await Promise.all([a,b]);
 assert.equal(calls.length,2);
 assert.deepEqual(JSON.parse(calls[0].payload.value),[
  {type:'map',id:'100'},{type:'instance',id:'200'},{type:'map',id:'101'}]);
 assert.deepEqual(JSON.parse(calls[1].payload.value),[
  {type:'map',id:'100'},{type:'instance',id:'200'},
  {type:'map',id:'101'},{type:'map',id:'102'}]);
 assert.equal(x.edits.length,2);
 assert.equal(x.edits[1].before,x.edits[0].after);
 assert.equal(x.queue.size,0);
 assert.equal(x.busy(),false);
 assert.equal(JSON.stringify(x.catalog),x.original,'Published OS catalog must remain unchanged');
});
test('outdated replacement refuses to erase a location changed by the first operation',async()=>{
 const x=setup();
 const a=x.save(600,'map','101',true,'100');
 const b=x.save(600,'map','102',true,'100');
 await a;
 await assert.rejects(b,/больше не найдено/);
 assert.deepEqual(JSON.parse(x.overrides['spawnedit.600']),[
  {type:'instance',id:'200'},{type:'map',id:'101'}]);
 assert.equal(x.edits.length,1,'Only one D1 mutation was accepted');
 assert.equal(x.queue.size,0);
});
test('a failed write does not poison later queued spawn additions',async()=>{
 let attempt=0;
 const x=setup({apiRequest:async(path,payload)=>{
  if(++attempt===1)throw Error('Injected D1 write error');
  x.writes.push({path,payload});
 }});
 const first=x.save(600,'map','101',true);
 const second=x.save(600,'map','102',true);
 await assert.rejects(first,/Injected D1 write error/);
 await second;
 assert.equal(attempt,2);
 assert.deepEqual(JSON.parse(x.overrides['spawnedit.600']),[
  {type:'map',id:'100'},{type:'instance',id:'200'},
  {type:'map',id:'102'}]);
 assert.equal(x.edits.length,1);
 assert.equal(x.queue.size,0);
});
test('separate monsters are not globally serialized',async()=>{
 const gate=deferred(),calls=[];
 const x=setup({apiRequest:async(path,payload)=>{
  calls.push({path,payload});await gate.promise;
 }});
 const a=x.save(600,'map','101',true);
 const b=x.save(601,'map','102',true);
 await tick();
 assert.equal(calls.length,2);
 assert.equal(x.queue.size,2);
 gate.resolve();await Promise.all([a,b]);
 assert.equal(x.queue.size,0);
 assert.equal(x.edits.length,2);
 assert.equal(x.overrides['spawnedit.600']!==x.overrides['spawnedit.601'],true);
});
test('anonymous spawn editing is rejected before any write or catalog mutation',async()=>{
 const x=setup();
 const blocked=Function('wikiData','wikiIndex','wikiBaseData','window','activeOverride',
  'apiRequest','override','ownerEdits','refreshOwnerCatalog','refreshOwnerUI',
  'wikiRecordWriteQueue',
  'const adminToken=null,adminEditing=false;let editIsSaving=false;\n'+code+
  '\nreturn saveWikiSpawns;')(
   x.catalog,{locations:()=>[{type:'map',id:'100'}]},x.catalog,window,
   ()=>null,async()=>{throw Error('Should not be reached')},{},[],async()=>{},()=>{},
   new Map());
 await assert.rejects(blocked(600,'map','101',true),/Недостаточно прав/);
});

test('canonical spawn writes ignore owner-curated and virtual numeric locations',async()=>{
 const x=setup({initial:[
  {type:'map',id:'100'}, {type:'map',id:'custom-forest01'},
  {type:'map',id:'1001004'}, {type:'instance',id:'200'}
 ]});
 await x.save(600,'map','101',true);
 assert.equal(x.writes.length,1);
 assert.deepEqual(JSON.parse(x.writes[0].payload.value),[
  {type:'map',id:'100'}, {type:'instance',id:'200'}, {type:'map',id:'101'}
 ],'Only source-backed numeric locations belong in a spawnedit override');
 assert.equal(JSON.stringify(x.catalog),x.original);
});
test('virtual monster IDs cannot create ignored successful spawnedit writes',async()=>{
 const x=setup();
 await assert.rejects(x.save('owner-monster-abcdefabcdef','instance','200',true),
  /Для созданного монстра/);
 assert.equal(x.writes.length,0);
 assert.equal(x.edits.length,0);
 assert.equal(x.queue.size,0);
});
test('dungeon monster picker routes changed custom IDs to the actual instance record',async()=>{
 const owner='owner-monster-abcdefabcdef';
 // Verify the exact onChange branch for the real UI, then exercise the writer.
 const onChange=source.slice(source.indexOf("const monsterRelations=wikiOwnerEntityList({"),
  source.indexOf("mapBind(monsterRelations.querySelector('h4')"));
 assert.match(onChange,/if\(type==='instance'&&ownerChange\)/);
 assert.match(onChange,/saveWikiRecordList\('instance',id,'mobs',mobs,/);
 const patchStart=source.indexOf('async function saveWikiRecordPatch(');
 const patchEnd=source.indexOf('\nasync function saveWikiSpawns(',patchStart);
 assert.ok(patchStart>=0&&patchEnd>patchStart);
 const original={maps:{100:{mobs:[600]}},instances:[{id:200,mobs:[600]}],
  monsters:{600:{name:'Source monster'}}};
 const before=JSON.stringify(original),overrides={},writes=[],edits=[],queue=new Map();
 let rebuilt=window.PandoraWikiOwnerData.apply(original,overrides);
 const index={records(type){
  if(type==='instance')return Object.fromEntries(rebuilt.instances.map(x=>[String(x.id),x]));
  return {};
 }};
 const factory=Function('wikiData','wikiIndex','window','activeOverride','apiRequest',
  'override','ownerEdits','refreshOwnerCatalog','refreshOwnerUI','wikiRecordWriteQueue','wt',
  'const adminToken="test",adminEditing=true;let editIsSaving=false;\n'+
  source.slice(patchStart,patchEnd)+'\nreturn saveWikiRecordList;');
 const save=factory(rebuilt,index,window,key=>overrides[key]??null,
  async (path,payload)=>writes.push({path,payload}),overrides,edits,
  async()=>{rebuilt=window.PandoraWikiOwnerData.apply(original,overrides)},
  ()=>{},queue,(ru,en)=>ru);
 await save('instance',200,'mobs',[600],[600,owner]);
 assert.equal(writes.length,1,'A single instance override, not ignored spawnedit');
 assert.equal(writes[0].payload.key,'wikiedit.instance.200');
 assert.deepEqual(JSON.parse(JSON.stringify(rebuilt.instances[0].mobs)),[600,owner]);
 await assert.rejects(save('instance',200,'mobs',[600],[600]),
  /Список уже изменён/,'An old editor cannot undo the custom monster link');
 assert.equal(writes.length,1);
 assert.equal(JSON.stringify(original),before);
});
