import assert from 'node:assert/strict';
import {readFileSync} from 'node:fs';
import {test} from 'node:test';
const read=p=>readFileSync(new URL('../'+p,import.meta.url),'utf8');
test('shared build names are runtime-only and both actions explain their outcomes',()=>{
 const app=read('pandora-studio-app.js');
 assert.match(app,/class:'shared-current-name',text:currentName/);
 assert.match(app,/class:'shared-personal-name',text:incomingName/);
 assert.match(app,/class:'shared-build-replacement'/);
 assert.match(app,/verifyViewer\(\)\&\&saveBuild\(\)/);
 assert.match(app,/hintButton\(sharedText\('Открыть без сохранения'/);
 assert.doesNotMatch(app,/class:'shared-personal-name',\s*'data-owner-copy-key'/);
});
test('three onboarding steps and equipment tabs have bilingual help',()=>{
 const html=read('index.html'),locale=read('pandora-studio-ui-locale.js');
 const equipment=read('pandora-studio-equipment-ui.js');
 for(const key of ['originGuide','appearanceGuide','pathGuide']){
  assert.match(html,new RegExp('data-i18n="'+key+'"'));
  assert.match(locale,new RegExp(key+':\\['));
 }
 assert.match(equipment,/actionHelp=\{/);
 for(const id of ['choose','details','souls'])assert.match(equipment,new RegExp(id+':tr\\('));
 assert.match(equipment,/PandoraGuideTooltip\?\.attach\(button,actionHelp\[key\]/);
});
