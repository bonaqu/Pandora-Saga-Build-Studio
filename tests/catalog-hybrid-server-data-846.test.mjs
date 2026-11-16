import test from 'node:test';
import assert from 'node:assert/strict';
import {readFileSync} from 'node:fs';
import vm from 'node:vm';
const read=p=>readFileSync(new URL('../'+p,import.meta.url),'utf8');
const root={};
for(const script of ['pandora-os-character-calculator.js',
 'pandora-studio-attribute-progression.js','pandora-studio-skill-progression.js',
 'pandora-studio-catalog-safety.js'])vm.runInNewContext(read(script),{window:root});
const safety=root.PandoraCatalogSafety,calc=root.PandoraOSCalculator;
const load=p=>JSON.parse(read('data/os/'+p+'.json'));
const original={tables:load('tables'),classes:load('classes'),items:load('items'),
 skills:load('skills'),maps:load('maps'),monsters:load('monsters')};
const mutate=(fn,part='tables')=>{
 const after={...original,[part]:structuredClone(original[part])};
 fn(after[part]);return {after,report:safety.compatibility(original,after)};
};
const confirm=(result,key,id)=>{
 assert.equal(result.entries.length,1);
 assert.equal(result.entries[0].key,'table:'+key);
 assert.equal(result.entries[0].kind,'sourceOnly');
 assert.equal(result.entries[0].contract,id);
};
test('current server forge plus 1..10 and four gem tiers are source-only',()=>{
 assert.equal(original.tables.forge.rates.length,10);
 assert.equal(original.tables.forge.gemTiers.length,4);
 for(let n=1;n<=10;n++)for(const k of ['weapon','armor']){
  const {report}=mutate(t=>{t.forge.rates[n-1][k]++;});
  confirm(report,'forge','table.forge-source-rates');
 }
 for(const k of ['rate','cost']){
  const {report}=mutate(t=>{t.forge.gemTiers[0][k]++;});
  confirm(report,'forge','table.forge-source-rates');
 }
});
test('forge structure or unproved pity/repair semantics require review',()=>{
 const cases=[
  t=>{t.forge.rates[4].plus=6;},
  t=>{t.forge.rates[3].weapon='45';},
  t=>{t.forge.rates[3].weapon=150;},
  t=>{t.forge.gemTiers[0].sample=12345;},
  t=>{t.forge.gemTiers[0].colors++;},
  t=>{t.forge.hammers[0].factor++;},
  t=>{t.forge.rework.pityPerFail++;},
  t=>{delete t.forge.rates[0];},
  t=>{t.forge.gemTiers[0].cost=-1;},
  t=>{t.forge.rates[0].future=99;}
 ];
 for(const change of cases){
  const row=mutate(change).report.entries[0];
  assert.equal(row.kind,'needsReview');
  assert.equal(row.contract,undefined);
 }
});
test('all twelve source drop modifiers support safe exact diff and new weights',()=>{
 assert.equal(original.tables.dropModify.length,12);
 for(let i=0;i<12;i++){
  const {report}=mutate(t=>{t.dropModify[i].mod++;});
  confirm(report,'dropModify','table.drop-level-source');
 }
 for(const change of [
  t=>{t.dropModify[0].diff=5;},
  t=>{t.dropModify[0].mod=-1;},
  t=>{t.dropModify[0].mod='9';},
  t=>{t.dropModify.push({diff:28,mod:50});}
 ])assert.equal(mutate(change).report.entries[0].kind,'needsReview');
});
test('twenty level gap rows keep diff -1 sentinel and unknown semantics source-only',()=>{
 assert.equal(original.tables.lvModify.length,20);
 assert.ok(original.tables.lvModify.some(r=>r.diff===-1));
 for(let i=0;i<20;i++){
  const {report}=mutate(t=>{t.lvModify[i].atk+=1;});
  confirm(report,'lvModify','table.level-gap-source');
 }
 for(const change of [
  t=>{t.lvModify[0].diff=999;},
  t=>{t.lvModify[0].magicDef='9';},
  t=>{t.lvModify[0].extra=1;},
  t=>{t.lvModify[0].def=-1;}
 ])assert.equal(mutate(change).report.entries[0].kind,'needsReview');
});
test('premium source and AFK threshold keep types and contracts, not formulas',()=>{
 for(const key of Object.keys(original.tables.premium)){
  const {report}=mutate(t=>{t.premium[key].normal++;});
  confirm(report,'premium','table.premium-source');
 }
 confirm(mutate(t=>{t.afk.thresholdSec++;}).report,'afk','table.afk-source');
 for(const change of [
  t=>{t.premium.EXP_RATE.special='40';},
  t=>{t.premium.EXP_RATE.extra=1;},
  t=>{t.afk.thresholdSec=0;},
  t=>{t.afk.thresholdSec='46';}
 ])assert.equal(mutate(change).report.entries[0].kind,'needsReview');
});
test('all actual forge hammers and gems are linked to source items before D1',()=>{
 const healthy=safety.sourceGraphIntegrity(original,original);
 assert.equal(healthy.ok,true);
 const hammer=mutate(t=>{t.forge.hammers[0].id=999999991;});
 const gem=mutate(t=>{t.forge.gemTiers[0].sample=999999992;});
 for(const {after} of [hammer,gem]){
  const audit=safety.sourceGraphIntegrity(original,after);
  assert.equal(audit.ok,false);
  assert.ok(audit.newBroken>0);
  assert.ok(audit.samples.some(row=>row.kind==='forge'));
 }
});
test('mass source-only update keeps five independent entries and identical originals',()=>{
 const prior=JSON.stringify(original);
 const {after,report}=mutate(t=>{
  for(const row of t.forge.rates){row.weapon++;row.armor++;}
  for(const row of t.dropModify)row.mod++;
  for(const row of t.lvModify)row.magicProtection++;
  for(const row of Object.values(t.premium))row.normal++;
  t.afk.thresholdSec++;
 });
 assert.equal(report.entries.length,5);
 assert.equal(report.totals.sourceOnly,5);
 assert.equal(report.totals.verified,0);
 assert.equal(report.totals.needsReview,0);
 assert.equal(safety.check(after).ok,true);
 assert.equal(safety.sourceGraphIntegrity(original,after).ok,true);
 assert.equal(JSON.stringify(original),prior);
});
test('historical attack kernel consumes current weaponPlus and skill source values',()=>{
 const W=[25,48,90,160,260],strength=[19,20,49,50,72,100,130,200];
 for(const w of W)for(const str of strength)for(let grade=0;grade<=10;grade++){
  const preview=calc.weaponAttackPreview({str,weapon:{W:w},grade,
   weaponPlus:original.tables.weaponPlus});
  const row=original.tables.weaponPlus[String(grade)];
  const refinement=grade===0?0:Math.floor(w*row.ratio/100)+row.flat;
  const physical=Math.floor(str/2);
  assert.ok(preview);
  assert.equal(preview.refinement,refinement);
  assert.equal(preview.known,physical+preview.scaledWeapon+refinement);
 }
 const newRates=structuredClone(original.tables.weaponPlus);
 newRates['5'].ratio+=3;newRates['5'].flat+=2;
 const before=calc.weaponAttackPreview({str:72,weapon:{W:90},
  grade:5,weaponPlus:original.tables.weaponPlus});
 const updated=calc.weaponAttackPreview({str:72,weapon:{W:90},
  grade:5,weaponPlus:newRates});
 assert.equal(updated.refinement-before.refinement,Math.floor(90*
  newRates['5'].ratio/100)-Math.floor(90*
  original.tables.weaponPlus['5'].ratio/100)+2);
 assert.equal(updated.known-before.known,updated.refinement-before.refinement);
});
test('magical refinement uses current server ratio, not legacy tier constants',()=>{
 for(let grade=1;grade<=10;grade++)for(const int of [1,50,100,160]){
  const out=calc.magicAttackPreview({int,jobKey:'MAGE',
   magicMastery:50,weapon:{slot:'weapon',kind:'STAFF',id:2802,W:50},
   weaponGrade:grade,weaponEnhancementType:'magical',
   magicPlus:original.tables.magicPlus});
  assert.ok(out);
  assert.equal(out.refinement,original.tables.magicPlus[String(grade)].ratio);
 }
});
