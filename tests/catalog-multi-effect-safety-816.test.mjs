import test from 'node:test';
import assert from 'node:assert/strict';
import {readFileSync} from 'node:fs';
import vm from 'node:vm';

const read=name=>readFileSync(new URL('../'+name,import.meta.url),'utf8');
const root={};
for(const name of ['pandora-os-character-calculator.js',
 'pandora-studio-attribute-progression.js',
 'pandora-studio-skill-progression.js','pandora-studio-catalog-safety.js'])
 vm.runInNewContext(read(name),{window:root});
const C=root.PandoraOSCalculator,S=root.PandoraCatalogSafety;
const get=name=>JSON.parse(read('data/os/'+name+'.json'));
const before={skills:get('skills'),classes:get('classes'),tables:get('tables')};
function change(id,edit){
 const after={...before,skills:{...before.skills}};
 after.skills[id]=structuredClone(before.skills[id]);
 edit(after.skills[id]);
 return after;
}
function row(skills,id,job,level){
 const caps=before.classes[job].branchCaps;
 const mastery=Object.fromEntries(Object.entries(caps));
 const actual=C.scalingSkillPreview({skillCatalog:skills,jobKey:job,level,
  branchCaps:caps,branchMasteries:mastery,
  stats:{vit:80,str:100,agi:100,dex:90,spi:100,int:100},
  combat:{attack:{walkingBase:200},defense:{directRaw:100},
   accuracy:{base:140},dodge:{base:120}},
  weaponKind:'BARE_HAND',hasShield:true});
 return [...actual.offense,...actual.defense,...actual.utility,
  ...actual.movement].find(x=>x.id===id);
}
test('level-50 Wind Trail primary FV is dynamic but its secondary effect is guarded',()=>{
 const id=420004002;
 const after=change(id,skill=>{skill.funcs[0].fv1[3]+=7});
 const old=row(before.skills,id,'CONJURER',55);
 const next=row(after.skills,id,'CONJURER',55);
 assert.ok(old&&next);
 assert.equal(next.amount-old.amount,7);
 const extras=x=>Object.fromEntries(x.coefficientModels.map(m=>[m.ep,m.amount]));
 assert.equal(extras(next).EP_ALL_RESISTANCE_CONST,
  extras(old).EP_ALL_RESISTANCE_CONST);
 assert.equal(C.dynamicSkillSourceMatches(after.skills[id],
  C.dynamicSkillContracts[id].ep,C.dynamicSkillContracts[id].fv1),true);
 assert.equal(S.compatibility(before,after).totals.verified,1);
 const replay=S.replaySkills(before,after);
 assert.equal(replay.lost,0);
 assert.ok(replay.previouslyModeled>0);
});
test('upgraded Wind Trail loses proof if its extra FV or casting conditions change',()=>{
 const id=420004002;
 const secondary=change(id,skill=>{skill.funcs[1].fv1[3]+=1});
 assert.equal(S.compatibility(before,secondary).totals.needsReview,1);
 assert.equal(C.dynamicSkillSourceMatches(secondary.skills[id],
  C.dynamicSkillContracts[id].ep,C.dynamicSkillContracts[id].fv1),false);
 assert.ok(S.replaySkills(before,secondary).lost>0);
 const timing=change(id,skill=>{skill.cast=2});
 const timingStatus=S.compatibility(before,timing);
 assert.equal(timingStatus.totals.sourceOnly,1);
 assert.equal(timingStatus.totals.verified,0);
 // Even valid source-only timing must not erase a previous numeric model.
 const old=row(before.skills,id,'CONJURER',55);
 const next=row(timing.skills,id,'CONJURER',55);
 assert.ok(old.coefficientModels.some(x=>x.ep==='EP_ALL_RESISTANCE_CONST'));
 assert.ok(!next.coefficientModels.some(x=>x.ep==='EP_ALL_RESISTANCE_CONST'));
 const replay=S.replaySkills(before,timing);
 assert.ok(replay.changedSkills>0);
 assert.ok(replay.lost>0,'secondary coefficient must be checked even if primary survived');
});
test('replay protects source coefficients of manual multi-effect previews',()=>{
 const id=320011001;
 const old=row(before.skills,id,'ENCHANTER',55);
 assert.equal(old.amount,null,'overall result is intentionally not claimed');
 assert.equal(old.coefficientModels.length,3,'three independent source parameters');
 const after=change(id,skill=>{skill.funcs[1].fv1[3]+=1});
 assert.equal(S.compatibility(before,after).totals.needsReview,1);
 const replay=S.replaySkills(before,after);
 assert.ok(replay.previouslyModeled>0);
 assert.ok(replay.lost>0,'unknown new coefficient must not quietly remove old preview');
});
test('unknown gameplay still fails closed; signed costs stay source-only with independent replay',()=>{
 for(const field of ['mana','cast','cooldown','motion','range','unrecognizedFutureField']){
  const after=change(420004001,skill=>{
   skill[field]=field==='unrecognizedFutureField'?{newMechanic:1}:skill[field]+1;
  });
  const status=S.compatibility(before,after);
  if(field==='unrecognizedFutureField')
   assert.equal(status.totals.needsReview,1,field);
  else{
   assert.equal(status.totals.sourceOnly,1,field);
   assert.equal(status.entries[0].contract,'skill.source-parameters');
  }
  assert.ok(S.replaySkills(before,after).changedSkills>=1,field);
 }
 const display=change(420004001,skill=>{
  skill.name+=' (обновлено)';skill.desc='Текст';skill.iconId+=1;
 });
 assert.equal(S.compatibility(before,display).totals.sourceOnly,1);
 assert.equal(S.replaySkills(before,display).changedSkills,0);
});
