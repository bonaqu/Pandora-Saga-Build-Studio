import test from 'node:test';
import assert from 'node:assert/strict';
import {readFileSync} from 'node:fs';

const read=path=>readFileSync(new URL('../'+path,import.meta.url),'utf8');
const source=read('pandora-studio-app.js');
const css=read('pandora-studio-wiki-polish.css');

test('level reward layout is compact and class appears below level as a chip',()=>{
 const begin=css.indexOf('/* Compact vertical rhythm:');
 const end=css.indexOf('.wiki-equipment-view button{',begin);
 assert.ok(begin>=0&&end>begin);
 const rules=css.slice(begin,end);
 assert.match(rules,/max-width:480px/);
 assert.match(rules,/grid-template-columns:minmax\(0,1fr\)/);
 assert.match(rules,/\.wiki-level-reward-details \.wiki-level-reward-class/);
 assert.match(rules,/border-radius:999px/);
 assert.match(css,/repeat\(auto-fit,minmax\(min\(100%,205px\),1fr\)\)/);
 assert.match(source,/class:'wiki-level-reward-class'/);
});

test('owner item source picker can create a real reverse-indexed monster loot row',async()=>{
 const start=source.indexOf(' const appendAcquisitionEditor=(id)=>{');
 const end=source.indexOf('\n const draw=(detailOnly=false)=>{',start);
 assert.ok(start>=0&&end>start);
 const elements=[],appended=[],changes=[],references=[];
 const h=(tag,props={},children=[])=>{
  const node={tag,...props,children:Array.isArray(children)?children:[],
   append(...items){this.children.push(...items)},
   replaceChildren(...items){this.children=items},
   after(node){this.insertedAfter=node},
   focus(){}};
  elements.push(node);
  return node;
 };
 const data={
  items:{1:{name:'Example item'},2:{name:'Existing loot'}},
  monsters:{600:{name:'Example monster',level:15},'owner-monster-a1b2c3d4e5f6':{ownerCreated:true}},
  drops:{600:{d:[{i:2,p:20,n:1}],s:[]}},
  trades:{npcs:{7:{name:'Example NPC'}}},
  ownerAcquisitions:{}
 };
 const make=Function('detail','h','wt','ownerPlainTextField',
  'registerOutsidePicker','wikiData','wikiIndex','dataName',
  'saveWikiRelationRows','saveWikiAcquisitions',
  "const adminEditing=true,adminToken='test';\n"+source.slice(start,end)+
  '\nreturn appendAcquisitionEditor;');
 const addEditor=make({append:node=>appended.push(node),querySelector:()=>null},
  h,(ru)=>ru,props=>h('input',props),()=>{},data,
  {normalize:x=>String(x).toLowerCase(),sources:()=>[]},
  (kind,id)=>kind+':'+id,
  async(kind,id,rows)=>changes.push({kind,id,rows}),
  async(id,rows)=>references.push({id,rows}));
 addEditor('1');
 assert.equal(appended.length,1);
 appended[0].onclick();
 const kind=elements.find(node=>node.tag==='select'&&node['aria-label']==='Тип получения');
 const target=elements.find(node=>node.tag==='select'&&node['aria-label']==='Выбери источник');
 const feedback=elements.find(node=>node.tag==='small'&&node.role==='status');
 assert.ok(kind&&target&&feedback);
 kind.value='drop';kind.onchange();
 assert.deepEqual(target.children.filter(x=>x.value).map(x=>x.value),['600'],
  'Owner-created monsters cannot receive unsupported dropedit overrides');
 target.value='600';await target.onchange();
 assert.equal(changes.length,1);
 assert.equal(changes[0].kind,'drop');
 assert.equal(changes[0].id,'600');
 assert.equal(changes[0].rows.d[0].p,20);
 assert.deepEqual(changes[0].rows.d[1],{i:1,n:1,p:null});
 assert.equal(references.length,0,'Real loot rows must not become reference-only links');
 data.drops[600].d.push({i:1,p:5,n:1});
 target.disabled=false;await target.onchange();
 assert.equal(changes.length,1,'Duplicate item loot must not be written twice');
 assert.match(feedback.textContent,/уже есть в добыче/);
 kind.value='npc';kind.onchange();target.value='7';await target.onchange();
 assert.deepEqual(references[0].rows,[{type:'npc',id:'7'}]);
});

test('relation save rejects references to missing items or records before cloud write',async()=>{
 const start=source.indexOf('async function saveWikiRelationRows(');
 const end=source.indexOf('\nfunction wikiOwnerNumeric(',start);
 assert.ok(start>=0&&end>start);
 const calls=[],edits=[],overrides={};
 const make=Function('wikiData','window','apiRequest','activeOverride',
  'ownerEdits','override','refreshOwnerCatalog','refreshOwnerUI',
  "const adminEditing=true,adminToken='test';let editIsSaving=false;\n"+
  source.slice(start,end)+'\nreturn saveWikiRelationRows;');
 const save=make({
   monsters:{600:{}},items:{1:{},3:{}}
  },{PandoraWikiOwnerData:{
   validDrops:rows=>Array.isArray(rows?.d)&&Array.isArray(rows?.s),
   validChest:rows=>Array.isArray(rows)
  }},
  async(path,payload)=>calls.push({path,payload}),
  ()=>null,edits,overrides,()=>{},()=>{});
 await assert.rejects(save('drop',600,{d:[{i:404}],s:[]}),/отсутствует/);
 await assert.rejects(save('drop',999,{d:[{i:1}],s:[]}),/отсутствует/);
 await assert.rejects(save('chest',3,[[{i:404}]]),/отсутствует/);
 await assert.rejects(save('chest',999,[[{i:1}]]),/отсутствует/);
 assert.equal(calls.length,0,'Invalid references must never reach /api/admin/override');
 await save('drop',600,{d:[{i:1,p:null,n:1}],s:[]});
 assert.equal(calls.length,1);
 assert.equal(calls[0].payload.key,'dropedit.600');
});

test('owner reward trade action saves real recipes rather than a reference-only link',()=>{
 assert.match(source,/wiki-owner-reward-trade-button/);
 assert.match(source,/wikiItemChoice\(panel,async materialId=>/);
 assert.match(source,/await saveWikiTradeRecipe\(\{id:unique,i:Number\(id\),npc:\[npcId\],/);
 assert.match(source,/mats:\[\{i:materialId,n:1\}\]/);
 assert.match(source,/Справочная связь не изменяет таблицы добычи и обменов/);
});
