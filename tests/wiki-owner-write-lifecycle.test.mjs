import test from 'node:test';
import assert from 'node:assert/strict';
import {readFileSync} from 'node:fs';

const source=readFileSync(new URL('../pandora-studio-app.js',import.meta.url),'utf8');
const extract=(start,end)=>{
 const from=source.indexOf(start),to=source.indexOf(end,from+start.length);
 assert.ok(from>=0&&to>from,'Function boundaries must be available');
 return source.slice(from,to);
};
const spawns=extract('async function saveWikiSpawns(','\nasync function saveWikiRelationRows(');
const relations=extract('async function saveWikiRelationRows(','\nfunction wikiOwnerNumeric(');
const trade=extract('async function saveWikiTradeRecipe(','\nasync function saveWikiAcquisitions(');
const acquisition=extract('async function saveWikiAcquisitions(','\nfunction inlineWikiText(');

function deferred(){
 let resolve,reject;
 const promise=new Promise((yes,no)=>{resolve=yes;reject=no});
 return {promise,resolve,reject};
}
function environment(data={}){
 const writes=[],editStates=[],override={},ownerEdits=[];
 const pending=deferred();
 let refreshes=0;
 const apiRequest=async(path,payload)=>{writes.push({path,payload});};
 const refreshOwnerCatalog=async()=>{refreshes++;return pending.promise;};
 const refreshOwnerUI=(isSaving)=>{editStates.push(isSaving)};
 return {writes,editStates,override,ownerEdits,pending,apiRequest,
  refreshOwnerCatalog,refreshOwnerUI,refreshes:()=>refreshes,...data};
}

test('single-key monster spawn write stays pending until encyclopedia refresh resolves',async()=>{
 const state=environment();
 const data={monsters:{600:{}},maps:{100:{mobs:[600]},101:{mobs:[]}},instances:[]};
 const current=[{type:'map',id:'100'}];
 const save=Function('wikiData','wikiIndex','window','activeOverride',
  'apiRequest','override','ownerEdits','refreshOwnerCatalog','refreshOwnerUI',
  'const adminToken="test",adminEditing=true;let editIsSaving=false;\n'+spawns+
  '\nreturn {save:saveWikiSpawns,isSaving:()=>editIsSaving};')(
  data,{locations:()=>current},{PandoraWikiOwnerData:{validSpawns:rows=>
   rows.every(row=>['map','instance'].includes(row.type)&&Boolean(row.id))}},
  ()=>null,state.apiRequest,state.override,state.ownerEdits,
  state.refreshOwnerCatalog,()=>state.refreshOwnerUI());
 let complete=false;
 const writing=save.save(600,'map','101',true).then(()=>{complete=true});
 await new Promise(resolve=>setImmediate(resolve));
 assert.equal(state.writes.length,1);
 assert.equal(state.refreshes(),1);
 assert.equal(save.isSaving(),true);
 assert.equal(complete,false,'Save must not complete while Wiki still reindexes');
 assert.deepEqual(JSON.parse(state.writes[0].payload.value),[
  {type:'map',id:'100'},{type:'map',id:'101'}]);
 state.pending.resolve();
 await writing;
 assert.equal(complete,true);
 assert.equal(save.isSaving(),false);
 assert.equal(state.ownerEdits.length,1);
});

test('drop rows save finishes only after related item sources are refreshed',async()=>{
 const state=environment();
 const data={monsters:{600:{}},items:{1:{},2:{}}};
 const save=Function('wikiData','window','activeOverride','apiRequest',
  'ownerEdits','override','refreshOwnerCatalog','refreshOwnerUI',
  'const adminToken="test",adminEditing=true;let editIsSaving=false;\n'+relations+
  '\nreturn {save:saveWikiRelationRows,isSaving:()=>editIsSaving};')(
  data,{PandoraWikiOwnerData:{validDrops:row=>
   Array.isArray(row.d)&&Array.isArray(row.s),validChest:()=>true}},
  ()=>null,state.apiRequest,state.ownerEdits,state.override,
  state.refreshOwnerCatalog,()=>state.refreshOwnerUI());
 let complete=false;
 const work=save.save('drop',600,{d:[{i:1,n:1,p:20}],s:[]})
  .then(()=>{complete=true});
 await new Promise(resolve=>setImmediate(resolve));
 assert.equal(complete,false);
 assert.equal(save.isSaving(),true);
 assert.equal(state.writes.length,1);
 state.pending.resolve();
 await work;
 assert.equal(complete,true);
 assert.equal(save.isSaving(),false);
});

test('NPC trade and item source writes also await a single completed Wiki refresh',async()=>{
 for(const kind of ['trade','acquisition']){
  const state=environment(),data={
   items:{1:{}},monsters:{},trades:{npcs:{7:{}}},
   ownerAcquisitions:{}
  };
  const definition=kind==='trade'?trade:acquisition;
  const args=kind==='trade'?
   ['wikiData','window','activeOverride','apiRequest','override','ownerEdits','refreshOwnerCatalog','refreshOwnerUI']:
   ['wikiData','activeOverride','apiRequest','override','ownerEdits','refreshOwnerCatalog','refreshOwnerUI'];
  const factory=Function(...args,
   'const adminToken="test",adminEditing=true;let editIsSaving=false;\n'+definition+
   '\nreturn {save:'+(kind==='trade'?'saveWikiTradeRecipe':'saveWikiAcquisitions')+
   ',isSaving:()=>editIsSaving};');
  const common=[data];
  if(kind==='trade')common.push({PandoraStudioTradeOwnerData:{recipeValid:()=>true}});
  common.push(()=>null,state.apiRequest,state.override,state.ownerEdits,
   state.refreshOwnerCatalog,()=>state.refreshOwnerUI());
  const handler=factory(...common),payload=kind==='trade'?
   [{id:20,i:1,npc:[7],mats:[{i:1,n:1}]},null]:
   [1,[{type:'npc',id:'7'}]];
  let complete=false;
  const work=handler.save(...payload).then(()=>{complete=true});
  await new Promise(resolve=>setImmediate(resolve));
  assert.equal(state.writes.length,1,kind);
  assert.equal(state.refreshes(),1,kind);
  assert.equal(complete,false,kind+' cannot finish before catalog refresh');
  assert.equal(handler.isSaving(),true);
  state.pending.resolve();
  await work;
  assert.equal(complete,true);
  assert.equal(handler.isSaving(),false);
 }
});

// One D1 spawnedit key must replace a location without deleting unrelated
// instance/source links or issuing two separate writes.
test('game-monster spawn location replacement publishes one atomic override',async()=>{
 const host={};
 Function('window',readFileSync(new URL('../pandora-studio-wiki-owner-data.js',import.meta.url),'utf8'))(host);
 const state=environment();
 const source={monsters:{600:{}},maps:{
  100:{id:100,mobs:[600]},200:{id:200,mobs:[]}
 },instances:[{id:300,mobs:[600]}]};
 const places=[{type:'map',id:100},{type:'instance',id:300}];
 const factory=Function('wikiData','wikiIndex','window','activeOverride',
  'apiRequest','override','ownerEdits','refreshOwnerCatalog','refreshOwnerUI',
  'const adminToken="test",adminEditing=true;let editIsSaving=false;\n'+spawns+
  '\nreturn saveWikiSpawns;');
 const save=factory(source,{locations:()=>places},host,
  ()=>null,state.apiRequest,state.override,state.ownerEdits,
  state.refreshOwnerCatalog,()=>state.refreshOwnerUI());
 const op=save(600,'map','200',true,'100');
 await new Promise(resolve=>setImmediate(resolve));
 assert.equal(state.writes.length,1,'One replacement equals one D1 write');
 assert.equal(state.writes[0].payload.key,'spawnedit.600');
 assert.deepEqual(JSON.parse(state.writes[0].payload.value),[
  {type:'instance',id:'300'},{type:'map',id:'200'}]);
 const changed=host.PandoraWikiOwnerData.apply(source,{
  'spawnedit.600':state.writes[0].payload.value
 });
 assert.deepEqual(changed.maps[100].mobs,[]);
 assert.deepEqual(changed.maps[200].mobs,[600]);
 assert.deepEqual(changed.instances[0].mobs,[600]);
 assert.deepEqual(source.maps[100].mobs,[600],
  'The game source stays intact until the owner override is applied');
 state.pending.resolve();await op;
 assert.equal(state.ownerEdits.length,1,'Undo/redo tracks only one key');
 await assert.rejects(save(600,'map','200',true,'999'),/больше не найдено/);
 assert.equal(state.writes.length,1,'Stale replacement does not reach D1');
});

const itemWrite=extract('async function saveWikiItemField(','\nasync function saveWikiTradeRecipe(');
const undoWrite=extract('async function undoOwnerEdit(','\nfunction showOverrideManager(');

test('item save keeps its busy state until the new Wiki item index is ready',async()=>{
 const state=environment();
 const instance=Function('catalogSource','officialEnglish','window',
  'activeOverride','apiRequest','override','ownerEdits','refreshOwnerCatalog',
  'refreshOwnerUI',
  'const adminEditing=true,adminToken="test";let editIsSaving=false;\n'+
  itemWrite+'\nreturn {save:saveWikiItemField,isSaving:()=>editIsSaving};')(
  {items:{1:{name:'Спата',slot:'weapon'}}},null,
  {PandoraStudioItemOwnerEditor:{ownPatch:()=>({})}},
  ()=>null,state.apiRequest,state.override,state.ownerEdits,
  state.refreshOwnerCatalog,()=>state.refreshOwnerUI());
 let complete=false;
 const operation=instance.save(1,'name','Прочная спата').then(()=>{complete=true});
 await new Promise(resolve=>setImmediate(resolve));
 assert.equal(state.writes.length,1);
 assert.equal(state.writes[0].payload.key,'itemedit.1');
 assert.equal(state.refreshes(),1);
 assert.equal(instance.isSaving(),true);
 assert.equal(complete,false);
 state.pending.resolve();await operation;
 assert.equal(complete,true);
 assert.equal(instance.isSaving(),false);
 assert.equal(state.ownerEdits.length,1);
});

test('Undo cannot clear busy state until edited Wiki data has refreshed',async()=>{
 const state=environment(),alerts=[];
 state.ownerEdits.push({key:'itemedit.1',before:null,
  after:'{"name":"Прочная спата"}'});
 state.override['itemedit.1']='{"name":"Прочная спата"}';
 const instance=Function('apiRequest','ownerEdits','override',
  'closeInlineEditor','refreshVisibleWikiLabels','refreshOwnerCatalog',
  'refreshOwnerUI','alert',
  'const adminToken="test";let editIsSaving=false,wikiLabelPendingWrites=0;const wikiRecordWriteQueue=new Map();\n'+
  undoWrite+'\nreturn {undo:undoOwnerEdit,isSaving:()=>editIsSaving};')(
  state.apiRequest,state.ownerEdits,state.override,()=>{},()=>{},
  state.refreshOwnerCatalog,()=>state.refreshOwnerUI(),m=>alerts.push(m));
 let finished=false;
 const operation=instance.undo().then(()=>{finished=true});
 await new Promise(resolve=>setImmediate(resolve));
 assert.equal(state.writes.length,1);
 assert.equal(state.writes[0].path,'/api/admin/reset');
 assert.equal(state.refreshes(),1);
 assert.equal(instance.isSaving(),true);
 assert.equal(finished,false);
 state.pending.resolve();await operation;
 assert.equal(instance.isSaving(),false);
 assert.equal(finished,true);
 assert.equal(state.ownerEdits.length,0);
 assert.deepEqual(alerts,[]);
});
