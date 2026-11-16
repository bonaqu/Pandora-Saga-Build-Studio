import test from 'node:test';
import assert from 'node:assert/strict';
import {readFileSync} from 'node:fs';
import vm from 'node:vm';
const read=x=>readFileSync(new URL('../'+x,import.meta.url),'utf8'),host={};
for(const x of ['pandora-os-character-calculator.js',
 'pandora-studio-attribute-progression.js','pandora-studio-skill-progression.js',
 'pandora-studio-catalog-safety.js'])vm.runInNewContext(read(x),{window:host});
const safety=host.PandoraCatalogSafety,source=n=>JSON.parse(read('data/os/'+n+'.json'));
const base={classes:source('classes'),tables:source('tables'),
 items:source('items'),skills:source('skills')};
const changed=(dataset,edit)=>{const after={...base,[dataset]:structuredClone(base[dataset])};
 edit(after[dataset]);return {after,report:safety.compatibility(base,after)};};
const check=(report,id,kind='verified')=>{
 assert.equal(report.entries.length,1);
 assert.equal(report.entries[0].kind,kind);
 assert.equal(report.entries[0].contract,id);
};
test('all 28 classes are projected for all 6 races on five levels',()=>{
 assert.equal(Object.keys(base.classes).length,28);
 assert.equal(Object.keys(base.tables.raceInit).length,6);
 for(const id of Object.keys(base.classes))
  check(changed('classes',x=>{x[id].hp.base+=0.5;}).report,
   'class.base-parameters');
});
test('HP MP caps and class source signatures fail closed on unknown fields',()=>{
 check(changed('classes',x=>{x.CLERIC.mp.spi+=0.25;}).report,'class.base-parameters');
 check(changed('classes',x=>{x.WARRIOR.statCaps.str=85;}).report,'class.base-parameters');
 for(const fn of [x=>{x.WARRIOR.hp.future=1;},x=>{x.CLERIC.mp.spi='8';},
  x=>{x.WARRIOR.statCaps.luck=2;},x=>{x.WARRIOR.baseClass='SCOUT';}]){
  const v=changed('classes',fn).report.entries[0];
  assert.equal(v.kind,'needsReview');assert.equal(v.contract,undefined);
 }
});
test('six race and four root job tables are data-only only with strict proof',()=>{
 check(changed('tables',x=>{x.raceInit.HUMAN.vit+=1;}).report,'table.race-origin');
 check(changed('tables',x=>{x.jobInit.WARRIOR.vit+=1;}).report,'table.job-origin');
 check(changed('tables',x=>{x.jobInit.WARRIOR.branches.slash+=1;})
  .report,'table.job-origin');
 for(const fn of [x=>{x.raceInit.HUMAN.luck=1;},x=>{delete x.raceInit.ELF;},
  x=>{x.jobInit.WARRIOR.branches.future=5;},x=>{x.jobInit.WARRIOR.vit='3';}]){
  const v=changed('tables',fn).report.entries[0];
  assert.equal(v.kind,'needsReview');assert.equal(v.contract,undefined);
 }
});
test('abilityPoint is sourceOnly, not the planner budget calculation',()=>{
 const {after,report}=changed('tables',x=>{x.abilityPoint['2']+=1;});
 check(report,'table.ability-source','sourceOnly');
 const h={klass:'WARRIOR',race:'HUMAN',level:45,stats:{},points:{}};
 assert.equal(safety.project(base,h).skillBudget,safety.project(after,h).skillBudget);
 for(const fn of [x=>{delete x.abilityPoint['2'];},x=>{x.abilityPoint['55']=-1;},
  x=>{x.abilityPoint['2']='3';},x=>{x.abilityPoint['1']=10;}])
  assert.equal(changed('tables',fn).report.entries[0].kind,'needsReview');
});
test('new broken parents, roots and promotion loops block D1',()=>{
 assert.equal(safety.sourceGraphIntegrity(base,base).ok,true);
 for(const fn of [x=>{x.CLERIC.parent='UNKNOWN';},
  x=>{x.WARRIOR.baseClass='UNKNOWN';},
  x=>{x.WARRIOR.parent='CLERIC';x.CLERIC.parent='WARRIOR';}]){
  const graph=safety.sourceGraphIntegrity(base,changed('classes',fn).after);
  assert.equal(graph.ok,false);assert.ok(graph.newBroken>0);
  assert.ok(graph.samples.some(x=>x.kind==='class'));
 }
});
test('all 31 changes in one batch retain evidence and leave source untouched',()=>{
 const previous=JSON.stringify(base);
 const next={...base,classes:structuredClone(base.classes),
  tables:structuredClone(base.tables)};
 for(const row of Object.values(next.classes))row.hp.base+=1;
 for(const row of Object.values(next.tables.raceInit))row.vit+=1;
 for(const row of Object.values(next.tables.jobInit)){
  row.vit+=1;row.branches[Object.keys(row.branches)[0]]+=1;
 }
 next.tables.abilityPoint['2']+=1;
 const candidate=JSON.stringify(next),audit=safety.compatibility(base,next);
 assert.equal(audit.entries.length,31);assert.equal(audit.totals.verified,30);
 assert.equal(audit.totals.sourceOnly,1);assert.equal(audit.totals.needsReview,0);
 assert.equal(safety.sourceGraphIntegrity(base,next).ok,true);
 for(const row of audit.entries)
  assert.ok(safety.sourceContractRegistry.some(x=>x.id===row.contract));
 assert.equal(JSON.stringify(base),previous);
 assert.equal(JSON.stringify(next),candidate);
});
