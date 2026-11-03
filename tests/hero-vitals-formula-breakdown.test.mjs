import test from 'node:test';
import assert from 'node:assert/strict';
import {readFileSync} from 'node:fs';
const read=p=>readFileSync(new URL('../'+p,import.meta.url),'utf8');
const ctx={};Function('window',read('pandora-os-character-calculator.js'))(ctx);
const C=ctx.PandoraOSCalculator;
const book={};Function('window','document',read('pandora-studio-hero-book.js'))(book,{documentElement:{lang:'ru'}});
const classes=JSON.parse(read('data/os/classes.json')),tables=JSON.parse(read('data/os/tables.json'));
const zeros={vit:0,str:0,agi:0,dex:0,spi:0,int:0};
const calc=(level,records=[],enhancements={})=>C.base({
 classData:classes.WARRIOR,raceData:tables.raceInit.ELF,
 jobData:tables.jobInit.WARRIOR,allocation:zeros,level,records,enhancements
});
test('exact HP and MP formulas are still used internally for every selected level',()=>{
 for(const level of [1,19,45,55]){
  const data=calc(level);assert.ok(data);
  for(const [key,stat] of [['hp','vit'],['mp','spi']]){
   const f=data.vitalFormulas[key],spec=classes.WARRIOR[key];
   assert.equal(f.constant,spec.base);
   assert.equal(f.levelRate,spec.lv);
   assert.equal(f.attributeRate,spec[stat]);
   assert.equal(f.attribute,data.stats[stat]);
   assert.equal(f.rawCents,Math.round(spec.base*100)+level*Math.round(spec.lv*100)+
    data.stats[stat]*Math.round(spec[stat]*100));
   assert.equal(f.base,C.classBase(spec,level,data.stats[stat],stat));
   assert.equal(f.base+data.vitalsBonus[key].total,data[key]);
  }
  const visible=book.PandoraStageAttributes.summaryRows(data)[0].rows;
  assert.equal(visible[0].value,data.hp);
  assert.equal(visible[1].value,data.mp);
 }
});
test('item rates, guild and life sign still change final result without UI detail',()=>{
 const item={id:997711,effects:[
  {func:'EP_MAXLIFE_CONST',a:37},{func:'EP_MAXLIFE_SCALE',a:11},
  {func:'EP_MAXLIFE_SCALE',a:-3},{func:'EP_MAXMANA_CONST',a:29},
  {func:'EP_MAXMANA_SCALE',a:7}
 ]};
 const d=calc(45,[['item:997711',item,0]],{guildHp:4,guildMp:2,lifeSign:true});
 assert.ok(d);
 for(const [key,flat]of [['hp',37],['mp',29]]){
  const b=d.vitalsBonus[key];
  assert.equal(b.flat,flat);
  assert.equal(b.flat+b.percentParts.reduce((n,x)=>n+x.amount,0)+b.guild+b.lifeSign,b.total);
  assert.equal(d[key+'Base']+b.total,d[key]);
 }
 assert.equal(d.vitalsBonus.hp.lifeSign,250+Math.floor(d.hpBase*.15));
 assert.equal(d.vitalsBonus.mp.lifeSign,0);
});
test('Hero Book exposes final vitals, not source equations',()=>{
 const book=read('pandora-studio-hero-book.js');
 assert.match(book,/row\('ОЗ','HP',calc\?\.hp\)/);
 assert.match(book,/row\('ОМ','MP',calc\?\.mp\)/);
 assert.doesNotMatch(book,/appendVitalFormulas|vitalFormulaRows|stage-vital-formulas/);
 assert.doesNotMatch(book,/Как рассчитываются ОЗ и ОМ|How HP and MP are calculated/);
});
