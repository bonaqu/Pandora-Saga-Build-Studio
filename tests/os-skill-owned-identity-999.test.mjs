import test from 'node:test';
import assert from 'node:assert/strict';
import {readFileSync} from 'node:fs';

const read=p=>readFileSync(new URL('../'+p,import.meta.url),'utf8');
const env={};
Function('window',read('pandora-os-character-calculator.js'))(env);
const C=env.PandoraOSCalculator;
const items=JSON.parse(read('data/os/items.json'));
const skills=JSON.parse(read('data/os/skills.json'));
const classes=JSON.parse(read('data/os/classes.json'));
const stats={vit:50,str:70,agi:70,dex:55,spi:80,int:35};
const combat={attack:{walkingBase:160},defense:{directRaw:80},
 accuracy:{base:100},dodge:{base:130}};
const cloak=(id,skillCatalog)=>C.battleMapCloakPreview({
 records:[['item:'+id,items[id],0]],skills:skillCatalog}).entries;
const healParams={level:50,int:90,spi:70,benevolence:60,
 healingPercent:120,jobKey:'CLERIC',benevolenceCap:classes.CLERIC.branchCaps.benevolence};
const heal=skillCatalog=>C.healingSpellsPreview({...healParams,skillCatalog});
const scale=skillCatalog=>C.scalingSkillPreview({
 skillCatalog,jobKey:'WARRIOR',level:45,branchCaps:classes.WARRIOR.branchCaps,
 branchMasteries:{},stats,combat});

test('all 571 current game skill identities are canonical numeric IDs',()=>{
 assert.equal(Object.keys(skills).length,571);
 for(const [key,record] of Object.entries(skills)){
  assert.ok(Number.isSafeInteger(record.id),key);
  assert.equal(String(record.id),key);
 }
});

test('nine real battle-map cloak previews retain exact original tiers',()=>{
 const ids=[18022,18023,18024,18025,18026,18027,18028,18029,18030];
 const expected=[[2,1,300,0,0],[3,3,1000,0,0],[5,5,2000,5,10]];
 for(const [index,id] of ids.entries()){
  const entry=cloak(id,skills)[0];
  assert.ok(entry,'cloak '+id);
  assert.deepEqual([entry.all,entry.armor,entry.hp,entry.resistance,entry.magic],
   expected[index%3],String(id));
 }
});

test('text IDs or damaged skills cannot unlock battle-map cloak buffs',()=>{
 const id=items[18024].effects.find(e=>e.func==='EP_SKILL_EXEC_MAPIN')?.a;
 assert.equal(id,500000046);
 const record=skills[id];
 for(const [label,changed] of [
  ['text id',{...record,id:String(id)}],
  ['foreign id',{...record,id:id+1}],
  ['null effect',{...record,funcs:[null,...record.funcs.slice(1)]}],
  ['string funcs',{...record,funcs:'invalid'}]
 ]){
  assert.deepEqual(cloak(18024,{...skills,[id]:changed}),[],label);
 }
});

test('valid healing source models retain current cleric and priest coefficients',()=>{
 const cleric=heal(skills);
 const priest=C.healingSpellsPreview({...healParams,jobKey:'PRIEST',
  benevolenceCap:classes.PRIEST.branchCaps.benevolence,skillCatalog:skills});
 assert.deepEqual(cleric.rows.map(x=>x.amount),[705,1680,1506,480,24]);
 assert.deepEqual(priest.rows.map(x=>x.amount),[388,1044,1164,480,24]);
 assert.ok(cleric.rows.every(x=>x.available));
});

test('healing spells reject textual source skill IDs and malformed effect rows',()=>{
 const linked=skills[310023002];
 for(const [target,changed,affected] of [
  [310001002,{...skills[310001002],id:'310001002'},310001002],
  [310023002,{...linked,id:'310023002'},310023001],
  [310023002,{...linked,funcs:[null]},310023001],
  [310001002,{...skills[310001002],funcs:[null]},310001002]
 ]){
  const copy={...skills,[target]:changed};
  const rows=heal(copy).rows;
  assert.notEqual(rows.find(row=>row.skillId===affected)?.available,true,
   'invalid source must never be shown as usable '+target);
 }
});

test('source-backed skill coefficient inspector declines string IDs and malformed funcs',()=>{
 const authentic=scale(skills);
 const base=authentic.offense.find(row=>row.id===320001001);
 assert.equal(base.amount,42);
 const row=skills[320001001];
 for(const [name,changed] of [
  ['text source ID',{...row,id:String(row.id)}],
  ['non-array effect list',{...row,funcs:'invalid'}],
  ['foreign source ID',{...row,id:row.id+1}]
 ]){
  const mutated=scale({...skills,[row.id]:changed});
  assert.equal(mutated.offense.some(x=>x.id===row.id),false,name);
 }
});
