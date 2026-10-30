import test from 'node:test';
import assert from 'node:assert/strict';
import {readFileSync} from 'node:fs';
const root=new URL('../',import.meta.url),read=p=>readFileSync(new URL(p,root),'utf8');
test('restoring builds synchronizes the race preview and branch group',()=>{
 const source=read('app.js');
 assert.match(source,/function restoreLoadedBuildUI\(\)/);
 assert.match(source,/racePreviewIndex=selectedPortraitIndex\(state\.race,state\.gender\)/);
 assert.match(source,/const draft=structuredClone\(b\.data\),base=fresh\(\)/);
 assert.match(source,/state=incoming;restoreLoadedBuildUI\(\)/);
});
test('inventory picker focuses search and restores slot focus',()=>{
 const source=read('app.js');
 assert.match(source,/function closeStagePicker\(focusSlot=true\)/);
 assert.match(source,/renderStagePicker\(true\)/);
 assert.match(source,/if\(focusSearch\)search\.focus\(/);
 assert.match(source,/'aria-controls':'stagePicker'/);
});
test('automatic updates do not interrupt open editors',()=>{
 const updates=read('updates.js');
 for(const s of ['#detailPanel.is-open','#stagePicker:not([hidden])','.inline-owner-editor'])
  assert.ok(updates.includes(s));
});
test('icon availability is derived from a real manifest',()=>{
 const html=read('index.html'),app=read('app.js');
 assert.match(html,/id="iconStatus"/);
 assert.match(app,/data\.count\.present/);
 assert.match(app,/локальный архив пока не импортирован/);
 assert.equal(JSON.parse(read('site-version.json')).release,JSON.parse(read('package.json')).pandoraRelease);
});

test('Hero Path group, expanded branch and its scroll position survive update reload',()=>{
 const js=read('app.js'),html=read('index.html');
 for(const part of ['skillGroup:selectedSkillGroup','expandedBranch:inlineBranchId',
  "pathScroll:document.getElementById('skillBranches')?.scrollTop||0",
  'pathScrollRestored=false','target.scrollTop=restored',
  "$('skillBranches').addEventListener('scroll',saveView"])
 assert.ok(js.includes(part),part);
 assert.match(html,/id="pathGrowthPage"/);
});

test('skill gallery preserves scroll and focus after inspecting an icon',()=>{
 const ui=read('hero-path.js'),app=read('app.js');
 assert.match(ui,/const previousScroll=target\.querySelector\?\.\('\.path-skill-grid'\)\?\.scrollTop\|\|0/);
 assert.match(ui,/grid\.scrollTop=previousScroll/);
 assert.match(ui,/'data-skill-id':String\(skill\.id\)/);
 assert.match(app,/querySelector\('\[data-skill-id="/);
});
test('numeric legacy mastery keys get migrated alongside invested branch points',()=>{
 const app=read('app.js');
 assert.match(app,/state\.mastery=Object\.fromEntries\(Object\.entries\(state\.mastery\)/);
 assert.match(app,/oldToOS\[key\]\|\|key,val/);
});
