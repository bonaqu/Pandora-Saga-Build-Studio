import test from 'node:test';
import assert from 'node:assert/strict';
import vm from 'node:vm';
import {readFileSync} from 'node:fs';
const read=p=>readFileSync(new URL('../'+p,import.meta.url),'utf8');
test('new interface captions are valid D1 guide overrides with independent RU/EN',()=>{
 const window={},guide=read('pandora-studio-honor-guide.js');
 vm.runInNewContext(guide,{window});
 const valid=window.PandoraHonorGuide.validOverride;
 for(const key of [
  'book.equipment.soul-unavailable-zero.belt',
  'book.equipment.soul-unavailable-unknown.weapon',
  'book.wiki-ui.additional-source-chance',
  'book.wiki-ui.additional-location',
  'book.wiki-ui.additional-monster-loot'
 ]){
  assert.equal(valid(key,JSON.stringify({ru:'Новая подпись',en:'New caption'})),true,key);
  assert.equal(valid(key,JSON.stringify({ru:'Новая подпись',en:''})),false,
   'Reject invalid empty localized copy');
 }
 const values={
  'guideedit.book.equipment.soul-unavailable-zero.belt':JSON.stringify({
   ru:'Нет слотов у пояса',en:'No sockets on this belt'
  })
 };
 assert.equal(window.PandoraHonorGuide.field(values,
  'equipment.soul-unavailable-zero.belt','Исходная','Original').ru,'Нет слотов у пояса');
 assert.equal(window.PandoraHonorGuide.field(values,
  'equipment.soul-unavailable-zero.belt','Исходная','Original').en,'No sockets on this belt');
});
test('ordinary page has no pre-rendered owner entry and no technical editorial metadata',()=>{
 const html=read('index.html'),app=read('pandora-studio-app.js'),
  equipment=read('pandora-studio-equipment-ui.js');
 assert.doesNotMatch(html,/id="authState"/);
 assert.match(app,/const verifiedOwner=Boolean\(adminEditing&&adminToken\)/);
 assert.match(app,/if\(!verifiedOwner\)indicator\.remove\(\)/);
 assert.match(app,/classList\.toggle\('admin-edit',verifiedOwner\)/);
 assert.match(equipment,/if\(api\.canEdit\)\{\s*const pencil=el\('button'/);
 assert.match(equipment,/ownerCopy|copy\(key,ru,en\)/);
 assert.doesNotMatch(app,/Указано редактором · шанс не задан|Связь с добычей добавлена редактором/);
 assert.doesNotMatch(app,/Других редакторов этих значений здесь нет/);
 assert.match(app,/wikiSourceCopy\('additionalSourceChance'/);
 assert.match(app,/wikiSourceCopy\('additionalLocation'/);
 assert.match(app,/wikiSourceCopy\('additionalMonsterLoot'/);
});
