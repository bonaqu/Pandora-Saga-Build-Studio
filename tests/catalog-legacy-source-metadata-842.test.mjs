import test from 'node:test';
import assert from 'node:assert/strict';
import {readFileSync} from 'node:fs';
import vm from 'node:vm';
const read=x=>readFileSync(new URL('../'+x,import.meta.url),'utf8');
const host={};
for(const p of ['pandora-os-character-calculator.js',
 'pandora-studio-attribute-progression.js',
 'pandora-studio-skill-progression.js',
 'pandora-studio-catalog-safety.js'])vm.runInNewContext(read(p),{window:host});
const S=host.PandoraCatalogSafety;
const json=name=>JSON.parse(read('data/os/'+name+'.json'));
const before={skills:json('skills'),classes:json('classes'),
 tables:json('tables'),items:json('items'),
 maps:json('maps'),monsters:json('monsters')};
const edit=(id,fn)=>{
 const after={...before,skills:{...before.skills,
  [id]:structuredClone(before.skills[id])}};
 fn(after.skills[id]);return after;
};
test('bulk 571 source-only metadata changes preserve all four identical legacy edges',()=>{
 const original=JSON.stringify(before);
 const next={...before,skills:structuredClone(before.skills)};
 for(const skill of Object.values(next.skills))skill.mana+=1;
 const audit=S.compatibility(before,next),links=S.sourceGraphIntegrity(before,next);
 assert.equal(audit.entries.length,571);
 assert.equal(audit.totals.sourceOnly,571);
 assert.equal(links.historical,4);
 assert.equal(links.unresolved,4);
 assert.equal(links.newBroken,0);
 assert.equal(links.ok,true);
 // This is ONLY link integrity. The independent model replay must retain
 // the right to block stale numeric/source-only skill inspectors.
 const replay=S.replaySkills(before,next);
 assert.equal(replay.ok,false);
 assert.ok(replay.lost>0);
 assert.equal(JSON.stringify(before),original);
});
test('changed target, EP, requirements, access and unknown fields cannot borrow historic exception',()=>{
 const key='620002061';
 const changes=[
  s=>{s.funcs.find(f=>f.ep==='EP_SKILL_EXEC').fv1[3]=999999997;},
  s=>{s.funcs.find(f=>f.ep==='EP_SKILL_EXEC').ep='EP_FUTURE';},
  s=>{s.reqs.push({branch:'slash',amount:12});},
  s=>{s.classes.FUTURE_CLASS=1;},
  s=>{s.unrecognizedMechanic={scale:500};},
  s=>{s.mana=-1;},
  s=>{s.cooldown='3';}
 ];
 for(const fn of changes){
  const after=edit(key,s=>{s.mana+=1;fn(s);});
  const record=S.compatibility(before,after).entries[0];
  assert.equal(record.kind,'needsReview');
  const graph=S.sourceGraphIntegrity(before,after);
  assert.equal(graph.ok,false);
  assert.ok(graph.newBroken>0);
 }
});
test('text-only legacy edits remain harmless; source graph protects actual new zero IDs',()=>{
 const renamed=edit('620002061',s=>{s.desc+=' новая редакция';});
 assert.equal(S.sourceGraphIntegrity(before,renamed).ok,true);
 const invalid=edit('240005001',s=>{
  s.funcs.find(f=>f.ep==='EP_SKILL_EXEC').fv1[3]=0;
 });
 const graph=S.sourceGraphIntegrity(before,invalid);
 assert.equal(graph.ok,false);
 assert.ok(graph.newBroken>0);
});
