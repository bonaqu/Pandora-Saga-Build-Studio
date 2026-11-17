import test from 'node:test';
import assert from 'node:assert/strict';
import {readFileSync} from 'node:fs';

const read=name=>readFileSync(new URL('../'+name,import.meta.url),'utf8');

test('active build is highlighted independently from compare checkboxes',()=>{
 const app=read('pandora-studio-app.js');
 const css=read('pandora-studio-build-comparison.css');
 assert.match(app,/const isCurrent=b\.id===activeBuildId/);
 assert.match(app,/if\(isCurrent\)box\.setAttribute\('aria-current','true'\)/);
 assert.match(app,/Текущий билд/);
 assert.match(css,/\.build-grid>\.build-card\.is-current/);
 assert.match(css,/\.build-card-current-label/);
 assert.match(app,/compareIds\.includes\(b\.id\)/);
});

test('profession stage navigation supports revisiting prior and selected future stages',()=>{
 const app=read('pandora-studio-app.js'),css=read('pandora-studio-theme.css');
 assert.match(app,/const stageTargets=\[null,navigationPath\[0\]\?\.key\|\|null,navigationPath\[1\]\?\.key\|\|null\]/);
 assert.match(app,/attrs\.onclick=event=>/);
 assert.match(app,/if\(adminEditing&&adminToken&&event\.target\?\.closest\?\.\('\[data-origin-copy-key\]'\)\)return/);
 assert.match(app,/jobPathKey=stageTargets\[i\];renderJobs\(\);saveView\(\)/);
 assert.match(app,/const onChosenRoute=!path\.length\|\|path\.every/);
 assert.match(css,/\.class-wizard-step:is\(button\):focus-visible/);
 assert.doesNotMatch(app,/Специализация выбрана\. Можно вернуться/);
});

test('obvious origin and hero path tabs do not show duplicate hover guides',()=>{
 const app=read('pandora-studio-app.js'),locale=read('pandora-studio-ui-locale.js');
 for(const selector of ['[data-origin-tab="race"]','[data-origin-tab="class"]','[data-origin-tab="stats"]','#pathGrowthTab','#pathSkillsTab']){
  assert.ok(app.includes("'"+selector+"'"));
 }
 assert.match(app,/if\(SELF_EXPLANATORY_TABS\.has\(selector\)\)/);
 assert.match(app,/node\.removeAttribute\('aria-description'\)/);
 assert.match(locale,/Развитие — вложить очки\. Умения — посмотреть доступные умения\./);
});

test('item selection offers a forward arrow to properties without another tooltip',()=>{
 const app=read('pandora-studio-app.js'),gear=read('pandora-studio-equipment-ui.js');
 const css=read('pandora-studio-workbench-guidance.css');
 assert.match(gear,/returningToDetails=mode==='choose'&&key==='details'/);
 assert.match(gear,/button\.setAttribute\('aria-label',tr\('Перейти к свойствам'/);
 assert.match(gear,/actionIcon\(key,\{forward:returningToDetails\}\)/);
 assert.match(css,/return-to-properties :is\(\.stage-tab-symbol,\.stage-action-glyph\)/);
 assert.match(app,/PandoraStageItemUI\.actionIcon\('details',\{forward:true\}\)/);
 assert.match(css,/stage-picker-mode-link::before\{content:attr\(data-gear-action-icon\)/);
 assert.match(css,/transform:translateY\(-1px\)/);
 assert.doesNotMatch(app,/PandoraGuideTooltip\?\.attach\(detailsLink/);
});

test('save current and open overwrites the active saved build instead of adding a copy',()=>{
 const app=read('pandora-studio-app.js');
 assert.match(app,/if\(saveBuild\(state\.name\|\|'Новый герой',activeBuildId\)\)openSavedBuild\(b\)/);
 assert.doesNotMatch(app,/if\(saveBuild\(\)\)openSavedBuild\(b\)/);
});
