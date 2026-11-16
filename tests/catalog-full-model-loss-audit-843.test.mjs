import test from 'node:test';
import assert from 'node:assert/strict';
import {readFileSync} from 'node:fs';
import vm from 'node:vm';
const read=p=>readFileSync(new URL('../'+p,import.meta.url),'utf8');
const host={};
for(const p of ['pandora-os-character-calculator.js',
 'pandora-studio-attribute-progression.js','pandora-studio-skill-progression.js',
 'pandora-studio-catalog-safety.js'])
 vm.runInNewContext(read(p),{window:host});
const S=host.PandoraCatalogSafety,load=n=>JSON.parse(read('data/os/'+n+'.json'));
const before={skills:load('skills'),classes:load('classes'),
 tables:load('tables'),items:load('items'),maps:load('maps'),
 monsters:load('monsters')};
test('571-skill mass update reports EVERY lost model, with compact UI samples',()=>{
 const saved=JSON.stringify(before);
 const after={...before,skills:structuredClone(before.skills)};
 for(const skill of Object.values(after.skills))skill.mana++;
 // A newly altered cast rule must still invalidate the source-only song.
 after.skills['340001004'].cast++;
 const c=S.compatibility(before,after),replay=S.replaySkills(before,after);
 assert.equal(c.entries.length,571);
 assert.equal(c.totals.sourceOnly,571);
 assert.equal(replay.ok,false);
 assert.ok(replay.lost>0);
 assert.equal(replay.lostEntries.length,replay.lost);
 assert.equal(Object.values(replay.lostByModule).reduce((a,b)=>a+b,0),
  replay.lost);
 assert.equal(new Set(replay.lostSkillIds).size,replay.lostSkillIds.length);
 assert.deepEqual(Array.from(new Set(replay.lostEntries.map(x=>x.id))),
  Array.from(replay.lostSkillIds));
 assert.ok(replay.samples.length<=5);
 for(const row of replay.samples)
  assert.ok(replay.lostEntries.some(x=>
   x.id===row.id&&x.module===row.module&&x.detail===row.detail));
 assert.ok(replay.lostEntries.every(row=>row.id&&row.module&&row.name));
 assert.equal(JSON.stringify(before),saved);
});
test('no-change replay exposes complete empty diagnostic values',()=>{
 const report=S.replaySkills(before,before);
 assert.equal(report.ok,true);
 assert.equal(report.lost,0);
 assert.equal(report.lostEntries.length,0);
 assert.equal(report.lostSkillIds.length,0);
 assert.equal(Object.keys(report.lostByModule).length,0);
});
test('final confirmation still blocks model loss and lists the most affected groups',()=>{
 const wb=read('pandora-os-catalog-workbench.js');
 assert.match(wb,/if\(replay&&!replay\.ok\)throw Error/);
 assert.match(wb,/replay\?\.lostByModule/);
 assert.match(wb,/Основные разделы:/);
 assert.match(wb,/safety\.replaySkills\(baseline,combined\)/);
});
