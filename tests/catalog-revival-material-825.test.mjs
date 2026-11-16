import test from 'node:test';
import assert from 'node:assert/strict';
import {readFileSync} from 'node:fs';
import vm from 'node:vm';

const read=name=>readFileSync(new URL('../'+name,import.meta.url),'utf8');
const host={};
for(const file of ['pandora-os-character-calculator.js',
 'pandora-studio-attribute-progression.js','pandora-studio-skill-progression.js',
 'pandora-studio-catalog-safety.js'])
 vm.runInNewContext(read(file),{window:host});
const C=host.PandoraOSCalculator,S=host.PandoraCatalogSafety;
const json=name=>JSON.parse(read('data/os/'+name+'.json'));
const before={skills:json('skills'),classes:json('classes'),tables:json('tables'),
 items:json('items')};
const id=310003001;
const row=skill=>skill.funcs.find(f=>f.ep==='EP_CONSUME_ITEM');
const edited=mutate=>{
 const next={...before,skills:{...before.skills}};
 next.skills[id]=structuredClone(before.skills[id]);
 mutate(next.skills[id]);
 return next;
};
const inspect=(data,job='CLERIC',level=55)=>{
 const caps=before.classes[job].branchCaps;
 const x=C.supportEffectPreview({skillCatalog:data.skills,jobKey:job,level,
  branchCaps:caps,branchMasteries:caps});
 return {result:x,revive:x.help.find(entry=>entry.id===id)};
};
test('existing revival skill consumes source-updated Holy Water quantity, not a fixed three',()=>{
 const initial=JSON.stringify(before);
 assert.equal(row(before.skills[id]).fv2[3],3);
 for(const nextAmount of [1,2,4,7,15]){
  const next=edited(skill=>{row(skill).fv2[3]=nextAmount;});
  const old=inspect(before).revive,current=inspect(next).revive;
  assert.equal(old.requiredItemId,50059);
  assert.equal(old.requiredItemCount,3);
  assert.equal(current.requiredItemId,50059);
  assert.equal(current.requiredItemCount,nextAmount);
  assert.equal(current.finalAmount,null,'no claim about restored HP');
  assert.equal(current.inventoryChecked,false,'no assumed inventory');
  assert.equal(current.appliedToHero,false,'no permanent hero buff');
  assert.equal(current.sourceOnly,true);
  const classified=S.compatibility(before,next);
  assert.equal(classified.totals.verified,1);
  assert.equal(classified.totals.needsReview,0);
  const replay=S.replaySkills(before,next);
  assert.equal(replay.ok,true,'signed source-only requirement retained');
  assert.equal(replay.lost,0);
 }
 assert.equal(JSON.stringify(before),initial,'source data immutable');
});
test('changed resource ID, EP, unknown FV and shape cannot acquire verified classification',()=>{
 for(const mutate of [
  skill=>{row(skill).fv2[3]=0;},
  skill=>{row(skill).fv2[3]=-3;},
  skill=>{row(skill).fv2[3]=2.5;},
  skill=>{row(skill).fv2[2]=1;},
  skill=>{row(skill).fv1[3]=50021;},
  skill=>{row(skill).dir='TARGET';},
  skill=>{row(skill).ep='EP_FUTURE_REVIVAL';},
  skill=>{row(skill).future=1;},
  skill=>{skill.funcs.push({ep:'EP_FUTURE',dir:'CASTER',fv1:[0,0,0,0],fv2:[0,0,0,1]});},
  skill=>{row(skill).fv2[3]=4;skill.reqs[0].amount++;}
 ]){
  const next=edited(mutate);
  const classifier=S.compatibility(before,next);
  assert.equal(classifier.totals.needsReview,1);
  const outcome=inspect(next);
  assert.equal(outcome.revive,undefined,'unknown mechanics require missing proof');
  assert.ok(outcome.result.rejected.includes(id));
  const replay=S.replaySkills(before,next);
  assert.equal(replay.ok,false,'block pre-D1 loss for invalid source');
  assert.ok(replay.samples.some(x=>x.id===String(id)&&
   (x.module==='source-support-material'||x.module==='source-support-action')));
 }
});
test('the source amount is class access and hero level independent',()=>{
 const next=edited(skill=>{row(skill).fv2[3]=9;});
 for(const job of ['CLERIC','PRIEST','ENCHANTER']){
  const preview=inspect(next,job,55).revive;
  assert.ok(preview,'known class '+job);
  assert.equal(preview.requiredItemCount,9);
  assert.equal(preview.requiredItemId,50059);
 }
 assert.equal(inspect(next,'CLERIC',34).revive.requirementsMet,false);
 assert.equal(inspect(next,'CLERIC',35).revive.requirementsMet,true);
 assert.equal(inspect(next,'WARRIOR').revive,undefined);
});
