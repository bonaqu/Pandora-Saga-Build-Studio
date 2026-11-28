import test from 'node:test';
import assert from 'node:assert/strict';
import {readFileSync} from 'node:fs';

const read=path=>readFileSync(new URL('../'+path,import.meta.url),'utf8');
const env={};
Function('window',read('pandora-os-character-calculator.js'))(env);
const C=env.PandoraOSCalculator;
const skills=JSON.parse(read('data/os/skills.json'));
const classes=JSON.parse(read('data/os/classes.json'));
const clone=value=>structuredClone(value);
const kinds=Object.keys(C.combatSkillIds);
const stats={vit:40,str:50,agi:70,dex:35,spi:30,int:50};
const source=(catalog,kind)=>C.combatSkillSource(catalog,kind);

test('all five current combat sources keep actual ID, type, coefficients and refinement effects',()=>{
 const values={
  lunge:{EP_ATTACKINTERVAL_SCALE:15},
  warCry:{EP_DAMAGERATE_CONST:10,EP_DAMAGERATE_SCALE:20},
  raging:{EP_DAMAGERATE_SCALE:30,EP_ARMORCLASS_SCALE:-60},
  defender:{EP_DAMAGERATE_SCALE:-20,EP_ARMORCLASS_SCALE:40},
  concentration:{EP_TOHIT_CONST:100}
 };
 for(const kind of kinds){
  const id=C.combatSkillIds[kind],record=skills[String(id)];
  assert.equal(record.id,id);
  assert.deepEqual(source(skills,kind)?.effects,values[kind],kind);
 }
 assert.equal(kinds.length,5);
});

test('wrong numeric/string skill identities and source access cannot authorize a combat buff',()=>{
 let attempts=0;
 for(const kind of kinds){
  const id=C.combatSkillIds[kind];
  const mutations=[
   s=>{s.id=String(id)},
   s=>{s.id=id+1},
   s=>{s.learnable=undefined},
   s=>{s.learnable=null},
   s=>{s.learnable=false},
   s=>{s.prereq=undefined},
   s=>{s.prereq=99},
   s=>{s.skillType='ENEMY'},
   s=>{s.branch='unknown'}
  ];
  for(const change of mutations){
   const altered=clone(skills);
   change(altered[String(id)]);
   assert.equal(source(altered,kind),null,kind+' source rejected');
   attempts++;
  }
 }
 assert.equal(attempts,45);
});

test('malformed, extra and incompatible actions cannot corrupt combat previews',()=>{
 let attempts=0;
 for(const kind of kinds){
  const id=C.combatSkillIds[kind];
  const mutations=[
   s=>{s.funcs[0]=null},
   s=>{s.funcs[0]={}},
   s=>{s.funcs[0].fv1=[0,0,1,7]},
   s=>{s.funcs[0].fv1=[0,0,7]},
   s=>{s.funcs[0].fv2=[0,0,1,0]},
   s=>{s.funcs[0].dir='SELF'},
   s=>{s.funcs.push({ep:'EP_EXTRA',dir:'TARGET',fv1:[0,0,0,99],fv2:[0,0,0,0]})},
   s=>{s.funcs[0]=clone(s.funcs[1])}
  ];
  for(const change of mutations){
   const altered=clone(skills);
   change(altered[String(id)]);
   assert.doesNotThrow(()=>source(altered,kind),kind+' malformed source');
   assert.equal(source(altered,kind),null,kind+' malformed source untrusted');
   attempts++;
  }
 }
 assert.equal(attempts,40);
});

test('known-shape current FV1 coefficient updates remain live rather than frozen',()=>{
 for(const kind of kinds){
  const id=C.combatSkillIds[kind],altered=clone(skills);
  const primary=altered[String(id)].funcs[0];
  const original=primary.fv1[3],newValue=original===100?99:original+1;
  primary.fv1[3]=newValue;
  assert.equal(source(altered,kind)?.effects[primary.ep],newValue);
  assert.equal(source(skills,kind)?.effects[primary.ep],original);
 }
});

test('wind source requires explicit learnable true, prerequisite null and valid effects',()=>{
 for(const kind of Object.keys(C.supportSkillIds)){
  const id=C.supportSkillIds[kind],toggle=kind==='windAssist'?
   'combatWindAssist':'combatWindBlessing';
  const base={selected:{[toggle]:true},skillCatalog:skills,jobKey:'KNIGHT',level:45};
  assert.equal(C.supportSkillAvailability(base)[kind],true,kind);
  for(const change of [
   s=>{s.learnable=null},s=>{delete s.learnable},
   s=>{delete s.prereq},s=>{s.prereq=8},
   s=>{s.funcs[0]=null}
  ]){
   const altered=clone(skills);
   change(altered[String(id)]);
   assert.doesNotThrow(()=>C.supportSkillAvailability({...base,skillCatalog:altered}));
   assert.equal(C.supportSkillAvailability({...base,skillCatalog:altered})[kind],false);
  }
  // An external caster's trained mastery must never be subtracted from the recipient.
  const optional=clone(skills);
  optional[String(id)].reqs=[{branch:'exorcism',amount:26}];
  assert.equal(C.supportSkillAvailability({...base,skillCatalog:optional})[kind],true);
 }
});

test('nullable ally action rows reject their own source without erasing others',()=>{
 const inspiration=C.alliedInspirationPreview({skillCatalog:skills});
 const freeWind=C.alliedFreeWindPreview({skillCatalog:skills,classCatalog:classes});
 assert.equal(inspiration.castTimePercent,50);
 assert.equal(freeWind.bonus,200);
 const malformedInspiration=clone(skills);
 malformedInspiration['320006001'].funcs=[null];
 assert.doesNotThrow(()=>C.alliedInspirationPreview({skillCatalog:malformedInspiration}));
 assert.equal(C.alliedInspirationPreview({skillCatalog:malformedInspiration}),null);
 const malformedWind=clone(skills);
 malformedWind['260010001'].funcs[0]=null;
 assert.doesNotThrow(()=>C.alliedFreeWindPreview({
  skillCatalog:malformedWind,classCatalog:classes}));
 assert.equal(C.alliedFreeWindPreview({
  skillCatalog:malformedWind,classCatalog:classes}),null);
 assert.equal(C.alliedFreeWindPreview({
  skillCatalog:malformedInspiration,classCatalog:classes})?.bonus,200);
 assert.equal(C.alliedInspirationPreview({skillCatalog:malformedWind})?.castTimePercent,50);
});

test('all 28 recipient classes and 55 levels keep ally buffs independent of recipient class',()=>{
 let checked=0;
 for(const job of Object.keys(classes))
  for(let level=1;level<=55;level++){
   const active=C.activeCombatSkills({selected:{combatWarCry:true},
    jobKey:job,level,skillCatalog:skills});
   assert.equal(active.warCry,true,job+' L'+level);
   const wind=C.supportSkillAvailability({selected:{combatWindAssist:true,
    combatWindBlessing:true},jobKey:job,level,skillCatalog:skills});
   assert.equal(wind.windAssist,true,job+' L'+level);
   assert.equal(wind.windBlessing,true,job+' L'+level);
   checked++;
  }
 assert.equal(checked,1540);
});
