import test from 'node:test';
import assert from 'node:assert/strict';
import {readFileSync} from 'node:fs';
import {auditOsEffectFamilies} from '../scripts/audit-os-effect-families.mjs';

const real=JSON.parse(readFileSync(new URL('../data/os/skills.json',import.meta.url),'utf8'));
const copy=value=>structuredClone(value);
const entry=(id,funcs)=>({id,funcs});

test('all current EP names are represented, and every vector is counted without formula claims',()=>{
 const before=JSON.stringify(real);
 const report=auditOsEffectFamilies(real);
 const expectedEffects=Object.values(real).reduce((n,s)=>n+s.funcs.length,0);
 const expectedNames=new Set(Object.values(real).flatMap(s=>s.funcs.map(x=>x.ep)));
 assert.equal(report.summary.skillCount,Object.keys(real).length);
 assert.equal(report.summary.effectCount,expectedEffects);
 assert.equal(report.summary.distinctFamilies,expectedNames.size);
 assert.equal(report.effectFamilies.reduce((n,f)=>n+f.effectCount,0),expectedEffects);
 assert.deepEqual(new Set(report.effectFamilies.map(f=>f.ep)),expectedNames);
 assert.ok(report.effectFamilies.every(f=>f.certainty==='source-shape-only'));
 assert.equal(JSON.stringify(real),before,'read-only census');
});

test('execution references and old zero sentinels remain distinct source facts',()=>{
 const source={
  1:entry(1,[{ep:'EP_SKILL_EXEC',dir:'CASTER',fv1:[0,0,0,2],fv2:[0,0,0,0]},
   {ep:'EP_SKILL_EXEC',dir:'CASTER',fv1:[0,0,0,0],fv2:[0,0,0,0]},
   {ep:'EP_SKILL_EXEC',dir:'CASTER',fv1:[0,0,0,88],fv2:[0,0,0,0]}]),
  2:entry(2,[])
 };
 const report=auditOsEffectFamilies(source),ref=report.effectFamilies[0].executionReference;
 assert.equal(ref.existingSkill,1);
 assert.equal(ref.missingSkill,1);
 assert.equal(ref.zeroOrNonId,1);
 assert.deepEqual(ref.missingTargets,[{from:1,to:88}]);
 assert.equal(report.summary.unresolvedExecutionReferences,1);
});

test('unknown effect families remain source-only even with nonzero coefficients',()=>{
 const source={1:entry(1,[{
  ep:'EP_FUTURE_UNKNOWN',dir:'TARGET',
  fv1:[-22,4,0,11.5],fv2:[0,0,7,0]
 }])};
 const report=auditOsEffectFamilies(source),family=report.effectFamilies[0];
 assert.equal(family.certainty,'source-shape-only');
 assert.deepEqual(family.nonzeroPositionCounts.fv1,[1,1,0,1]);
 assert.deepEqual(family.negativePositionCounts.fv1,[1,0,0,0]);
 assert.equal(family.samples[0].fv1[3],11.5);
 assert.equal(family.executionReference,null);
});

test('malformed source identity and nonfinite/short EP arrays fail instead of disappearing',()=>{
 const good={ep:'EP_TEST',dir:'TARGET',fv1:[0,0,0,1],fv2:[0,0,0,0]};
 assert.throws(()=>auditOsEffectFamilies({1:entry(2,[good])}),/Invalid source skill/);
 assert.throws(()=>auditOsEffectFamilies({1:entry(1,[{...good,fv1:[1,2,3]}])}),/Invalid EP/);
 assert.throws(()=>auditOsEffectFamilies({1:entry(1,[{...good,fv1:[1,2,3,NaN]}])}),/Invalid EP/);
 assert.throws(()=>auditOsEffectFamilies([]),/Expected/);
});

test('a source passive with null direction is counted without guessing target side',()=>{
 const source={930120001:entry(930120001,[{
  ep:'EP_EQUIP_HOLYAURA_RESISTANCE_CONST',dir:null,
  fv1:[0,0,2,2],fv2:[0,0,0,0]
 }])};
 const family=auditOsEffectFamilies(source).effectFamilies[0];
 assert.equal(family.directions.UNSPECIFIED,1);
 assert.equal(family.samples[0].dir,null);
 assert.equal(family.certainty,'source-shape-only');
 assert.throws(()=>auditOsEffectFamilies({1:entry(1,[{
  ep:'EP_TEST',fv1:[0,0,0,1],fv2:[0,0,0,0]
 }])}),/Invalid EP/,'missing dir is not an intentional null');
});
