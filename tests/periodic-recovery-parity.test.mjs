import test from 'node:test';
import assert from 'node:assert/strict';
import {readFileSync} from 'node:fs';
const read=p=>readFileSync(new URL('../'+p,import.meta.url),'utf8');
const scope={};Function('window',read('os-calculator.js'))(scope);
const calc=scope.PandoraOSCalculator;
const catalog=JSON.parse(read('data/os/skills.json'));
const preview=(level,benevolence,jobKey,spi=60)=>calc.periodicRecoveryPreview({
 level,spi,benevolence,jobKey,skillCatalog:catalog});

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
  jobKey:'CLERIC',skillCatalog:malformed}).rows[0].available,false);
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
