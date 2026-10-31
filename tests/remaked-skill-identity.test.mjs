import test from 'node:test';
import assert from 'node:assert/strict';
import {readFileSync} from 'node:fs';
const get=p=>readFileSync(new URL('../'+p,import.meta.url),'utf8');
const alignment=JSON.parse(get('data/localization/remaked-skill-identity.v1.json'));
const verified=JSON.parse(get('data/localization/legacy-approved.v1.json')).game.ru;
const source=JSON.parse(get('data/os/skills.json'));
test('205 original Remaked entries are identified by exact OS skill IDs',()=>{
 assert.equal(alignment.originalEntries,205);
 assert.equal(Object.keys(alignment.entries).length,205);
 assert.equal(alignment.distribution.sameBranch+alignment.distribution.branchShift+
  alignment.distribution.abbreviated,205);
 for(const [key,entry] of Object.entries(alignment.entries)){
  assert.equal(entry.ru,verified[key]);
  assert.ok(entry.osIds.length>0);
  for(const id of entry.osIds){
   assert.ok(source[id],String(id));
   assert.equal(alignment.skillLabelsById[id],entry.ru);
  }
 }
});
test('only confirmed five resistance abbreviations override current OS spelling',()=>{
 assert.equal(alignment.distribution.abbreviated,5);
 const ids=[410003001,410015001,410025001,430054001,440005501];
 for(const id of ids)assert.match(alignment.skillLabelsById[id],/^Сопр\./);
});
test('all ID-specific names render in RU while EN remains untouched',()=>{
 const app=get('app.js');
 assert.match(app,/approvedSkillIdNames=mapping\.skillLabelsById/);
 assert.match(app,/if\(lang==='ru'\)/);
 assert.match(app,/Object\.entries\(approvedSkillIdNames\|\|\{\}\)/);
 assert.match(app,/translate\(catalogSource\.skills,en\?\.skills\)/);
});
test('branch-shifted historical skills are explicitly audited, not silently discarded',()=>{
 assert.ok(alignment.distribution.branchShift>=1);
 assert.equal(alignment.entries['skill_entry.0.13'].ru,'Захват');
 assert.equal(alignment.entries['skill_entry.0.13'].expectedBranch,'martial');
 assert.ok(alignment.entries['skill_entry.0.13'].osBranches.includes('blow'));
});
