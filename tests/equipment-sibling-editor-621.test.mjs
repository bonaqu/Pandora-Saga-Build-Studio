import test from 'node:test';
import assert from 'node:assert/strict';
import {readFileSync} from 'node:fs';
import {runInNewContext} from 'node:vm';
const read=p=>readFileSync(new URL('../'+p,import.meta.url),'utf8');
const equipment=read('pandora-studio-equipment-ui.js');
const ownerCss=read('pandora-studio-owner-inline-ui.css');
const forgeCss=read('pandora-studio-forge-controls.css');
const path=read('pandora-studio-hero-path.js');

test('equipment tab, forge and soul editor pencils are real sibling buttons',()=>{
 assert.match(equipment,/const pencil=el\('button',\{type:'button',class:'stage-control-pencil'/);
 assert.match(equipment,/const wrapper=el\('span',\{class:'stage-action-edit-wrap'\}\)/);
 assert.match(equipment,/wrapper\.append\(button,pencil\)/);
 assert.match(equipment,/button\.replaceChildren\(\.\.\.\(prefix\?/);
 assert.doesNotMatch(equipment,/button\.append\(caption,pencil\)/);
 assert.doesNotMatch(equipment,/role:'button',tabindex:'0',\s*text:'✎'/);
 assert.match(equipment,/const wrapper=el\('div',\{class:'stage-rich-result-edit-wrap'\}\)/);
 assert.match(equipment,/list\.append\(wrapper\)/);
 assert.match(equipment,/attachPreview\(button,rec,icons,'soul'\)/);
 assert.match(ownerCss,/\.stage-rich-tabs \.stage-action-edit-wrap>\.stage-control-pencil/);
 assert.match(ownerCss,/\.stage-rich-body \.stage-enchant-options\.is-type-options>\.stage-action-edit-wrap/);
 assert.match(forgeCss,/\.stage-rich-body \.stage-enchant-options\.is-element-options>\.stage-action-edit-wrap:nth-child\(7\)/);
 assert.match(equipment,/pickerItemClose','Закрыть настройку','Close item settings'/);
 assert.match(equipment,/tr\('Слот: ','Slot: '\)/);
});
test('Hero Path skill count obeys Russian and English declensions',()=>{
 const root={};root.window=root;
 runInNewContext(path,root);
 const count=root.PandoraHeroPath.skillCountLabel;
 for(const [n,ru,en] of [[0,'0 умений','0 skills'],[1,'1 умение','1 skill'],
  [2,'2 умения','2 skills'],[4,'4 умения','4 skills'],[5,'5 умений','5 skills'],
  [11,'11 умений','11 skills'],[12,'12 умений','12 skills'],
  [21,'21 умение','21 skills'],[22,'22 умения','22 skills'],
  [25,'25 умений','25 skills'],[101,'101 умение','101 skills']]){
  assert.equal(count(n,'ru'),ru);
  assert.equal(count(n,'en'),en);
 }
 assert.match(path,/text:skillCountLabel\(rows\.length,api\.lang\)/);
});