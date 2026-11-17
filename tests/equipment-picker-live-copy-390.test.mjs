import test from 'node:test';
import assert from 'node:assert/strict';
import {readFileSync} from 'node:fs';
const source=readFileSync(new URL('../pandora-studio-app.js',import.meta.url),'utf8');

test('all five dynamic equipment picker copy fragments have stable D1 keys',()=>{
 for(const key of ['pickerAvailableLabel','pickerAvailableAria','pickerMatchSuffix',
  'pickerShownSuffix','pickerMorePrefix']){
  assert.match(source,new RegExp("'equipment','"+'"+key+"'"),
   'missing ownerCopy binding '+key);
  assert.match(source,new RegExp("\\['"+key+"'"),
   'missing inline RU/EN editor '+key);
 }
 assert.match(source,/function bindOwnerInterfaceText\(/);
 assert.match(source,/function applyOwnerInterfaceEditedValue\(/);
 assert.match(source,/function ownerInterfaceEditor\(/);
});

test('counts and filter selection are runtime-only, never stored as D1 copy',()=>{
 assert.match(source,/matchedCount\.textContent=String\(matches\.length\)/);
 assert.match(source,/shownCount\.textContent=String\(Math\.min\(matches\.length,stageSlotShown\)\)/);
 assert.match(source,/moreCount\.textContent=String\(Math\.max\(0,matches\.length-stageSlotShown\)\)/);
 assert.doesNotMatch(source,/count\.textContent=lang==='en'\?/);
 assert.doesNotMatch(source,/more\.textContent=\(lang==='en'\?/);
 assert.match(source,/stagePickerOnlyAvailable=event\.target\.checked;stageSlotShown=48;draw\(\)/);
 assert.match(source,/const onlyAvailable=h\('label',\{class:'stage-picker-only-available'\}/);
 assert.match(source,/onlyAvailable\.hidden=!records\.some/);
});

test('English and Russian labels remain independently editable without identifiers',()=>{
 assert.match(source,/'pickerAvailableLabel',\s*'Доступные на моём уровне','Available at my level'/);
 assert.match(source,/'pickerAvailableAria',\s*'Только доступные на моём уровне','Only items available at my level','aria-label'/);
 assert.match(source,/'pickerMatchSuffix',\s*' подходящих',' matching'/);
 assert.match(source,/'pickerShownSuffix',\s*' показано',' shown'/);
 assert.match(source,/'pickerMorePrefix',\s*'Показать ещё \(','Show more \('/);
 const fragment=source.slice(source.indexOf(' const matchedCount=h('),
  source.indexOf(' const records=catalog.live',source.indexOf(' const matchedCount=h(')));
 assert.doesNotMatch(fragment,/record\.id|itemName\(rec\)|state\.level/);
});
