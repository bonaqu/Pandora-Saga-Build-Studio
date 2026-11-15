import test from 'node:test';
import assert from 'node:assert/strict';
import {readFileSync} from 'node:fs';
import vm from 'node:vm';

const read=name=>readFileSync(new URL('../'+name,import.meta.url),'utf8');
const root={};
for(const file of ['pandora-os-character-calculator.js',
 'pandora-studio-attribute-progression.js','pandora-studio-skill-progression.js',
 'pandora-studio-catalog-safety.js'])
 vm.runInNewContext(read(file),{window:root});
const C=root.PandoraOSCalculator,S=root.PandoraCatalogSafety;
const get=name=>JSON.parse(read('data/os/'+name+'.json'));
const before={skills:get('skills'),classes:get('classes'),tables:get('tables')};
const renamed=(...ids)=>{
 const after={...before,skills:{...before.skills}};
 for(const id of ids){
  after.skills[id]=structuredClone(before.skills[id]);
  after.skills[id].name='Игровое умение '+id;
 }
 return after;
};
const args=(job,skillCatalog,additional={})=>({
 skillCatalog,jobKey:job,level:55,
 branchCaps:before.classes[job].branchCaps,
 branchMasteries:before.classes[job].branchCaps,
 ...additional
});

test('Purify ally coefficients survive independent translations of root and inner skill',()=>{
 const baseline=C.scalingSkillPreview(args('CLERIC',before.skills,{
  stats:{vit:70,str:70,agi:70,dex:70,spi:100,int:80},
  combat:{attack:{walkingBase:180},defense:{directRaw:100},
   accuracy:{base:140},dodge:{base:120}}
 }));
 const find=skills=>{
  const r=C.scalingSkillPreview(args('CLERIC',skills,{
   stats:{vit:70,str:70,agi:70,dex:70,spi:100,int:80},
   combat:{attack:{walkingBase:180},defense:{directRaw:100},
    accuracy:{base:140},dodge:{base:120}}
  }));
  return r.defense.find(x=>x.id===310014001);
 };
 const old=baseline.defense.find(x=>x.id===310014001);
 assert.ok(old);
 assert.deepEqual(old.coefficientModels.map(x=>x.amount),[100,100]);
 for(const catalog of [renamed(310014001),renamed(310014002),
  renamed(310014001,310014002)]){
  const updated=find(catalog.skills);
  assert.ok(updated,'localized labels must not erase the signed Purify chain');
  assert.deepEqual(updated.coefficientModels.map(x=>x.amount),[100,100]);
  assert.equal(S.replaySkills(before,catalog).changedSkills,0);
 }
});
test('known priest encouragement is independent of its Russian display name but not FV2',()=>{
 const input={priestEnabled:true,priestEncouragement:true};
 const owner={enabled:true,spi:134,blessing:90,hymn:30};
 const gain=skills=>C.encouragementBonus(input,{externalPriest:owner,skillCatalog:skills});
 assert.equal(gain(before.skills),9);
 assert.equal(gain(renamed(320012001).skills),9);
 const invalid={...before.skills,'320012001':structuredClone(before.skills['320012001'])};
 invalid['320012001'].funcs[2].fv2[3]=1;
 assert.equal(gain(invalid),0,'unsupported extra FV2 cannot keep an old numeric buff');
});
test('conditional on-hit links remain source-driven after root/child rename',()=>{
 const view=skills=>C.skillExecutionChains({
  ...args('CALAMITY',skills),onHit:true
 }).rows.find(x=>x.id===430057001);
 assert.deepEqual(view(before.skills).paths,[[430057001,430057002]]);
 for(const catalog of [renamed(430057001),renamed(430057002),
  renamed(430057001,430057002)])
  assert.deepEqual(view(catalog.skills).paths,[[430057001,430057002]]);
});
test('source-verified nested Sandstorm chain does not use text equality',()=>{
 const id=420007101,child=420007102;
 const job=Object.keys(before.classes).find(key=>
  before.skills[id].classes?.[key]&&before.classes[key].branchCaps.embody>=61);
 assert.ok(job,'a confirmed caster profession supports the current OS source');
 const view=skills=>C.skillExecutionChains(args(job,skills)).rows.find(x=>x.id===id);
 const initial=view(before.skills);
 assert.ok(initial);
 assert.deepEqual(view(renamed(id,child).skills).paths,initial.paths);
 const corrupt=renamed(id,child);
 corrupt.skills[child].branchRaw='OTHER_SOURCE';
 assert.equal(view(corrupt.skills),undefined,'branch identity still blocks a false chain');
});
test('trap material costs and upgraded Plant Mine are preserved by label-only edits',()=>{
 const id=240002001,level50=240002002,regular=240002050,advanced=240002051;
 const view=skills=>C.trapSkillCostPreview(args('DISTURBANCE',skills))
  .rows.find(x=>x.id===id);
 const initial=view(before.skills);
 assert.ok(initial&&initial.level50Variant);
 const catalog=renamed(id,level50,regular,advanced);
 const current=view(catalog.skills);
 assert.ok(current&&current.level50Variant);
 assert.equal(current.count,initial.count);
 assert.equal(current.linkedEffectId,initial.linkedEffectId);
 assert.equal(current.level50Variant.linkedEffectId,initial.level50Variant.linkedEffectId);
 const invalid=renamed(id,level50,regular,advanced);
 invalid.skills[advanced].funcs[0].fv1[0]++;
 assert.equal(view(invalid.skills).level50Variant,undefined,
  'an altered child effect still prevents a false level-50 source');
});
test('independent renames across covered source models stay data-only',()=>{
 const next=renamed(310014001,310014002,320012001,430057001,
  430057002,240002001,240002002,240002050,240002051);
 const baseline=JSON.stringify(before),candidate=JSON.stringify(next);
 const compatibility=S.compatibility(before,next);
 assert.equal(compatibility.totals.needsReview,0);
 assert.equal(compatibility.totals.sourceOnly,9);
 const replay=S.replaySkills(before,next);
 assert.equal(replay.changedSkills,0);
 assert.equal(replay.lost,0);
 assert.equal(JSON.stringify(before),baseline);
 assert.equal(JSON.stringify(next),candidate);
});
