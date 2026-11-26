import test from 'node:test';
import assert from 'node:assert/strict';
import {readFileSync} from 'node:fs';

const read=path=>readFileSync(new URL('../'+path,import.meta.url),'utf8');
const skills=JSON.parse(read('data/os/skills.json'));
const classes=JSON.parse(read('data/os/classes.json'));
const host={};
Function('window',read('pandora-os-character-calculator.js'))(host);
const calc=host.PandoraOSCalculator;

test('all 28 jobs and levels 1–55 preserve modeled coefficients, not claimed percentages',()=>{
 const original=JSON.stringify(skills),jobs=Object.entries(classes);
 assert.equal(jobs.length,28);
 let cases=0,coefficients=0;
 for(const [jobKey,job] of jobs)for(let level=1;level<=55;level++){
  const caps=job.branchCaps;
  const branchMasteries=Object.fromEntries(Object.entries(caps).map(
   ([key,cap])=>[key,Math.min(45,cap)]));
  const options={skillCatalog:skills,jobKey,level,branchCaps:caps,
   branchMasteries,weaponKind:'LANCE'};
  const rows=calc.directStrikeCoefficientPreview(options);
  assert.ok(Array.isArray(rows),'level '+level+' '+jobKey);
  for(const row of rows){
   coefficients++;
   assert.equal(row.amount,null,'not a final hit or damage calculation');
   assert.equal(row.uncertain,true);
   assert.equal(row.coefficientModels.length,1);
   const p=row.coefficientModels[0];
   assert.equal(p.ep,'EP_ONHIT_DAMAGE_SCALE');
   assert.equal(p.confidence,'coefficient-model');
   assert.equal(p.unit,'','not a verified percent');
   assert.equal(p.labelRu,'Коэффициент удара (модель)');
   assert.equal(p.labelEn,'Strike coefficient (model)');
   assert.ok(Number.isSafeInteger(p.amount));
   if(row.nextMastery){
    assert.equal(row.nextMastery.gain,1);
    assert.ok(row.nextMastery.value>branchMasteries[row.nextMastery.branch]);
    assert.ok(row.nextMastery.value<=caps[row.nextMastery.branch]);
   }
  }
  cases++;
 }
 assert.equal(cases,1540);
 assert.ok(coefficients>0);
 assert.equal(JSON.stringify(skills),original,'sweep must not alter source');
});

test('unsupported TARGET and extra-stat source shapes cannot create a modeled strike',()=>{
 const job='JUGGERNAUT',caps=classes[job].branchCaps;
 const get=catalog=>calc.directStrikeCoefficientPreview({
  skillCatalog:catalog,jobKey:job,level:45,
  branchCaps:caps,branchMasteries:{brush:40,thrust:40},
  weaponKind:'LANCE'
 });
 const regular=get(skills).find(row=>row.id===142002001);
 assert.ok(regular,'known supported strike remains visible');
 assert.equal(regular.coefficientModels[0].unit,'');
 assert.ok(!get(skills).some(row=>row.id===121703001),
  'TARGET-only triple strike is not a caster model');
 assert.ok(!get(skills).some(row=>row.id===142005001),
  'extra stat dependence is outside provisional model');
 const forged=structuredClone(skills);
 forged['142002001'].funcs.find(f=>f.ep==='EP_ONHIT_DAMAGE_SCALE').fv1[0]=1;
 assert.ok(!get(forged).some(row=>row.id===142002001),
  'new unverified stat coefficient fails closed');
});

test('Hero Book RU/EN presents model mastery gain without invented percent',()=>{
 const book=read('pandora-studio-hero-book.js');
 const calcSource=read('pandora-os-character-calculator.js');
 assert.match(book,/const bonus='\+1';/);
 assert.doesNotMatch(book,/const bonus=next\.effect==='strike'\?'\+1%'/);
 assert.match(book,/text:en\?'\(model\)':'\(модель\)'/);
 assert.match(calcSource,/labelRu:'Коэффициент удара \(модель\)'/);
 assert.match(calcSource,/labelEn:'Strike coefficient \(model\)'/);
});
