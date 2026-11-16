import test from 'node:test';
import assert from 'node:assert/strict';
import {readFileSync} from 'node:fs';
const read=p=>readFileSync(new URL('../'+p,import.meta.url),'utf8');
const root={};Function('window',read('pandora-os-character-calculator.js'))(root);
const C=root.PandoraOSCalculator,skills=JSON.parse(read('data/os/skills.json')),
 classes=JSON.parse(read('data/os/classes.json'));
const examples=[
 {id:100000501,job:'WARRIOR',api:'tacticalSkillPreview',group:'rows'},
 {id:310011001,job:'CLERIC',api:'supportEffectPreview',group:'help'}
];
const preview=(sample,catalog)=>{
 const result=C[sample.api]({skillCatalog:catalog,jobKey:sample.job,level:55,
  branchCaps:classes[sample.job].branchCaps,
  branchMasteries:classes[sample.job].branchCaps});
 return {result,row:result[sample.group].find(x=>x.id===sample.id)};
};
test('two independent qualitative inspectors read new source mana/cooldown',()=>{
 for(const sample of examples){
  const source=skills[sample.id];
  assert.ok(preview(sample,skills).row);
  const changed={...skills,[String(sample.id)]:{
   ...source,mana:source.mana+1,cooldown:source.cooldown+0.5
  }};
  const updated=preview(sample,changed).row;
  assert.ok(updated,'signed source-only row must survive');
  assert.equal(updated.mana,source.mana+1);
  assert.equal(updated.cooldown,source.cooldown+0.5);
  assert.equal(updated.sourceOnly,true);
  assert.equal(updated.finalAmount,null);
  assert.equal(updated.appliedToHero,false);
 }
});
test('effect identity, cast, class and requirements remain signature-locked',()=>{
 for(const sample of examples){
  const original=skills[sample.id];
  for(const edit of [
   x=>{x.cast+=1;},
   x=>{x.reqs=x.reqs.length?[{...x.reqs[0],amount:x.reqs[0].amount+1},...x.reqs.slice(1)]:
    [{branch:'blessing',amount:1}];},
   x=>{x.classes={...x.classes,[sample.job]:0};},
   x=>{x.funcs=structuredClone(x.funcs);x.funcs[0].fv1[3]+=1;},
   x=>{x.funcs=structuredClone(x.funcs);x.funcs[0].dir=
    x.funcs[0].dir==='TARGET'?'CASTER':'TARGET';}
  ]){
   const selected=structuredClone(original);edit(selected);
   const report=preview(sample,{...skills,[String(sample.id)]:selected});
   assert.equal(report.row,undefined,'unproven source change '+sample.id);
   // A class-permission change may simply remove the class from inspection.
   if(selected.classes?.[sample.job]===original.classes?.[sample.job])
    assert.ok(report.result.rejected.includes(sample.id));
  }
 }
});
