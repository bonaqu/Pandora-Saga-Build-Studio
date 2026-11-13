import test from 'node:test';
import assert from 'node:assert/strict';
import {readFileSync} from 'node:fs';
import {auditOsSkillFormulaCoverage} from '../scripts/audit-os-skill-formulas.mjs';
const read=p=>readFileSync(new URL('../'+p,import.meta.url),'utf8');
const host={};Function('window',read('pandora-os-character-calculator.js'))(host);
const C=host.PandoraOSCalculator;
const skills=JSON.parse(read('data/os/skills.json'));
const classes=JSON.parse(read('data/os/classes.json'));
const english=JSON.parse(read('data/os/strings.en.json')).skills;
const magicIds=[
 [330061001,'Круг света','Holy Rays',[330061002]],
 [330081001,'Изгнание','Banish',[330081002]]
];
const magic=(job,level=55,catalog=skills)=>C.specializedSkillPreview({
 skillCatalog:catalog,jobKey:job,level,
 branchCaps:classes[job].branchCaps,branchMasteries:classes[job].branchCaps});
const songs=(job,level=55,catalog=skills)=>C.songSkillPreview({
 skillCatalog:catalog,jobKey:job,level,
 branchCaps:classes[job].branchCaps,branchMasteries:classes[job].branchCaps});
test('two official magic roots and separate Minstrel song identity are current OS records',()=>{
 for(const [id,ru,en,links] of magicIds){
  assert.equal(skills[id].name,ru);
  assert.equal(english[id].n,en);
  for(const link of links){
   assert.equal(skills[link]?.id,link);
   assert.equal(skills[link]?.learnable,false);
  }
 }
 assert.equal(skills[340001004]?.name,'Песнь поэта');
 assert.equal(english[340001004]?.n,"Minstrel's Song");
 assert.deepEqual(skills[340001004].funcs.map(x=>x.ep),
  ['EP_SKILL_EXEC_COUNT','EP_MOVESPEED_CONST','EP_TOGGLE','EP_STATE_CHANT']);
 assert.equal(skills[340001004].funcs[0].fv1[3],340001005);
 assert.equal(skills[340001005].funcs[0].fv1[3],340001006);
});
test('252 job/level checks put last three learnable sources in their existing sections',()=>{
 let n=0,shown=0;
 for(const job of Object.keys(classes))for(const level of [1,45,55]){
  const p=magic(job,level),songsOfJob=songs(job,level);
  for(const [id] of magicIds){
   n++;
   const s=skills[id],cap=classes[job].branchCaps;
   const expected=Boolean(s.classes?.[job])&&s.reqs.every(r=>cap[r.branch]>=r.amount);
   const row=p.magic.find(r=>r.id===id);
   assert.equal(Boolean(row),expected,'Magic '+id+'/'+job+'/'+level);
   if(row){
    shown++;
    assert.equal(row.finalAmount,null);
    assert.equal(row.sourceOnly,true);
    assert.equal(row.requirementsMet,level>=s.charLevel);
    assert.equal(row.mana,s.mana);
    assert.equal(row.cooldown,s.cooldown);
   }
  }
  n++;
  const song=songsOfJob.rows.find(r=>r.id===340001004);
  const expectedSong=Boolean(skills[340001004].classes?.[job])&&
   classes[job].branchCaps.hymn>=8;
  assert.equal(Boolean(song),expectedSong,'Song '+job+'/'+level);
  if(song){
   shown++;
   assert.equal(song.name,skills[340001004].name);
   assert.equal(song.nameEn,english[340001004].n);
   assert.equal(song.available,true);
   assert.equal(song.active,false);
   assert.equal(song.verified,false);
   assert.equal(song.sourceOnly,true);
   assert.ok(song.description.length>20&&song.descriptionEn.length>20);
  }
 }
 assert.equal(n,252);
 assert.ok(shown>15);
});
test('full FV1/FV2 proof rejects modified magic and both Minstrel child stages',()=>{
 for(const [id,ru,,linked] of magicIds){
  const j=Object.keys(classes).find(job=>skills[id].classes?.[job]&&
   skills[id].reqs.every(r=>classes[job].branchCaps[r.branch]>=r.amount));
  assert.ok(magic(j).magic.find(x=>x.id===id));
  const edits=[
   [id,x=>{x.mana+=1}],
   [id,x=>{x.funcs[0].fv1[3]+=1}],
   [id,x=>{x.funcs[0].fv2[0]+=1}],
   ...linked.map(child=>[child,x=>{x.funcs[0].fv1[3]+=1}]),
   ...linked.map(child=>[child,x=>{x.funcs[0].fv2[0]+=1}])
  ];
  for(const [target,fn] of edits){
   const changed=structuredClone(skills);fn(changed[target]);
   const result=magic(j,55,changed);
   assert.equal(result.magic.some(x=>x.id===id),false,ru+' changed '+target);
   assert.ok(result.rejected.includes(id));
  }
 }
 assert.ok(songs('CLERIC').rows.some(x=>x.id===340001004));
 for(const [target,fn] of [
  [340001004,x=>{x.funcs[0].fv2[3]+=1}],
  [340001004,x=>{x.funcs[1].fv1[2]+=1}],
  [340001005,x=>{x.funcs[0].fv1[3]+=1}],
  [340001006,x=>{x.funcs[0].fv1[3]+=1}],
  [340001006,x=>{x.funcs[1].fv2[0]+=1}]
 ]){
  const changed=structuredClone(skills);fn(changed[target]);
  assert.equal(songs('CLERIC',55,changed).rows.some(x=>x.id===340001004),
   false,'Song source mismatch '+target);
 }
});
test('remaining seven unmodeled skills have no eligible class in current OS caps',()=>{
 const report=auditOsSkillFormulaCoverage({skills,classes,calculator:C});
 assert.equal(report.summary.skillRecords,569);
 assert.deepEqual(report.summary.statuses,{
  'numeric-preview':73,'coefficient-model':27,'source-parameter':3,
  'qualitative-preview':94,'passive-source':29,
  'internal-or-triggered-source':336,'unmodeled-learnable':7
 });
 for(const [id] of magicIds)
  assert.equal(report.rows.find(x=>x.id===id).status,'qualitative-preview');
 assert.equal(report.rows.find(x=>x.id===340001004).status,'qualitative-preview');
 const unmodeled=report.rows.filter(r=>r.status==='unmodeled-learnable');
 assert.deepEqual(unmodeled.map(r=>r.id),[
  100056001,100057001,100101001,111201001,260006002,300001001,300002001
 ]);
 for(const item of unmodeled){
  const s=skills[item.id];
  assert.equal(Object.keys(classes).some(job=>s.classes?.[job]&&
   s.reqs.every(req=>classes[job].branchCaps[req.branch]>=req.amount)),false,
   'Current OS must not show this inaccessible root as learnable: '+item.id);
 }
});
