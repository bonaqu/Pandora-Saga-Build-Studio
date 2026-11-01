import test from 'node:test';
import assert from 'node:assert/strict';
import {readFileSync} from 'node:fs';
const read=p=>readFileSync(new URL('../'+p,import.meta.url),'utf8');
const scope={};Function('window',read('os-calculator.js'))(scope);
const calc=scope.PandoraOSCalculator;
const catalog=JSON.parse(read('data/os/skills.json'));
const classes=JSON.parse(read('data/os/classes.json'));
const preview=(level,benevolence,jobKey,spi=60)=>calc.periodicRecoveryPreview({
 level,spi,benevolence,jobKey,skillCatalog:catalog,
 benevolenceCap:classes[jobKey]?.branchCaps?.benevolence??null});

test('Legacy 2-second HP pulses use SPI/mastery floors rather than hero level',()=>{
 const rows=preview(45,41,'CLERIC',60).rows;
 assert.deepEqual(rows.map(x=>[x.id,x.amount,x.available]),[
  [310002001,15+6+4,true],
  [310022001,7+12+4,true]]);
 assert.equal(rows.every(x=>x.kind==='hp'),true);
 assert.equal(preview(55,50,'CLERIC',100).rows[0].amount,30);
 assert.equal(preview(1,0,'CLERIC',100).rows[0].available,false);
});
test('Remaked LPsec uses SPI rather than level, and mastery is not counted twice',()=>{
 const sameSPI=[preview(45,41,'CLERIC',74),preview(55,41,'CLERIC',74)];
 assert.deepEqual(sameSPI[0].rows.map(x=>x.amount),sameSPI[1].rows.map(x=>x.amount));
 const low=preview(45,41,'CLERIC',9).rows;
 const high=preview(45,41,'CLERIC',10).rows;
 assert.equal(high[0].amount-low[0].amount,1);
 assert.equal(high[1].amount-low[1].amount,1);
 assert.equal(preview(45,40,'CLERIC',60).rows[0].amount,25);
 assert.equal(preview(45,41,'CLERIC',60).rows[0].amount,25);
 const huge=preview(45,41,'CLERIC',105).rows;
 assert.equal(huge[0].amount,29);
 assert.equal(huge[1].amount,32);
});
test('MP pulse only appears for compatible classes and valid OS skill records',()=>{
 const ascetic=preview(20,0,'ASCETIC').rows;
 assert.equal(ascetic.find(x=>x.id===330005001)?.amount,5);
 assert.equal(ascetic.find(x=>x.id===330005001)?.available,true);
 assert.equal(preview(20,0,'CLERIC').rows.some(x=>x.kind==='mp'),false);
 const empty=calc.periodicRecoveryPreview({level:20,spi:40,benevolence:80,
  jobKey:'ASCETIC',skillCatalog:{}});
 assert.deepEqual(empty.rows,[]);
});
test('future levels, required mastery and invalid data fail closed',()=>{
 assert.equal(preview(45,20,'CLERIC').rows[0].available,false);
 assert.equal(preview(45,21,'CLERIC').rows[0].available,true);
 assert.equal(preview(45,40,'CLERIC').rows[1].available,false);
 assert.equal(preview(45,41,'CLERIC').rows[1].available,true);
 assert.equal(preview(56,99,'CLERIC'),null);
 assert.equal(preview(1,-1,'CLERIC'),null);
 const malformed={...catalog,[310002001]:{...catalog[310002001],reqs:[{branch:'unknown',amount:1}]}};
 assert.equal(calc.periodicRecoveryPreview({level:55,spi:65,benevolence:99,
  jobKey:'CLERIC',skillCatalog:malformed,
  benevolenceCap:classes.CLERIC.branchCaps.benevolence}).rows
  .some(x=>x.id===310002001),false);
 assert.equal(calc.periodicRecoveryPreview({level:45,jobKey:'CLERIC',
  benevolence:41,skillCatalog:catalog}),null,'missing SPI must not become zero');
 assert.equal(preview(45,41,'CLERIC',-1),null);
 assert.equal(preview(45,41,'CLERIC',NaN),null);
});
test('preview is linked to character model and player-only book, not applied as passive regen',()=>{
 const src=read('os-calculator.js'),ui=read('stage-attributes.js');
 assert.match(src,/const periodicRecovery=periodicRecoveryPreview/);
 assert.match(src,/level,spi:stats.spi,benevolence:combatContext.benevolenceMastery/);
 assert.match(src,/healingSpells,periodicRecovery,consumableRecovery/);
 assert.match(src,/const statusCures=statusCurePreview/);
 assert.match(ui,/if\(chosen==='recovery'&&modifiers\?\.periodicRecovery\?\.rows\?\.length\)/);
 assert.match(ui,/Ориентировочное действие умения/);
});

test('exact OS event vectors, prerequisites, class and rank gates protect periodic recovery',()=>{
 const good=preview(45,41,'CLERIC');
 assert.deepEqual(good.rows.map(x=>x.id),[310002001,310022001]);
 assert.equal(good.rows[0].available,true);
 const changes=[
  [310002001,{id:111}],
  [310002001,{funcs:[{ep:'EP_HEAL_LIFE_REGENERATOR',dir:'CASTER',
   fv1:[10,10,10,10],fv2:[0,0,0,2]}]}],
  [310002001,{funcs:[{...catalog[310002001].funcs[0],fv2:[0,0,0,3]}]}],
  [310002001,{funcs:[{...catalog[310002001].funcs[0],fv1:[10,10,10,11]}]}],
  [310002001,{reqs:[{branch:'benevolence',amount:1}]}],
  [310002001,{skillType:'SELF'}],
  [310022001,{prereq:310002001}],
  [310022001,{learnable:false}],
  [330005001,{charLevel:1}],
  [330005001,{funcs:[{...catalog[330005001].funcs[0],ep:'EP_HEAL_LIFE'}]}]
 ];
 for(const [id,change] of changes){
  const forged={...catalog,[id]:{...catalog[id],...change}},
   jobKey=id===330005001?'ASCETIC':'CLERIC';
  const entries=calc.periodicRecoveryPreview({level:55,spi:60,
   benevolence:41,jobKey,skillCatalog:forged,
   benevolenceCap:classes[jobKey].branchCaps.benevolence}).rows;
  assert.equal(entries.some(x=>x.id===id),false,'forged source '+id);
 }
});
test('class caps block impossible HP skill without affecting unrelated MP regeneration',()=>{
 const classesData=classes;
 assert.equal(classesData.WARRIOR.branchCaps.benevolence,0);
 assert.deepEqual(preview(55,80,'WARRIOR').rows,[]);
 const capped=calc.periodicRecoveryPreview({level:55,spi:60,benevolence:80,
  jobKey:'CLERIC',skillCatalog:catalog,benevolenceCap:20});
 assert.equal(capped.rows.some(x=>x.kind==='hp'),false);
 const invalidMastery=calc.periodicRecoveryPreview({level:20,spi:60,benevolence:200,
  jobKey:'ASCETIC',skillCatalog:catalog,benevolenceCap:0});
 assert.deepEqual(invalidMastery.rows.map(x=>x.kind),['mp']);
 assert.equal(invalidMastery.rows[0].available,true);
 const unsupported={...catalog,[330005001]:{...catalog[330005001],
  classes:{CLERIC:1}}};
 const noFalseMana=calc.periodicRecoveryPreview({level:55,spi:60,benevolence:40,
  jobKey:'CLERIC',skillCatalog:unsupported,
  benevolenceCap:classes.CLERIC.branchCaps.benevolence});
 assert.equal(noFalseMana.rows.some(x=>x.kind==='mp'),false);
 assert.equal(preview(19,0,'ASCETIC').rows.find(x=>x.kind==='mp')?.available,false);
 assert.equal(preview(20,0,'ASCETIC').rows.find(x=>x.kind==='mp')?.available,true);
});
test('source-checking changes eligibility only, not historical recovery magnitude or max HP/MP',()=>{
 const baseline={classData:classes.CLERIC,
  raceData:{vit:30,str:20,agi:25,dex:20,spi:75,int:70},
  jobData:{vit:0,str:0,agi:0,dex:0,spi:0,int:0},
  allocation:{},level:55,
  combatContext:{jobKey:'CLERIC',benevolenceMastery:41,skillCatalog:catalog}};
 const valid=calc.base(baseline),tampered=calc.base({...baseline,combatContext:{
  ...baseline.combatContext,skillCatalog:{...catalog,
   [310002001]:{...catalog[310002001],funcs:[]}}}});
 assert.ok(valid&&tampered);
 assert.deepEqual(valid.periodicRecovery.rows.map(x=>x.amount),
  [15+Math.floor(75/10)+Math.floor(41/10),7+Math.floor(75/5)+Math.floor(41/10)]);
 assert.equal(tampered.periodicRecovery.rows.some(x=>x.id===310002001),false);
 assert.equal(valid.hp,tampered.hp);
 assert.equal(valid.mp,tampered.mp);
 assert.deepEqual(valid.stats,tampered.stats);
});
