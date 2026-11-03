import test from 'node:test';
import assert from 'node:assert/strict';
import {readFileSync} from 'node:fs';

const read=name=>readFileSync(new URL('../'+name,import.meta.url),'utf8');
const host={};Function('window','document',read('pandora-studio-hero-book.js'))(
 host,{documentElement:{lang:'ru'}});
const effectRows=host.PandoraStageAttributes.independentEffectRows;
const calculator={};Function('window',read('pandora-os-character-calculator.js'))(calculator);
const C=calculator.PandoraOSCalculator;
const items=JSON.parse(read('data/os/items.json'));
const skills=JSON.parse(read('data/os/skills.json'));
const tables=JSON.parse(read('data/os/tables.json'));
const classes=JSON.parse(read('data/os/classes.json'));
const blank={vit:0,str:0,agi:0,dex:0,spi:0,int:0};
const character=(raceKey,passiveId,weapon=null)=>C.base({
 classData:classes.WARRIOR,raceData:tables.raceInit[raceKey],
 jobData:tables.jobInit.WARRIOR,allocation:blank,level:45,
 potionContext:{racialPassiveId:passiveId},
 combatContext:{jobKey:'WARRIOR',weapon,skillCatalog:skills}
});

test('racial weapon passive is visible as source effect only for matching weapon',()=>{
 const right=character('HUMAN',900010001,items[21]);
 assert.ok(right?.combat?.racialWeapon?.matchesCategory);
 const rows=effectRows(right);
 const related=rows.filter(x=>x.ru.includes('Бойцовский дух'));
 assert.equal(related.length,2);
 assert.deepEqual(related.map(x=>[x.value,x.unit]),[[10,''],[12,'%']]);
 assert.ok(related.every(x=>x.en.includes('Fighting spirit')));
 const wrong=character('HUMAN',900010001,items[401]);
 assert.ok(wrong);
 assert.equal(effectRows(wrong).some(x=>x.ru.includes('Бойцовский дух')),false);
 assert.equal(effectRows({...right,combat:{...right.combat,
  racialWeapon:{...right.combat.racialWeapon,matchesCategory:null}}})
  .some(x=>x.ru.includes('Бойцовский дух')),false);
});

test('Elf Sharpsight represents one source effect, not a RANGE+CARRY double bonus',()=>{
 const elf=character('ELF',900020002,items[21]);
 assert.ok(elf);
 assert.equal(elf.attackRange.racialGeneral,500);
 assert.equal(elf.attackRange.racialCarry,500);
 const rows=effectRows(elf).filter(x=>x.ru.startsWith('Зоркость'));
 assert.deepEqual(rows.map(x=>x.value),[500]);
 assert.equal(elf.attackRange.general,0,'equipment bonus remains separate');
 const poisoned={...elf,attackRange:{...elf.attackRange,racialCarry:400}};
 assert.equal(effectRows(poisoned).some(x=>x.ru.startsWith('Зоркость')),false);
});

test('gear range and uncoupled rates are labeled as independent, never final totals',()=>{
 const source={attackRange:{entries:[
  {kind:'general',source:'Точный прицел',amount:50},
  {kind:'bow',source:'Лук мастера',amount:150},
  {kind:'bow',source:'Лук мастера',amount:0},
  {kind:'bow',source:'',amount:99},
  {kind:'fake',source:'Invalid',amount:99}
 ]},combat:{racialRate:{accuracy:10,dodge:5},spellDamageEquipmentRate:12}};
 const rows=effectRows(source);
 assert.equal(rows.length,5);
 assert.ok(rows.some(x=>x.en==='Attack range · Точный прицел'&&x.value===50));
 assert.ok(rows.some(x=>x.ru==='Дальность стрельбы · Лук мастера'&&x.value===150));
 assert.ok(rows.some(x=>x.ru.includes('Подавление гнева')&&x.unit==='%'));
 assert.equal(rows.some(x=>x.ru.includes('Invalid')),false);
 assert.equal(rows.some(x=>x.value===0),false);
 assert.deepEqual(effectRows({combat:{racialWeapon:{
  id:900010001,kind:'oneHanded',ru:'Test',en:'Test',
  flat:10,percent:12,matchesCategory:false
 }}}),[]);
});

test('Hero Book final result sections are not replaced with source bonus formulas',()=>{
 const src=read('pandora-studio-hero-book.js'),css=read('pandora-studio-theme.css');
 assert.match(src,/if\(chosen==='effects'\)\s*appendIndependentEffects/);
 assert.match(src,/class:'stage-attribute-row stage-independent-effects'/);
 assert.match(src,/class:'stage-attribute-row stage-equipped-items'/);
 assert.doesNotMatch(src,/Базовая атака '\+\(rec\.W/);
 assert.doesNotMatch(src,/Базовая защита '\+\(rec\.AC/);
 assert.doesNotMatch(src,/appendVitalFormulas|appendCombatFormulas/);
 assert.match(css,/stage-independent-effects:not\(\[open\]\)/);
 assert.match(css,/stage-equipped-items:not\(\[open\]\)/);
});
