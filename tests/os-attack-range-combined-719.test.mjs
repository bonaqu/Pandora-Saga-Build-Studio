import test from 'node:test';
import assert from 'node:assert/strict';
import {readFileSync} from 'node:fs';
const read=p=>readFileSync(new URL('../'+p,import.meta.url),'utf8');
const host={};Function('window',read('pandora-os-character-calculator.js'))(host);
const C=host.PandoraOSCalculator;
const skills=JSON.parse(read('data/os/skills.json'));
const items=JSON.parse(read('data/os/items.json'));
const locale=JSON.parse(read('data/os/strings.en.json'));
const classes=JSON.parse(read('data/os/classes.json'));
const tables=JSON.parse(read('data/os/tables.json'));
const zero={vit:0,str:0,agi:0,dex:0,spi:0,int:0};
const e=id=>['item:'+id,items[id],0];
const c=(weapon,id,records=[])=>C.base({
 classData:classes.ARCHER,raceData:tables.raceInit.ELF,
 jobData:tables.jobInit.SCOUT,allocation:zero,level:45,records,
 potionContext:{racialPassiveId:id},
 combatContext:{weapon,skillCatalog:skills}
}).attackRange;
test('Eagle Eye +500 and a 1250 crossbow give 1750',()=>{
 const crossbow=items['2402'],skill=skills['900020002'];
 assert.equal(crossbow.range,1250);
 assert.equal(crossbow.kind,'CROSSBOW');
 assert.equal(skill.name,'Зоркость');
 assert.equal(locale.skills['900020002'].n,'Eagle Eye');
 assert.deepEqual(skill.weaponUse,['BOW','CROSSBOW']);
 assert.equal(skill.funcs.find(x=>x.ep==='EP_RACE_RANGE').fv1[3],500);
 assert.deepEqual([c(crossbow,900020002).baseRanged,
  c(crossbow,900020002).racialGeneral,
  c(crossbow,900020002).racialCarry,
  c(crossbow,900020002).racialRanged,
  c(crossbow,900020002).totalRanged],[1250,500,500,500,1750]);
 assert.equal(c(crossbow,900020002).verified,false);
});
test('equipment bonuses count once (no duplicate CARRY)',()=>{
 const equipped=[11083,11202,19006].map(e);
 const plain=c(items['2402'],null,equipped);
 assert.deepEqual([plain.general,plain.bow,plain.totalRanged],[50,350,1650]);
 const withRace=c(items['2402'],900020002,equipped);
 assert.equal(withRace.totalRanged,2150);
 assert.equal(withRace.entries.length,3);
 assert.equal(withRace.equipmentRanged,400);
});
test('bow and melee never share the Elf shooting passive',()=>{
 assert.equal(c({slot:'weapon',kind:'BOW',range:1750,W:12},900020002).totalRanged,2250);
 const sword=c({slot:'weapon',kind:'SWORD',range:115,W:12},900020002,[e(11083),e(11202)]);
 assert.deepEqual([sword.totalMelee,sword.totalRanged,sword.racialRanged,sword.bow],[165,null,0,200]);
});
test('unequip, swap and invalid passives never keep old reach',()=>{
 assert.equal(c(items['2402'],null).totalRanged,1250);
 assert.equal(c(null,900020002).totalRanged,null);
 assert.equal(c(null,900020002).racialRanged,0);
 assert.equal(c({slot:'weapon',kind:'SWORD',range:100},900020002).totalMelee,100);
 assert.equal(C.attackRangePreview({weapon:{slot:'shield',kind:'CROSSBOW',range:1250},
 racialEffects:C.racialUtilityPreview({racialPassiveId:900020002,skillCatalog:skills})}).totalRanged,null);
 const invalid=structuredClone(skills['900020002']);
 invalid.funcs.find(x=>x.ep==='EP_RACE_CARRY').fv1[3]=250;
 assert.equal(C.racialUtilityPreview({racialPassiveId:900020002,
  skillCatalog:{...skills,900020002:invalid}}),null);
});
test('book shows plain-language base, bonus, final and exact RU/EN skill name',()=>{
 const book=read('pandora-studio-hero-book.js');
 for(const phrase of ['calc?.attackRange?.totalRanged','calc?.attackRange?.totalMelee',
  'Дальность атаки надетого оружия','Зоркость · дальность стрельбы',
  'Eagle Eye · shooting range','Дальность атаки дальнего боя · всего',
  'Временные умения без надёжного расчёта пока не включены'])assert.ok(book.includes(phrase),phrase);
 assert.ok(!book.includes('Sharpsight'));
 assert.ok(!book.includes('текущими данными OS.'));
});
