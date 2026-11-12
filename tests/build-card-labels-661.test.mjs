import test from 'node:test';
import assert from 'node:assert/strict';
import vm from 'node:vm';
import {readFileSync} from 'node:fs';

const read=path=>readFileSync(new URL('../'+path,import.meta.url),'utf8');
const app=read('pandora-studio-app.js');
const src=read('pandora-studio-ui-locale.js');
const root={};
vm.runInNewContext(src,{window:root});
const locale=root.PandoraUILocale;

test('card action labels are four independent RU/EN D1 override fields',()=>{
 const cases=[
  ['libraryCardOpen','Открыть','Open'],
  ['libraryCardOverwrite','Перезаписать','Overwrite'],
  ['libraryCardShare','Поделиться','Share'],
  ['libraryCardDelete','Удалить','Delete']
 ];
 for(const [key,ru,en] of cases){
  assert.equal(locale.text(key,'ru'),ru);
  assert.equal(locale.text(key,'en'),en);
  assert.ok(locale.fieldKey(key)?.startsWith('ui.label.library-card-'));
  const overrideKey='guideedit.book.'+locale.fieldKey(key);
  locale.setOverrides({[overrideKey]:JSON.stringify({ru:'Текст кнопки',en:'New button text'})});
  assert.equal(locale.text(key,'ru'),'Текст кнопки');
  assert.equal(locale.text(key,'en'),'New button text');
 }
 locale.setOverrides({});
 const render=app.slice(app.indexOf('function renderBuilds(root){'),app.indexOf('function newId(){'));
 assert.match(render,/cardAction\('📂','libraryCardOpen','libraryHintOpen'/);
 assert.match(render,/cardAction\('↻','libraryCardOverwrite','libraryHintOverwrite'/);
 assert.match(render,/cardAction\('🔗','libraryCardShare','libraryHintShare'/);
 assert.match(render,/cardAction\('🗑','libraryCardDelete',b\.localOnly===true/);
 assert.match(render,/'data-build-action-label':labelKey/);
 assert.match(render,/text:libraryText\(labelKey\)/);
 assert.match(render,/window\.PandoraGuideTooltip\?\.attach\(button,libraryText\(hintKey\)/);
 assert.match(src,/parent\.dataset\?\.ownerCopyKey\|\|/);
 assert.match(src,/\.build-card-action-label/);
});

test('owner in-place label editor uses existing CAS path and live UI refresh without remount',()=>{
 const render=app.slice(app.indexOf('function renderBuilds(root){'),app.indexOf('function newId(){'));
 const labels=['libraryCardOpen','libraryCardOverwrite','libraryCardShare','libraryCardDelete'];
 for(const key of labels)assert.ok(render.includes("['"+key+"',"),key);
 assert.match(render,/'Кнопки и подсказки','Buttons and hints'/);
 assert.match(render,/'data-owner-copy-key':key,text:libraryText\(key\)/);
 assert.match(app,/return saveGuidePatch\('book\.'\+id,\{\[editLang\]:next\}\)/);
 assert.match(app,/if\(locale\.fieldKey\(key\)===id\)caption\.textContent=locale\.text\(key,lang\)/);
 assert.doesNotMatch(render.slice(render.indexOf('const cardAction='),render.indexOf('for(const b of builds)')),
  /'data-owner-copy-key':labelKey/,
  'Never put a user-admin pencil inside an interactive button');
});
