import test from 'node:test';
import assert from 'node:assert/strict';
import {readFileSync} from 'node:fs';
const read=path=>readFileSync(new URL('../'+path,import.meta.url),'utf8');
const scope={};Function('window',read('os-calculator.js'))(scope);
const C=scope.PandoraOSCalculator,
 items=JSON.parse(read('data/os/items.json')),
 skills=JSON.parse(read('data/os/skills.json')),
 en=JSON.parse(read('data/os/strings.en.json')),
 classes=JSON.parse(read('data/os/classes.json'));
test('current OS records contain 38 on-use potion/balm items and 49 skill links',()=>{
 const index=C.consumableSkillPreview({items,skills});
 assert.equal(index.rows.length,38);
 assert.equal(index.rows.reduce((n,r)=>n+r.skills.length,0),49);
 assert.ok(index.rows.every(row=>['POTION','BALM'].includes(row.kind)));
 assert.ok(index.rows.every(row=>row.skills.every(skill=>skill.name===skills[skill.id]?.name)));
 assert.equal(index.verified,false,'catalog skill links do not prove activated buffs');
});
test('life-force potion activates two known skills; miracle potion activates one',()=>{
 const index=C.consumableSkillPreview({items,skills});
 const life=index.rows.find(x=>x.id===50014);
 assert.deepEqual(life.skills.map(x=>x.id),[310002002,330005002]);
 assert.deepEqual(life.skills.map(x=>x.name),['Регенерация','Природное восстановление']);
 assert.deepEqual(index.rows.find(x=>x.id===50016).skills.map(x=>x.name),['Очищение']);
 assert.deepEqual(index.rows.find(x=>x.id===90005).skills.map(x=>x.name),['Боевой клич']);
});
test('localized skills are used by ID, not a translated item description guess',()=>{
 const localized=Object.fromEntries(Object.entries(skills).map(([id,row])=>[
  id,{...row,name:en.skills[id]?.n||row.name}
 ]));
 const index=C.consumableSkillPreview({items,skills:localized});
 assert.deepEqual(index.rows.find(x=>x.id===50014).skills.map(x=>x.name),
  ['Regenerate','Mana Restore']);
 assert.deepEqual(index.rows.find(x=>x.id===50016).skills.map(x=>x.name),['Mental Aid']);
 assert.equal(index.rows.length,38);
});
test('misidentified items, fake skills and unsupported triggers never enter the index',()=>{
 const good=items[50016],original=skills[300004002];
 const candidates={
  50016:{...good,id:90000},
  50017:{...items[50017],kind:'MANTLE'},
  90005:{...items[90005],effects:[{func:'EP_SKILL_EXEC_BALM',a:320001050,dir:'SELF'}]},
  90006:{...items[90006],effects:[{func:'EP_SKILL_EXEC_BALM',a:99999999,dir:'TARGET'}]},
  50014:{...items[50014],effects:[{func:'EP_SKILL_EXEC',a:310002002,dir:'CASTER'}]}
 };
 assert.equal(C.consumableSkillPreview({items:candidates,skills}).rows.length,0);
 assert.equal(C.consumableSkillPreview({items:{50016:good},
  skills:{300004002:{...original,id:999}}}).rows.length,0);
 const repeated={...good,effects:[...good.effects,good.effects[0]]};
 const dedup=C.consumableSkillPreview({items:{50016:repeated},skills});
 assert.equal(dedup.rows[0].skills.length,1,'same skill is not printed twice');
 assert.deepEqual(C.consumableSkillPreview({items:null,skills}).rows,[]);
});
test('consumable skill links are separate from permanent HP/MP',()=>{
 const base={
  classData:classes.WARRIOR,
  raceData:{vit:40,str:50,agi:70,dex:35,spi:30,int:50},
  jobData:{vit:0,str:0,agi:0,dex:0,spi:0,int:0},allocation:{},level:55,
  combatContext:{jobKey:'WARRIOR',skillCatalog:skills}
 };
 const noCatalog=C.base(base),withCatalog=C.base({...base,consumableItems:items});
 assert.equal(withCatalog.hp,noCatalog.hp);
 assert.equal(withCatalog.mp,noCatalog.mp);
 assert.deepEqual(withCatalog.stats,noCatalog.stats);
 assert.equal(withCatalog.consumableSkills.rows.length,38);
});
test('Hero Book lists optional on-use skills as a collapsed bilingual encyclopedia section',()=>{
 const stage=read('stage-attributes.js'),src=read('os-calculator.js');
 assert.match(stage,/Предметы, активирующие умения/);
 assert.match(stage,/Items that activate skills/);
 assert.match(stage,/make\('details',\{class:'stage-attribute-row stage-consumable-skills'\}\)/);
 assert.match(stage,/onItem\(entry\.id\)/);
 assert.match(src,/const consumableSkills=consumableSkillPreview/);
});
