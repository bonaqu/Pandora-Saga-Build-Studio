import test from 'node:test';
import assert from 'node:assert/strict';
import {readFileSync} from 'node:fs';
import {runInNewContext} from 'node:vm';
const root={};runInNewContext(readFileSync(new URL(
 '../pandora-studio-catalog-safety.js',import.meta.url),'utf8'),{window:root});
const check=root.PandoraCatalogSafety.compatibility;
const base={skills:{a:{id:1,name:'Ability',cast:5,funcs:[{ep:'EP_DMG',fv1:[5,0,0,1]}]}},
 items:{x:{id:10,name:'Hat',desc:'Old',W:2}},
 tables:{abilityPoint:{45:3}},trades:{trades:[]}};
test('changed cast timing requires mechanics review; item description stays source-only',()=>{
 const changed=structuredClone(base);
 changed.skills.a.cast=1;changed.items.x.desc='New';
 const report=check(base,changed);
 assert.equal(report.totals.needsReview,1);
 assert.equal(report.totals.sourceOnly,1);
 assert.equal(report.requiresMechanicReview,true);
 assert.ok(report.samples.needsReview.some(x=>x.key==='skill:a'));
});
test('source effect changes and equipment stat changes flag model review before publish',()=>{
 const changed=structuredClone(base);
 changed.skills.a.funcs[0].fv1[0]=22;
 changed.items.x.W=9;changed.tables.abilityPoint[45]=4;
 const report=check(base,changed);
 assert.equal(report.requiresMechanicReview,true);
 assert.equal(report.totals.needsReview,2);
 assert.equal(report.totals.verified,1);
 assert.match(report.samples.needsReview[0].title,/Ability/);
});
test('new skill and changed source effect identity are never silently confirmed',()=>{
 const changed=structuredClone(base);changed.skills.b={id:2,name:'Unknown',funcs:[{ep:'NEW'}]};
 const report=check(base,changed);
 assert.equal(report.requiresMechanicReview,true);
 assert.ok(report.samples.needsReview.some(x=>x.key==='skill:b'));
});
test('classification does not mutate the baseline or candidate',()=>{
 const next=structuredClone(base);next.trades.trades.push({id:1});
 const b=JSON.stringify(base),n=JSON.stringify(next);
 assert.equal(check(base,next).totals.sourceOnly,1);
 assert.equal(JSON.stringify(base),b);assert.equal(JSON.stringify(next),n);
});
test('review is wired into confirmed publication preflight, not a post-D1 warning',()=>{
 const source=readFileSync(new URL('../pandora-os-catalog-workbench.js',import.meta.url),'utf8');
 assert.match(source,/const compatibility=safety\.compatibility\(baseline,combined\)/);
 assert.match(source,/return \{combined,normalized,compatibility,replay,equipment\}/);
 assert.match(source,/safety\.replayEquipmentEffects\(baseline,combined\)/);
 assert.match(source,/safety\.replaySkills\(baseline,combined\)/);
 assert.match(source,/const compatibility=staged\.compatibility/);
 assert.match(source,/ПРОВЕРКА МЕХАНИК:/);
});
