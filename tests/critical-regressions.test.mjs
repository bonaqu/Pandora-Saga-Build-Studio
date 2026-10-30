import test from 'node:test';
import assert from 'node:assert/strict';
import {readFileSync} from 'node:fs';
const root=new URL('../',import.meta.url),get=p=>readFileSync(new URL(p,root),'utf8');
test('item module never mistakes its DOM root for the global enchant model',()=>{
 const ui=get('stage-item-ui.js');
 assert.doesNotMatch(ui,/root\.PandoraEnchantModel/);
 assert.match(ui,/globalThis\.PandoraEnchantModel/);
 assert.match(ui,/const plan=globalThis\.PandoraEquipmentPlan/);
 assert.match(ui,/plan\.canRefine\(slot\)/);
});
test('no refinement for jewelry and cloak in model and action handlers',()=>{
 const plan=get('equipment-plan.js'),app=get('app.js');
 assert.match(plan,/new Set\(\['weapon','shield','head','body','gloves','legs','feet'\]\)/);
 assert.match(app,/if\(!plan\.canRefine\(key\)\)return/);
});
test('reload only restores wiki when active tab is wiki and hash is explicit',()=>{
 const app=get('app.js');
 assert.match(app,/history\.replaceState\(history.state/);
 assert.match(app,/navigationType==='reload'/);
 assert.match(app,/bootView.tab==='wiki'&&bootView.open===false/);
 assert.match(app,/if\(activeTab==='wiki'&&location.hash.startsWith\('#wiki\/'\)\)/);
});
test('repainting refinement preserves in-panel scroll position',()=>{
 const app=get('app.js');
 assert.match(app,/oldBodyScroll/);
 assert.match(app,/body\.scrollTop=oldBodyScroll/);
});
