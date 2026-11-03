import test from 'node:test';
import assert from 'node:assert/strict';
import {readFileSync} from 'node:fs';

const read=path=>readFileSync(new URL('../'+path,import.meta.url),'utf8');
const book={};Function('window','document',read('pandora-studio-hero-book.js'))(
 book,{documentElement:{lang:'ru'}});
const rows=book.PandoraStageAttributes.combatFormulaRows;
const root={};Function('window',read('pandora-os-character-calculator.js'))(root);
const C=root.PandoraOSCalculator;
const classes=JSON.parse(read('data/os/classes.json'));
const tables=JSON.parse(read('data/os/tables.json'));
const sample=()=>C.base({
 classData:classes.WARRIOR,raceData:tables.raceInit.ELF,
 jobData:tables.jobInit.WARRIOR,allocation:{vit:0,str:0,agi:0,dex:0,spi:0,int:0},
 level:35,combatContext:{jobKey:'WARRIOR'}
});

test('source-backed combat breakdown validates all baseline statistics',()=>{
 const current=sample();assert.ok(current?.combat);
 for(const page of ['attack','defense']){
  const formulas=rows(current,page);
  assert.ok(formulas.length>=2,page);
  for(const row of formulas){
   const sum=row.parts.reduce((v,part)=>v+part.value,0);
   const result=row.round==='ceil'?Math.ceil(sum):sum;
   assert.ok(Math.abs(result-row.total)<1e-8,row.ru);
   assert.ok(row.ru&&row.en);
  }
 }
});

test('attack, accuracy, speed, cost and critical values are decomposed',()=>{
 const current=sample();
 const expected=['Физическая атака','Точность','Шанс критического удара',
  'Скорость атаки','Индекс расхода ОМ','Скорость применения навыков',
  'Скорость перемещения'];
 const found=new Set(rows(current,'attack').map(x=>x.ru));
 for(const name of expected)assert.ok(found.has(name),name);
 const def=new Set(rows(current,'defense').map(x=>x.ru));
 assert.ok(def.has('Защита'));
 assert.ok(def.has('Уклонение'));
});

test('wrong totals and missing effect sources are rejected, never shown as formulas',()=>{
 const current=sample();
 const next={...current,combat:{...current.combat,
  accuracy:{...current.combat.accuracy,known:current.combat.accuracy.known+6},
  defense:{...current.combat.defense,known:current.combat.defense.known+10}}};
 assert.ok(!rows(next,'attack').some(x=>x.ru==='Точность'));
 assert.ok(!rows(next,'defense').some(x=>x.ru==='Защита'));
 assert.deepEqual(rows({},'attack'),[]);
 assert.deepEqual(rows(current,'summary'),[]);
});

test('visible combat formula sections are localized and opt-in',()=>{
 const source=read('pandora-studio-hero-book.js');
 assert.match(source,/appendCombatFormulas\(body,modifiers,chosen/);
 assert.match(source,/stage-combat-formulas/);
 assert.match(source,/Показать расчёт по составляющим/);
 assert.match(source,/Show calculation breakdown/);
 assert.match(source,/Непроверенные условные эффекты не учтены/);
});
