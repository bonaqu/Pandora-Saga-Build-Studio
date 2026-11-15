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
const before={skills:get('skills'),classes:get('classes'),tables:get('tables'),
 items:get('items')};
const updatedSkill=(id,change)=>{
 const after={...before,skills:{...before.skills}};
 after.skills[id]=structuredClone(before.skills[id]);
 change(after.skills[id]);
 return after;
};
const updatedItem=(id,change)=>{
 const after={...before,items:{...before.items}};
 after.items[id]=structuredClone(before.items[id]);
 change(after.items[id]);
 return after;
};
const jobFor=(id,method,extra={})=>
 Object.keys(before.classes).find(job=>{
  const caps=before.classes[job].branchCaps;
  const model=C[method]({skillCatalog:before.skills,jobKey:job,level:55,
   branchCaps:caps,branchMasteries:caps,...extra});
  const rows=Array.isArray(model?.rows)?model.rows:[
   ...(model?.help||[]),...(model?.magic||[]),
   ...(model?.stealth||[]),...(model?.other||[])];
  return rows.some(row=>row.id===id);
 });
const requireLost=(after,id,kind)=>{
 const report=S.replaySkills(before,after);
 assert.equal(report.ok,false,kind+' disappears before publication');
 assert.ok(report.lost>0,'a source-only quantity or confirmed link is lost');
 assert.ok(report.samples.some(row=>row.id===id&&row.module===kind),
  'show the exact missing proof for '+id+' ('+kind+')');
 return report;
};
test('all four signed crafting recipes adopt data-only quantities without a code release',()=>{
 const specs=[220002001,220003001,220004001,320010001];
 for(const id of specs){
  const job=jobFor(id,'craftingSkillPreview');
  assert.ok(job,id+' available in real source');
  const candidate=updatedSkill(id,row=>{row.funcs[0].fv2[3]+=1});
  const old=C.craftingSkillPreview({skillCatalog:before.skills,jobKey:job,
   level:55,branchCaps:before.classes[job].branchCaps,
   branchMasteries:before.classes[job].branchCaps}).rows.find(x=>x.id===id);
  const next=C.craftingSkillPreview({skillCatalog:candidate.skills,jobKey:job,
   level:55,branchCaps:before.classes[job].branchCaps,
   branchMasteries:before.classes[job].branchCaps}).rows.find(x=>x.id===id);
  assert.equal(next.uses[0].quantity,old.uses[0].quantity+1);
  assert.equal(S.compatibility(before,candidate).totals.verified,1);
  const replay=S.replaySkills(before,candidate);
  assert.ok(replay.changedSkills>=1);
  assert.equal(replay.ok,true,'known source amount retains the supported recipe');
  assert.equal(replay.lost,0);
 }
});
test('unknown recipe identifiers and invalid quantities still block pre-D1 source loss',()=>{
 const id=220002001;
 for(const mutate of [
  row=>{row.funcs[0].fv2[3]=0;},
  row=>{row.funcs[0].fv1[3]=50021;},
  row=>{row.funcs[0].dir='TARGET';},
  row=>{row.funcs[0].fv2[2]=17;}
 ]){
  const bad=updatedSkill(id,mutate);
  assert.equal(S.compatibility(before,bad).totals.needsReview,1);
  const result=S.replaySkills(before,bad);
  assert.equal(result.ok,false);
  assert.ok(result.samples.some(row=>row.id===String(id)&&
   (row.module==='source-recipe-ingredient'||row.module==='source-recipe-output')));
 }
});
test('source-only bow ammunition quantity is preserved until its signed contract changes',()=>{
 const id=213603002;
 assert.ok(jobFor(id,'rangedAmmoPreview',{weaponKind:'BOW'}));
 const after=updatedSkill(id,row=>{
  row.funcs.find(effect=>effect.ep==='EP_CONSUME_AMMO').fv2[3]+=1;
 });
 const report=requireLost(after,String(id),'source-ammunition');
 assert.equal(report.changedSkills>=1,true);
 assert.equal(S.compatibility(before,after).totals.needsReview,1);
});
test('resurrection material consumption is protected without promising the revival outcome',()=>{
 const id=310003001;
 const job=jobFor(id,'supportEffectPreview');
 assert.ok(job);
 const beforeRow=C.supportEffectPreview({skillCatalog:before.skills,
  jobKey:job,level:55,branchCaps:before.classes[job].branchCaps,
  branchMasteries:before.classes[job].branchCaps}).help.find(x=>x.id===id);
 assert.equal(beforeRow.requiredItemId,50059);
 assert.equal(beforeRow.requiredItemCount,3);
 const after=updatedSkill(id,row=>{
  row.funcs.find(effect=>effect.ep==='EP_CONSUME_ITEM').fv2[3]+=1;
 });
 requireLost(after,String(id),'source-support-material');
});
test('situational item consumption and special resources are source-only, fail-closed',()=>{
 for(const [id,kind] of [[220006001,'source-situational-material'],
  [100059001,'source-special-resource']]){
  const job=jobFor(id,'situationalSkillPreview');
  assert.ok(job,'source can show '+id);
  const after=updatedSkill(id,row=>{
   const ep=kind==='source-special-resource'?'EP_CONSUME_MOMENT':'EP_CONSUME_ITEM';
   const effect=row.funcs.find(x=>x.ep===ep);
   assert.ok(effect,ep+' in source '+id);
   effect.fv1[3]+=1;
  });
  requireLost(after,String(id),kind);
 }
});
test('changed classless linked cleansing skill protects miracle-potion source status',()=>{
 const item=50016,skill=300004002;
 const old=C.statusCurePreview({items:before.items,skills:before.skills});
 assert.ok(old.rows.some(row=>row.id===item&&
  row.conditions.includes('Один отрицательный эффект')));
 const after=updatedSkill(skill,row=>{
  const effect=row.funcs.find(x=>x.ep==='EP_REMOVE_BAD_EFFECT');
  assert.ok(effect);
  effect.ep='EP_UNKNOWN_NEW_MECHANIC';
 });
 const report=requireLost(after,'item:'+item,'source-item-cure');
 assert.ok(report.changedSkills>0);
 assert.ok(report.samples.some(row=>row.name===before.items[item].name));
});
test('changed potion-to-skill action is checked even if no skill record changed',()=>{
 const id=50016;
 const changed=updatedItem(id,row=>{
  const effect=row.effects.find(x=>x.func==='EP_SKILL_EXEC');
  assert.ok(effect);
  effect.a=987654321;
 });
 assert.equal(S.compatibility(before,changed).totals.needsReview,1);
 const report=requireLost(changed,'item:'+id,'source-item-skill');
 assert.equal(report.changedSkills,0);
 assert.ok(report.scenarios>0);
});
test('display labels do not trigger source replays or mutate the source snapshots',()=>{
 const textItem=updatedItem(50016,row=>{row.name='Новое название расходника'});
 const textSkill=updatedSkill(220002001,row=>{row.name='Новое название рецепта'});
 for(const after of [textItem,textSkill]){
  const original=JSON.stringify(before),candidate=JSON.stringify(after);
  const replay=S.replaySkills(before,after);
  assert.equal(replay.ok,true);
  assert.equal(replay.changedSkills,0);
  assert.equal(replay.lost,0);
  assert.equal(replay.scenarios,0);
  assert.equal(JSON.stringify(before),original);
  assert.equal(JSON.stringify(after),candidate);
 }
});
test('unknown effects remain in source-only review, never reclassified as supported final damage',()=>{
 const after=updatedSkill(213603002,row=>{
  row.funcs.push({ep:'EP_UNKNOWN_NEW_MECHANIC',dir:'TARGET',
   fv1:[0,0,0,42],fv2:[0,0,0,0]});
 });
 assert.equal(S.compatibility(before,after).totals.needsReview,1);
 const result=S.replaySkills(before,after);
 assert.equal(result.ok,false);
 assert.ok(result.samples.some(x=>x.module==='source-ammunition'));
 assert.equal(JSON.stringify(before.skills['213603002']).includes('UNKNOWN_NEW'),false);
});
