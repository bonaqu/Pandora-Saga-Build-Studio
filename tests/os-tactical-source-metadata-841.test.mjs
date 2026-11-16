import test from 'node:test';
import assert from 'node:assert/strict';
import {readFileSync} from 'node:fs';
import vm from 'node:vm';
const read=path=>readFileSync(new URL('../'+path,import.meta.url),'utf8');
const host={};
for(const path of ['pandora-os-character-calculator.js',
 'pandora-studio-attribute-progression.js','pandora-studio-skill-progression.js',
 'pandora-studio-catalog-safety.js'])
 vm.runInNewContext(read(path),{window:host});
const calc=host.PandoraOSCalculator,safety=host.PandoraCatalogSafety;
const json=path=>JSON.parse(read('data/os/'+path+'.json'));
const before={classes:json('classes'),tables:json('tables'),skills:json('skills')};
const IDs=[100000501,100001001,100002001,100002002,420006001,420006002];
const classOf=id=>Object.keys(before.classes).find(job=>{
 const skill=before.skills[String(id)],klass=before.classes[job];
 return Boolean(skill?.classes?.[job])&&skill.reqs.every(r=>
  klass.branchCaps[r.branch]>=r.amount);
});
const preview=(id,catalog=before.skills)=>{
 const job=classOf(id);
 assert.ok(job,'source has eligible class '+id);
 const caps=before.classes[job].branchCaps;
 return calc.tacticalSkillPreview({skillCatalog:catalog,jobKey:job,
  level:55,branchCaps:caps,branchMasteries:caps});
};
const find=(id,catalog)=>preview(id,catalog).rows.find(row=>row.id===id);
const change=(id,fn)=>{
 const skills={...before.skills,[String(id)]:structuredClone(before.skills[String(id)])};
 fn(skills[String(id)]);
 return {skills,after:{...before,skills}};
};
test('six current source tactical abilities preserve displayed mana and cooldown',()=>{
 assert.equal(IDs.length,6);
 for(const id of IDs){
  const old=find(id,before.skills);
  assert.ok(old,'baseline tactical source supported '+id);
  const {skills,after}=change(id,s=>{s.mana+=1;s.cooldown+=0.5;});
  const next=find(id,skills);
  assert.ok(next,'metadata edit must not silently remove '+id);
  assert.equal(next.mana,before.skills[String(id)].mana+1);
  assert.equal(next.cooldown,before.skills[String(id)].cooldown+0.5);
  assert.equal(next.sourceOnly,true);
  assert.equal(next.finalAmount,null);
  assert.equal(next.appliedToHero,false);
  const audit=safety.compatibility(before,after);
  assert.equal(audit.entries.length,1);
  assert.equal(audit.entries[0].kind,'sourceOnly');
  assert.equal(audit.entries[0].contract,'skill.source-parameters');
 }
});
test('two staged tactical chains survive parent metadata edits',()=>{
 for(const [parent,child] of [[100002001,100002002],[420006001,420006002]]){
  assert.ok(find(child,before.skills));
  const {skills}=change(parent,s=>{s.mana+=1;s.cooldown+=1;});
  assert.ok(find(child,skills),'parent metadata preserves child source identity');
 }
});
test('new timing or gameplay semantics do not inherit the metadata exemption',()=>{
 for(const id of IDs){
  const source=before.skills[String(id)];
  for(const fn of [s=>{s.cast+=1;},s=>{s.funcs[0].fv1[3]+=1;},
   s=>{s.range+=25;},s=>{s.reqs=[{branch:'future',amount:1}];}]){
   const {skills}=change(id,fn);
   assert.equal(find(id,skills),undefined,'reject semantic edit on '+id);
   assert.ok(preview(id,skills).rejected.includes(id));
  }
 }
});
test('unknown source changes remain review and final pre-D1 replay cannot be skipped',()=>{
 const {after}=change(100000501,s=>{
  s.funcs[0].ep='EP_FUTURE_UNKNOWN';
 });
 assert.equal(safety.compatibility(before,after).entries[0].kind,'needsReview');
 const wb=read('pandora-os-catalog-workbench.js');
 assert.match(wb,/if\(replay&&!replay\.ok\)throw Error/);
 assert.match(wb,/safety\.replaySkills\(baseline,combined\)/);
});
