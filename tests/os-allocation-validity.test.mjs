import test from 'node:test';
import assert from 'node:assert/strict';
import {readFileSync} from 'node:fs';
const read=p=>readFileSync(new URL('../'+p,import.meta.url),'utf8');
const app=read('pandora-studio-app.js'),tables=JSON.parse(read('data/os/tables.json'));
const items=Object.values(JSON.parse(read('data/os/items.json')));
const host={};Function('window',read('pandora-studio-attribute-progression.js'))(host);
const levels=host.PandoraAttributeProgression;
test('planned level 50 and 55 retain original Remaked attribute budgets',()=>{
 assert.equal(tables.levelCap,50,'source level cap 50 is independent of level 55 planning');
 assert.equal(levels.budget(45),432);
 assert.equal(levels.budget(50),504);
 assert.equal(levels.budget(55),544);
 assert.equal(levels.budget(56),null);
});
test('future armor remains in OS catalog with current source requirements',()=>{
 for(const [name,level,id] of [
  ['Крепкий шлем',51,11023],['Доспех тьмы',48,12073],['Штаны тени',48,13052]]){
  const entry=items.find(item=>item.id===id);
  assert.equal(entry.name,name);assert.equal(entry.level,level);
 }
 assert.equal(items.filter(item=>item.level>45).length,54,
  'level-50 jewelry remains future gear relative to level 45');
 assert.equal(items.filter(item=>item.level>50).length,22,
  'seven live jewelry requirements moved from 55 to 50');
 assert.equal(items.filter(item=>item.level===50).length,13,
  'the changed jewelry must stay in the current level-50 source band');
});
test('level 55 builds keep their allocation and calculated outputs, not server-45 clamp',()=>{
 assert.match(app,/!Number.isInteger\(original\.level\)\|\|original\.level<1\|\|original\.level>\(window\.PandoraLevelProgression\?\.maxLevel\(\)\?\?55\)/);
 assert.match(app,/function previewBaseStats\(snap=state\)\{/);
 assert.doesNotMatch(app,/if\(allocationIssue\(\)\?\.invalid\)return null/);
 assert.doesNotMatch(app,/function renderAllocationWarning\(/);
 assert.doesNotMatch(app,/levelCapNotice|allocationWarning/);
});
