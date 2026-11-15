import test from 'node:test';
import assert from 'node:assert/strict';
import {readFileSync} from 'node:fs';
import {runInNewContext} from 'node:vm';
const catalog=JSON.parse(readFileSync(new URL('../data/os/skills.json',import.meta.url),'utf8'));
const root={};
runInNewContext(readFileSync(new URL('../pandora-studio-wiki-skill-insights.js',
 import.meta.url),'utf8'),{window:root});
const official=root.PandoraWikiSkillInsights.officialPatchNotes;
test('official November patch action notes require exact actual skills',()=>{
 for(const id of [320006001,340001001,340003001,340004001,440009001,
  440011001,420004002,420005002,420007101]){
  const notes=official(catalog[id],catalog);
  assert.equal(notes.length,1,'Skill '+id+' must have one patch note');
  assert.ok(notes[0].ru&&notes[0].en);
 }
});
test('source-shape changes suppress out-of-date factual mechanics notes',()=>{
 for(const id of [420004002,420005002,420007101]){
  const changed=structuredClone(catalog[id]);changed.cast=99;
  assert.deepEqual(Array.from(official(changed,catalog)),[]);
 }
 const changed=structuredClone(catalog[440009001]);
 changed.funcs[0].fv1[3]=0;
 assert.deepEqual(Array.from(official(changed,catalog)),[]);
});
test('unrelated skills never receive the patch-specific claims',()=>{
 assert.equal(official(catalog['100000501'],catalog).length,0);
 assert.equal(official({id:999,name:'Чума'},catalog).length,0);
});
