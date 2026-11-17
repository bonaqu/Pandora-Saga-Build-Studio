import test from 'node:test';
import assert from 'node:assert/strict';
import {readFileSync} from 'node:fs';
const read=p=>readFileSync(new URL('../'+p,import.meta.url),'utf8');
test('shared arrow-right SVG includes a visible right tip, not a clipped relative path',()=>{
 const ui=read('pandora-studio-equipment-ui.js');
 const icons=read('pandora-studio-icons.js');
 for(const source of [ui,icons]){
  assert.match(source,/M13 6l6 6-6 6/);
  assert.doesNotMatch(source,/m-6-6 6 6-6 6/);
 }
});
test('gear action opens the independent picker, grouped Properties/Souls are visually separated',()=>{
 const ui=read('pandora-studio-equipment-ui.js');
 const css=read('pandora-studio-workbench-guidance.css');
 const app=read('pandora-studio-app.js');
 assert.match(ui,/const chooseGroup=el\('div',\{class:'stage-rich-choose-group'\}\)/);
 assert.match(ui,/const settingsGroup=el\('div',\{class:'stage-rich-settings-group',role:'group'/);
 assert.match(ui,/key==='choose'\?chooseGroup:settingsGroup/);
 assert.match(css,/\.stage-rich-settings-group\{display:grid;grid-template-columns:repeat\(2/);
 assert.match(css,/\.stage-rich-settings-group>:not\(:first-child\)\{border-left:1px solid/);
 assert.match(css,/\.stage-rich-choose-group\{display:flex/);
 assert.match(app,/stage-picker-unequip-symbol/);
 assert.match(app,/PandoraStageItemUI\.actionIcon\('remove'\)/);
 assert.match(app,/pickerUnequip','Снять предмет','Unequip item/);
 assert.match(css,/\.stage-picker-foot \.stage-picker-unequip\{display:inline-flex/);
});
