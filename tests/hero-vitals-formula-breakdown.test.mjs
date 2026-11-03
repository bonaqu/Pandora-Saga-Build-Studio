import test from 'node:test';
import assert from 'node:assert/strict';
import {readFileSync} from 'node:fs';

const read=path=>readFileSync(new URL('../'+path,import.meta.url),'utf8');
const root={};Function('window',read('pandora-os-character-calculator.js'))(root);
const C=root.PandoraOSCalculator;
const b={};Function('window','document',read('pandora-studio-hero-book.js'))(b,{documentElement:{lang:'ru'}});
const rows=b.PandoraStageAttributes.vitalFormulaRows;
const classes=JSON.parse(read('data/os/classes.json'));
const tables=JSON.parse(read('data/os/tables.json'));
const zeros={vit:0,str:0,agi:0,dex:0,spi:0,int:0};
const make=(level=1,records=[],enhancements={})=>C.base({
 classData:classes.WARRIOR,raceData:tables.raceInit.ELF,
 jobData:tables.jobInit.WARRIOR,allocation:zeros,level,records,enhancements
});

test('HP and MP formula and character totals share exact integer-cents class base at levels 1–55',()=>{
 for(const level of [1,19,45,55]){
  const data=make(level);assert.ok(data);
  for(const [key,stat] of [['hp','vit'],['mp','spi']]){
   const f=data.vitalFormulas[key],spec=classes.WARRIOR[key];
   assert.equal(f.constant,spec.base);
   assert.equal(f.levelRate,spec.lv);
   assert.equal(f.attributeRate,spec[stat]);
   assert.equal(f.level,level);
   assert.equal(f.attribute,data.stats[stat]);
   assert.equal(f.rawCents,Math.round(spec.base*100)+level*Math.round(spec.lv*100)+
    data.stats[stat]*Math.round(spec[stat]*100));
   assert.equal(f.base,Math.floor(f.rawCents/100));
   assert.equal(f.base,C.classBase(spec,level,data.stats[stat],stat));
  }
  const formulas=rows(data);
  assert.deepEqual(formulas.map(x=>x.key),['hp','mp']);
  for(const row of formulas){
   assert.equal(row.formula.base+row.bonus,row.total);
   assert.equal(row.parts.reduce((sum,x)=>sum+x.amount,0),row.bonus);
  }
 }
});

test('equipment percentages, guild and life sign decompose without double counting',()=>{
 const gear={id:997711,name:'Formula fixture',effects:[
  {func:'EP_MAXLIFE_CONST',a:37},{func:'EP_MAXLIFE_SCALE',a:11},
  {func:'EP_MAXLIFE_SCALE',a:-3},{func:'EP_MAXMANA_CONST',a:29},
  {func:'EP_MAXMANA_SCALE',a:7}
 ]};
 const data=make(45,[['item:997711',gear,0]],{guildHp:4,guildMp:2,lifeSign:true});
 assert.ok(data);
 const [hp,mp]=rows(data);assert.ok(hp&&mp);
 assert.equal(hp.parts.filter(x=>x.ru.startsWith('Процентный бонус')).length,2);
 assert.equal(mp.parts.filter(x=>x.ru.startsWith('Процентный бонус')).length,1);
 assert.equal(hp.parts.find(x=>x.ru==='Плоские бонусы').amount,37);
 assert.equal(mp.parts.find(x=>x.ru==='Плоские бонусы').amount,29);
 assert.equal(hp.parts.find(x=>x.ru==='Знак жизни').amount,
  250+Math.floor(hp.formula.base*15/100));
 assert.equal(mp.parts.some(x=>x.ru==='Знак жизни'),false);
 assert.equal(hp.formula.base+hp.parts.reduce((n,x)=>n+x.amount,0),data.hp);
 assert.equal(mp.formula.base+mp.parts.reduce((n,x)=>n+x.amount,0),data.mp);
});

test('partial or inconsistent modifier snapshots never output false equations',()=>{
 const data=make(13);
 assert.deepEqual(rows({...data,hp:data.hp+1}).map(x=>x.key),['mp']);
 assert.deepEqual(rows({...data,vitalsBonus:{hp:{...data.vitalsBonus.hp,total:100},mp:null}}),[]);
 assert.deepEqual(rows({hp:100,mp:300}),[]);
});

test('RU/EN Hero Book includes a visible opt-in formula disclosure in the summary',()=>{
 const source=read('pandora-studio-hero-book.js');
 for(const term of ['appendVitalFormulas(section,calc,english)',
  'Как рассчитываются ОЗ и ОМ','How HP and MP are calculated',
  'stage-vital-formulas','Каждый процентный бонус округляется вниз отдельно'])
  assert.ok(source.includes(term),term);
});
