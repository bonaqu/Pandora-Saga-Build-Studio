import test from 'node:test';
import assert from 'node:assert/strict';
import {readFileSync} from 'node:fs';
import vm from 'node:vm';
const read=p=>readFileSync(new URL('../'+p,import.meta.url),'utf8');
const host={};
for(const p of ['pandora-os-character-calculator.js',
 'pandora-studio-attribute-progression.js','pandora-studio-skill-progression.js',
 'pandora-studio-catalog-safety.js'])
 vm.runInNewContext(read(p),{window:host});
const safe=host.PandoraCatalogSafety,P=host.PandoraSkillProgression;
const load=n=>JSON.parse(read('data/os/'+n+'.json'));
const before={tables:load('tables'),classes:load('classes'),
 skills:load('skills'),items:load('items')};
const edited=(name,fn)=>{const after={...before,[name]:structuredClone(before[name])};
 fn(after[name]);return {after,result:safe.compatibility(before,after)};};
test('28 classes and 27 distinct mastery caps have signed old/new projection',()=>{
 assert.equal(Object.keys(before.classes).length,28);
 for(const [id,klass] of Object.entries(before.classes)){
  assert.equal(Object.keys(klass.branchCaps).length,27);
  const key=Object.keys(klass.branchCaps).find(k=>
   klass.branchCaps[k]>0&&klass.branchCaps[k]<90);
  assert.ok(key,id);
  const {after,result}=edited('classes',c=>{c[id].branchCaps[key]++;});
  assert.equal(result.entries.length,1);
  assert.equal(result.entries[0].kind,'verified');
  assert.equal(result.entries[0].contract,'class.branch-limits');
  const start=before.tables.jobInit[klass.baseClass].branches;
  assert.equal(P.branchPotential({points:{[key]:90}},key,start,after.classes[id].branchCaps),
   after.classes[id].branchCaps[key]);
 }
});
test('unknown caps, lost start points and mixed HP changes cannot borrow a contract',()=>{
 for(const fn of [
  c=>{c.WARRIOR.branchCaps.slash='26';},
  c=>{c.WARRIOR.branchCaps.slash=-1;},
  c=>{c.WARRIOR.branchCaps.slash=0;},
  c=>{c.WARRIOR.branchCaps.slash=91;},
  c=>{delete c.WARRIOR.branchCaps.slash;},
  c=>{c.WARRIOR.branchCaps.future=2;},
  c=>{c.WARRIOR.branchCaps.slash++;c.WARRIOR.hp.base++;}
 ]){
  const {after,result}=edited('classes',fn);
  assert.equal(result.entries[0].kind,'needsReview');
  assert.equal(result.entries[0].contract,undefined);
 }
});
test('new incorrect requirement branch, numeric type, or missing array blocks D1',()=>{
 assert.equal(safe.sourceGraphIntegrity(before,before).ok,true);
 for(const fn of [
  s=>{s['100002001'].reqs[0].branch='unknownBranch';},
  s=>{s['100002001'].reqs[0].amount=-1;},
  s=>{s['100002001'].reqs[0].amount='54';},
  s=>{s['100002001'].reqs=null;}
 ]){
  const {after}=edited('skills',fn);
  const graph=safe.sourceGraphIntegrity(before,after);
  assert.equal(graph.ok,false);
  assert.ok(graph.samples.some(x=>['requirements','requirement-branch',
   'requirement-amount'].includes(x.field)));
 }
});
test('self and two-step prerequisite cycles block before production',()=>{
 for(const [id,target] of [['100002002',100002002],
  ['100002001',100002002]]){
  const {after}=edited('skills',s=>{s[id].prereq=target;});
  const graph=safe.sourceGraphIntegrity(before,after);
  assert.equal(graph.ok,false);
  assert.ok(graph.samples.some(x=>x.field==='prerequisite-cycle'));
 }
});
test('historical source mastery requirements 100/102 are retained without guesses',()=>{
 const high=Object.values(before.skills).flatMap(s=>
  (s.reqs||[]).filter(r=>r.amount>90).map(r=>r.amount));
 assert.deepEqual(high.sort((a,b)=>a-b),[100,102,102]);
 assert.equal(safe.sourceGraphIntegrity(before,before).newBroken,0);
});
test('server level and experience caps are source only if well formed',()=>{
 for(const [field,newValue,contract] of [
  ['levelCap',55,'table.server-level-cap'],
  ['expCap',before.tables.expCap+100,'table.server-experience-cap']
 ]){
  const {result}=edited('tables',t=>{t[field]=newValue;});
  assert.equal(result.entries[0].kind,'sourceOnly');
  assert.equal(result.entries[0].contract,contract);
 }
 for(const fn of [
  t=>{t.levelCap='55';},t=>{t.levelCap=0;},
  t=>{t.levelCap=100;},t=>{t.expCap=-1;},t=>{t.expCap=1.5;}
 ]){
  const {result}=edited('tables',fn);
  assert.equal(result.entries[0].kind,'needsReview');
 }
});
test('bulk class/metadata edits retain 30 statuses and immutable source',()=>{
 const json=JSON.stringify(before);
 const after={...before,classes:structuredClone(before.classes),
  tables:structuredClone(before.tables)};
 for(const x of Object.values(after.classes)){
  const key=Object.keys(x.branchCaps).find(k=>
   x.branchCaps[k]>0&&x.branchCaps[k]<90);
  x.branchCaps[key]++;
 }
 after.tables.levelCap=55;after.tables.expCap+=1;
 const audit=safe.compatibility(before,after);
 assert.equal(audit.entries.length,30);
 assert.equal(audit.totals.verified,28);
 assert.equal(audit.totals.sourceOnly,2);
 assert.equal(audit.totals.needsReview,0);
 assert.equal(safe.sourceGraphIntegrity(before,after).ok,true);
 assert.equal(JSON.stringify(before),json);
});
