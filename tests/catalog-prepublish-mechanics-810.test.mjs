import test from 'node:test';
import assert from 'node:assert/strict';
import {readFileSync} from 'node:fs';
import vm from 'node:vm';
const root={};vm.runInNewContext(readFileSync(new URL('../pandora-studio-catalog-safety.js',import.meta.url),'utf8'),{window:root});
const check=root.PandoraCatalogSafety.compatibility;
const base={
 classes:{MAGE:{id:'MAGE',name:'Маг',parent:null,
  hp:{base:75,lv:10,vit:5},mp:{base:60,lv:9,spi:6},
  branchCaps:{element:50},statCaps:{vit:99},baseClass:'MAGE'}},
 tables:{abilityPoint:{45:4},weaponPlus:{1:{ratio:2}},levelCap:45},
 skills:{a:{name:'Bolt',funcs:[{ep:'EP_DAMAGE',fv1:[1,0,0,0]}]}}
};
test('a revised weapon-enhancement formula is NOT misreported as verified by HP/MP checks',()=>{
 const next=structuredClone(base);next.tables.weaponPlus[1].ratio=5;
 const report=check(base,next);
 assert.equal(report.totals.verified,0);
 assert.equal(report.totals.needsReview,1);
 assert.ok(report.samples.needsReview.some(x=>x.key==='table:weaponPlus'));
});
test('source level cap is informational, while ability points have actual modeled coverage',()=>{
 const next=structuredClone(base);next.tables.levelCap=50;next.tables.abilityPoint[45]=5;
 const report=check(base,next);
 assert.equal(report.totals.sourceOnly,1);
 assert.equal(report.totals.verified,1);
 assert.equal(report.totals.needsReview,0);
});
test('a changed class parent or branch mastery cap needs mechanic review',()=>{
 const next=structuredClone(base);next.classes.MAGE.branchCaps.element=60;
 let report=check(base,next);
 assert.equal(report.totals.verified,0);
 assert.equal(report.totals.needsReview,1);
 assert.ok(report.samples.needsReview[0].key==='class:MAGE');
 next.classes.MAGE.branchCaps.element=50;next.classes.MAGE.parent='WIZARD';
 report=check(base,next);
 assert.equal(report.totals.needsReview,1);
});
test('modeled HP coefficients are checked, not silently put in source-only status',()=>{
 const next=structuredClone(base);next.classes.MAGE.hp.lv=11;
 const report=check(base,next);
 assert.equal(report.totals.verified,1);
 assert.equal(report.totals.needsReview,0);
});
test('only a text change is source-only, and a changed FV vector is unverified',()=>{
 const next=structuredClone(base);next.classes.MAGE.name='Маг II';
 next.skills.a.funcs[0].fv1[0]=3;
 const report=check(base,next);
 assert.equal(report.totals.sourceOnly,1);
 assert.equal(report.totals.needsReview,1);
});
test('changing a prerequisite chain or effect-driving stat requires review',()=>{
 const next=structuredClone(base);next.skills.a.prereq=321;
 let report=check(base,next);
 assert.equal(report.totals.needsReview,1);
 next.skills.a.prereq=undefined; // original field is absent
 next.skills.a.powerStat='INT';
 report=check(base,next);
 assert.equal(report.totals.needsReview,1);
});
test('pre-apply warnings and approval are driven by exact selected snapshot mechanics',()=>{
 const code=readFileSync(new URL('../pandora-os-catalog-workbench.js',import.meta.url),'utf8');
 assert.match(code,/compatibility:safety\.compatibility\(baseline,selected\)/);
 assert.match(code,/const mechanicsReview=preview\?\.compatibility\?\.requiresMechanicReview===true/);
 assert.match(code,/const risky=Boolean\(deleted\|\|settings\|\|unsure\|\|links\|\|formulas\|\|mechanicsReview/);
 assert.match(code,/Требуют адаптации механики; публикация не подтвердит их расчёты/);
 assert.match(code,/const preview=ready\?selectedImpact\(\):null/);
 const model=readFileSync(new URL('../pandora-studio-catalog-safety.js',import.meta.url),'utf8');
 assert.match(model,/sampleLevels=\[\.\.\.new Set\(\[1,15,30,45,max\]/);
});
