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
const calc=root.PandoraOSCalculator,safety=root.PandoraCatalogSafety;
const load=name=>JSON.parse(read('data/os/'+name+'.json'));
const before={skills:load('skills'),classes:load('classes'),tables:load('tables')};
function edit(id,change){
 const after={...before,skills:{...before.skills}};
 after.skills[id]=structuredClone(before.skills[id]);
 change(after.skills[id]);
 return after;
}
const assertLost=(after,rootId,module)=>{
 const result=safety.replaySkills(before,after);
 assert.equal(result.ok,false,'pre-publication replay must fail closed');
 assert.ok(result.changedSkills>=2,'classless child triggers its related root');
 assert.ok(result.lost>0,'a formerly modeled amount disappeared');
 assert.ok(result.samples.some(x=>x.id===String(rootId)&&x.module===module),
  'the exposed model is reported, not only the changed internal ID');
 return result;
};
test('classless Purify subskill invalidates the parent numeric immunity models',()=>{
 const parent=310014001,child=310014002;
 assert.equal(Object.keys(before.skills[child].classes).length,0);
 assert.equal(before.skills[child].prereq,null);
 const after=edit(child,r=>{r.funcs[1].fv1[3]+=1});
 assert.equal(safety.compatibility(before,after).totals.needsReview,1);
 assertLost(after,parent,'skill-effect-coefficient');
});
test('changing nonlearnable trap outcomes invalidates formerly supported material costs',()=>{
 for(const [parent,child] of [
  [240001001,240001050],[240002001,240002050],
  [240005001,240005002],[240008001,240008002],
  [240010001,240010003]
 ]){
  assert.equal(before.skills[child].learnable,false,String(child));
  const after=edit(child,r=>{
   const effect=r.funcs.find(x=>Array.isArray(x.fv1));
   effect.fv1[0]+=1;
  });
  assertLost(after,parent,'trap-material');
 }
});
test('level-50 Plant Mine variant is replayed through a classless effect and prereq',()=>{
 const child=240002051,parent=240002001;
 assert.equal(Object.keys(before.skills[child].classes).length,0);
 const caps=before.classes.DISTURBANCE.branchCaps;
 const old=calc.trapSkillCostPreview({skillCatalog:before.skills,
  jobKey:'DISTURBANCE',level:55,branchCaps:caps,branchMasteries:caps});
 assert.ok(old.rows.find(x=>x.id===parent)?.level50Variant);
 const after=edit(child,r=>{r.funcs[0].fv1[0]+=1});
 const now=calc.trapSkillCostPreview({skillCatalog:after.skills,
  jobKey:'DISTURBANCE',level:55,branchCaps:caps,branchMasteries:caps});
 assert.equal(now.rows.find(x=>x.id===parent)?.level50Variant,undefined);
 assertLost(after,parent,'trap-level-50');
});
test('internal execution records without changed source do not produce spurious work',()=>{
 const after=edit(310014002,r=>{r.name='Внутренний эффект — новое название'});
 const report=safety.compatibility(before,after);
 const replay=safety.replaySkills(before,after);
 assert.equal(report.totals.sourceOnly,1);
 assert.equal(replay.changedSkills,0);
 assert.equal(replay.scenarios,0);
 assert.equal(replay.lost,0);
});
test('normal changes to known coefficients keep previously supported amounts',()=>{
 const id=420004002;
 const after=edit(id,r=>{r.funcs[0].fv1[3]+=2});
 const report=safety.compatibility(before,after);
 const replay=safety.replaySkills(before,after);
 assert.equal(report.totals.verified,1);
 assert.equal(replay.ok,true);
 assert.equal(replay.lost,0);
 assert.ok(replay.previouslyModeled>0);
});
test('source-link preflight is deterministic and read-only across both catalogs',()=>{
 const after=edit(240010003,r=>{r.funcs[0].fv1[0]+=1});
 const baseline=JSON.stringify(before),candidate=JSON.stringify(after);
 const first=safety.replaySkills(before,after),second=safety.replaySkills(before,after);
 assert.equal(JSON.stringify(first),JSON.stringify(second));
 assert.equal(JSON.stringify(before),baseline);
 assert.equal(JSON.stringify(after),candidate);
});
