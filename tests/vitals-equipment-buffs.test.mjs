import test from 'node:test';
import assert from 'node:assert/strict';
import {readFileSync} from 'node:fs';
const read=p=>readFileSync(new URL('../'+p,import.meta.url),'utf8');
const scope={};Function('window',read('os-calculator.js'))(scope);
const calc=scope.PandoraOSCalculator;
const classes=JSON.parse(read('data/os/classes.json'));
const items=JSON.parse(read('data/os/items.json'));
const souls=JSON.parse(read('data/os/souls.json'));
const keys=['vit','str','agi','dex','spi','int'];
const baseStats={vit:49,str:0,agi:0,dex:0,spi:53,int:0};
const zero=Object.fromEntries(keys.map(k=>[k,0]));
const cleric=(records=[],enhancements={})=>calc.base({
 classData:classes.CLERIC,raceData:baseStats,jobData:zero,allocation:zero,
 level:45,records,enhancements
});
test('current class formula reproduces audited Cleric lvl45 3145 HP / 1279 MP',()=>{
 const x=cleric();
 assert.equal(x.hpBase,3145);assert.equal(x.mpBase,1279);
 assert.equal(x.hp,3145);assert.equal(x.mp,1279);
 assert.equal(calc.classBase({base:0,lv:0.1,vit:0},1,0,'vit'),0);
 assert.equal(x.rounding,'floor-class-cents');
 assert.equal(x.verified,false,'do not claim complete live server parity');
});
test('high Soul MP +8% uses separate base, not the final equipment-adjusted value',()=>{
 const necklace={effects:[{func:'EP_MAXMANA_CONST',a:50}]};
 const x=cleric([['item:20001',necklace,0],['soul:104002',souls[104002],0]]);
 assert.equal(x.mp,1279+50+102);
 assert.equal(x.vitalsBonus.mp.percentParts[0].amount,102);
 assert.equal(x.effects.flat.spi,1);
 assert.equal(x.mpBase,1289,'SPI from the Soul must adjust the base before percentages');
});
test('guild enhancements are separately selected for HP/MP; Life Sign is HP-only',()=>{
 const x=cleric([],{guildHp:6,guildMp:2,lifeSign:true});
 assert.equal(x.vitalsBonus.hp.guildRate,15);
 assert.equal(x.vitalsBonus.mp.guildRate,4);
 assert.equal(x.hp,3145+Math.floor(3145*0.15)+250+Math.floor(3145*0.15));
 assert.equal(x.mp,1279+Math.floor(1279*0.04));
 assert.equal(cleric([], {guildHp:7}),null,'unknown guild level must not be guessed');
});
test('flat, percentage and Life Sign modifiers each use class base, without compounded gear',()=>{
 const rec={effects:[
  {func:'EP_MAXLIFE_CONST',a:100},
  {func:'EP_MAXLIFE_SCALE',a:8},
  {func:'EP_MAXLIFE_SCALE',a:15}
 ]};
 const x=cleric([['item:example',rec,0]],{lifeSign:true});
 assert.equal(x.vitalsBonus.hp.flat,100);
 assert.deepEqual(x.vitalsBonus.hp.percentParts.map(e=>e.amount),
  [Math.floor(3145*.08),Math.floor(3145*.15)]);
 assert.equal(x.hp,3145+100+251+471+250+471);
});
test('explicit OS refinements add HP/MP every N levels and VIT/SPI at +7',()=>{
 assert.deepEqual(calc.refinementEffects(items[1015],6),
  [{func:'EP_MAXLIFE_CONST',a:45,fromRefinement:true}]);
 const m=calc.refinementEffects(items[1015],7);
 assert.equal(m.find(x=>x.func==='EP_MAXLIFE_CONST').a,45);
 assert.equal(m.find(x=>x.func==='EP_VITARITY_CONST').a,1);
 const s=calc.refinementEffects(items[2642],7);
 assert.equal(s.find(x=>x.func==='EP_MAXMANA_CONST').a,60);
 assert.equal(s.find(x=>x.func==='EP_SPIRITUAL_CONST').a,1);
 const x=cleric([['item:1015',items[1015],7]]);
 assert.equal(x.hpBase,calc.classBase(classes.CLERIC.hp,45,51,'vit'));
 assert.equal(x.effects.health.hp,45);
});
test('grade % HP effect uses grade-derived percentage and avoids compounding',()=>{
 const rec=items[1633];
 const x=cleric([['item:1633',rec,6]]);
 assert.equal(x.effects.percent.hp[0].value,3);
 assert.equal(x.vitalsBonus.hp.percentParts[0].amount,
  Math.floor(x.hpBase*.03));
});
test('soul bonuses do not accidentally inherit the refinement grade of their host weapon',()=>{
 const record={desc:'За каждые 2 единицы улучшения:ОМ +20',
  effects:[{func:'EP_MAXMANA_CONST',a:5}]};
 const x=cleric([['soul:fake',record,10]]);
 assert.equal(x.effects.health.mp,5);
 assert.equal(x.effects.trace.length,1);
});
test('no false 99 cap on ability bonuses and no negative XP context is used',()=>{
 const high=calc.base({classData:classes.SCOUT,raceData:{...zero,dex:99,vit:5,spi:5},
  jobData:zero,allocation:zero,level:45,records:[
   ['item:bonus',{effects:[{func:'EP_DEXTERITY_CONST',a:11}]},0]
  ]});
 assert.equal(high.stats.dex,110);
});
