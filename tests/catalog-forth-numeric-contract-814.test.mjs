import test from 'node:test';
import assert from 'node:assert/strict';
import {readFileSync} from 'node:fs';
import vm from 'node:vm';
const read=name=>readFileSync(new URL('../'+name,import.meta.url),'utf8');
const root={};
for(const p of ['pandora-os-character-calculator.js','pandora-studio-catalog-safety.js'])
 vm.runInNewContext(read(p),{window:root});
const C=root.PandoraOSCalculator,S=root.PandoraCatalogSafety;
const load=name=>JSON.parse(read('data/os/'+name+'.json'));
const base={items:load('items'),souls:load('souls'),itemForth:load('itemForth'),
 tables:load('tables'),classes:load('classes')};
const mutateForth=(id,fn)=>{
 const next={...base,itemForth:{...base.itemForth}};
 next.itemForth[id]=structuredClone(base.itemForth[id]);
 fn(next.itemForth[id]);
 return next;
};

test('Forth amount-only edit is calculated by real source effect and numeric hero models',()=>{
 const original=base.itemForth['242']['2'];
 assert.ok(original.some(x=>x.func==='EP_TOHIT_CONST'));
 const next=mutateForth('242',forth=>{forth['2'][0].a+=3});
 const report=S.compatibility(base,next);
 assert.equal(report.totals.verified,1);
 assert.equal(report.totals.needsReview,0);
 assert.ok(report.samples.verified[0].key==='itemForth:242');
 const weapon=base.items['242'];
 const readBonus=data=>C.gatherEffects([['item:242',weapon,2]],data.itemForth).bonuses.accuracy;
 assert.equal(readBonus(next)-readBonus(base),3,'actual grade-2 source reaches current accuracy model');
 const replay=S.replayEquipmentEffects(base,next);
 assert.equal(replay.ok,true);
 assert.ok(replay.retained>0);
 assert.equal(replay.lost,0);
});
test('changed Forth effect code is not accepted as an amount-only edit',()=>{
 const next=mutateForth('242',forth=>{forth['2'][0].func='EP_UNKNOWN_GAIN';forth['2'][0].a=15});
 const report=S.compatibility(base,next);
 assert.equal(report.totals.needsReview,1);
 assert.equal(report.totals.verified,0);
 assert.equal(S.replayEquipmentEffects(base,next).ok,false);
});
test('new refinement breakpoint is classified as a changed mechanic',()=>{
 const next=mutateForth('242',forth=>{
  const levels=new Set(Object.keys(forth));
  const missing=Array.from({length:10},(_,i)=>String(i+1)).find(x=>!levels.has(x));
  assert.ok(missing);
  forth[missing]=structuredClone(forth['2']);
 });
 const report=S.compatibility(base,next);
 assert.equal(report.totals.needsReview,1);
 assert.equal(report.totals.verified,0);
});
test('Forth b-vector and min/max semantics cannot auto-pass through numeric source contract',()=>{
 const changed=mutateForth('242',forth=>{forth['2'][0].b+=1});
 assert.equal(S.compatibility(base,changed).totals.needsReview,1);
});
test('joint W and Forth change stays reviewable, no isolated false-safe status',()=>{
 const next=mutateForth('242',forth=>{forth['2'][0].a+=3});
 next.items={...base.items,'242':{...base.items['242'],W:base.items['242'].W+1}};
 const report=S.compatibility(base,next);
 assert.equal(report.totals.needsReview,2);
 assert.equal(report.totals.verified,0);
});
test('separate changed Forth sources each get their own compatibility status',()=>{
 const next=mutateForth('242',forth=>{forth['2'][0].a+=1});
 next.itemForth['243']=structuredClone(base.itemForth['243']);
 next.itemForth['243']['2'][0].func='EP_UNMODELED_REPLACEMENT';
 const report=S.compatibility(base,next);
 assert.equal(report.totals.verified,1);
 assert.equal(report.totals.needsReview,1);
 assert.ok(report.samples.needsReview[0].key==='itemForth:243');
});
test('source snapshots are not mutated by new Forth compatibility checks',()=>{
 const next=mutateForth('242',forth=>{forth['2'][0].a+=1});
 const before=JSON.stringify(base),after=JSON.stringify(next);
 S.compatibility(base,next);S.replayEquipmentEffects(base,next);
 assert.equal(JSON.stringify(base),before);
 assert.equal(JSON.stringify(next),after);
});
