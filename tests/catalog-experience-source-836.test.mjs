import test from 'node:test';
import assert from 'node:assert/strict';
import {readFileSync} from 'node:fs';
import vm from 'node:vm';
const read=x=>readFileSync(new URL('../'+x,import.meta.url),'utf8');
const host={};
for(const p of ['pandora-os-character-calculator.js',
 'pandora-studio-attribute-progression.js','pandora-studio-skill-progression.js',
 'pandora-studio-catalog-safety.js'])vm.runInNewContext(read(p),{window:host});
const safe=host.PandoraCatalogSafety;
const source=n=>JSON.parse(read('data/os/'+n+'.json'));
const before={tables:source('tables'),classes:source('classes'),
 skills:source('skills'),items:source('items')};
const next=fn=>{const data={...before,tables:structuredClone(before.tables)};
 fn(data.tables);return {data,audit:safe.compatibility(before,data)};};
test('all 99 source experience requirements can update without changing level grants',()=>{
 assert.equal(Object.keys(before.tables.exp).length,99);
 const beforeJSON=JSON.stringify(before);
 const result=next(t=>{
  for(let level=1;level<=99;level++)t.exp[level].expReq+=level;
 });
 assert.equal(result.audit.totals.sourceOnly,1);
 assert.equal(result.audit.totals.verified,0);
 assert.equal(result.audit.totals.needsReview,0);
 assert.equal(result.audit.entries[0].contract,'table.experience-requirement');
 const hero={klass:'WARRIOR',race:'HUMAN',level:45,stats:{},points:{}};
 const oldHero=safe.project(before,hero),newHero=safe.project(result.data,hero);
 assert.equal(oldHero.skillBudget,newHero.skillBudget);
 assert.equal(oldHero.attributeBudget,newHero.attributeBudget);
 assert.equal(safe.check(result.data).ok,true);
 assert.equal(JSON.stringify(before),beforeJSON);
});
test('each expReq-only grade change uses a signed source-only contract',()=>{
 for(const level of [1,2,10,45,50,55,90,99]){
  const {audit}=next(t=>{t.exp[level].expReq++;});
  assert.equal(audit.entries.length,1);
  assert.equal(audit.entries[0].kind,'sourceOnly');
  assert.equal(audit.entries[0].contract,'table.experience-requirement');
 }
});
test('changing ability, skill or skillLimit is never certified from experience data',()=>{
 for(const field of ['ability','skill','skillLimit']){
  const {audit}=next(t=>{t.exp[45][field]++;});
  assert.equal(audit.entries[0].kind,'needsReview');
  assert.equal(audit.entries[0].contract,undefined);
 }
});
test('missing/extra grades, new fields and invalid numeric values fail closed',()=>{
 const cases=[
  t=>{delete t.exp[4];},
  t=>{t.exp[100]={ability:0,skill:0,skillLimit:0,expReq:100};},
  t=>{t.exp[45].future=1;},
  t=>{t.exp[45].expReq='999';},
  t=>{t.exp[45].expReq=-5;},
  t=>{t.exp[45].expReq=1.5;},
  t=>{t.exp[45].expReq=NaN;},
  t=>{t.exp[45].expReq+=1;t.exp[45].ability++;}
 ];
 for(const fn of cases){
  const {audit}=next(fn),row=audit.entries[0];
  assert.equal(row.kind,'needsReview');
  assert.equal(row.contract,undefined);
 }
});
test('mass tables mutation maintains separate real models and source-only XP',()=>{
 const saved=JSON.stringify(before);
 const {data,audit}=next(t=>{
  for(let level=1;level<=99;level++)t.exp[level].expReq++;
  for(let level=1;level<=10;level++){
   t.weaponPlus[level].flat++;
   t.magicPlus[level].ratio++;
  }
 });
 assert.equal(audit.entries.length,3);
 assert.equal(audit.totals.verified,2);
 assert.equal(audit.totals.sourceOnly,1);
 assert.equal(audit.totals.needsReview,0);
 assert.ok(audit.entries.some(row=>
  row.contract==='table.experience-requirement'&&row.kind==='sourceOnly'));
 assert.equal(safe.sourceGraphIntegrity(before,data).ok,true);
 assert.equal(JSON.stringify(before),saved);
});
