import test from 'node:test';
import assert from 'node:assert/strict';
import {readFileSync} from 'node:fs';

const read=path=>readFileSync(new URL('../'+path,import.meta.url),'utf8');
const env={};
Function('window',read('pandora-os-character-calculator.js'))(env);
const C=env.PandoraOSCalculator;
const skills=JSON.parse(read('data/os/skills.json'));
const classes=JSON.parse(read('data/os/classes.json'));
const items=JSON.parse(read('data/os/items.json'));
const tables=JSON.parse(read('data/os/tables.json'));
const clone=value=>structuredClone(value);
const recipients={selected:{combatWarCry:true},jobKey:'WIZARD',level:45,skillCatalog:skills};
const windSelected={combatWindAssist:true,combatWindBlessing:true};

test('actual three ally-caster skill roots preserve current ID, class and coefficient contracts',()=>{
 const cry=C.combatSkillSource(skills,'warCry');
 const wind=C.supportSkillSource(skills,'windAssist');
 const blessing=C.supportSkillSource(skills,'windBlessing');
 assert.deepEqual(cry.effects,{EP_DAMAGERATE_CONST:10,EP_DAMAGERATE_SCALE:20});
 assert.deepEqual(wind.values,{EP_AVOIDANCE_CONST:15,EP_AVOIDANCE_SCALE:15});
 assert.deepEqual(blessing.values,{EP_MOVESPEED_SCALE:40});
 assert.equal(C.activeCombatSkills(recipients).warCry,true);
 assert.deepEqual(C.supportSkillAvailability({selected:windSelected,
  skillCatalog:skills,jobKey:'WIZARD',level:45}),
  {windAssist:true,windBlessing:true});
});

test('missing, foreign and string-valued caster-class claims cannot unlock allied buffs',()=>{
 const targets=[
  [320001001,'warCry'],[260006001,'windAssist'],
  [320004001,'windBlessing']
 ];
 let invalid=0;
 for(const [id,kind] of targets){
  for(const change of [
   s=>{s.classes={}},
   s=>{s.classes={UNKNOWN_CLASS:1}},
   s=>{s.classes[Object.keys(s.classes)[0]]='1'},
   s=>{s.classes[Object.keys(s.classes)[0]]=0},
   s=>{s.classes.UNKNOWN_CLASS=1},
   s=>{delete s.classes}
  ]){
   const altered=clone(skills);
   change(altered[String(id)]);
   if(kind==='warCry'){
    assert.equal(C.combatSkillSource(altered,kind),null);
    assert.equal(C.activeCombatSkills({...recipients,skillCatalog:altered}).warCry,false);
   }else{
    assert.equal(C.supportSkillSource(altered,kind),null);
    const setting=kind==='windAssist'?'combatWindAssist':'combatWindBlessing';
    assert.equal(C.supportSkillAvailability({selected:{[setting]:true},
     skillCatalog:altered,jobKey:'WIZARD',level:45})[kind],false);
   }
   invalid++;
  }
 }
 assert.equal(invalid,18);
});

test('own-class combat toggle requires numeric source class access, not truthy labels',()=>{
 const altered=clone(skills);
 altered['100052001'].classes.GLADIATOR='1';
 const opts={selected:{combatRage:true},jobKey:'GLADIATOR',level:35,
  skillCatalog:altered};
 assert.equal(C.activeCombatSkills(opts).raging,false);
 altered['100052001'].classes.GLADIATOR=1;
 assert.equal(C.activeCombatSkills(opts).raging,true);
});

test('ally recipients retain buffs across all 28 jobs and levels 1..55',()=>{
 let compared=0;
 for(const jobKey of Object.keys(classes))
  for(let level=1;level<=55;level++){
   const cry=C.activeCombatSkills({...recipients,jobKey,level});
   const wind=C.supportSkillAvailability({selected:windSelected,
    skillCatalog:skills,jobKey,level});
   assert.equal(cry.warCry,true,jobKey+' L'+level);
   assert.deepEqual(wind,{windAssist:true,windBlessing:true});
   compared++;
  }
 assert.equal(compared,1540);
});

test('only real numeric staff IDs activate specific staff MATK exceptions',()=>{
 const source={...items['2841']};
 const cfg=weapon=>C.magicAttackPreview({int:50,jobKey:'WIZARD',
  magicMastery:0,guildArouse:0,weapon});
 assert.equal(cfg(source).staff,20);
 for(const id of [2841,2802,2812]){
  const item=items[String(id)];
  assert.equal(item.id,id);
  assert.equal(item.kind,'STAFF');
  assert.equal(cfg(item).staff,id===2841?20:0);
  for(const malformed of [String(id),[id],true,null,{}]){
   const restored=cfg({...item,id:malformed});
   assert.equal(restored?.staff,15,'wrong kind-specific source '+id);
  }
 }
 const wand=Object.values(items).find(item=>item.kind==='WAND');
 assert.ok(wand&&Number.isSafeInteger(wand.id));
 assert.equal(cfg(wand).staff,10);
});

test('invalid saved refinement grade cannot silently yield MATK from +5 magic tier',()=>{
 const input={int:50,jobKey:'WIZARD',weapon:items['2841'],
  weaponEnhancementType:'magical',magicPlus:tables.magicPlus};
 for(const value of [null,'5',[5],true,false,1.5,-1,11,{},NaN])
  assert.equal(C.magicAttackPreview({...input,weaponGrade:value}),null,
   'invalid magical grade '+String(value));
 const actual=C.magicAttackPreview({...input,weaponGrade:5});
 assert.equal(actual.staff,20);
 assert.equal(actual.refinement,tables.magicPlus['5'].ratio);
});

test('all 29 actual staves/wands stay numeric and usable across 1392 grade/stat cases',()=>{
 const weapons=Object.values(items).filter(item=>['STAFF','WAND'].includes(item.kind));
 assert.equal(weapons.length,29);
 let cases=0;
 for(const weapon of weapons){
  assert.ok(Number.isSafeInteger(weapon.id));
  for(const int of [10,30,50,90,120,160])
   for(const grade of [0,1,5,10])
    for(const mode of ['physical','magical']){
     const result=C.magicAttackPreview({int,jobKey:'WIZARD',weapon,
      weaponGrade:grade,weaponEnhancementType:mode,magicPlus:tables.magicPlus});
     assert.ok(result&&Number.isFinite(result.known),
      weapon.id+' '+int+' +'+grade+' '+mode);
     assert.equal(result.staff,weapon.kind==='WAND'?10:
      [2802,2812].includes(weapon.id)?0:weapon.id===2841?20:15);
     cases++;
    }
 }
 assert.equal(cases,1392);
});
