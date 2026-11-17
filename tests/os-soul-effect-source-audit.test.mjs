import test from 'node:test';
import assert from 'node:assert/strict';
import {readFileSync} from 'node:fs';
import {auditOsSoulEffectFamilies} from '../scripts/audit-os-soul-effects.mjs';
const source=JSON.parse(readFileSync(new URL('../data/os/souls.json',import.meta.url),'utf8'));
const make=(id,effects,slots=['weapon'])=>({id,name:'Test Soul',slots,effects});

test('all current source Souls/effects and EP families are inventoried without mutation',()=>{
 const before=JSON.stringify(source);
 const report=auditOsSoulEffectFamilies(source);
 const effects=Object.values(source).flatMap(s=>s.effects);
 const familyNames=new Set(effects.map(e=>e.func));
 assert.equal(report.summary.soulRecords,Object.keys(source).length);
 assert.equal(report.summary.effectRecords,effects.length);
 assert.equal(report.summary.uniqueEffectFamilies,familyNames.size);
 assert.equal(report.effectFamilies.reduce((sum,row)=>sum+row.effectRecords,0),effects.length);
 assert.deepEqual(new Set(report.effectFamilies.map(f=>f.ep)),familyNames);
 assert.ok(report.effectFamilies.every(f=>f.certainty==='source-parameters-only'));
 assert.equal(JSON.stringify(source),before);
});
test('exact source examples include positive accuracy and signed speed penalties',()=>{
 const report=auditOsSoulEffectFamilies(source);
 const accuracy=report.effectFamilies.find(f=>f.ep==='EP_TOHIT_CONST');
 assert.ok(accuracy.examples.some(x=>x.soulId===101000&&x.a===8));
 const speed=report.effectFamilies.find(f=>f.ep==='EP_ATTACKINTERVAL_SCALE');
 assert.ok(speed.examples.some(x=>x.a<0)||speed.negative.a>0);
 assert.ok(report.summary.negativeValues>0);
});
test('unknown EP names and negative decimals remain raw source facts',()=>{
 const report=auditOsSoulEffectFamilies({
  1:make(1,[{func:'EP_UNSEEN_NEW',dir:'SELF',a:-7.5,b:2,min:0,max:10},
    {func:'EP_UNSEEN_NEW',dir:'SELF',a:0,b:0,min:0,max:20}])
 });
 const f=report.effectFamilies[0];
 assert.equal(f.certainty,'source-parameters-only');
 assert.equal(f.soulCount,1);
 assert.equal(f.effectRecords,2);
 assert.equal(f.negative.a,1);
 assert.equal(f.examples[0].a,-7.5);
 assert.equal(report.summary.uniqueEffectFamilies,1);
});
test('explicit missing target direction remains unspecified, not guessed',()=>{
 const f=auditOsSoulEffectFamilies({
  1:make(1,[{func:'EP_FUTURE',dir:null,a:0,b:0,min:0,max:10}])
 }).effectFamilies[0];
 assert.equal(f.directions.UNSPECIFIED,1);
 assert.equal(f.examples[0].dir,null);
});
test('corrupt identities or nonfinite/missing parameters fail instead of disappearing',()=>{
 const good={func:'EP_TEST',dir:'SELF',a:1,b:0,min:0,max:10};
 assert.throws(()=>auditOsSoulEffectFamilies([]),/Expected/);
 assert.throws(()=>auditOsSoulEffectFamilies({1:make(2,[good])}),/Malformed source Soul/);
 assert.throws(()=>auditOsSoulEffectFamilies({1:make(1,[{...good,b:NaN}])}),/Malformed Soul effect/);
 assert.throws(()=>auditOsSoulEffectFamilies({1:make(1,[{...good,dir:undefined}])}),/Malformed Soul effect/);
 assert.throws(()=>auditOsSoulEffectFamilies({1:make(1,[{...good,func:'UNSAFE'}])}),/Malformed Soul effect/);
});
