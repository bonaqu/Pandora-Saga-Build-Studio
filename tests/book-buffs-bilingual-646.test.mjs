import test from 'node:test';
import assert from 'node:assert/strict';
import {readFileSync} from 'node:fs';
import {runInNewContext} from 'node:vm';
import worker from '../worker/index.js';
const read=p=>readFileSync(new URL('../'+p,import.meta.url),'utf8');
const root={};root.window=root;
runInNewContext(read('pandora-studio-honor-guide.js'),root);
const guide=root.PandoraHonorGuide;

test('Buff section and select guide editors receive independent RU/EN default fields',()=>{
 const source=read('pandora-studio-hero-book.js');
 assert.match(source,/const section=\(ru,en,stableId=null\)=>/);
 assert.match(source,/const select=\(parent,ru,en,key,levels,vital=false,compact=false\)=>/);
 assert.match(source,/section\('Личные умения','Self buffs','self'\)/);
 assert.match(source,/section\('Усиления от союзников','Ally buffs','party'\)/);
 assert.doesNotMatch(source,/section\('ОЗ и ОМ','Vitals'\)/);
 assert.match(source,/select\(passiveGroup,'Сила гильдии','Physical','guildHp'/);
 assert.match(source,/select\(passiveGroup,'Дух гильдии','Spirit','guildMp'/);
 assert.match(source,/guideLabel\(field.firstChild,'buffs.setting.'\+key,\s*ru,en,options\)/);
 assert.match(source,/\'buffs.section.\'\+\(stableId\|\|sectionIndex\+\+\),ru,en,options/);
 assert.doesNotMatch(source,/name,name,options/);
});

test('D1 guide fallback and explicit overrides keep the two languages isolated',()=>{
 const key='buffs.setting.guildHp';
 assert.equal(guide.validOverride('book.'+key,JSON.stringify({ru:'ОЗ гильдии',en:'Guild vitality'})),true);
 for(const badKey of ['book.buffs.setting.guild Hp','book.Buffs.setting.guildHp','book.buffs.setting.guildHp<script>']){
  assert.equal(guide.validOverride(badKey,JSON.stringify({ru:'Title',en:'Title'})),false);
 }
 const initial=guide.field({},key,'Гильдейское ОЗ','Guild HP');
 assert.equal(initial.ru,'Гильдейское ОЗ');
 assert.equal(initial.en,'Guild HP');
 const edited=guide.field({['guideedit.book.'+key]:JSON.stringify({ru:'ОЗ гильдии',en:'Guild vitality'})},
  key,'Гильдейское ОЗ','Guild HP');
 assert.equal(edited.ru,'ОЗ гильдии');
 assert.equal(edited.en,'Guild vitality');
 const rejected=guide.field({['guideedit.book.'+key]:'{bad JSON'},
  key,'Гильдейское ОЗ','Guild HP');
 assert.equal(rejected.ru,'Гильдейское ОЗ');
 assert.equal(rejected.en,'Guild HP');
});


test('Worker accepts existing camelCase D1 guide keys with CAS and rejects unsafe keys',async()=>{
 const values=new Map();
 const env={DB:{prepare(sql){let bound=[];return{
  bind(...args){bound=args;return this},
  async first(){return{id:1}},
  async run(){
   if(!sql.includes('ON CONFLICT(key) DO NOTHING'))throw Error('Unexpected SQL '+sql);
   const [key,value]=bound;
   if(values.has(key))return{meta:{changes:0}};
   values.set(key,value);
   return{meta:{changes:1}};
  }
 }}}};
 const value=JSON.stringify({ru:'ОЗ гильдии',en:'Guild vitality'});
 const save=key=>worker.fetch(new Request('https://ps-build-studio-cloud.bonaqu.workers.dev/api/admin/override',{
  method:'POST',headers:{Origin:'https://bonaqu.github.io',
   Authorization:'Bearer '+'x'.repeat(43),'Content-Type':'application/json'},
  body:JSON.stringify({key,value,expectedValue:null})
 }),env);
 const key='guideedit.book.buffs.setting.guildHp';
 const valid=await save(key);
 assert.equal(valid.status,200,JSON.stringify(await valid.json()));
 assert.equal(values.get(key),value);
 for(const bad of ['guideedit.book.buffs.setting.guild Hp',
  'guideedit.book.Buffs.setting.guildHp','guideedit.book.buffs.setting.guildHp<script>']){
  const response=await save(bad);
  assert.equal(response.status,400,bad);
 }
 assert.equal(values.size,1);
});
