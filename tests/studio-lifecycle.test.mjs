import test from 'node:test';
import assert from 'node:assert/strict';
import {readFileSync} from 'node:fs';
const root=new URL('../',import.meta.url),read=p=>readFileSync(new URL(p,root),'utf8');
test('restoring builds synchronizes the race preview and branch group',()=>{
 const source=read('pandora-studio-app.js');
 assert.match(source,/function restoreLoadedBuildUI\(\)/);
 assert.match(source,/racePreviewIndex=selectedPortraitIndex\(state\.race,state\.gender\)/);
 assert.match(source,/const draft=structuredClone\(latest\.data\),base=fresh\(\)/);
 assert.match(source,/state=incoming;restoreLoadedBuildUI\(\)/);
});
test('inventory picker focuses search and restores slot focus',()=>{
 const source=read('pandora-studio-app.js');
 assert.match(source,/function closeStagePicker\(focusSlot=true\)/);
 assert.match(source,/renderStagePicker\(true\)/);
 assert.match(source,/if\(focusSearch\)search\.focus\(/);
 assert.match(source,/'aria-controls':'stagePicker'/);
});
test('automatic updates do not interrupt open editors',()=>{
 const updates=read('pandora-studio-update-manager.js');
 for(const s of ['#detailPanel.is-open','#stagePicker:not([hidden])','.inline-owner-editor'])
  assert.ok(updates.includes(s));
});
test('icon availability is derived from a real manifest',()=>{
 const html=read('index.html'),app=read('pandora-studio-app.js');
 assert.match(html,/id="iconStatus"/);
 assert.match(app,/data\.count\.present/);
 assert.match(app,/Изображения загружены/);
 assert.equal(JSON.parse(read('site-version.json')).release,JSON.parse(read('package.json')).pandoraRelease);
});

test('Hero Path group, expanded branch and its scroll position survive update reload',()=>{
 const js=read('pandora-studio-app.js'),html=read('index.html');
 for(const part of ['skillGroup:selectedSkillGroup','expandedBranch:inlineBranchId',
  "pathScroll:document.getElementById('skillBranches')?.scrollTop||0",
  'pathScrollRestored=false','target.scrollTop=restored',
  "$('skillBranches').addEventListener('scroll',saveView"])
 assert.ok(js.includes(part),part);
 assert.match(html,/id="pathGrowthPage"/);
});

test('skill gallery preserves scroll and focus after inspecting an icon',()=>{
 const ui=read('pandora-studio-hero-path.js'),app=read('pandora-studio-app.js');
 assert.match(ui,/const previousScroll=target\.querySelector\?\.\('\.path-skill-grid'\)\?\.scrollTop\|\|0/);
 assert.match(ui,/grid\.scrollTop=previousScroll/);
 assert.match(ui,/'data-skill-id':String\(skill\.id\)/);
 assert.match(app,/querySelector\('\[data-skill-id="/);
});
test('numeric legacy mastery keys get migrated alongside invested branch points',()=>{
 const app=read('pandora-studio-app.js');
 assert.match(app,/state\.mastery=Object\.fromEntries\(Object\.entries\(state\.mastery\)/);
 assert.match(app,/oldToOS\[key\]\|\|key,val/);
});

test('milestone link always reveals the selected skill despite stale gallery filters',()=>{
 const app=read('pandora-studio-app.js'),html=read('index.html');
 assert.match(app,/selectedSkill=skill;pathSkillFilter='all';pathSkillQuery=''/);
 assert.match(app,/\$\('pathSkillStatus'\)\.value='all'/);
 assert.match(app,/\$\('pathSkillSearch'\)\.value=''/);
 assert.match(html,/Доступные<\/option>/);
});

test('Soul query and selected-grade focus survive in-place equipment picker rerender',()=>{
 const app=read('pandora-studio-app.js');
 for(const phrase of ["soulQuery:stageSoulQuery",
  "onSoulQuery:value=>{stageSoulQuery=value;stageSoulScrollTop=0;saveView()}",
  "root.querySelector('[data-grade=\"'+n+'\"]')?.focus",
  "root.querySelector(restoreFocus)?.focus",
  "document.activeElement?.getAttribute?.('data-enchant-key')"])
  assert.ok(app.includes(phrase),phrase);
});

test('current D1 class caps guard skill spending and the archive requires explicit choice',()=>{
 const app=read('pandora-studio-app.js'),hero=read('pandora-studio-hero-path.js');
 assert.ok(app.includes("const base=archive?'./data/os':API+'/api/catalog'"));
 assert.ok(app.includes("catalogSource=data;gameTables=data.tables;gameItemForth=data.itemForth"));
 assert.ok(app.includes("if(!archive&&(snapshots.size!==1||unknown.length))"));
 assert.ok(app.includes("catalogArchived=archive"));
 assert.match(app,/branchCap\(catalog\.classes,jobKeys\[state\.job\],branch\)/);
 assert.match(hero,/api\.allocationReady/);
 for(const path of ['pandora-studio-equipment-ui.js','pandora-studio-hero-book.js'])
  assert.match(read(path),/\['disabled','checked','selected','hidden','required','readOnly','multiple'\]/);
});

test('class switch restores a permitted skill group and persists its user selection',()=>{
 const app=read('pandora-studio-app.js');
 assert.match(app,/if\(state\.job!==index\)/);
 assert.match(app,/pathGroupTouched=false;selectedSkill=null/);
 assert.match(app,/!pathGroupTouched&&catalog\.classes\?\.\[jobKeys\[state\.job\]\]/);
 assert.match(app,/ranked\[0\]\?\.total>0/);
});
