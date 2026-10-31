import test from 'node:test';
import assert from 'node:assert/strict';
import {readFileSync} from 'node:fs';
const read=p=>readFileSync(new URL('../'+p,import.meta.url),'utf8');
const scope={};Function('window',read('os-calculator.js'))(scope);
const calc=scope.PandoraOSCalculator;
const catalog=JSON.parse(read('data/os/skills.json'));
const preview=(level,benevolence,jobKey)=>calc.periodicRecoveryPreview({
 level,benevolence,jobKey,skillCatalog:catalog});

test('Legacy 2-second HP pulses use level/mastery floor thresholds, not permanent HP totals',()=>{
 const rows=preview(45,41,'CLERIC').rows;
 assert.deepEqual(rows.map(x=>[x.id,x.amount,x.available]),[
  [310002001,15+4+4,true],
  [310022001,7+9+4,true]]);
 assert.equal(rows.every(x=>x.kind==='hp'),true);
 assert.equal(preview(55,50,'CLERIC').rows[0].amount,25);
 assert.equal(preview(1,0,'CLERIC').rows[0].available,false);
});
test('MP pulse only appears for compatible classes and valid OS skill records',()=>{
 const ascetic=preview(20,0,'ASCETIC').rows;
 assert.equal(ascetic.find(x=>x.id===330005001)?.amount,5);
 assert.equal(ascetic.find(x=>x.id===330005001)?.available,true);
 assert.equal(preview(20,0,'CLERIC').rows.some(x=>x.kind==='mp'),false);
 const empty=calc.periodicRecoveryPreview({level:20,benevolence:80,
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
 assert.equal(calc.periodicRecoveryPreview({level:55,benevolence:99,
  jobKey:'CLERIC',skillCatalog:malformed}).rows[0].available,false);
});
test('preview is linked to character model and player-only book, not applied as passive regen',()=>{
 const src=read('os-calculator.js'),ui=read('stage-attributes.js');
 assert.match(src,/const periodicRecovery=periodicRecoveryPreview/);
 assert.match(src,/healingSpells,periodicRecovery,consumableRecovery/);
 assert.match(src,/const statusCures=statusCurePreview/);
 assert.match(ui,/if\(chosen==='recovery'&&modifiers\?\.periodicRecovery\?\.rows\?\.length\)/);
 assert.match(ui,/Ориентировочное действие умения/);
});
