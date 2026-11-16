import test from 'node:test';
import assert from 'node:assert/strict';
import {readFileSync} from 'node:fs';
import vm from 'node:vm';
const read=p=>readFileSync(new URL('../'+p,import.meta.url),'utf8');
const host={};
for(const p of ['pandora-os-character-calculator.js',
 'pandora-studio-attribute-progression.js','pandora-studio-skill-progression.js',
 'pandora-studio-catalog-safety.js'])vm.runInNewContext(read(p),{window:host});
const C=host.PandoraOSCalculator,S=host.PandoraCatalogSafety;
const json=p=>JSON.parse(read('data/os/'+p+'.json'));
const before={classes:json('classes'),tables:json('tables'),skills:json('skills'),
 items:json('items'),maps:json('maps'),monsters:json('monsters')};
const catalogs=before.skills,classes=before.classes;
const preview=(family,job,skillCatalog=catalogs)=>{
 const caps=classes[job].branchCaps;
 return C[family]({skillCatalog,jobKey:job,level:55,
  branchCaps:caps,branchMasteries:caps});
};
const grouped=(family)=>{
 const all=new Map();
 for(const [job] of Object.entries(classes)){
  const p=preview(family,job);
  for(const group of family==='specializedSkillPreview'?['defense','magic']:
   ['stealth','other']){
   for(const row of p[group])if(!all.has(row.id))
    all.set(row.id,{...row,job,group});
  }
 }
 return [...all.values()];
};
test('all current specialized and situational source-only rows keep mana and cooldown',()=>{
 for(const family of ['specializedSkillPreview','situationalSkillPreview']){
  const all=grouped(family);
  assert.ok(all.length>2,family+' must have source-backed rows');
  for(const row of all){
   const source=catalogs[String(row.id)];
   const after={...catalogs,[String(row.id)]:{
    ...source,mana:source.mana+1,cooldown:source.cooldown+0.5
   }};
   const next=preview(family,row.job,after)[row.group].find(x=>x.id===row.id);
   assert.ok(next,source.name+' source-only row was lost');
   assert.equal(next.mana,source.mana+1);
   assert.equal(next.cooldown,source.cooldown+0.5);
   assert.equal(next.sourceOnly,true);
   assert.equal(next.finalAmount,null);
   assert.equal(next.appliedToHero,false);
  }
 }
});
test('signed old/new variants preserve current game anti-silence and blade sources',()=>{
 const cases=[['440009001','specializedSkillPreview'],['440011001','specializedSkillPreview'],
  ['420005002','specializedSkillPreview']];
 for(const [id,family] of cases){
  const row=grouped(family).find(x=>String(x.id)===id);
  assert.ok(row,'verified current-game source version '+id);
  const value=catalogs[id];
  const next={...catalogs,[id]:{...value,mana:value.mana+1}};
  assert.ok(preview(family,row.job,next)[row.group].some(x=>String(x.id)===id));
 }
});
test('unsupported EP, FV, casting and range changes still reject source-only rows',()=>{
 for(const family of ['specializedSkillPreview','situationalSkillPreview']){
  const row=grouped(family).find(x=>catalogs[String(x.id)]?.funcs?.length);
  assert.ok(row);
  const old=catalogs[String(row.id)];
  for(const fn of [
   s=>{s.funcs[0].fv1[3]+=1;},s=>{s.cast+=1;},
   s=>{s.range+=50;},s=>{s.funcs[0].ep='EP_FUTURE_UNSUPPORTED';}
  ]){
   const x={...catalogs,[String(row.id)]:structuredClone(old)};
   fn(x[String(row.id)]);
   const result=preview(family,row.job,x);
   assert.equal(result[row.group].some(y=>y.id===row.id),false,
    family+' must not accept unrelated gameplay change');
   assert.ok(result.rejected.includes(row.id));
  }
 }
});
test('571 cost edits retain specialized/situational source but do not hide three song losses',()=>{
 const saved=JSON.stringify(before);
 const after={...before,skills:structuredClone(catalogs)};
 for(const skill of Object.values(after.skills))skill.mana++;
 const audit=S.compatibility(before,after),replay=S.replaySkills(before,after);
 assert.equal(audit.totals.sourceOnly,571);
 assert.equal(replay.lostEntries.length,replay.lost);
 for(const key of ['source-specialized-defense-magic','source-situational-action',
  'source-situational-material','source-special-resource'])
  assert.equal(replay.lostByModule[key]??0,0,key);
 assert.equal(replay.lost,3);
 assert.equal(replay.lostByModule['source-song-chain'],3);
 assert.equal(replay.ok,false,'remaining songs still block D1');
 assert.equal(JSON.stringify(before),saved);
});
