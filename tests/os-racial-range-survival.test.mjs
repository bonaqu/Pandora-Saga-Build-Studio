import test from 'node:test';
import assert from 'node:assert/strict';
import {readFileSync} from 'node:fs';

const read=path=>readFileSync(new URL('../'+path,import.meta.url),'utf8');
const skills=JSON.parse(read('data/os/skills.json'));
const race=JSON.parse(read('data/os/racialPassives.json'));
const classes=JSON.parse(read('data/os/classes.json'));
const tables=JSON.parse(read('data/os/tables.json'));
const code=read('pandora-os-character-calculator.js');
const host={};Function('window',code)(host);
const C=host.PandoraOSCalculator;
const zero={vit:0,str:0,agi:0,dex:0,spi:0,int:0};
const base=(raceKey,id,weapon=null)=>C.base({
 classData:classes.WARRIOR,raceData:tables.raceInit[raceKey],
 jobData:tables.jobInit.WARRIOR,allocation:zero,level:20,
 potionContext:{racialPassiveId:id},combatContext:{weapon,skillCatalog:skills}
});

test('Elf Sharpsight publishes two matching source fields, not two range bonuses',()=>{
 assert.ok(race.ELF.skills.includes(900020002));
 const skill=skills['900020002'];
 assert.equal(skill.id,900020002);
 assert.equal(skill.skillType,'PASSIVE');
 const range=skill.funcs.find(f=>f.ep==='EP_RACE_RANGE');
 const carry=skill.funcs.find(f=>f.ep==='EP_RACE_CARRY');
 assert.equal(range.dir,'TARGET');
 assert.equal(carry.dir,'TARGET');
 assert.equal(range.fv1[3],500);
 assert.equal(carry.fv1[3],500);
 const bonus=C.racialUtilityPreview({racialPassiveId:900020002,skillCatalog:skills});
 assert.equal(bonus.id,900020002);
 assert.deepEqual(bonus.range,{general:500,carry:500});
 assert.equal(bonus.survival,null);
 const out=base('ELF',900020002,{slot:'weapon',kind:'BOW',range:2800,W:42});
 assert.equal(out.attackRange.baseRanged,2800);
 assert.equal(out.attackRange.general,0,'equipped-item bonus remains independent');
 assert.equal(out.attackRange.racialGeneral,500);
 assert.equal(out.attackRange.racialCarry,500);
 assert.equal(out.attackRange.baseRanged+out.attackRange.racialGeneral,3300,
  'an illustrative sum is NOT published as final game-client range');
 assert.equal(out.attackRange.verified,false);
});

test('Elf passive never adds paired CARRY as another +500 or inflates equipment totals',()=>{
 const eye={name:'Прицел',effects:[{func:'EP_RACE_RANGE',a:50},
  {func:'EP_RACE_CARRY',a:50}]};
 const out=C.attackRangePreview({records:[['item:fixture',eye,0]],
  racialEffects:C.racialUtilityPreview({racialPassiveId:900020002,skillCatalog:skills})});
 assert.deepEqual([out.general,out.bow,out.racialGeneral,out.racialCarry],
  [50,0,500,500]);
 assert.equal(out.entries.length,1);
 const selectedNoWeapon=base('ELF',900020002);
 assert.equal(selectedNoWeapon.attackRange.baseOnly,false);
 assert.equal(selectedNoWeapon.attackRange.racialGeneral,500);
 const deselected=base('ELF',null);
 assert.equal(deselected.attackRange.racialGeneral,0);
 assert.equal(deselected.attackRange.racialCarry,0);
});

test('Dwarf Stronghearted has a conditional source chance, without static HP or armor',()=>{
 assert.ok(race.DWARF.skills.includes(900030001));
 const skill=skills['900030001'];
 const effect=skill.funcs.filter(f=>f.ep==='EP_RACE_TOUGH_HEART'&&f.dir==='TARGET');
 assert.equal(effect.length,1);
 assert.equal(effect[0].fv1[3],20);
 const preview=C.racialUtilityPreview({racialPassiveId:900030001,skillCatalog:skills});
 assert.equal(preview.survival.chance,20);
 assert.equal(preview.survival.verified,false);
 assert.equal(preview.range,null);
 const ordinary=base('DWARF',null),selected=base('DWARF',900030001);
 assert.deepEqual([selected.hp,selected.mp],[ordinary.hp,ordinary.mp]);
 assert.equal(selected.combat.defense.known,ordinary.combat.defense.known);
 assert.equal(selected.racialEffects.survival.chance,20);
 assert.equal(selected.attackRange.racialGeneral,0);
 assert.equal(selected.resistances.status.stun,ordinary.resistances.status.stun+10);
 assert.equal(selected.resistances.status.numb,ordinary.resistances.status.numb+10);
 assert.equal(selected.resistances.status.tumble,ordinary.resistances.status.tumble+10);
});

test('wrong skill IDs and malformed/missing current OS source fail closed',()=>{
 const selected=900020002;
 assert.equal(C.racialUtilityPreview({racialPassiveId:selected}),null);
 assert.equal(C.racialUtilityPreview({racialPassiveId:900020001,skillCatalog:skills}),null);
 assert.equal(C.racialUtilityPreview({racialPassiveId:900030003,skillCatalog:skills}),null);
 assert.equal(C.racialUtilityPreview({racialPassiveId:selected,skillCatalog:{}}),null);
 const altered=structuredClone(skills[selected]);
 altered.funcs.find(f=>f.ep==='EP_RACE_CARRY').fv1[3]=250;
 assert.equal(C.racialUtilityPreview({racialPassiveId:selected,
  skillCatalog:{...skills,[selected]:altered}}),null);
 const invalid=structuredClone(skills[900030001]);
 invalid.funcs.find(f=>f.ep==='EP_RACE_TOUGH_HEART').fv1[3]=null;
 assert.equal(C.racialUtilityPreview({racialPassiveId:900030001,
  skillCatalog:{...skills,900030001:invalid}}),null);
 const duplicate=structuredClone(skills[selected]);
 duplicate.funcs.push(structuredClone(duplicate.funcs.find(f=>f.ep==='EP_RACE_RANGE')));
 assert.equal(C.racialUtilityPreview({racialPassiveId:selected,
  skillCatalog:{...skills,[selected]:duplicate}}),null);
});

test('Hero Book exposes source value with partial-warning notes in both locales',()=>{
 const book=read('pandora-studio-hero-book.js');
 assert.doesNotMatch(book,/modifiers\?\.attackRange\?\.racialGeneral/);
 assert.match(book,/calc\?\.attackRange\?\.baseRanged/);
 assert.ok(C.racialUtilityPreview({racialPassiveId:900020002,skillCatalog:skills}));
 assert.match(book,/calc\?\.racialEffects\?\.survival/);
 assert.match(book,/Упрямое сердце:/);
 assert.match(book,/Stronghearted: /);
 assert.match(book,/Dwarven racial survival/);
});
