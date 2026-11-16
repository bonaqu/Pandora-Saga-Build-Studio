import test from 'node:test';
import assert from 'node:assert/strict';
import {readFileSync} from 'node:fs';
import vm from 'node:vm';
const read=p=>readFileSync(new URL('../'+p,import.meta.url),'utf8');
const root={};
for(const p of ['pandora-os-character-calculator.js',
 'pandora-studio-attribute-progression.js','pandora-studio-skill-progression.js',
 'pandora-studio-catalog-safety.js'])vm.runInNewContext(read(p),{window:root});
const C=root.PandoraOSCalculator,S=root.PandoraCatalogSafety;
const load=p=>JSON.parse(read('data/os/'+p+'.json'));
const before={skills:load('skills'),classes:load('classes'),tables:load('tables'),
 items:load('items'),maps:load('maps'),monsters:load('monsters')};
const ids=['340001004','340001005','340001006'];
const preview=(skills,job)=>C.songSkillPreview({skillCatalog:skills,jobKey:job,level:55,
 branchCaps:before.classes[job].branchCaps,
 branchMasteries:before.classes[job].branchCaps}).rows.find(x=>x.id===340001004);
test('linked song metadata changes keep all three eligible classes',()=>{
 const changed={...before.skills};
 for(const id of ids)changed[id]={...before.skills[id],
  mana:before.skills[id].mana+1,cooldown:before.skills[id].cooldown+.5};
 for(const job of ['CLERIC','ENCHANTER','EXORCIST']){
  const row=preview(changed,job);
  assert.ok(preview(before.skills,job));
  assert.ok(row,job);
  assert.equal(row.sourceOnly,true);
  assert.equal(row.verified,false);
 }
});
test('unknown song effects and invalid metadata never inherit a source-only proof',()=>{
 for(const fn of [
  s=>{s['340001004'].funcs[0].fv1[3]++;},
  s=>{s['340001005'].funcs[0].ep='EP_UNKNOWN';},
  s=>{s['340001006'].funcs[0].fv1[3]++;},
  s=>{s['340001004'].reqs[0].amount++;},
  s=>{s['340001004'].mana='31';},
  s=>{s['340001006'].cooldown=-1;}
 ]){
  const next={...before.skills};
  for(const id of ids)next[id]=structuredClone(before.skills[id]);
  fn(next);
  assert.equal(preview(next,'CLERIC'),undefined);
 }
});
test('571 mana edits preserve every existing model and leave source immutable',()=>{
 const saved=JSON.stringify(before),next={...before,skills:structuredClone(before.skills)};
 for(const row of Object.values(next.skills))row.mana++;
 const audit=S.compatibility(before,next),replay=S.replaySkills(before,next);
 assert.equal(audit.totals.sourceOnly,571);
 assert.equal(replay.ok,true);
 assert.equal(replay.lost,0);
 assert.equal(replay.lostEntries.length,0);
 assert.equal(S.sourceGraphIntegrity(before,next).newBroken,0);
 assert.equal(JSON.stringify(before),saved);
});
test('unmodeled cast changes still invalidate the complete song chain',()=>{
 const next={...before,skills:structuredClone(before.skills)};
 for(const row of Object.values(next.skills))row.mana++;
 next.skills['340001004'].cast++;
 const replay=S.replaySkills(before,next);
 assert.equal(replay.ok,false);
 assert.equal(replay.lost,3);
 assert.equal(replay.lostByModule['source-song-chain'],3);
 assert.deepEqual(Array.from(replay.lostSkillIds),['340001004']);
});
