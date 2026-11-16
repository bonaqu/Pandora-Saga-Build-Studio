import test from 'node:test';
import assert from 'node:assert/strict';
import {readFileSync} from 'node:fs';
import vm from 'node:vm';
const read=x=>readFileSync(new URL('../'+x,import.meta.url),'utf8');
const host={};
for(const file of ['pandora-os-character-calculator.js',
 'pandora-studio-attribute-progression.js','pandora-studio-skill-progression.js',
 'pandora-studio-catalog-safety.js'])vm.runInNewContext(read(file),{window:host});
const safety=host.PandoraCatalogSafety,C=host.PandoraOSCalculator;
const original=x=>JSON.parse(read('data/os/'+x+'.json'));
const before={tables:original('tables'),classes:original('classes'),
 items:original('items'),skills:original('skills')};
const change=fn=>{const after={...before,tables:structuredClone(before.tables)};
 fn(after.tables);return {after,report:safety.compatibility(before,after)};};
const expect=(report,key,id,kind='verified')=>{
 assert.equal(report.entries.length,1);
 assert.equal(report.entries[0].key,key);
 assert.equal(report.entries[0].kind,kind);
 assert.equal(report.entries[0].contract,id);
};
test('physical refinement ratio and flat are model verified at every +1…+10',()=>{
 assert.equal(Object.keys(before.tables.weaponPlus).length,10);
 for(let n=1;n<=10;n++)for(const k of ['ratio','flat']){
  const {after,report}=change(t=>{t.weaponPlus[n][k]+=2;});
  expect(report,'table:weaponPlus','table.weapon-refinement');
  for(const W of [25,100,260]){
   const q=C.weaponAttackPreview({str:72,weapon:{W},grade:n,
    weaponPlus:after.tables.weaponPlus});
   assert.equal(q.refinement,
    Math.floor(W*after.tables.weaponPlus[n].ratio/100)+
    after.tables.weaponPlus[n].flat);
   assert.ok(Number.isFinite(q.known));
  }
 }
});
test('magical ratio is calculated at every grade; magical flat is unproven',()=>{
 assert.equal(Object.keys(before.tables.magicPlus).length,10);
 for(let n=1;n<=10;n++){
  const {after,report}=change(t=>{t.magicPlus[n].ratio+=2;});
  expect(report,'table:magicPlus','table.magic-refinement-rate');
  const a=C.magicAttackPreview({int:80,jobKey:'MAGE',magicMastery:55,
   weapon:{id:2802,slot:'weapon',kind:'STAFF'},
   weaponGrade:n,weaponEnhancementType:'magical',magicPlus:after.tables.magicPlus});
  assert.equal(a.refinement,after.tables.magicPlus[n].ratio);
  const unsupported=change(t=>{t.magicPlus[n].flat+=2;}).report.entries[0];
  assert.equal(unsupported.kind,'needsReview');
  assert.equal(unsupported.contract,undefined);
 }
});
test('unknown grade schema and unsupported numeric changes never borrow a verified status',()=>{
 for(const fn of [
  t=>{t.weaponPlus[3].ratio='12';},t=>{t.weaponPlus[3].flat=-1;},
  t=>{t.weaponPlus[3].future=2;},t=>{delete t.weaponPlus[3];},
  t=>{t.weaponPlus['11']={ratio:30,flat:40};},
  t=>{t.magicPlus[2].ratio=-3;},
  t=>{t.magicPlus[2].ratio=NaN;},
  t=>{t.magicPlus[3].flat+=2;t.magicPlus[3].ratio+=2;}
 ]){
  const row=change(fn).report.entries[0];
  assert.equal(row.kind,'needsReview');
  assert.equal(row.contract,undefined);
 }
});
test('one mass update confirms distinct physical and magical table models, readonly',()=>{
 const prev=JSON.stringify(before);
 const {after,report}=change(t=>{
  for(let n=1;n<=10;n++){
   t.weaponPlus[n].ratio++;
   t.weaponPlus[n].flat++;
   t.magicPlus[n].ratio++;
  }
 });
 assert.equal(report.totals.verified,2);
 assert.equal(report.totals.needsReview,0);
 assert.equal(report.totals.sourceOnly,0);
 assert.deepEqual(Array.from(report.entries,row=>row.contract),
  ['table.weapon-refinement','table.magic-refinement-rate']);
 assert.equal(safety.check(after).ok,true);
 assert.equal(safety.sourceGraphIntegrity(before,after).ok,true);
 assert.equal(JSON.stringify(before),prev);
});
test('unproven future formulas remain needsReview',()=>{
 for(const field of ['forge','lvModify','dropModify']){
  const row=change(t=>{t[field]={...t[field],future:17};}).report.entries[0];
  assert.equal(row.kind,'needsReview');
  assert.equal(row.contract,undefined);
 }
});
