import test from 'node:test';
import assert from 'node:assert/strict';
import {readFileSync} from 'node:fs';
const read=p=>readFileSync(new URL('../'+p,import.meta.url),'utf8');
const c={};Function('window',read('pandora-os-character-calculator.js'))(c);
const C=c.PandoraOSCalculator,b={};
Function('window','document',read('pandora-studio-hero-book.js'))(b,{documentElement:{lang:'ru'}});
const classes=JSON.parse(read('data/os/classes.json')),tables=JSON.parse(read('data/os/tables.json'));
const calc=()=>C.base({
 classData:classes.WARRIOR,raceData:tables.raceInit.ELF,
 jobData:tables.jobInit.WARRIOR,
 allocation:{vit:0,str:0,agi:0,dex:0,spi:0,int:0},level:35,
 combatContext:{jobKey:'WARRIOR'}
});
test('engine maintains final combat values in summary and defense',()=>{
 const data=calc();assert.ok(data?.combat);
 const groups=b.PandoraStageAttributes.summaryRows(data);
 const result=new Map(groups.flatMap(g=>g.rows.map(x=>[x.ru,x.value])));
 for(const [name,value] of [
  ['АТК',data.combat.attack?.known],['Точность',data.combat.accuracy?.known],
  ['Шанс крита',data.combat.critical?.known],['Защита',data.combat.defense?.known],
  ['Уклонение',data.combat.dodge?.known],
  ['Скор. атаки',data.combat.attackSpeed?.known],
  ['Расход ОМ',data.combat.manaCost?.remaining]])
  assert.equal(result.get(name),value,name);
});
test('UI shows only final combat values in localized compact tiles',()=>{
 const source=read('pandora-studio-hero-book.js');
 assert.match(source,/label\('Скорость атаки','Attack speed'\)/);
 assert.match(source,/label\('Расход ОМ','MP cost'\)/);
 assert.match(source,/label\('Уклонение','Evasion'\)/);
 assert.doesNotMatch(source,/appendCombatFormulas|combatFormulaRows|stage-combat-formulas/);
 assert.doesNotMatch(source,/Показать расчёт по составляющим|Show calculation breakdown/);
 assert.doesNotMatch(source,/Процентная точность вещей|Базовая защита снаряжения:/);
});
