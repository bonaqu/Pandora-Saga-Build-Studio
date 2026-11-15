import test from 'node:test';
import assert from 'node:assert/strict';
import {readFileSync} from 'node:fs';
import vm from 'node:vm';

const read=name=>readFileSync(new URL('../'+name,import.meta.url),'utf8');
const root={};
for(const path of ['pandora-os-character-calculator.js',
 'pandora-studio-attribute-progression.js','pandora-studio-skill-progression.js',
 'pandora-studio-catalog-safety.js'])
 vm.runInNewContext(read(path),{window:root});
const calc=root.PandoraOSCalculator,safety=root.PandoraCatalogSafety;
const load=name=>JSON.parse(read('data/os/'+name+'.json'));
const before={skills:load('skills'),classes:load('classes'),tables:load('tables')};
const roots=[240001001,240002001,240005001,240008001,240010001];
const variantId=240002002,variantParent=240002001;
const check=(data,job)=>calc.trapSkillCostPreview({
 skillCatalog:data.skills,jobKey:job,level:55,
 branchCaps:data.classes[job].branchCaps,
 branchMasteries:data.classes[job].branchCaps
});
const owner=id=>Object.keys(before.classes).find(job=>check(before,job).rows
 .some(r=>r.id===id&&r.requirementsMet));
function updated(changes){
 const next={...before,skills:{...before.skills}};
 for(const [id,fn] of changes){
  next.skills[id]=structuredClone(before.skills[id]);fn(next.skills[id]);
 }
 return next;
}
const amount=skill=>skill.funcs[0].fv2[3];

test('all five signed trap source material costs accept one positive FV2 quantity without code release',()=>{
 const baseline=JSON.stringify(before);
 for(const id of roots){
  const job=owner(id);assert.ok(job,'source proof exists: '+id);
  const oldCost=amount(before.skills[id]);
  const next=updated([[id,skill=>{skill.funcs[0].fv2[3]=oldCost+2;}]]);
  const old=check(before,job).rows.find(row=>row.id===id);
  const now=check(next,job).rows.find(row=>row.id===id);
  assert.equal(old.count,oldCost);
  assert.equal(now.count,oldCost+2);
  assert.equal(now.itemId,65007);
  assert.equal(now.inventoryChecked,false);
  assert.equal(now.sourceOnly,true);
  assert.equal(now.finalDamage,undefined);
  const result=safety.compatibility(before,next);
  assert.equal(result.totals.verified,1,'data-only source quantity '+id);
  assert.equal(result.totals.needsReview,0);
  const replay=safety.replaySkills(before,next);
  assert.equal(replay.ok,true,'old source graph retained: '+id);
  assert.equal(replay.lost,0);
 }
 assert.equal(JSON.stringify(before),baseline);
});

test('level-50 Plant Mine upgrade is independent source-only material count',()=>{
 const old=check(before,'DISTURBANCE').rows.find(row=>row.id===variantParent);
 assert.ok(old?.level50Variant);
 assert.equal(old.level50Variant.itemCount,1);
 const next=updated([[variantId,skill=>{skill.funcs[0].fv2[3]=4;}]]);
 const now=check(next,'DISTURBANCE').rows.find(row=>row.id===variantParent);
 assert.equal(now.count,1,'ordinary plant mine cost unchanged');
 assert.equal(now.level50Variant.itemCount,4,'variant reads its own source');
 assert.equal(now.level50Variant.damageVerified,false);
 assert.equal(now.level50Variant.activationVerified,false);
 assert.equal(safety.compatibility(before,next).totals.verified,1);
 const replay=safety.replaySkills(before,next);
 assert.equal(replay.ok,true);
 assert.equal(replay.lost,0);
 assert.equal(check(next,'SNIPER').rows.find(row=>
  row.id===variantParent)?.level50Variant,undefined);
});

test('bulk selected changes to all five roots plus upgrade are modelled atomically',()=>{
 const changes=[...roots,variantId].map(id=>[id,skill=>{
  skill.funcs[0].fv2[3]+=3;
 }]);
 const after=updated(changes);
 const initial=JSON.stringify(before),candidate=JSON.stringify(after);
 const report=safety.compatibility(before,after);
 assert.equal(report.totals.verified,6);
 assert.equal(report.totals.needsReview,0);
 const replay=safety.replaySkills(before,after);
 assert.equal(replay.ok,true);
 assert.equal(replay.lost,0);
 assert.ok(replay.changedSkills>=6);
 assert.equal(JSON.stringify(before),initial);
 assert.equal(JSON.stringify(after),candidate);
});

test('unknown/new gameplay semantics and malformed trap material sources remain blocked',()=>{
 const id=240005001,job=owner(id);assert.ok(job);
 for(const fn of [
  s=>{s.funcs[0].fv2[3]=0;},
  s=>{s.funcs[0].fv2[3]=-1;},
  s=>{s.funcs[0].fv2[3]=2.5;},
  s=>{s.funcs[0].fv2[2]=2;},
  s=>{s.funcs[0].fv1[3]=65011;},
  s=>{s.funcs[0].dir='TARGET';},
  s=>{s.funcs[0].ep='EP_UNKNOWN_CONSUMPTION';},
  s=>{s.funcs[0].newSourceFlag=true;},
  s=>{s.funcs[1].fv1[3]=240001050;},
  s=>{s.funcs[0].fv2[3]+=1;s.cooldown+=1;},
  s=>{s.funcs.push(structuredClone(s.funcs[0]));}
 ]){
  const after=updated([[id,fn]]);
  assert.equal(safety.compatibility(before,after).totals.needsReview,1);
  const result=check(after,job);
  assert.equal(result.rows.some(x=>x.id===id),false);
  assert.ok(result.rejected.includes(id));
  const replay=safety.replaySkills(before,after);
  if(after.skills[id].cooldown!==before.skills[id].cooldown){
   // The cost inspector is still intact. Timing is an independent
   // unmodeled gameplay parameter and remains NEEDS REVIEW, not a
   // fabricated loss of the previously modeled material count.
   assert.equal(replay.ok,true,'existing source material proof still holds');
   continue;
  }
  assert.equal(replay.ok,false,'lost source evidence must block publication');
  assert.ok(replay.samples.some(x=>x.id===String(id)&&
   (x.module==='trap-material'||x.module==='source-execution-chain')));
 }
});

test('replacing the variant child action does not qualify as a data-only quantity',()=>{
 const next=updated([
  [variantId,skill=>{skill.funcs[0].fv2[3]=3;}],
  [240002051,skill=>{skill.funcs[0].fv1[0]+=1;}]
 ]);
 assert.equal(safety.compatibility(before,next).totals.needsReview,2);
 assert.equal(check(next,'DISTURBANCE').rows.find(x=>x.id===variantParent)
  .level50Variant,undefined);
 assert.equal(safety.replaySkills(before,next).ok,false);
});
