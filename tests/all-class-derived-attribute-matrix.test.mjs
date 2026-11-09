import test from 'node:test';
import assert from 'node:assert/strict';
import {readFileSync} from 'node:fs';
const read=name=>readFileSync(new URL('../'+name,import.meta.url),'utf8');
const c={},b={};
Function('window',read('pandora-os-character-calculator.js'))(c);
Function('window','document',read('pandora-studio-hero-book.js'))(
 b,{documentElement:{lang:'ru'}});
const C=c.PandoraOSCalculator,book=b.PandoraStageAttributes;
const classes=JSON.parse(read('data/os/classes.json'));
const tables=JSON.parse(read('data/os/tables.json'));
const empty={vit:0,str:0,agi:0,dex:0,spi:0,int:0};
const calculate=(jobKey,added={})=>{
 const klass=classes[jobKey],root=klass.baseClass||jobKey;
 return C.base({classData:klass,raceData:tables.raceInit.ELF,
  jobData:tables.jobInit[root],allocation:{...empty,...added},level:45,
  combatContext:{jobKey}});
};
const row=(calc,label)=>book.summaryRows(calc).flatMap(g=>g.rows)
 .find(x=>x.ru===label)?.value;
test('all 28 class choices respond to six base attributes in known engine totals',()=>{
 assert.equal(Object.keys(classes).length,28);
 for(const key of Object.keys(classes)){
  const original=calculate(key);assert.ok(original,key+' base missing');
  const samples={
   vit:calculate(key,{vit:20}),str:calculate(key,{str:20}),
   agi:calculate(key,{agi:20}),dex:calculate(key,{dex:20}),
   spi:calculate(key,{spi:20}),int:calculate(key,{int:40})
  };
  for(const [stat,result] of Object.entries(samples))
   assert.ok(result?.combat&&result.stats[stat]>original.stats[stat],key+' '+stat+' invalid');
  assert.ok(samples.vit.hp>original.hp,key+' VIT->HP');
  assert.ok(samples.str.combat.attack.known>original.combat.attack.known,key+' STR->ATK');
  assert.ok(samples.agi.combat.dodge.known>original.combat.dodge.known,key+' AGI->Dodge');
  assert.ok(samples.agi.combat.attackSpeed.known>original.combat.attackSpeed.known,key+' AGI->ATKSPD');
  assert.equal(samples.dex.combat.critical.known-original.combat.critical.known,2,key+' DEX->crit');
  assert.equal(samples.dex.combat.accuracy.known-original.combat.accuracy.known,20,key+' DEX->accuracy');
  assert.ok(samples.spi.mp>original.mp,key+' SPI->MP');
  assert.ok(samples.int.combat.manaCost.remaining<original.combat.manaCost.remaining,key+' INT->MPcost');
  // The user-facing page must use the current calculator output, not a stale
  // or independently approximated secondary set of formulas.
  for(const [input,label,path] of [
   [samples.vit,'ОЗ',x=>x.hp],[samples.str,'АТК',x=>x.combat.attack.known],
   [samples.agi,'Уклонение',x=>x.combat.dodge.known],
   [samples.dex,'Шанс крита',x=>x.combat.critical.known],
   [samples.spi,'ОМ',x=>x.mp],
   [samples.int,'Расход ОМ',x=>x.combat.manaCost.remaining]])
   assert.equal(row(input,label),path(input),key+' Book mismatch: '+label);
 }
});
