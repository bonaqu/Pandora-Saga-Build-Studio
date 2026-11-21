import test from 'node:test';
import assert from 'node:assert/strict';
import {readFileSync} from 'node:fs';
import {runInNewContext} from 'node:vm';
const read=p=>readFileSync(new URL('../'+p,import.meta.url),'utf8');
const equipment=read('pandora-studio-equipment-ui.js');
const ownerCss=read('pandora-studio-owner-inline-ui.css');
const forgeCss=read('pandora-studio-forge-controls.css');
const path=read('pandora-studio-hero-path.js');

test('equipment captions are directly editable without extra controls or game-data mutation',()=>{
 assert.match(equipment,/api\.editLabel\?\.\(node,key,ru,en,options\)/);
 assert.match(equipment,/button\.replaceChildren\(\.\.\.\(prefix\?/);
 assert.match(equipment,/guardCaptionAction\(button,caption\)/);
 assert.match(equipment,/const titlePrefix=editable\(el\('span'/);
 assert.match(equipment,/row\.append\(editable\(notice,key,ru,en\)\)/);
 assert.match(equipment,/if\(paging\.parentNode===list\)list\.insertBefore\(row,paging\)/);
 assert.match(equipment,/attachPreview\(button,rec,icons,'soul'\)/);
 assert.doesNotMatch(equipment,/class:'stage-control-pencil'/);
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
 assert.match(path,/class:'path-skill-count-value'/);
 assert.match(path,/authored\(api,\.\.\.countCopy,'span','path-skill-count-caption'\)/);
});