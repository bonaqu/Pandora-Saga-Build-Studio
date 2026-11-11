import test from 'node:test';
import assert from 'node:assert/strict';
import {readFileSync} from 'node:fs';

const read=p=>readFileSync(new URL('../'+p,import.meta.url),'utf8');
const app=read('pandora-studio-app.js');
const css=read('pandora-studio-equipment-tooltip.css');

test('worn gear context actions reuse picker and one shared unequip lifecycle',()=>{
 assert.match(app,/function openStageGearMenu\(index,sourceSlot,event,anchor\)/);
 for(const action of ['properties','souls','replace','remove'])
  assert.match(app,new RegExp("'"+action+"'"));
 assert.match(app,/oncontextmenu:event=>\{\s*if\(!item\)return;event\.preventDefault\(\)/);
 assert.match(app,/openStageGearMenu\(i,sourceSlot,event,button\)/);
 assert.match(app,/function unequipStageEquipmentSlot\(index\)/);
 assert.match(app,/clearChangedEquipmentSouls\(state,previousEquipment\)/);
 assert.match(app,/unequipStageEquipmentSlot\(sourceSlot\)/);
 assert.match(app,/else unequipStageEquipmentSlot\(selectedSlot\)/);
 assert.match(app,/id==='replace'\?index:sourceSlot/);
 assert.match(app,/canManageSouls=Boolean\(record&&window\.PandoraEquipmentPlan\.canSocket/);
});
test('context menu is accessible, localized, and dismissible without touching empty slots',()=>{
 assert.match(app,/role:'menu'/);
 assert.match(app,/role:'menuitem'/);
 assert.match(app,/'aria-keyshortcuts':'Shift\+F10'/);
 assert.match(app,/event\.key==='ContextMenu'/);
 assert.match(app,/event\.key==='Escape'/);
 assert.match(app,/closeStageGearMenu\(true\)/);
 assert.match(app,/document\.addEventListener\('pointerdown'/);
 for(const id of ['properties','souls','replace','remove'])
  assert.match(app,new RegExp("equipmentCopy\\('context\\.'\\+id"));
 assert.match(app,/equipmentCopyLabel\(label,'context\.'\+id,ru,en\)/);
 assert.match(css,/\.stage-gear-context-menu\{/);
 assert.match(css,/position:fixed;z-index:550/);
 assert.match(css,/\.stage-gear-context-action:focus-visible/);
});
test('single-scenario browser debugging remains manual and does not replace PR suite',()=>{
 const script=read('tests/browser-smoke.mjs');
 const workflow=read('.github/workflows/browser-smoke.yml');
 assert.match(script,/'equipment-quick-menu',runEquipmentQuickMenuSmoke/);
 assert.match(script,/if\(only\)\{/);
 assert.match(script,/runIndependentSmokes\(found,browser,base,\{concurrency:1\}\)/);
 assert.match(workflow,/if \[\[ "\$GITHUB_EVENT_NAME" == 'workflow_dispatch'/);
 assert.match(workflow,/node tests\/browser-smoke\.mjs "--only=\$BROWSER_SCENARIO"/);
 assert.match(workflow,/elif \[\[ "\$\{\{ steps\.suite\.outputs\.mode \}\}" == 'quick'/);
 assert.match(workflow,/node tests\/browser-smoke\.mjs\s*$/m);
});
